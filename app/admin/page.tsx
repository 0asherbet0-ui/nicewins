"use client";

import { useEffect, useState } from "react";


type CampaignStats = {
  opens: { campaign: string; count: number }[];
  clicks: { campaign: string; offer_id: string; name: string; count: number }[];
};

type AdminStats = {
  partners: number;
  offers: { id: string; name: string; active: boolean; clicks: number }[];
  campaigns: CampaignStats;
};

export default function AdminPage() {
const [data, setData] = useState<AdminStats | null>(null);
const [error, setError] = useState("Betöltés...");

useEffect(() => {
async function load() {
const initData = window.Telegram?.WebApp?.initData;


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
    setError("Az adminstatisztikák betöltése nem sikerült.");
  }
}

load();
}, []);

if (error) {
return <main style={{ padding: 25 }}>{error}</main>;
}

if (!data) return <main style={{ padding: 25 }}>Betöltés...</main>;

const { opens, clicks } = data.campaigns;
const campaigns = Array.from(new Set([...opens, ...clicks].map(row => row.campaign))).sort();

return (
<main style={{ maxWidth: 520, margin: "auto", padding: 22 }}>
<h1>NiceWins Admin</h1>


  <section style={card}>
    <p>Összes partner</p>
    <h1>{data.partners}</h1>
  </section>

  <h2>Affiliate statisztikák</h2>

  {data.offers.map((offer) => (
    <section key={offer.id} style={card}>
      <h3>{offer.name}</h3>
      <p>Kattintások: {offer.clicks}</p>
      <p>Állapot: {offer.active ? "Aktív" : "Inaktív"}</p>
    </section>
  ))}

  <h2>Telegram-posztok statisztikái</h2>
  {campaigns.length === 0 && <p>Még nincs mért kampányforgalom.</p>}
  {campaigns.map(campaign => (
    <section key={campaign} style={card}>
      <h3>{campaign}</h3>
      <p>Appmegnyitások: {opens.find(row => row.campaign === campaign)?.count ?? 0}</p>
      <p>Ajánlatkattintások:</p>
      <ul>
        {data.offers.map(offer => (
          <li key={offer.id}>
            {offer.name} — {clicks.find(row => row.campaign === campaign && row.offer_id === offer.id)?.count ?? 0}
          </li>
        ))}
      </ul>
    </section>
  ))}
</main>
);
}

const card: React.CSSProperties = {
background: "#1C2937",
padding: 20,
borderRadius: 14,
marginBottom: 15
};
