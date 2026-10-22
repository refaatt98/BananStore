// إشعارات الطلبات الجديدة على جوال صاحبة المتجر (Web Push).
// المفاتيح والاشتراكات محفوظة بـ Netlify Blobs، فما في داعي لأي إعداد إضافي.
//
//   GET  /api/push/key          → المفتاح العام للاشتراك
//   POST /api/push/subscribe    → حفظ اشتراك جهاز  { subscription }
//   POST /api/push/unsubscribe  → حذف اشتراك جهاز  { endpoint }
//   POST /api/push/test         → إشعار تجريبي لنفس الجهاز  { endpoint }
//   POST /api/push/order        → إشعار "طلب جديد" لكل الأجهزة  { id }

import { getStore } from "@netlify/blobs";
import webpush, { type PushSubscription } from "web-push";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://lghfzsjpukizqrxjjggf.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_MKSadXSyKwitozZ3dO4spA_Z7UYQgzh";
const CONTACT = "mailto:admin@bananstore.app";
// الطلب لازم يكون جديد عشان ينبعت عنه إشعار — بيمنع حدا يعيد يبعت إشعارات لطلبات قديمة
const ORDER_MAX_AGE_MS = 15 * 60 * 1000;

type Vapid = { publicKey: string; privateKey: string };

const store = () => getStore({ name: "push", consistency: "strong" });

// الموقع بيشتغل كمان على دومين تاني، فلازم نسمح بالطلبات من برّا
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...CORS } });

async function hash(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

async function vapid(): Promise<Vapid> {
  const s = store();
  let keys = (await s.get("vapid", { type: "json" })) as Vapid | null;
  if (!keys) {
    keys = webpush.generateVAPIDKeys();
    await s.setJSON("vapid", keys);
  }
  webpush.setVapidDetails(CONTACT, keys.publicKey, keys.privateKey);
  return keys;
}

function validSubscription(x: unknown): x is PushSubscription {
  const s = x as PushSubscription;
  return !!s && typeof s.endpoint === "string" && /^https:\/\//.test(s.endpoint) && s.endpoint.length < 1000 &&
    !!s.keys && typeof s.keys.p256dh === "string" && typeof s.keys.auth === "string";
}

/** بيبعت لكل الاشتراكات (أو لاشتراك واحد) وبيحذف الاشتراكات اللي انتهت */
async function send(payload: object, only?: string) {
  await vapid();
  const s = store();
  const { blobs } = await s.list({ prefix: "sub:" });
  const keys = only ? [`sub:${await hash(only)}`] : blobs.map((b) => b.key);
  let sent = 0;
  await Promise.all(
    keys.map(async (key) => {
      const sub = (await s.get(key, { type: "json" })) as PushSubscription | null;
      if (!sub) return;
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 24 * 3600, urgency: "high" });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await s.delete(key);
        else console.error("push failed", code, (e as Error).message);
      }
    }),
  );
  return sent;
}

async function getOrder(id: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_order`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ p_id: id }),
  });
  if (!r.ok) return null;
  return (await r.json()) as { id: string; number: string; total: number; created_at: string; items?: { preorder?: boolean }[] } | null;
}

export default async (req: Request) => {
  const action = new URL(req.url).pathname.split("/").pop();
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  if (req.method === "GET" && action === "key") {
    return json({ publicKey: (await vapid()).publicKey });
  }
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }

  if (action === "subscribe") {
    if (!validSubscription(body.subscription)) return json({ error: "bad subscription" }, 400);
    const sub = body.subscription;
    await store().setJSON(`sub:${await hash(sub.endpoint)}`, { endpoint: sub.endpoint, keys: sub.keys });
    return json({ ok: true });
  }

  if (action === "unsubscribe") {
    if (typeof body.endpoint !== "string") return json({ error: "bad endpoint" }, 400);
    await store().delete(`sub:${await hash(body.endpoint)}`);
    return json({ ok: true });
  }

  if (action === "test") {
    if (typeof body.endpoint !== "string") return json({ error: "bad endpoint" }, 400);
    const sent = await send({ title: "بَنان 🤍", body: "الإشعارات شغّالة! رح يوصلك إشعار مع كل طلب جديد.", url: "/admin/orders" }, body.endpoint);
    return json({ ok: sent > 0, sent });
  }

  if (action === "order") {
    const id = typeof body.id === "string" && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : null;
    if (!id) return json({ error: "bad id" }, 400);
    const order = await getOrder(id);
    if (!order || Date.now() - new Date(order.created_at).getTime() > ORDER_MAX_AGE_MS) return json({ ok: false });

    // كل طلب بينبعت عنه إشعار مرة وحدة بس
    const s = store();
    if (await s.get(`notified:${id}`)) return json({ ok: true, duplicate: true });
    await s.set(`notified:${id}`, "1");

    const pre = order.items?.some((i) => i.preorder);
    const total = `${Number(order.total).toFixed(2)}₪`;
    const sent = await send({
      title: pre ? "🛒 طلب مسبق جديد" : "🛒 طلب جديد",
      body: `طلب ${order.number} · ${total}`,
      url: `/admin/orders/${order.id}`,
      tag: `order-${order.id}`,
    });
    return json({ ok: true, sent });
  }

  return json({ error: "not found" }, 404);
};

export const config = { path: "/api/push/*" };
