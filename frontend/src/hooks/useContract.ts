import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, SUI_RANDOM_ID, REGISTRY_ID } from "../constants";

export const useContract = () => {
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const suiClient = useSuiClient();
    const account = useCurrentAccount();

    const createEnvelope = async (
        coinType: string,
        amount: bigint,
        count: number,
        mode: number, // 0 = Fixed, 1 = Random
        requiresVerification: boolean,
        onSuccess: (digest: string) => void,
        onError: (err: any) => void
    ) => {
        try {
            if (!account) throw new Error("Wallet not connected");

            const tx = new Transaction();
            let coinObject;

            // Handle SUI (GAS) vs Other Coins
            if (coinType === "0x2::sui::SUI") {
                // For SUI, we split from the gas coin directly
                const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
                coinObject = coin;
            } else {
                // For other coins, we need to fetch user's coins, merge them if needed, and then split
                const { data: coins } = await suiClient.getCoins({
                    owner: account.address,
                    coinType,
                });

                if (coins.length === 0) {
                    throw new Error(`No coins found for type ${coinType}`);
                }

                // Check total balance
                const totalBalance = coins.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
                if (totalBalance < amount) {
                    throw new Error(`Insufficient balance. Have ${totalBalance}, need ${amount}`);
                }

                // Identify the primary coin (use the first one found)
                const primaryCoinInput = coins[0];
                
                // If we have multiple coins, merge them into the first one
                if (coins.length > 1) {
                    tx.mergeCoins(
                        tx.object(primaryCoinInput.coinObjectId),
                        coins.slice(1).map(c => tx.object(c.coinObjectId)) // All other coins
                    );
                }

                // Now split the needed amount from the primary coin
                const [splitCoin] = tx.splitCoins(
                    tx.object(primaryCoinInput.coinObjectId), 
                    [tx.pure.u64(amount)]
                );
                coinObject = splitCoin;
            }
            
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::create_red_envelope`,
                arguments: [
                    coinObject,
                    tx.pure.u64(BigInt(count)),
                    tx.pure.u8(Number(mode)),
                    tx.pure.bool(requiresVerification),
                ],
                typeArguments: [coinType], 
            });

            signAndExecute(
                {
                    transaction: tx,
                },
                {
                    onSuccess: async (result) => {
                         console.log("Transaction executed, digest:", result);
                        console.log("Transaction executed, digest:", result.digest);
                        try {
                            // Manual polling for transaction results
                            let response = null;
                            console.log("Starting poll for transaction results...");
                            
                            for (let i = 0; i < 10; i++) {
                                try {
                                    response = await suiClient.getTransactionBlock({
                                        digest: result.digest,
                                        options: {
                                            showEvents: true,
                                            showObjectChanges: true,
                                            showEffects: true,
                                        }
                                    });
                                    
                                    // Check if we have the data we need (events or object changes)
                                    if (response && (
                                        (response.events && response.events.length > 0) || 
                                        (response.objectChanges && response.objectChanges.length > 0)
                                    )) {
                                        console.log(`Poll attempt ${i + 1} successful:`, response);
                                        break;
                                    }
                                } catch (err) {
                                    console.log(`Poll attempt ${i + 1} failed, retrying...`);
                                }
                                await new Promise(r => setTimeout(r, 2000));
                            }

                            if (!response) {
                                console.warn("Poll finished without finding detailed results, using digest.");
                                onSuccess(result.digest);
                                return;
                            }

                            // 1. Extract RedEnvelope ID from events (Best)
                            const createdEvent = response.events?.find(
                                (e: any) => e.type.includes('::EnvelopeCreated')
                            );
                            
                            if (createdEvent && createdEvent.parsedJson) {
                                const eventData = createdEvent.parsedJson as any;
                                console.log("Found EnvelopeCreated event:", eventData);
                                if (eventData.id) {
                                    onSuccess(eventData.id);
                                    return;
                                }
                            }

                            // 2. Extract from Object Changes (Fallback)
                            const createdObject = response.objectChanges?.find(
                                (oc: any) => oc.type === 'created' && oc.objectType.includes('::RedEnvelope')
                            );
                            
                            if (createdObject && 'objectId' in createdObject) {
                                console.log("Found RedEnvelope in objectChanges:", createdObject.objectId);
                                onSuccess(createdObject.objectId);
                                return;
                            }

                            // 3. Final fallback
                            onSuccess(result.digest);
                        } catch (e) {
                            console.error("Error in transaction resolution:", e);
                            onSuccess(result.digest);
                        }
                    },
                    onError,
                }
            );
        } catch (e: any) {
            console.error("Error creating envelope:", e);
            onError(e);
        }
    };

    const claimEnvelope = async (
        envelopeId: string,
        signature: string | null,
        onSuccess: (digest: string) => void,
        onError: (err: any) => void
    ) => {
        try {
            // We need to know the coin type of the envelope to claim it
            const obj = await suiClient.getObject({ 
                id: envelopeId, 
                options: { showType: true } 
            });

            if (!obj.data || !obj.data.type) {
                throw new Error("Could not find envelope object");
            }

            // Extract the T from RedEnvelope<T>
            // Example type: 0x...::module::RedEnvelope<0x2::sui::SUI>
            const typeMatch = obj.data.type.match(/<([^>]*)>/);
            const coinType = typeMatch ? typeMatch[1] : "0x2::sui::SUI";

            const tx = new Transaction();

            // Signature needs to be bytes - avoiding Buffer for browser compatibility
            const sigBytes = signature 
                ? Array.from(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
                : [];

            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::claim_red_envelope`,
                arguments: [
                    tx.object(envelopeId),
                    tx.object(REGISTRY_ID),
                    tx.object(SUI_RANDOM_ID),
                    tx.pure.vector('u8', sigBytes),
                ],
                typeArguments: [coinType],
            });

            signAndExecute(
                {
                    transaction: tx,
                },
                {
                    onSuccess: (result) => onSuccess(result.digest),
                    onError,
                }
            );
        } catch (e: any) {
            onError(e);
        }
    };

    return { createEnvelope, claimEnvelope };
};
