"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { usePositions } from "@/lib/positions-context"
import { getEthPriceWithFallback, type PriceWithTimestamp } from "@/lib/coingecko-api"

export function ClosePositionForm() {
  const { positions, closePosition } = usePositions()
  const [selectedPosition, setSelectedPosition] = useState<string>("")
  const [closeDatetime, setCloseDatetime] = useState(() => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  })
  const [fetchedPriceData, setFetchedPriceData] = useState<PriceWithTimestamp | null>(null)
  const [closePrice, setClosePrice] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Filter open positions from context
  
  const handleFetchPrice = async () => {
    setIsLoading(true)
    setError("")
    try {
      const utcDatetime = new Date(closeDatetime).toISOString()
      const priceData = await getEthPriceWithFallback(utcDatetime)
      setFetchedPriceData(priceData)
      setClosePrice(priceData.price.toString())
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
      if (!selectedPosition) {
        throw new Error("Please select a position to close")
      }

      let finalPrice: number
      if (closePrice) {
        finalPrice = Number.parseFloat(closePrice)
        if (isNaN(finalPrice) || finalPrice <= 0) {
          throw new Error("Please enter a valid price")
        }
      } else if (fetchedPriceData) {
        finalPrice = fetchedPriceData.price
      } else {
        throw new Error("Please fetch price or enter manually")
      }

      const utcDatetime = new Date(closeDatetime).toISOString()

      // Use the context to close position (automatically updates UI)
      const closedPosition = await closePosition(selectedPosition, utcDatetime, finalPrice)
      
      if (!closedPosition) {
        throw new Error("Position not found or already closed")
      }

      const localDatetime = new Date(utcDatetime).toLocaleString()
      setSuccess(`Position closed successfully on ${localDatetime}`)
      setSelectedPosition("")
      setClosePrice("")
      setFetchedPriceData(null)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close position")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPositionData = positions.find(p => p.id === selectedPosition)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Select Position */}
      <div>
        <label className="block text-sm font-medium text-[var(--app-foreground)] mb-2">
          Select Position to Close
        </label>
        <select
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--app-card-border)] rounded-lg bg-[var(--app-card-bg)] text-[var(--app-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
          required
        >
          <option value="">Choose a position...</option>
          {positions.map((position) => (
            <option key={position.id} value={position.id}>
              {position.side} @ ${position.priceUsd} - {new Date(position.openedAt).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {selectedPositionData && (
        <div className="p-3 bg-[var(--app-gray)] rounded-lg">
          <p className="text-sm text-[var(--app-foreground-muted)]">
            <strong>Selected:</strong> {selectedPositionData.side} position opened at ${selectedPositionData.priceUsd} on {new Date(selectedPositionData.openedAt).toLocaleString()}
          </p>
        </div>
      )}

      {/* Close Date & Time */}
      <div>
        <label className="block text-sm font-medium text-[var(--app-foreground)] mb-2">
          Close Date & Time
        </label>
        <input
          type="datetime-local"
          value={closeDatetime}
          onChange={(e) => setCloseDatetime(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--app-card-border)] rounded-lg bg-[var(--app-card-bg)] text-[var(--app-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
          required
        />
      </div>

      {/* Close Price */}
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
        disabled={isLoading || !selectedPosition || !closePrice}
        className="w-full"
      >
        {isLoading ? "Closing Position..." : "Close Position"}
      </Button>
    </form>
  )
}
