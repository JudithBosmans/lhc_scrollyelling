"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Image from "next/image";

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

    useEffect(() => {
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const mat = child.material as THREE.MeshStandardMaterial;
                mat.roughness = 1;
                mat.metalness = 0;
            }
        });
    }, [scene]);

    useFrame(() => {
        if (!groupRef.current) return;
        // Phase 1: Rotate to Belgium
        const rotationProgress = Math.min(scrollProgress, 1);
        const targetRotationY = rotationProgress * -0.3;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.1);

        // Phase 2: Move globe down (exit animation)
        const exitProgress = Math.max(0, scrollProgress - 1);
        const targetY = exitProgress * -2.3;
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
    });

    return (
        <group ref={groupRef}>
            <primitive object={scene} scale={1} />
        </group>
    );
}

// Hubble model with textures and animation
function HubbleModel({ scrollProgress }: { scrollProgress: number }) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF("/3D_assets/HUBBLE.glb");
    const { actions } = useAnimations(animations, group);

    useEffect(() => {
        if (actions && Object.keys(actions).length > 0) {
            const firstAction = actions[Object.keys(actions)[0]];
            if (firstAction) {
                firstAction.reset().play();
            }
        }
    }, [actions]);

    // Hubble appears at 1.5, exits at 2-2.5
    useFrame(() => {
        if (!group.current) return;
        group.current.rotation.y += 0.002;

        const fadeIn = Math.max(0, Math.min(1, (scrollProgress - 1.5) / 0.5));
        const fadeOut = scrollProgress > 2 ? Math.max(0, 1 - (scrollProgress - 2) / 0.5) : 1;
        group.current.visible = fadeIn * fadeOut > 0;

        // Exit animation: move up and out
        const exitProgress = Math.max(0, (scrollProgress - 2) / 0.5);
        group.current.position.y = 0.7 + exitProgress * 3;
    });

    return (
        <group ref={group} visible={false} position={[1, 0.7, 0]}>
            <primitive object={scene} scale={0.1} />
        </group>
    );
}

// Chandra model - appears after Hubble exits
function ChandraModel({ scrollProgress }: { scrollProgress: number }) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF("/3D_assets/chandra.glb");
    const { actions } = useAnimations(animations, group);

    useEffect(() => {
        if (actions && Object.keys(actions).length > 0) {
            const firstAction = actions[Object.keys(actions)[0]];
            if (firstAction) {
                firstAction.reset().play();
            }
        }
    }, [actions]);

    // Chandra appears at progress 4.5-5
    useFrame(() => {
        if (!group.current) return;
        group.current.rotation.y += 0.002;

        const chandraProgress = Math.max(0, Math.min(1, (scrollProgress - 4.5) / 0.5));
        group.current.visible = chandraProgress > 0;
    });

    return (
        <group ref={group} visible={false} position={[1, 0.7, 0]}>
            <primitive object={scene} scale={0.004} />
        </group>
    );
}

