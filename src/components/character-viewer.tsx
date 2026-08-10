"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const TARGET_HEIGHT = 1.7;

// Encuadres precalculados: para cada uno, cuanto hay que bajar el grupo
// (groupOffsetY) para que la zona que nos interesa quede centrada en el
// origen (0,0,0), que es a donde mira la camara por defecto. Se calculan
// una sola vez porque todos los personajes ya estan normalizados a
// TARGET_HEIGHT.
const FIT_CONFIG = {
  // Cuerpo entero, con margen arriba y abajo.
  full: {
    groupOffsetY: -TARGET_HEIGHT / 2,
    cameraDistance: 3.5,
    fov: 35,
  },
  // Cabeza + hombros, para avatares chicos/cuadrados.
  bust: {
    groupOffsetY: -TARGET_HEIGHT * 0.825,
    cameraDistance: 1.25,
    fov: 35,
  },
} as const;

type Fit = keyof typeof FIT_CONFIG;

function Model({
  modelUrl,
  heightM,
  autoRotate,
  fit,
}: {
  modelUrl: string;
  heightM: number;
  autoRotate: boolean;
  fit: Fit;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelUrl);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const first = Object.values(actions)[0];
    first?.reset().fadeIn(0.35).play();
    return () => {
      first?.fadeOut(0.2);
    };
  }, [actions]);

  useFrame((_, delta) => {
    if (autoRotate && group.current) {
      group.current.rotation.y += delta * 0.45;
    }
  });

  const scale = TARGET_HEIGHT / heightM;
  const { groupOffsetY } = FIT_CONFIG[fit];

  return (
    <group ref={group} scale={scale} position={[0, groupOffsetY, 0]}>
      <primitive object={scene} />
    </group>
  );
}

export interface CharacterViewerProps {
  modelUrl: string;
  heightM: number;
  autoRotate?: boolean;
  interactive?: boolean;
  /** "full" = cuerpo entero (selector de personaje). "bust" = cabeza y hombros (avatar chico). */
  fit?: Fit;
  className?: string;
}

export default function CharacterViewer({
  modelUrl,
  heightM,
  autoRotate = true,
  interactive = false,
  fit = "full",
  className,
}: CharacterViewerProps) {
  const { cameraDistance, fov } = FIT_CONFIG[fit];

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, cameraDistance], fov }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[2, 3, 2]} intensity={1.6} />
        <directionalLight position={[-2, 1, -2]} intensity={0.4} />
        <Suspense fallback={null}>
          <Model modelUrl={modelUrl} heightM={heightM} autoRotate={autoRotate} fit={fit} />
          {fit === "full" && (
            <ContactShadows
              position={[0, -TARGET_HEIGHT / 2, 0]}
              opacity={0.35}
              blur={2.4}
              scale={4}
              far={2}
            />
          )}
        </Suspense>
        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 2.6}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, 0, 0]}
          />
        )}
      </Canvas>
    </div>
  );
}

export function preloadCharacter(modelUrl: string) {
  useGLTF.preload(modelUrl);
}
