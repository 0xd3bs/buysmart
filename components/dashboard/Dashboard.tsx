"use client";

import { PositionsTable } from "./PositionsTable";

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="text-center text-xs text-[var(--app-foreground-muted)]">
        <p>
          Track your trading positions automatically created from swaps. All positions are managed based on your swap transactions.
        </p>
      </div>

      <PositionsTable />
    </div>
  );
}
