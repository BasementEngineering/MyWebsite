'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox, Line } from '@react-three/drei';
import { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { type MotionValue, useMotionValueEvent } from 'framer-motion';

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SCENE CONFIG — edit these three blocks to change content, colors, timing  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ─── Ideation phases (left side) ─────────────────────────────────────────────
// tokens/minutes = 0 → counter is hidden for that phase
const IDEATION_PHASES = [
  { label: 'Konzeption',                     screenshot: null,                            tokens: 18_000, minutes: 164 },
  { label: 'Erster Prototyp',                screenshot: '/images/FirstPrototype.jpg',    tokens: 35_782, minutes: 12},
  { label: 'Live-3D Grafik',                 screenshot: '/images/phone-screenshot.jpg',  tokens: 79_921, minutes:  92 },
  { label: 'Live-KI-Integration',            screenshot: null,                            tokens: 50_431, minutes:  156},
  { label: 'Fehlerbehebung & Finalisierung', screenshot: null,                            tokens: 265_723, minutes:   439 },
];

// ─── Backend stacks (right side) ─────────────────────────────────────────────
const VPS_LAYERS = ['Node JS', 'Docker', 'Coolify'] as const;
const CLOUD_LAYERS = [
  { label: 'AI Search', sublabel: '' },
] as const;

const MISTRAL_LAYERS = [
  { label: 'mistral-small', sublabel: 'latest' },
] as const;

// ─── Color palette ────────────────────────────────────────────────────────────
const PALETTE = {
  // Ideation
  ideationPanel:  '#e8c878',
  // Backend — VPS (Node JS i=0, Docker i=1, Coolify i=2)
  vpsBox:         '#c8d4ff',
  vpsEdges:       '#8899cc',
  vpsLayers:      ['#FCDE9C', '#FFA552', '#BA5624'] as string[],
  // Backend — Cloud (AI Foundry i=0, AI Search i=1)
  cloudBox:       '#c8d4ff',
  cloudEdges:     '#8899cc',
  cloudLayers:    ['#607bd1', '#60a8c0'] as string[],
  // Backend — Mistral (single slab)
  mistralBox:    '#c8d4ff',
  mistralEdges:  '#8899cc',
  mistralLayers: ['#ff8c42'] as string[],
  // Shared
  arrow:          '#aaaaaa',
  connector:      '#aaaaaa',
  label:          '#1a1a1a',
  labelMuted:     'rgba(0,0,0,0.5)',
};

// ─── Animation timeline (all times in ms from auto-play start) ────────────────
// Change a delay to shift when something appears.
// Change a duration to make it move faster or slower.
const TL = {
  // ── Ideation (left panels + arrow) ──────────────────────────────────────────
  ideation: {
    // Panels overlap: each starts 350 ms after previous (duration is 900 ms)
    panels: [
      { delay:    0, duration: 900 },
      { delay:  350, duration: 900 },
      { delay:  700, duration: 900 },
      { delay: 1050, duration: 900 },
      { delay: 1400, duration: 900 },
    ] as const,
    arrow: { delay: 0, duration: 700 },
  },

  // ── Backend (right stacks) ───────────────────────────────────────────────
  backend: {
    vps: {
      flyIn:  { delay: 3000, duration: 700 },
      cube:   { delay: 3300, duration: 600 },
      // Layers indexed same as VPS_LAYERS. Coolify (i=2) appears first (bottom→top).
      layers: [
        { delay: 4500, duration: 500 },   // i=0  Node JS  (top,    last)
        { delay: 4100, duration: 500 },   // i=1  Docker   (middle)
        { delay: 3700, duration: 500 },   // i=2  Coolify  (bottom, first)
      ] as const,
      vpsMove: { delay: 5000, duration: 700 },
    },
    cloud: {
      flyIn:  { delay: 5200, duration: 700 },
      cube:   { delay: 5500, duration: 600 },
      // AI Search (i=1) appears before AI Foundry (i=0)
      layers: [
        { delay: 6300, duration: 500 },   // i=0  AI Foundry (last)
        { delay: 5900, duration: 500 },   // i=1  AI Search  (first)
      ] as const,
    },
    mistral: {
      flyIn:  { delay: 7200, duration: 700 },
      cube:   { delay: 7500, duration: 600 },
      layers: [
        { delay: 8000, duration: 500 },   // i=0  mistral-small
      ] as const,
    },
  },

  // ── Connectors ───────────────────────────────────────────────────────────
  connectors: {
    phoneToVps:     { delay: 3000 },   // dashed line: phone center → VPS box
    vpsToCloud:     { delay: 5500 },   // dashed line: VPS top → Cloud bottom
    vpsToMistral:   { delay: 7200 },   // dashed line: VPS top → Mistral bottom
  },

  // ── Bottom labels ────────────────────────────────────────────────────────
  labels: {
    left:  { delay:    0 },   // "Die Entwicklungsgeschichte"
    right: { delay: 3000 },   // "Das Hintergrundsystem"
  },
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  GEOMETRY CONSTANTS — change these to resize/reposition scene elements     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const PHONE_SCALE    = 0.55;
const PHONE_ROT_Y    = -0.18;
const PHONE_ROT_X    =  0.06;

const CAM_START      = new THREE.Vector3(0, 0, 2.2);
const CAM_END        = new THREE.Vector3(0, 0.8, 10.5);
const INTRO_START    = 0.28; // keep in sync with STAGE.phoneIn[0] in TechReveal.tsx
const INTRO_END      = 0.46; // auto-play fires here; must be < sticky release (~0.50)

// Ideation panels
const PANEL_W        = 0.7;
const PANEL_H        = 1.5;
const PANEL_SPACING  = 1.2;  // horizontal gap between panel centers
const PANEL_ANCHOR_X = -1.4; // x of the rightmost panel (closest to phone)
const PANEL_FINAL_X  = IDEATION_PHASES.map(
  (_, i) => PANEL_ANCHOR_X - (IDEATION_PHASES.length - 1 - i) * PANEL_SPACING
);

// Backend — VPS box
const STACK_FINAL_X  = 2.7;
const VPS_W          = 1.4;
const VPS_H          = 1.2;
const VPS_D          = 0.9;
const VPS_LAYER_W    = 1.1;
const VPS_LAYER_H    = 0.20;
const VPS_LAYER_D    = 0.7;
const vpsLayerY      = (i: number) => 0.32 - i * 0.32;
const VPS_FINAL_Y    = -0.5;

// Backend — Cloud box (Azure)
const CLOUD_CENTER_Y = 1.3;
const CLOUD_W        = 1.1;
const CLOUD_H        = 0.50;
const CLOUD_D        = 0.60;
const CLOUD_SLAB_W   = 0.88;
const CLOUD_SLAB_H   = 0.18;
const CLOUD_SLAB_D   = 0.48;
const cloudSlabY     = (_i: number) => 0;  // single slab — centered

// Backend — Mistral cloud box (right of Azure, same size and color)
const MISTRAL_X        = STACK_FINAL_X + 1.9;
const MISTRAL_CENTER_Y = CLOUD_CENTER_Y;
const MISTRAL_H        = CLOUD_H;
const MISTRAL_W        = CLOUD_W;
const MISTRAL_D        = CLOUD_D;
const MISTRAL_SLAB_W   = CLOUD_SLAB_W;
const MISTRAL_SLAB_H   = CLOUD_SLAB_H;
const MISTRAL_SLAB_D   = CLOUD_SLAB_D;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  INTERNALS — no need to edit below this line for typical changes           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const clamp     = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const t01       = (v: number, a: number, b: number)   => clamp((v - a) / (b - a), 0, 1);
const lerp      = (a: number, b: number, t: number)   => a + (b - a) * t;
const easeOut3  = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

const getElapsed = (autoStart: number | null): number =>
  autoStart === null ? -1 : performance.now() - autoStart;

const phaseT = (elapsed: number, delay: number, duration: number): number =>
  easeOut3(clamp((elapsed - delay) / duration, 0, 1));

function useCountUp(target: number, durationSec: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (durationSec * 1000), 1);
      setValue(Math.round(easeOut3(t) * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, durationSec]);
  return value;
}

// ─── Camera — scroll-driven intro ────────────────────────────────────────────
function Camera({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const t = easeInOut(t01(scrollRef.current, INTRO_START, INTRO_END));
    target.lerpVectors(CAM_START, CAM_END, t);
    camera.position.lerp(target, 0.12);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Phone — scroll-driven intro ─────────────────────────────────────────────
function Phone({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const groupRef     = useRef<THREE.Group>(null);
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

// ─── IdeationPanel — one phase card that flies in from left ──────────────────
function IdeationPanel({
  autoPlayRef, phase, index, finalX,
}: {
  autoPlayRef: React.MutableRefObject<number | null>;
  phase:       typeof IDEATION_PHASES[number];
  index:       number;
  finalX:      number;
}) {
  const groupRef     = useRef<THREE.Group>(null);
  const screenMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const labelRef     = useRef<HTMLDivElement>(null);
  const counterRef   = useRef<HTMLDivElement>(null);
  const triggered    = useRef(false);
  const [countActive, setCountActive] = useState(false);

  const { delay, duration } = TL.ideation.panels[index] ?? { delay: 0, duration: 900 };
  const showCounter = phase.tokens > 0;

  const tokenCount  = useCountUp(phase.tokens,  3.0, countActive);
  const minuteCount = useCountUp(phase.minutes, 3.0, countActive);
  const hh = Math.floor(minuteCount / 60);
  const mm = String(minuteCount % 60).padStart(2, '0');

  useEffect(() => {
    if (!phase.screenshot) return;
    new THREE.TextureLoader().load(phase.screenshot, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      if (screenMatRef.current) {
        screenMatRef.current.map = tex;
        screenMatRef.current.color.set('#ffffff');
        screenMatRef.current.needsUpdate = true;
      }
    }, undefined, () => {});
  }, [phase.screenshot]);

  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = getElapsed(autoPlayRef.current);
    groupRef.current.visible = elapsed >= 0;
    if (elapsed < 0) {
      if (labelRef.current)   labelRef.current.style.opacity   = '0';
      if (counterRef.current) counterRef.current.style.opacity = '0';
      if (triggered.current) {
        triggered.current = false;
        setCountActive(false);
      }
      return;
    }
    const t = phaseT(elapsed, delay, duration);
    groupRef.current.position.x = lerp(0, finalX, t);
    groupRef.current.rotation.y = PHONE_ROT_Y;
    groupRef.current.rotation.x = PHONE_ROT_X;

    const textOp = String(clamp(t01(t, 0.4, 0.9), 0, 1));
    if (labelRef.current)   labelRef.current.style.opacity   = textOp;
    if (counterRef.current) counterRef.current.style.opacity = textOp;

    if (showCounter && !triggered.current && t > 0.7) {
      triggered.current = true;
      setCountActive(true);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh>
        <boxGeometry args={[PANEL_W, PANEL_H, 0.05]} />
        <meshStandardMaterial color={PALETTE.ideationPanel} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[PANEL_W, PANEL_H]} />
        <meshBasicMaterial ref={screenMatRef} color={PALETTE.ideationPanel} />
      </mesh>

      {/* Phase label above panel */}
      <group position={[0, PANEL_H / 2 + 0.30, 0]}>
        <Html center transform distanceFactor={4.5} style={{ pointerEvents: 'none' }}>
          <div ref={labelRef} style={{
            opacity: 0,
            fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            fontSize: 10, fontWeight: 600,
            color: PALETTE.label, letterSpacing: '0.03em',
            textAlign: 'center', maxWidth: 100, lineHeight: 1.4,
          }}>
            {phase.label}
          </div>
        </Html>
      </group>

      {/* Token/time counter below panel (only when data is available) */}
      {showCounter && (
        <group position={[0, -PANEL_H / 2 - 0.40, 0]}>
          <Html center transform distanceFactor={5} style={{ pointerEvents: 'none' }}>
            <div ref={counterRef} style={{
              opacity: 0, textAlign: 'center',
              fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
              color: PALETTE.labelMuted, lineHeight: 1.6,
            }}>
              <div style={{ fontSize: 11 }}>{hh}:{mm} h</div>
              <div style={{ fontSize: 11 }}>{tokenCount.toLocaleString('de-DE')} Tokens</div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

// ─── IdeationArrow — flat arrow behind the phase panels, pointing at phone ───
const ARROW_TAIL_X = PANEL_FINAL_X[0] - PANEL_W / 2 - 0.05;
const ARROW_TIP_X  = -0.42; // just before phone left edge
const ARROW_LEN    = ARROW_TIP_X - ARROW_TAIL_X;
const ARROW_SHAFT_H = 0.10;
const ARROW_HEAD_H  = 0.28;
const ARROW_HEAD_L  = 0.45;

const arrowShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0,           ARROW_SHAFT_H / 2);
  s.lineTo(ARROW_LEN - ARROW_HEAD_L, ARROW_SHAFT_H / 2);
  s.lineTo(ARROW_LEN - ARROW_HEAD_L, ARROW_HEAD_H / 2);
  s.lineTo(ARROW_LEN,  0);
  s.lineTo(ARROW_LEN - ARROW_HEAD_L, -ARROW_HEAD_H / 2);
  s.lineTo(ARROW_LEN - ARROW_HEAD_L, -ARROW_SHAFT_H / 2);
  s.lineTo(0,          -ARROW_SHAFT_H / 2);
  s.closePath();
  return s;
})();

function IdeationArrow({ autoPlayRef }: { autoPlayRef: React.MutableRefObject<number | null> }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const elapsed = getElapsed(autoPlayRef.current);
    const op = phaseT(elapsed, TL.ideation.arrow.delay, TL.ideation.arrow.duration) * 0.18;
    if (meshRef.current) (meshRef.current.material as THREE.MeshStandardMaterial).opacity = op;
  });

  return (
    // y=0 → vertically centered on panels; z=-0.08 → behind panel boxes (z≈0)
    <group position={[ARROW_TAIL_X, 0, -0.08]} rotation={[PHONE_ROT_X, 0, 0]}>
      <mesh ref={meshRef} renderOrder={0}>
        <shapeGeometry args={[arrowShape]} />
        <meshStandardMaterial color={PALETTE.arrow} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── BackendVps — wireframe deployment box with layer slabs ──────────────────
function BackendVps({ autoPlayRef }: { autoPlayRef: React.MutableRefObject<number | null> }) {
  const groupRef      = useRef<THREE.Group>(null);
  const cubeMatRef    = useRef<THREE.MeshStandardMaterial>(null);
  const edgesMatRef   = useRef<THREE.LineBasicMaterial>(null);
  const slabMatRefs   = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lineGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const titleRef      = useRef<HTMLDivElement>(null);
  const layerLabelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const edgesGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(VPS_W, VPS_H, VPS_D)), []
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = getElapsed(autoPlayRef.current);

    const flyT  = phaseT(elapsed, TL.backend.vps.flyIn.delay,  TL.backend.vps.flyIn.duration);
    const cubeT = phaseT(elapsed, TL.backend.vps.cube.delay,   TL.backend.vps.cube.duration);
    const vpsT  = phaseT(elapsed, TL.backend.vps.vpsMove.delay, TL.backend.vps.vpsMove.duration);

    groupRef.current.position.x = lerp(0, STACK_FINAL_X, flyT);
    groupRef.current.position.y = lerp(0, VPS_FINAL_Y,   vpsT);
    groupRef.current.rotation.y = PHONE_ROT_Y;
    groupRef.current.rotation.x = PHONE_ROT_X;

    if (cubeMatRef.current)  cubeMatRef.current.opacity  = lerp(0, 0.07, cubeT);
    if (edgesMatRef.current) edgesMatRef.current.opacity = lerp(0, 0.5,  cubeT);
    if (titleRef.current) titleRef.current.style.opacity = String(cubeT);

    VPS_LAYERS.forEach((_, i) => {
      const { delay, duration } = TL.backend.vps.layers[i];
      const lt  = phaseT(elapsed, delay, duration);
      const mat = slabMatRefs.current[i];    if (mat)  mat.opacity    = lt;
      const grp = lineGroupRefs.current[i];  if (grp)  grp.visible    = lt > 0;
      const lbl = layerLabelRefs.current[i]; if (lbl)  lbl.style.opacity = String(lt);
    });
  });

  return (
    <group ref={groupRef}>
      <group position={[0, VPS_H / 2 + 0.18, 0]}>
        <Html center style={{ pointerEvents: 'none' }}>
          <div ref={titleRef} style={{
            opacity: 0, whiteSpace: 'nowrap',
            fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            fontSize: 11, fontWeight: 600, color: PALETTE.label, letterSpacing: '0.03em',
          }}>Linux VPS</div>
        </Html>
      </group>

      <mesh renderOrder={2}>
        <boxGeometry args={[VPS_W, VPS_H, VPS_D]} />
        <meshStandardMaterial ref={cubeMatRef} color={PALETTE.vpsBox}
          transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edgesGeo} renderOrder={3}>
        <lineBasicMaterial ref={edgesMatRef} color={PALETTE.vpsEdges} transparent opacity={0} />
      </lineSegments>

      {VPS_LAYERS.map((label, i) => (
        <group key={label} position={[0, vpsLayerY(i), 0]}>
          <mesh renderOrder={1}>
            <boxGeometry args={[VPS_LAYER_W, VPS_LAYER_H, VPS_LAYER_D]} />
            <meshStandardMaterial
              ref={el => { slabMatRefs.current[i] = el; }}
              color={PALETTE.vpsLayers[i]}
              transparent opacity={0} roughness={0.4} metalness={0.1}
            />
          </mesh>
          <group ref={el => { lineGroupRefs.current[i] = el; }} visible={false}>
            <Line points={[[VPS_LAYER_W/2, 0, 0], [VPS_W/2+0.12, 0, 0]]} color={PALETTE.connector} lineWidth={1} />
          </group>
          <group position={[VPS_W/2+0.15, 0, 0]}>
            <Html style={{ pointerEvents: 'none' }}>
              <div ref={el => { layerLabelRefs.current[i] = el; }} style={{
                opacity: 0, whiteSpace: 'nowrap',
                fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
                fontSize: 11, fontWeight: 600, color: PALETTE.label,
                transform: 'translateY(-50%)',
              }}>{label}</div>
            </Html>
          </group>
        </group>
      ))}
    </group>
  );
}

