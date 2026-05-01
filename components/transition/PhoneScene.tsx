'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { type MotionValue, useMotionValueEvent } from 'framer-motion';
import { type LayerData } from '@/lib/parseTokenUsage';

// ─── Scene constants ──────────────────────────────────────────────────────────
const PHONE_SCALE    = 0.55;   // overall scale of phone + layers group
const GROUP_POS_X    = 0.75;   // final X offset (phone moves right as cam pulls back)
const GROUP_ROT_Y    = -0.35;  // final Y rotation ≈ 20° (screen faces slightly left)
const GROUP_ROT_X    = 0.08;   // constant forward tilt
const LAYER_MAX_Z    = 3.4;    // how far each layer travels in local +Z
const LAYER_STAGGER  = 0.07;   // scroll-progress stagger between layers

// Camera path
const CAM_START = new THREE.Vector3(0,   0,   1.8); // very close, phone fills screen
const CAM_END   = new THREE.Vector3(1.0, 1.5, 7.0); // pulled-back overview angle

// Animation window: camera dolly + phone rotate share the same window
const INTRO_START = 0.14; // after flash fades
const INTRO_END   = 0.46;

// ─── Utilities ────────────────────────────────────────────────────────────────
const clamp    = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const t01      = (v: number, a: number, b: number)   => clamp((v - a) / (b - a), 0, 1);
const lerp     = (a: number, b: number, t: number)   => a + (b - a) * t;
const easeOut3 = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

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

