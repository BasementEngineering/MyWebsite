'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox, Line } from '@react-three/drei';
import { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { type MotionValue, useMotionValueEvent } from 'framer-motion';
import { type LayerData } from '@/lib/parseTokenUsage';

// ─── Scene constants ──────────────────────────────────────────────────────────
const PHONE_SCALE = 0.55;
const PHONE_ROT_Y = -0.18;
const PHONE_ROT_X = 0.06;

const CAM_START = new THREE.Vector3(0, 0, 2.2);
const CAM_END   = new THREE.Vector3(0, 0.8, 10.5);

const INTRO_START = 0.14;
const INTRO_END   = 0.46;

// Phase panels (left side)
const PANEL_W       = 0.7;
const PANEL_H       = 1.5;
const PANEL_FINAL_X = [-3.8, -2.5, -1.2] as const;
// Optional screenshot per panel (null = blank parchment)
const PANEL_SCREENSHOTS: (string | null)[] = [
  null,
  '/images/FirstPrototype.jpg',
  '/images/phone-screenshot.jpg',
];

// Deployment cube (right side)
const STACK_FINAL_X = 2.7;
const CUBE_W        = 1.4;
const CUBE_H        = 1.2;
const CUBE_D        = 0.9;
// Layer slabs inside the cube
const LAYER_W       = 1.1;
const LAYER_H       = 0.20;
const LAYER_D       = 0.7;
const layerY        = (i: number) => 0.32 - i * 0.32;  // 0.32, 0, -0.32 (tighter spacing)

// Cube = Linux VPS. Layers from top to bottom: Node JS → Docker → Coolify.
const DEPLOY_LAYERS = [
  { label: 'Node JS', color: '#a8b888' },  // muted sage green
  { label: 'Docker',  color: '#8898b8' },  // muted slate blue
  { label: 'Coolify', color: '#c49870' },  // warm sand — bottom layer
] as const;
// Deployment session stats shown below the cube
const DEPLOY_MINUTES = 268;   // 4 h 28 m — update as needed
const DEPLOY_TOKENS  = 34000;

// ─── Utilities ────────────────────────────────────────────────────────────────
const clamp    = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const t01      = (v: number, a: number, b: number)   => clamp((v - a) / (b - a), 0, 1);
const lerp     = (a: number, b: number, t: number)   => a + (b - a) * t;
const easeOut3 = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

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

// ─── Camera animation ─────────────────────────────────────────────────────────
function CameraAnimation({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  useFrame(() => {
    const t = easeInOut(t01(scrollRef.current, INTRO_START, INTRO_END));
    camera.position.lerpVectors(CAM_START, CAM_END, t);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Phone ────────────────────────────────────────────────────────────────────
function Phone({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const groupRef    = useRef<THREE.Group>(null);
  const screenMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const [hasScreenshot, setHasScreenshot] = useState(false);

  useEffect(() => {
    new THREE.TextureLoader().load('/images/phone-screenshot.jpg', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      if (screenMatRef.current) {
        screenMatRef.current.map = tex;
        screenMatRef.current.color.set('#ffffff');
        screenMatRef.current.needsUpdate = true;
      }
      setHasScreenshot(true);
    }, undefined, () => {});
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = easeInOut(t01(scrollRef.current, INTRO_START, INTRO_END));
    groupRef.current.rotation.y = lerp(0, PHONE_ROT_Y, t);
    groupRef.current.rotation.x = PHONE_ROT_X;
  });

  return (
    <group ref={groupRef} scale={PHONE_SCALE}>
      <RoundedBox args={[1.42, 3.04, 0.14]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color="#111111" roughness={0.28} metalness={0.7} />
      </RoundedBox>
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
    </group>
  );
}

// ─── Phase panel (flies left) ─────────────────────────────────────────────────
function PhasePanel({
  scrollRef, data, index, finalX,
}: {
  scrollRef: React.MutableRefObject<number>;
  data: LayerData;
  index: number;
  finalX: number;
}) {
  const groupRef    = useRef<THREE.Group>(null);
  const screenMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const aboveRef    = useRef<HTMLDivElement>(null);
  const belowRef    = useRef<HTMLDivElement>(null);
  const triggered   = useRef(false);
  const [countActive, setCountActive] = useState(false);

  const screenshotPath = PANEL_SCREENSHOTS[index] ?? null;

  useEffect(() => {
    if (!screenshotPath) return;
    new THREE.TextureLoader().load(screenshotPath, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      if (screenMatRef.current) {
        screenMatRef.current.map = tex;
        screenMatRef.current.color.set('#ffffff');
        screenMatRef.current.needsUpdate = true;
      }
    }, undefined, () => {});
  }, [screenshotPath]);

  const start = 0.44 + index * 0.08;
  const end   = 0.88 + index * 0.08;

  useFrame(() => {
    if (!groupRef.current) return;
    const t    = easeOut3(t01(scrollRef.current, start, end));
    const rotT = easeInOut(t01(scrollRef.current, INTRO_START, INTRO_END));
    groupRef.current.position.x = lerp(0, finalX, t);
    groupRef.current.rotation.y = lerp(0, PHONE_ROT_Y, rotT);
    groupRef.current.rotation.x = PHONE_ROT_X;
    const op = String(clamp(t01(t, 0.25, 0.65), 0, 1));
    if (aboveRef.current) aboveRef.current.style.opacity = op;
    if (belowRef.current) belowRef.current.style.opacity = op;
    if (t > 0.05 && !triggered.current) { triggered.current = true; setCountActive(true); }
  });

  const minutes = useCountUp(data.durationMinutes, 3.0, countActive);
  const tokens  = useCountUp(data.tokens, 3.0, countActive);
  const hh = Math.floor(minutes / 60);
  const mm = String(minutes % 60).padStart(2, '0');

  return (
    <group ref={groupRef}>
      {/* Panel body */}
      <mesh>
        <boxGeometry args={[PANEL_W, PANEL_H, 0.05]} />
        <meshStandardMaterial color="#e8c878" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* Front face: screenshot (unlit) or matching parchment */}
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[PANEL_W, PANEL_H]} />
        <meshBasicMaterial ref={screenMatRef} color="#e8c878" />
      </mesh>

      {/* Label above */}
      <group position={[0, PANEL_H / 2 + 0.14, 0]}>
        <Html center style={{ pointerEvents: 'none' }}>
          <div ref={aboveRef} style={{
            opacity: 0,
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            fontSize: 11,
            fontWeight: 600,
            color: '#1a1a1a',
            letterSpacing: '0.03em',
          }}>
            {data.label}
          </div>
        </Html>
      </group>

      {/* Stats below — pushed well clear of the panel */}
      <group position={[0, -PANEL_H / 2 - 0.25, 0]}>
        <Html center style={{ pointerEvents: 'none' }}>
          <div ref={belowRef} style={{
            opacity: 0,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            color: 'rgba(0,0,0,0.5)',
            lineHeight: 1.6,
          }}>
            <div style={{ fontSize: 11 }}>{hh}:{mm} h</div>
            <div style={{ fontSize: 11 }}>{tokens.toLocaleString('de-DE')} Tokens</div>
          </div>
        </Html>
      </group>
    </group>
  );
}

// ─── Deployment cube (flies right) ────────────────────────────────────────────
function DeploymentStack({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const groupRef         = useRef<THREE.Group>(null);
  const cubeMatRef       = useRef<THREE.MeshStandardMaterial>(null);
  const edgesMatRef      = useRef<THREE.LineBasicMaterial>(null);
  const slabMatRefs      = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lineGroupRefs    = useRef<(THREE.Group | null)[]>([]);
  const calloutLineRef   = useRef<THREE.Group>(null);
  const titleRef         = useRef<HTMLDivElement>(null);
  const vpsLabelRef      = useRef<HTMLDivElement>(null);
  const belowRef         = useRef<HTMLDivElement>(null);
  const labelsRef        = useRef<(HTMLDivElement | null)[]>([]);
  const triggered        = useRef(false);
  const [countActive, setCountActive] = useState(false);

  const edgesGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE_W, CUBE_H, CUBE_D)),
    []
  );

  // Stack starts after all panels have left. Layers appear bottom → top.
  // index 0 = Node JS (top), index 2 = Docker (bottom) → Docker pops first.
  const LAYER_IN  = [0.86, 0.82, 0.78] as const; // [NodeJS, Coolify, Docker]
  const LAYER_OUT = [0.92, 0.88, 0.84] as const;

  useFrame(() => {
    if (!groupRef.current) return;
    const s = scrollRef.current;

    // Group slides into position after panels (0.62 → 0.82)
    const t    = easeOut3(t01(s, 0.62, 0.82));
    const rotT = easeInOut(t01(s, INTRO_START, INTRO_END));
    groupRef.current.position.x = lerp(0, STACK_FINAL_X, t);
    groupRef.current.rotation.y = lerp(0, PHONE_ROT_Y, rotT);
    groupRef.current.rotation.x = PHONE_ROT_X;

    // Cube + edges + VPS callout fade in once group arrives
    const cubeT = clamp(t01(s, 0.72, 0.80), 0, 1);
    if (cubeMatRef.current)     cubeMatRef.current.opacity  = lerp(0, 0.07, cubeT);
    if (edgesMatRef.current)    edgesMatRef.current.opacity = lerp(0, 0.5,  cubeT);
    if (calloutLineRef.current) calloutLineRef.current.visible = cubeT > 0;
    if (titleRef.current)       titleRef.current.style.opacity    = String(cubeT);
    if (vpsLabelRef.current)    vpsLabelRef.current.style.opacity = String(cubeT);

    // Layers stagger in bottom → top (Docker first, Node JS last)
    DEPLOY_LAYERS.forEach((_, i) => {
      const lt = clamp(t01(s, LAYER_IN[i], LAYER_OUT[i]), 0, 1);
      const mat = slabMatRefs.current[i];
      if (mat) mat.opacity = lt;
      const lineGrp = lineGroupRefs.current[i];
      if (lineGrp) lineGrp.visible = lt > 0;
      const lbl = labelsRef.current[i];
      if (lbl) lbl.style.opacity = String(lt);
    });

    // Stats below follow the last layer (Node JS)
    const lastT = clamp(t01(s, LAYER_IN[0], LAYER_OUT[0]), 0, 1);
    if (belowRef.current) belowRef.current.style.opacity = String(lastT);

    if (s > LAYER_IN[2] && !triggered.current) { triggered.current = true; setCountActive(true); }
  });

  const deployMinutes = useCountUp(DEPLOY_MINUTES, 3.0, countActive);
  const deployTokens  = useCountUp(DEPLOY_TOKENS,  3.0, countActive);
  const hh = Math.floor(deployMinutes / 60);
  const mm = String(deployMinutes % 60).padStart(2, '0');

  return (
    <group ref={groupRef}>
      {/* Title above */}
      <group position={[0, CUBE_H / 2 + 0.18, 0]}>
        <Html center style={{ pointerEvents: 'none' }}>
          <div ref={titleRef} style={{
            opacity: 0,
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            fontSize: 11, fontWeight: 600, color: '#1a1a1a', letterSpacing: '0.03em',
          }}>
            Deployment
          </div>
        </Html>
      </group>

      {/* Translucent cube faces */}
      <mesh renderOrder={2}>
        <boxGeometry args={[CUBE_W, CUBE_H, CUBE_D]} />
        <meshStandardMaterial
          ref={cubeMatRef}
          color="#c8d4ff"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Cube wireframe edges */}
      <lineSegments geometry={edgesGeo} renderOrder={3}>
        <lineBasicMaterial ref={edgesMatRef} color="#8899cc" transparent opacity={0} />
      </lineSegments>

      {/* "Linux VPS" callout — line from bottom-right corner to label */}
      <group ref={calloutLineRef} visible={false}>
        <Line
          points={[
            [CUBE_W / 2, -CUBE_H / 2, 0],
            [CUBE_W / 2 + 0.45, -CUBE_H / 2 - 0.35, 0],
          ]}
          color="#888888"
          lineWidth={1}
        />
        <group position={[CUBE_W / 2 + 0.48, -CUBE_H / 2 - 0.35, 0]}>
          <Html style={{ pointerEvents: 'none' }}>
            <div ref={vpsLabelRef} style={{
              opacity: 0,
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
              fontSize: 11, fontWeight: 600, color: '#1a1a1a',
              transform: 'translateY(-50%)',
            }}>
              Linux VPS
            </div>
          </Html>
        </group>
      </group>

      {/* Layer slabs — stagger in after cube */}
      {DEPLOY_LAYERS.map((layer, i) => (
        <group key={layer.label} position={[0, layerY(i), 0]}>
          <mesh renderOrder={1}>
            <boxGeometry args={[LAYER_W, LAYER_H, LAYER_D]} />
            <meshStandardMaterial
              ref={el => { slabMatRefs.current[i] = el; }}
              color={layer.color}
              transparent
              opacity={0}
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>

          {/* Connecting line (hidden until slab appears) */}
          <group ref={el => { lineGroupRefs.current[i] = el; }} visible={false}>
            <Line
              points={[[LAYER_W / 2, 0, 0], [CUBE_W / 2 + 0.12, 0, 0]]}
              color="#888888"
              lineWidth={1}
            />
          </group>

          {/* Label outside cube */}
          <group position={[CUBE_W / 2 + 0.15, 0, 0]}>
            <Html style={{ pointerEvents: 'none' }}>
              <div
                ref={el => { labelsRef.current[i] = el; }}
                style={{
                  opacity: 0,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
                  fontSize: 11, fontWeight: 600, color: '#1a1a1a',
                  transform: 'translateY(-50%)',
                }}
              >
                {layer.label}
              </div>
            </Html>
          </group>
        </group>
      ))}

      {/* Time + tokens below cube */}
      <group position={[0, -CUBE_H / 2 - 0.25, 0]}>
        <Html center style={{ pointerEvents: 'none' }}>
          <div ref={belowRef} style={{
            opacity: 0,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            color: 'rgba(0,0,0,0.5)',
            lineHeight: 1.6,
          }}>
            <div style={{ fontSize: 11 }}>{hh}:{mm} h</div>
            <div style={{ fontSize: 11 }}>{deployTokens.toLocaleString('de-DE')} Tokens</div>
          </div>
        </Html>
      </group>
    </group>
  );
}

