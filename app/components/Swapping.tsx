"use client";

import { useState } from "react";
import {
  Swap,
  SwapAmountInput,
  SwapButton,
  SwapMessage,
  SwapToast,
  SwapToggleButton,
} from '@coinbase/onchainkit/swap';

import type { Token } from "@coinbase/onchainkit/token";
import { Card } from "@/components/ui/Card";

// Define the tokens for swapping
const ETH_TOKEN: Token = {
  name: 'Ethereum',
  address: '', // Native token, no address
  symbol: 'ETH',
  decimals: 18,
  image: '/eth.png',
  chainId: 8453,
};

const USDC_TOKEN: Token = {
  name: 'USDC',
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Address for USDC on Base
  symbol: 'USDC',
  decimals: 6,
  image: '/usdc.png',
  chainId: 8453,
};

export function Swapping() {
  const [swapKey, setSwapKey] = useState(0);
  const [swapSuccessMessage, setSwapSuccessMessage] = useState<string | null>(null);

  // Handle successful swap
  const handleSwapSuccess = () => {
    // Show success message
    setSwapSuccessMessage("✅ Swap completed successfully!");

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSwapSuccessMessage(null);
    }, 3000);

    // Reset swap component
    setSwapKey(prevKey => prevKey + 1);
  };

  // Handle swap error
  const handleSwapError = (error: Error | string | unknown) => {
    console.error("Swap failed:", error);
  };

  return (
    <div className="space-y-6 animate-smooth-in">
      <div className="text-center text-xs text-[var(--app-foreground-muted)]">
        <p>
          Disclaimer: This is an experimental app. All information provided is for informational purposes only and is not financial advice. Use at your own risk.
        </p>
      </div>

      <Card title="Free Swap">
        <p className="text-[var(--app-foreground-muted)] mb-4">
          💱 Swap freely between USDC and ETH without prediction constraints.
        </p>
        <p className="text-xs italic text-[var(--app-foreground-muted)] text-center mb-4">
          ⛽ Gas-free swaps! Take advantage of market opportunities anytime.
        </p>

        <div className="relative" style={{ marginTop: 'var(--space-swap-top)' }}>
          <Swap
            key={swapKey}
            onSuccess={handleSwapSuccess}
            onError={handleSwapError}
            isSponsored
          >
            <div className="swap-container">
              <SwapAmountInput
                label="From"
                token={ETH_TOKEN}
                type="from"
              />
              <div className="flex justify-center" style={{ margin: 'var(--space-toggle-vertical) 0' }}>
                <SwapToggleButton />
              </div>
              <SwapAmountInput
                label="To"
                token={USDC_TOKEN}
                type="to"
              />
              <SwapButton />
              <SwapMessage />
              <SwapToast />
            </div>
          </Swap>
        </div>

        {/* Success message */}
        {swapSuccessMessage && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 text-center">
              {swapSuccessMessage}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
