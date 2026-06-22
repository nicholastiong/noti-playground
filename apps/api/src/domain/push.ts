export type PushSubscriptionKeys = {
  auth: string;
  p256dh: string;
};

export type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys: PushSubscriptionKeys;
};

export type PushNotificationPayload = {
  title: string;
  body: string;
};

export type PushSendSummary = {
  attempted: number;
  sent: number;
  removed: number;
};
