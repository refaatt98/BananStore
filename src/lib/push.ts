// إشعارات الطلبات الجديدة (Web Push) — الطرف اللي بالمتصفح

export type PushState = "unsupported" | "needs-install" | "denied" | "off" | "on";

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

function urlB64ToUint8Array(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function registerSW() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

async function currentSub() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function getPushState(): Promise<PushState> {
  // بالآيفون الإشعارات بتشتغل بس لما الموقع يكون مضاف للشاشة الرئيسية ومفتوح من هناك
  if (isIOS() && !isStandalone()) return "needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission !== "granted") return "off";
  return (await currentSub()) ? "on" : "off";
}

const post = (path: string, body: unknown) =>
  fetch(`/api/push/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

/** لازم تنادى من كبسة زر (الآيفون بيطلب هيك) */
export async function enablePush(): Promise<PushState> {
  await registerSW();
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "denied" : "off";
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { publicKey } = await (await fetch("/api/push/key")).json();
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(publicKey) });
  }
  const r = await post("subscribe", { subscription: sub.toJSON() });
  if (!r.ok) throw new Error("ما زبط حفظ الاشتراك");
  return "on";
}

export async function disablePush(): Promise<PushState> {
  const sub = await currentSub();
  if (sub) {
    await post("unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe();
  }
  return "off";
}

export async function testPush() {
  const sub = await currentSub();
  if (!sub) return false;
  // نتأكد إنه الاشتراك محفوظ بالسيرفر قبل التجربة
  await post("subscribe", { subscription: sub.toJSON() });
  const r = await post("test", { endpoint: sub.endpoint });
  return r.ok && (await r.json()).ok === true;
}

/** بعد ما الزبونة تطلب — بيبعت إشعار لصاحبة المتجر (ما بيوقف الطلب لو فشل) */
export function notifyNewOrder(id: string) {
  try {
    void fetch("/api/push/order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }), keepalive: true }).catch(() => {});
  } catch {
    /* تجاهل */
  }
}
