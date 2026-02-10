import React from 'react';
import { Link } from 'react-router-dom';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { BACKEND_URL, NETWORK, formatAmount, getCoinConfig } from '../constants';
import { ArrowUpRight, Copy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export const Dashboard: React.FC = () => {
    const account = useCurrentAccount();
    const [view, setView] = React.useState<'created' | 'claimed'>('created');

    const { data: envelopes, isPending, error } = useQuery({
        queryKey: ['envelopes', view, account?.address, NETWORK],
        queryFn: async () => {
            const endpoint = view === 'created' ? 'created' : 'claimed';
            const res = await fetch(`${BACKEND_URL}/api/envelopes/${endpoint}?address=${account?.address}&network=${NETWORK}`);
            if (!res.ok) throw new Error('Failed to fetch data');
            return res.json();
        },
        enabled: !!account,
    });

    return (
        <div className="pt-24 pb-12 px-4 container mx-auto">
            <h1 className="text-3xl font-bold mb-8">User Activity Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-700 mb-6">
                <button 
                    onClick={() => setView('created')}
                    className={`pb-2 border-b-2 font-medium transition-colors ${
                        view === 'created' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Envelopes I Created
                </button>
                <button 
                    onClick={() => setView('claimed')}
                    className={`pb-2 border-b-2 font-medium transition-colors ${
                        view === 'claimed' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Envelopes I Claimed
                </button>
            </div>

            {error instanceof Error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
                    Error loading data: {error.message}
                </div>
            )}

            <div className="glass-card rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900/50 text-slate-400 text-sm">
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Envelope ID</th>
                            <th className="p-4 font-medium">Info</th>
                            <th className="p-4 font-medium">{view === 'created' ? 'Remaining / Total' : 'Claimed Amount'}</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {isPending && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                    Syncing with Backend...
                                </span>
                            </td></tr>
                        )}
                        
                        {!isPending && envelopes?.map((item: any, idx: number) => {
                            const envelope = view === 'created' ? item : item.envelope;
                            const claim = view === 'claimed' ? item.claim : null;
                            const coinConfig = getCoinConfig(envelope.coin_type);
                            const symbol = coinConfig?.symbol || '???';
                            const decimals = coinConfig?.decimals || 9;

                            return (
                                <tr key={idx} className="border-t border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                            envelope.remaining_count > 0 ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-400'
                                        }`}>
                                            {envelope.remaining_count > 0 ? '● Active' : '○ Finished'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-slate-300 text-xs">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(envelope.envelope_id);
                                                    alert('ID Copied!');
                                                }}
                                                className="hover:text-cyan-400 transition-colors truncate max-w-[120px]"
                                                title={envelope.envelope_id}
                                            >
                                                {envelope.envelope_id.slice(0, 10)}...
                                            </button>
                                            <Link 
                                                to={`/claim/${envelope.envelope_id}`}
                                                className="p-1 hover:bg-slate-700 rounded-md text-cyan-500 transition-colors"
                                                title="Go to claim page"
                                            >
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            </Link>
                                            <button 
                                                onClick={() => {
                                                    const url = `${window.location.origin}/claim/${envelope.envelope_id}`;
                                                    navigator.clipboard.writeText(url);
                                                    alert('Share link copied!');
                                                }}
                                                className="p-1 hover:bg-slate-700 rounded-md text-cyan-500 transition-colors"
                                                title="Copy share link"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        <div className="flex flex-col">
                                            <span>Total: {formatAmount(envelope.total_amount, decimals)} {symbol}</span>
                                            <span className="text-xs text-slate-500">{new Date(envelope.created_at).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-cyan-500 font-mono">
                                        {view === 'created' ? (
                                            <span>{envelope.remaining_count} / {envelope.total_count} left</span>
                                        ) : (
                                            <span className="text-green-400">
                                                +{formatAmount(claim.amount, decimals)} {symbol}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}

                        {!isPending && (!envelopes || envelopes.length === 0) && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">No data found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
