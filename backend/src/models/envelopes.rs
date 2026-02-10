use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize)]
#[sea_orm(table_name = "envelopes")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub envelope_id: String,
    #[sea_orm(primary_key, auto_increment = false)]
    pub network: String,
    pub owner: String,
    pub coin_type: String,
    #[sea_orm(column_type = "Decimal(Some((30, 0)))")]
    pub total_amount: Decimal,
    pub total_count: i64,
    pub mode: i16,
    pub remaining_count: i64,
    pub is_active: bool,
    pub requires_verification: bool,
    pub created_at: DateTime,
    pub tx_digest: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::claims::Entity")]
    Claims,
}

impl Related<super::claims::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Claims.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
