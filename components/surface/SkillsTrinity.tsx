'use client';

import { motion } from 'framer-motion';
import { content } from '@/lib/content';
import { PillarCard } from './PillarCard';

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

      </div>
    </section>
  );
}
