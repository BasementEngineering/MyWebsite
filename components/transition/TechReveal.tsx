'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import { type LayerData } from '@/lib/parseTokenUsage';
import { content } from '@/lib/content';

const PhoneScene = dynamic(() => import('./PhoneScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

export default function TechReveal({ layers }: { layers: LayerData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Flash: peaks at ~7% scroll through this section
  const flashOpacity = useTransform(scrollYProgress, [0.04, 0.07, 0.14], [0, 1, 0]);
  // Scene fades in after flash clears
  const sceneOpacity = useTransform(scrollYProgress, [0.11, 0.24], [0, 1]);
  // Eyebrow fades out as explosion begins
  const eyebrowOpacity = useTransform(scrollYProgress, [0.2, 0.38], [1, 0]);

  return (
    <div ref={containerRef} style={{ height: '350vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* White overexposure flash */}
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none bg-white"
          style={{ opacity: flashOpacity }}
        />

        {/* 3D canvas */}
        <motion.div className="w-full h-full" style={{ opacity: sceneOpacity }}>
          <PhoneScene scrollYProgress={scrollYProgress} layers={layers} />
        </motion.div>

        {/* Eyebrow label */}
        <motion.p
          className="absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.35em] uppercase text-gray-400 pointer-events-none"
          style={{ opacity: eyebrowOpacity }}
        >
          {content.transition.eyebrow}
        </motion.p>
      </div>
    </div>
  );
}
