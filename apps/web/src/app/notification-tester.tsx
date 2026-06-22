"use client";

import { FormEvent, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/config";

type PermissionStateLabel = NotificationPermission | "unsupported";

type SendSummary = {
  attempted: number;
  sent: number;
  removed: number;
};

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function NotificationTester() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [permission, setPermission] = useState<PermissionStateLabel>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    return Notification.permission;
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [title, setTitle] = useState("Hello from noti-playground");
  const [body, setBody] = useState("This notification was sent through VAPID.");
  const [status, setStatus] = useState("Ready to subscribe this browser.");
  const [isBusy, setIsBusy] = useState(false);
  const [sendSummary, setSendSummary] = useState<SendSummary | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  async function enableNotifications() {
    if (!isSupported) {
      setStatus("This browser does not support Web Push notifications.");
      return;
    }

    setIsBusy(true);
    setSendSummary(null);

    try {
      const requestedPermission = await Notification.requestPermission();
      setPermission(requestedPermission);

      if (requestedPermission !== "granted") {
        setStatus("Notification permission was not granted.");
        return;
      }

      const keyResponse = await fetch(`${apiBaseUrl}/push/vapid-public-key`);

      if (!keyResponse.ok) {
        throw new Error("Could not load VAPID public key.");
      }

      const { publicKey } = (await keyResponse.json()) as { publicKey: string };


      if (!publicKey) {
        throw new Error("The API has no VAPID public key configured.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existingSubscription =
        await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const subscriptionResponse = await fetch(
        `${apiBaseUrl}/push/subscriptions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription.toJSON()),
        },
      );

      if (!subscriptionResponse.ok) {
        throw new Error("Could not save the push subscription.");
      }

      setIsSubscribed(true);
      setStatus("This browser is subscribed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Subscription failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function sendNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setSendSummary(null);

    try {
      const response = await fetch(`${apiBaseUrl}/push/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not send the notification.");
      }

      const summary = (await response.json()) as SendSummary;
      setSendSummary(summary);
      setStatus("Push send completed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Send failed.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-10">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          noti-playground
        </p>
        <h1 className="text-4xl font-semibold text-slate-950">
          Web Push tester
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-700">
          Subscribe this browser, then trigger a VAPID-backed notification from
          the Fastify API.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatusItem label="API" value={apiBaseUrl} />
        <StatusItem label="Permission" value={permission} />
        <StatusItem
          label="Subscription"
          value={isSubscribed ? "subscribed" : "not subscribed"}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Browser subscription
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{status}</p>
          </div>
          <button
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isBusy || !isSupported}
            type="button"
            onClick={enableNotifications}
          >
            Enable notifications
          </button>
        </div>
      </section>

      <form
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={sendNotification}
      >
        <h2 className="text-base font-semibold text-slate-950">
          Send notification
        </h2>

        <label className="mt-5 block text-sm font-medium text-slate-700">
          Title
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Body
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-base text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isBusy}
            type="submit"
          >
            Send push
          </button>
          {sendSummary ? (
            <p className="text-sm text-slate-600">
              Attempted {sendSummary.attempted}, sent {sendSummary.sent},
              removed {sendSummary.removed}.
            </p>
          ) : null}
        </div>
      </form>
    </main>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-slate-950">
        {value}
      </p>
    </div>
  );
}