// ─── Dashed connector: phone → deployment stack ────────────────────────────────
function ConnectorLine({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = scrollRef.current > 0.62;
  });
  return (
    <group ref={groupRef}>
      <Line
        points={[[0.48, -0.1, 0], [STACK_FINAL_X - CUBE_W / 2 - 0.12, -0.1, 0]]}
        color="#aaaaaa"
        lineWidth={1.5}
        dashed
        dashScale={15}
        dashSize={0.35}
        gapSize={0.25}
      />
    </group>
  );
}

// ─── Scene root ───────────────────────────────────────────────────────────────
function Scene({ scrollRef, layers }: { scrollRef: React.MutableRefObject<number>; layers: LayerData[] }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]}   intensity={1.2} />
      <directionalLight position={[-3, 2, -2]}  intensity={0.4} color="#bfd4ff" />
      <directionalLight position={[0, -3, 2]}   intensity={0.15} />

      <CameraAnimation scrollRef={scrollRef} />
      <Phone scrollRef={scrollRef} />

      {layers.map((layer, i) => (
        <PhasePanel
          key={layer.session}
          scrollRef={scrollRef}
          data={layer}
          index={i}
          finalX={PANEL_FINAL_X[i] ?? -1.1}
        />
      ))}

      <DeploymentStack scrollRef={scrollRef} />
      <ConnectorLine scrollRef={scrollRef} />
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
  useMotionValueEvent(scrollYProgress, 'change', (v) => { scrollRef.current = v; });

  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 2.2], fov: 45 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <Scene scrollRef={scrollRef} layers={layers} />
    </Canvas>
  );
}
