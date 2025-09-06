"use client";

import { Dashboard } from "@/components/dashboard/Dashboard";

export default function DashboardPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-3">
      <h1 className="text-lg font-semibold mb-3">Position Tracker</h1>
      <Dashboard />
    </div>
  );
}


