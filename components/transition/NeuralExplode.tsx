'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { content } from '@/lib/content';

// Compact radial layout in SVG viewBox "-150 -120 300 240"
// Center node + 6 surrounding nodes (radius 72) at 60° intervals
const CENTER = { x: 0, y: 0 };
const R = 72;
const RING = Array.from({ length: 6 }, (_, i) => {
  const θ = (i * Math.PI * 2) / 6 - Math.PI / 2; // start at top
  return { x: Math.cos(θ) * R, y: Math.sin(θ) * R };
});

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
  [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1],
];

// Final exploded positions (px, relative to viewport center via CSS transform)
const EXPLODE_TARGETS = [
  { x: 0, y: -210 },    // top          → Compliance
  { x: 290, y: -160 },  // top-right    → ML Core
  { x: 290, y: 160 },   // bottom-right → Event Bus
  { x: 0, y: 210 },     // bottom       → Sensorik
  { x: -290, y: 160 },  // bottom-left  → Legacy API
  { x: -290, y: -160 }, // top-left     → Safety Layer
];

function ExplodedBox({
  scrollYProgress,
  label,
  target,
}: {
  scrollYProgress: MotionValue<number>;
  label: string;
  target: { x: number; y: number };
}) {
  const x = useTransform(scrollYProgress, [0.28, 0.88], [0, target.x]);
  const y = useTransform(scrollYProgress, [0.28, 0.88], [0, target.y]);
  const opacity = useTransform(scrollYProgress, [0.32, 0.68], [0, 1]);

  return (
    <motion.div
      className="absolute font-mono text-[11px] tracking-wider border border-gray-500/70 px-3.5 py-1.5 whitespace-nowrap pointer-events-none select-none"
      style={{
        x,
        y,
        opacity,
        backgroundColor: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {label}
    </motion.div>
  );
}

export default function NeuralExplode() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const networkOpacity = useTransform(scrollYProgress, [0.08, 0.52], [1, 0]);
  const eyebrowOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const centerBoxOpacity = useTransform(scrollYProgress, [0.32, 0.68], [0, 1]);

  const allNodes = [CENTER, ...RING];

  return (
    <div ref={containerRef} style={{ height: '260vh' }}>
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Eyebrow */}
        <motion.p
          className="absolute top-12 font-sans text-[10px] tracking-[0.35em] uppercase text-gray-400"
          style={{ opacity: eyebrowOpacity }}
        >
          {content.transition.eyebrow}
        </motion.p>

        {/* SVG neural network */}
        <motion.div
          className="absolute"
          style={{ opacity: networkOpacity, width: 300, height: 240 }}
        >
          <svg
            viewBox="-150 -120 300 240"
            className="w-full h-full"
            overflow="visible"
          >
            {/* Edges */}
            {EDGES.map(([a, b]) => {
              const from = allNodes[a];
              const to = allNodes[b];
              return (
                <line
                  key={`e-${a}-${b}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#9ca3af"
                  strokeWidth={0.6}
                />
              );
            })}
            {/* Nodes */}
            {allNodes.map((node, i) => (
              <circle
                key={i}
                cx={node.x}
                cy={node.y}
                r={i === 0 ? 11 : 5}
                fill={i === 0 ? '#374151' : '#6b7280'}
              />
            ))}
          </svg>
        </motion.div>

        {/* Center "KI-System" box — appears when exploded */}
        <motion.div
          className="absolute font-mono text-[11px] tracking-wider border border-gray-900 px-3.5 py-1.5 bg-gray-900 text-white pointer-events-none select-none"
          style={{ opacity: centerBoxOpacity }}
        >
          KI-System
        </motion.div>

        {/* Exploded component boxes */}
        {content.transition.components.map((comp, i) => (
          <ExplodedBox
            key={comp.label}
            scrollYProgress={scrollYProgress}
            label={comp.label}
            target={EXPLODE_TARGETS[i]}
          />
        ))}
      </div>
    </div>
  );
}
