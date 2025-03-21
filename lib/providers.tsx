'use client';

import { DynamicContextProvider} from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { createConfig, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Chain, createPublicClient, http } from "viem";
import { mainnet, polygonMumbai, sepolia, polygon } from "viem/chains";
import AuthStateManager from "@/app/components/Auth/AuthStateManager";
import { useRouter } from "next/navigation";
import { getNetwork } from "./blockchain/networkConfig";
import { ToastProvider, CustomToaster } from "@/app/components/Toast/ToastContext";

// Fonction qui transforme une chaîne en objet Chain
function getChainByName(networkName: string): Chain {
  const chainMap: Record<string, Chain> = {
    mainnet: mainnet,
    polygon: polygon,
    sepolia: sepolia,
    polygonMumbai: polygonMumbai
  }
  
  // Récupérer la chaîne correspondante ou utiliser sepolia par défaut
  return chainMap[networkName] || sepolia
}

const config = createConfig({
  chains: [mainnet],
  multiInjectedProviderDiscovery: false,
  transports: {
    [mainnet.id]: http(),
    [polygonMumbai.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
  },
});

const queryClient = new QueryClient();

const currentNetworkName = getNetwork()
console.log('currentNetwork', currentNetworkName)

// Utiliser la fonction pour convertir le nom en objet Chain
const currentChain = getChainByName(currentNetworkName)

export const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.sepolia.org"),
});


export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <DynamicContextProvider
      theme="auto"
      settings={{
        environmentId: "f176580d-2366-46b2-8ab9-39fc7885fed5",
        walletConnectors: [EthereumWalletConnectors],
        events: {
          onAuthSuccess: ({ user }) => {
            router.push('/dashboard');
          }
        }
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <ToastProvider>
              <AuthStateManager />
              {children}
              <CustomToaster />
            </ToastProvider>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}