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
    name: offer.name,
    active: offer.active,
    clicks: count ?? 0
  });
}

const { count: partners } = await db
  .from("profiles")
  .select("*", { count: "exact", head: true });

return NextResponse.json({
  partners: partners ?? 0,
  offers: stats
});
} catch {
return NextResponse.json(
{ error: "Unauthorized" },
{ status: 401 }
);
}
}
