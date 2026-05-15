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
    offset: ['start end', 'start start'],
  });

  const flashOpacity = useTransform(scrollYProgress, [0.04, 0.07, 0.14], [0, 1, 0]);
  const sceneOpacity = useTransform(scrollYProgress, [0.38, 0.50], [0, 1]);
  const claimOpacity = useTransform(scrollYProgress, [0.12, 0.20], [0, 1]);
  const claimY       = useTransform(scrollYProgress, [0.20, 0.36], ['40vh', '0vh']);
  const subOpacity   = useTransform(scrollYProgress, [0.16, 0.26], [0, 1]);

  return (
    // 160vh: ~100vh scroll tracking + 60vh sticky breathing room
    <div ref={containerRef} style={{ height: '160vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden" style={{ isolation: 'isolate' }}>
        {/* White overexposure flash */}
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none bg-white"
          style={{ opacity: flashOpacity }}
        />

        {/* 3D canvas */}
        <motion.div className="w-full h-full" style={{ opacity: sceneOpacity }}>
          <PhoneScene scrollYProgress={scrollYProgress} />
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
