import webPush, { type WebPushError } from "web-push";
import { getAppConfig } from "../config/app-config.js";
import type {
  PushNotificationPayload,
  PushSendSummary,
  PushSubscriptionPayload,
} from "../domain/push.js";

const subscriptions = new Map<string, PushSubscriptionPayload>();

export function getVapidPublicKey() {
  console.debug({ getAppConfig: getAppConfig() });
  return getAppConfig().vapid.publicKey;
}

export function savePushSubscription(subscription: PushSubscriptionPayload) {
  subscriptions.set(subscription.endpoint, subscription);

  return {
    subscriptionCount: subscriptions.size,
  };
}

export function getPushSubscriptionCount() {
  return subscriptions.size;
}

export function clearPushSubscriptions() {
  subscriptions.clear();
}

export async function sendPushNotification(
  payload: PushNotificationPayload,
): Promise<PushSendSummary> {
  const config = getAppConfig();

  if (!config.vapid.publicKey || !config.vapid.privateKey) {
    throw new Error("VAPID keys are not configured");
  }

  webPush.setVapidDetails(
    config.vapid.subject,
    config.vapid.publicKey,
    config.vapid.privateKey,
  );

  const notification = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;
  const entries = Array.from(subscriptions.entries());

  await Promise.all(
    entries.map(async ([endpoint, subscription]) => {
      try {
        await webPush.sendNotification(subscription, notification);
        sent += 1;
      } catch (error) {
        if (isExpiredSubscriptionError(error)) {
          subscriptions.delete(endpoint);
          removed += 1;
          return;
        }

        throw error;
      }
    }),
  );

  return {
    attempted: entries.length,
    sent,
    removed,
  };
}

function isExpiredSubscriptionError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    ((error as WebPushError).statusCode === 404 ||
      (error as WebPushError).statusCode === 410)
  );
}
