'use client';

import { motion } from 'framer-motion';
import { content } from '@/lib/content';
import LiveDataWidget from './LiveDataWidget';

export default function EngineeringSection() {
  return (
    <section id="projekte" className="engineering-layer min-h-screen py-24 px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-16 pb-8 border-b border-black/10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
        >
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-black/30 mb-5">
            {content.engineering.eyebrow}
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-normal text-gray-900 leading-snug">
            {content.engineering.headline.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="font-mono text-sm text-black/40 mt-5 leading-relaxed">
            {content.engineering.subheadline}
          </p>
        </motion.div>

        {/* Project tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-black/10">
          {content.engineering.projects.map((project, i) => (
            <motion.div
              key={project.id}
              className="border border-black/10 p-8 flex flex-col"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <p className="font-mono text-[10px] text-black/25 mb-5 tracking-widest">
                {project.label}
              </p>
              <h3 className="font-mono text-sm font-medium text-gray-900 mb-3 leading-snug">
                {project.title}
              </h3>
              <p className="font-mono text-xs text-black/50 leading-relaxed mb-6 flex-1">
                {project.description}
              </p>

              {project.hasLiveData && <LiveDataWidget />}

              <div className="flex flex-wrap gap-2 mt-auto">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] border border-black/15 px-2 py-0.5 text-black/40 tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer line */}
        <motion.div
          className="mt-16 pt-8 border-t border-black/10 flex items-center justify-between"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <span className="font-mono text-[10px] text-black/25 tracking-widest uppercase">
            jan.kettler@seedhouse.de
          </span>
          <span className="font-mono text-[10px] text-black/25 tracking-widest uppercase">
            © {new Date().getFullYear()}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
