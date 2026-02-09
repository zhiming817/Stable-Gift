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

// Helper to switch network and reload
export const toggleNetwork = () => {
    const nextNetwork = NETWORK === "mainnet" ? "testnet" : "mainnet";
    localStorage.setItem('sui-network', nextNetwork);
    window.location.reload();
};
