'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { content } from '@/lib/content';

export default function KontaktSection() {
  return (
    <section id="kontakt" className="py-32 px-6 bg-gray-950 text-white text-center">
      <div className="max-w-xl mx-auto">
        <motion.h2
          className="font-sans font-light text-3xl md:text-5xl leading-snug mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          {content.kontakt.intro}
        </motion.h2>

        <motion.a
          href={`mailto:${content.kontakt.email}`}
          className="font-sans text-sm tracking-[0.15em] text-white/60 hover:text-white transition-colors duration-300 block mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {content.kontakt.email}
        </motion.a>

        <motion.div
          className="flex justify-center gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          {content.kontakt.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-sans text-xs tracking-[0.25em] uppercase text-white/40 hover:text-white transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </motion.div>

        <div className="mt-16 flex justify-center gap-8">
          <Link
            href="/impressum"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/20 hover:text-white/50 transition-colors duration-300"
          >
            Impressum
          </Link>
          <Link
            href="/datenschutz"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/20 hover:text-white/50 transition-colors duration-300"
          >
            Datenschutz
          </Link>
        </div>
      </div>
    </section>
  );
}
