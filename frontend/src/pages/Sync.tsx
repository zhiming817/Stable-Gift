import React, { useState } from 'react';
import { BACKEND_URL, NETWORK } from '../constants';
import { RefreshCw, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SyncPage: React.FC = () => {
    const [id, setId] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSync = async () => {
        if (!id || id.length < 10) {
            setMessage('Please enter a valid Envelope Object ID');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch(`${BACKEND_URL}/api/envelopes/sync/${id}?network=${NETWORK}`, {
                method: 'POST'
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Sync failed');
            }

            setStatus('success');
            setMessage('Envelope successfully synced from chain!');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Failed to sync with chain. Make sure ID is correct.');
        }
    };

    return (
        <div className="pt-24 pb-12 px-4 container mx-auto max-w-2xl">
            <div className="glass-card p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[100px] pointer-events-none"></div>
                
                <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
                            <RefreshCw className={`w-6 h-6 ${status === 'loading' ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Manual Sync</h1>
                            <p className="text-slate-400 text-sm">Force sync an envelope status from Sui {NETWORK}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Red Envelope Object ID
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input 
                                    type="text" 
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm border ${
                                status === 'success' 
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                                {status === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                                <span>{message}</span>
                            </div>
                        )}

                        <button
                            onClick={handleSync}
                            disabled={status === 'loading'}
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 rounded-xl font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all group"
                        >
                            {status === 'loading' ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Syncing with Chain...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                    Synchronize Now
                                </>
                            )}
                        </button>

                        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-300 mb-2">When to use manual sync?</h3>
                            <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
                                <li>The indexer missed the initial creation event</li>
                                <li>The remaining count seems out of sync with your wallet</li>
                                <li>You want to track an envelope created outside of this UI</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
