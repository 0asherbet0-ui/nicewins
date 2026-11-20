"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Dashboard = {
  profile: { name: string | null; referralCode: string; clicks: number };
  referralUrl: string | null;
  offers: { id: string; name: string }[];
  isAdmin: boolean;
};

export default function Home() {
const [data, setData] = useState<Dashboard | null>(null);
const [error, setError] = useState("");
const [actionStatus, setActionStatus] = useState("");
const [opening, setOpening] = useState(false);

async function openOffer(offerId: string) {
  const app = window.Telegram?.WebApp;
  if (!app || opening) return;

  setOpening(true);
  setActionStatus("");
  try {
    const response = await fetch("/api/clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: app.initData, offerId }),
    });
    if (!response.ok) throw new Error("Click request failed");
    const { url, creditedToViewer } = await response.json();
    if (creditedToViewer) {
      setData(current => current && ({
        ...current, profile: { ...current.profile, clicks: current.profile.clicks + 1 }
      }));
    }
    app.openLink(url);
  } catch {
    setActionStatus("Nem sikerült megnyitni az ajánlatot.");
  } finally {
    setOpening(false);
  }
}

async function copyReferral(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    setActionStatus("Ajánlói link másolva.");
  } catch {
    setActionStatus("Jelöld ki és másold ki az ajánlói linket.");
  }
}

useEffect(() => {
const init = async () => {
const tg = window.Telegram?.WebApp;


  if (!tg?.initData) {
    setError("Nyisd meg a NiceWins alkalmazást Telegramon keresztül.");
    return;
  }

  tg.ready();
  tg.expand();

  try {
    const response = await fetch("/api/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData })
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error);

    setData(result);
  } catch {
    setError("Nem sikerült a belépés. Próbáld újra.");
  }
};

init();
}, []);

if (error) {
return <main style={{ padding: 30 }}>{error}</main>;
}

if (!data) {
return <main style={{ padding: 30 }}>NiceWins betöltése...</main>;
}

return (
<main style={{ maxWidth: 520, margin: "auto", padding: 22 }}>
<header style={{ marginBottom: 30 }}>
<h1 style={{ fontSize: 32 }}>NiceWins</h1>
<p style={{ color: "#9EAFBE" }}>
Üdvözlünk, {data.profile.name || "Partner"}!
</p>
</header>


  <section style={card}>
    <p style={{ color: "#AAB9C6" }}>Saját kattintásaid</p>
    <h1 style={{ fontSize: 38 }}>
      {data.profile.clicks}
    </h1>
  </section>

  <section style={{ ...card, marginTop: 15 }}>
    <h3>Saját ajánlókód</h3>
    <p>{data.profile.referralCode}</p>
    {data.referralUrl ? (
      <>
        <input aria-label="Ajánlói link" value={data.referralUrl} readOnly
          onFocus={event => event.currentTarget.select()} />
        <button onClick={() => copyReferral(data.referralUrl!)} style={button}>
          Ajánlói link másolása
        </button>
      </>
    ) : <p>Az ajánlói link még nincs beállítva.</p>}
  </section>

  <h2 style={{ marginTop: 30 }}>Affiliate ajánlatok</h2>

  {actionStatus && <p role="status">{actionStatus}</p>}
  {data.offers.length === 0 && <p>Jelenleg nincs aktív ajánlat.</p>}

  {data.offers.map((offer) => (
    <section key={offer.id} style={card}>
      <h3>{offer.name}</h3>
      <button disabled={opening} onClick={() => openOffer(offer.id)} style={button}>
        Ajánlat megnyitása
      </button>
    </section>
  ))}

  {data.isAdmin && (
    <section style={{ ...card, marginTop: 20 }}>
      <h2>Adminisztráció</h2>
      <Link href="/admin" style={button}>
        Admin felület megnyitása
      </Link>
    </section>
  )}

  <footer style={{ color: "#8293A2", marginTop: 35, fontSize: 12 }}>
    18+ · Felelős játék · Az ajánlatok elérhetősége és jogszerűsége
    országonként eltérhet.
  </footer>
</main>
);
}

const card: React.CSSProperties = {
background: "#1C2937",
padding: 20,
borderRadius: 14,
marginBottom: 14
};

const button: React.CSSProperties = {
display: "inline-block",
background: "#18A77A",
color: "white",
padding: "12px 18px",
borderRadius: 9,
textDecoration: "none",
border: 0,
cursor: "pointer"
};