// ─── BackendCloud — Azure cloud box with AI service slabs ────────────────────
function BackendCloud({ autoPlayRef }: { autoPlayRef: React.MutableRefObject<number | null> }) {
  const groupRef      = useRef<THREE.Group>(null);
  const cubeMatRef    = useRef<THREE.MeshStandardMaterial>(null);
  const edgesMatRef   = useRef<THREE.LineBasicMaterial>(null);
  const slabMatRefs   = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lineGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const titleRef      = useRef<HTMLDivElement>(null);
  const layerLabelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const edgesGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(CLOUD_W, CLOUD_H, CLOUD_D)), []
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = getElapsed(autoPlayRef.current);

    const flyT  = phaseT(elapsed, TL.backend.cloud.flyIn.delay, TL.backend.cloud.flyIn.duration);
    const cubeT = phaseT(elapsed, TL.backend.cloud.cube.delay,  TL.backend.cloud.cube.duration);

    groupRef.current.position.x = lerp(0, STACK_FINAL_X, flyT);
    groupRef.current.position.y = CLOUD_CENTER_Y;
    groupRef.current.rotation.y = PHONE_ROT_Y;
    groupRef.current.rotation.x = PHONE_ROT_X;

    if (cubeMatRef.current)  cubeMatRef.current.opacity  = lerp(0, 0.07, cubeT);
    if (edgesMatRef.current) edgesMatRef.current.opacity = lerp(0, 0.5,  cubeT);
    if (titleRef.current)    titleRef.current.style.opacity = String(cubeT);

    CLOUD_LAYERS.forEach((_, i) => {
      const { delay, duration } = TL.backend.cloud.layers[i];
      const lt  = phaseT(elapsed, delay, duration);
      const mat = slabMatRefs.current[i];    if (mat)  mat.opacity       = lt;
      const grp = lineGroupRefs.current[i];  if (grp)  grp.visible       = lt > 0;
      const lbl = layerLabelRefs.current[i]; if (lbl)  lbl.style.opacity = String(lt);
    });
  });

  return (
    <group ref={groupRef}>
      <group position={[0, CLOUD_H/2 + 0.18, 0]}>
        <Html center style={{ pointerEvents: 'none' }}>
          <div ref={titleRef} style={{
            opacity: 0, whiteSpace: 'nowrap',
            fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            fontSize: 11, fontWeight: 600, color: PALETTE.label, letterSpacing: '0.03em',
          }}>Azure Cloud</div>
        </Html>
      </group>

      <mesh renderOrder={2}>
        <boxGeometry args={[CLOUD_W, CLOUD_H, CLOUD_D]} />
        <meshStandardMaterial ref={cubeMatRef} color={PALETTE.cloudBox}
          transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edgesGeo} renderOrder={3}>
        <lineBasicMaterial ref={edgesMatRef} color={PALETTE.cloudEdges} transparent opacity={0} />
      </lineSegments>

      {CLOUD_LAYERS.map(({ label, sublabel }, i) => (
        <group key={label} position={[0, cloudSlabY(i), 0]}>
          <mesh renderOrder={1}>
            <boxGeometry args={[CLOUD_SLAB_W, CLOUD_SLAB_H, CLOUD_SLAB_D]} />
            <meshStandardMaterial
              ref={el => { slabMatRefs.current[i] = el; }}
              color={PALETTE.cloudLayers[i]}
              transparent opacity={0} roughness={0.4} metalness={0.1}
            />
          </mesh>
          <group ref={el => { lineGroupRefs.current[i] = el; }} visible={false}>
            <Line points={[[CLOUD_SLAB_W/2, 0, 0], [CLOUD_W/2+0.12, 0, 0]]} color={PALETTE.connector} lineWidth={1} />
          </group>
          <group position={[CLOUD_W/2+0.15, 0, 0]}>
            <Html style={{ pointerEvents: 'none' }}>
              <div ref={el => { layerLabelRefs.current[i] = el; }} style={{
                opacity: 0, whiteSpace: 'nowrap',
                fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
                fontSize: 11, fontWeight: 600, color: PALETTE.label,
                transform: 'translateY(-50%)', lineHeight: 1.4,
              }}>
                {label}
                {sublabel && <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.6 }}>{sublabel}</div>}
              </div>
            </Html>
          </group>
        </group>
      ))}
    </group>
  );
}

