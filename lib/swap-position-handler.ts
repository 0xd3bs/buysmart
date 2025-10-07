/**
 * Swap Position Handler
 *
 * This module handles the automatic creation of positions after successful swaps.
 * It reuses the existing position creation logic from positions-context.tsx
 * to avoid code duplication and ensure consistency.
 */

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
export interface PositionAction {
  action: "opened" | "closed";
  side: "BUY" | "SELL";
}

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
  onSuccess?: (action: PositionAction) => void,
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

      const ethPrice = await extractPriceFromSwap(transactionData, tokens);

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
          onSuccess?.({ action: "closed", side: "SELL" });
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
        onSuccess?.({ action: "opened", side: "BUY" });
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
          onSuccess?.({ action: "closed", side: "BUY" });
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
        onSuccess?.({ action: "opened", side: "SELL" });
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
 * Extracts ETH price from swap transaction
 * Calculates exact price from actual swap amounts (includes slippage, fees, etc.)
 * Throws error if amounts are not available - no fallback to external APIs
 */
async function extractPriceFromSwap(transactionData: SwapTransactionData, tokens: SwapTokens): Promise<number> {
  // Calculate exact price from swap amounts
  if (transactionData?.fromAmount && transactionData?.toAmount) {
    const fromAmount = parseFloat(transactionData.fromAmount);
    const toAmount = parseFloat(transactionData.toAmount);

    // Determine which is USDC and which is ETH based on token symbols
    const isUSDCToETH = tokens.fromSymbol === 'USDC' && tokens.toSymbol === 'ETH';
    const isETHToUSDC = tokens.fromSymbol === 'ETH' && tokens.toSymbol === 'USDC';

    if (isUSDCToETH && toAmount > 0) {
      // USDC→ETH: price = USDC amount / ETH amount
      const exactPrice = fromAmount / toAmount;
      console.log("💰 Exact swap price (USDC→ETH):", {
        usdcAmount: fromAmount,
        ethAmount: toAmount,
        pricePerETH: exactPrice
      });
      return exactPrice;
    }

    if (isETHToUSDC && fromAmount > 0) {
      // ETH→USDC: price = USDC amount / ETH amount
      const exactPrice = toAmount / fromAmount;
      console.log("💰 Exact swap price (ETH→USDC):", {
        ethAmount: fromAmount,
        usdcAmount: toAmount,
        pricePerETH: exactPrice
      });
      return exactPrice;
    }
  }

  // No fallback - if we can't extract price from swap, it's an error
  console.error("❌ Swap amounts not available in transaction data");
  throw new Error("Could not determine ETH price from swap transaction. Missing fromAmount or toAmount.");
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
