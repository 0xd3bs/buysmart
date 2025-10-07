/**
 * ETH Price API Adapter
 *
 * Unified interface for fetching ETH spot prices with configurable backend.
 * Supports both Coinbase and CoinGecko APIs via NEXT_PUBLIC_API_ETH_SPOT env var.
 *
 * Configuration:
 * - NEXT_PUBLIC_API_ETH_SPOT="coinbase" → Uses Coinbase Spot Price API (default)
 * - NEXT_PUBLIC_API_ETH_SPOT="coingecko" → Uses CoinGecko API
 */

import { getEthSpotPrice as getCoinbaseSpotPrice } from "./coinbase-api";
import {
  getCurrentEthPriceWithTimestamp as getCoinGeckoPrice,
  getEthPriceWithFallback as getCoinGeckoPriceWithFallback
} from "./coingecko-api";

export interface EthPriceData {
  price: number;
  fetched_at: string;
  source: string;
}

type ApiProvider = "coinbase" | "coingecko";

/**
 * Get the configured API provider from environment variable
 * Defaults to "coinbase" if not set or invalid
 */
function getApiProvider(): ApiProvider {
  const provider = process.env.NEXT_PUBLIC_API_ETH_SPOT?.toLowerCase();

  if (provider === "coingecko") {
    return "coingecko";
  }

  return "coinbase"; // Default
}

/**
 * Fetches current ETH-USD spot price using the configured provider
 * @returns Current ETH price in USD with timestamp
 * @throws Error if API request fails
 */
export async function getEthSpotPrice(): Promise<EthPriceData> {
  const provider = getApiProvider();

  console.log(`📊 Fetching ETH spot price from: ${provider.toUpperCase()}`);

  try {
    if (provider === "coingecko") {
      return await getCoinGeckoPrice();
    }

    // Default: Coinbase
    return await getCoinbaseSpotPrice();
  } catch (error) {
    console.error(`Failed to fetch ETH price from ${provider}:`, error);
    throw error;
  }
}

/**
 * Fetches ETH price with fallback support (CoinGecko only)
 * For Coinbase, this just calls getEthSpotPrice since it only supports current prices
 *
 * @param datetime - Optional datetime for historical prices (CoinGecko only)
 * @param manualPrice - Optional manual price override
 * @returns ETH price data with timestamp
 */
export async function getEthPriceWithFallback(
  datetime?: string,
  manualPrice?: number
): Promise<EthPriceData> {
  const provider = getApiProvider();

  // Manual price override works for both providers
  if (manualPrice && manualPrice > 0) {
    return {
      price: manualPrice,
      fetched_at: new Date().toISOString(),
      source: "manual",
    };
  }

  if (provider === "coingecko") {
    // CoinGecko supports historical prices
    return await getCoinGeckoPriceWithFallback(datetime, manualPrice);
  }

  // Coinbase only supports current spot prices
  if (datetime) {
    console.warn("⚠️ Coinbase API does not support historical prices. Using current spot price.");
  }

  return await getCoinbaseSpotPrice();
}

/**
 * Get the current provider name for display purposes
 */
export function getCurrentProvider(): string {
  return getApiProvider().toUpperCase();
}
