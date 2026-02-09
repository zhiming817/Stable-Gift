import React, { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { cn, Button } from '../components/ui';
import { useContract } from '../hooks/useContract';
import { useNavigate } from 'react-router-dom';
import { Coins, Settings, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

const COIN_TYPES = [
    { symbol: 'SUI', name: 'Sui Token', icon: '💧' },
    // { symbol: 'USDC', name: 'USD Circle', icon: '💵' }, // Future support
];

export const CreatePage: React.FC = () => {
    const account = useCurrentAccount();
    const navigate = useNavigate();
    const { createEnvelope } = useContract();
    
    // Form State
    const [amount, setAmount] = useState('');
    const [count, setCount] = useState('1');
    const [mode, setMode] = useState<0 | 1>(0); // 0=Random, 1=Equal
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [coinId, setCoinId] = useState(''); // In real app, we need to select a Coin Object

    // Note: In a real app, we need a CoinSelector component to pick a specific Coin Object ID with enough balance.
    // For this demo, let's assume the user pastes a coin object ID (like in the CLI test)
    // OR we implement a simple coin selection logic later.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) return alert("Please connect wallet");
        if (!coinId) return alert("Please enter a Coin Object ID (Split a coin first in CLI/Wallet for now)");

        setLoading(true);
        createEnvelope(
            coinId,
            parseInt(count),
            mode,
            (digest) => {
                setLoading(false);
                setShowModal(true); // Show success modal
            },
            (err) => {
                console.error(err);
                setLoading(false);
                alert("Transaction Failed");
            }
        );
    };

    return (
        <div className="pt-24 pb-12 px-4 max-w-lg mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8 gradient-text">Create Red Envelope</h1>
            
            <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl space-y-6">
                
                {/* Coin Selection */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium">Select Currency</label>
                    <div className="grid grid-cols-1 gap-2">
                         {/* Simplified for demo: Just an Input for Coin Object ID */}
                         <input 
                            type="text" 
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg h-12 px-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="Paste Coin Object ID (Temporarily)"
                            value={coinId}
                            onChange={e => setCoinId(e.target.value)}
                         />
                         <p className="text-xs text-yellow-500/80">* For this demo, please split a coin in wallet/CLI and paste ID here.</p>
                    </div>
                </div>

                {/* Amount & Count */}
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
                                Random 🎲
                            </button>
                            <button 
                                type="button"
                                onClick={() => setMode(1)}
                                className={cn("flex-1 rounded-md text-sm font-medium transition-all", mode === 1 ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500")}
                            >
                                Equal 🤝
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-slate-900/30 rounded-lg p-4 text-sm text-slate-300 border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-cyan-400">
                        <Info className="w-4 h-4" />
                        <span className="font-bold">Summary</span>
                    </div>
                    <p>You are creating <span className="text-white font-bold">{count}</span> envelopes.</p>
                    <p>Mode: <span className="text-white">{mode === 0 ? "Random Luck" : "Equal Split"}</span></p>
                </div>

                <Button 
                    type="submit" 
                    disabled={loading || !coinId} 
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
                            <Coins className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
                        <p className="text-slate-400 mb-6">Your Red Envelopes have been created on-chain.</p>
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Close</Button>
                            <Button onClick={() => navigate('/dashboard')} className="flex-1">View</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
