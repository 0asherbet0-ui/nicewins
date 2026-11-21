"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const offerLogos: Partial<Record<string, string>> = {
  "winspirit": "/logos/winspirit.webp",
  "slotoro": "/logos/slotoro.webp",
  "coldbet": "/logos/coldbet.webp"
};

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
    setActionStatus("Couldn't open the offer.");
  } finally {
    setOpening(false);
  }
}

async function copyReferral(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    setActionStatus("Referral link copied.");
  } catch {
    setActionStatus("Select and copy the referral link.");
  }
}

useEffect(() => {
const init = async () => {
const tg = window.Telegram?.WebApp;


  if (!tg?.initData) {
    setError("Open NiceWins in Telegram.");
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
    setError("Couldn't sign in. Please try again.");
  }
};

init();
}, []);

if (error) {
return <main style={{ padding: 30 }}>{error}</main>;
}

if (!data) {
return <main style={{ padding: 30 }}>Loading NiceWins…</main>;
}

return (
<main style={{ maxWidth: 520, margin: "auto", padding: 22 }}>
<header style={{ marginBottom: 30 }}>
<h1 style={{ fontSize: 32 }}>NiceWins</h1>
<p style={{ color: "#9EAFBE" }}>
Welcome, {data.profile.name || "Partner"}!
</p>
</header>


  <h2 style={{ marginTop: 30 }}>Affiliate offers</h2>

  {actionStatus && <p role="status">{actionStatus}</p>}
  {data.offers.length === 0 && <p>There are no active offers right now.</p>}

  {data.offers.map((offer) => (
    <section key={offer.id} style={offerCard}>
      <div>
        <h3>{offer.name}</h3>
        <button disabled={opening} onClick={() => openOffer(offer.id)} style={button}>
          Open offer
        </button>
      </div>
      {offerLogos[offer.id] && (
        <img
          src={offerLogos[offer.id]}
          alt=""
          style={{ ...offerLogo, objectFit: offer.id === "coldbet" ? "contain" : "cover", padding: offer.id === "coldbet" ? 8 : 0 }}
          onError={event => { event.currentTarget.style.visibility = "hidden"; }}
        />
      )}
    </section>
  ))}

  <section style={card}>
    <p style={{ color: "#AAB9C6" }}>Clicks credited to you</p>
    <h1 style={{ fontSize: 38 }}>
      {data.profile.clicks}
    </h1>
  </section>

  <section style={{ ...card, marginTop: 15 }}>
    <h3>Your referral code</h3>
    <p>{data.profile.referralCode}</p>
    {data.referralUrl ? (
      <>
        <input aria-label="Referral link" value={data.referralUrl} readOnly
          onFocus={event => event.currentTarget.select()} />
        <button onClick={() => copyReferral(data.referralUrl!)} style={button}>
          Copy referral link
        </button>
      </>
    ) : <p>Your referral link isn't available yet.</p>}
  </section>

  {data.isAdmin && (
    <section style={{ ...card, marginTop: 20 }}>
      <h2>Administration</h2>
      <Link href="/admin" style={button}>
        Open admin dashboard
      </Link>
    </section>
  )}

  <footer style={{ color: "#8293A2", marginTop: 35, fontSize: 12 }}>
    18+ · Play responsibly · Offer availability and legal restrictions vary by country.
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

const offerCard: React.CSSProperties = {
  ...card,
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "center",
  gap: 12,
};

const offerLogo: React.CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: 220,
  height: 100,
  boxSizing: "border-box",
  padding: 8,
  borderRadius: 12,
  background: "#131F2C",
  objectFit: "contain",
  justifySelf: "center",
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
