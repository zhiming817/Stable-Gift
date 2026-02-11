# 可编程 RWA 礼品卡/红包/支票 (VibeCheck Stable-Gift)
## 核心逻辑： 
利用 Stablelayer 的 SDK 发行一种“带条件的”稳定币红包/支票。

## 产品概述：

用户可以生成一张价值 100 USDC 的“红包/支票”。

验证： 领奖人必须完成某个  任务。

一旦 验证通过，合约通过 Stablelayer SDK 释放稳定币。

## 💡 功能特性

### 智能合约功能
- ✅ 创建红包（支持随机分配和平均分配）
- ✅ 领取红包（支持后端签名验证机制）
- ✅ 链上资产元数据优化（支持泛型事件追踪）
- ✅ 完善的权限控制和多网络兼容
- ✅ 多币种支持（USDC/USDT/SUI 等）

### 前端功能
- 🧧 **创建**: 设置金额、数量、分配模式
- 🧭 **发现 (Explore)**: 全新发现页面，实时展示所有待领取的红包
- 🎁 **领取**: 自动处理 Discord 任务验证，支持"加入服务器"跳转引导
- 🛠️ **管理**: 个人活动面板，区分已创建和已领取的任务
- 💼 **钱包集成**: Sui Dapp Kit 深度集成
- 🌐 **多网络**: 支持 Mainnet 与 Testnet 一键切换

## 🔧 技术栈

### 智能合约
- **语言**: Move (Sui)
- **核心**: 共享对象 (Shared Objects) + 随机模块 (Random Module)
- **网络**: Mainnet & Testnet

### 后端 (Indexer & Signer)
- **语言**: Rust (Axum, SeaORM, Tokyos)
- **功能**: 
    - 双网络事件索引系统
    - Discord OAuth2 任务验证
    - Ed25519 离线签名发放

### 前端
- **框架**: React + Vite + TypeScript
- **状态管理**: TanStack Query
- **UI**: Tailwind CSS + Lucide Icons + Framer Motion

## 📝 合约信息

### Mainnet (主网)
- **Package ID**: `0x5f9f7d072cce5dd066546b2923b31f8cb7677e28ee0d1126e0a9b4fc4056b79f`
- **Registry ID**: `0x41b378e340fb32caa3efeeb770a8e3a762079cf76ee793ac0fb09eebef1edd36`

### Testnet (测试网)
- **Package ID**: `0x54a63e2936cbd39450fcf9ca908dcb8134447430ddc8f01734af9374e5d29616`
- **Registry ID**: `0x878b84d4e82460018bfe5d86a6de12e9178a7012f8642ee3fb8939b3607c9ffa`

### 主要函数
- `create_red_envelope(payment, count, mode)` - 创建红包
- `claim_red_envelope(red_envelope)` - 领取红包
- `reclaim_remaining(red_envelope)` - 回收剩余金额


## 参考
https://www.deepsurge.xyz/community/218e11e1-cde0-4401-8edf-61bc3636603d 

https://docs.stablelayer.site/

https://github.com/StableLayer/stable-layer-sdk

## 🚀 部署与构建指南

### 后端 (Rust)
1. **环境要求**:
   - `cargo`, `rustc`
   - `cargo-zigbuild` (用于交叉编译 Linux 版本)
   - `zig`

2. **交叉编译命令** (无需 OpenSSL 系统库依赖):
   ```bash
   cd backend
   # 已开启 vendored 特性，自动编译 OpenSSL
   cargo zigbuild --release --target x86_64-unknown-linux-gnu
   ```
   产物位置: `backend/target/x86_64-unknown-linux-gnu/release/stable-gift-backend`

3. **运行配置**:
   - 修改 `.env` 文件:
     - `ACTIVE_NETWORK`: 设置为 `mainnet`, `testnet` 或 `all` 来控制索引器监听的网络。
     - RPC 节点配置: 推荐使用官方或稳定的公共节点。
   - 启动脚本:
     ```bash
     chmod +x start.sh stop.sh
     ./start.sh
     ```

### 前端 (React)
1. **构建**:
   ```bash
   cd frontend
   npm run build
   ```
   产物位于 `frontend/dist`。

2. **环境变量**:
   - 生产环境接口地址通过 `.env.production` 中的 `VITE_API_BASE_URL` 配置。

### Nginx 配置参考 (解决 404 问题)
```nginx
location / {
    # 解决 SPA 页面刷新 404
    try_files $uri $uri/ /index.html;
}

location /api/ {
    # 反向代理后端 (注意不要带末尾斜杠)
    proxy_pass http://127.0.0.1:3000;
}
```
