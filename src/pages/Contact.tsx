import { motion } from "motion/react";
import { Mail, MessageCircle, Send } from "lucide-react";
import { Link } from "react-router";
import { useSite } from "../lib/site";
import { Diamond, Spool } from "../components/Craft";
import { InstagramIcon, WhatsappIcon } from "../components/Icons";
import { Logo } from "../components/Logo";

export default function Contact() {
  const { site } = useSite();

  return (
    <main className="min-h-screen bg-cream text-cocoa">
      <section className="container-b py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl"
        >
          <div className="mb-12 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-rose/50 px-4 py-2 text-sm text-cocoa/70">
              <Diamond className="size-2 text-rose" />
              يسعدنا تواصلك معنا
            </span>

            <h1 className="mt-6 font-display text-4xl leading-tight md:text-6xl">
              خلينا نحكي <span className="text-rose">مع بعض</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl leading-8 text-cocoa/70">
              عندك سؤال أو استفسار عن منتجات بَنان؟ إحنا هون لمساعدتك.
              تواصلي معنا بالطريقة اللي بتناسبك، وراح نكون سعداء بخدمتك.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl bg-cocoa p-8 text-cream md:p-10">
              <div
                className="pointer-events-none absolute -end-8 -top-8 opacity-20"
                aria-hidden="true"
              >
                <Spool className="h-32 w-28" color="#c98f86" />
              </div>

              <Logo light className="relative h-20" />

              <h2 className="relative mt-8 font-display text-3xl">
                تواصلي معنا
              </h2>

              <p className="relative mt-4 leading-8 text-cream/75">
                سواء بدك تستفسري عن منتج، أو عن طلبك، أو تحتاجي أي مساعدة،
                بنسعد برسالتك.
              </p>

              <div className="relative mt-8 space-y-4">
                <a
                  href={`https://wa.me/${site.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 rounded-2xl border border-cream/20 p-4 transition hover:bg-cream/10"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-cream/10">
                    <WhatsappIcon className="size-6" />
                  </span>

                  <span>
                    <span className="block font-semibold">واتساب</span>
                    <span className="mt-1 block text-sm text-cream/65">
                      تواصلي معنا مباشرة
                    </span>
                  </span>

                  <MessageCircle className="ms-auto size-5 text-rose-soft" />
                </a>

                <a
                  href={`https://instagram.com/${site.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 rounded-2xl border border-cream/20 p-4 transition hover:bg-cream/10"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-cream/10">
                    <InstagramIcon className="size-6" />
                  </span>

                  <span>
                    <span className="block font-semibold">إنستغرام</span>
                    <span className="mt-1 block text-sm text-cream/65">
                      تابعي جديد بَنان
                    </span>
                  </span>

                  <Instagram className="ms-auto size-5 text-rose-soft" />
                </a>

                <a
                  href={`mailto:${site.email}`}
                  className="flex items-center gap-4 rounded-2xl border border-cream/20 p-4 transition hover:bg-cream/10"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-cream/10">
                    <Mail className="size-6" />
                  </span>

                  <span className="min-w-0">
                    <span className="block font-semibold">
                      البريد الإلكتروني
                    </span>
                    <span className="mt-1 block break-all text-sm text-cream/65">
                      {site.email}
                    </span>
                  </span>

                  <Send className="ms-auto size-5 shrink-0 text-rose-soft" />
                </a>
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-3xl border border-dashed border-cocoa/20 bg-white/60 p-8 md:p-10">
              <span className="text-sm text-rose">B A N A N</span>

              <h2 className="mt-4 font-display text-3xl">
                كل قطعة إلها حكاية
              </h2>

              <p className="mt-4 leading-8 text-cocoa/70">
                في بَنان، بنهتم بكل تفصيل وبنحب نسمع منك. إذا عندك أي سؤال
                عن المنتجات أو الطلبات، لا تترددي بالتواصل معنا.
              </p>

              <div className="my-8 border-t border-dashed border-cocoa/20" />

              <h3 className="font-semibold">ممكن كمان تتصفحي</h3>

              <div className="mt-4 space-y-3">
                <Link
                  to="/shop"
                  className="flex items-center justify-between rounded-xl border border-cocoa/10 bg-white px-4 py-3 transition hover:border-rose/50"
                >
                  <span>تسوقي منتجاتنا</span>
                  <span aria-hidden="true">←</span>
                </Link>

                <Link
                  to="/story"
                  className="flex items-center justify-between rounded-xl border border-cocoa/10 bg-white px-4 py-3 transition hover:border-rose/50"
                >
                  <span>اكتشفي قصتنا</span>
                  <span aria-hidden="true">←</span>
                </Link>

                <Link
                  to="/wishlist"
                  className="flex items-center justify-between rounded-xl border border-cocoa/10 bg-white px-4 py-3 transition hover:border-rose/50"
                >
                  <span>منتجاتك المفضلة</span>
                  <span aria-hidden="true">←</span>
                </Link>
              </div>

              <p className="mt-8 text-sm leading-7 text-cocoa/60">
                الدفع عند الاستلام · توصيل لكل فلسطين
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
