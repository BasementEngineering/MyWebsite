'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { content } from '@/lib/content';

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        className="mb-10 w-40 h-40 rounded-full overflow-hidden ring-1 ring-gray-200"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        <Image
          src="/images/Jan.jpg"
          alt="Jan Kettler"
          width={160}
          height={160}
          className="object-cover w-full h-full"
          priority
        />
      </motion.div>

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

      <motion.p
        className="mt-8 max-w-xl font-sans text-sm text-gray-500 leading-relaxed"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.6, ease: 'easeOut' }}
      >
        {content.hero.subheadline}
      </motion.p>

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
