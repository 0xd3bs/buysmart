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
 * Handles automatic position management after a successful swap with symmetric logic
 *
 * USDC→ETH (BUY swap):
 *   - If SELL positions exist: closes the oldest SELL position
 *   - Otherwise: opens a new BUY position
 *
 * ETH→USDC (SELL swap):
 *   - If BUY positions exist: closes the oldest BUY position
 *   - Otherwise: opens a new SELL position
 *
 * This function is completely non-blocking and isolated from the swap process
 */
export async function handleSwapSuccess(
  transactionData: SwapTransactionData,
  tokens: SwapTokens,
  openPosition: (input: {
    side: "BUY" | "SELL";
    priceUsd: number;
    amount?: number;
    openedAt?: string;
  }) => Promise<unknown>,
  closePosition: (id: string, closedAt: string, closePriceUsd: number) => Promise<unknown>,
  getOpenPositions: () => { id: string; openedAt: string; side: "BUY" | "SELL" }[],
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

      const ethPrice = await extractPriceFromSwap(transactionData);

      if (ethPrice <= 0) {
        console.warn("❌ Could not determine ETH price from swap data");
        onError?.("Could not determine ETH price");
        return;
      }

      const transactionTimestamp = extractTransactionTimestamp(transactionData);

      // Handle BUY swap (USDC → ETH): Close SELL position OR open BUY position
      if (isUSDCToETH) {
        console.log("💰 BUY swap detected (USDC → ETH)");

        const openPositions = getOpenPositions();
        const openSellPositions = openPositions.filter(p => p.side === 'SELL');

        // If there are open SELL positions, close the oldest one
        if (openSellPositions.length > 0) {
          const oldestSellPosition = openSellPositions.sort((a, b) =>
            new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
          )[0];

          console.log("🎯 Closing oldest SELL position:", oldestSellPosition.id);

          const closedPosition = await closePosition(
            oldestSellPosition.id,
            transactionTimestamp,
            ethPrice
          );

          console.log("✅ SELL position closed successfully:", closedPosition);
          onSuccess?.();
          return;
        }

        // Otherwise, open a new BUY position
        console.log("✅ Creating new BUY position with price:", ethPrice);

        const position = await openPosition({
          side: "BUY",
          priceUsd: ethPrice,
          openedAt: transactionTimestamp,
        });

        console.log("✅ BUY position created successfully:", position);
        onSuccess?.();
        return;
      }

      // Handle SELL swap (ETH → USDC): Close BUY position OR open SELL position
      if (isETHToUSDC) {
        console.log("📉 SELL swap detected (ETH → USDC)");

        const openPositions = getOpenPositions();
        const openBuyPositions = openPositions.filter(p => p.side === 'BUY');

        // If there are open BUY positions, close the oldest one
        if (openBuyPositions.length > 0) {
          const oldestBuyPosition = openBuyPositions.sort((a, b) =>
            new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
          )[0];

          console.log("🎯 Closing oldest BUY position:", oldestBuyPosition.id);

          const closedPosition = await closePosition(
            oldestBuyPosition.id,
            transactionTimestamp,
            ethPrice
          );

          console.log("✅ BUY position closed successfully:", closedPosition);
          onSuccess?.();
          return;
        }

        // Otherwise, open a new SELL position
        console.log("✅ Creating new SELL position with price:", ethPrice);

        const position = await openPosition({
          side: "SELL",
          priceUsd: ethPrice,
          openedAt: transactionTimestamp,
        });

        console.log("✅ SELL position created successfully:", position);
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
