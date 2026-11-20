"use client";

import { useEffect, useState } from "react";

declare global {
interface Window {
Telegram?: {
WebApp: {
initData: string;
};
};
}
}

export default function AdminPage() {
const [data, setData] = useState<any>(null);
const [error, setError] = useState("Betöltés...");

useEffect(() => {
async function load() {
const initData = window.Telegram?.WebApp?.initData;


JavaScript
  if (!initData) {
    setError("Nyisd meg Telegramon keresztül.");
    return;
  }

  try {
    const response = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData })
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error);

    setData(result);
    setError("");
  } catch {
    setError("Nincs adminisztrátori hozzáférés.");
  }
}

load();
}, []);

if (error) {
return <main style={{ padding: 25 }}>{error}</main>;
}

if (!data) return <main style={{ padding: 25 }}>Betöltés...</main>;

return (
<main style={{ maxWidth: 520, margin: "auto", padding: 22 }}>
<h1>NiceWins Admin</h1>


TypeScript
  <section style={card}>
    <p>Összes partner</p>
    <h1>{data.partners}</h1>
  </section>

  <h2>Affiliate statisztikák</h2>

  {data.offers.map((offer: any) => (
    <section key={offer.name} style={card}>
      <h3>{offer.name}</h3>
      <p>Kattintások: {offer.clicks}</p>
      <p>Állapot: {offer.active ? "Aktív" : "Inaktív"}</p>
    </section>
  ))}

  <p style={{ color: "#9EAFBE", fontSize: 12 }}>
    NiceWins Admin
  </p>
</main>
);
}

const card: React.CSSProperties = {
background: "#1C2937",
padding: 20,
borderRadius: 14,
marginBottom: 15
};
