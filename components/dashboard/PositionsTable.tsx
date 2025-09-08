"use client"

import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { usePositions } from "@/lib/positions-context"
import type { Position } from "@/lib/positions"
import { formatDuration } from "@/lib/utils"
import { getCurrentEthPriceWithTimestamp } from "@/lib/coingecko-api"
import { useState, useEffect } from "react"

export function PositionsTable() {
  const { positions, isLoading, error, refreshPositions, deletePosition } = usePositions()
  const [currentEthPrice, setCurrentEthPrice] = useState<number | null>(null)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null)
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null)

  // Auto-update prices when component mounts (entering Position Tracker tab)
  useEffect(() => {
    const updatePricesOnMount = async () => {
      try {
        const priceData = await getCurrentEthPriceWithTimestamp()
        setCurrentEthPrice(priceData.price)
        setLastPriceUpdate(priceData.fetched_at)
      } catch (error) {
        console.error("Failed to auto-update prices on mount:", error)
        // Don't show error to user - this is background operation
      }
    }

    // Only auto-update if we have open positions
    const hasOpenPositions = positions.some(position => position.status === "OPEN")
    if (hasOpenPositions) {
      updatePricesOnMount()
    }
  }, [positions]) // Re-run when positions change

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


  // Function to show delete individual position confirmation modal
  const handleDeleteClick = (position: Position) => {
    setPositionToDelete(position)
    setShowDeleteModal(true)
  }

  // Function to delete individual position (after confirmation)
  const handleDeletePosition = async () => {
    if (!positionToDelete) return
    
    setIsDeleting(positionToDelete.id)
    try {
      await deletePosition(positionToDelete.id)
      setShowDeleteModal(false)
      setPositionToDelete(null)
    } catch (error) {
      console.error("Failed to delete position:", error)
    } finally {
      setIsDeleting(null)
    }
  }

  // Function to cancel delete individual position
  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setPositionToDelete(null)
    setIsDeleting(null)
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
    <>
    <Card 
      title="Positions"
      titleExtra={
        <Button
          onClick={handleUpdatePrices}
          disabled={isUpdatingPrices}
          variant="outline"
          size="sm"
          className="p-2"
          icon={<Icon name="refresh-cw" size="sm" />}
          title={isUpdatingPrices ? "Updating prices..." : "Update ETH prices on-demand"}
        >
          {isUpdatingPrices ? "..." : ""}
        </Button>
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
                <div className="ml-3 flex-shrink-0 flex items-center gap-2">
                  {getPerformanceSummary(position)}
                  <Button
                    onClick={() => handleDeleteClick(position)}
                    disabled={isDeleting === position.id}
                    variant="outline"
                    size="sm"
                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    icon={<Icon name="trash-2" size="sm" />}
                    title="Delete position"
                  >
                    {isDeleting === position.id ? "..." : ""}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>


    {/* Delete Individual Position Confirmation Modal */}
    {showDeleteModal && positionToDelete && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-lg">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--app-foreground)]">
                Delete Position
              </h3>
              <p className="text-sm text-[var(--app-foreground-muted)]">
                This action cannot be undone
              </p>
            </div>
          </div>
          
          <p className="text-[var(--app-foreground)] mb-6">
            Are you sure you want to delete this position opened on{' '}
            <strong>{formatDateOnly(positionToDelete.openedAt)} {formatTimeOnly(positionToDelete.openedAt)}</strong>?
            This will permanently remove this position from your trading history.
          </p>
          
          <div className="flex gap-3 justify-end">
            <Button
              onClick={handleCancelDelete}
              variant="outline"
              size="sm"
              disabled={isDeleting === positionToDelete.id}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeletePosition}
              variant="primary"
              size="sm"
              disabled={isDeleting === positionToDelete.id}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              {isDeleting === positionToDelete.id ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}