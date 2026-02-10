use axum::{
    extract::{Path, Query, State},
    Json,
    http::StatusCode,
};
use sea_orm::*;
use serde::{Deserialize, Serialize};
use crate::models::{envelopes, claims};

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
    State(db): State<DatabaseConnection>,
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
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(envelopes))
}

pub async fn list_active(
    State(db): State<DatabaseConnection>,
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
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(envelopes))
}

pub async fn list_claimed(
    State(db): State<DatabaseConnection>,
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
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let result = claimed.into_iter()
        .filter_map(|(env, claim)| claim.map(|c| EnvelopeWithClaim { envelope: env, claim: c }))
        .collect();

    Ok(Json(result))
}

pub async fn get_details(
    State(db): State<DatabaseConnection>,
    Path(id): Path<String>,
    Query(query): Query<GeneralQuery>,
) -> Result<Json<EnvelopeDetail>, (StatusCode, String)> {
    let mut find = envelopes::Entity::find()
        .filter(envelopes::Column::EnvelopeId.eq(id.clone()));
    
    if let Some(ref network) = query.network {
        find = find.filter(envelopes::Column::Network.eq(network));
    }

    let envelope = find
        .one(&db)
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
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(EnvelopeDetail {
        envelope,
        claims,
    }))
}