// ─── BackendMistral — Mistral AI cloud box ───────────────────────────────────
function BackendMistral({ autoPlayRef }: { autoPlayRef: React.MutableRefObject<number | null> }) {
  const groupRef       = useRef<THREE.Group>(null);
  const cubeMatRef     = useRef<THREE.MeshStandardMaterial>(null);
  const edgesMatRef    = useRef<THREE.LineBasicMaterial>(null);
  const slabMatRefs    = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lineGroupRefs  = useRef<(THREE.Group | null)[]>([]);
  const titleRef       = useRef<HTMLDivElement>(null);
  const layerLabelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const edgesGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(MISTRAL_W, MISTRAL_H, MISTRAL_D)), []
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = getElapsed(autoPlayRef.current);

    const flyT  = phaseT(elapsed, TL.backend.mistral.flyIn.delay, TL.backend.mistral.flyIn.duration);
    const cubeT = phaseT(elapsed, TL.backend.mistral.cube.delay,  TL.backend.mistral.cube.duration);

    groupRef.current.position.x = lerp(0, MISTRAL_X, flyT);
    groupRef.current.position.y = MISTRAL_CENTER_Y;
    groupRef.current.rotation.y = PHONE_ROT_Y;
    groupRef.current.rotation.x = PHONE_ROT_X;

    if (cubeMatRef.current)  cubeMatRef.current.opacity  = lerp(0, 0.07, cubeT);
    if (edgesMatRef.current) edgesMatRef.current.opacity = lerp(0, 0.5,  cubeT);
    if (titleRef.current)    titleRef.current.style.opacity = String(cubeT);

    MISTRAL_LAYERS.forEach((_, i) => {
      const { delay, duration } = TL.backend.mistral.layers[i];
      const lt  = phaseT(elapsed, delay, duration);
      const mat = slabMatRefs.current[i];    if (mat)  mat.opacity       = lt;
      const grp = lineGroupRefs.current[i];  if (grp)  grp.visible       = lt > 0;
      const lbl = layerLabelRefs.current[i]; if (lbl)  lbl.style.opacity = String(lt);
    });
  });

  return (
    <group ref={groupRef}>
      <group position={[0, MISTRAL_H / 2 + 0.18, 0]}>
        <Html center style={{ pointerEvents: 'none' }}>
          <div ref={titleRef} style={{
            opacity: 0, whiteSpace: 'nowrap',
            fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            fontSize: 11, fontWeight: 600, color: PALETTE.label, letterSpacing: '0.03em',
          }}>Mistral AI</div>
        </Html>
      </group>

      <mesh renderOrder={2}>
        <boxGeometry args={[MISTRAL_W, MISTRAL_H, MISTRAL_D]} />
        <meshStandardMaterial ref={cubeMatRef} color={PALETTE.mistralBox}
          transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edgesGeo} renderOrder={3}>
        <lineBasicMaterial ref={edgesMatRef} color={PALETTE.mistralEdges} transparent opacity={0} />
      </lineSegments>

      {MISTRAL_LAYERS.map(({ label, sublabel }, i) => (
        <group key={label} position={[0, 0, 0]}>
          <mesh renderOrder={1}>
            <boxGeometry args={[MISTRAL_SLAB_W, MISTRAL_SLAB_H, MISTRAL_SLAB_D]} />
            <meshStandardMaterial
              ref={el => { slabMatRefs.current[i] = el; }}
              color={PALETTE.mistralLayers[i]}
              transparent opacity={0} roughness={0.4} metalness={0.1}
            />
          </mesh>
          <group ref={el => { lineGroupRefs.current[i] = el; }} visible={false}>
            <Line points={[[MISTRAL_SLAB_W/2, 0, 0], [MISTRAL_W/2+0.12, 0, 0]]} color={PALETTE.connector} lineWidth={1} />
          </group>
          <group position={[MISTRAL_W/2+0.15, 0, 0]}>
            <Html style={{ pointerEvents: 'none' }}>
              <div ref={el => { layerLabelRefs.current[i] = el; }} style={{
                opacity: 0, whiteSpace: 'nowrap',
                fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
                fontSize: 11, fontWeight: 600, color: PALETTE.label,
                transform: 'translateY(-50%)', lineHeight: 1.4,
              }}>
                {label}
                {sublabel && <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.6 }}>{sublabel}</div>}
              </div>
            </Html>
          </group>
        </group>
      ))}
    </group>
  );
}

