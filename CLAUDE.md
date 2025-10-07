# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Base MiniApp built with Next.js 15 that provides ML-driven crypto buy/sell recommendations and integrates OnchainKit for swap functionality. The app allows users to execute swaps based on predictions:
- **Positive prediction (BUY)**: USDC → ETH swap, automatically opens a BUY position
- **Negative prediction (SELL)**: ETH → USDC swap, automatically closes the oldest open position

All positions are tracked in localStorage and displayed in the Position Tracker dashboard.

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Clean project (removes node_modules, .next, etc.)
pnpm clean
```

## Architecture

### Core Application Flow

1. **Initialization**: `app/providers.tsx` wraps the app in `MiniKitProvider` configured for Base mainnet (chain ID 8453)
2. **Layout**: `app/layout.tsx` sets up Farcaster Frame metadata and global styles
3. **Main App**: `app/page.tsx` handles frame readiness, wallet connectivity, and tab navigation between Trade and Position Tracker
4. **Position Management**: `lib/positions-context.tsx` provides React Context for managing positions across the app

### Key Components

- **Home (Trade Tab)**: `app/components/Components.tsx` - Contains prediction logic and OnchainKit Swap component
- **Dashboard (Position Tracker Tab)**: `components/dashboard/Dashboard.tsx` with sub-components:
  - `PositionsTable.tsx` - Displays open/closed positions with real-time P&L using Coinbase spot prices

### Data Storage Architecture

The app uses a **dual storage system**:

1. **Client-side (localStorage)**:
   - Implementation: `lib/storage.ts` with adapter pattern
   - Used by: Position tracking via `lib/positions-context.tsx`
   - Storage key: `cbc_positions_v1.0`

2. **Server-side (in-memory, demo only)**:
   - Implementation: `lib/positions.ts`
   - Used by: API endpoints in `app/api/positions/`
   - Note: This is in-memory and not persisted; replace with Redis/DB for production

### Swap-to-Position Integration

The app automatically manages positions based on swap direction:

**BUY Flow (USDC → ETH)**:
- Automatically creates a new BUY position
- Records entry price from swap data

**SELL Flow (ETH → USDC)**:
- Automatically closes the oldest open position
- Records exit price and calculates profit/loss

- Handler: `lib/swap-position-handler.ts`
- Price extraction: Calculated from actual swap amounts (fromAmount/toAmount). Throws error if amounts unavailable.
- Integration point: `app/components/Components.tsx` (Home component's `onSuccess` callback)

### External APIs

- **Coinbase Spot Price**: `lib/coinbase-api.ts` - Current ETH-USD spot price fetching
- **Prediction API**: `app/api/prediction/route.ts` - Mock ML prediction (returns random positive/negative)

## TypeScript Configuration

- Path alias: `@/*` maps to project root
- Target: ES2017
- Strict mode enabled
- Next.js plugin integrated

## Styling

- **Tailwind CSS**: Configured in `tailwind.config.ts`
- **CSS Custom Properties**: Defined in `app/theme.css` (Mini App theme variables)
- **Global styles**: `app/globals.css`

## OnchainKit Integration

### Tokens
Configured in `app/components/Components.tsx`:
- ETH (native token, no address)
- WBTC: `0x0555E30da8f98308EdB960aa94C0Db47230d2B9c`
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Swap Component
Uses OnchainKit's `<Swap>` with `SwapAmountInput`, `SwapButton`, `SwapMessage`, and `SwapToast`.

## Environment Variables

Required variables in `.env.local`:

```bash
# Prediction API
NEXT_PUBLIC_API_URL=/api/prediction

# OnchainKit
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID=
NEXT_PUBLIC_ONCHAINKIT_API_KEY=

# Frame metadata
NEXT_PUBLIC_URL=
NEXT_PUBLIC_APP_ICON=
NEXT_PUBLIC_APP_SUBTITLE=
NEXT_PUBLIC_APP_DESCRIPTION=
NEXT_PUBLIC_APP_SPLASH_IMAGE=
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=
NEXT_PUBLIC_APP_PRIMARY_CATEGORY=
NEXT_PUBLIC_APP_HERO_IMAGE=
NEXT_PUBLIC_APP_TAGLINE=
NEXT_PUBLIC_APP_OG_TITLE=
NEXT_PUBLIC_APP_OG_DESCRIPTION=
NEXT_PUBLIC_APP_OG_IMAGE=

# Redis (for future production use)
REDIS_URL=
REDIS_TOKEN=
```

## Important Implementation Notes

### Position Types
Both BUY and SELL positions are supported (`PositionSide = "BUY" | "SELL"`). The data model includes `closePriceUsd`, `profitLoss`, and `profitLossPercent` calculated when positions are closed.

**Profit/Loss Calculation**:
- BUY positions: `profit = closePrice - openPrice` (profit when price increases)
- SELL positions: `profit = openPrice - closePrice` (profit when price decreases)

Note: Currently, SELL swaps close existing positions rather than opening new SELL positions.

### Webpack Optimizations
`next.config.mjs` includes:
- External packages: `pino-pretty`, `lokijs`, `encoding`
- Bundle splitting for OnchainKit components
- Console removal in production
- Unoptimized images for mobile/MiniApps

### Frame Ready State
The app uses a loading state pattern with delayed wallet content rendering (500ms) to prevent basename flickering.

### Notification System
`lib/notification.ts` and `lib/notification-client.ts` handle in-app notifications (implementation details in those files).

## Key Files to Review Before Changes

- Position logic changes: Review both `lib/positions.ts` (server) and `lib/positions-context.tsx` (client)
- Swap integration: Check `lib/swap-position-handler.ts` for automatic position creation
- Storage changes: Understand adapter pattern in `lib/storage.ts` before modifying
- API changes: Note that `app/api/positions/` uses in-memory storage while client uses localStorage