// ─── Camera dolly animation ───────────────────────────────────────────────────
function CameraAnimation({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();

  useFrame(() => {
    const t = easeInOut(t01(scrollRef.current, INTRO_START, INTRO_END));
    camera.position.lerpVectors(CAM_START, CAM_END, t);
    // Look slightly ahead of center so the phone (offset to the right) stays framed
    camera.lookAt(lerp(0, GROUP_POS_X * 0.35, t), 0, 0);
  });

  return null;
}

// ─── Phone model ─────────────────────────────────────────────────────────────
function Phone() {
  // Use a ref + imperative update — conditionally swapping JSX material children
  // in r3f is unreliable; direct mutation + needsUpdate is the safe pattern.
  const screenMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const [hasScreenshot, setHasScreenshot] = useState(false);

  useEffect(() => {
    new THREE.TextureLoader().load(
      '/images/phone-screenshot.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (screenMatRef.current) {
          screenMatRef.current.map        = tex;
          screenMatRef.current.color.set('#ffffff');
          screenMatRef.current.needsUpdate = true;
        }
        setHasScreenshot(true);
      },
      undefined,
      () => {},
    );
  }, []);

  return (
    <>
      <RoundedBox args={[1.42, 3.04, 0.14]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color="#111111" roughness={0.28} metalness={0.7} />
      </RoundedBox>

      {/* Unlit material so the screen shows at full brightness like a real display */}
      <mesh position={[0, 0.04, 0.076]}>
        <planeGeometry args={[1.18, 2.56]} />
        <meshBasicMaterial ref={screenMatRef} color="#090909" />
      </mesh>

      {!hasScreenshot && (
        <>
          <mesh position={[0,  0.86, 0.077]}><planeGeometry args={[1.1, 0.74]} /><meshStandardMaterial color="#181818" /></mesh>
          <mesh position={[0, -0.04, 0.077]}><planeGeometry args={[1.1, 0.78]} /><meshStandardMaterial color="#f8f8f6" opacity={0.96} transparent /></mesh>
          <mesh position={[0, -0.91, 0.077]}><planeGeometry args={[1.1, 0.66]} /><meshStandardMaterial color="#f2f0e9" opacity={0.94} transparent /></mesh>
        </>
      )}

      <mesh position={[0, -1.40, 0.077]}>
        <planeGeometry args={[0.33, 0.026]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0, 1.37, 0.077]}>
        <circleGeometry args={[0.05, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </>
  );
}

// ─── Single exploded layer ────────────────────────────────────────────────────
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

  const explodeStart = 0.44 + index * LAYER_STAGGER;
  const explodeEnd   = 0.92 + index * LAYER_STAGGER;

  useFrame(() => {
    if (!groupRef.current || !cardRef.current) return;
    const s = scrollRef.current;
    const t = easeOut3(t01(s, explodeStart, explodeEnd));
    const z = lerp(0.09, LAYER_MAX_Z + index * 0.35, t);
    groupRef.current.position.z = z;

    const opacity = clamp(t01(z, 0.2, 0.75), 0, 1);
    const scale   = lerp(0.78, 1.18, t01(z, 0.09, LAYER_MAX_Z));
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
      {/* Translucent glass panel */}
      <mesh>
        <planeGeometry args={[1.18, 2.56]} />
        <meshStandardMaterial color="#e8e6df" transparent opacity={0.06} roughness={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Wire-frame border: top, bottom, left, right */}
      {([
        [0,  1.285, 0, 1.18,  0.008],
        [0, -1.285, 0, 1.18,  0.008],
        [-0.592, 0, 0, 0.008, 2.57 ],
        [ 0.592, 0, 0, 0.008, 2.57 ],
      ] as [number,number,number,number,number][]).map(([x,y,z,w,h], i) => (
        <mesh key={i} position={[x, y, z]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#555555" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      ))}

      <Html style={{ pointerEvents: 'none', overflow: 'visible' }}>
        <div
          ref={cardRef}
          style={{
            position: 'absolute', opacity: 0,
            transform: 'translate(-50%, -50%) scale(0.78)',
            width: 210, boxSizing: 'border-box',
            fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            border: '1px solid rgba(0,0,0,0.18)',
            backgroundColor: 'rgba(242,240,233,0.97)',
            backdropFilter: 'blur(10px)',
            padding: '17px 18px', color: '#1a1a1a',
          }}
        >
          <p style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.28)', margin: '0 0 14px 0' }}>
            // {data.label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              ['Entwicklungszeit', timeStr,                             '#15803d', 13],
              ['Token-Verbrauch',  tokens.toLocaleString('de-DE'),     '#15803d', 13],
              ['KI-Provider',      data.aiProvider,                    'rgba(0,0,0,0.6)', 11],
            ].map(([label, val, color, size], i, arr) => (
              <div key={label as string} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                paddingTop: i > 0 ? 9 : 0, paddingBottom: i < arr.length - 1 ? 9 : 0,
                borderTop: i > 0 ? '1px solid rgba(0,0,0,0.08)' : 'none',
              }}>
                <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.42)' }}>{label}</span>
                <span style={{ fontSize: size as number, color: color as string, fontWeight: 600 }}>{val}</span>
              </div>
            ))}
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
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = easeInOut(t01(scrollRef.current, INTRO_START, INTRO_END));
    // Phone moves right + rotates to 20° as camera pulls back
    groupRef.current.position.x  = lerp(0,         GROUP_POS_X, t);
    groupRef.current.rotation.y  = lerp(0,         GROUP_ROT_Y, t);
    groupRef.current.rotation.x  = GROUP_ROT_X;
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 4]}   intensity={1.3} />
      <directionalLight position={[-3, 2, -2]}  intensity={0.4}  color="#bfd4ff" />
      <directionalLight position={[0, -3, 2]}   intensity={0.15} />

      <CameraAnimation scrollRef={scrollRef} />

      {/* Phone + layers share one group so layers always explode in phone-local +Z */}
      <group
        ref={groupRef}
        position={[0, 0, 0]}        // starts centered; animated above
        rotation={[GROUP_ROT_X, 0, 0]}
        scale={PHONE_SCALE}
      >
        <Phone />
        {layers.map((layer, i) => (
          <Layer key={layer.session} scrollRef={scrollRef} data={layer} index={i} />
        ))}
      </group>
    </>
  );
}

// ─── Canvas (dynamically imported, ssr: false) ────────────────────────────────
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
      camera={{ position: [0, 0, 1.8], fov: 40 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <Scene scrollRef={scrollRef} layers={layers} />
    </Canvas>
  );
}
