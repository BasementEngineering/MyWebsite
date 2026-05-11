'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { content } from '@/lib/content';

function PillarCard({
  pillar,
  index,
}: {
  pillar: (typeof content.trinity.pillars)[number];
  index: number;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const hasImages = pillar.images.length > 0;

  useEffect(() => {
    if (pillar.images.length < 2) return;
    const id = setInterval(() => {
      setActiveImg((prev) => (prev + 1) % pillar.images.length);
    }, 3500);
    return () => clearInterval(id);
  }, [pillar.images.length]);

  return (
    <motion.div
      className="relative overflow-hidden min-h-[480px] flex flex-col justify-end"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: 'easeOut' }}
    >
      {/* Background */}
      {hasImages ? (
        <AnimatePresence>
          <motion.div
            key={activeImg}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          >
            <Image
              src={pillar.images[activeImg]}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="absolute inset-0 bg-gray-900" />
      )}

      {/* Dark overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

      {/* Content */}
      <div className="relative z-10 p-10">
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-white/50 mb-4">
          0{index + 1}
        </p>
        <h3 className="font-sans font-light text-white text-2xl mb-5 leading-snug">
          {pillar.label}
        </h3>
        <p className="font-sans text-sm text-white/70 leading-relaxed">
          {pillar.body}
        </p>

        {/* Image dot indicators */}
        {pillar.images.length > 1 && (
          <div className="flex gap-1.5 mt-6">
            {pillar.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === activeImg ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function SkillsTrinity() {
  return (
    <section className="py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="font-sans font-light text-gray-900 text-4xl md:text-6xl text-center mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          {content.trinity.intro}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {content.trinity.pillars.map((pillar, i) => (
            <PillarCard key={pillar.label} pillar={pillar} index={i} />
          ))}
        </div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <a
            href={content.trinity.cta.href}
            className="font-sans text-xs tracking-[0.2em] uppercase px-10 py-4 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors duration-300"
          >
            {content.trinity.cta.label}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