// ─── PhoneToVpsConnector — dashed line from phone center to VPS box ───────────
function PhoneToVpsConnector({ autoPlayRef }: { autoPlayRef: React.MutableRefObject<number | null> }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      0.48, -0.1, 0,
      STACK_FINAL_X - VPS_W/2 - 0.12, -0.1, 0,
    ]), 3));
    return g;
  }, []);
  const mat     = useMemo(() => new THREE.LineDashedMaterial({ color: PALETTE.connector, dashSize: 0.35, gapSize: 0.25 }), []);
  const lineObj = useMemo(() => new THREE.Line(geo, mat), [geo, mat]);

  useFrame(() => {
    const elapsed = getElapsed(autoPlayRef.current);
    lineObj.visible = elapsed >= TL.connectors.phoneToVps.delay;
    if (!lineObj.visible) return;
    const vpsT = phaseT(elapsed, TL.backend.vps.vpsMove.delay, TL.backend.vps.vpsMove.duration);
    const pos  = geo.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(1, STACK_FINAL_X - VPS_W/2 - 0.12, lerp(0, VPS_FINAL_Y, vpsT), 0);
    pos.needsUpdate = true;
    lineObj.computeLineDistances();
  });

  return <primitive object={lineObj} />;
}

// ─── VpsToCloudConnector — dashed line from VPS top to Cloud bottom ───────────
function VpsToCloudConnector({ autoPlayRef }: { autoPlayRef: React.MutableRefObject<number | null> }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      STACK_FINAL_X, CLOUD_CENTER_Y - CLOUD_H/2, 0,
      STACK_FINAL_X, VPS_H/2, 0,
    ]), 3));
    return g;
  }, []);
  const mat     = useMemo(() => new THREE.LineDashedMaterial({ color: PALETTE.connector, dashSize: 0.15, gapSize: 0.12 }), []);
  const lineObj = useMemo(() => new THREE.Line(geo, mat), [geo, mat]);

  useFrame(() => {
    const elapsed = getElapsed(autoPlayRef.current);
    lineObj.visible = elapsed >= TL.connectors.vpsToCloud.delay;
    if (!lineObj.visible) return;
    const vpsT   = phaseT(elapsed, TL.backend.vps.vpsMove.delay, TL.backend.vps.vpsMove.duration);
    const vpsTop = lerp(0, VPS_FINAL_Y, vpsT) + VPS_H/2;
    const pos    = geo.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(1, STACK_FINAL_X, vpsTop, 0);
    pos.needsUpdate = true;
    lineObj.computeLineDistances();
  });

  return <primitive object={lineObj} />;
}

