/**
 * Swap Position Handler
 * 
 * This module handles the automatic creation of positions after successful swaps.
 * It reuses the existing position creation logic from positions-context.tsx
 * to avoid code duplication and ensure consistency.
 */

import { getEthPriceWithFallback } from "@/lib/coingecko-api";

export interface SwapTransactionData {
  price?: number;
  executionPrice?: number;
  fromAmount?: string;
  toAmount?: string;
  [key: string]: unknown;
}

export interface SwapTokens {
  fromSymbol: string;
  toSymbol: string;
}

/**
 * Handles automatic position management after a successful swap
 * - USDC→ETH swaps: Opens a BUY position
 * - ETH→USDC swaps: Closes the oldest OPEN position
 * This function is completely non-blocking and isolated from the swap process
 */
export async function handleSwapSuccess(
  transactionData: SwapTransactionData,
  tokens: SwapTokens,
  openPosition: (input: {
    side: "BUY";
    priceUsd: number;
    amount?: number;
    openedAt?: string;
  }) => Promise<unknown>,
  closePosition: (id: string, closedAt: string, closePriceUsd: number) => Promise<unknown>,
  getOpenPositions: () => { id: string; openedAt: string }[],
  onSuccess?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  // Run in background with a small delay to ensure swap UI is updated
  setTimeout(async () => {
    try {
      console.log("🚀 Starting automatic position management process");
      console.log("📊 Transaction data received:", transactionData);
      console.log("🔄 Swap type check:", tokens);

      const isUSDCToETH = tokens.fromSymbol === 'USDC' && tokens.toSymbol === 'ETH';
      const isETHToUSDC = tokens.fromSymbol === 'ETH' && tokens.toSymbol === 'USDC';

      // Handle BUY swap (USDC → ETH): Create new position
      if (isUSDCToETH) {
        console.log("💰 BUY swap detected - Creating new position");

        const ethPrice = await extractPriceFromSwap(transactionData);

        if (ethPrice <= 0) {
          console.warn("❌ Could not determine ETH price from swap data");
          onError?.("Could not determine ETH price");
          return;
        }

        console.log("✅ Creating BUY position with price:", ethPrice);

        const transactionTimestamp = extractTransactionTimestamp(transactionData);

        const position = await openPosition({
          side: "BUY",
          priceUsd: ethPrice,
          openedAt: transactionTimestamp,
        });

        console.log("✅ BUY Position created successfully:", position);
        onSuccess?.();
        return;
      }

      // Handle SELL swap (ETH → USDC): Close oldest open position
      if (isETHToUSDC) {
        console.log("📉 SELL swap detected - Closing oldest open position");

        const openPositions = getOpenPositions();

        if (openPositions.length === 0) {
          console.warn("⚠️ No open positions to close");
          onError?.("No open positions available to close");
          return;
        }

        // Find oldest open position (sort by openedAt ascending, take first)
        const oldestPosition = openPositions.sort((a, b) =>
          new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
        )[0];

        console.log("🎯 Found oldest position to close:", oldestPosition.id);

        const ethPrice = await extractPriceFromSwap(transactionData);

        if (ethPrice <= 0) {
          console.warn("❌ Could not determine ETH price from swap data");
          onError?.("Could not determine ETH price");
          return;
        }

        console.log("✅ Closing position with price:", ethPrice);

        const transactionTimestamp = extractTransactionTimestamp(transactionData);

        const closedPosition = await closePosition(
          oldestPosition.id,
          transactionTimestamp,
          ethPrice
        );

        console.log("✅ Position closed successfully:", closedPosition);
        onSuccess?.();
        return;
      }

      // Neither USDC→ETH nor ETH→USDC
      console.log("ℹ️ Not a supported swap type, skipping position management");

    } catch (error) {
      console.error("❌ Failed to manage position from swap:", error);
      onError?.(`Failed to manage position: ${error}`);
    }
  }, 100);
}

/**
 * Extracts ETH price from transaction data
 * Tries multiple methods to get the most accurate price
 * Reuses the same logic as manual position creation
 */
async function extractPriceFromSwap(transactionData: SwapTransactionData): Promise<number> {
  // Method 1: Direct price from transaction
  if (transactionData?.price) {
    console.log("💰 Using transaction price:", transactionData.price);
    return transactionData.price;
  }

  // Method 2: Execution price
  if (transactionData?.executionPrice) {
    console.log("💰 Using execution price:", transactionData.executionPrice);
    return transactionData.executionPrice;
  }

  // Method 3: Calculate from amounts
  if (transactionData?.fromAmount && transactionData?.toAmount) {
    const usdcAmount = parseFloat(transactionData.fromAmount);
    const ethAmount = parseFloat(transactionData.toAmount);
    
    if (ethAmount > 0) {
      const calculatedPrice = usdcAmount / ethAmount;
      console.log("💰 Calculated price from amounts:", { calculatedPrice, usdcAmount, ethAmount });
      return calculatedPrice;
    }
  }

  // Method 4: Fallback to current market price using coingecko-api
  // This reuses the same API logic as manual position creation
  console.log("🔄 Fetching current ETH price as fallback using coingecko-api");
  try {
    const priceData = await getEthPriceWithFallback();
    console.log("💰 Using fallback price from coingecko-api:", priceData.price);
    return priceData.price;
  } catch (priceError) {
    console.warn("❌ Failed to fetch current ETH price using coingecko-api:", priceError);
  }

  return 0;
}

/**
 * Extracts timestamp from transaction data
 * Tries to get the actual transaction timestamp, falls back to current time
 */
function extractTransactionTimestamp(transactionData: SwapTransactionData): string {
  // Try to extract timestamp from transaction data
  if (transactionData?.timestamp && typeof transactionData.timestamp === 'number') {
    // If timestamp is in seconds, convert to milliseconds
    const timestamp = transactionData.timestamp * 1000;
    
    console.log("📅 Using transaction timestamp:", new Date(timestamp).toISOString());
    return new Date(timestamp).toISOString();
  }
  
  // Try to extract from block timestamp if available
  if (transactionData?.blockTimestamp && typeof transactionData.blockTimestamp === 'number') {
    const timestamp = transactionData.blockTimestamp * 1000;
    
    console.log("📅 Using block timestamp:", new Date(timestamp).toISOString());
    return new Date(timestamp).toISOString();
  }
  
  // Fallback to current time (same format as manual position creation)
  const currentTime = new Date().toISOString();
  console.log("📅 Using current time as fallback:", currentTime);
  return currentTime;
}
