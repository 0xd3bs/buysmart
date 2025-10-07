/**
 * Coinbase Spot Price API
 *
 * Fetches current ETH-USD spot price from Coinbase public API
 * Replaces CoinGecko dependency with official Coinbase pricing
 */

export interface CoinbaseSpotPriceResponse {
  data: {
    base: string;
    currency: string;
    amount: string;
  };
}

export interface EthPriceData {
  price: number;
  fetched_at: string;
  source: string;
}

/**
 * Fetches current ETH-USD spot price from Coinbase
 * @returns Current ETH price in USD with timestamp
 * @throws Error if API request fails
 */
export async function getEthSpotPrice(): Promise<EthPriceData> {
  try {
    const response = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh price
    });

    if (!response.ok) {
      throw new Error(`Coinbase API returned status ${response.status}`);
    }

    const data: CoinbaseSpotPriceResponse = await response.json();

    if (!data.data?.amount) {
      throw new Error('Invalid response structure from Coinbase API');
    }

    const price = parseFloat(data.data.amount);

    if (isNaN(price) || price <= 0) {
      throw new Error('Invalid price received from Coinbase API');
    }

    return {
      price,
      fetched_at: new Date().toISOString(),
      source: 'coinbase_spot',
    };
  } catch (error) {
    console.error('Failed to fetch ETH spot price from Coinbase:', error);
    throw new Error('Failed to fetch current ETH price');
  }
}
