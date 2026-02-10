use sea_orm::entity::prelude::*;
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize)]
#[sea_orm(table_name = "discord_users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub envelope_id: String,
    pub network: String,
    pub discord_user_id: String,
    pub claimer_address: String,
    pub claimed_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
