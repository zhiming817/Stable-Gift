import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContract } from '../hooks/useContract';
import { Button } from '../components/ui';
import { Loader2, PartyPopper, Gift, Info, ExternalLink } from 'lucide-react';
import { useSuiClient } from '@mysten/dapp-kit';
import { NETWORK, getCoinConfig, formatAmount, BACKEND_URL } from '../constants';
import { useQuery } from '@tanstack/react-query';

export const ClaimPage: React.FC = () => {
    const { id: urlId } = useParams<{ id: string }>();
    const { claimEnvelope } = useContract();
    const suiClient = useSuiClient();
    
    // States: 'idle' | 'claiming' | 'success'
    const [status, setStatus] = useState<'idle' | 'claiming' | 'success'>('idle');
    const [id, setId] = useState(urlId || '');
    const [error, setError] = useState<string | null>(null);

    // Update ID if URL parameter changes
    useEffect(() => {
        if (urlId) setId(urlId);
    }, [urlId]);

    // Fetch envelope details from Backend
    const { data: detail, isPending: isLoadingData, refetch } = useQuery({
        queryKey: ['envelope', id],
        queryFn: async () => {
            if (!id || id.length < 10) return null;
            const res = await fetch(`${BACKEND_URL}/api/envelopes/${id}`);
            if (!res.ok) throw new Error('Envelope not found');
            return res.json();
        },
        enabled: !!id,
    });

    const envelopeData = detail?.envelope;
    const claims = detail?.claims || [];

    const handleClaim = () => {
        if (!id) return;
        setStatus('claiming');
        setError(null);

        claimEnvelope(
            id,
            () => {
                setStatus('success');
                refetch();
            },
            (err) => {
                console.error(err);
                setStatus('idle');
                setError("Claim Failed: Please check the ID or try again.");
            }
        );
    };

    return (
        <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto flex flex-col items-center">
             <h1 className="text-4xl font-bold text-center mb-4 gradient-text font-display">Reveal Your Gift</h1>
             <p className="text-slate-400 text-center mb-12 max-w-md">
                 Received a VibeCheck gift? Enter the unique ID below to claim your stablecoin rewards instantly.
             </p>

             <div className="w-full max-w-md">
                {status !== 'success' ? (
                    <div className="glass-card p-8 rounded-3xl space-y-6 relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
                        
                        <div className="space-y-4 relative z-10">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Gift Envelope ID</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl h-14 px-5 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all font-mono text-sm"
                                placeholder="0x..."
                                value={id}
                                onChange={(e) => {
                                    setId(e.target.value);
                                    if(error) setError(null);
                                }}
                                disabled={status === 'claiming'}
                            />

                            {isLoadingData && (
                                <div className="flex items-center justify-center py-2">
                                    <Loader2 className="animate-spin w-4 h-4 text-cyan-400 mr-2" />
                                    <span className="text-xs text-slate-500">Fetching envelope details...</span>
                                </div>
                            )}

                            {envelopeData && (
                                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Status</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${Number(envelopeData.remainingCount) > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {Number(envelopeData.remainingCount) > 0 ? 'Active' : 'Empty'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Remaining</p>
                                            <p className="text-lg font-bold text-white">{envelopeData.remaining_count} <span className="text-xs text-slate-500">/ {envelopeData.total_count}</span></p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Distribution</p>
                                            <p className="text-sm font-medium text-slate-300">
                                                {envelopeData.mode === 0 ? '🎲 Random' : '⚖️ Equal Split'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Gift className="w-4 h-4 text-cyan-400" />
                                            <span className="text-xs text-slate-400">Total Gift Value</span>
                                        </div>
                                        {(() => {
                                            const config = getCoinConfig(envelopeData.coin_type);
                                            const amount = formatAmount(envelopeData.total_amount, config?.decimals || 9);
                                            const symbol = config?.symbol || "Unknown";
                                            return (
                                                <span className="text-sm font-mono text-cyan-300 font-bold">
                                                    {amount} {symbol}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                                        <span className="text-slate-600 italic">Asset Type</span>
                                        {(() => {
                                            const config = getCoinConfig(envelopeData.coin_type);
                                            const fullType = envelopeData.coin_type;
                                            const shortName = config?.symbol || fullType.split('::').pop();
                                            return (
                                                <a 
                                                    href={`https://suiscan.xyz/${NETWORK}/coin/${fullType}/traders`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-cyan-500/60 hover:text-cyan-400 flex items-center gap-1 transition-colors font-mono"
                                                >
                                                    {shortName}
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                            
                            {error && (
                                <div className="text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20 italic">
                                    {error}
                                </div>
                            )}

                            <Button 
                                onClick={handleClaim} 
                                disabled={!id || status === 'claiming' || (envelopeData && Number(envelopeData.remaining_count) === 0)} 
                                className="w-full h-14 text-lg font-bold shadow-lg shadow-cyan-500/20"
                            >
                                {status === 'claiming' ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5 mr-3" />
                                        Opening Gift...
                                    </>
                                ) : (envelopeData && Number(envelopeData.remaining_count) === 0 ? 'Fully Claimed' : 'Claim Rewards')}
                            </Button>

                            {/* Claim History */}
                            {claims.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-slate-700/50">
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Gift className="w-3 h-3" />
                                        Claim History
                                    </h3>
                                    <div className="space-y-3">
                                        {claims.map((claim: any, idx: number) => {
                                             const config = getCoinConfig(envelopeData.coin_type);
                                             const symbol = config?.symbol || "???";
                                             const decimals = config?.decimals || 9;
                                             return (
                                                <div key={idx} className="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-white/5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-mono text-slate-300">{claim.claimer.slice(0, 10)}...</span>
                                                        <span className="text-[9px] text-slate-600">{new Date(claim.claimed_at).toLocaleString()}</span>
                                                    </div>
                                                    <span className="text-green-400 font-mono text-xs">
                                                        +{formatAmount(claim.amount, decimals)} {symbol}
                                                    </span>
                                                </div>
                                             );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="glass-card p-12 rounded-3xl text-center space-y-6 animate-in zoom-in duration-500 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <PartyPopper className="w-12 h-12 text-green-400 animate-bounce" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Claimed Successfully!</h2>
                            <p className="text-slate-400 mb-8">
                                The funds have been transferred to your wallet. You can check history in the dashboard.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button className="w-full" onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
                                <Button variant="outline" className="w-full" onClick={() => {setStatus('idle'); setId('');}}>Claim Another</Button>
                            </div>
                        </div>
                    </div>
                )}
             </div>
        </div>
    );
};

