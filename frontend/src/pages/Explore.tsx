import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PartyPopper, Gift, Loader2, Disc as Discord } from 'lucide-react';
import { BACKEND_URL, getCoinConfig, formatAmount, NETWORK } from '../constants';

export const ExplorePage: React.FC = () => {
    const navigate = useNavigate();

    const { data: activeEnvelopes, isPending: isLoading } = useQuery({
        queryKey: ['activeEnvelopes', NETWORK],
        queryFn: async () => {
            const res = await fetch(`${BACKEND_URL}/api/envelopes/active?network=${NETWORK}`);
            if (!res.ok) throw new Error('Failed to fetch active envelopes');
            return res.json();
        },
    });

    return (
        <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto flex flex-col items-center">
            <h1 className="text-4xl font-bold text-center mb-4 gradient-text font-display">Active Gifts</h1>
            <p className="text-slate-400 text-center mb-12 max-w-md">
                Browse through all active stablecoin gifts and claim your share of the rewards.
            </p>

            <div className="w-full max-w-2xl">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="animate-spin w-8 h-8 text-cyan-400" />
                        <span className="text-slate-500 font-medium">Fetching active gifts...</span>
                    </div>
                ) : activeEnvelopes && activeEnvelopes.length > 0 ? (
                    <div className="grid gap-6">
                        {activeEnvelopes.map((env: any) => {
                             const config = getCoinConfig(env.coin_type);
                             const amount = formatAmount(env.total_amount, config?.decimals || 9);
                             
                             return (
                                <div 
                                    key={env.envelope_id}
                                    onClick={() => navigate(`/claim/${env.envelope_id}`)}
                                    className="glass-card p-6 rounded-3xl transition-all cursor-pointer group hover:border-cyan-500/30 border-transparent relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
                                    
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-900 rounded-xl border border-white/5">
                                                    <Gift className="w-5 h-5 text-cyan-400" />
                                                </div>
                                                <div>
                                                    <span className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                                                        {env.mode === 1 ? '🎲 Lucky AirDrop' : '⚖️ Equal Split'}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-slate-500 font-mono">
                                                            {env.envelope_id.slice(0, 14)}...
                                                        </span>
                                                        {env.requires_verification && (
                                                            <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                                                <Discord className="w-2.5 h-2.5" />
                                                                DISCORD
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center">
                                            <div className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                                                {amount} <span className="text-xs font-normal text-slate-500">{config?.symbol}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg mt-1 border border-cyan-500/20">
                                                {env.remaining_count} <span className="text-cyan-600">/ {env.total_count} LEFT</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 flex items-center gap-4">
                                        <div className="flex-grow h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-blue-500 transition-all duration-1000"
                                                style={{ width: `${(Number(env.remaining_count) / Number(env.total_count)) * 100}%` }}
                                            />
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                            {Math.round((Number(env.remaining_count) / Number(env.total_count)) * 100)}%
                                        </div>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 glass-card rounded-3xl p-8 border-dashed border-slate-800">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Gift className="w-8 h-8 text-slate-700" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-400">No active gifts found</h3>
                        <p className="text-sm text-slate-500 mt-2">Check back later or create your own gift!</p>
                        <button 
                            onClick={() => navigate('/create')}
                            className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
                        >
                            Create a Gift
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
