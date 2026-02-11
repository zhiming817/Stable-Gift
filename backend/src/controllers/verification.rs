use axum::{
    extract::{State},
    Json,
    http::StatusCode,
};
use sea_orm::*;
use serde::{Deserialize, Serialize};
use ed25519_dalek::{SigningKey, Signer};
use std::env;
use hex;
use crate::AppState;
use crate::models::discord_users;
use chrono::Utc;

#[derive(Deserialize)]
pub struct VerificationRequest {
    pub envelope_id: String,
    pub network: String,
    pub claimer_address: String,
    pub discord_token: String,
}

#[derive(Serialize)]
pub struct VerificationResponse {
    pub signature: String,
}

#[derive(Serialize)]
pub struct JsonError {
    pub message: String,
}

fn error_json(status: StatusCode, msg: &str) -> (StatusCode, Json<JsonError>) {
    (status, Json(JsonError { message: msg.to_string() }))
}

pub async fn verify_discord(
    State(state): State<AppState>,
    Json(payload): Json<VerificationRequest>,
) -> Result<Json<VerificationResponse>, (StatusCode, Json<JsonError>)> {
    let client = reqwest::Client::new();
    
    // 1. Get Discord User ID
    let user_res = client
        .get("https://discord.com/api/users/@me")
        .header("Authorization", format!("Bearer {}", payload.discord_token))
        .send()
        .await
        .map_err(|_| error_json(StatusCode::UNAUTHORIZED, "Failed to connect to Discord"))?;

    if !user_res.status().is_success() {
        return Err(error_json(StatusCode::UNAUTHORIZED, "Invalid Discord token"));
    }

    let user_data: serde_json::Value = user_res
        .json()
        .await
        .map_err(|_| error_json(StatusCode::INTERNAL_SERVER_ERROR, "Failed to parse Discord user profile"))?;

    let discord_user_id = user_data["id"].as_str()
        .ok_or_else(|| error_json(StatusCode::INTERNAL_SERVER_ERROR, "Discord ID not found in profile"))?
        .to_string();

    // 2. Check if this Discord account already claimed this envelope
    let existing = discord_users::Entity::find()
        .filter(discord_users::Column::EnvelopeId.eq(&payload.envelope_id))
        .filter(discord_users::Column::Network.eq(&payload.network))
        .filter(discord_users::Column::DiscordUserId.eq(&discord_user_id))
        .one(&state.db)
        .await
        .map_err(|e| error_json(StatusCode::INTERNAL_SERVER_ERROR, &format!("DB Error: {}", e)))?;

    if existing.is_some() {
        return Err(error_json(StatusCode::FORBIDDEN, "This Discord account has already claimed this gift"));
    }

    // 3. Verify Guild Membership
    let discord_res = client
        .get("https://discord.com/api/users/@me/guilds")
        .header("Authorization", format!("Bearer {}", payload.discord_token))
        .send()
        .await
        .map_err(|_| error_json(StatusCode::UNAUTHORIZED, "Failed to connect to Discord"))?;

    if !discord_res.status().is_success() {
        return Err(error_json(StatusCode::UNAUTHORIZED, "Failed to fetch guilds"));
    }

    let guilds: Vec<serde_json::Value> = discord_res
        .json()
        .await
        .map_err(|_| error_json(StatusCode::INTERNAL_SERVER_ERROR, "Failed to parse Discord response"))?;

    let target_guild_id = env::var("DISCORD_GUILD_ID").unwrap_or_default();
    let is_member = guilds.iter().any(|g| g["id"].as_str() == Some(&target_guild_id));

    if !is_member && !target_guild_id.is_empty() {
        return Err(error_json(StatusCode::FORBIDDEN, "You must join the Discord server first"));
    }

    // 4. Record the attempt in database
    let new_user_record = discord_users::ActiveModel {
        envelope_id: Set(payload.envelope_id.clone()),
        network: Set(payload.network.clone()),
        discord_user_id: Set(discord_user_id),
        claimer_address: Set(payload.claimer_address.clone()),
        claimed_at: Set(Utc::now().naive_utc()),
        ..Default::default()
    };

    new_user_record.insert(&state.db).await
        .map_err(|e| error_json(StatusCode::INTERNAL_SERVER_ERROR, &format!("Failed to record claim: {}", e)))?;

    // 5. Generate Signature
    // Message = EnvelopeID (32 bytes) + Claimer Address (32 bytes)
    let mut msg = hex::decode(payload.envelope_id.trim_start_matches("0x"))
        .map_err(|_| error_json(StatusCode::BAD_REQUEST, "Invalid envelope ID"))?;
    let mut addr_bytes = hex::decode(payload.claimer_address.trim_start_matches("0x"))
        .map_err(|_| error_json(StatusCode::BAD_REQUEST, "Invalid claimer address"))?;
    
    msg.append(&mut addr_bytes);

    let secret = env::var("SIGNING_KEY_HEX").expect("SIGNING_KEY_HEX must be set");
    let secret_bytes = hex::decode(secret).expect("Invalid SIGNING_KEY_HEX");
    let signing_key = SigningKey::from_bytes(secret_bytes.as_slice().try_into().expect("Key must be 32 bytes"));
    
    let signature = signing_key.sign(&msg);
    
    Ok(Json(VerificationResponse {
        signature: hex::encode(signature.to_bytes()),
    }))
}
