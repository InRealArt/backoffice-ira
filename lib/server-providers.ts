import { createPublicClient, http, Chain } from "viem";
import { getNetwork } from "./blockchain/networkConfig";

// Client spécifique pour les actions serveur
export const serverPublicClient = createPublicClient({
    chain: getNetwork() as unknown as Chain,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || ""),
}); 