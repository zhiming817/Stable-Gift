import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction, coinWithBalance } from '@mysten/sui/transactions';
import { StableLayerClient } from "stable-layer-sdk";
import { NETWORK, getCoinConfig } from '../constants';
import { Button } from '../components/ui';
import { Loader2, Zap, Info, Coins, Banknote, RefreshCw } from 'lucide-react';

// Common Mainnet Addresses
const DEFAULT_USDC = "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC"; // Native USDC on mainnet
const DEFAULT_STABLE = "0x6d9fc33611f4881a3f5c0cd4899d95a862236ce52b3a38fef039077b0c5b5834::btc_usdc::BtcUSDC"; // StableLayer BtcUSDC on mainnet

const TOKEN_OPTIONS = [
    { label: 'USDC', value: DEFAULT_USDC, symbol: 'USDC' },
    { label: 'BtcUSDC', value: DEFAULT_STABLE, symbol: 'BtcUSDC' }
];

export const MintTestPage: React.FC = () => {
    const account = useCurrentAccount();
    const client = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const [activeTab, setActiveTab] = useState<'mint' | 'burn' | 'claim'>('mint');
    const [loading, setLoading] = useState(false);
    const [supplyLoading, setSupplyLoading] = useState(false);
    const [stableType, setStableType] = useState(DEFAULT_STABLE);
    const [usdcType, setUsdcType] = useState(DEFAULT_USDC);
    const [displayAmount, setDisplayAmount] = useState('1'); // Default 1 USDC
    const [burnAll, setBurnAll] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [balance, setBalance] = useState<bigint>(0n);
    const [totalSupply, setTotalSupply] = useState<any>(null);

    // Fetch Balance for Current Context
    useEffect(() => {
        const fetchBalance = async () => {
            if (!account) {
                setBalance(0n);
                return;
            }
            
            try {
                // Determine which coin to show balance for
                let targetType = usdcType;
                if (activeTab === 'burn') targetType = stableType;
                if (activeTab === 'claim') targetType = stableType; // or irrelevant

                const { totalBalance } = await client.getBalance({ 
                    owner: account.address, 
                    coinType: targetType 
                });
                setBalance(BigInt(totalBalance));
            } catch (e) {
                console.error("Failed to fetch balance", e);
                setBalance(0n);
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, 10000); // Polling for updates
        return () => clearInterval(interval);
    }, [account, activeTab, usdcType, stableType, client]);

    const fetchTotalSupply = async (silent = false) => {
        if (!silent) setSupplyLoading(true);
        try {
            const sdkClient = new StableLayerClient({
                network: NETWORK as any,
                sender: account?.address || "0x0",
            });
            const supply = await sdkClient.getTotalSupply();
            console.log("Total Supply:", supply);
            setTotalSupply(supply);
        } catch (e: any) {
            console.error(e);
            // We don't set global status for supply fetch to avoid disrupting main flow
        } finally {
            if (!silent) setSupplyLoading(false);
        }
    };

    // Auto-fetch supply on mount and periodically
    useEffect(() => {
        fetchTotalSupply(true);
        const interval = setInterval(() => fetchTotalSupply(true), 15000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = async () => {
        if (!account) return alert("Please connect wallet");
        
        const coinConfig = getCoinConfig(activeTab === 'mint' ? usdcType : stableType);
        const decimals = coinConfig?.decimals || 6;
        const amount = BigInt(Math.floor(parseFloat(displayAmount) * Math.pow(10, decimals)));

        // Validate amount only if not claiming (claim has no amount)
        if (activeTab !== 'claim' && !burnAll && amount <= 0n) return alert("Please enter a valid amount");

        setLoading(true);
        setStatus(null);

        try {
            const client = new StableLayerClient({
                network: NETWORK as any,
                sender: account.address,
            });

            const tx = new Transaction();
            tx.setSender(account.address);
            
            if (activeTab === 'mint') {
                const btcUsdcCoin = await client.buildMintTx({
                    tx,
                    amount: amount,
                    sender: account.address,
                    usdcCoin: coinWithBalance({
                        balance: amount,
                        type: usdcType,
                    })(tx),
                    autoTransfer: false,
                    stableCoinType: stableType,
                });

                if (btcUsdcCoin) {
                    tx.transferObjects([btcUsdcCoin], account.address);
                }
            } else if (activeTab === 'burn') {
                // Burn Logic
                await client.buildBurnTx({
                    tx,
                    stableCoinType: stableType,
                    amount: burnAll ? undefined : amount,
                    all: burnAll,
                });
            } else if (activeTab === 'claim') {
                // Claim Logic
                await client.buildClaimTx({
                    tx,
                    stableCoinType: stableType,
                });
            }

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        console.log(`${activeTab} success:`, result);
                        setStatus({ type: 'success', msg: `Successfully executed ${activeTab}! Digest: ${result.digest}` });
                        setLoading(false);
                    },
                    onError: (err) => {
                        console.error(`${activeTab} error:`, err);
                        setStatus({ type: 'error', msg: err.message });
                        setLoading(false);
                    }
                }
            );
        } catch (err: any) {
            console.error(err);
            setStatus({ type: 'error', msg: err.message });
            setLoading(false);
        }
    };

    const currentCoin = getCoinConfig(activeTab === 'mint' ? usdcType : stableType);
    const decimals = currentCoin?.decimals || 6;
    const amountInSmallestUnit = displayAmount 
        ? (parseFloat(displayAmount) * Math.pow(10, decimals)).toLocaleString('en-US', { useGrouping: false })
        : '0';

    return (
        <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 gradient-text text-center">Stablecoin</h1>
            <p className="text-slate-400 text-center mb-8">Test StableLayer SDK integration: Minting and Burning Stablecoins</p>

            <div className="glass-card p-8 rounded-3xl space-y-6">
                {/* Tab Switcher */}
                <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
                    <button 
                        onClick={() => { setActiveTab('mint'); setStatus(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold ${
                            activeTab === 'mint' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Zap className="w-4 h-4" />
                        Mint Stablecoin
                    </button>
                    <button 
                        onClick={() => { setActiveTab('burn'); setStatus(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold ${
                            activeTab === 'burn' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Zap className="w-4 h-4 rotate-180" />
                        Burn
                    </button>
                    <button 
                        onClick={() => { setActiveTab('claim'); setStatus(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold ${
                            activeTab === 'claim' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Coins className="w-4 h-4" />
                        Claim Rewards
                    </button>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">
                        {activeTab === 'mint' ? 'USDC Token (Source)' : 'Stablecoin Token'}
                    </label>
                    <div className="relative">
                        <select 
                            className={`w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-bold appearance-none cursor-pointer hover:bg-slate-800 transition-colors ${activeTab !== 'mint' && activeTab !== 'claim' && activeTab !== 'burn' ? 'opacity-50' : ''}`}
                            value={activeTab === 'mint' ? usdcType : stableType}
                            onChange={(e) => activeTab === 'mint' ? setUsdcType(e.target.value) : setStableType(e.target.value)}
                        >
                            {TOKEN_OPTIONS.filter(opt => activeTab === 'mint' ? opt.symbol === 'USDC' : opt.symbol === 'BtcUSDC').map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                             ▼
                        </div>
                    </div>
                    <div className="text-[10px] text-slate-600 truncate mt-1 font-mono px-1">
                        {activeTab === 'mint' ? usdcType : stableType}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">
                        {activeTab === 'mint' ? 'Stablecoin Token (Target)' : (activeTab === 'burn' ? 'Recipient / Context' : 'Target Stablecoin')}
                    </label>
                    {activeTab === 'mint' ? (
                        <div className="relative">
                            <select 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-bold appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                                value={stableType}
                                onChange={(e) => setStableType(e.target.value)}
                            >
                                {TOKEN_OPTIONS.filter(opt => opt.symbol === 'BtcUSDC').map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                ▼
                            </div>
                        </div>
                    ) : (
                        <input 
                            type="text" 
                            readOnly={true}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-mono opacity-50 cursor-not-allowed"
                            value={activeTab === 'burn' ? 'Redeems back to source USDC vault' : stableType}
                        />
                    )}
                     {activeTab === 'mint' && (
                        <div className="text-[10px] text-slate-600 truncate mt-1 font-mono px-1">
                            {stableType}
                        </div>
                    )}
                </div>

                {activeTab !== 'claim' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Amount ({currentCoin?.symbol || 'Tokens'})</label>
                            {account && (
                                <span className="text-[10px] text-cyan-400 font-mono mt-1">
                                    Wallet Balance: {(Number(balance) / Math.pow(10, decimals)).toLocaleString(undefined, { maximumFractionDigits: decimals })} {currentCoin?.symbol || ''}
                                </span>
                            )}
                        </div>
                        {activeTab === 'burn' && (
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <span className={`text-[10px] font-bold uppercase transition-colors ${burnAll ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-400'}`}>Burn All Balance</span>
                                <input 
                                    type="checkbox" 
                                    checked={burnAll}
                                    onChange={(e) => setBurnAll(e.target.checked)}
                                    className="w-4 h-4 accent-red-500"
                                />
                            </label>
                        )}
                    </div>
                    
                    {!burnAll ? (
                        <input 
                            type="number" 
                            step={1 / Math.pow(10, decimals)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                            placeholder={`Enter amount (e.g. 1.0)`}
                            value={displayAmount}
                            onChange={(e) => setDisplayAmount(e.target.value)}
                        />
                    ) : (
                        <div className="w-full bg-slate-900/50 border border-red-500/30 border-dashed rounded-xl p-3 text-sm text-red-400 italic text-center">
                            Entire current balance will be burned
                        </div>
                    )}
                    
                    {!burnAll && (
                        <p className="text-[10px] text-slate-500 mt-1">
                            * Internal Value: {amountInSmallestUnit} units (using {decimals} decimals)
                        </p>
                    )}
                </div>
                )}

                {activeTab === 'claim' && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex gap-3">
                        <Info className="w-5 h-5 text-yellow-500 shrink-0" />
                        <p className="text-xs text-yellow-200/80">
                            <span className="font-bold text-yellow-500 block mb-1">Admin Only</span>
                            Claiming rewards is restricted to the Vault Manager. Normal users cannot perform this action.
                        </p>
                    </div>
                )}

                {status && (
                    <div className={`p-4 rounded-xl text-xs border animate-in fade-in slide-in-from-top-2 duration-300 ${
                        status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                        {status.msg}
                    </div>
                )}

                <Button 
                    onClick={handleAction} 
                    disabled={loading || !account}
                    className={`w-full h-14 text-lg font-bold transition-all ${
                        activeTab === 'burn' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20 hover:shadow-red-500/40' : ''
                    }`}
                >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : (
                        activeTab === 'mint' ? <Zap className="mr-2 w-5 h-5" /> : 
                        (activeTab === 'burn' ? <Zap className="mr-2 w-5 h-5 rotate-180" /> : <Banknote className="mr-2 w-5 h-5" />)
                    )}
                    {activeTab === 'mint' ? 'Mint Stablecoins' : (activeTab === 'burn' ? (burnAll ? 'Burn All & Redeem' : 'Burn & Redeem USDC') : 'Claim Rewards')}
                </Button>

                {/* Total Supply Section */}
                <div className="pt-6 border-t border-slate-800">
                    <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Supply</span>
                            <span className="text-2xl font-mono text-cyan-400 mt-1 min-w-[120px]">
                                {totalSupply !== null ? parseInt(totalSupply).toLocaleString() : (supplyLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : '---')}
                            </span>
                        </div>
                        <Button
                            onClick={() => fetchTotalSupply(false)}
                            disabled={supplyLoading}
                            variant="outline"
                            size="sm"
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 w-10 h-10 p-0 flex items-center justify-center rounded-full"
                            title="Refresh Supply"
                        >
                            <RefreshCw className={`w-4 h-4 ${supplyLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {!account && (
                    <p className="text-center text-orange-400 text-xs mt-4">Please connect your wallet to test.</p>
                )}
            </div>
        </div>
    );
};
