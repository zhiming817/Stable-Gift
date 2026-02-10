use std::time::Duration;
use sea_orm::*;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tokio::time::sleep;
use rust_decimal::Decimal;
use tracing::{info, error, warn};
use futures::{SinkExt, StreamExt};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use url::Url;

use crate::config::NetworkConfig;
use crate::models::{envelopes, claims};

pub async fn start_indexer(db: DatabaseConnection, config: NetworkConfig) {
    let ws_url = config.ws_url.clone();
    let rpc_url = config.rpc_url.clone();
    let package_id = config.package_id.clone();
    let network = config.name.clone();

    info!("Starting Sui WebIndexer for package: {} on network: {}", package_id, network);

    tokio::spawn(async move {
        loop {
            info!("Connecting to WebSocket: {}", ws_url);
            match connect_and_subscribe(&ws_url, &rpc_url, &package_id, &db, &network).await {
                Ok(_) => {
                    warn!("WebSocket connection closed gracefully, reconnecting in 5s...");
                }
                Err(e) => {
                    error!("WebSocket error: {:?}, fees reconnecting in 5s...", e);
                }
            }
            sleep(Duration::from_secs(5)).await;
        }
    });
}

async fn connect_and_subscribe(ws_url: &str, rpc_url: &str, package_id: &str, db: &DatabaseConnection, network: &str) -> anyhow::Result<()> {
    let url = Url::parse(ws_url)?;
    let (ws_stream, _) = connect_async(url).await?;
    let (mut write, mut read) = ws_stream.split();

    info!("WebSocket connected");

    // Subscribe to all events from the module
    let subscribe_request = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "suix_subscribeEvent",
        "params": [
            { "MoveModule": { "package": package_id, "module": "sui_red_envelope" } }
        ]
    });

    write.send(Message::Text(subscribe_request.to_string())).await?;

    while let Some(msg) = read.next().await {
        let msg = msg?;
        if let Message::Text(text) = msg {
            // Handle keep-alive or generic responses
            // info!("Received msg: {}", text); 

            let json: serde_json::Value = serde_json::from_str(&text)?;
            
            // Check if it is a notification
            if let Some(method) = json.get("method") {
                if method == "suix_subscribeEvent" {
                    if let Some(params) = json.get("params") {
                        if let Some(result) = params.get("result") {
                            // Parse Event
                            match serde_json::from_value::<SuiEvent>(result.clone()) {
                                Ok(event) => {
                                    handle_event(db, network, event, rpc_url).await;
                                }
                                Err(e) => {
                                    error!("Failed to parse event: {:?}. JSON: {}", e, result);
                                }
                            }
                        }
                    }
                }
            } else if let Some(error) = json.get("error") {
                error!("Subscription error response: {:?}", error);
            } else if let Some(result) = json.get("result") {
                info!("Subscription confirmed, ID: {}", result);
            }
        }
    }
    
    Ok(())
}

async fn handle_event(db: &DatabaseConnection, network: &str, event: SuiEvent, rpc_url: &str) {
    if event.type_.contains("::EnvelopeCreated") {
        info!("Processing EnvelopeCreated: {}", event.id.tx_digest);
        process_created_event(db, network, event, rpc_url).await;
    } else if event.type_.contains("::EnvelopeClaimed") {
        info!("Processing EnvelopeClaimed: {}", event.id.tx_digest);
        process_claimed_event(db, network, event).await;
    }
}


#[derive(Debug, Deserialize, Serialize, Clone)]
struct SuiEventCursor {
    #[serde(rename = "txDigest")]
    tx_digest: String,
    #[serde(rename = "eventSeq")]
    event_seq: String,
}

#[derive(Debug, Deserialize)]
struct SuiEvent {
    id: SuiEventId, 
    #[serde(rename = "timestampMs")]
    timestamp_ms: Option<String>,
    #[serde(rename = "parsedJson")]
    parsed_json: serde_json::Value,
    #[serde(rename = "type")]
    type_: String,
}

#[derive(Debug, Deserialize)]
struct SuiEventId {
    #[serde(rename = "txDigest")]
    tx_digest: String,
    // seq unused
}

async fn fetch_coin_type(rpc_url: &str, object_id: &str) -> String {
    let client = reqwest::Client::new();
    let query = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sui_getObject",
        "params": [
            object_id,
            { "showType": true }
        ]
    });

    match client.post(rpc_url).json(&query).send().await {
        Ok(res) => {
            if let Ok(json) = res.json::<serde_json::Value>().await {
                let type_str = json["result"]["data"]["type"].as_str()
                    .or_else(|| json["result"]["type"].as_str());

                if let Some(t) = type_str {
                    // Use a more robust regex or loop to find the inner type
                    // e.g. "0x...::RedEnvelope<0x...::SUI>" -> "0x...::SUI"
                    // Find the first '<' and the last '>'
                    if let (Some(start), Some(end)) = (t.find('<'), t.rfind('>')) {
                        return t[start + 1..end].to_string();
                    }
                }
            }
        }
        Err(e) => error!("RPC call failed: {:?}", e),
    }
    "Unknown".to_string()
}

