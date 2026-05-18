'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { PillarCard } from './PillarCard';
import { content } from '@/lib/content';

function parseDate(dateStr: string): Date {
  const [d, m, y] = dateStr.split('.');
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}

const COLLAPSED_COUNT = 3;

// ─── Auftritte ────────────────────────────────────────────────────────────────
const SLAMS: { date: string; event: string; location: string; placement: number | null }[] = [
  { date: '27.06.2024', event: 'Science Slam der Hochschule Osnabrück',               location: 'Büdchen am Westerberg, Osnabrück', placement: 1    },
  { date: '17.03.2025', event: 'Nationale Konferenz IT-Sicherheitsforschung 2025',     location: 'Berlin',                           placement: 1    },
  { date: '29.04.2025', event: 'Science Slam',                                         location: 'Lagerhalle, Osnabrück',            placement: null },
  { date: '19.06.2025', event: 'Best of Science Slam',                                 location: 'Laeiszhalle, Hamburg',             placement: null },
  { date: '12.07.2025', event: 'Science Slam unterm Apfelbaum',                        location: 'Düsseldorf',                       placement: 2    },
  { date: '22.10.2025', event: 'Deutsche Science Slam Meisterschaft Vorentscheid Nord',location: 'Hamburg',                          placement: 3    },
  { date: '25.10.2025', event: 'Science Slam',                                         location: 'Lübeck',                           placement: 1    },
  { date: '26.10.2025', event: 'Science Slam',                                         location: 'Space Hub, Bremen',                placement: 1    },
  { date: '20.02.2026', event: 'Science Slam',                                         location: 'Nordhorn',                         placement: 1    },
  { date: '16.03.2026', event: 'Science Slam der Osnabrücker Hochschule',              location: 'Alando, Osnabrück',                placement: 2    },
  { date: '25.04.2026', event: 'Best of Science Slam',                                 location: 'Theater Osnabrück',                placement: null },
  { date: '28.04.2026', event: 'Best of Science Slam',                                 location: 'Theater Münster',                  placement: null },
  { date: '05.05.2026', event: 'Science Slam',                                         location: 'GOP Bremen',                       placement: 1    },
  { date: '09.06.2026', event: 'Aging with Tech Festival',                             location: 'Körberstiftung, Hamburg',          placement: null },
  { date: '26.06.2026', event: 'Niedersächsisches Science Slam Finale',                location: 'Hannover',                         placement: null },
];

// ─────────────────────────────────────────────────────────────────────────────

function SlamList() {
  const [expanded, setExpanded] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...SLAMS].sort(
    (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()
  );

  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT);
  const hidden  = sorted.length - COLLAPSED_COUNT;
  let todayLineShown = false;

  return (
    <section className="px-6 py-20 max-w-5xl mx-auto">
      <motion.div
        className="flex items-baseline justify-between mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <p className="font-sans text-xs tracking-[0.35em] uppercase text-gray-400">
          Bühnenauftritte
        </p>
        <span className="font-sans text-xs text-gray-300 tracking-wider">
          {sorted.length} Events
        </span>
      </motion.div>

      <motion.p
        className="font-sans text-sm text-gray-500 mb-10 -mt-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        Hier eine Übersicht meinerbisherigen Science Slam Auftritte.
      </motion.p>

      <div>
        <AnimatePresence initial={false}>
          {visible.map((s, i) => {
            const isPast = parseDate(s.date) < today;
            const showToday = !todayLineShown && isPast;
            if (showToday) todayLineShown = true;

            return (
              <motion.div key={s.date + s.event}>
                {showToday && (
                  <div className="grid grid-cols-[6rem_1fr] md:grid-cols-[8rem_1fr] gap-6 py-4 border-t border-gray-100 items-center">
                    <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-amber-500 font-medium">Heute</span>
                    <div className="h-px bg-amber-400 relative">
                      <span className="absolute left-0 -top-1.5 w-3 h-3 rounded-full bg-amber-400" />
                    </div>
                  </div>
                )}
                <motion.div
                  className="grid grid-cols-[6rem_1fr] md:grid-cols-[8rem_1fr] gap-6 py-6 border-t border-gray-100 items-start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isPast ? 1 : 0.6, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                >
                  <span className="font-sans text-xs text-gray-300 tracking-wider pt-0.5">{s.date}</span>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-sans text-sm font-medium text-gray-900 mb-0.5">{s.event}</p>
                      <p className="font-sans text-xs text-gray-400">{s.location}</p>
                    </div>
                    {s.placement !== null && (
                      <span className={`flex-shrink-0 font-sans text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 border ${
                        s.placement === 1
                          ? 'border-gray-900 text-gray-900'
                          : 'border-gray-300 text-gray-400'
                      }`}>
                        {s.placement}. Platz
                      </span>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {sorted.length > COLLAPSED_COUNT && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-6 flex items-center gap-2 font-sans text-xs tracking-[0.2em] uppercase text-gray-400 hover:text-gray-900 transition-colors duration-300"
        >
          {expanded
            ? <><ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} />Weniger anzeigen</>
            : <><ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />{hidden} weitere anzeigen</>
          }
        </button>
      )}
    </section>
  );
}

export default function SpeakerPage() {
  return (
    <main className="bg-white min-h-screen">

      {/* ── Zurück ─────────────────────────────────────────────────────────── */}
      <div className="px-6 pt-20 max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.2em] uppercase text-gray-400 hover:text-gray-900 transition-colors duration-300"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Zurück
        </Link>
      </div>

      {/* ── Intro ──────────────────────────────────────────────────────────── */}
      <section className="px-6 pt-20 pb-20 max-w-5xl mx-auto">
        <motion.p
          className="font-sans text-xs tracking-[0.35em] uppercase text-gray-400 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          Speaker · Workshops · Science Slam
        </motion.p>
        <motion.h1
          className="font-sans font-light text-gray-900 text-4xl md:text-5xl leading-tight mb-8 max-w-2xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Ich stehe gerne auf der Bühne —
          und nutze das, um Dinge zu erklären.
        </motion.h1>
        <motion.p
          className="font-sans text-sm text-gray-500 leading-relaxed max-w-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Seit Jahren fahre ich zu Science Slams und merke jedes Mal: komplexe Themen kommen an,
          wenn man direkt und ehrlich ist. Genau das versuche ich auch in Vorträgen und Workshops.
        </motion.p>
      </section>

      <div className="border-t border-gray-100" />

      {/* ── Angebote ───────────────────────────────────────────────────────── */}
      <section className="py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.p
            className="font-sans text-xs tracking-[0.35em] uppercase text-gray-400 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {content.speakerOfferings.intro}
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {content.speakerOfferings.pillars.map((pillar, i) => (
              <PillarCard key={pillar.label} pillar={pillar} index={i} topAligned />
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* ── Bühnenauftritte ────────────────────────────────────────────────── */}
      <SlamList />

      <div className="border-t border-gray-100" />

      {/* ── Kontakt ────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <motion.p
          className="font-sans text-sm text-gray-500 leading-relaxed max-w-md mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          Ich freue mich über Anfragen für Vorträge, Workshops oder Science Slam Auftritte.
          Schreiben Sie mir kurz, was Sie vorhaben und wir finden gemeinsam eine Konzept. 
          Ich melde mich innerhalb von 48 Stunden.
        </motion.p>
        <motion.a
          href="mailto:contact@jankettler.info"
          className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.2em] uppercase px-6 py-3.5 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors duration-300"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
          contact@jankettler.info
        </motion.a>
      </section>

    </main>
  );
}
