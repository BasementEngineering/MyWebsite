'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { type MotionValue, useMotionValueEvent } from 'framer-motion';
import { type LayerData } from '@/lib/parseTokenUsage';

// ─── Utilities ────────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const t01 = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut3 = (t: number) => 1 - Math.pow(1 - t, 3);

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      setValue(Math.round(easeOut3(t) * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

// ─── Phone model ─────────────────────────────────────────────────────────────
function Phone({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const s = scrollRef.current;
    // Rotate from side profile (-66°) to slight front angle (+10°)
    const t = easeOut3(t01(s, 0.13, 0.40));
    groupRef.current.rotation.y = lerp(-1.15, 0.18, t);
    // Subtle idle float
    groupRef.current.position.y = Math.sin(performance.now() * 0.0008) * 0.014;
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <RoundedBox args={[1.42, 3.04, 0.14]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.65} />
      </RoundedBox>
      {/* Screen glass */}
      <mesh position={[0, 0.04, 0.076]}>
        <planeGeometry args={[1.18, 2.56]} />
        <meshStandardMaterial color="#090909" roughness={0.05} metalness={0.3} />
      </mesh>
      {/* Hero section strip — dark */}
      <mesh position={[0, 0.86, 0.077]}>
        <planeGeometry args={[1.1, 0.74]} />
        <meshStandardMaterial color="#181818" />
      </mesh>
      {/* Speaker section strip — light */}
      <mesh position={[0, -0.04, 0.077]}>
        <planeGeometry args={[1.1, 0.78]} />
        <meshStandardMaterial color="#f8f8f6" opacity={0.96} transparent />
      </mesh>
      {/* Engineering strip — parchment */}
      <mesh position={[0, -0.91, 0.077]}>
        <planeGeometry args={[1.1, 0.66]} />
        <meshStandardMaterial color="#f2f0e9" opacity={0.94} transparent />
      </mesh>
      {/* Home bar */}
      <mesh position={[0, -1.4, 0.077]}>
        <planeGeometry args={[0.33, 0.026]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* Front camera */}
      <mesh position={[0, 1.37, 0.077]}>
        <circleGeometry args={[0.05, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

// ─── Single exploded layer ────────────────────────────────────────────────────
function Layer({
  scrollRef,
  data,
  index,
  totalLayers,
}: {
  scrollRef: React.MutableRefObject<number>;
  data: LayerData;
  index: number;
  totalLayers: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const triggeredRef = useRef(false);
  const [countActive, setCountActive] = useState(false);

  // Stagger each layer slightly so they explode sequentially
  const stagger = index * 0.06;
  const explodeStart = 0.42 + stagger;
  const explodeEnd = 0.92 + stagger;

  useFrame(() => {
    if (!groupRef.current || !cardRef.current) return;
    const s = scrollRef.current;
    const t = easeOut3(t01(s, explodeStart, explodeEnd));
    const z = lerp(0.08, 2.5 + index * 0.3, t);
    groupRef.current.position.z = z;

    // Fade + scale via direct DOM to avoid per-frame setState
    const opacity = clamp(t01(z, 0.2, 0.7), 0, 1);
    const scale = lerp(0.82, 1.25, t01(z, 0.08, 2.5));
    cardRef.current.style.opacity = String(opacity);
    cardRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;

    if (z > 0.9 && !triggeredRef.current) {
      triggeredRef.current = true;
      setCountActive(true);
    }
  });

  const minutes = useCountUp(data.durationMinutes, 2.2, countActive);
  const tokens = useCountUp(data.tokens, 2.2, countActive);

  const timeStr = `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;

  return (
    <group ref={groupRef} position={[0, 0.04, 0.08]}>
      {/* Invisible anchor mesh */}
      <mesh>
        <planeGeometry args={[1.18, 2.56]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Html style={{ pointerEvents: 'none', overflow: 'visible' }}>
        <div
          ref={cardRef}
          style={{
            position: 'absolute',
            opacity: 0,
            transform: 'translate(-50%, -50%) scale(0.82)',
            width: 280,
            boxSizing: 'border-box',
            fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            border: '1px solid rgba(0,0,0,0.18)',
            backgroundColor: 'rgba(242, 240, 233, 0.96)',
            backdropFilter: 'blur(8px)',
            padding: '20px 22px',
            color: '#1a1a1a',
          }}
        >
          {/* Layer label */}
          <p
            style={{
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(0,0,0,0.28)',
              margin: '0 0 16px 0',
            }}
          >
            // {data.label}
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingBottom: 10,
              }}
            >
              <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.42)' }}>
                Entwicklungszeit
              </span>
              <span
                style={{ fontSize: 14, color: '#15803d', fontWeight: 600, tabularNums: true } as React.CSSProperties}
              >
                {timeStr}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingTop: 10,
                borderTop: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.42)' }}>
                Token-Verbrauch
              </span>
              <span
                style={{ fontSize: 14, color: '#15803d', fontWeight: 600 }}
              >
                {tokens.toLocaleString('de-DE')}
              </span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── Scene root ───────────────────────────────────────────────────────────────
function Scene({
  scrollRef,
  layers,
}: {
  scrollRef: React.MutableRefObject<number>;
  layers: LayerData[];
}) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} />
      <directionalLight position={[-3, 2, -3]} intensity={0.35} color="#c0d8ff" />
      <Phone scrollRef={scrollRef} />
      {layers.map((layer, i) => (
        <Layer
          key={layer.session}
          scrollRef={scrollRef}
          data={layer}
          index={i}
          totalLayers={layers.length}
        />
      ))}
    </>
  );
}

// ─── Canvas wrapper (default export, dynamically imported) ────────────────────
export default function PhoneScene({
  scrollYProgress,
  layers,
}: {
  scrollYProgress: MotionValue<number>;
  layers: LayerData[];
}) {
  // Sync Framer Motion scroll value into a plain ref readable by useFrame
  const scrollRef = useRef(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    scrollRef.current = v;
  });

  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 6], fov: 42 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <Scene scrollRef={scrollRef} layers={layers} />
    </Canvas>
  );
}
