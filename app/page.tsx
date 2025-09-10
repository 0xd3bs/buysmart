"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";

import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "./components/Components";
import { Icon } from "./components/Components";
import { Home } from "./components/Components";
import { Tabs } from "@/components/ui/Tabs";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { PositionsProvider } from "@/lib/positions-context";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"trade" | "dashboard">("trade");
  const [appReady, setAppReady] = useState(false);
  const [walletContentReady, setWalletContentReady] = useState(false);
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Enhanced initialization to prevent wallet content flickering
  useEffect(() => {
    if (isFrameReady) {
      // First, mark app as ready
      setAppReady(true);
      
      // Then, after a longer delay to ensure wallet content (basename) is loaded
      const timer = setTimeout(() => {
        setWalletContentReady(true);
      }, 500); // Increased delay to allow basename to load
      
      return () => clearTimeout(timer);
    } else {
      setAppReady(false);
      setWalletContentReady(false);
    }
  }, [isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Save Frame
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  // Show loading state until frame is ready - this replaces the splash screen
  if (!appReady) {
    return (
      <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme bg-gradient-to-b from-[var(--app-background)] to-[var(--app-gray)]">
        <div className="w-full max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 bg-[var(--app-accent)] rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme bg-gradient-to-b from-[var(--app-background)] to-[var(--app-gray)] animate-smooth-in">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div>
            <div className="flex items-center space-x-2">
              {walletContentReady ? (
                <Wallet className="z-10 animate-wallet-ready">
                  <ConnectWallet>
                    <Name className="text-inherit" />
                  </ConnectWallet>
                  <WalletDropdown>
                    <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                      <Avatar />
                      <Name />
                      <Address />
                      <EthBalance />
                    </Identity>
                    <WalletDropdownDisconnect />
                  </WalletDropdown>
                </Wallet>
              ) : (
                <div className="flex items-center space-x-2 h-8">
                  <div className="w-6 h-6 bg-[var(--app-accent)] rounded-full animate-pulse"></div>
                  <div className="w-20 h-4 bg-[var(--app-gray)] rounded animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {saveFrameButton}
          </div>
        </header>

        <main className="flex-1">
          <div className="tabs-container">
            <Tabs
              items={[
                { key: "trade", label: "Buy" },
                { key: "dashboard", label: "Position Tracker" },
              ]}
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as "trade" | "dashboard")}
            />
          </div>
          <PositionsProvider>
            {activeTab === "trade" && <Home />}
            {activeTab === "dashboard" && <Dashboard />}
          </PositionsProvider>
        </main>

        <footer className="mt-2 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer>
      </div>
    </div>
  );
}
