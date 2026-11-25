"use client";

import { useEffect, useState } from "react";


type CampaignStats = {
  opens: { campaign: string; count: number }[];
  clicks: { campaign: string; offer_id: string; name: string; count: number }[];
};

type PointBalance = { telegramId: string; name: string | null; username: string | null; points: number };

type AdminStats = {
  points: PointBalance[] | null;
  partners: number;
  offers: { id: string; name: string; active: boolean; clicks: number }[];
  campaigns: CampaignStats;
};

export default function AdminPage() {
const [search, setSearch] = useState("");
const [data, setData] = useState<AdminStats | null>(null);
const [error, setError] = useState("Loading…");

useEffect(() => {
async function load() {
const initData = window.Telegram?.WebApp?.initData;


  if (!initData) {
    setError("Open NiceWins in Telegram.");
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
    setError("Couldn't load the admin statistics.");
  }
}

load();
}, []);

if (error) {
return <main style={{ padding: 25 }}>{error}</main>;
}

if (!data) return <main style={{ padding: 25 }}>Loading…</main>;

const query = search.trim().toLowerCase().replace(/^@/, "");
const matchingBalances = data.points?.filter(user =>
  [user.name, user.username, user.telegramId].some(value => value?.toLowerCase().includes(query)),
);

const { opens, clicks } = data.campaigns;
const campaigns = Array.from(new Set([...opens, ...clicks].map(row => row.campaign))).sort();

return (
<main style={{ maxWidth: 520, margin: "auto", padding: 22 }}>
<h1>NiceWins Admin</h1>


  <section style={card}>
    <p>Total partners</p>
    <h1>{data.partners}</h1>
  </section>

  <section style={card}>
    <h2>NiceWins points</h2>
    {matchingBalances ? (
      <>
        <label htmlFor="points-search">Search by name, username or Telegram ID</label>
        <input id="points-search" type="search" value={search}
          onChange={event => setSearch(event.target.value)}
          style={{ display: "block", width: "100%", boxSizing: "border-box", margin: "8px 0 14px", padding: 8 }} />
        {matchingBalances.length === 0 ? <p>No users found.</p> : (
          <table style={{ width: "100%", textAlign: "left", overflowWrap: "anywhere" }}>
            <thead><tr><th scope="col">Telegram user</th><th scope="col">Points</th></tr></thead>
            <tbody>
              {matchingBalances.map(user => (
                <tr key={user.telegramId}>
                  <td style={{ padding: "8px 8px 8px 0" }}>
                    {[user.name, user.username && "@" + user.username].filter(Boolean).join(" · ") || "Unknown name"}
                    <br /><small>{user.telegramId}</small>
                  </td>
                  <td>{user.points.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    ) : <p>Couldn't load points. Reopen the admin dashboard to retry.</p>}
  </section>

  <h2>Affiliate statistics</h2>

  {data.offers.map((offer) => (
    <section key={offer.id} style={card}>
      <h3>{offer.name}</h3>
      <p>Clicks: {offer.clicks}</p>
      <p>Status: {offer.active ? "Active" : "Inactive"}</p>
    </section>
  ))}

  <h2>Telegram post statistics</h2>
  {campaigns.length === 0 && <p>No campaign traffic has been recorded yet.</p>}
  {campaigns.map(campaign => (
    <section key={campaign} style={card}>
      <h3>{campaign}</h3>
      <p>App opens: {opens.find(row => row.campaign === campaign)?.count ?? 0}</p>
      <p>Offer clicks:</p>
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
