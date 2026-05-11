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

const INTRO_START = 0.38;
const INTRO_END   = 0.56;

const PANEL_STARTS = [0.57, 0.63, 0.69] as const;
const PANEL_ENDS   = [0.65, 0.71, 0.77] as const;

const PANEL_W       = 0.7;
const PANEL_H       = 1.5;
const PANEL_FINAL_X = [-3.8, -2.5, -1.2] as const;
const PANEL_SCREENSHOTS: (string | null)[] = [
  null,
  '/images/FirstPrototype.jpg',
  '/images/phone-screenshot.jpg',
];

const STACK_FINAL_X = 2.7;
const CUBE_W        = 1.4;
const CUBE_H        = 1.2;
const CUBE_D        = 0.9;
const LAYER_W       = 1.1;
const LAYER_H       = 0.20;
const LAYER_D       = 0.7;
const layerY        = (i: number) => 0.32 - i * 0.32;

const DEPLOY_LAYERS = [
  { label: 'Node JS', color: '#a8b888' },
  { label: 'Docker',  color: '#8898b8' },
  { label: 'Coolify', color: '#c49870' },
] as const;
const DEPLOY_MINUTES = 268;
const DEPLOY_TOKENS  = 34000;

const AZURE_CENTER_Y = 1.9;
const AZURE_BOX_W    = 1.4;
const AZURE_BOX_H    = 0.9;
const AZURE_BOX_D    = 0.8;
const AZURE_SLAB_W   = 1.1;
const AZURE_SLAB_H   = 0.20;
const AZURE_SLAB_D   = 0.6;
const azureSlabY     = (i: number) => 0.15 - i * 0.30;

const AZURE_LAYERS = [
  { label: 'AI Foundry', sublabel: 'Phi-4-mini-instruct', color: '#a088c8' },
  { label: 'AI Search',  sublabel: '',                     color: '#60a8c0' },
] as const;

const VPS_FINAL_Y = -0.9;

// ─── Click-to-focus presets [camX, camY, camZ, lookX, lookY, lookZ] ──────────
type FocusPreset = readonly [number, number, number, number, number, number];

const PHONE_FOCUS: FocusPreset  = [0, 0.1, 2.5, 0, 0, 0];
const PANEL_FOCUS: FocusPreset[] = [
  [-3.8, 0, 2.0, -3.8, 0, 0],
  [-2.5, 0, 2.0, -2.5, 0, 0],
  [-1.2, 0, 2.0, -1.2, 0, 0],
];
const VPS_FOCUS: FocusPreset   = [2.7, VPS_FINAL_Y, 2.5, 2.7, VPS_FINAL_Y, 0];
const AZURE_FOCUS: FocusPreset = [2.7, AZURE_CENTER_Y, 2.0, 2.7, AZURE_CENTER_Y, 0];

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
// Scroll-driven by default; smoothly flies to focusRef target on click.
function CameraAnimation({
  scrollRef,
  focusRef,
}: {
  scrollRef: React.MutableRefObject<number>;
  focusRef: React.MutableRefObject<FocusPreset | null>;
}) {
  const { camera } = useThree();
  const targetPos  = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const focus = focusRef.current;
    if (focus) {
      targetPos.set(focus[0], focus[1], focus[2]);
      camera.position.lerp(targetPos, 0.07);
      camera.lookAt(focus[3], focus[4], focus[5]);
    } else {
      const t = easeInOut(t01(scrollRef.current, INTRO_START, INTRO_END));
      targetPos.lerpVectors(CAM_START, CAM_END, t);
      camera.position.lerp(targetPos, 0.12);
      camera.lookAt(0, 0, 0);
    }
  });
  return null;
}

