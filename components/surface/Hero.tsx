'use client';

import { motion } from 'framer-motion';
import { content } from '@/lib/content';

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <motion.p
        className="font-sans text-xs tracking-[0.35em] uppercase text-gray-400 mb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        {content.hero.eyebrow}
      </motion.p>

      <h1 className="font-sans font-light text-gray-900 leading-[1.05]">
        {content.hero.headline.map((line, i) => (
          <motion.span
            key={i}
            className="block text-5xl md:text-7xl lg:text-8xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: 'easeOut' }}
          >
            {line}
          </motion.span>
        ))}
      </h1>

      <motion.div
        className="mt-14 flex gap-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
      >
        {content.hero.cta.map((cta) => (
          <a
            key={cta.href}
            href={cta.href}
            className="font-sans text-xs tracking-[0.2em] uppercase px-8 py-3.5 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors duration-300"
          >
            {cta.label}
          </a>
        ))}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
      >
        <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-gray-300">
          Scroll
        </span>
        <motion.div
          className="w-px h-8 bg-gray-300"
          animate={{ scaleY: [1, 0.3, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}
