"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { Position, PositionSide } from './positions'
import { storageService } from './storage'

interface PositionsContextType {
  positions: Position[]
  isLoading: boolean
  error: string | null
  refreshPositions: () => Promise<void>
  addPosition: (position: Position) => Promise<void>
  updatePosition: (id: string, updates: Partial<Position>) => Promise<boolean>
  deletePosition: (id: string) => Promise<boolean>
  openPosition: (input: { side: PositionSide; priceUsd: number; amount?: number; openedAt?: string }) => Promise<Position>
  closePosition: (id: string, closedAt: string, closePriceUsd: number) => Promise<Position | null>
}

const PositionsContext = createContext<PositionsContextType | undefined>(undefined)

export function PositionsProvider({ children }: { children: React.ReactNode }) {
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshPositions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const storedPositions = await storageService.getPositions()
      setPositions(storedPositions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load positions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addPosition = useCallback(async (position: Position) => {
    await storageService.addPosition(position)
    await refreshPositions()
  }, [refreshPositions])

  const updatePosition = useCallback(async (id: string, updates: Partial<Position>) => {
    const success = await storageService.updatePosition(id, updates)
    if (success) await refreshPositions()
    return success
  }, [refreshPositions])

  const deletePosition = useCallback(async (id: string) => {
    const success = await storageService.deletePosition(id)
    if (success) await refreshPositions()
    return success
  }, [refreshPositions])

  const openPosition = useCallback(async (input: { side: PositionSide; priceUsd: number; amount?: number; openedAt?: string }) => {
    const position: Position = {
      id: crypto.randomUUID(),
      side: input.side,
      priceUsd: input.priceUsd,
      amount: input.amount,
      openedAt: input.openedAt ?? new Date().toISOString(),
      status: "OPEN",
    }
    await addPosition(position)
    return position
  }, [addPosition])

  const closePosition = useCallback(async (id: string, closedAt: string, closePriceUsd: number) => {
    const position = positions.find(p => p.id === id && p.status === "OPEN")
    if (!position) return null

    const updatedPosition: Position = { ...position, status: "CLOSED", closedAt, closePriceUsd }

    // Only BUY positions supported - calculate profit/loss accordingly
    updatedPosition.profitLoss = closePriceUsd - position.priceUsd
    updatedPosition.profitLossPercent = ((closePriceUsd - position.priceUsd) / position.priceUsd) * 100

    const success = await updatePosition(id, updatedPosition)
    return success ? updatedPosition : null
  }, [positions, updatePosition])

  useEffect(() => { refreshPositions() }, [refreshPositions])

  const contextValue = useMemo(() => ({
    positions,
    isLoading,
    error,
    refreshPositions,
    addPosition,
    updatePosition,
    deletePosition,
    openPosition,
    closePosition
  }), [positions, isLoading, error, refreshPositions, addPosition, updatePosition, deletePosition, openPosition, closePosition])

  return (
    <PositionsContext.Provider value={contextValue}>
      {children}
    </PositionsContext.Provider>
  )
}

export function usePositions() {
  const context = useContext(PositionsContext)
  if (!context) throw new Error('usePositions must be used within a PositionsProvider')
  return context
}
