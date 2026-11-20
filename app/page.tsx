"use client";

import { useEffect, useState } from "react";

declare global {
interface Window {
Telegram?: {
WebApp: {
initData: string;
ready: () => void;
expand: () => void;
};
};
}
}

export default function Home() {
const [data, setData] = useState<any>(null);
const [error, setError] = useState("");

useEffect(() => {
const init = async () => {
const tg = window.Telegram?.WebApp;


JavaScript
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

const referralUrl =
${window.location.origin}/?ref=${data.profile.referralCode};

return (
<main style={{ maxWidth: 520, margin: "auto", padding: 22 }}>
<header style={{ marginBottom: 30 }}>
<h1 style={{ fontSize: 32 }}>NiceWins</h1>
<p style={{ color: "#9EAFBE" }}>
Üdvözlünk, {data.profile.name || "Partner"}!
</p>
</header>


TypeScript
  <section style={card}>
    <p style={{ color: "#AAB9C6" }}>Saját kattintásaid</p>
    <h1 style={{ fontSize: 38 }}>
      {data.profile.clicks}
    </h1>
  </section>

  <section style={{ ...card, marginTop: 15 }}>
    <h3>Saját ajánlókód</h3>
    <p>{data.profile.referralCode}</p>
    <button
      onClick={() => navigator.clipboard.writeText(referralUrl)}
      style={button}
    >
      Ajánlói link másolása
    </button>
  </section>

  <h2 style={{ marginTop: 30 }}>Affiliate ajánlatok</h2>

  {data.offers.map((offer: any) => (
    <section key={offer.id} style={card}>
      <h3>{offer.name}</h3>
      <p>Részletek és ajánlati feltételek</p>
    </section>
  ))}

  {data.isAdmin && (
    <section style={{ ...card, marginTop: 20 }}>
      <h2>Adminisztráció</h2>
      <a href="/admin" style={button}>
        Admin felület megnyitása
      </a>
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
