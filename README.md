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
- **Package ID**: `0x24b251de24a7beb2b327d97a5b35229d3dc12b7a3e1d68d37362c11c9ca7ba0b`
- **Registry ID**: `0xad0732712a9fe142d18e8b8216ca7473bb98ee912db0ed0fb2f0158dcedb7e4a`

### Testnet
- **Package ID**: `0xb972ae82075bad34d6d7391be513e690c7f84be23a83f9c47bbf3a666df265c0`
- **Registry ID**: `0x93929ac3ae1a2f4fcc188ae3f4232d2ad658ee88df83bde4ba46d8c983da3adb`

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
