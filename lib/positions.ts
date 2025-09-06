export type PositionSide = "BUY";
export type PositionStatus = "OPEN" | "CLOSED";

export interface Position {
  id: string;
  side: PositionSide;
  priceUsd: number;
  closePriceUsd?: number;
  amount?: number;
  openedAt: string; // ISO date string
  closedAt?: string; // ISO date string
  status: PositionStatus;
  profitLoss?: number;
  profitLossPercent?: number;
}

// In-memory store (demo only). Replace with Redis/DB in production.
const positions: Position[] = [];

export function listPositions(): Position[] {
  return positions.slice().sort((a, b) => (a.openedAt < b.openedAt ? 1 : -1));
}

export function openPosition(input: {
  side: PositionSide;
  priceUsd: number;
  amount?: number;
  openedAt?: string;
}): Position {
  const position: Position = {
    id: crypto.randomUUID(),
    side: input.side,
    priceUsd: input.priceUsd,
    amount: input.amount,
    openedAt: input.openedAt ?? new Date().toISOString(),
    status: "OPEN",
  };
  positions.push(position);
  return position;
}

export function closePosition(id: string, closedAt: string, closePriceUsd: number): Position | null {
  const position = positions.find(p => p.id === id && p.status === "OPEN")
  if (!position) return null

  position.status = "CLOSED"
  position.closedAt = closedAt
  position.closePriceUsd = closePriceUsd
  
  // Calculate profit/loss - only BUY positions supported
  position.profitLoss = closePriceUsd - position.priceUsd
  position.profitLossPercent = ((closePriceUsd - position.priceUsd) / position.priceUsd) * 100
  
  return position
}