// ─── VpsToMistralConnector — diagonal dashed line from VPS top to Mistral bottom
function VpsToMistralConnector({ autoPlayRef }: { autoPlayRef: React.MutableRefObject<number | null> }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      MISTRAL_X, MISTRAL_CENTER_Y - MISTRAL_H / 2, 0,  // point 0: Mistral bottom (static)
      STACK_FINAL_X, VPS_H / 2, 0,                      // point 1: VPS top (updates with VPS y)
    ]), 3));
    return g;
  }, []);
  const mat     = useMemo(() => new THREE.LineDashedMaterial({ color: PALETTE.connector, dashSize: 0.35, gapSize: 0.25 }), []);
  const lineObj = useMemo(() => new THREE.Line(geo, mat), [geo, mat]);

  useFrame(() => {
    const elapsed = getElapsed(autoPlayRef.current);
    lineObj.visible = elapsed >= TL.connectors.vpsToMistral.delay;
    if (!lineObj.visible) return;
    const vpsT   = phaseT(elapsed, TL.backend.vps.vpsMove.delay, TL.backend.vps.vpsMove.duration);
    const vpsTop = lerp(0, VPS_FINAL_Y, vpsT) + VPS_H / 2;
    const pos    = geo.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(1, STACK_FINAL_X, vpsTop, 0);
    pos.needsUpdate = true;
    lineObj.computeLineDistances();
  });

  return <primitive object={lineObj} />;
}

