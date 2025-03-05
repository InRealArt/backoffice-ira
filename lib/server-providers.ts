import { createPublicClient, http } from "viem";
import { getNetwork } from "./blockchain/networkConfig";

// Client spécifique pour les actions serveur
export const serverPublicClient = createPublicClient({
    chain: getNetwork(),
    transport: http(process.env.RPC_URL || ""),
}); 