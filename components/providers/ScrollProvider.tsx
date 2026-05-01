'use client';

import { createContext, useContext } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

type ScrollContextType = {
  scrollYProgress: MotionValue<number>;
};

const ScrollContext = createContext<ScrollContextType | null>(null);

export function useScrollContext() {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('useScrollContext must be used within ScrollProvider');
  return ctx;
}

export default function ScrollProvider({ children }: { children: React.ReactNode }) {
  const { scrollYProgress } = useScroll();

  // White until ~40% scroll, then transitions to parchment by ~68%
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.42, 0.68],
    ['#ffffff', '#ffffff', '#f2f0e9'],
  );

  return (
    <ScrollContext.Provider value={{ scrollYProgress }}>
      <motion.div style={{ backgroundColor }}>{children}</motion.div>
    </ScrollContext.Provider>
  );
}
