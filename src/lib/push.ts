import webpush from "web-push";
import type { PushSubscription as DbSubscription } from "@prisma/client";
import { prisma } from "./db";

export function pushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );
}

let initialized = false;
function init() {
  if (initialized || !pushConfigured()) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  initialized = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

// Sendet eine Nachricht; abgelaufene Subscriptions werden aufgeräumt.
export async function sendPush(
  sub: DbSubscription,
  payload: PushPayload
): Promise<boolean> {
  if (!pushConfigured()) return false;
  init();
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await prisma.pushSubscription
        .delete({ where: { id: sub.id } })
        .catch(() => {});
    }
    return false;
  }
}
