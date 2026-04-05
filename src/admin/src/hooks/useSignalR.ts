/**
 * SignalR hook for the Admin PWA.
 *
 * Connects to /hubs/presence with the owner Bearer token.
 * Joins the "admin" group to receive live VisitorsUpdated broadcasts.
 * Auto-reconnects with exponential backoff (built into SignalR client).
 *
 * Returns `activeVisitors` — refreshed in real time whenever the hub pushes an update.
 */

import * as signalR from "@microsoft/signalr";
import { useEffect, useState } from "react";
import { getAccessToken } from "../services/authService";

export interface ActiveVisitor {
  fingerprint: string;
  currentPage: string;
  visitCount: number;
  countryCode: string | null;
  lastSeenAt: string;
}

const HUB_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/hubs/presence`;

export function useSignalR() {
  const [activeVisitors, setActiveVisitors] = useState<ActiveVisitor[]>([]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getAccessToken() ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("VisitorsUpdated", (visitors: ActiveVisitor[]) => {
      setActiveVisitors(visitors ?? []);
    });

    connection.start().then(() => {
      connection.invoke("JoinAdminGroup").catch(console.error);
    }).catch(console.error);

    return () => { connection.stop(); };
  }, []);

  return { activeVisitors };
}
