// Temporarily disabled - requires @farcaster/frame-sdk and @upstash/redis
// import type { MiniAppNotificationDetails } from "@farcaster/frame-sdk";
// import { redis } from "./redis";

// Temporarily disabled notification functions
export async function getUserNotificationDetails(): Promise<unknown> {
  console.log("Notification service temporarily disabled");
  return null;
}

export async function setUserNotificationDetails(): Promise<void> {
  console.log("Notification service temporarily disabled");
}

export async function deleteUserNotificationDetails(): Promise<void> {
  console.log("Notification service temporarily disabled");
}