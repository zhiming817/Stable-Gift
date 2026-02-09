import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { cn, Button } from '../components/ui';
import { useContract } from '../hooks/useContract';
import { useNavigate } from 'react-router-dom';
import { Coins, Info, CheckCircle2 } from 'lucide-react';
import { PACKAGE_ID, NETWORK, COIN_OPTIONS } from '../constants';

export const CreatePage: React.FC = () => {
    const account = useCurrentAccount();
    const client = useSuiClient(); 
    const navigate = useNavigate();
    const { createEnvelope } = useContract();
    
    // Form State
    const [selectedCoin, setSelectedCoin] = useState(COIN_OPTIONS[0]);
    const [amount, setAmount] = useState('');
    const [count, setCount] = useState('1');
    const [mode, setMode] = useState<0 | 1>(0); // 0=Random, 1=Equal
    
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
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
            () => {
                setLoading(false);
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
                            <label className="text-sm text-slate-400 font-medium">Mode</label>
                            <div className="flex bg-slate-900/50 p-1 rounded-lg h-12 border border-slate-700">
                                <button 
                                    type="button"
                                    onClick={() => setMode(0)}
                                    className={cn("flex-1 rounded-md text-sm font-medium transition-all", mode === 0 ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500")}
                                >
                                    Random
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setMode(1)}
                                    className={cn("flex-1 rounded-md text-sm font-medium transition-all", mode === 1 ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500")}
                                >
                                    Equal
                                </button>
                            </div>
                        </div>
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
                        <div className="flex gap-4">
                             <Button variant="outline" onClick={() => {setShowModal(false); navigate('/dashboard');}} className="flex-1">View Dashboard</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
