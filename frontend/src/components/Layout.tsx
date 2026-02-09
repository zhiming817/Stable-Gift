import React from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@mysten/dapp-kit';
import { Gift, LayoutDashboard } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <Gift className="w-8 h-8 text-cyan-400" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                        VibeCheck Stable-Gift
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <Link to="/create" className="text-slate-300 hover:text-white transition-colors">Send Gift</Link>
                    <Link to="/claim" className="text-slate-300 hover:text-white transition-colors">Claim</Link>
                    <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">Dashboard</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="md:hidden text-slate-300">
                        <LayoutDashboard className="w-6 h-6" />
                    </Link>
                    <ConnectButton className="!bg-slate-800 !text-white !font-medium" />
                </div>
            </div>
        </header>
    );
};

export const Footer: React.FC = () => {
    return (
        <footer className="border-t border-white/5 py-8 mt-20">
            <div className="container mx-auto text-center text-slate-500 text-sm">
                <p>© 2026 VibeCheck Stable-Gift. Powered by Sui Network & Stablelayer.</p>
            </div>
        </footer>
    );
};
