import type { Metadata } from "next";
import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
    openGraph: {
      title: process.env.NEXT_PUBLIC_APP_SUBTITLE,
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      images: process.env.NEXT_PUBLIC_APP_OG_IMAGE,
      url: process.env.NEXT_PUBLIC_URL,
      siteName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME
    },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}