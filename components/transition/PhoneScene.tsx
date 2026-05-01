'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { type MotionValue, useMotionValueEvent } from 'framer-motion';
import { type LayerData } from '@/lib/parseTokenUsage';

// ─── Scene constants — tune these to taste ────────────────────────────────────
const PHONE_SCALE   = 0.55;         // overall size of phone + layers group
const GROUP_POS_X   = 0.75;         // push phone right so layers extend past center
const GROUP_ROT_Y   = -0.58;        // ~33° — angled view (neg = screen faces right)
const GROUP_ROT_X   = 0.10;         // slight forward tilt for depth
const LAYER_MAX_Z   = 3.4;          // how far left each layer travels (local +Z)
const LAYER_STAGGER = 0.07;         // scroll-progress stagger between layers

// ─── Utilities ────────────────────────────────────────────────────────────────
const clamp    = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const t01      = (v: number, a: number, b: number)   => clamp((v - a) / (b - a), 0, 1);
const lerp     = (a: number, b: number, t: number)   => a + (b - a) * t;
const easeOut3 = (t: number) => 1 - Math.pow(1 - t, 3);

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min((now - start) / (duration * 1000), 1);
      setValue(Math.round(easeOut3(elapsed) * target));
      if (elapsed < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

// ─── Phone ───────────────────────────────────────────────────────────────────
function Phone() {
  const [screenshot, setScreenshot] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    new THREE.TextureLoader().load(
      '/images/phone-screenshot.png',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setScreenshot(tex);
      },
      undefined,
      () => {}, // silently fall back when file is missing
    );
  }, []);

  return (
    <>
      {/* Body */}
      <RoundedBox args={[1.42, 3.04, 0.14]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color="#111111" roughness={0.28} metalness={0.7} />
      </RoundedBox>

      {/* Screen — screenshot or dark glass */}
      <mesh position={[0, 0.04, 0.076]}>
        <planeGeometry args={[1.18, 2.56]} />
        {screenshot ? (
          <meshStandardMaterial
            map={screenshot}
            roughness={0.08}
            metalness={0.08}
            toneMapped={false}
          />
        ) : (
          <meshStandardMaterial color="#090909" roughness={0.05} metalness={0.3} />
        )}
      </mesh>

      {/* Fallback section strips — only when no screenshot */}
      {!screenshot && (
        <>
          <mesh position={[0, 0.86, 0.077]}>
            <planeGeometry args={[1.1, 0.74]} />
            <meshStandardMaterial color="#181818" />
          </mesh>
          <mesh position={[0, -0.04, 0.077]}>
            <planeGeometry args={[1.1, 0.78]} />
            <meshStandardMaterial color="#f8f8f6" opacity={0.96} transparent />
          </mesh>
          <mesh position={[0, -0.91, 0.077]}>
            <planeGeometry args={[1.1, 0.66]} />
            <meshStandardMaterial color="#f2f0e9" opacity={0.94} transparent />
          </mesh>
        </>
      )}

      {/* Home indicator */}
      <mesh position={[0, -1.40, 0.077]}>
        <planeGeometry args={[0.33, 0.026]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Front camera */}
      <mesh position={[0, 1.37, 0.077]}>
        <circleGeometry args={[0.05, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </>
  );
}

// ─── Single exploded layer ────────────────────────────────────────────────────
// Moves in local +Z of the parent rotated group.
// Because GROUP_ROT_Y ≈ -33°, local +Z maps to world (-sin33°, 0, cos33°),
// which appears as "to the left" from the camera position.
function Layer({
  scrollRef,
  data,
  index,
}: {
  scrollRef: React.MutableRefObject<number>;
  data: LayerData;
  index: number;
}) {
  const groupRef  = useRef<THREE.Group>(null);
  const cardRef   = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);
  const [countActive, setCountActive] = useState(false);

  const explodeStart = 0.40 + index * LAYER_STAGGER;
  const explodeEnd   = 0.90 + index * LAYER_STAGGER;

  useFrame(() => {
    if (!groupRef.current || !cardRef.current) return;
    const s = scrollRef.current;
    const t = easeOut3(t01(s, explodeStart, explodeEnd));
    const z = lerp(0.08, LAYER_MAX_Z + index * 0.35, t);
    groupRef.current.position.z = z;

    // Opacity + scale directly on DOM — avoids per-frame setState
    const opacity = clamp(t01(z, 0.2, 0.75), 0, 1);
    const scale   = lerp(0.78, 1.18, t01(z, 0.08, LAYER_MAX_Z));
    cardRef.current.style.opacity   = String(opacity);
    cardRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;

    if (z > 0.9 && !triggered.current) {
      triggered.current = true;
      setCountActive(true);
    }
  });

  const minutes = useCountUp(data.durationMinutes, 2.2, countActive);
  const tokens  = useCountUp(data.tokens,          2.2, countActive);
  const timeStr = `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;

  return (
    <group ref={groupRef} position={[0, 0.04, 0.09]}>
      {/* Glass-panel plane — gives a subtle translucent layer feel */}
      <mesh>
        <planeGeometry args={[1.18, 2.56]} />
        <meshStandardMaterial
          color="#e8e6df"
          transparent
          opacity={0.06}
          roughness={0.1}
          metalness={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Thin border frame — four edge meshes */}
      {([
        [0,  1.285, 0, 1.18, 0.008],  // top
        [0, -1.285, 0, 1.18, 0.008],  // bottom
        [-0.592, 0, 0, 0.008, 2.57],  // left
        [ 0.592, 0, 0, 0.008, 2.57],  // right
      ] as [number, number, number, number, number][]).map(([x, y, z, w, h], i) => (
        <mesh key={i} position={[x, y, z]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#555555" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      ))}

      <Html style={{ pointerEvents: 'none', overflow: 'visible' }}>
        <div
          ref={cardRef}
          style={{
            position:        'absolute',
            opacity:         0,
            transform:       'translate(-50%, -50%) scale(0.78)',
            width:           210,
            boxSizing:       'border-box',
            fontFamily:      'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            border:          '1px solid rgba(0,0,0,0.18)',
            backgroundColor: 'rgba(242, 240, 233, 0.97)',
            backdropFilter:  'blur(10px)',
            padding:         '17px 18px',
            color:           '#1a1a1a',
          }}
        >
          <p style={{
            fontSize:      9,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color:         'rgba(0,0,0,0.28)',
            margin:        '0 0 14px 0',
          }}>
            // {data.label}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'baseline',
              paddingBottom:  9,
            }}>
              <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.42)' }}>
                Entwicklungszeit
              </span>
              <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>
                {timeStr}
              </span>
            </div>
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'baseline',
              paddingTop:     9,
              paddingBottom:  9,
              borderTop:      '1px solid rgba(0,0,0,0.08)',
            }}>
              <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.42)' }}>
                Token-Verbrauch
              </span>
              <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>
                {tokens.toLocaleString('de-DE')}
              </span>
            </div>
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'baseline',
              paddingTop:     9,
              borderTop:      '1px solid rgba(0,0,0,0.08)',
            }}>
              <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.42)' }}>
                KI-Provider
              </span>
              <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 500 }}>
                {data.aiProvider}
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
      {/* Lighting — premium metallic feel */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 4]}  intensity={1.3} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#bfd4ff" />
      <directionalLight position={[0, -3, 2]}  intensity={0.15} />

      {/* Single group: phone + layers — rotation makes local +Z go left on screen */}
      <group
        position={[GROUP_POS_X, 0, 0]}
        rotation={[GROUP_ROT_X, GROUP_ROT_Y, 0]}
        scale={PHONE_SCALE}
      >
        <Phone />
        {layers.map((layer, i) => (
          <Layer
            key={layer.session}
            scrollRef={scrollRef}
            data={layer}
            index={i}
          />
        ))}
      </group>
    </>
  );
}

// ─── Canvas (default export — dynamically imported with ssr:false) ────────────
export default function PhoneScene({
  scrollYProgress,
  layers,
}: {
  scrollYProgress: MotionValue<number>;
  layers: LayerData[];
}) {
  const scrollRef = useRef(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    scrollRef.current = v;
  });

  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      // Camera: slightly right + elevated → 30-45° overview angle
      camera={{ position: [1, 1.5, 7], fov: 40 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <Scene scrollRef={scrollRef} layers={layers} />
    </Canvas>
  );
}
