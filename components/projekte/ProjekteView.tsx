'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { type LayerData } from '@/lib/parseTokenUsage';

const DEPLOY_LAYERS = [
  { label: 'Node JS',    color: '#a8b888' },
  { label: 'Coolify',   color: '#c49870' },
  { label: 'Docker',    color: '#8898b8' },
  { label: 'Strato VPS',color: '#b8a0c0' },
] as const;

const DEPLOY_MINUTES = 268;
const DEPLOY_TOKENS  = 34_000;

const PHASE_SCREENSHOTS: (string | null)[] = [
  null,
  '/images/FirstPrototype.jpg',
  '/images/phone-screenshot.jpg',
];

function fmtTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m} h`;
}

export default function ProjekteView({ layers }: { layers: LayerData[] }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f2f0e9' }}>
      <section className="engineering-layer min-h-screen py-32 px-8">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-black/30 mb-4">
              // Projekt: jankettler.info
            </p>
            <h1 className="font-mono text-3xl md:text-4xl font-normal text-gray-900 leading-snug">
              Wie diese Site entstand.
            </h1>
            <p className="font-mono text-sm text-black/40 mt-4 leading-relaxed">
              Transparent gebaut — von der Idee bis zum Deployment.
            </p>
          </motion.div>

          {/* Timeline row */}
          <motion.div
            className="flex items-center gap-5 overflow-x-auto pb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            {/* Phase cards */}
            {layers.map((layer, i) => (
              <div key={layer.session} className="flex flex-col items-center flex-shrink-0">
                <p className="font-mono text-[11px] font-semibold text-gray-900 mb-3 whitespace-nowrap tracking-wide">
                  {layer.label}
                </p>
                <div
                  className="relative overflow-hidden"
                  style={{ width: 128, height: 272, background: '#e8c878' }}
                >
                  {PHASE_SCREENSHOTS[i] && (
                    <Image
                      src={PHASE_SCREENSHOTS[i]!}
                      alt={layer.label}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="mt-3 text-center font-mono text-[11px] text-black/50 leading-relaxed">
                  <div>{fmtTime(layer.durationMinutes)}</div>
                  <div>{layer.tokens.toLocaleString('de-DE')} Tokens</div>
                </div>
              </div>
            ))}

            {/* Phone */}
            <div className="flex-shrink-0 mx-3">
              <div
                className="relative overflow-hidden"
                style={{ width: 80, height: 170, background: '#111111', borderRadius: 9 }}
              >
                <Image
                  src="/images/phone-screenshot.jpg"
                  alt="Ergebnis"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Dashed connector */}
            <div
              className="flex-shrink-0"
              style={{ width: 72, height: 0, borderTop: '1.5px dashed rgba(0,0,0,0.22)' }}
            />

            {/* Deployment stack */}
            <div className="flex-shrink-0">
              <p className="font-mono text-[11px] font-semibold text-gray-900 mb-3 tracking-wide">
                Deployment
              </p>
              <div
                className="border border-black/15 p-2"
                style={{ background: 'rgba(200,212,255,0.07)', width: 192 }}
              >
                <div className="flex flex-col gap-1.5">
                  {DEPLOY_LAYERS.map((dl) => (
                    <div key={dl.label} className="flex items-center gap-2">
                      <div style={{ flex: 1, height: 26, background: dl.color, opacity: 0.85 }} />
                      <span className="font-mono text-[11px] font-semibold text-gray-900 whitespace-nowrap w-[76px]">
                        {dl.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 font-mono text-[11px] text-black/50 leading-relaxed">
                <div>{fmtTime(DEPLOY_MINUTES)}</div>
                <div>{DEPLOY_TOKENS.toLocaleString('de-DE')} Tokens</div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="mt-24 pt-8 border-t border-black/10 flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <span className="font-mono text-[10px] text-black/25 tracking-widest uppercase">
              contact@jankettler.info
            </span>
            <span className="font-mono text-[10px] text-black/25 tracking-widest uppercase">
              © {new Date().getFullYear()}
            </span>
          </motion.div>

        </div>
      </section>
    </div>
  );
}
