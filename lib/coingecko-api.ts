// CoinGecko API integration for ETH price data
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"

export interface EthPrice {
  ethereum: {
    usd: number
    usd_24h_change: number
  }
}

export interface HistoricalPrice {
  id: string
  symbol: string
  name: string
  market_data: {
    current_price: {
      usd: number
    }
  }
}

export interface PriceWithTimestamp {
  price: number
  fetched_at: string // UTC timestamp when API was called
  source: "coingecko_current" | "coingecko_historical" | "manual"
}

// Get current ETH price
export async function getCurrentEthPrice(): Promise<number> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 60 } }, // Cache for 1 minute
    )

    if (!response.ok) {
      throw new Error("Failed to fetch current price")
    }

    const data: EthPrice = await response.json()
    return data.ethereum.usd
  } catch (error) {
    console.error("Error fetching current ETH price:", error)
    throw error
  }
}

export async function getCurrentEthPriceWithTimestamp(): Promise<PriceWithTimestamp> {
  const fetchTime = new Date().toISOString() // UTC timestamp

  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 60 } },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch current price")
    }

    const data: EthPrice = await response.json()
    return {
      price: data.ethereum.usd,
      fetched_at: fetchTime,
      source: "coingecko_current",
    }
  } catch (error) {
    console.error("Error fetching current ETH price:", error)
    throw error
  }
}

// Get historical ETH price for a specific date
export async function getHistoricalEthPrice(date: string): Promise<number> {
  try {
    // Format date as DD-MM-YYYY for CoinGecko API
    const [year, month, day] = date.split("-")
    const formattedDate = `${day}-${month}-${year}`

    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/ethereum/history?date=${formattedDate}`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error("Failed to fetch historical price")
    }

    const data: HistoricalPrice = await response.json()
    return data.market_data.current_price.usd
  } catch (error) {
    console.error("Error fetching historical ETH price:", error)
    throw error
  }
}

export async function getHistoricalEthPriceWithTimestamp(date: string): Promise<PriceWithTimestamp> {
  const fetchTime = new Date().toISOString() // UTC timestamp

  try {
    // Manually convert YYYY-MM-DD to DD-MM-YYYY format
    const [year, month, day] = date.split("-")
    const formattedDate = `${day}-${month}-${year}`

    const url = `${COINGECKO_BASE_URL}/coins/ethereum/history?date=${formattedDate}`
    const response = await fetch(url, { next: { revalidate: 3600 } })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: HistoricalPrice = await response.json()

    if (!data.market_data || !data.market_data.current_price || !data.market_data.current_price.usd) {
      throw new Error("Invalid response structure from CoinGecko API")
    }

    return {
      price: data.market_data.current_price.usd,
      fetched_at: fetchTime,
      source: "coingecko_historical",
    }
  } catch (error) {
    console.error("Error fetching historical ETH price:", error)
    throw error
  }
}

export async function getEthPriceWithFallback(datetime?: string, manualPrice?: number): Promise<PriceWithTimestamp> {
  if (manualPrice && manualPrice > 0) {
    return {
      price: manualPrice,
      fetched_at: new Date().toISOString(),
      source: "manual",
    }
  }

  try {
    if (datetime) {
      const transactionDate = new Date(datetime)
      const today = new Date()
      const oneHourAgo = new Date(today.getTime() - 60 * 60 * 1000)

      if (transactionDate < oneHourAgo) {
        // Use historical API for past transactions
        const dateString = transactionDate.toISOString().split("T")[0]
        return await getHistoricalEthPriceWithTimestamp(dateString)
      } else {
        // Use current API for recent transactions
        return await getCurrentEthPriceWithTimestamp()
      }
    } else {
      // No datetime provided, use current price
      return await getCurrentEthPriceWithTimestamp()
    }
  } catch (error) {
    console.error("CoinGecko API failed, manual entry required:", error)
    throw new Error("API_FAILED")
  }
}
