# Buy or Sell? - A Base Mini App

This project is a "Mini App" for the Base blockchain that provides users with a simple, ML-driven recommendation: whether it's a good time to **buy**, **sell**. It's built with the [MiniKit](https://docs.base.org/builderkits/minikit/overview) template for [Next.js](https://nextjs.org) and integrates [OnchainKit](https://www.base.org/builders/onchainkit) for wallet interactions and swaps.

The application's core feature is a prediction engine that analyzes market conditions (currently simulated) and advises the user on their next move.

## Core Features

-   **🧠 ML-Powered Predictions:** A backend endpoint simulates a machine learning model to provide a "BUY" or "SELL" signal.
-   **🔄 Integrated Crypto Swaps:** Utilizes the OnchainKit `<Swap />` component to allow users to instantly buy crypto (`ETH`) with `USDC` when a "BUY" opportunity is identified, or sell crypto for `USDC` when a "SELL" signal is given.
-   **💡 Dynamic UI:** The user interface responds to the prediction, enabling or disabling the swap functionality and adjusting the labels accordingly.
-   **🔗 Wallet Connectivity:** Uses Wagmi and OnchainKit to seamlessly connect to the user's wallet.
-   **🖼️ Farcaster Frame Ready:** Built on a template that includes all necessary configurations for Farcaster Frame compatibility.

## How It Works

1.  **Connect Wallet:** The user must first connect their wallet to the Base network.
2.  **Run Prediction:** The user clicks the "Run Prediction" button.
3.  **Receive Signal:** The app calls the prediction API.
    -   If the API returns a `positive` prediction, the UI displays a "BUY Opportunity" message, and the swap component is enabled for buying.
    -   If the API returns a `negative` prediction, the UI displays a "SELL Opportunity" message, the swap component is enabled for selling (ETH to USDC).
4.  **Swap (Optional):** If the signal was positive or negative, the user can proceed to swap their tokens directly within the app.

## Getting Started

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Environment Variables:**
    Create a `.env.local` file. The `create-onchain --mini` command sets up most of these. You will need to add the URL for the prediction API. By default, it points to the local mock API.

    ```bash
    # The URL for the prediction API endpoint
    # Point this to your live prediction server or use the local mock API.
    NEXT_PUBLIC_API_URL=/api/prediction

    # Shared/OnchainKit variables
    NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
    NEXT_PUBLIC_URL=
    NEXT_PUBLIC_ICON_URL=
    NEXT_PUBLIC_ONCHAINKIT_API_KEY=

    # Frame metadata
    FARCASTER_HEADER=
    FARCASTER_PAYLOAD=
    FARCASTER_SIGNATURE=
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

    # Redis config
    REDIS_URL=
    REDIS_TOKEN=
    ```

3.  **Start the development server:**
    ```bash
    pnpm dev
    ```

## Key Files for Customization

-   **Frontend Logic:** `app/components/Components.tsx` contains the main React component, state management, and UI for the prediction and swap functionality.
-   **Mock API:** `app/api/prediction/route.ts` is the mock server endpoint that simulates the ML model's response. You can modify this to test different scenarios or connect to a real backend.
-   **Type Definitions:** `lib/types.ts` defines the TypeScript interface for the API response.
-   **Styling:** `app/globals.css` and `app/theme.css` control the application's appearance.

## Learn More

-   [MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
-   [OnchainKit Documentation](https://docs.base.org/builderkits/onchainkit/getting-started)
-   [Next.js Documentation](https://nextjs.org/docs)
-   [Tailwind CSS Documentation](https://tailwindcss.com/docs)