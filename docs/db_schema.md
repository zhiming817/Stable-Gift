# Sui Red Envelope 数据库同步结构文档

本文档定义了将链上 `sui_red_envelope` 合约数据同步到关系型数据库（如 PostgreSQL/MySQL）的表结构设计。

## 1. 网络区分策略 (Network Separation)

为了同时支持主网 (Mainnet) 和测试网 (Testnet)，建议在所有表中增加 `network` 字段作为联合主键的一部分，或用于分区。

- **字段名**: `network`
- **类型**: `VARCHAR(20)`
- **枚举值**: `mainnet`, `testnet`

或者，也可以选择部署两套独立的数据库实例（如 `sui_gift_mainnet` 和 `sui_gift_testnet`），此时可省略该字段。本设计采用**字段区分法**。

---

## 2. 表结构设计

### 2.1 创建红包表 (`envelopes`)

记录所有通过 `create_red_envelope` 创建的红包对象信息。数据来源：`EnvelopeCreated` 事件。

| 字段名 | 类型 | 描述 | 来源/备注 |
| :--- | :--- | :--- | :--- |
| `envelope_id` | `VARCHAR(66)` | **主键**。红包 Object ID | Event `id` |
| `network` | `VARCHAR(20)` | **主键**。网络环境 | 配置注入 |
| `owner` | `VARCHAR(66)` | 创建者钱包地址 | Event `owner` |
| `coin_type` | `VARCHAR(255)` | 代币类型（完整结构，如 `0x2::sui::SUI`） | Transaction TypeArg |
| `total_amount` | `NUMERIC(30,0)` | 初始总金额 (Raw Value) | Event `amount` |
| `total_count` | `BIGINT` | 初始红包个数 | Event `count` |
| `mode` | `SMALLINT` | 分配模式 (0: Random, 1: Equal) | Event `mode` |
| `remaining_count` | `BIGINT` | 当前剩余个数 | *需实时更新或聚合计算* |
| `is_active` | `BOOLEAN` | 是否有效（未被回收且未领完）| 默认为 `TRUE` |
| `created_at` | `TIMESTAMP` | 创建时间 | Transaction Timestamp |
| `tx_digest` | `VARCHAR(66)` | 交易哈希 | Transaction Digest |

**索引建议**：
- `(network, owner)`: 查询用户发出的红包记录
- `(network, created_at)`: 按时间倒序展示

---

### 2.2 领取记录表 (`claims`)

记录每一次红包领取行为。数据来源：`EnvelopeClaimed` 事件。

| 字段名 | 类型 | 描述 | 来源/备注 |
| :--- | :--- | :--- | :--- |
| `claim_id` | `VARCHAR(66)` | **主键**。领取交易产生的 Event ID 或 UUID | System |
| `envelope_id` | `VARCHAR(66)` | **外键**。关联红包 ID | Event `id` |
| `network` | `VARCHAR(20)` | 网络环境 | 配置注入 |
| `claimer` | `VARCHAR(66)` | 领取者地址 | Event `claimer` |
| `amount` | `NUMERIC(30,0)` | 领取金额 (Raw Value) | Event `amount` |
| `claimed_at` | `TIMESTAMP` | 领取时间 | Transaction Timestamp |
| `tx_digest` | `VARCHAR(66)` | 交易哈希 | Transaction Digest |

**索引建议**：
- `(network, envelope_id)`: 查询某红包的所有领取记录
- `(network, claimer)`: 查询用户收到的红包记录

---

### 2.4 Discord 验证记录表 (`discord_users`)

| 字段名 | 类型 | 描述 | 来源/备注 |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | **主键**。自增 ID | System |
| `envelope_id` | `VARCHAR(66)` | 红包 Object ID | - |
| `network` | `VARCHAR(20)` | 网络环境 (mainnet/testnet) | **新增字段** |
| `discord_user_id` | `VARCHAR(64)` | Discord 用户 ID | @me API |
| `claimer_address` | `VARCHAR(66)` | 绑定的 Sui 地址 | Payload |
| `claimed_at` | `TIMESTAMP` | 记录生成时间 | - |

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS sui_red_envelope DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sui_red_envelope;

-- 创建红包表
CREATE TABLE envelopes (
    envelope_id VARCHAR(66) NOT NULL,
    network VARCHAR(20) NOT NULL,
    owner VARCHAR(66) NOT NULL,
    coin_type VARCHAR(255) NOT NULL,
    total_amount DECIMAL(30,0) NOT NULL,
    total_count BIGINT NOT NULL,
    mode SMALLINT NOT NULL,
    remaining_count BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tx_digest VARCHAR(66) NOT NULL,
    PRIMARY KEY (envelope_id, network),
    INDEX idx_envelopes_owner (network, owner),
    INDEX idx_envelopes_created_at (network, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建领取表
CREATE TABLE claims (
    claim_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    envelope_id VARCHAR(66) NOT NULL,
    network VARCHAR(20) NOT NULL,
    claimer VARCHAR(66) NOT NULL,
    amount DECIMAL(30,0) NOT NULL,
    claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tx_digest VARCHAR(66) NOT NULL,
    -- 注意：MySQL 外键需要被引用的键有索引，envelopes 主键包含 network
    FOREIGN KEY (envelope_id, network) REFERENCES envelopes(envelope_id, network),
    INDEX idx_claims_envelope (network, envelope_id),
    INDEX idx_claims_claimer (network, claimer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建回收表 (可选)
CREATE TABLE refunds (
    refund_id VARCHAR(66) NOT NULL,
    envelope_id VARCHAR(66) NOT NULL,
    network VARCHAR(20) NOT NULL,
    owner VARCHAR(66) NOT NULL,
    amount DECIMAL(30,0) NOT NULL,
    refunded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (refund_id),
    FOREIGN KEY (envelope_id, network) REFERENCES envelopes(envelope_id, network)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
