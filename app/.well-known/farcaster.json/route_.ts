function withValidProperties(
  properties: Record<string, undefined | string | string[]>,
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    }),
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL || "https://mini-app-cbc.vercel.app/";

  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER || "eyJmaWQiOjgwNDM2NywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEMwZDU3Y0MzZkMzNTU2RTlFNTMwYUUyRmUyMTA5RUVFNkQwNDBCNDcifQ",
      payload: process.env.FARCASTER_PAYLOAD || "eyJkb21haW4iOiJtaW5pLWFwcC1jYmMudmVyY2VsLmFwcCJ9",
      signature: process.env.FARCASTER_SIGNATURE || "MHhiYmM5YjNlNGFlMTY2OGI5NzU0NTUzMTA5NzA1MWUyNzY1YmIxODE2MTE0ZmFjMWRkZTAxYzAzNDExNDQ0MzQyNDczZTE0MzNhMGQ5MDg4OTViY2Q3MmY5OTI3M2MxYThmMDgzNzMwYTc5ZmZkMTc4Zjk4NzJjZmJjMmNlMGVjYjFi",
    },
    baseBuilder: {
      allowedAddresses: ["0x9bA213D3d8C113804B0656D3eaA29e3774215d04"],
    },
    frame: withValidProperties({
      version: "1",
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "smart-swap",
      subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || "smartswap - ml-driven",
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "smartswap - ml-driven",
      screenshotUrls: [`${URL}/screenshot.png`],
      iconUrl: `${URL}/icon.png`,
      splashImageUrl: `${URL}/splash.png`,
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#000000",
      homeUrl: URL,
      webhookUrl: `${URL}/api/webhook`,
      primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || "finance",
      tags: ["crypto", "base", "ml", "prediction", "trading"],
      heroImageUrl: `${URL}/hero.png`,
      tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "ml-driven smart swapping",
      ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE || "smart-swap - ml-driven smart swapping",
      ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION,
      ogImageUrl: `${URL}/hero.png`,
      buttonTitle: "Start",
      imageUrl: `${URL}/hero.png`,
    }),
  });
}