// ─── Phone ────────────────────────────────────────────────────────────────────
function Phone({
  scrollRef,
  onFocus,
}: {
  scrollRef: React.MutableRefObject<number>;
  onFocus: () => void;
}) {
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
    <group
      ref={groupRef}
      scale={PHONE_SCALE}
      onClick={(e) => { e.stopPropagation(); onFocus(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
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
  scrollRef,
  data,
  index,
  finalX,
  onFocus,
}: {
  scrollRef: React.MutableRefObject<number>;
  data: LayerData;
  index: number;
  finalX: number;
  onFocus: () => void;
}) {
  const groupRef     = useRef<THREE.Group>(null);
  const screenMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const aboveRef     = useRef<HTMLDivElement>(null);
  const belowRef     = useRef<HTMLDivElement>(null);
  const triggered    = useRef(false);
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

  const start = PANEL_STARTS[index] ?? 0.57;
  const end   = PANEL_ENDS[index]   ?? 0.79;

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
    <group
      ref={groupRef}
      onClick={(e) => { e.stopPropagation(); onFocus(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh>
        <boxGeometry args={[PANEL_W, PANEL_H, 0.05]} />
        <meshStandardMaterial color="#e8c878" roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[PANEL_W, PANEL_H]} />
        <meshBasicMaterial ref={screenMatRef} color="#e8c878" />
      </mesh>

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
function DeploymentStack({
  scrollRef,
  onFocus,
}: {
  scrollRef: React.MutableRefObject<number>;
  onFocus: () => void;
}) {
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

  const LAYER_IN  = [0.90, 0.88, 0.86] as const;
  const LAYER_OUT = [0.94, 0.92, 0.90] as const;

  useFrame(() => {
    if (!groupRef.current) return;
    const s = scrollRef.current;

    const t    = easeOut3(t01(s, 0.81, 0.86));
    const rotT = easeInOut(t01(s, INTRO_START, INTRO_END));
    groupRef.current.position.x = lerp(0, STACK_FINAL_X, t);
    groupRef.current.position.y = lerp(0, VPS_FINAL_Y, easeOut3(t01(s, 0.95, 0.99)));
    groupRef.current.rotation.y = lerp(0, PHONE_ROT_Y, rotT);
    groupRef.current.rotation.x = PHONE_ROT_X;

    const cubeT = clamp(t01(s, 0.84, 0.88), 0, 1);
    if (cubeMatRef.current)     cubeMatRef.current.opacity  = lerp(0, 0.07, cubeT);
    if (edgesMatRef.current)    edgesMatRef.current.opacity = lerp(0, 0.5,  cubeT);
    if (calloutLineRef.current) calloutLineRef.current.visible = cubeT > 0;
    if (titleRef.current)       titleRef.current.style.opacity    = String(cubeT);
    if (vpsLabelRef.current)    vpsLabelRef.current.style.opacity = String(cubeT);

    DEPLOY_LAYERS.forEach((_, i) => {
      const lt = clamp(t01(s, LAYER_IN[i], LAYER_OUT[i]), 0, 1);
      const mat = slabMatRefs.current[i];
      if (mat) mat.opacity = lt;
      const lineGrp = lineGroupRefs.current[i];
      if (lineGrp) lineGrp.visible = lt > 0;
      const lbl = labelsRef.current[i];
      if (lbl) lbl.style.opacity = String(lt);
    });

    const lastT = clamp(t01(s, LAYER_IN[0], LAYER_OUT[0]), 0, 1);
    if (belowRef.current) belowRef.current.style.opacity = String(lastT);

    if (s > LAYER_IN[2] && !triggered.current) { triggered.current = true; setCountActive(true); }
  });

  const deployMinutes = useCountUp(DEPLOY_MINUTES, 3.0, countActive);
  const deployTokens  = useCountUp(DEPLOY_TOKENS,  3.0, countActive);
  const hh = Math.floor(deployMinutes / 60);
  const mm = String(deployMinutes % 60).padStart(2, '0');

  return (
    <group
      ref={groupRef}
      onClick={(e) => { e.stopPropagation(); onFocus(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
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

      <lineSegments geometry={edgesGeo} renderOrder={3}>
        <lineBasicMaterial ref={edgesMatRef} color="#8899cc" transparent opacity={0} />
      </lineSegments>

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

          <group ref={el => { lineGroupRefs.current[i] = el; }} visible={false}>
            <Line
              points={[[LAYER_W / 2, 0, 0], [CUBE_W / 2 + 0.12, 0, 0]]}
              color="#888888"
              lineWidth={1}
            />
          </group>

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

// ─── Azure Cloud (above VPS) ─────────────────────────────────────────────────
function AzureStack({
  scrollRef,
  onFocus,
}: {
  scrollRef: React.MutableRefObject<number>;
  onFocus: () => void;
}) {
  const groupRef      = useRef<THREE.Group>(null);
  const cubeMatRef    = useRef<THREE.MeshStandardMaterial>(null);
  const edgesMatRef   = useRef<THREE.LineBasicMaterial>(null);
  const slabMatRefs   = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lineGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const titleRef      = useRef<HTMLDivElement>(null);
  const labelsRef     = useRef<(HTMLDivElement | null)[]>([]);

  const edgesGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(AZURE_BOX_W, AZURE_BOX_H, AZURE_BOX_D)),
    []
  );

  const AZURE_LAYER_IN  = [0.98, 0.96] as const;
  const AZURE_LAYER_OUT = [1.00, 0.99] as const;

  useFrame(() => {
    if (!groupRef.current) return;
    const s = scrollRef.current;

    const t    = easeOut3(t01(s, 0.95, 0.99));
    const rotT = easeInOut(t01(s, INTRO_START, INTRO_END));
    groupRef.current.position.x = lerp(0, STACK_FINAL_X, t);
    groupRef.current.position.y = AZURE_CENTER_Y;
    groupRef.current.rotation.y = lerp(0, PHONE_ROT_Y, rotT);
    groupRef.current.rotation.x = PHONE_ROT_X;

    const cubeT = clamp(t01(s, 0.96, 0.99), 0, 1);
    if (cubeMatRef.current)   cubeMatRef.current.opacity  = lerp(0, 0.07, cubeT);
    if (edgesMatRef.current)  edgesMatRef.current.opacity = lerp(0, 0.5,  cubeT);
    if (titleRef.current)     titleRef.current.style.opacity = String(cubeT);

    AZURE_LAYERS.forEach((_, i) => {
      const lt  = clamp(t01(s, AZURE_LAYER_IN[i], AZURE_LAYER_OUT[i]), 0, 1);
      const mat = slabMatRefs.current[i];
      if (mat) mat.opacity = lt;
      const lineGrp = lineGroupRefs.current[i];
      if (lineGrp) lineGrp.visible = lt > 0;
      const lbl = labelsRef.current[i];
      if (lbl) lbl.style.opacity = String(lt);
    });
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => { e.stopPropagation(); onFocus(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <group position={[0, AZURE_BOX_H / 2 + 0.18, 0]}>
        <Html center style={{ pointerEvents: 'none' }}>
          <div ref={titleRef} style={{
            opacity: 0,
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            fontSize: 11, fontWeight: 600, color: '#1a1a1a', letterSpacing: '0.03em',
          }}>
            Azure Cloud
          </div>
        </Html>
      </group>

      <mesh renderOrder={2}>
        <boxGeometry args={[AZURE_BOX_W, AZURE_BOX_H, AZURE_BOX_D]} />
        <meshStandardMaterial
          ref={cubeMatRef}
          color="#c8d4ff"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <lineSegments geometry={edgesGeo} renderOrder={3}>
        <lineBasicMaterial ref={edgesMatRef} color="#8899cc" transparent opacity={0} />
      </lineSegments>

      {AZURE_LAYERS.map((layer, i) => (
        <group key={layer.label} position={[0, azureSlabY(i), 0]}>
          <mesh renderOrder={1}>
            <boxGeometry args={[AZURE_SLAB_W, AZURE_SLAB_H, AZURE_SLAB_D]} />
            <meshStandardMaterial
              ref={el => { slabMatRefs.current[i] = el; }}
              color={layer.color}
              transparent
              opacity={0}
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>

          <group ref={el => { lineGroupRefs.current[i] = el; }} visible={false}>
            <Line
              points={[[AZURE_SLAB_W / 2, 0, 0], [AZURE_BOX_W / 2 + 0.12, 0, 0]]}
              color="#888888"
              lineWidth={1}
            />
          </group>

          <group position={[AZURE_BOX_W / 2 + 0.15, 0, 0]}>
            <Html style={{ pointerEvents: 'none' }}>
              <div
                ref={el => { labelsRef.current[i] = el; }}
                style={{
                  opacity: 0,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
                  fontSize: 11, fontWeight: 600, color: '#1a1a1a',
                  transform: 'translateY(-50%)',
                  lineHeight: 1.4,
                }}
              >
                {layer.label}
                {layer.sublabel && (
                  <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.6 }}>
                    {layer.sublabel}
                  </div>
                )}
              </div>
            </Html>
          </group>
        </group>
      ))}
    </group>
  );
}

// ─── Dashed connector: phone → deployment stack ───────────────────────────────
function ConnectorLine({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      0.48, -0.1, 0,
      STACK_FINAL_X - CUBE_W / 2 - 0.12, -0.1, 0,
    ]), 3));
    return g;
  }, []);

  const mat = useMemo(() => new THREE.LineDashedMaterial({
    color: '#aaaaaa',
    dashSize: 0.35,
    gapSize: 0.25,
  }), []);

  const lineObj = useMemo(() => new THREE.Line(geo, mat), [geo, mat]);

  useFrame(() => {
    const s = scrollRef.current;
    lineObj.visible = s > 0.81;
    if (!lineObj.visible) return;

    const vpsY = lerp(0, VPS_FINAL_Y, easeOut3(t01(s, 0.95, 0.99)));
    const pos  = geo.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(1, STACK_FINAL_X - CUBE_W / 2 - 0.12, vpsY, 0);
    pos.needsUpdate = true;
    lineObj.computeLineDistances();
  });

  return <primitive object={lineObj} />;
}

// ─── Dashed connector: Azure bottom → VPS top ────────────────────────────────
function AzureVpsConnector({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      STACK_FINAL_X, AZURE_CENTER_Y - AZURE_BOX_H / 2, 0,
      STACK_FINAL_X, CUBE_H / 2, 0,
    ]), 3));
    return g;
  }, []);

  const mat = useMemo(() => new THREE.LineDashedMaterial({
    color: '#aaaaaa',
    dashSize: 0.15,
    gapSize: 0.12,
  }), []);

  const lineObj = useMemo(() => new THREE.Line(geo, mat), [geo, mat]);

  useFrame(() => {
    const s     = scrollRef.current;
    const cubeT = clamp(t01(s, 0.96, 0.99), 0, 1);
    lineObj.visible = cubeT > 0;
    if (!lineObj.visible) return;

    const vpsY   = lerp(0, VPS_FINAL_Y, easeOut3(t01(s, 0.95, 0.99)));
    const vpsTop = vpsY + CUBE_H / 2;
    const pos    = geo.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(1, STACK_FINAL_X, vpsTop, 0);
    pos.needsUpdate = true;
    lineObj.computeLineDistances();
  });

  return <primitive object={lineObj} />;
}

