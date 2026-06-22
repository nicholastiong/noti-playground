import webPush from "web-push";
import { buildApp } from "../app.js";
import {
  clearPushSubscriptions,
  getPushSubscriptionCount,
} from "../services/push-service.js";

vi.mock("web-push", () => {
  return {
    default: {
      sendNotification: vi.fn(),
      setVapidDetails: vi.fn(),
    },
  };
});

const subscription = {
  endpoint: "https://push.example.test/subscription/1",
  expirationTime: null,
  keys: {
    auth: "auth-secret",
    p256dh: "public-key",
  },
};

describe("push routes", () => {
  beforeEach(() => {
    vi.stubEnv("VAPID_PUBLIC_KEY", "test-public-key");
    vi.stubEnv("VAPID_PRIVATE_KEY", "test-private-key");
    vi.mocked(webPush.sendNotification).mockResolvedValue({
      statusCode: 201,
      body: "",
      headers: {},
    });
    clearPushSubscriptions();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns the configured VAPID public key", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/push/vapid-public-key",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      publicKey: "test-public-key",
    });

    await app.close();
  });

  it("stores a push subscription", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/push/subscriptions",
      payload: subscription,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      subscriptionCount: 1,
    });
    expect(getPushSubscriptionCount()).toBe(1);

    await app.close();
  });

  it("rejects invalid push subscriptions", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/push/subscriptions",
      payload: {
        endpoint: "not-a-url",
        keys: {
          auth: "",
          p256dh: "",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(getPushSubscriptionCount()).toBe(0);

    await app.close();
  });

  it("sends a push notification to stored subscriptions", async () => {
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/push/subscriptions",
      payload: subscription,
    });

    const response = await app.inject({
      method: "POST",
      url: "/push/send",
      payload: {
        title: "Hello",
        body: "From the test suite",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      attempted: 1,
      sent: 1,
      removed: 0,
    });
    expect(webPush.setVapidDetails).toHaveBeenCalledWith(
      "mailto:dev@noti-playground.local",
      "test-public-key",
      "test-private-key",
    );
    expect(webPush.sendNotification).toHaveBeenCalledWith(
      subscription,
      JSON.stringify({
        title: "Hello",
        body: "From the test suite",
      }),
    );

    await app.close();
  });

  it("removes expired subscriptions when sending", async () => {
    vi.mocked(webPush.sendNotification).mockRejectedValueOnce({
      statusCode: 410,
    });
    const app = buildApp();

    await app.inject({
      method: "POST",
      url: "/push/subscriptions",
      payload: subscription,
    });

    const response = await app.inject({
      method: "POST",
      url: "/push/send",
      payload: {},
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      attempted: 1,
      sent: 0,
      removed: 1,
    });
    expect(getPushSubscriptionCount()).toBe(0);

    await app.close();
  });

  it("rejects invalid send payloads", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/push/send",
      payload: {
        title: "",
        body: "",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(webPush.sendNotification).not.toHaveBeenCalled();

    await app.close();
  });
});
