"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./rewards.module.css";

type Rewards = { balance: number; reward: number | null; day: string; nextAt: string };
const segments = [
  { points: 50, angle: 117, color: "#177758" },
  { points: 100, angle: 279, color: "#285278" },
  { points: 200, angle: 342, color: "#966321" },
];

export default function DailyRewards() {
  const [rewards, setRewards] = useState<Rewards | null>(null);
  const [store, setStore] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const wheel = useRef<HTMLDivElement>(null);
  const spin = useRef<Animation | null>(null);
  const requestInFlight = useRef(false);

  const load = useCallback(async (day?: string) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: window.Telegram?.WebApp?.initData, day }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (day && day === result.day && result.reward !== null && wheel.current?.animate &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const segment = segments.find(item => item.points === result.reward);
        if (segment) {
          const animation = wheel.current.animate(
            [{ transform: "rotate(0deg)" }, { transform: `rotate(${2160 - segment.angle}deg)` }],
            { duration: 3200, fill: "forwards", easing: "cubic-bezier(0.14, 0.72, 0.20, 1)" },
          );
          spin.current = animation;
          await animation.finished.catch(() => {});
        }
      }
      setRewards(result);
      setSeconds(Math.max(0, Math.ceil((Date.parse(result.nextAt) - Date.now()) / 1000)));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Couldn't load NiceWins points.");
    } finally {
      requestInFlight.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    spin.current?.cancel();
    spin.current = null;
  }, [rewards]);

  const nextAt = rewards?.nextAt;
  useEffect(() => {
    if (!nextAt) return;
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((Date.parse(nextAt) - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0 && !requestInFlight.current) {
        window.clearInterval(interval);
        void load();
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [load, nextAt]);

  const countdown = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(value => String(value).padStart(2, "0")).join(":");

  return (
    <section className={styles.panel} aria-label="NiceWins rewards">
      <p className={styles.balance} role="status">
        NiceWins points <strong>{rewards ? rewards.balance.toLocaleString() : "—"}</strong>
      </p>
      <details>
        <summary className={styles.summary}>Bonus Wheel</summary>
        <nav className={styles.navigation} aria-label="Rewards sections">
          <button type="button" aria-pressed={!store} disabled={busy} onClick={() => setStore(false)}>Daily Wheel</button>
          <button type="button" aria-pressed={store} disabled={busy} onClick={() => setStore(true)}>Store</button>
        </nav>
        {error && <p role="alert">{error} <button type="button" onClick={() => void load()}>Refresh</button></p>}
        {store ? (
          <p>Point redemption is coming soon.</p>
        ) : rewards && (
          <>
            <div className={styles.wheelFrame} aria-hidden="true">
              <div className={styles.pointer} />
              <div ref={wheel} className={styles.wheel} style={{
                transform: `rotate(${-(segments.find(segment => segment.points === rewards.reward)?.angle ?? 0)}deg)`,
              }}>
                {segments.map(segment => (
                  <span key={segment.points} className={styles.wheelLabel}
                    style={{
                      background: segment.color,
                      transform: `rotate(${segment.angle}deg) translateY(-145%) rotate(${-segment.angle}deg)`,
                    }}>
                    {segment.points}
                  </span>
                ))}
              </div>
            </div>
            <p className={styles.odds}>50 pts · 65% &nbsp; 100 pts · 25% &nbsp; 200 pts · 10%</p>
            {rewards.reward === null ? (
              <button type="button" disabled={busy} onClick={() => void load(rewards.day)}>
                {busy ? "Spinning…" : "Spin the wheel"}
              </button>
            ) : (
              <>
                <p role="status" className={styles.reward}>You earned {rewards.reward} points!</p>
                <p>Next spin in {countdown}</p>
              </>
            )}
          </>
        )}
      </details>
      {!rewards && busy && <p role="status">Loading points…</p>}
    </section>
  );
}
