'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import { type LayerData } from '@/lib/parseTokenUsage';

const PhoneScene = dynamic(() => import('./PhoneScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

export default function TechReveal({ layers }: { layers: LayerData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 0 → 1 as the section top travels from viewport bottom to viewport top (≈ 100vh of scroll).
  // After that the sticky inner div holds the scene in place for the remaining section height.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'start start'],
  });

  const flashOpacity = useTransform(scrollYProgress, [0.04, 0.07, 0.14], [0, 1, 0]);
  const sceneOpacity = useTransform(scrollYProgress, [0.38, 0.50], [0, 1]);
  const claimOpacity = useTransform(scrollYProgress, [0.12, 0.20], [0, 1]);
  const claimY       = useTransform(scrollYProgress, [0.20, 0.36], ['40vh', '0vh']);
  const subOpacity   = useTransform(scrollYProgress, [0.16, 0.26], [0, 1]);

  return (
    // 250vh: ~100vh for scroll-driven reveal + ~150vh of sticky interaction time
    <div ref={containerRef} style={{ height: '250vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden" style={{ isolation: 'isolate' }}>
        {/* White overexposure flash */}
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none bg-white"
          style={{ opacity: flashOpacity }}
        />

        {/* 3D canvas */}
        <motion.div className="w-full h-full" style={{ opacity: sceneOpacity }}>
          <PhoneScene scrollYProgress={scrollYProgress} layers={layers} />
        </motion.div>

        {/* Claim overlay — starts centered, floats to top above 3D scene */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-[10vh] pointer-events-none px-6 text-center">
          <motion.div style={{ opacity: claimOpacity, y: claimY }}>
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
