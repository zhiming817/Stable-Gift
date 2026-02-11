// Get initial network from localStorage or default to testnet for development
const savedNetwork = typeof window !== 'undefined' ? localStorage.getItem('sui-network') : null;
export const NETWORK = (savedNetwork === 'mainnet' || savedNetwork === 'testnet') ? savedNetwork : "mainnet";

const PACKAGE_IDS = {
    mainnet: "0x24b251de24a7beb2b327d97a5b35229d3dc12b7a3e1d68d37362c11c9ca7ba0b",
    testnet: "0xb972ae82075bad34d6d7391be513e690c7f84be23a83f9c47bbf3a666df265c0",
};

export const PACKAGE_ID = NETWORK === "mainnet" ? PACKAGE_IDS.mainnet : PACKAGE_IDS.testnet;
export const MODULE_NAME = "sui_red_envelope";
export const SUI_RANDOM_ID = "0x8"; // System Random Object
export const REGISTRY_ID = NETWORK === "mainnet" 
    ? "0xad0732712a9fe142d18e8b8216ca7473bb98ee912db0ed0fb2f0158dcedb7e4a" 
    : "0x93929ac3ae1a2f4fcc188ae3f4232d2ad658ee88df83bde4ba46d8c983da3adb"; // Updated via deployment
export const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000";

// Discord Config (Get these from Discord Developer Portal)
export const DISCORD_CLIENT_ID = "1470743070315122891"; 
export const DISCORD_REDIRECT_URI = window.location.origin + "/claim-callback";

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
