"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { usePositions } from "@/lib/positions-context"
import type { PositionSide } from "@/lib/positions"
import { getEthPriceWithFallback, type PriceWithTimestamp } from "@/lib/coingecko-api"

export function OpenPositionForm() {
  const { openPosition } = usePositions()
  // Remove type selection - only BUY positions allowed
  const [openDatetime, setOpenDatetime] = useState(() => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  })
  const [fetchedPriceData, setFetchedPriceData] = useState<PriceWithTimestamp | null>(null)
  const [manualPrice, setManualPrice] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleFetchPrice = async () => {
    setIsLoading(true)
    setError("")
    try {
      const utcDatetime = new Date(openDatetime).toISOString()
      const priceData = await getEthPriceWithFallback(utcDatetime)
      setFetchedPriceData(priceData)
    } catch (err) {
      if (err instanceof Error && err.message === "API_FAILED") {
        setError("CoinGecko API failed. Please enter price manually.")
      } else {
        setError("Failed to fetch price. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      let finalPriceData: PriceWithTimestamp
      if (manualPrice) {
        const price = Number.parseFloat(manualPrice)
        if (isNaN(price) || price <= 0) {
          throw new Error("Please enter a valid price")
        }
        finalPriceData = {
          price,
          fetched_at: new Date().toISOString(),
          source: "manual",
        }
      } else if (fetchedPriceData) {
        finalPriceData = fetchedPriceData
      } else {
        throw new Error("Please fetch price or enter manually")
      }

      const utcDatetime = new Date(openDatetime).toISOString()

      // Use the context to open position (automatically updates UI)
      await openPosition({
        side: "BUY" as PositionSide, // Only BUY positions allowed
        priceUsd: finalPriceData.price,
        openedAt: utcDatetime,
      })

      const localDatetime = new Date(utcDatetime).toLocaleString()
      setSuccess(
        `BUY position opened successfully at $${finalPriceData.price.toLocaleString()} on ${localDatetime}`
      )
      setFetchedPriceData(null)
      setManualPrice("")
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create position")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date & Time */}
      <div>
        <label className="block text-sm font-medium text-[var(--app-foreground)] mb-2">
          Transaction Date & Time
        </label>
        <input
          type="datetime-local"
          value={openDatetime}
          onChange={(e) => setOpenDatetime(e.target.value)}
          max={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
          className="w-full px-3 py-2 border border-[var(--app-card-border)] rounded-lg bg-[var(--app-card-bg)] text-[var(--app-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
          required
        />
        <p className="text-xs text-[var(--app-foreground-muted)] mt-1">
          Select the exact date and time when you made this transaction
        </p>
      </div>

      {/* ETH Price */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFetchPrice}
            disabled={isLoading}
          >
            {isLoading ? "Fetching..." : "Fetch Price"}
          </Button>
        </div>

        {fetchedPriceData && (
          <div className="p-3 bg-[var(--app-gray)] rounded-lg mb-3">
            <p className="text-sm font-medium text-[var(--app-foreground)]">
              Fetched Price: ${fetchedPriceData.price.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--app-foreground-muted)]">
              Source: {fetchedPriceData.source.replace("_", " ")} | Fetched:{" "}
              {new Date(fetchedPriceData.fetched_at).toLocaleString()}
            </p>
            <p className="text-xs text-[var(--app-foreground-muted)]">
              Transaction time: {new Date(openDatetime).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {success && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">{success}</div>
      )}

      <Button
        type="submit"
        disabled={isLoading || (!fetchedPriceData && !manualPrice)}
        className="w-full"
      >
        {isLoading ? "Opening Position..." : `Open Position`}
      </Button>
    </form>
  )
}
