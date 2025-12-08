"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

function HubbleModel({ scrollProgress }: { scrollProgress: number }) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF("/3D_assets/HUBBLE.glb");
    const { actions } = useAnimations(animations, group);

    // Play animation when model loads
    useEffect(() => {
        if (actions && Object.keys(actions).length > 0) {
            const firstAction = actions[Object.keys(actions)[0]];
            if (firstAction) {
                firstAction.reset().play();
            }
        }
    }, [actions]);

    // Remove reflections
    useEffect(() => {
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const mat = child.material as THREE.MeshStandardMaterial;
                mat.roughness = 1;
                mat.metalness = 0;
            }
        });
    }, [scene]);

    // Fade in and slight rotation based on scroll
    useFrame(() => {
        if (!group.current) return;
        group.current.rotation.y += 0.002;
    });

    return (
        <group ref={group}>
            <primitive object={scene} scale={0.1} />
        </group>
    );
}

function Loader() {
    return (
        <mesh>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#1a1a2e" wireframe />
        </mesh>
    );
}

export default function Hubble() {
    const [scrollProgress, setScrollProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const progress = Math.max(0, Math.min(1, -rect.top / windowHeight));
            setScrollProgress(progress);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Model and text fade in as section enters
    const opacity = Math.min(1, scrollProgress * 3);

    return (
        <div ref={containerRef} style={{ width: "100vw", height: "200vh", background: "#000", position: "relative" }}>
            <div style={{ position: "sticky", top: 0, width: "100vw", height: "100vh" }}>
                <Canvas style={{ position: "absolute", top: 0, left: 0, opacity }} camera={{ position: [0, 0, 4], fov: 45 }}>
                    <ambientLight intensity={2} />
                    <directionalLight position={[5, 3, 5]} intensity={1} />
                    <directionalLight position={[-5, -3, -5]} intensity={0.5} />
                    <pointLight position={[0, 5, 0]} intensity={0.5} />

                    <Suspense fallback={<Loader />}>
                        <HubbleModel scrollProgress={scrollProgress} />
                    </Suspense>
                </Canvas>

                <div className="text textContainer textContainerHome">
                    <h2
                        style={{
                            position: "absolute",
                            top: "10%",
                            left: "5%",
                            opacity,
                            transition: "opacity 0.3s ease",
                        }}
                    >
                        <strong>HUBBLE</strong>
                    </h2>
                    <div
                        className="text textContainer textContainerHome textContainerHomeCont"
                        style={{
                            position: "absolute",
                            bottom: "10%",
                            right: "5%",
                            opacity,
                            transition: "opacity 0.3s ease",
                        }}
                    >
                        <p>Circling in our planet's orbit, the Hubble Space Telescope captures the most detailed images of distant galaxies.</p>
                        <p>It can see light from over 13 billion years ago — nearly to the beginning of the universe itself.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

useGLTF.preload("/3D_assets/HUBBLE.glb");
