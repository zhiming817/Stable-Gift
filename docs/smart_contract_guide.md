# 智能合约指南：Sui Red Envelope (红包/礼品卡)

本文档详细记录了 `sui_red_envelope` 智能合约的逻辑、部署过程以及在 Sui Testnet 上的完整测试流程。

## 1. 合约概述

该合约实现了一个基于区块链的红包（礼品卡）系统，支持以下核心功能：
*   **创建红包**：用户可以存入代币 (Coin)，设定份数和分配模式。
*   **分配模式**：
    *   **随机金额 (Random)**：利用 Sui `Random` 模块生成随机数。
    *   **固定金额 (Equal)**：平均分配资金。
*   **防重领**：确保每个地址只能领取一次。
*   **资金回收**：合约拥有者可以回收未领取完的资金。

## 2. 部署信息

### Sui Mainnet (当前生产环境)

*   **Network**: Sui Mainnet
*   **Package ID**: `0xebe76b184cca65aea2880b30101d1bae3325fbd4f86b91e2b53195949331093b`
*   **Module Name**: `sui_red_envelope`
*   **UpgradeCap ID**: `0xa7da2741706b9b399bd297521b3b1d64a8f48f224cb34eafe5f13391aab2b06c`
*   **Deploy Transaction Digest**: `95WT6tb6tEjLN8q4RLkyX1fNZURPQr8SzaM1G33FPsCv`

### Sui Testnet (开发测试环境)

*   **Network**: Sui Testnet
*   **Package ID**: `0x9a655891803026d290b40f3b2540915f71a137ddf1be4af2848baa8fd6c7e1be`
*   **Module Name**: `sui_red_envelope`
*   **UpgradeCap ID**: `0x75f52fad895033d9d56d7a01c22608e33abe6f3b91abcace3047c86009a1edaa`
*   **Deploy Transaction Digest**: `7xRKBkcxWUiNWuQFn6yZRTtTRe7qfr4LWshwDpXTdx51`

## 3. 开发与构建

### 目录结构
```
contract/
├── Move.toml      # 依赖配置文件 (Sui Framework mainnet-v1.53.2 / testnet-v1.53.2)
└── sources/
    └── sui_red_envelope.move  # 合约源码
```

### 编译命令
在 `contract` 目录下执行：
```bash
sui move build
```

### 部署命令
```bash
sui client publish --gas-budget 50000000 --skip-dependency-verification
```

## 4. 合约测试流程 (CLI 演练)

以下记录了在 Testnet 上进行的真实测试步骤。若要在主网上执行，请将相关 ID 替换为第二章中的主网信息。

### 步骤 1: 准备资金 (Split Coin)
由于创建红包需要将一个 Coin 对象转入合约，我们先从主 Gas Coin 中拆分出一定金额 (例如 0.01 SUI)。

**命令**:
```bash
sui client split-coin \
--coin-id <GAS_COIN_ID> \
--amounts 10000000 \
--gas-budget 50000000
```
*   **测试结果**: 生成了一个新的 Coin 对象 `0xcffc066358c90188558996607c63ff62d5a9e82ce80d72037fc122eda716aab2` (余额 10,000,000 MIST)。

### 步骤 2: 创建红包 (Create)
调用 `create_red_envelope` 函数。

*   **参数**:
    *   `coin`: 刚刚拆分出的 Coin ID。
    *   `count`: `5` (红包份数)。
    *   `mode`: `0` (0 为随机模式, 1 为平均模式)。

**命令**:
```bash
sui client call \
--package 0x9a655891803026d290b40f3b2540915f71a137ddf1be4af2848baa8fd6c7e1be \
--module sui_red_envelope \
--function create_red_envelope \
--type-args 0x2::sui::SUI \
--args 0xcffc066358c90188558996607c63ff62d5a9e82ce80d72037fc122eda716aab2 5 0 \
--gas-budget 50000000
```

*   **测试结果**:
    *   Transaction Digest: `73JK9HsARsYB8XAKiQdBGqG3Q2AFxY63yiJEBnYGDMPN`
    *   **创建的红包对象 ID**: `0x8fab3e7df6dca3e57c3621d216f374987cca55a18bab49371d6a37dcb0a57dda`

### 步骤 3: 领取红包 (Claim)
调用 `claim_red_envelope` 函数。需要传入红包对象 ID 和系统随机数生成器对象 ID (`0x8`)。

**命令**:
```bash
sui client call \
--package 0x9a655891803026d290b40f3b2540915f71a137ddf1be4af2848baa8fd6c7e1be \
--module sui_red_envelope \
--function claim_red_envelope \
--type-args 0x2::sui::SUI \
--args 0x8fab3e7df6dca3e57c3621d216f374987cca55a18bab49371d6a37dcb0a57dda 0x8 \
--gas-budget 50000000
```

*   **测试结果**:
    *   Transaction Digest: `wqzxKVUQQ5xTPfK1L3zJNQxobQLht6HSj3T5t6LxfXM`
    *   **领取金额**: `3,416,853 MIST` (约 0.0034 SUI)
    *   **状态**: 成功。

## 5. 接口说明

| 函数名 | 可见性 | 参数说明 | 描述 |
|--------|--------|----------|------|
| `create_red_envelope` | `public entry` | `coin`: 资金对象<br>`count`: 份数<br>`mode`: 模式 (0:随机, 1:平均) | 创建并共享红包对象。 |
| `claim_red_envelope` | `entry` | `envelope`: 红包对象引用<br>`r`: 随机数对象 (0x8) | 用户领取红包。内部会自动计算金额并转账。 |
| `withdraw_remaining` | `public entry` | `envelope`: 红包对象引用 | 仅拥有者可调用，回收剩余资金。 |

## 6. 环境依赖
*   Sui CLI Client v1.53.2+ (Testnet environment)
*   Sui Framework (Testnet branch)
