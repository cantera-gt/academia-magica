"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const TARGET_HEIGHT = 1.7;

function Model({
  modelUrl,
  heightM,
  autoRotate,
}: {
  modelUrl: string;
  heightM: number;
  autoRotate: boolean;
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

  return (
    <group ref={group} scale={scale} position={[0, -TARGET_HEIGHT / 2, 0]}>
      <primitive object={scene} />
    </group>
  );
}

export interface CharacterViewerProps {
  modelUrl: string;
  heightM: number;
  autoRotate?: boolean;
  interactive?: boolean;
  className?: string;
}

export default function CharacterViewer({
  modelUrl,
  heightM,
  autoRotate = true,
  interactive = false,
  className,
}: CharacterViewerProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0.05, 2.5], fov: 30 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[2, 3, 2]} intensity={1.6} />
        <directionalLight position={[-2, 1, -2]} intensity={0.4} />
        <Suspense fallback={null}>
          <Model modelUrl={modelUrl} heightM={heightM} autoRotate={autoRotate} />
          <ContactShadows
            position={[0, -TARGET_HEIGHT / 2, 0]}
            opacity={0.35}
            blur={2.4}
            scale={4}
            far={2}
          />
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