async fn process_created_event(db: &DatabaseConnection, network: &str, event: SuiEvent, rpc_url: &str) {
    use crate::models::envelopes::ActiveModel;
    
    let json = &event.parsed_json;
    // Fields: id, owner, amount, count, mode
    let id_str = json["id"].as_str().unwrap_or_default();
    let owner = json["owner"].as_str().unwrap_or_default();
    let amount_str = json["amount"].as_str().unwrap_or("0");
    let count_u64 = json["count"].as_str().unwrap_or("0").parse::<i64>().unwrap_or(0);
    // mode could be integer or string depending on SDK? Usually integer for u8
    let mode_val = &json["mode"];
    let mode_u8 = if let Some(s) = mode_val.as_str() {
        s.parse::<i16>().unwrap_or(0)
    } else {
        mode_val.as_u64().unwrap_or(0) as i16
    };

    let requires_verification = json["requires_verification"].as_bool().unwrap_or(false);

    let ts = event.timestamp_ms.as_deref().unwrap_or("0").parse::<i64>().unwrap_or(0);

    // Convert timestamp
    let created_at = chrono::DateTime::from_timestamp_millis(ts)
        .map(|dt| dt.naive_utc())
        .unwrap_or_default();

    let amount_dec = Decimal::from_str_exact(amount_str).unwrap_or_default();

    // extract Generic T from type string
    // e.g. 0x...::mod::EnvelopeCreated<0x...::sui::SUI>
    let mut coin_type = event.type_.split('<').nth(1).map(|s| s.trim_end_matches('>')).unwrap_or("Unknown").to_string();

    if coin_type == "Unknown" {
        info!("Coin type unknown from event, fetching object {} from RPC...", id_str);
        // Note: Object might not be immediately available if we are VERY fast (indexer lag), but usually ok.
        let fetched = fetch_coin_type(rpc_url, id_str).await;
        if fetched != "Unknown" {
             coin_type = fetched;
             info!("Resolved coin type: {}", coin_type);
        }
    }

    let model = ActiveModel {
        envelope_id: Set(id_str.to_string()),
        network: Set(network.to_string()),
        owner: Set(owner.to_string()),
        coin_type: Set(coin_type),
        total_amount: Set(amount_dec),
        total_count: Set(count_u64),
        mode: Set(mode_u8),
        remaining_count: Set(count_u64), // Initially full
        is_active: Set(true),
        requires_verification: Set(requires_verification),
        created_at: Set(created_at),
        tx_digest: Set(event.id.tx_digest),
    };

    if let Err(e) = envelopes::Entity::insert(model).exec(db).await {
        // Ignore dupe errors
        if !e.to_string().contains("Duplicate entry") {
            error!("Failed to insert envelope: {:?}", e);
        } else {
            warn!("Envelope {} already exists", id_str);
        }
    }
}

async fn process_claimed_event(db: &DatabaseConnection, network: &str, event: SuiEvent) {
    use crate::models::claims::ActiveModel as ClaimActiveModel;
    
    let json = &event.parsed_json;
    // Fields: id, claimer, amount
    let env_id = json["id"].as_str().unwrap_or_default();
    let claimer = json["claimer"].as_str().unwrap_or_default();
    let amount_str = json["amount"].as_str().unwrap_or("0");
    let ts = event.timestamp_ms.as_deref().unwrap_or("0").parse::<i64>().unwrap_or(0);
    let claimed_at = chrono::DateTime::from_timestamp_millis(ts)
        .map(|dt| dt.naive_utc())
        .unwrap_or_default();
    
    let amount_dec = Decimal::from_str_exact(amount_str).unwrap_or_default();

    let claim = ClaimActiveModel {
        claim_id: NotSet, // Auto incr
        envelope_id: Set(env_id.to_string()),
        network: Set(network.to_string()),
        claimer: Set(claimer.to_string()),
        amount: Set(amount_dec),
        claimed_at: Set(claimed_at),
        tx_digest: Set(event.id.tx_digest.clone()),
    };

    match claims::Entity::insert(claim).exec(db).await {
        Ok(_) => {
            if let Err(e) = update_envelope_decrement(db, env_id, network).await {
                error!("Failed to decrement envelope count: {:?}", e);
            }
        }
        Err(e) => {
            if !e.to_string().contains("Duplicate entry") {
               error!("Failed to insert claim: {:?}", e);
            } else {
                warn!("Claim for env {} by {} already processed", env_id, claimer);
            }
        }
    }
}

async fn update_envelope_decrement(db: &DatabaseConnection, env_id: &str, network: &str) -> Result<(), DbErr> {
    // 1. Fetch current
    // 2. Decrement
    // 3. Update
    // Note: This is racy without a proper transaction or atomic update logic, 
    // but acceptable for this demo.
    
    // Using an update statement is safer for concurrency than read-modify-write in app
    // UPDATE envelopes SET remaining_count = remaining_count - 1 WHERE envelope_id = ... AND network = ...
    
    // SeaORM approach with Exec
    let stmt = Statement::from_sql_and_values(
        db.get_database_backend(),
        r#"UPDATE envelopes SET remaining_count = remaining_count - 1 WHERE envelope_id = ? AND network = ? AND remaining_count > 0"#,
        vec![env_id.into(), network.into()],
    );
    
    let res = db.execute(stmt).await?;
    if res.rows_affected() == 0 {
        // Could be already 0 or not found
        warn!("Decrement failed or no rows affected for env: {}", env_id);
    } else {
        info!("Decremented count for env: {}", env_id);
    }

    Ok(())
}

