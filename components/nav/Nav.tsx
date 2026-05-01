'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { content } from '@/lib/content';

export default function Nav() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 80], [0, 1]);
  const background = useTransform(
    scrollY,
    [0, 80],
    ['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)'],
  );

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-8 py-5 flex items-center justify-between"
      style={{ opacity, backgroundColor: background, backdropFilter: 'blur(8px)' }}
    >
      <span className="font-sans text-xs font-medium tracking-[0.25em] uppercase text-gray-900">
        {content.nav.name}
      </span>
      <div className="flex gap-8">
        {content.nav.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="font-sans text-xs tracking-widest uppercase text-gray-500 hover:text-gray-900 transition-colors duration-200"
          >
            {link.label}
          </a>
        ))}
      </div>
    </motion.nav>
  );
}
