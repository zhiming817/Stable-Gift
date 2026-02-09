import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, SUI_RANDOM_ID } from "../constants";

export const useContract = () => {
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const suiClient = useSuiClient();

    const createEnvelope = async (
        coinId: string,
        count: number,
        mode: number, // 0 = Random, 1 = Equal
        onSuccess: (digest: string) => void,
        onError: (err: any) => void
    ) => {
        try {
            // 1. Fetch object type to support any Coin (SUI, USDC, etc.)
            const obj = await suiClient.getObject({ 
                id: coinId, 
                options: { showType: true } 
            });

            if (!obj.data || !obj.data.type) {
                throw new Error("Could not find coin object or object has no type");
            }

            // Extract the T from 0x2::coin::Coin<T>
            const typeMatch = obj.data.type.match(/0x2::coin::Coin<(.*)>/);
            const coinType = typeMatch ? typeMatch[1] : "0x2::sui::SUI";

            const tx = new Transaction();
            
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::create_red_envelope`,
                arguments: [
                    tx.object(coinId),
                    tx.pure.u64(BigInt(count)),
                    tx.pure.u8(Number(mode)),
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
            console.error("Error creating envelope:", e);
            onError(e);
        }
    };

    const claimEnvelope = async (
        envelopeId: string,
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

            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::claim_red_envelope`,
                arguments: [
                    tx.object(envelopeId),
                    tx.object(SUI_RANDOM_ID),
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
