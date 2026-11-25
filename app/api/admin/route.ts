import { NextRequest, NextResponse } from "next/server";
import { getDb, ADMIN_ID } from "../../../lib/server";
import { verifyTelegram } from "../../../lib/telegram";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
try {
const { initData } = await req.json();
const user = verifyTelegram(initData);


if (String(user.id) !== ADMIN_ID) {
  return NextResponse.json(
    { error: "Admin access denied" },
    { status: 403 }
  );
}

const db = getDb();
const { data: offers, error } = await db
  .from("offers")
  .select("id,name,active");

if (error) throw error;

const stats = [];

for (const offer of offers ?? []) {
  const { count } = await db
    .from("clicks")
    .select("*", { count: "exact", head: true })
    .eq("offer_id", offer.id);

  stats.push({
    id: offer.id,
    name: offer.name,
    active: offer.active,
    clicks: count ?? 0
  });
}

const { count: partners } = await db
  .from("profiles")
  .select("*", { count: "exact", head: true });

const campaigns = await db.rpc("nicewins_campaign_stats");
if (campaigns.error) {
  return NextResponse.json({ error: "Campaign stats unavailable" }, { status: 500 });
}

const points = await db.rpc("nicewins_admin_points");

return NextResponse.json({
  points: points.error ? null : points.data,
  campaigns: campaigns.data,
  partners: partners ?? 0,
  offers: stats
}, { headers: { "Cache-Control": "no-store" } });
} catch {
return NextResponse.json(
{ error: "Unauthorized" },
{ status: 401 }
);
}
}
