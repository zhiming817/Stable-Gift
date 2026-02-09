import React from 'react';
import { Link } from 'react-router-dom';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { PACKAGE_ID, MODULE_NAME, NETWORK } from '../constants';
import { ArrowUpRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const account = useCurrentAccount();
    const [view, setView] = React.useState<'events' | 'objects'>('events');

    // Query events (History)
    const { data: createdEvents, isPending: isEventsPending, error: eventsError } = useSuiClientQuery(
        'queryEvents',
        {
            query: {
                MoveModule: { package: PACKAGE_ID, module: MODULE_NAME }
            }
        },
        {
            enabled: !!account,
        }
    );

    const isPending = isEventsPending;
    const error = eventsError;

    return (
        <div className="pt-24 pb-12 px-4 container mx-auto">
            <h1 className="text-3xl font-bold mb-8">User Activity Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-700 mb-6">
                <button 
                    onClick={() => setView('events')}
                    className={`pb-2 border-b-2 font-medium transition-colors ${
                        view === 'events' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Historical Events
                </button>
                <button 
                    onClick={() => setView('objects')}
                    className={`pb-2 border-b-2 font-medium transition-colors ${
                        view === 'objects' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Live Red Envelopes
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
                    Error loading data: {error.message}
                </div>
            )}

            <div className="glass-card rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900/50 text-slate-400 text-sm">
                            <th className="p-4 font-medium">{view === 'events' ? 'Type' : 'Status'}</th>
                            <th className="p-4 font-medium">{view === 'events' ? 'Sender / Claimer' : 'ID'}</th>
                            <th className="p-4 font-medium">Info</th>
                            <th className="p-4 font-medium">{view === 'events' ? 'Digest' : 'Balance'}</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {isPending && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                    Syncing with Sui Network...
                                </span>
                            </td></tr>
                        )}
                        
                        {!isPending && view === 'events' && createdEvents?.data.map((event, idx) => {
                            const type = event.type.split("::").pop(); // EnvelopeCreated or EnvelopeClaimed
                            const json = event.parsedJson as any;
                            
                            return (
                                <tr key={idx} className="border-t border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                            type === 'EnvelopeCreated' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                                        }`}>
                                            {type === 'EnvelopeCreated' ? '🎁 Created' : '💰 Claimed'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-slate-300">
                                        {type === 'EnvelopeCreated' ? json.owner : json.claimer}
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        {type === 'EnvelopeCreated' 
                                            ? `Amt: ${json.amount} | Count: ${json.count}`
                                            : `Amt: ${json.amount}`
                                        }
                                    </td>
                                    <td className="p-4 text-cyan-500 truncate max-w-[100px]">
                                        {event.id?.txDigest ? (
                                            <a href={`https://suiscan.xyz/${NETWORK}/tx/${event.id.txDigest}`} target="_blank" rel="noreferrer" className="hover:underline">
                                                {event.id.txDigest.slice(0, 8)}...
                                            </a>
                                        ) : 'N/A'}
                                    </td>
                                </tr>
                            );
                        })}

                        {!isPending && view === 'objects' && createdEvents?.data
                            .filter(e => e.type.endsWith('::EnvelopeCreated'))
                            .map((event, idx) => {
                                const json = event.parsedJson as any;
                                return (
                                    <tr key={idx} className="border-t border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-orange-500/20 text-orange-300">
                                                🎁 Created
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-slate-300 text-xs shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(json.id || '');
                                                        alert('ID Copied!');
                                                    }}
                                                    className="hover:text-cyan-400 transition-colors"
                                                    title="Copy ID"
                                                >
                                                    {json.id}
                                                </button>
                                                <Link 
                                                    to={`/claim/${json.id}`}
                                                    className="p-1 hover:bg-slate-700 rounded-md text-cyan-500 transition-colors"
                                                    title="Go to claim page"
                                                >
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300">
                                            Count: {json.count}
                                        </td>
                                        <td className="p-4 text-green-400 font-mono">
                                            {json.amount}
                                        </td>
                                    </tr>
                                );
                            })
                        }

                        {!isPending && ((view === 'events' && createdEvents?.data.length === 0) || (view === 'objects' && !createdEvents?.data.some(e => e.type.endsWith('::EnvelopeCreated')))) && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">No data found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
