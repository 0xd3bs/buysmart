"use client"

import { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Tabs } from "@/components/ui/Tabs"
import { OpenPositionForm } from "./OpenPositionForm"
import { ClosePositionForm } from "./ClosePositionForm"
// PositionSimulator removed

export function PositionManager() {
  const [activeTab, setActiveTab] = useState("open")

  return (
    <Card title="Position Management">
      <p className="text-sm text-[var(--app-foreground-muted)] mb-4">
        Open new BUY positions or close existing ones
      </p>
      <Tabs
        items={[
          { key: "open", label: "Open Position" },
          { key: "close", label: "Close Position" },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
      <div className="mt-4">
        {activeTab === "open" && <OpenPositionForm />}
        {activeTab === "close" && <ClosePositionForm />}
      </div>
    </Card>
  )
}
