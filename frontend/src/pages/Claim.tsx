import React, { useState } from 'react';
import { useContract } from '../hooks/useContract';
import { Button } from '../components/ui';
import { Loader2, PartyPopper } from 'lucide-react';

export const ClaimPage: React.FC = () => {
    const { claimEnvelope } = useContract();
    
    // States: 'idle' | 'claiming' | 'success'
    const [status, setStatus] = useState<'idle' | 'claiming' | 'success'>('idle');
    const [id, setId] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleClaim = () => {
        if (!id) return;
        setStatus('claiming');
        setError(null);

        claimEnvelope(
            id,
            (digest) => {
                setStatus('success');
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
                            
                            {error && (
                                <div className="text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20 italic">
                                    {error}
                                </div>
                            )}

                            <Button 
                                onClick={handleClaim} 
                                disabled={!id || status === 'claiming'} 
                                className="w-full h-14 text-lg font-bold shadow-lg shadow-cyan-500/20"
                            >
                                {status === 'claiming' ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5 mr-3" />
                                        Opening Gift...
                                    </>
                                ) : (
                                    'Claim Rewards'
                                )}
                            </Button>
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

