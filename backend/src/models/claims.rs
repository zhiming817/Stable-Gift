use sea_orm::entity::prelude::*;
use rust_decimal::Decimal;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "claims")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub claim_id: i64,
    pub envelope_id: String,
    pub network: String,
    pub claimer: String,
    #[sea_orm(column_type = "Decimal(Some((30, 0)))")]
    pub amount: Decimal,
    pub claimed_at: DateTime,
    pub tx_digest: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::envelopes::Entity",
        from = "(Column::EnvelopeId, Column::Network)",
        to = "(super::envelopes::Column::EnvelopeId, super::envelopes::Column::Network)",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Envelopes,
}

impl Related<super::envelopes::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Envelopes.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
