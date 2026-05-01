'use client';

import { motion } from 'framer-motion';
import { Mic2, FlaskConical, Cpu } from 'lucide-react';
import { content } from '@/lib/content';

const iconMap = { Mic2, FlaskConical, Cpu } as const;

export default function SpeakerSection() {
  return (
    <section id="vortraege" className="py-36 px-8 max-w-6xl mx-auto">
      <motion.div
        className="mb-24"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <p className="font-sans text-xs tracking-[0.35em] uppercase text-gray-400 mb-6">
          {content.speaker.eyebrow}
        </p>
        <h2 className="font-sans text-4xl md:text-5xl font-light text-gray-900 leading-tight">
          {content.speaker.headline}
        </h2>
        <p className="font-sans text-4xl md:text-5xl font-light text-gray-400 leading-tight">
          {content.speaker.subheadline}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        {content.speaker.cards.map((card, i) => {
          const Icon = iconMap[card.icon];
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: 'easeOut' }}
            >
              <Icon className="w-5 h-5 text-gray-300 mb-5" strokeWidth={1.5} />
              <h3 className="font-sans text-sm font-medium tracking-wider uppercase text-gray-900 mb-3">
                {card.title}
              </h3>
              <p className="font-sans text-sm text-gray-500 leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