function CameraController({ scrollProgress }: { scrollProgress: number }) {
    const { camera } = useThree();
    const startPos = new THREE.Vector3(0, 0, 5);
    const belgiumPos = latLonToVector3(BELGIUM_LAT, BELGIUM_LON, 2.2);
    // End position of phase 1 (80% toward Belgium)
    const phase1EndPos = new THREE.Vector3().lerpVectors(startPos, belgiumPos, 0.8);
    const hubbleViewPos = new THREE.Vector3(0, 0, 4);

    useFrame(() => {
        if (scrollProgress <= 1) {
            // Phase 1: Zoom toward Belgium (0-80% of the way)
            camera.position.lerpVectors(startPos, belgiumPos, scrollProgress * 0.8);
        } else {
            // Phase 2: Smooth transition from phase1EndPos to hubbleViewPos
            const hubbleProgress = Math.min(1, (scrollProgress - 1) / 1);
            camera.position.lerpVectors(phase1EndPos, hubbleViewPos, hubbleProgress);
        }

        camera.lookAt(0, 0, 0);
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

export default function Earth3D() {
    const [scrollProgress, setScrollProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            // Progress 0-5: each unit = 100vh scroll
            const progress = Math.max(0, Math.min(5, -rect.top / windowHeight));
            setScrollProgress(progress);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Intro text: appears early (0.1-0.3), fades before earth zoom text (0.4-0.55)
    const introTextAppear = Math.max(0, Math.min(1, (scrollProgress - 0.1) / 0.2));
    const introTextFade = scrollProgress > 0.4 ? Math.max(0, 1 - (scrollProgress - 0.4) / 0.15) : 1;
    const introTextOpacity = introTextAppear * introTextFade;

    // Earth text: appears at 60%, fades at progress 1-1.3
    const earthTextAppear = Math.max(0, Math.min(1, (scrollProgress - 0.6) / 0.4));
    const earthTextFade = scrollProgress > 1 ? Math.max(0, 1 - (scrollProgress - 1) / 0.3) : 1;
    const earthTextOpacity = earthTextAppear * earthTextFade;

    // Hubble text: appears at 1.5-2, fades at 2-2.5
    const hubbleTextAppear = Math.max(0, Math.min(1, (scrollProgress - 1.5) / 0.5));
    const hubbleTextFade = scrollProgress > 2 ? Math.max(0, 1 - (scrollProgress - 2) / 0.5) : 1;
    const hubbleTextOpacity = hubbleTextAppear * hubbleTextFade;

    // Chandra text: appears at 4.5-5 (~4 seconds after Hubble fades)
    const chandraTextOpacity = Math.max(0, Math.min(1, (scrollProgress - 4.5) / 0.5));

    return (
        <div ref={containerRef} style={{ width: "100vw", height: "600vh", background: "#000", position: "relative" }}>
            <div style={{ position: "sticky", top: 0, width: "100vw", height: "100vh" }}>
                <Canvas style={{ position: "absolute", top: 0, left: 0, zIndex: 2, pointerEvents: "none" }} camera={{ position: [0, 0, 5], fov: 45 }}>
                    <ambientLight intensity={2} />
                    <directionalLight position={[5, 3, 5]} intensity={1} />
                    <directionalLight position={[-5, -3, -5]} intensity={0.5} />
                    <pointLight position={[0, 5, 0]} intensity={0.5} />

                    <CameraController scrollProgress={scrollProgress} />

                    <Suspense fallback={<Loader />}>
                        <EarthModel scrollProgress={scrollProgress} />
                        <HubbleModel scrollProgress={scrollProgress} />
                        <ChandraModel scrollProgress={scrollProgress} />
                    </Suspense>
                </Canvas>

                {/* Intro text - appears right after scrolling from title, before earth zoom */}
                <div
                    className="introText"
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        opacity: introTextOpacity,
                        transition: "opacity 0.3s ease",
                        zIndex: 3,
                        pointerEvents: introTextOpacity > 0 ? "auto" : "none",
                        textAlign: "center",
                        maxWidth: "700px",
                    }}
                >
                    <p className="introTextTitle" style={{ fontSize: "32px", fontWeight: 700, marginBottom: "20px", letterSpacing: "2px" }}>
                        BEYOND LIGHT
                    </p>
                    <p style={{ fontSize: "20px", lineHeight: 1.6, fontWeight: 300 }}>
                        To look far into the universe is to look far back in time. This project explores how different instruments, from optical telescopes to the Einstein Telescope, extend our
                        ability to detect signals from the universe&apos;s earliest moments.{" "}
                    </p>
                </div>

                {/* Earth text  */}
                <div className="text textContainer textContainerHome" style={{ pointerEvents: earthTextOpacity > 0 ? "auto" : "none" }}>
                    <div
                        className="Container"
                        style={{
                            position: "absolute",
                            top: "10%",
                            left: "5%",
                            opacity: earthTextOpacity,
                            transition: "opacity 0.3s ease",
                            textAlign: "left",
                            zIndex: 2,
                        }}
                    >
                        <div>
                            <p className="ContainerSubTitle">
                                <strong>EINSTEIN TELESCOPE</strong>
                            </p>
                            <p className="ContainerText">
                                The underground Einstein Telescope will be Europe&apos;s most advanced observatory for gravitational waves. It will allow researchers to hear black holes collide and
                                learn about the early universe. The Netherlands, Belgium and Germany are jointly studying whether to host this world-class observatory.
                            </p>
                        </div>

                        <div className="ContainerSummary">
                            <div className="ContainerSummaryItem">
                                <p>should look back</p>
                                <p>
                                    <strong>13.8b. years</strong>
                                </p>
                            </div>
                            <div className="ContainerSummaryItem">
                                <p>distance from earth</p>
                                <p>
                                    <strong>-10km</strong>
                                </p>
                            </div>
                            <div className="ContainerSummaryItem">
                                <p>estimate building time</p>
                                <p>
                                    <strong>+- 17 years</strong>
                                </p>
                            </div>
                            <div className="ContainerSummaryItem">
                                <p>to be built on</p>
                                <p>
                                    <strong>2028</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div
                        className="Container"
                        style={{
                            position: "absolute",
                            bottom: "7%",
                            right: "8%",
                            opacity: earthTextOpacity,
                            transition: "opacity 0.3s ease",
                            textAlign: "right",
                            zIndex: 2,
                            maxWidth: "700px",
                        }}
                    >
                        <div>
                            <p className="Container">
                                The soil in which the underground Einstein Telescope will be built partly determines its accuracy. The less vibrations it passes through, the less interference for the
                                measuring equipment. The hard surface combined with the soft, cushioning top layer seems ideally suited for the Einstein Telescope. The peace and quiet of the area
                                makes the border area a suitable site for the Einstein Telescope.
                            </p>
                        </div>
                    </div>
                    <div
                        className="ContainerSummaryImage3"
                        style={{
                            opacity: earthTextOpacity,
                            transition: "opacity 0.3s ease",
                            zIndex: 2,
                        }}
                    >
                        <Image src="/images/hubble/ET.png" alt="Einstein" width={650} height={400} />
                    </div>
                </div>

                {/* Hubble text */}
                <div className="text textContainer textContainerHome" style={{ pointerEvents: hubbleTextOpacity > 0 ? "auto" : "none" }}>
                    <div
                        className="Container"
                        style={{
                            position: "absolute",
                            top: "10%",
                            left: "5%",
                            opacity: hubbleTextOpacity,
                            transition: "opacity 0.3s ease",
                            textAlign: "left",
                        }}
                    >
                        <div>
                            <p className="ContainerSubTitle">
                                <strong>HUBBLE</strong>
                            </p>
                            <p className="ContainerText"> Circling in our planet&apos;s orbit, the Hubble Space Telescope captures the most detailed images of distant galaxies.</p>
                        </div>

                        <div className="ContainerSummary">
                            <div className="ContainerSummaryItem">
                                <p>can look back</p>
                                <p>
                                    <strong>13.4b. light years</strong>
                                </p>
                            </div>
                            <div className="ContainerSummaryItem">
                                <p>built in</p>
                                <p>
                                    <strong>7 years</strong>
                                </p>
                            </div>
                            <div className="ContainerSummaryItem">
                                <p>distance from earth</p>
                                <p>
                                    <strong>483km.</strong>
                                </p>
                            </div>
                            <div className="ContainerSummaryItem">
                                <p>launched on</p>
                                <p>
                                    <strong>April 24, 1990</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div
                        className="ContainerSummaryImage"
                        style={{
                            opacity: hubbleTextOpacity,
                            transition: "opacity 0.3s ease",
                            zIndex: 1,
                        }}
                    >
                        <Image src="/images/hubble/galaxies.jpg" alt="Hubble" width={500} height={300} />
                        <span className="overlay">
                            Approximately 10,000 galaxies fill a small area of sky called the Hubble Ultra Deep Field. Created through the collaboration of 20 astronomers and scientists, this is the
                            deepest image of the universe ever made at optical and near-infrared wavelengths. NASA, ESA, S. Beckwith and the HUDF Team (STScI), and B. Mobasher (STScI)
                        </span>
                    </div>
                    <div
                        className="ContainerSummaryImage2"
                        style={{
                            opacity: hubbleTextOpacity,
                            transition: "opacity 0.3s ease",
                            zIndex: 1,
                        }}
                    >
                        <Image src="/images/hubble/star-V838.jpg" alt="star-V838" width={500} height={300} />
                        <span className="overlay">
                            This Hubble Space Telescope image of the star V838 Monocerotis reveals dramatic changes in the illumination of surrounding dusty cloud structures. The effect, called a
                            light echo, unveiled never-before-seen dust patterns when the star suddenly brightened for several weeks in early 2002. NASA, ESA, and The Hubble Heritage Team (STScI/AURA)
                        </span>
                    </div>
                    <div
                        className="text textContainer textContainerHome textContainerHomeCont textContainerHomeContRight"
                        style={{
                            position: "absolute",
                            bottom: "10%",
                            right: "5%",
                            opacity: hubbleTextOpacity,
                            transition: "opacity 0.3s ease",
                            zIndex: 2,
                        }}
                    >
                        <p className="ContainerText">Circling in our planet&apos;s orbit, the Hubble Space Telescope captures the most detailed images of distant galaxies.</p>
                        <p className="ContainerText">It can see light from over 13 billion years ago — nearly to the beginning of the universe itself.</p>
                    </div>
                </div>

                {/* Chandra text - same layout as Hubble */}
                <div className="text textContainer textContainerHome" style={{ pointerEvents: chandraTextOpacity > 0 ? "auto" : "none" }}>
                    <div
                        className="Container"
                        style={{
                            position: "absolute",
                            top: "10%",
                            left: "5%",
                            opacity: chandraTextOpacity,
                            transition: "opacity 0.3s ease",
                            textAlign: "left",
                        }}
                    >
                        <div>
                            <p className="ContainerSubTitle">
                                <strong>CHANDRA X-RAY OBSERVATORY</strong>
                            </p>
                            <p className="ContainerText">
                                The Chandra X-ray Observatory is the world's most powerful X-ray telescope. It has eight-times greater resolution and is able to detect sources more than 20-times
                                fainter than any previous X-ray telescope
                            </p>
                        </div>

                        <div className="ContainerSummary">
                            <div className="ContainerSummaryItem">
                                <p>can look back</p>
                                <p>
                                    <strong>10b. light years</strong>
                                </p>
                            </div>
                            <div className="ContainerSummaryItem">
                                <p>built in</p>
                                <p>
                                    <strong>xxx</strong>
                                </p>
                            </div>
                            <div className="ContainerSummaryItem">
                                <p>distance from earth</p>
                                <p>
                                    <strong>139,000km.</strong>
                                </p>
                            </div>
                            <div className="ContainerSummaryItem">
                                <p>launched on</p>
                                <p>
                                    <strong>July 23, 1999</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div
                        className="ContainerSummaryImage"
                        style={{
                            opacity: chandraTextOpacity,
                            transition: "opacity 0.3s ease",
                            zIndex: 1,
                        }}
                    >
                        <Image src="/images/hubble/galaxies.jpg" alt="Chandra" width={500} height={300} />
                        <span className="overlay">Placeholder image - replace with Chandra X-ray imagery.</span>
                    </div>
                    <div
                        className="ContainerSummaryImage2"
                        style={{
                            opacity: chandraTextOpacity,
                            transition: "opacity 0.3s ease",
                            zIndex: 1,
                        }}
                    >
                        <Image src="/images/hubble/star-V838.jpg" alt="Chandra observation" width={500} height={300} />
                        <span className="overlay">Placeholder image - replace with Chandra X-ray imagery.</span>
                    </div>
                    <div
                        className="text textContainer textContainerHome textContainerHomeCont textContainerHomeContRight"
                        style={{
                            position: "absolute",
                            bottom: "10%",
                            right: "5%",
                            opacity: chandraTextOpacity,
                            transition: "opacity 0.3s ease",
                            zIndex: 2,
                        }}
                    >
                        <p className="ContainerText">Chandra observes X-rays from high-energy regions of the universe — black holes, supernovas, and dark matter.</p>
                        <p className="ContainerText">Its highly elliptical orbit takes it one-third of the way to the Moon, allowing long uninterrupted observations.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

useGLTF.preload("/3D_assets/earth.glb");
useGLTF.preload("/3D_assets/HUBBLE.glb");
useGLTF.preload("/3D_assets/chandra.glb");
