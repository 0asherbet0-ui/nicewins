"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import styles from "./rewards.module.css";

type Rewards = { balance: number; reward: number | null; day: string; nextAt: string };
const width = 320;
const height = 112;

function ScratchCard({ claim, busy }: { claim: () => void; busy: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const context = canvas.current?.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.globalCompositeOperation = "source-over";
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#e7cb84");
    gradient.addColorStop(1, "#a87d37");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#21180d";
    context.textAlign = "center";
    context.font = "bold 19px system-ui";
    context.fillText("Scratch here", width / 2, 64);
    context.globalCompositeOperation = "destination-out";
    context.lineWidth = 30;
    context.lineCap = "round";
  }, []);

  function scratch(event: PointerEvent<HTMLCanvasElement>) {
    if (busy || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = {
      x: (event.clientX - bounds.left) * width / bounds.width,
      y: (event.clientY - bounds.top) * height / bounds.height,
    };
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    context.beginPath();
    context.moveTo(last.current?.x ?? point.x - 0.1, last.current?.y ?? point.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    last.current = point;
    const { data } = context.getImageData(0, 0, width, height);
    let cleared = 0;
    for (let offset = 3; offset < data.length; offset += 16) {
      if (data[offset] === 0) cleared++;
    }
    if (cleared >= width * height * 0.35 / 4) claim();
  }

  return (
    <>
      <div className={styles.ticket}>
        <span aria-hidden="true">Daily reward</span>
        <canvas ref={canvas} width={width} height={height} aria-hidden="true"
          onPointerDown={event => {
            if (busy || !event.isPrimary || event.button !== 0) return;
            last.current = null;
            event.currentTarget.setPointerCapture(event.pointerId);
            scratch(event);
          }}
          onPointerMove={scratch}
          onLostPointerCapture={() => { last.current = null; }} />
      </div>
      <button type="button" disabled={busy} onClick={claim}>
        {busy ? "Revealing…" : "Reveal reward"}
      </button>
    </>
  );
}

export default function DailyRewards() {
  const [rewards, setRewards] = useState<Rewards | null>(null);
  const [store, setStore] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
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
      <nav className={styles.navigation} aria-label="Rewards sections">
        <button type="button" aria-pressed={!store} onClick={() => setStore(false)}>Daily Scratch</button>
        <button type="button" aria-pressed={store} onClick={() => setStore(true)}>Store</button>
      </nav>
      {error && <p role="alert">{error} <button type="button" onClick={() => void load()}>Refresh</button></p>}
      {store ? (
        <p>Point redemption is coming soon.</p>
      ) : rewards && (
        rewards.reward === null ? (
          <ScratchCard key={rewards.day} busy={busy} claim={() => void load(rewards.day)} />
        ) : (
          <>
            <p role="status" className={styles.reward}>You earned {rewards.reward} points!</p>
            <p>Next scratch in {countdown}</p>
          </>
        )
      )}
      {!rewards && busy && <p role="status">Loading points…</p>}
    </section>
  );
}
