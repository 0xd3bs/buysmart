import { NextRequest, NextResponse } from "next/server";
import { listPositions, openPosition, closePosition } from "@/lib/positions";

export async function GET() {
  try {
    const positions = listPositions();
    return NextResponse.json(positions);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "open") {
      const position = openPosition(data);
      return NextResponse.json(position);
    } else if (action === "close") {
      const { id, closePriceUsd, closedAt } = data;
      if (!id || !closePriceUsd || !closedAt) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
      const position = closePosition(id, closedAt, closePriceUsd);
      if (!position) {
        return NextResponse.json(
          { error: "Position not found or already closed" },
          { status: 404 }
        );
      }
      return NextResponse.json(position);
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to process position" },
      { status: 500 }
    );
  }
}
