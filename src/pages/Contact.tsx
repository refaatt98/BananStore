
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { InstagramIcon, WhatsappIcon } from "../components/Icons";
import { PageHero, Reveal, SectionHeading } from "../components/ui";
import { whatsappLink } from "../lib/api";
import { useTitle } from "../lib/hooks";
import { useSite } from "../lib/site";

const channelsFor = (site: ReturnType<typeof useSite>["site"]) => [
  {
    icon: WhatsappIcon,
    title: "واتساب",
    value: "أسرع طريقة",
    href: whatsappLink(site.whatsapp, "مرحبا بَنان 🤍"),
    tint: "bg-sage-soft",
  },
  {
    icon: InstagramIcon,
    title: "إنستغرام",
    value: `@${site.instagram}`,
    href: `https://instagram.com/${site.instagram}`,
    tint: "bg-rose-soft",
  },
  {
    icon: null,
    title: "اتصال",
    value: site.phone,
    href: `tel:${site.phone.replace(/\s/g, "")}`,
    tint: "bg-gold-soft",
  },
];

function Faq({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(i === 0);

  return (
    <div className="stitched rounded-3xl bg-linen">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="relative z-10 flex w-full items-center justify-between gap-4 p-5 text-start font-semibold"
      >
        {q}

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="shrink-0"
        >
          <ChevronDown className="size-5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 leading-8 text-cocoa-2">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Contact() {
  useTitle("تواصلي معنا");

  const { site } = useSite();
  const channels = channelsFor(site);

  return (
    <>
      <PageHero
        eyebrow="تواصلي معنا"
        title="منحب نسمع منك"
        text="سؤال، فكرة، أو بس بدك تحكي مرحبا — إحنا هون."
      />

      <section className="container-b py-12 md:py-16">
        {/* وسائل التواصل */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
          {channels.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.06}>
              <a
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className={`stitched group flex h-full flex-col items-center gap-3 rounded-[1.75rem] p-5 text-center transition hover:-translate-y-1 ${c.tint}`}
              >
                <span className="grid size-12 place-items-center rounded-full bg-linen transition group-hover:rotate-12">
                  {c.icon ? (
                    <c.icon className="size-6" />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="size-6"
                      aria-hidden="true"
                    >
                      <path
                        d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.19 18a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.09 3.18 2 2 0 0 1 4.08 1h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.06 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.58 2.8.7A2 2 0 0 1 22 16.92Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>

                <span className="font-semibold">{c.title}</span>

                <span
                  className="break-all text-sm text-cocoa-2"
                  dir={c.title === "واتساب" ? undefined : "ltr"}
                >
                  {c.value}
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        {/* الأسئلة الشائعة */}
        <div id="faq" className="mt-14 scroll-mt-28">
          <SectionHeading
            eyebrow="أسئلة بتتكرر"
            title="الأسئلة الشائعة"
            align="start"
          />

          <FaqList />
        </div>
      </section>
    </>
  );
}

function FaqList() {
  const { data: faqs } = useFaqs();

  return (
    <div className="space-y-3">
      {faqs?.map((f, i) => (
        <Faq key={f.id} q={f.question} a={f.answer} i={i} />
      ))}
    </div>
  );
}

function useFaqs() {
  const [faqs, setFaqs] = useState<any[] | undefined>(undefined);

  useState(() => {
    import("../lib/api").then(({ getFaqs }) => {
      getFaqs().then(setFaqs).catch(() => setFaqs([]));
    });
  });

  return { data: faqs };
}
