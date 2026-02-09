import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { Gift, Wallet } from 'lucide-react';

export const Home: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] pt-16 px-4 text-center">
            
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                    Send <span className="gradient-text">Crypto Gifts</span> <br /> with Style
                </h1>
                <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
                    The easiest way to send programmable stable-gift red envelopes on the Sui Network. Share good vibes securely.
                </p>

                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    <div className="glass-card p-8 rounded-2xl text-left hover:border-cyan-500/50 transition-all group">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Gift className="w-6 h-6 text-red-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Send a Gift</h3>
                        <p className="text-slate-400 mb-6">Create and share custom stable-gift envelopes with random or equal distribution.</p>
                        <Button onClick={() => navigate('/create')} className="w-full">Create New</Button>
                    </div>

                    <div className="glass-card p-8 rounded-2xl text-left hover:border-blue-500/50 transition-all group">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Wallet className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Claim a Gift</h3>
                        <p className="text-slate-400 mb-6">Received a VibeCheck? Enter your ID to verify tasks and claim your crypto instantly.</p>
                        <Button onClick={() => navigate('/claim')} variant="outline" className="w-full">Claim Now</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