// ─── IdeationLabel — "Die Entwicklungsgeschichte" centered below the panels ───
const PANEL_ROW_CENTER_X = (PANEL_FINAL_X[0] + PANEL_FINAL_X[PANEL_FINAL_X.length - 1]) / 2;

function IdeationLabel({ autoPlayRef }: { autoPlayRef: React.MutableRefObject<number | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    if (!ref.current) return;
    const elapsed = getElapsed(autoPlayRef.current);
    ref.current.style.opacity = elapsed < 0
      ? '0'
      : String(clamp((elapsed - TL.labels.left.delay) / 800, 0, 1));
  });
  return (
    <group position={[PANEL_ROW_CENTER_X, -(PANEL_H / 2 + 1.1), 0]}>
      <Html center style={{ pointerEvents: 'none' }}>
        <div ref={ref} style={{
          opacity: 0, whiteSpace: 'nowrap',
          fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
          fontSize: 16, letterSpacing: '0.25em',
          textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)',
        }}>
          Die Entwicklungsgeschichte
        </div>
      </Html>
    </group>
  );
}

// ─── BackendLabel — "Das Hintergrundsystem" below the VPS stack ──────────────
function BackendLabel({ autoPlayRef }: { autoPlayRef: React.MutableRefObject<number | null> }) {
  const ref      = useRef<HTMLDivElement>(null);
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const elapsed = getElapsed(autoPlayRef.current);
    if (groupRef.current) {
      const vpsT = phaseT(elapsed, TL.backend.vps.vpsMove.delay, TL.backend.vps.vpsMove.duration);
      groupRef.current.position.y = lerp(0, VPS_FINAL_Y, vpsT) - VPS_H / 2 - 0.8;
    }
    if (ref.current) {
      ref.current.style.opacity = elapsed < 0
        ? '0'
        : String(clamp((elapsed - TL.labels.right.delay) / 800, 0, 1));
    }
  });
  return (
    <group ref={groupRef} position={[STACK_FINAL_X, -VPS_H / 2 - 0.4, 0]}>
      <Html center style={{ pointerEvents: 'none' }}>
        <div ref={ref} style={{
          opacity: 0, whiteSpace: 'nowrap',
          fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
          fontSize: 16, letterSpacing: '0.25em',
          textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)',
        }}>
          Das Hintergrundsystem
        </div>
      </Html>
    </group>
  );
}

