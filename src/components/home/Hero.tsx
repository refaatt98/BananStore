import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { PointerEvent, ReactNode } from "react";
import { Link } from "react-router";
import { useSite } from "../../lib/site";
import { Bow, Leaf, Needle, Scissors, SewButton, Spool, YarnBall } from "../Craft";

const ease = [0.22, 1, 0.36, 1] as const;

/** عنصر عائم بيتحرك مع الماوس بعمق مختلف */
function Floater({
  mx,
  my,
  depth,
  className,
  children,
  delay = 0,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  depth: number;
  className: string;
  children: ReactNode;
  delay?: number;
}) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform(my, (v) => v * depth);
  return (
    <motion.div className={`pointer-events-none absolute ${className}`} style={{ x, y }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.6 + delay, type: "spring", damping: 12 }}
      >
        <div className="animate-float" style={{ animationDelay: `${delay * 2}s` }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** فيديو تطريز اسم بَنان — صامت وبيعيد حاله */
function HeroVideo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease }}
      className="relative overflow-hidden rounded-[2rem] border-[8px] border-linen bg-linen shadow-[0_30px_60px_-30px_rgba(74,42,24,.5)]"
    >
      <video
        // iOS بيشغّل الفيديو تلقائياً بس إذا كان صامت، وReact ما بيحط muted دايماً
        ref={(v) => {
          if (!v) return;
          v.muted = true;
          v.play().catch(() => {});
        }}
        poster="/media/hero-banan.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-label="تطريز اسم بَنان بالخيط"
        className="block aspect-[16/9] w-full rounded-[1.5rem] object-cover"
      >
        <source src="/media/hero-banan.mp4" type="video/mp4" />
        <source src="/media/hero-banan.webm" type="video/webm" />
      </video>
    </motion.div>
  );
}

export function Hero() {
  const { site } = useSite();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const hoopX = useTransform(sx, (v) => v * -14);
  const hoopY = useTransform(sy, (v) => v * -14);
  const words = site.tagline.split(" ");

  return (
    <section onPointerMove={onMove} className="relative overflow-hidden">
      {/* بقع لونية ناعمة */}
      <div className="pointer-events-none absolute -end-40 -top-40 size-[34rem] rounded-full bg-rose-soft/70 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 -start-40 size-[30rem] rounded-full bg-sage-soft/80 blur-3xl" aria-hidden />

      <div className="container-b relative grid items-center gap-10 pb-16 pt-10 md:pt-14 lg:min-h-[calc(100dvh-7.25rem)] lg:grid-cols-2 lg:gap-6 lg:pb-20">
        <div className="relative z-10 text-center lg:text-start">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-dashed border-rose/60 bg-linen/70 px-4 py-1.5 text-sm text-cocoa-2"
          >
            <Sparkles className="size-4 text-rose" /> قطع يدوية · مختارة بعناية
          </motion.span>

          <h1 className="font-display text-[2.9rem] leading-[1.25] sm:text-6xl lg:text-[4.6rem] lg:leading-[1.2]">
            {words.map((w, i) => (
              <motion.span
                key={i}
                className="me-3 inline-block"
                initial={{ opacity: 0, y: 30, rotate: -4 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 0.15 + i * 0.14, duration: 0.7, ease }}
              >
                {i === words.length - 1 ? <span className="text-rose">{w}</span> : w}
              </motion.span>
            ))}
            <motion.span
              className="inline-block"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: "spring", damping: 8 }}
            >
              🫶🏼
            </motion.span>
          </h1>

          {/* إبرة بتخيّط تحت الجملة */}
          <div className="relative mx-auto mt-4 h-6 max-w-md lg:mx-0" aria-hidden>
            <motion.div
              className="stitch absolute right-0 top-1/2 text-rose"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 1, duration: 1.8, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2"
              initial={{ right: "0%", opacity: 0 }}
              animate={{ right: "100%", opacity: [0, 1, 1, 0] }}
              transition={{ delay: 1, duration: 1.8, ease: "easeInOut" }}
            >
              <motion.div animate={{ y: [0, -6, 0, 6, 0] }} transition={{ repeat: 4, duration: 0.45 }}>
                <Needle className="h-3 w-14 -scale-x-100" />
              </motion.div>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="mx-auto mt-5 max-w-md text-lg leading-9 text-cocoa-2 lg:mx-0"
          >
            {site.intro}.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.7 }}
            className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            <Link to="/shop" className="btn btn-primary group">
              تسوّقي القطع
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-cocoa-3 lg:justify-start"
          >
            <li>✦ قطع محدودة</li>
            <li>✦ دفع عند الاستلام</li>
            <li>✦ تغليف هدية</li>
          </motion.ul>
        </div>

        <div className="relative mx-auto w-full max-w-[22rem] sm:max-w-md lg:max-w-[30rem]">
          <motion.div style={{ x: hoopX, y: hoopY }}>
            <HeroVideo />
          </motion.div>

          <Floater mx={sx} my={sy} depth={40} className="-start-4 top-[8%] sm:-start-10" delay={0}>
            <YarnBall className="size-16 sm:size-24" color="#c98f86" />
          </Floater>
          <Floater mx={sx} my={sy} depth={-30} className="-end-2 top-[2%] sm:-end-6" delay={0.2}>
            <Spool className="h-16 w-12 sm:h-20 sm:w-16" color="#93a386" />
          </Floater>
          <Floater mx={sx} my={sy} depth={55} className="-start-2 bottom-[14%] sm:-start-8" delay={0.35}>
            <SewButton className="size-10 sm:size-12" />
          </Floater>
          <Floater mx={sx} my={sy} depth={-50} className="-end-3 bottom-[24%]" delay={0.5}>
            <SewButton className="size-8" color="#e9c2bb" />
          </Floater>
          <Floater mx={sx} my={sy} depth={25} className="bottom-[-2%] end-[18%]" delay={0.65}>
            <Scissors className="h-10 w-16 rotate-[-20deg] sm:h-12 sm:w-20" />
          </Floater>
          <Floater mx={sx} my={sy} depth={-20} className="start-[12%] -top-2 hidden sm:block" delay={0.8}>
            <Bow className="h-10 w-14" color="#e9c2bb" />
          </Floater>
          <Floater mx={sx} my={sy} depth={35} className="end-[-6%] top-[44%] hidden sm:block" delay={0.9}>
            <Leaf className="h-16 w-10 rotate-12" />
          </Floater>
        </div>
      </div>
    </section>
  );
}
