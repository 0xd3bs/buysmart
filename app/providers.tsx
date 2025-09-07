"use client";

import { type ReactNode, useMemo } from "react";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";

// Base chain configuration for MiniKit - moved outside component to prevent re-creation
const base = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.base.org'],
    },
    public: {
      http: ['https://mainnet.base.org'],
    },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
  testnet: false,
};

export function Providers(props: { children: ReactNode }) {
  // Memoize config to prevent unnecessary re-renders
  const config = useMemo(() => ({
    appearance: {
      mode: "auto" as const,
      theme: "mini-app-theme",
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
      logo: process.env.NEXT_PUBLIC_ICON_URL,
    },
  }), []);

  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      projectId={process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID}
      config={config}
    >
      {props.children}
    </MiniKitProvider>
  );
}
