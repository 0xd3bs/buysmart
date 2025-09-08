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
 * Handles automatic position creation after a successful swap
 * This function is completely non-blocking and isolated from the swap process
 * It reuses the existing openPosition function from positions-context.tsx
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
  onSuccess?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  // Run in background with a small delay to ensure swap UI is updated
  setTimeout(async () => {
    try {
      console.log("🚀 Starting automatic position creation process");
      console.log("📊 Transaction data received:", transactionData);
      console.log("🔄 Swap type check:", tokens);

      // Only create position for USDC -> ETH swaps (BUY positions)
      const isUSDCToETH = tokens.fromSymbol === 'USDC' && tokens.toSymbol === 'ETH';
      
      if (!isUSDCToETH) {
        console.log("ℹ️ Not a USDC -> ETH swap, skipping position creation");
        return;
      }

      // Extract price information from transaction data
      const ethPrice = await extractPriceFromSwap(transactionData);
      
      if (ethPrice <= 0) {
        console.warn("❌ Could not determine ETH price from swap data");
        onError?.("Could not determine ETH price");
        return;
      }

      console.log("✅ Creating position with price:", ethPrice);
      
      // Extract timestamp from transaction data or use current time
      // This ensures consistency with manual position creation format
      const transactionTimestamp = extractTransactionTimestamp(transactionData);
      
      // Use the existing openPosition function from positions-context.tsx
      // This ensures consistency with manual position creation
      const position = await openPosition({
        side: "BUY",
        priceUsd: ethPrice,
        openedAt: transactionTimestamp,
      });

      console.log("✅ Position created successfully:", position);
      onSuccess?.();
      
    } catch (error) {
      console.error("❌ Failed to create position from swap:", error);
      onError?.(`Failed to create position: ${error}`);
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
