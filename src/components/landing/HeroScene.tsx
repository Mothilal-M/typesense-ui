import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Instances, Instance } from "@react-three/drei";
import * as THREE from "three";
import { useMouse3D } from "../../hooks/useMouse3D";

const PARTICLES_COUNT = 1500;

function Particles() {
  const mouse = useMouse3D();
  const groupRef = useRef<THREE.Group>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    const colorChoices = [
      new THREE.Color("#0cdcf7"), // cyan
      new THREE.Color("#8d30ff"), // purple
      new THREE.Color("#4ff0b7")  // mint
    ];

    for (let i = 0; i < PARTICLES_COUNT; i++) {
      const radius = Math.random() * 10 + 2;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      const scale = Math.random() * 0.05 + 0.01;

      temp.push({ 
        position: new THREE.Vector3(x, y, z), 
        color, 
        scale,
        speed: Math.random() * 0.2 + 0.1,
        offset: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Gentle rotation
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x += delta * 0.02;

      // Mouse parallax
      const targetX = mouse.x * 0.5;
      const targetY = mouse.y * -0.5;
      
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.05;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <Instances limit={PARTICLES_COUNT} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
        {particles.map((p, i) => (
          <Instance
            key={i}
            position={p.position}
            color={p.color}
            scale={p.scale}
          />
        ))}
      </Instances>
    </group>
  );
}

function CoreGeometry() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.5, 1]} />
      <meshBasicMaterial 
        color="#0cdcf7" 
        wireframe={true} 
        transparent 
        opacity={0.15} 
      />
    </mesh>
  );
}

export function HeroScene() {
  // Check for reduced motion
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return <div className="absolute inset-0 bg-gradient-to-br from-[#0f1025] to-[#0a0a1a]" />;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0a0a1a"]} />
        <fog attach="fog" args={["#0a0a1a", 10, 25]} />
        <Particles />
        <CoreGeometry />
      </Canvas>
    </div>
  );
}
