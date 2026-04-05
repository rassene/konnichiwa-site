/**
 * Web Push subscription hook for the Admin PWA.
 *
 * On first install (or when explicitly called), requests notification permission,
 * registers the service worker, and POSTs the push subscription to
 * PUT /api/admin/push/register.
 *
 * The VAPID public key is read from VITE_VAPID_PUBLIC_KEY env var.
 */

import { useCallback, useEffect, useState } from "react";
import { api } from "../services/authService";

type PushStatus = "idle" | "subscribed" | "denied" | "unsupported";

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePush() {
  const [status, setStatus] = useState<PushStatus>("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      });

      const json = subscription.toJSON() as {
        endpoint: string;
        keys?: { p256dh: string; auth: string };
      };

      await api.put("/api/admin/push/register", {
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        },
      });

      setStatus("subscribed");
    } catch {
      // Non-fatal — push is a convenience feature.
    }
  }, []);

  return { status, subscribe };
}
