"use client"

import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { usePositions } from "@/lib/positions-context"
import type { Position } from "@/lib/positions"
import { formatDuration } from "@/lib/utils"
import { getCurrentEthPriceWithTimestamp } from "@/lib/coingecko-api"
import { useState } from "react"

export function PositionsTable() {
  const { positions, isLoading, error, refreshPositions, deletePosition } = usePositions()
  const [currentEthPrice, setCurrentEthPrice] = useState<number | null>(null)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null)
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Function to update current ETH price manually
  const handleUpdatePrices = async () => {
    setIsUpdatingPrices(true)
    try {
      const priceData = await getCurrentEthPriceWithTimestamp()
      setCurrentEthPrice(priceData.price)
      setLastPriceUpdate(priceData.fetched_at)
    } catch (error) {
      console.error("Failed to update prices:", error)
    } finally {
      setIsUpdatingPrices(false)
    }
  }

  // Function to delete all positions
  const handleDeleteAllPositions = async () => {
    if (!confirm("Are you sure you want to delete ALL positions? This action cannot be undone.")) {
      return
    }
    
    setIsDeleting("all")
    try {
      // Delete all positions one by one
      for (const position of positions) {
        await deletePosition(position.id)
      }
    } catch (error) {
      console.error("Failed to delete all positions:", error)
    } finally {
      setIsDeleting(null)
    }
  }


  // Status badge removed - status is now implicit from Open/Close columns

  const calculateDuration = (position: Position): string => {
    try {
      const openedAt = new Date(position.openedAt)
      const closedAt = position.closedAt ? new Date(position.closedAt) : new Date()
      
      if (isNaN(openedAt.getTime()) || isNaN(closedAt.getTime())) {
        return "-"
      }
      
      const durationHours = (closedAt.getTime() - openedAt.getTime()) / (1000 * 60 * 60)
      
      if (durationHours < 0) {
        return "-"
      }
      
      return formatDuration(durationHours)
    } catch {
      return "-"
    }
  }

  const formatPercentage = (percentage: number) => {
    const formatted = percentage.toFixed(2)
    return percentage > 0 ? `+${formatted}%` : `${formatted}%`
  }

  const getVariationColor = (variation: number) => {
    if (variation > 0) return "text-green-600"
    if (variation < 0) return "text-red-600"
    return "text-[var(--app-foreground-muted)]"
  }

  const formatDateOnly = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Invalid Date"
      }
      
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    } catch {
      return "Invalid Date"
    }
  }

  const formatTimeOnly = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Invalid Time"
      }
      
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      })
    } catch {
      return "Invalid Time"
    }
  }

  // 🎯 OPTIMIZED: Performance function for mobile card layout
  const getPerformanceSummary = (position: Position) => {
    const duration = calculateDuration(position)
    
    // For closed positions, show stored P&L
    if (position.status === "CLOSED" && position.profitLossPercent !== undefined) {
      const variationColor = getVariationColor(position.profitLossPercent)
      return (
        <div className="text-right">
          <div className="text-xs text-[var(--app-foreground-muted)]">
            {duration}
          </div>
          <div className={`text-sm font-semibold ${variationColor}`}>
            {formatPercentage(position.profitLossPercent)}
          </div>
        </div>
      )
    }
    
    // For open positions, calculate real-time P&L if we have current price
    if (position.status === "OPEN" && currentEthPrice) {
      const currentPnL = currentEthPrice - position.priceUsd
      const currentPnLPercent = (currentPnL / position.priceUsd) * 100
      const variationColor = getVariationColor(currentPnLPercent)
      
      return (
        <div className="text-right">
          <div className="text-xs text-[var(--app-foreground-muted)]">
            {duration}
          </div>
          <div className={`text-sm font-semibold ${variationColor}`}>
            {formatPercentage(currentPnLPercent)}
          </div>
        </div>
      )
    }
    
    // Fallback for open positions without current price
    if (position.status === "OPEN") {
      return (
        <div className="text-right">
          <div className="text-xs text-[var(--app-foreground-muted)]">
            {duration}
          </div>
          <div className="text-xs text-[var(--app-foreground-muted)]">
            Update prices
          </div>
        </div>
      )
    }
    
    return <span className="text-[var(--app-foreground-muted)] text-xs">-</span>
  }



  if (isLoading) {
    return (
      <Card title="Trading Positions">
        <div className="text-center py-8">
          <p className="text-[var(--app-foreground-muted)]">Loading positions...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card title="Trading Positions">
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={refreshPositions} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card 
      title="Positions"
      titleExtra={
        <div className="flex items-center gap-1">
          {positions.length > 0 && (
            <Button
              onClick={handleDeleteAllPositions}
              disabled={isDeleting === "all"}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50 p-2"
              icon={<Icon name="trash-2" size="sm" />}
              title="Delete all positions"
            >
              {isDeleting === "all" ? "..." : ""}
            </Button>
          )}
          <Button
            onClick={handleUpdatePrices}
            disabled={isUpdatingPrices}
            variant="outline"
            size="sm"
            className="p-2"
            icon={<Icon name="refresh-cw" size="sm" />}
            title={isUpdatingPrices ? "Updating prices..." : "Update current ETH prices"}
          >
            {isUpdatingPrices ? "..." : ""}
          </Button>
        </div>
      }
    >
      {positions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--app-foreground-muted)]">
            No positions found. Open a new position to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Last update info - moved inside card for better mobile layout */}
          {lastPriceUpdate && (
            <div className="text-xs text-[var(--app-foreground-muted)] text-center pb-2 border-b border-[var(--app-card-border)]">
              Last price update: {new Date(lastPriceUpdate).toLocaleTimeString()}
            </div>
          )}
          
          {/* 🎯 MOBILE-FIRST: Card-based layout instead of table */}
          {positions.map((position) => (
            <div key={position.id} className="bg-[var(--app-card)] border border-[var(--app-card-border)] rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--app-foreground)] mb-1">
                    {formatDateOnly(position.openedAt)} {formatTimeOnly(position.openedAt)}
                  </div>
                  <div className="text-xs text-[var(--app-foreground-muted)]">
                    {position.closedAt ? `Closed: ${formatDateOnly(position.closedAt)} ${formatTimeOnly(position.closedAt)}` : 'Open Position'}
                  </div>
                </div>
                <div className="ml-3 flex-shrink-0">
                  {getPerformanceSummary(position)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}