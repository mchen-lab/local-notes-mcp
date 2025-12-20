import { getUserByApiKey } from "../../notesDb.js";

export function parseCookies(req) {
  const header = req.headers["cookie"] || "";
  return Object.fromEntries(
    header
      .split(/;\s*/)
      .filter(Boolean)
      .map((kv) => {
        const idx = kv.indexOf("=");
        const k = idx >= 0 ? kv.slice(0, idx) : kv;
        const v = idx >= 0 ? kv.slice(idx + 1) : "";
        return [decodeURIComponent(k), decodeURIComponent(v)];
      })
  );
}

export function getUserIdFromCookie(req) {
  const cookies = parseCookies(req);
  const raw = cookies["user_id"];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}



export function getUserIdFromApiKey(req) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || typeof apiKey !== "string") return null;
  const user = getUserByApiKey(apiKey);
  return user ? user.id : null;
}

export function getUserId(req) {
  // Try API key first (for MCP bridge), then fall back to cookie (for web)
  const userIdFromApiKey = getUserIdFromApiKey(req);
  if (userIdFromApiKey !== null) return userIdFromApiKey;
  return getUserIdFromCookie(req);
}
