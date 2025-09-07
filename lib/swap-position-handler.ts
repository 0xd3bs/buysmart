/**
 * Swap Position Handler
 * 
 * This module handles the automatic creation of positions after successful swaps.
 * It's completely decoupled from the main swap component to maintain separation of concerns.
 */

import { PositionSide, type Position } from "@/lib/positions";

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

export interface PositionCreationResult {
  success: boolean;
  position?: Position;
  error?: string;
  price?: number;
}

/**
 * Handles automatic position creation after a successful swap
 * This function is completely non-blocking and isolated from the swap process
 */
export class SwapPositionHandler {
  private openPosition: (input: { 
    side: PositionSide; 
    priceUsd: number; 
    amount?: number; 
    openedAt?: string; 
  }) => Promise<Position>;

  constructor(openPositionFunction: (input: { 
    side: PositionSide; 
    priceUsd: number; 
    amount?: number; 
    openedAt?: string; 
  }) => Promise<Position>) {
    this.openPosition = openPositionFunction;
  }

  /**
   * Main handler for successful swaps
   * This runs completely in the background and never interferes with the swap
   */
  async handleSwapSuccess(
    transactionData: SwapTransactionData,
    tokens: SwapTokens,
    onSuccess?: (result: PositionCreationResult) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    // Run in background with a small delay to ensure swap UI is updated
    setTimeout(async () => {
      try {
        console.log("🚀 Starting automatic position creation process");
        console.log("📊 Transaction data received:", transactionData);
        console.log("🔄 Swap type check:", tokens);

        const result = await this.createPositionFromSwap(transactionData, tokens);
        
        if (result.success) {
          console.log("✅ Position created successfully:", result.position);
          onSuccess?.(result);
        } else {
          console.warn("❌ Position creation failed:", result.error);
          onError?.(result.error || "Unknown error");
        }
      } catch (error) {
        const errorMessage = `Failed to create position from swap: ${error}`;
        console.error("❌ Unexpected error in position creation:", error);
        onError?.(errorMessage);
      }
    }, 100);
  }

  /**
   * Creates a position from swap data
   * Only creates positions for USDC -> ETH swaps (BUY positions)
   */
  private async createPositionFromSwap(
    transactionData: SwapTransactionData,
    tokens: SwapTokens
  ): Promise<PositionCreationResult> {
    // Only create position for USDC -> ETH swaps (BUY positions)
    const isUSDCToETH = tokens.fromSymbol === 'USDC' && tokens.toSymbol === 'ETH';
    
    if (!isUSDCToETH) {
      console.log("ℹ️ Not a USDC -> ETH swap, skipping position creation");
      return { success: false, error: "Not a USDC -> ETH swap" };
    }

    // Extract price information from transaction data
    const ethPrice = await this.extractPrice(transactionData);
    
    if (ethPrice <= 0) {
      console.warn("❌ Could not determine ETH price from swap data");
      return { success: false, error: "Could not determine ETH price" };
    }

    try {
      console.log("✅ Creating position with price:", ethPrice);
      const position = await this.openPosition({
        side: "BUY",
        priceUsd: ethPrice,
        openedAt: new Date().toISOString(),
      });

      return { success: true, position, price: ethPrice };
    } catch (error) {
      console.error("❌ Failed to create position:", error);
      return { success: false, error: `Failed to create position: ${error}` };
    }
  }

  /**
   * Extracts ETH price from transaction data
   * Tries multiple methods to get the most accurate price
   */
  private async extractPrice(transactionData: SwapTransactionData): Promise<number> {
    let ethPrice = 0;

    // Method 1: Direct price from transaction
    if (transactionData?.price) {
      ethPrice = transactionData.price;
      console.log("💰 Using transaction price:", ethPrice);
      return ethPrice;
    }

    // Method 2: Execution price
    if (transactionData?.executionPrice) {
      ethPrice = transactionData.executionPrice;
      console.log("💰 Using execution price:", ethPrice);
      return ethPrice;
    }

    // Method 3: Calculate from amounts
    if (transactionData?.fromAmount && transactionData?.toAmount) {
      const usdcAmount = parseFloat(transactionData.fromAmount);
      const ethAmount = parseFloat(transactionData.toAmount);
      
      if (ethAmount > 0) {
        ethPrice = usdcAmount / ethAmount;
        console.log("💰 Calculated price from amounts:", { ethPrice, usdcAmount, ethAmount });
        return ethPrice;
      }
    }

    // Method 4: Fallback to current market price
    console.log("🔄 Fetching current ETH price as fallback");
    try {
      const response = await fetch('/api/coingecko/current-price');
      if (response.ok) {
        const priceData = await response.json() as { price: number };
        ethPrice = priceData.price;
        console.log("💰 Using fallback price:", ethPrice);
        return ethPrice;
      } else {
        console.warn("❌ Failed to fetch price - response not ok:", response.status);
      }
    } catch (priceError) {
      console.warn("❌ Failed to fetch current ETH price:", priceError);
    }

    return 0;
  }
}

/**
 * Factory function to create a position handler instance
 */
export function createSwapPositionHandler(
  openPositionFunction: (input: { 
    side: PositionSide; 
    priceUsd: number; 
    amount?: number; 
    openedAt?: string; 
  }) => Promise<Position>
): SwapPositionHandler {
  return new SwapPositionHandler(openPositionFunction);
}
