use std::env;
use dotenvy::dotenv;

#[derive(Debug, Clone)]
pub struct NetworkConfig {
    pub name: String,
    pub rpc_url: String,
    pub ws_url: String,
    pub package_id: String,
}

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub networks: Vec<NetworkConfig>,
    pub server_host: String,
    pub server_port: String,
    pub enable_websocket: bool,
}

impl Config {
    pub fn from_env() -> Self {
        dotenv().ok();

        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        let server_host = env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        let server_port = env::var("SERVER_PORT").unwrap_or_else(|_| "3000".to_string());
        let enable_websocket = env::var("ENABLE_WEBSOCKET")
            .unwrap_or_else(|_| "true".to_string())
            .parse::<bool>()
            .unwrap_or(true);
        let active_network = env::var("ACTIVE_NETWORK").unwrap_or_else(|_| "all".to_string());
        
        let mut networks = Vec::new();

        // Testnet
        if (active_network == "all" || active_network == "testnet") {
            if let Ok(rpc) = env::var("TESTNET_RPC_URL") {
                networks.push(NetworkConfig {
                    name: "testnet".to_string(),
                    rpc_url: rpc,
                    ws_url: env::var("TESTNET_WS_URL").expect("TESTNET_WS_URL must be set"),
                    package_id: env::var("TESTNET_PACKAGE_ID").expect("TESTNET_PACKAGE_ID must be set"),
                });
            } else if let Ok(rpc) = env::var("SUI_RPC_URL") {
                // Backward compatibility
                networks.push(NetworkConfig {
                    name: "testnet".to_string(),
                    rpc_url: rpc,
                    ws_url: env::var("SUI_WS_URL").expect("SUI_WS_URL must be set"),
                    package_id: env::var("SUI_PACKAGE_ID").expect("SUI_PACKAGE_ID must be set"),
                });
            }
        }

        // Mainnet
        if (active_network == "all" || active_network == "mainnet") {
            if let Ok(rpc) = env::var("MAINNET_RPC_URL") {
                networks.push(NetworkConfig {
                    name: "mainnet".to_string(),
                    rpc_url: rpc,
                    ws_url: env::var("MAINNET_WS_URL").expect("MAINNET_WS_URL must be set"),
                    package_id: env::var("MAINNET_PACKAGE_ID").expect("MAINNET_PACKAGE_ID must be set"),
                });
            }
        }

        Self {
            database_url,
            networks,
            server_host,
            server_port,
            enable_websocket,
        }
    }
}
