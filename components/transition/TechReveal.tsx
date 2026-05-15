'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';

const PhoneScene = dynamic(() => import('./PhoneScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

export default function TechReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    // 'start start' → tracking begins once the section top reaches the viewport top
    // (user has fully scrolled past Trinity). 'end start' → ends when section bottom
    // reaches viewport top. Total range = container height = 200vh.
    offset: ['start start', 'end start'],
  });

  // ─── Scroll stages — adjust these numbers to shift timing ───────────────────
  // Each stage is [start, end] as a fraction of the 200vh scroll window.
  // 0.01 = ~2vh of scroll, 0.50 = ~100vh. Sticky phase lasts ~0–0.50 (100vh).
  // Stages must run in order: text → bg+subtext → phone → text moves up.
  // IMPORTANT: keep STAGE.phoneIn[0] in sync with INTRO_START in PhoneScene.tsx.
  const STAGE = {
    bgFade:    [0.10, 0.26] as const,  // white → parchment
    subtextIn: [0.12, 0.24] as const,  // subtext appears alongside bg fade
    phoneIn:   [0.28, 0.40] as const,  // 3D canvas fades in (subtext done at 0.24)
    textUp:    [0.28, 0.46] as const,  // text drifts up as phone arrives
  };
  // ─────────────────────────────────────────────────────────────────────────────

  // claimOpacity removed — text is visible from the start so the section never looks empty
  const blueprintOpacity = useTransform(scrollYProgress, [...STAGE.bgFade],    [0, 1]);
  const subOpacity       = useTransform(scrollYProgress, [...STAGE.subtextIn], [0, 1]);
  const sceneOpacity     = useTransform(scrollYProgress, [...STAGE.phoneIn],   [0, 1]);
  const claimY           = useTransform(scrollYProgress, [...STAGE.textUp],    ['0vh', '-30vh']);

  return (
    <div ref={containerRef} style={{ height: '200vh' }}>{/* 200vh = 100vh sticky + 100vh scroll-away */}
      <div className="sticky top-0 h-screen overflow-hidden" style={{ isolation: 'isolate' }}>
        {/* Blueprint background — fades in over the white page background */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none bg-parchment engineering-layer"
          style={{ opacity: blueprintOpacity }}
        />

        {/* 3D canvas */}
        <motion.div className="w-full h-full" style={{ opacity: sceneOpacity }}>
          <PhoneScene scrollYProgress={scrollYProgress} />
        </motion.div>

        {/* Claim overlay — starts centered, floats to top above 3D scene */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
          <motion.div style={{ y: claimY }}>
            <h2 className="font-sans font-light text-gray-900 text-5xl md:text-7xl lg:text-8xl leading-[1.05]">
              Substanz statt Hype.
            </h2>
            <motion.p
              className="font-sans text-gray-400 text-base md:text-lg mt-6 tracking-[0.15em]"
              style={{ opacity: subOpacity }}
            >
              Wie bei dieser Website.
            </motion.p>
          </motion.div>
        </div>

        {/* Tech info label */}
        <motion.div
          className="absolute bottom-4 left-4 pointer-events-none z-10"
          style={{ opacity: sceneOpacity }}
        >
          <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-black/20">
            // Three.js · WebGL · Next.js Edge Runtime
          </span>
        </motion.div>
      </div>
    </div>
  );
}