// ─── Scene root ───────────────────────────────────────────────────────────────
function Scene({
  scrollRef, autoPlayRef,
}: {
  scrollRef:   React.MutableRefObject<number>;
  autoPlayRef: React.MutableRefObject<number | null>;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]}  intensity={1.2} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#bfd4ff" />
      <directionalLight position={[0, -3, 2]}  intensity={0.15} />

      {/* Phone (center) */}
      <Camera scrollRef={scrollRef} />
      <Phone  scrollRef={scrollRef} />

      {/* Ideation (left) */}
      <IdeationArrow autoPlayRef={autoPlayRef} />
      <IdeationLabel autoPlayRef={autoPlayRef} />
      {IDEATION_PHASES.map((phase, i) => (
        <IdeationPanel
          key={phase.label}
          autoPlayRef={autoPlayRef}
          phase={phase}
          index={i}
          finalX={PANEL_FINAL_X[i] ?? -1.1}
        />
      ))}

      {/* Backend (right) */}
      <BackendVps                autoPlayRef={autoPlayRef} />
      <BackendCloud              autoPlayRef={autoPlayRef} />
      <BackendMistral            autoPlayRef={autoPlayRef} />
      <PhoneToVpsConnector       autoPlayRef={autoPlayRef} />
      <VpsToCloudConnector       autoPlayRef={autoPlayRef} />
      <VpsToMistralConnector     autoPlayRef={autoPlayRef} />
      <BackendLabel              autoPlayRef={autoPlayRef} />
    </>
  );
}

// ─── Canvas root ──────────────────────────────────────────────────────────────
export default function PhoneScene({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const scrollRef   = useRef(0);
  const autoPlayRef = useRef<number | null>(null);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    scrollRef.current = v;
    if (v >= INTRO_END && autoPlayRef.current === null) {
      autoPlayRef.current = performance.now();
    } else if (v < INTRO_END) {
      autoPlayRef.current = null;
    }
  });

  return (
    <div className="relative w-full h-full">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 2.2], fov: 45 }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <Scene scrollRef={scrollRef} autoPlayRef={autoPlayRef} />
      </Canvas>

    </div>
  );
}
