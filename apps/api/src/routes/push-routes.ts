import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  getVapidPublicKey,
  savePushSubscription,
  sendPushNotification,
} from "../services/push-service.js";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    auth: z.string().min(1),
    p256dh: z.string().min(1),
  }),
});

const sendPushRequestSchema = z.object({
  title: z.string().trim().min(1).default("noti-playground"),
  body: z.string().trim().min(1).default("Test push notification"),
});

const vapidPublicKeyResponseSchema = z.object({
  publicKey: z.string(),
});

const subscriptionResponseSchema = z.object({
  subscriptionCount: z.number().int().nonnegative(),
});

const sendPushResponseSchema = z.object({
  attempted: z.number().int().nonnegative(),
  sent: z.number().int().nonnegative(),
  removed: z.number().int().nonnegative(),
});

export async function registerPushRoutes(app: FastifyInstance) {
  app.get("/push/vapid-public-key", async () => {
    return vapidPublicKeyResponseSchema.parse({
      publicKey: getVapidPublicKey(),
    });
  });

  app.post("/push/subscriptions", async (request, reply) => {
    const parsed = pushSubscriptionSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid push subscription",
      });
    }

    return subscriptionResponseSchema.parse(savePushSubscription(parsed.data));
  });

  app.post("/push/send", async (request, reply) => {
    const parsed = sendPushRequestSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid push notification payload",
      });
    }

    return sendPushResponseSchema.parse(await sendPushNotification(parsed.data));
  });
}
