import { Bell, BellOff, BellRing, LoaderCircle, Share } from "lucide-react";
import { useEffect, useState } from "react";
import { disablePush, enablePush, getPushState, testPush, type PushState } from "../../lib/push";
import { Card, useToast } from "./ui";

/** تفعيل إشعارات الطلبات الجديدة على هالجهاز */
export function PushCard() {
  const toast = useToast();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getPushState().then(setState);
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast(e instanceof Error ? e.message : "صار خطأ", "err");
    } finally {
      setBusy(false);
    }
  };

  if (!state || state === "unsupported") return null;

  return (
    <Card className="mb-4 flex flex-wrap items-center gap-3 !p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-rose-soft text-rose">
        {state === "on" ? <BellRing className="size-5" /> : state === "denied" ? <BellOff className="size-5" /> : <Bell className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">إشعارات الطلبات</p>
        <p className="text-sm text-cocoa-3">
          {state === "on" && "شغّالة على هالجهاز — رح يوصلك إشعار مع كل طلب جديد."}
          {state === "off" && "فعّليها عشان يوصلك إشعار على الجوال مع كل طلب جديد."}
          {state === "denied" && "الإشعارات ممنوعة لهالتطبيق. فعّليها من إعدادات الجوال ← الإشعارات ← بَنان."}
          {state === "needs-install" && (
            <>
              بالآيفون لازم تفتحي اللوحة من الشاشة الرئيسية: من سفاري اكبسي <Share className="inline size-4" /> مشاركة ← «إضافة إلى الشاشة الرئيسية»، وافتحيها من الأيقونة.
            </>
          )}
        </p>
      </div>
      {state === "off" && (
        <button
          disabled={busy}
          onClick={() => run(async () => {
            const s = await enablePush();
            setState(s);
            if (s === "on") toast("تفعّلت الإشعارات 🤍");
          })}
          className="btn btn-primary !py-2.5"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Bell className="size-4" />} تفعيل
        </button>
      )}
      {state === "on" && (
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => run(async () => {
              const ok = await testPush();
              toast(ok ? "انبعت إشعار تجريبي" : "ما زبط الإرسال", ok ? undefined : "err");
            })}
            className="btn !py-2.5 border border-line bg-cream"
          >
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : null} تجربة
          </button>
          <button disabled={busy} onClick={() => run(async () => setState(await disablePush()))} className="px-2 text-sm text-cocoa-3 underline">
            إيقاف
          </button>
        </div>
      )}
    </Card>
  );
}
