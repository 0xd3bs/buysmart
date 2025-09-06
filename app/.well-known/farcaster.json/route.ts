// app/.well-known/farcaster.json/route.ts
function withValidProperties(properties: Record<string, undefined | string | string[] | boolean>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'boolean') {
        return true; // Incluir valores boolean
      }
      return !!value;
    })
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL as string;
  return Response.json({
    accountAssociation: {
      header: process.env.NEXT_FARCASTER_HEADER,
      payload: process.env.NEXT_FARCASTER_PAYLOAD,
      signature: process.env.NEXT_FARCASTER_SIGNATURE,
    },
    baseBuilder: {
      allowedAddresses: [process.env.NEXT_BASE_BUILDER_ADDRESS]
    },
    frame: withValidProperties({
      version: '1',
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
      homeUrl: URL,
      iconUrl: process.env.NEXT_PUBLIC_APP_ICON,
      splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
      primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY,
      tags: process.env.NEXT_PUBLIC_APP_TAGS?.split(',') || [],
      // Campos opcionales pero recomendados
      subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE,
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      webhookUrl: `${URL}/api/webhook`,
      heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
      tagline: process.env.NEXT_PUBLIC_APP_TAGLINE,
      ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE,
      ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION,
      ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE,
      screenshotUrls: [`${URL}/screenshot.png`],
      noindex: false,
    }),
  });
}