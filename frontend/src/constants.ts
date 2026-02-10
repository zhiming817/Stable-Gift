// Get initial network from localStorage or default to mainnet
const savedNetwork = typeof window !== 'undefined' ? localStorage.getItem('sui-network') : null;
export const NETWORK = (savedNetwork === 'mainnet' || savedNetwork === 'testnet') ? savedNetwork : "mainnet";

const PACKAGE_IDS = {
    mainnet: "0xebe76b184cca65aea2880b30101d1bae3325fbd4f86b91e2b53195949331093b",
    testnet: "0x9a655891803026d290b40f3b2540915f71a137ddf1be4af2848baa8fd6c7e1be",
};

export const PACKAGE_ID = NETWORK === "mainnet" ? PACKAGE_IDS.mainnet : PACKAGE_IDS.testnet;
export const MODULE_NAME = "sui_red_envelope";
export const SUI_RANDOM_ID = "0x8"; // System Random Object
export const BACKEND_URL = "http://127.0.0.1:3000"; // Assuming default backend port

// Coin Constants
export interface CoinConfig {
    symbol: string;
    type: string;
    decimals: number;
}

const COINS_MAINNET: CoinConfig[] = [
    { symbol: 'SUI', type: '0x2::sui::SUI', decimals: 9 },
    { symbol: 'USDC', type: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC', decimals: 6 },
   { symbol: 'btcUSDC', type: '0x6d9fc33611f4881a3f5c0cd4899d95a862236ce52b3a38fef039077b0c5b5834::btc_usdc::BtcUSDC', decimals: 6 }, // Placeholder
];

const COINS_TESTNET: CoinConfig[] = [
    { symbol: 'SUI', type: '0x2::sui::SUI', decimals: 9 },
    { symbol: 'USDC', type: '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC', decimals: 6 },
    
];

export const COIN_OPTIONS = NETWORK === "mainnet" ? COINS_MAINNET : COINS_TESTNET;

export const formatAmount = (amount: bigint | number | string, decimals: number): string => {
    const val = typeof amount === 'bigint' ? amount : BigInt(amount);
    if (val === 0n) return "0";
    
    const divisor = BigInt(10 ** decimals);
    const integerPart = val / divisor;
    const fractionalPart = val % divisor;
    
    if (fractionalPart === 0n) return integerPart.toString();
    
    // Pad with leading zeros
    let fracStr = fractionalPart.toString().padStart(decimals, '0');
    // Remove trailing zeros
    fracStr = fracStr.replace(/0+$/, '');
    
    return `${integerPart}.${fracStr}`;
};

export const getCoinConfig = (type: string): CoinConfig | undefined => {
    // Try exact match
    let config = COIN_OPTIONS.find(c => c.type === type);
    if (config) return config;

    // Try detecting nested type (e.g. Coin<T>)
    // If incoming type is 0x2::coin::Coin<T>, we match T
    const match = type.match(/<(.+)>/);
    if (match) {
        return COIN_OPTIONS.find(c => c.type === match[1]);
    }
    
    return undefined;
};

// Helper to switch network and reload
export const toggleNetwork = () => {
    const nextNetwork = NETWORK === "mainnet" ? "testnet" : "mainnet";
    localStorage.setItem('sui-network', nextNetwork);
    window.location.reload();
};
