"use client";

import { motion, useAnimation } from "motion/react";
import { useCallback, useEffect, useState } from "react";

type AnimatedReelProps = {
  headline: string;
  bodyCopy: string;
  cta: string;
  brandName: string;
  logoUrl?: string;
  imageUrl?: string;
  primaryColor: string;
  playing?: boolean;
};

export function AnimatedReel({
  headline,
  bodyCopy,
  cta,
  brandName,
  logoUrl,
  imageUrl,
  primaryColor,
  playing = true,
}: AnimatedReelProps) {
  const imgControls = useAnimation();
  const logoControls = useAnimation();
  const headlineControls = useAnimation();
  const bodyControls = useAnimation();
  const ctaControls = useAnimation();
  const [isPlaying, setIsPlaying] = useState(playing);

  const playSequence = useCallback(async () => {
    // Reset
    imgControls.set({ scale: 1.15, opacity: 0 });
    logoControls.set({ opacity: 0, y: -10 });
    headlineControls.set({ opacity: 0, y: 20 });
    bodyControls.set({ opacity: 0, y: 15 });
    ctaControls.set({ opacity: 0, scale: 0.8 });

    // 0s: Image zoom in
    imgControls.start({ scale: 1, opacity: 1, transition: { duration: 2, ease: "easeOut" } });

    // 0.5s: Logo
    await new Promise((r) => setTimeout(r, 500));
    logoControls.start({ opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 200 } });

    // 1.5s: Headline types in
    await new Promise((r) => setTimeout(r, 1000));
    headlineControls.start({ opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 200 } });

    // 3s: Body
    await new Promise((r) => setTimeout(r, 1500));
    bodyControls.start({ opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } });

    // 4s: CTA bounces in
    await new Promise((r) => setTimeout(r, 1000));
    ctaControls.start({ opacity: 1, scale: 1, transition: { type: "spring", damping: 12, stiffness: 300 } });

    // 6s: Hold, then loop
    await new Promise((r) => setTimeout(r, 2000));
    if (isPlaying) playSequence();
  }, [imgControls, logoControls, headlineControls, bodyControls, ctaControls, isPlaying]);

  useEffect(() => {
    if (isPlaying) playSequence();
  }, [isPlaying, playSequence]);

  const gradientBg = `linear-gradient(145deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`;

  return (
    <div
      className="relative flex aspect-[9/16] w-full flex-col justify-end overflow-hidden"
      style={{ borderRadius: 14, maxWidth: 180 }}
    >
      {/* Background */}
      <motion.div
        className="absolute inset-0"
        animate={imgControls}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: gradientBg }} />
        )}
      </motion.div>

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}
      />

      {/* Logo */}
      <motion.div className="absolute left-3 top-3" animate={logoControls}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-6 w-6 rounded object-contain" style={{ background: "rgba(255,255,255,0.15)" }} />
        ) : (
          <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>{brandName}</span>
        )}
      </motion.div>

      {/* Content */}
      <div className="relative z-10 p-3">
        <motion.p
          animate={headlineControls}
          className="text-[13px] font-extrabold leading-tight"
          style={{ color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
        >
          {headline}
        </motion.p>
        <motion.p
          animate={bodyControls}
          className="mt-1 text-[9px] leading-relaxed"
          style={{ color: "rgba(255,255,255,0.75)" }}
        >
          {bodyCopy}
        </motion.p>
        <motion.div animate={ctaControls} className="mt-2 flex">
          <span
            className="inline-block rounded-md px-3 py-1 text-[9px] font-bold"
            style={{ background: "rgba(255,255,255,0.9)", color: primaryColor }}
          >
            {cta} →
          </span>
        </motion.div>
      </div>

      {/* Play/pause toggle */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full"
        style={{ background: "rgba(0,0,0,0.4)" }}
      >
        <span className="text-[10px]">{isPlaying ? "⏸" : "▶"}</span>
      </button>

      {/* "Reel" label */}
      <div className="absolute right-2 bottom-2 z-20">
        <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
          Reel
        </span>
      </div>
    </div>
  );
}
