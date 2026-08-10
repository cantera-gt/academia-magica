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

export interface AccessoryAttachment {
  /** URL del .glb del accesorio (solo la pieza, sin personaje ni esqueleto propio). */
  modelUrl: string;
  /**
   * Substring (sin distinguir mayusculas) para encontrar el hueso al que
   * engancharse dentro del esqueleto Mixamo del personaje, ej. "head",
   * "spine2". Todos los personajes comparten los mismos nombres de hueso
   * (prefijo "mixamorig:"), asi que un mismo accesorio sirve para los 6.
   */
  boneTarget: string;
}

/**
 * Busca, dentro de un objeto 3D ya montado, el primer hueso cuyo nombre
 * contenga `boneTarget` (sin importar mayusculas). Devuelve null si no lo
 * encuentra (por ejemplo, mientras el modelo todavia no termino de montar).
 */
function findBone(root: THREE.Object3D, boneTarget: string): THREE.Bone | null {
  const needle = boneTarget.toLowerCase();
  let found: THREE.Bone | null = null;
  root.traverse((obj) => {
    if (!found && (obj as THREE.Bone).isBone && obj.name.toLowerCase().includes(needle)) {
      found = obj as THREE.Bone;
    }
  });
  return found;
}

/**
 * Carga un accesorio (.glb) y lo engancha como hijo del hueso indicado del
 * personaje ya montado. Al ser hijo del hueso en el scene graph de
 * Three.js, sigue automaticamente la animacion sin ningun calculo manual
 * de posicion por frame.
 */
function Accessory({
  modelUrl,
  boneTarget,
  characterGroup,
}: AccessoryAttachment & { characterGroup: React.RefObject<THREE.Group | null> }) {
  const { scene: accessoryScene } = useGLTF(modelUrl);

  useEffect(() => {
    const root = characterGroup.current;
    if (!root) return;

    const bone = findBone(root, boneTarget);
    if (!bone) {
      console.warn(`[Accessory] No se encontro hueso "${boneTarget}" para ${modelUrl}`);
      return;
    }

    const instance = accessoryScene.clone(true);
    bone.add(instance);

    return () => {
      bone.remove(instance);
    };
  }, [accessoryScene, boneTarget, characterGroup, modelUrl]);

  return null;
}

function Model({
  modelUrl,
  heightM,
  autoRotate,
  fit,
  accessories,
}: {
  modelUrl: string;
  heightM: number;
  autoRotate: boolean;
  fit: Fit;
  accessories: AccessoryAttachment[];
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
      {accessories.map((acc) => (
        <Accessory key={acc.modelUrl + acc.boneTarget} {...acc} characterGroup={group} />
      ))}
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
  /** Accesorios equipados (gorro, mochila, etc.) enganchados al esqueleto. */
  accessories?: AccessoryAttachment[];
  className?: string;
}

export default function CharacterViewer({
  modelUrl,
  heightM,
  autoRotate = true,
  interactive = false,
  fit = "full",
  accessories = [],
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
          <Model
            modelUrl={modelUrl}
            heightM={heightM}
            autoRotate={autoRotate}
            fit={fit}
            accessories={accessories}
          />
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
