// Temporarily disabled - requires viem and notification services
// import {
//   setUserNotificationDetails,
//   deleteUserNotificationDetails,
// } from "@/lib/notification";
// import { sendFrameNotification } from "@/lib/notification-client";

// Temporarily disabled - requires viem
async function verifyFidOwnership(fid: number, appKey: `0x${string}`) {
  // Simplified verification for now
  console.log("FID verification temporarily disabled:", { fid, appKey });
  return true; // Allow all requests for now
}

function decode(encoded: string) {
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
}

export async function POST(request: Request) {
  const requestJson = await request.json();

  const { header: encodedHeader, payload: encodedPayload } = requestJson;

  const headerData = decode(encodedHeader);
  const event = decode(encodedPayload);

  const { fid, key } = headerData;

  const valid = await verifyFidOwnership(fid, key);

  if (!valid) {
    return Response.json(
      { success: false, error: "Invalid FID ownership" },
      { status: 401 },
    );
  }

  switch (event.event) {
    case "frame_added":
      console.log(
        "frame_added",
        "event.notificationDetails",
        event.notificationDetails,
      );
      // Temporarily disabled notification services
      break;
    case "frame_removed": {
      console.log("frame_removed");
      // Temporarily disabled notification services
      break;
    }
    case "notifications_enabled": {
      console.log("notifications_enabled", event.notificationDetails);
      // Temporarily disabled notification services
      break;
    }
    case "notifications_disabled": {
      console.log("notifications_disabled");
      // Temporarily disabled notification services
      break;
    }
  }

  return Response.json({ success: true });
}
