use axum::{
    extract::{Path, Query, State},
    Json,
    http::StatusCode,
};
use sea_orm::*;
use serde::{Deserialize, Serialize};
use crate::models::{envelopes, claims};

#[derive(Deserialize)]
pub struct AddressQuery {
    pub address: String,
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
    Query(query): Query<AddressQuery>,
) -> Result<Json<Vec<envelopes::Model>>, (StatusCode, String)> {
    let envelopes = envelopes::Entity::find()
        .filter(envelopes::Column::Owner.eq(query.address.to_lowercase()))
        .order_by_desc(envelopes::Column::CreatedAt)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(envelopes))
}

pub async fn list_claimed(
    State(db): State<DatabaseConnection>,
    Query(query): Query<AddressQuery>,
) -> Result<Json<Vec<EnvelopeWithClaim>>, (StatusCode, String)> {
    let claimed = envelopes::Entity::find()
        .find_also_related(claims::Entity)
        .filter(claims::Column::Claimer.eq(query.address.to_lowercase()))
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
) -> Result<Json<EnvelopeDetail>, (StatusCode, String)> {
    let envelope = envelopes::Entity::find()
        .filter(envelopes::Column::EnvelopeId.eq(id.clone()))
        .one(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Envelope not found".to_string()))?;

    let claims = claims::Entity::find()
        .filter(claims::Column::EnvelopeId.eq(id))
        .order_by_desc(claims::Column::ClaimedAt)
        .all(&db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(EnvelopeDetail {
        envelope,
        claims,
    }))
}
