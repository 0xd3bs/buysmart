// Temporarily disabled - requires @farcaster/frame-sdk
// import {
//   MiniAppNotificationDetails,
//   type SendNotificationRequest,
//   sendNotificationResponseSchema,
// } from "@farcaster/frame-sdk";

type SendFrameNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "rate_limit" }
  | { state: "success" };

export async function sendFrameNotification({
  fid,
  title,
  body,
}: {
  fid: number;
  title: string;
  body: string;
  notificationDetails?: unknown | null;
}): Promise<SendFrameNotificationResult> {
  console.log("Notification service temporarily disabled:", { fid, title, body });
  return { state: "no_token" };
}