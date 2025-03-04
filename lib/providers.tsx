'use client';

import { DynamicContextProvider} from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { createConfig, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createPublicClient, http } from "viem";
import { mainnet, polygonMumbai, sepolia, polygon } from "viem/chains";
import AuthStateManager from "@/app/components/Auth/AuthStateManager";
import { useRouter } from "next/navigation";
import { getNetwork } from "./blockchain/networkConfig";

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

export const publicClient = createPublicClient({
  chain: getNetwork(),
  transport: http(process.env.RPC_URL),
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
            <AuthStateManager />
            {children}
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}