// ─── Scene root ───────────────────────────────────────────────────────────────
function Scene({
  scrollRef,
  focusRef,
  setFocus,
  layers,
}: {
  scrollRef: React.MutableRefObject<number>;
  focusRef: React.MutableRefObject<FocusPreset | null>;
  setFocus: (preset: FocusPreset | null) => void;
  layers: LayerData[];
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]}   intensity={1.2} />
      <directionalLight position={[-3, 2, -2]}  intensity={0.4} color="#bfd4ff" />
      <directionalLight position={[0, -3, 2]}   intensity={0.15} />

      <CameraAnimation scrollRef={scrollRef} focusRef={focusRef} />
      <Phone scrollRef={scrollRef} onFocus={() => setFocus(PHONE_FOCUS)} />

      {layers.map((layer, i) => (
        <PhasePanel
          key={layer.session}
          scrollRef={scrollRef}
          data={layer}
          index={i}
          finalX={PANEL_FINAL_X[i] ?? -1.1}
          onFocus={() => setFocus(PANEL_FOCUS[i] ?? PHONE_FOCUS)}
        />
      ))}

      <DeploymentStack scrollRef={scrollRef} onFocus={() => setFocus(VPS_FOCUS)} />
      <AzureStack      scrollRef={scrollRef} onFocus={() => setFocus(AZURE_FOCUS)} />
      <ConnectorLine   scrollRef={scrollRef} />
      <AzureVpsConnector scrollRef={scrollRef} />
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
  const focusRef  = useRef<FocusPreset | null>(null);
  const [hasFocus, setHasFocus] = useState(false);

  useMotionValueEvent(scrollYProgress, 'change', (v) => { scrollRef.current = v; });

  const setFocus = (preset: FocusPreset | null) => {
    focusRef.current = preset;
    setHasFocus(preset !== null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFocus(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { document.body.style.cursor = 'auto'; }, []);

  return (
    <div className="relative w-full h-full">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 2.2], fov: 45 }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <Scene scrollRef={scrollRef} focusRef={focusRef} setFocus={setFocus} layers={layers} />
      </Canvas>

      {hasFocus && (
        <button
          onClick={() => setFocus(null)}
          className="absolute bottom-4 right-4 font-mono text-[10px] tracking-widest uppercase text-black/30 hover:text-black/70 transition-colors"
          style={{ zIndex: 10 }}
        >
          × Übersicht
        </button>
      )}
    </div>
  );
}
