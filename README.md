# VibeCheck Stable-Gift: Programmable RWA Gift Cards / Red Envelopes

A decentralized platform for creating and claiming "conditional" stablecoin gift cards (Red Envelopes) powered by Sui Network and the Stablelayer SDK.

## 🚀 Core Concept

Users can create a stablecoin gift (e.g., 100 USDC) with specific conditions. Recipients must complete a task (e.g., verifying Discord membership) to unlock the funds. Once verified, the contract releases the stablecoins directly to the recipient's wallet.

## 💡 Key Features

### Smart Contract (Move)
- ✅ **Envelope Creation**: Supports both `Random` and `Equal` distribution modes.
- ✅ **Secure Claiming**: Off-chain verification via Ed25519 signatures from the backend.
- ✅ **Asset Transparency**: Optimized event generics to ensure accurate tracking of asset types (USDC, USDT, SUI).
- ✅ **Multi-Network Compatibility**: Designed to run seamlessly on both Sui Mainnet and Testnet.

### Backend (Rust Indexer & Signer)
- 🌐 **Dual-Network Indexing**: A single backend instance monitors both Mainnet and Testnet events via WebSockets.
- 🤖 **Discord Integration**: Automated task verification using Discord OAuth2 (membership check).
- 🔑 **Cryptographic Signing**: Securely generates claim authorizations for legitimate users.

### Frontend (React)
- 🧧 **Create**: intuitive UI for setting amounts, counts, and distribution logic.
- 🧭 **Explore**: A discovery hub to browse all currently available gifts.
- 📊 **Dashboard**: Personal activity tracker for created and claimed envelopes.
- 🔌 **Wallet Integration**: Deep integration with `@mysten/dapp-kit`.
- 🔄 **Network Switcher**: Seamless one-click toggle between Mainnet and Testnet.

## 🛠 Tech Stack

- **Smart Contract**: Sui Move (Shared Objects, Random Module)
- **Backend**: Rust (Axum, SeaORM, Tokio, Reqwest)
- **Frontend**: React + Vite, TypeScript, TanStack Query, Tailwind CSS, Lucide Icons
- **Integrations**: Stablelayer SDK, Discord API

## 📝 Contract Information

### Mainnet
- **Package ID**: `0x5f9f7d072cce5dd066546b2923b31f8cb7677e28ee0d1126e0a9b4fc4056b79f`
- **Registry ID**: `0x41b378e340fb32caa3efeeb770a8e3a762079cf76ee793ac0fb09eebef1edd36`

### Testnet
- **Package ID**: `0x54a63e2936cbd39450fcf9ca908dcb8134447430ddc8f01734af9374e5d29616`
- **Registry ID**: `0x878b84d4e82460018bfe5d86a6de12e9178a7012f8642ee3fb8939b3607c9ffa`

## 🏃 Getting Started

### 1. Prerequisites
- [Sui CLI](https://docs.sui.io/devnet/build/install) installed.
- [Rust](https://www.rust-lang.org/tools/install) and [Node.js](https://nodejs.org/) environments.
- A MySQL database.

### 2. Backend Setup
```bash
cd backend
cp .env.example .env # Configure your database and Discord credentials
cargo run --bin stable-gift-backend
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔗 References
- [Stablelayer Documentation](https://docs.stablelayer.site/)
- [Stablelayer SDK](https://github.com/StableLayer/stable-layer-sdk)
