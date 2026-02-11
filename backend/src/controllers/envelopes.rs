use axum::{
    extract::{Path, Query, State},
    Json,
    http::StatusCode,
};
use sea_orm::*;
use serde::{Deserialize, Serialize};
use serde_json::json;
use crate::AppState;
use crate::models::{envelopes, claims};
use crate::services::sui_indexer;

#[derive(Deserialize)]
pub struct GeneralQuery {
    pub address: Option<String>,
    pub network: Option<String>,
}

#[derive(Serialize)]
pub struct EnvelopeWithClaim {
    pub envelope: envelopes::Model,
    pub claim: claims::Model,
}

#[derive(Serialize)]
pub struct EnvelopeDetail {
    pub envelope: envelopes::Model,
    pub claims: Vec<claims::Model>,
}

pub async fn list_created(
    State(state): State<AppState>,
    Query(query): Query<GeneralQuery>,
) -> Result<Json<Vec<envelopes::Model>>, (StatusCode, String)> {
    let mut find = envelopes::Entity::find();
    
    if let Some(address) = query.address {
        find = find.filter(envelopes::Column::Owner.eq(address.to_lowercase()));
    }
    
    if let Some(network) = query.network {
        find = find.filter(envelopes::Column::Network.eq(network));
    }

    let envelopes = find
        .order_by_desc(envelopes::Column::CreatedAt)
        .all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(envelopes))
}

pub async fn list_active(
    State(state): State<AppState>,
    Query(query): Query<GeneralQuery>,
) -> Result<Json<Vec<envelopes::Model>>, (StatusCode, String)> {
    let mut find = envelopes::Entity::find()
        .filter(envelopes::Column::RemainingCount.gt(0))
        .filter(envelopes::Column::IsActive.eq(true));
    
    if let Some(network) = query.network {
        find = find.filter(envelopes::Column::Network.eq(network));
    }

    let envelopes = find
        .order_by_desc(envelopes::Column::CreatedAt)
        .all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(envelopes))
}

pub async fn list_claimed(
    State(state): State<AppState>,
    Query(query): Query<GeneralQuery>,
) -> Result<Json<Vec<EnvelopeWithClaim>>, (StatusCode, String)> {
    let mut find = envelopes::Entity::find()
        .find_also_related(claims::Entity);
    
    if let Some(address) = query.address {
        find = find.filter(claims::Column::Claimer.eq(address.to_lowercase()));
    }
    
    if let Some(network) = query.network {
        find = find.filter(envelopes::Column::Network.eq(network));
    }

    let claimed = find
        .order_by_desc(claims::Column::ClaimedAt)
        .all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let result = claimed.into_iter()
        .filter_map(|(env, claim)| claim.map(|c| EnvelopeWithClaim { envelope: env, claim: c }))
        .collect();

    Ok(Json(result))
}

pub async fn get_details(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(query): Query<GeneralQuery>,
) -> Result<Json<EnvelopeDetail>, (StatusCode, String)> {
    let mut find = envelopes::Entity::find()
        .filter(envelopes::Column::EnvelopeId.eq(id.clone()));
    
    if let Some(ref network) = query.network {
        find = find.filter(envelopes::Column::Network.eq(network));
    }

    let envelope = find
        .one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Envelope not found".to_string()))?;

    let mut find_claims = claims::Entity::find()
        .filter(claims::Column::EnvelopeId.eq(id));
    
    if let Some(ref network) = query.network {
        find_claims = find_claims.filter(claims::Column::Network.eq(network));
    }

    let claims = find_claims
        .order_by_desc(claims::Column::ClaimedAt)
        .all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(EnvelopeDetail {
        envelope,
        claims,
    }))
}

pub async fn sync_envelope(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(query): Query<GeneralQuery>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let network = query.network.unwrap_or_else(|| "testnet".to_string());
    
    // Find RPC URL for the network
    let network_conf = state.config.networks.iter()
        .find(|n| n.name == network)
        .ok_or((StatusCode::BAD_REQUEST, format!("Network {} not configured", network)))?;

    sui_indexer::sync_envelope_by_id(&state.db, &network, &network_conf.rpc_url, &id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(json!({ "status": "success", "message": "Envelope synced" })))
}
