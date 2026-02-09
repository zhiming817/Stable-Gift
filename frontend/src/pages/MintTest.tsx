import React, { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction, coinWithBalance } from '@mysten/sui/transactions';
import { StableLayerClient } from "stable-layer-sdk";
import { NETWORK } from '../constants';
import { Button } from '../components/ui';
import { Loader2, Zap } from 'lucide-react';

// Common Mainnet Addresses
const DEFAULT_USDC = "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC"; // Native USDC on mainnet
const DEFAULT_STABLE = "0x6d9fc33611f4881a3f5c0cd4899d95a862236ce52b3a38fef039077b0c5b5834::btc_usdc::BtcUSDC"; // StableLayer BtcUSDC on mainnet

export const MintTestPage: React.FC = () => {
    const account = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const [loading, setLoading] = useState(false);
    const [stableType, setStableType] = useState(DEFAULT_STABLE);
    const [usdcType, setUsdcType] = useState(DEFAULT_USDC);
    const [amount, setAmount] = useState('1000000'); // 1 USDC (6 decimals)
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleMint = async () => {
        if (!account) return alert("Please connect wallet");
        setLoading(true);
        setStatus(null);

        try {
            const client = new StableLayerClient({
                network: NETWORK as any,
                sender: account.address,
            });

            const tx = new Transaction();
            tx.setSender(account.address);
            
            // Following the provided snippet
            const btcUsdcCoin = await client.buildMintTx({
                tx,
                amount: BigInt(amount),
                sender: account.address,
                usdcCoin: coinWithBalance({
                    balance: BigInt(amount),
                    type: usdcType,
                })(tx),
                autoTransfer: false,
                stableCoinType: stableType,
            });

            // The btcUsdcCoin is a TransactionArgument (the result of the mint call)
            // We must transfer it to the user's address because autoTransfer: false was used.
            if (btcUsdcCoin) {
                tx.transferObjects([btcUsdcCoin], account.address);
            }

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        console.log("Mint success:", result);
                        setStatus({ type: 'success', msg: `Successfully minted! Digest: ${result.digest}` });
                        setLoading(false);
                    },
                    onError: (err) => {
                        console.error("Mint error:", err);
                        setStatus({ type: 'error', msg: err.message });
                        setLoading(false);
                    }
                }
            );
        } catch (err: any) {
            console.error(err);
            setStatus({ type: 'error', msg: err.message });
            setLoading(false);
        }
    };

    return (
        <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 gradient-text text-center">Stablecoin Mint Test</h1>
            <p className="text-slate-400 text-center mb-8">Test StableLayer SDK integration: Minting Stablecoins from USDC</p>

            <div className="glass-card p-8 rounded-3xl space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">USDC Token Type (Source)</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-mono"
                        value={usdcType}
                        onChange={(e) => setUsdcType(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Stablecoin Token Type (Target)</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-mono"
                        value={stableType}
                        onChange={(e) => setStableType(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Amount (in MIST/Smallest Unit)</label>
                    <input 
                        type="number" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">* 1,000,000 = 1 USDC (if 6 decimals)</p>
                </div>

                {status && (
                    <div className={`p-4 rounded-xl text-xs border ${
                        status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                        {status.msg}
                    </div>
                )}

                <Button 
                    onClick={handleMint} 
                    disabled={loading || !account}
                    className="w-full h-14 text-lg font-bold"
                >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2 w-5 h-5" />}
                    Mint Stablecoins
                </Button>

                {!account && (
                    <p className="text-center text-orange-400 text-xs mt-4">Please connect your wallet to test minting.</p>
                )}
            </div>

            <div className="mt-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-300 mb-3">SDK Implementation Hint:</h3>
                <pre className="text-[10px] text-slate-500 overflow-x-auto font-mono bg-black/30 p-4 rounded-lg">
{`const client = new StableLayerClient({ network: "testnet", sender: account.address });
const tx = new Transaction();

await client.buildMintTx({
  tx,
  stableCoinType: stableType,
  usdcCoin: coinWithBalance({ balance: amount, type: usdcType })(tx),
  amount: amount,
});`}
                </pre>
            </div>
        </div>
    );
};
