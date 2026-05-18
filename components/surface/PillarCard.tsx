'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';

export type Pillar = {
  label: string;
  body: string;
  images: string[];
  tags?: string[];
  cta?: { label: string; href: string };
};

export function PillarCard({ pillar, index, topAligned = false }: { pillar: Pillar; index: number; topAligned?: boolean }) {
  const [activeImg, setActiveImg] = useState(0);
  const hasImages = pillar.images.length > 0;

  useEffect(() => {
    if (pillar.images.length < 2) return;
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setActiveImg((prev) => (prev + 1) % pillar.images.length);
      }, 5000);
    }, Math.random() * 5000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [pillar.images.length]);

  return (
    <motion.div
      className={`relative overflow-hidden min-h-[480px] flex flex-col ${topAligned ? '' : 'justify-end'}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: 'easeOut' }}
    >
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

      <div className={`relative z-10 p-10 ${topAligned ? 'flex flex-col flex-1' : ''}`}>
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-white/50 mb-4">
          0{index + 1}
        </p>
        <h3 className="font-sans font-light text-white text-2xl mb-5 leading-snug">
          {pillar.label}
        </h3>
        <p className="font-sans text-sm text-white/70 leading-relaxed">
          {pillar.body}
        </p>

        {pillar.cta && (
          <a
            href={pillar.cta.href}
            className="inline-flex items-center gap-2 mt-6 font-sans text-xs tracking-[0.2em] uppercase px-5 py-3 border border-white/60 text-white hover:bg-white hover:text-gray-900 transition-colors duration-300 w-fit"
          >
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
            {pillar.cta.label}
          </a>
        )}

        {pillar.images.length > 1 && (
          <div className="flex gap-1.5 mt-4">
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

        {pillar.tags && pillar.tags.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 ${topAligned ? 'mt-auto pt-6' : 'mt-4'}`}>
            {pillar.tags.map(tag => (
              <span key={tag} className="font-sans text-[9px] tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full border border-white/25 text-white/55">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
