import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { cn, Button } from '../components/ui';
import { useContract } from '../hooks/useContract';
import { useNavigate } from 'react-router-dom';
import { Info, CheckCircle2, Copy } from 'lucide-react';
import { PACKAGE_ID, NETWORK, COIN_OPTIONS, BACKEND_URL } from '../constants';

export const CreatePage: React.FC = () => {
    const account = useCurrentAccount();
    const client = useSuiClient(); 
    const navigate = useNavigate();
    const { createEnvelope } = useContract();
    
    // Form State
    const [selectedCoin, setSelectedCoin] = useState(COIN_OPTIONS[0]);
    const [amount, setAmount] = useState('');
    const [count, setCount] = useState('1');
    const [mode, setMode] = useState<0 | 1>(0); // 0=Fixed, 1=Random
    const [requiresVerification, setRequiresVerification] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [createdId, setCreatedId] = useState<string | null>(null);
    const [balance, setBalance] = useState<bigint>(0n);
    const [checkingBalance, setCheckingBalance] = useState(false);

    // Check Balance when Coin or Account changes
    useEffect(() => {
        const fetchBalance = async () => {
            if (!account) return;
            setCheckingBalance(true);
            try {
                if (selectedCoin.type === '0x2::sui::SUI') {
                    const { totalBalance } = await client.getBalance({ owner: account.address });
                    setBalance(BigInt(totalBalance));
                } else {
                    const { data } = await client.getCoins({ owner: account.address, coinType: selectedCoin.type });
                    const total = data.reduce((acc, coin) => acc + BigInt(coin.balance), 0n);
                    setBalance(total);
                }
            } catch (e) {
                console.error("Failed to fetch balance", e);
                setBalance(0n);
            } finally {
                setCheckingBalance(false);
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [account, selectedCoin, client]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) return alert("Please connect wallet");
        if (!amount || parseFloat(amount) <= 0) return alert("Invalid amount");

        // Calculate raw amount
        const rawAmount = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, selectedCoin.decimals)));
        
        // Balance Check
        if (balance < rawAmount) {
            return alert(`Insufficient Balance! You have ${(Number(balance) / Math.pow(10, selectedCoin.decimals)).toFixed(4)} ${selectedCoin.symbol}, but need ${amount}.`);
        }

        setLoading(true);
        createEnvelope(
            selectedCoin.type,
            rawAmount,
            parseInt(count),
            mode,
            requiresVerification,
            async (id) => {
                try {
                    // Sync with backend
                    await fetch(`${BACKEND_URL}/api/envelopes/sync/${id}?network=${NETWORK}`, {
                        method: 'POST'
                    });
                    console.log(`Envelope ${id} synced with backend`);
                } catch (error) {
                    console.error("Failed to sync envelope with backend:", error);
                }

                setLoading(false);
                setCreatedId(id);
                setShowModal(true); 
            },
            (err) => {
                console.error(err);
                setLoading(false);
                alert(`Transaction Failed: ${err.message || "Unknown error"}`);
            }
        );
    };

    return (
        <div className="pt-24 pb-12 px-4 max-w-lg mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8 gradient-text">Create Red Envelope</h1>
            
            <div className="mb-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-mono text-blue-400 text-center">
                Current Network: <span className="font-bold uppercase">{NETWORK}</span> | 
                Package: <span className="opacity-70">{PACKAGE_ID.slice(0, 10)}...</span>
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl space-y-6">
                
                {/* Coin Selection */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium">Select Currency</label>
                    <div className="grid grid-cols-3 gap-2">
                         {COIN_OPTIONS.map((c) => (
                             <button
                                key={c.symbol}
                                type="button"
                                onClick={() => setSelectedCoin(c)}
                                className={cn(
                                    "flex items-center justify-center h-12 rounded-lg border transition-all text-sm font-bold",
                                    selectedCoin.symbol === c.symbol 
                                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-300" 
                                        : "bg-slate-900/50 border-slate-700 text-slate-500 hover:border-slate-500"
                                )}
                             >
                                 {c.symbol}
                             </button>
                         ))}
                    </div>
                    {account && (
                        <div className="text-xs text-right text-slate-400">
                             Balance: <span className="text-white font-mono">
                                 {checkingBalance ? "..." : (Number(balance) / Math.pow(10, selectedCoin.decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                             </span> {selectedCoin.symbol}
                        </div>
                    )}
                </div>

                {/* Amount & Count */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-medium">Total Amount</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg h-12 pl-4 pr-12 text-white text-lg font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                                placeholder="0.0"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                            <div className="absolute right-4 top-3 text-slate-500 text-sm font-bold">
                                {selectedCoin.symbol}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 font-medium">Quantity</label>
                            <input 
                                type="number" 
                                min="1"
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg h-12 px-4 text-white text-lg font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                                value={count}
                                onChange={e => setCount(e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm text-slate-400 font-medium">Distribution Mode</label>
                            <div className="flex bg-slate-900/50 p-1 rounded-lg h-12 border border-slate-700">
                                <button 
                                    type="button"
                                    onClick={() => setMode(1)}
                                    className={cn("flex-1 rounded-md text-sm font-medium transition-all", mode === 1 ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50" : "text-slate-500")}
                                >
                                    Random
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setMode(0)}
                                    className={cn("flex-1 rounded-md text-sm font-medium transition-all", mode === 0 ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50" : "text-slate-500")}
                                >
                                    Equal
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Verification Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <svg className={cn("w-5 h-5", requiresVerification ? "text-indigo-400" : "text-slate-500")} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.572.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.862-1.295 1.192-1.996a.076.076 0 0 0-.041-.106 13.11 13.11 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.29c.018-.014.04-.019.062-.014 3.931 1.8 8.19 1.8 12.062 0a.063.063 0 0 1 .063.014c.12.098.246.196.373.29a.077.077 0 0 1-.008.128 12.66 12.66 0 0 1-1.872.892.077.077 0 0 0-.041.107c.33.7.73 1.366 1.192 1.996a.077.077 0 0 0 .084.028 19.833 19.833 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">Discord Task</div>
                                <div className="text-[10px] text-slate-500">Requires joining Discord to claim</div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setRequiresVerification(!requiresVerification)}
                            className={cn(
                                "w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none",
                                requiresVerification ? "bg-indigo-600" : "bg-slate-700"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out",
                                requiresVerification ? "translate-x-6" : "translate-x-0"
                            )} />
                        </button>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-slate-900/30 rounded-lg p-4 text-sm text-slate-300 border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-cyan-400">
                        <Info className="w-4 h-4" />
                        <span className="font-bold">Summary</span>
                    </div>
                    <p className="flex justify-between">
                        <span>Total:</span>
                        <span className="text-white font-mono">{amount || "0"} {selectedCoin.symbol}</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Envelopes:</span>
                        <span className="text-white">{count}</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Per Person (Avg):</span>
                        <span className="text-white font-mono">
                            {amount && count ? (parseFloat(amount) / parseInt(count)).toFixed(4) : "0"} {selectedCoin.symbol}
                        </span>
                    </p>
                </div>

                <Button 
                    type="submit" 
                    disabled={loading || !amount} 
                    className="w-full"
                    size="lg"
                >
                    {loading ? "Processing..." : "Mint & Send"}
                </Button>

            </form>
            
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-sm w-full text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
                        <p className="text-slate-400 mb-6">Your Red Envelopes have been created on-chain.</p>
                        
                        {createdId && (
                            <div className="mb-6 p-4 bg-slate-900 border border-slate-700 rounded-xl text-left">
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">Shareable Claim Link</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        readOnly
                                        value={`${window.location.origin}/claim/${createdId}`}
                                        className="flex-1 bg-black/40 border border-slate-700 rounded-md px-3 py-2 text-xs font-mono text-cyan-400 outline-none"
                                    />
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/claim/${createdId}`);
                                            alert("Link copied!");
                                        }}
                                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-md text-cyan-400 transition-colors"
                                        title="Copy Link"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                             <Button variant="outline" onClick={() => {setShowModal(false); navigate('/dashboard');}} className="flex-1">View Dashboard</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
