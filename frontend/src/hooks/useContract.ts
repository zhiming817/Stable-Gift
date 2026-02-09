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
        const tx = new Transaction();
        
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::create_red_envelope`,
            arguments: [
                tx.object(coinId),
                tx.pure.u64(count),
                tx.pure.u8(mode),
            ],
            typeArguments: ["0x2::sui::SUI"], // For now hardcoded to SUI, can be generic
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
    };

    const claimEnvelope = async (
        envelopeId: string,
        onSuccess: (digest: string) => void,
        onError: (err: any) => void
    ) => {
        const tx = new Transaction();

        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::claim_red_envelope`,
            arguments: [
                tx.object(envelopeId),
                tx.object(SUI_RANDOM_ID),
            ],
            typeArguments: ["0x2::sui::SUI"],
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
    };

    return { createEnvelope, claimEnvelope };
};
