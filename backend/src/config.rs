use std::env;
use dotenvy::dotenv;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub sui_rpc_url: String,
    pub sui_ws_url: String,
    pub sui_package_id: String,
    pub server_host: String,
    pub server_port: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenv().ok();

        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        let sui_rpc_url = env::var("SUI_RPC_URL").expect("SUI_RPC_URL must be set");
        let sui_ws_url = env::var("SUI_WS_URL").expect("SUI_WS_URL must be set");
        let sui_package_id = env::var("SUI_PACKAGE_ID").expect("SUI_PACKAGE_ID must be set");
        let server_host = env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

        Self {
            database_url,
            sui_rpc_url,
            sui_ws_url,
            sui_package_id,
            server_host,
            server_port: env::var("SERVER_PORT").unwrap_or_else(|_| "3000".to_string()),
        }
    }
}
