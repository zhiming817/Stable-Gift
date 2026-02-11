mod config;
mod db;
mod models;
mod services;
mod controllers;

use axum::{routing::{get, post}, Router};
use tower_http::cors::{Any, CorsLayer};
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Clone)]
pub struct AppState {
    pub db: sea_orm::DatabaseConnection,
    pub config: config::Config,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = config::Config::from_env();
    tracing::info!("Starting server with config: {:?}", config);

    let db = db::connect(&config).await.expect("Failed to connect to database");
    tracing::info!("Connected to database");

    // Start Indexers for all configured networks
    for network_config in config.networks.clone() {
        services::sui_indexer::start_indexer(db.clone(), network_config).await;
    }

    let state = AppState {
        db,
        config: config.clone(),
    };

    // CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Web Server
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .route("/api/envelopes/active", get(controllers::envelopes::list_active))
        .route("/api/envelopes/created", get(controllers::envelopes::list_created))
        .route("/api/envelopes/claimed", get(controllers::envelopes::list_claimed))
        .route("/api/envelopes/sync/:id", post(controllers::envelopes::sync_envelope))
        .route("/api/envelopes/:id", get(controllers::envelopes::get_details))
        .route("/api/verify-discord", post(controllers::verification::verify_discord))
        .layer(cors)
        .with_state(state);

    let addr_str = format!("{}:{}", config.server_host, config.server_port);
    let addr: SocketAddr = addr_str.parse().expect("Invalid address");

    tracing::info!("Listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app.into_make_service()).await.unwrap();
}

async fn root() -> &'static str {
    "Sui Red Envelope Backend"
}

async fn health() -> &'static str {
    "OK"
}
