mod config;
mod db;
mod models;
mod services;
mod controllers;

use axum::{routing::get, Router};
use tower_http::cors::{Any, CorsLayer};
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

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

    // Start Indexer
    services::sui_indexer::start_indexer(db.clone(), config.clone()).await;

    // CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Web Server
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .route("/api/envelopes/created", get(controllers::envelopes::list_created))
        .route("/api/envelopes/claimed", get(controllers::envelopes::list_claimed))
        .route("/api/envelopes/:id", get(controllers::envelopes::get_details))
        .layer(cors)
        .with_state(db);

    let addr_str = format!("{}:{}", config.server_host, config.server_port);
    let addr: SocketAddr = addr_str.parse().expect("Invalid address");

    tracing::info!("Listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "Sui Red Envelope Backend"
}

async fn health() -> &'static str {
    "OK"
}
