
import { createHmac, timingSafeEqual } from "crypto";

export function verifyTelegram(initData: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || !initData) {
    throw new Error("Missing Telegram credentials");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) {
    throw new Error("Invalid Telegram hash");
  }

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData")
    .update(token)
    .digest();

  const calculated = createHmac("sha256", secret)
    .update(dataCheckString)
    .digest();

  const supplied = Buffer.from(hash, "hex");

  if (!timingSafeEqual(calculated, supplied)) {
    throw new Error("Telegram verification failed");
  }

  const authDate = Number(params.get("auth_date"));
  const now = Date.now() / 1000;

  if (
    !Number.isFinite(authDate) ||
    authDate <= 0 ||
    now - authDate > 86400 ||
    authDate > now + 60
  ) {
    throw new Error("Expired Telegram session");
  }

  const userData = params.get("user");

  if (!userData) {
    throw new Error("Missing Telegram user");
  }

  const user = JSON.parse(userData);

  if (!Number.isSafeInteger(user.id) || user.id <= 0) {
    throw new Error("Invalid Telegram user");
  }

  return user;
}
