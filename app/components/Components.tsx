"use client";

import { type ReactNode, useState, useEffect, useRef } from "react";
import {
  Swap,
  SwapAmountInput,
  SwapButton,
  SwapMessage,
  SwapToast,
  SwapToggleButton,
} from '@coinbase/onchainkit/swap';

import type { Token } from "@coinbase/onchainkit/token";
import { PredictionResponse } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { usePositions } from "@/lib/positions-context";
import { handleSwapSuccess as createPositionFromSwap, type SwapTransactionData, type SwapTokens } from "@/lib/swap-position-handler";

// Re-exports for backward compatibility
export { Button } from "@/components/ui/Button";
export { Icon } from "@/components/ui/Icon";
export { Card } from "@/components/ui/Card";

// Define the tokens needed for the Buy component
const ETH_TOKEN: Token = {
  name: 'Ethereum',
  address: '', // Native token, no address
  symbol: 'ETH',
  decimals: 18,
  image: '/eth.png',
  chainId: 8453,
};

const WBTC_TOKEN: Token = {
    name: 'Wrapped BTC',
    address: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c', // Address for WBTC on Base
    symbol: 'WBTC',
    decimals: 8,
    image: '/wbtc.png',
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

const TOKEN_MAP: { [key: string]: Token } = {
  ETH: ETH_TOKEN,
  WBTC: WBTC_TOKEN,
};

// --- Popover Component ---
type PopoverProps = {
  trigger: ReactNode;
  children: ReactNode;
};

function Popover({ trigger, children }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <div onClick={handleToggle} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute right-0 z-10 w-64 mt-2 origin-top-right bg-[var(--app-gray)] border border-[var(--app-card-border)] rounded-md shadow-lg">
          <div className="p-3 text-sm text-[var(--app-foreground-muted)]">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function Home() {
  // Simplified state management - app is ready when this component renders
  const [isConnected] = useState(true); // App is ready, wallet will be handled by Swap component
  const [isLoading, setIsLoading] = useState(false);
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [swapKey, setSwapKey] = useState(0);
  const [swapSuccessMessage, setSwapSuccessMessage] = useState<string | null>(null);
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);

  // Get positions context for auto-managing positions
  const { openPosition, closePosition, positions } = usePositions();

  useEffect(() => {
    // Si el usuario no está conectado, resetea el componente Swap y los datos de predicción.
    if (!isConnected) {
      setSwapKey(prevKey => prevKey + 1);
      setPredictionData(null);
    }
  }, [isConnected]);

  // Handle successful swap - delegate to position handler (NON-BLOCKING)
  const handleSwapSuccess = async (transactionData: SwapTransactionData) => {
    // CRITICAL: This function must NEVER interfere with the swap completion
    // The swap is already successful at this point - we just enhance the UX

    // Prevent multiple executions
    if (isCreatingPosition) {
      console.log("🔄 Position management already in progress, skipping...");
      return;
    }

    setIsCreatingPosition(true);

    // Show immediate success message (swap completed successfully)
    setSwapSuccessMessage("✅ Swap completed successfully!");

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSwapSuccessMessage(null);
    }, 3000);

    // Delegate position management to the dedicated handler
    const tokens: SwapTokens = {
      fromSymbol: fromToken.symbol,
      toSymbol: toToken.symbol,
    };

    // Helper to get open positions
    const getOpenPositions = () => {
      return positions
        .filter(p => p.status === "OPEN")
        .map(p => ({ id: p.id, openedAt: p.openedAt }));
    };

    await createPositionFromSwap(
      transactionData,
      tokens,
      openPosition,
      closePosition,
      getOpenPositions,
      // Success callback
      () => {
        const isBuySwap = tokens.fromSymbol === 'USDC' && tokens.toSymbol === 'ETH';
        const isSellSwap = tokens.fromSymbol === 'ETH' && tokens.toSymbol === 'USDC';

        if (isBuySwap) {
          setSwapSuccessMessage("✅ Swap completed! BUY position automatically created in Position Tracker.");
        } else if (isSellSwap) {
          setSwapSuccessMessage("✅ Swap completed! Position automatically closed in Position Tracker.");
        }

        setTimeout(() => {
          setSwapSuccessMessage(null);
        }, 5000);
        setIsCreatingPosition(false);
      },
      // Error callback (silent - don't show to user)
      (error: string) => {
        console.warn("Position management failed (non-critical):", error);
        // Don't show error to user - swap was successful
        setIsCreatingPosition(false);
      }
    );
  };

  // Handle swap error
  const handleSwapError = (error: Error | string | unknown) => {
    console.error("Swap failed:", error);
    setError("Swap failed. Please try again.");
  };

  /**
   * Handles the click event for the "Run Prediction" button.
   * It calls the prediction API and updates the component's state.
   */
  const handleRunPrediction = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not defined in .env.local");
      }

      // DOCS: This `fetch` call targets the URL specified in the `NEXT_PUBLIC_API_URL`
      // environment variable. Because this component is a Client Component ("use client"),
      // this request is made directly from the user's browser, not from the Next.js server.
      //
      // - If NEXT_PUBLIC_API_URL is an absolute URL (e.g., https://api.example.com),
      //   the browser calls that external endpoint directly.
      // - If it were a relative path (e.g., /api/prediction), the browser would call the
      //   Next.js API route at `app/api/prediction/route.ts` on the same domain.
      const response = await fetch(apiUrl, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: PredictionResponse = await response.json();

      // Reset the Swap component when prediction changes
      if (predictionData && data.prediction !== predictionData.prediction) {
        setSwapKey(prevKey => prevKey + 1);
      }

      setPredictionData(data);
    } catch (err) {
      let friendlyErrorMessage = 'An unknown error occurred.';
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        friendlyErrorMessage = 'Could not connect to the prediction service. Please check your internet connection and try again.';
      } else if (err instanceof Error) {
        friendlyErrorMessage = err.message;
      }
      setError(friendlyErrorMessage);
      console.error(err); // Log the original error for debugging
    } finally {
      setIsLoading(false);
    }
  };

  // Enable swap when prediction is available
  const isSwapDisabled = !isConnected || !predictionData;

  const targetToken = predictionData?.tokenToBuy && TOKEN_MAP[predictionData.tokenToBuy]
                  ? TOKEN_MAP[predictionData.tokenToBuy]
                  : ETH_TOKEN; // Default to ETH if no prediction

  // Initialize swap direction based on prediction (user can change via SwapToggleButton)
  // Positive prediction: suggest BUY (USDC → ETH)
  // Negative prediction: suggest SELL (ETH → USDC)
  const fromToken = predictionData?.prediction === 'negative' ? targetToken : USDC_TOKEN;
  const toToken = predictionData?.prediction === 'negative' ? USDC_TOKEN : targetToken;

  const getOverlayMessage = () => {
    if (!isConnected) {
      return "Connect your wallet to begin.";
    }
    return "Run a prediction to enable swap.";
  };

  return (
    <div className="space-y-6 animate-smooth-in">
      <div className="text-center text-xs text-[var(--app-foreground-muted)]">
        <p>
          Disclaimer: This is an experimental app. All information provided is for informational purposes only and is not financial advice. Use at your own risk.
        </p>
      </div>

      <Card
        title="Trade"
        titleExtra={
          <Popover
            trigger={<Icon name="help-circle" size="sm" className="text-[var(--app-foreground-muted)]" />}
          >
            <p><strong>Get ML-powered swap recommendations.</strong></p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
              <li><strong>BUY signal</strong> → suggests entering the market (USDC → ETH).</li>
              <li><strong>SELL signal</strong> → suggests exiting the market (ETH → USDC).</li>
              <li>You can swap in any direction using the toggle button.</li>
            </ul>
            <p className="mt-2 text-xs italic">Predictions are suggestions based on an 🧠 ML model.</p>
          </Popover>
        }
      >
        <p className="text-[var(--app-foreground-muted)] mb-4">
          🧠 Get ML-powered recommendations, then swap in any direction you prefer!
        </p>
        <p className="text-xs italic text-[var(--app-foreground-muted)] text-center mb-4">
          💡 Predictions are suggestions - you always have the final say.
        </p>
        {!isConnected && (
          <p className="text-[var(--app-foreground-muted)] text-center text-xs" style={{ marginTop: 'var(--space-feedback-top)', marginBottom: 'var(--space-help-bottom)' }}>
            Click the button to get a recommendation for your next action.
          </p>
        )}        

        <Button
          onClick={handleRunPrediction}
          disabled={isLoading || !isConnected}
          className="w-full"
        >
          {isLoading ? 'Running Prediction...' : 'Run Prediction'}
        </Button>

        <div className="text-center flex flex-col justify-center" style={{ height: 'var(--feedback-height)', marginTop: 'var(--space-feedback-top)' }}>
          {error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : predictionData ? (
            <div>
              {predictionData.prediction === 'positive' ? (
                <>
                  <p className="font-bold leading-tight text-green-500">
                    Prediction: BUY Opportunity
                  </p>
                  <p className="text-sm leading-tight text-[var(--app-foreground-muted)]">
                    Good time to enter the market.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold leading-tight text-red-500">
                    Prediction: SELL Opportunity
                  </p>
                  <p className="text-sm leading-tight text-[var(--app-foreground-muted)]">
                    Good time to exit the market.
                  </p>
                </>
              )}
            </div>
          ) : null}
        </div>

          <div className="w-full text-center" style={{ height: 'var(--pointer-height)' }}>
            {!isSwapDisabled && (
              <span style={{ fontSize: 'var(--pointer-font-size)' }}>👇</span>
            )}
          </div>
          <fieldset disabled={isSwapDisabled} className="relative" style={{ marginTop: 'var(--space-swap-top)' }}>
            <Swap
              key={swapKey}
              onSuccess={handleSwapSuccess}
              onError={handleSwapError}
              isSponsored
            >
            <div className="swap-container">
              <div className="relative">
                <SwapAmountInput
                  label="From"
                  token={fromToken}
                  type="from"
                />
              </div>
              {/* SwapToggleButton: always visible, allows user to swap in any direction */}
              <div className="flex justify-center items-center" style={{ margin: 'var(--space-toggle-vertical) 0', minHeight: 'var(--toggle-button-height)' }}>
                <SwapToggleButton />
              </div>
              <div className="relative">
                <SwapAmountInput
                  label="To"
                  token={toToken}
                  type="to"
                />
              </div>
              <SwapButton />
              <SwapMessage />
              <SwapToast />
            </div>
          </Swap>
          {isSwapDisabled && (
            <div className="absolute inset-0 cursor-not-allowed rounded-xl bg-[var(--app-card-bg)] bg-opacity-50" />
          )}
          </fieldset>
        <div style={{ height: 'var(--overlay-helper-height)', marginTop: 'var(--space-overlay-top)' }}>
          {isSwapDisabled ? (
            <p className="text-center text-xs text-[var(--app-foreground-muted)]">
              {getOverlayMessage()}
            </p>
          ) : null}
        </div>
        
        {/* Success message for auto-created position */}
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
