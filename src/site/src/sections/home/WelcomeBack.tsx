/**
 * WelcomeBack — React island hydrated on page load.
 *
 * Calls fingerprint.ts after the component mounts (client-side only).
 * If the API reports the visitor is returning, renders a subtle personalisation message.
 *
 * JS cost: ~14 KB gzipped (FingerprintJS OSS, shared with fingerprint.ts).
 * Justified: personalization uplift on repeat visits.
 *
 * Respects prefers-reduced-motion (no animation when set).
 */

import { useEffect, useState } from "react";
import { identify } from "../../services/fingerprint";
import { startPresence } from "../../services/presence";
import styles from "./WelcomeBack.module.css";

export default function WelcomeBack() {
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    identify().then((result) => {
      if (result?.returning) setReturning(true);
    });
  }, []);

  if (!returning) return null;

  return (
    <p className={styles.welcomeBack} aria-live="polite">
      welcome back ✦
    </p>
  );
}
