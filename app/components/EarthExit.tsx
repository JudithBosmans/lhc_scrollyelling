"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Belgium coordinates for starting position
const BELGIUM_LAT = 50.5;
const BELGIUM_LON = 4.5;

function latLonToVector3(lat: number, lon: number, radius: number = 1) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

function EarthModel({ scrollProgress }: { scrollProgress: number }) {
    const { scene } = useGLTF("/3D_assets/earth.glb");
    const groupRef = useRef<THREE.Group>(null);

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

    // Move globe down as scroll progresses (camera flies over effect)
    useFrame(() => {
        if (!groupRef.current) return;
        const targetY = scrollProgress * 0.1;
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
    });

    return (
        <group ref={groupRef}>
            <primitive object={scene} scale={1} />
        </group>
    );
}

// Camera starts at Belgium zoom position
function CameraController() {
    const { camera } = useThree();
    const belgiumPos = latLonToVector3(BELGIUM_LAT, BELGIUM_LON, 2.2);

    useEffect(() => {
        camera.position.copy(belgiumPos);
        camera.lookAt(0, 0, 0);
    }, [camera, belgiumPos]);

    useFrame(() => {
        camera.lookAt(0, camera.position.y * 0.5, 0);
    });

    return null;
}

function Loader() {
    return (
        <mesh>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#1a1a2e" wireframe />
        </mesh>
    );
}

export default function EarthExit() {
    const [scrollProgress, setScrollProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Track scroll progress within this section
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

    // Text fades out in first 30% of scroll
    const textOpacity = Math.max(0, 1 - scrollProgress / 0.3);

    return (
        <div ref={containerRef} style={{ width: "100vw", height: "110vh", background: "#000", position: "relative" }}>
            <div style={{ position: "sticky", top: 0, width: "100vw", height: "100vh" }}>
                <Canvas style={{ position: "absolute", top: 0, left: 0 }} camera={{ position: [0, 0, 5], fov: 45 }}>
                    <ambientLight intensity={4} />
                    <directionalLight position={[5, 3, 5]} intensity={0.8} />
                    <directionalLight position={[-5, -3, -5]} intensity={0.6} />

                    <CameraController />

                    <Suspense fallback={<Loader />}>
                        <EarthModel scrollProgress={scrollProgress} />
                    </Suspense>
                </Canvas>

                {/* Text fades out first, then globe moves */}
                <div className="text textContainer textContainerHome">
                    <p
                        style={{
                            position: "absolute",
                            top: "15%",
                            left: "5%",
                            opacity: textOpacity,
                            transition: "opacity 0.2s ease",
                        }}
                    >
                        <strong>Let&apos;s zoom in on Belgium.</strong>
                    </p>
                    <div
                        className="text textContainer textContainerHome textContainerHomeCont"
                        style={{
                            position: "absolute",
                            bottom: "15%",
                            right: "5%",
                            opacity: textOpacity,
                            transition: "opacity 0.2s ease",
                        }}
                    >
                        <p>The Einstein Telescope may be built in Belgium. A triangular underground observatory that listens to the Universe.</p>
                        <p>
                            It can detect black holes, neutron stars — even signals from the Big Bang. So sensitive, it reaches back to the early moments of time. A cosmic time machine under Belgian
                            soil.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

useGLTF.preload("/3D_assets/earth.glb");
