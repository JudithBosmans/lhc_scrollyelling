"use client";

import dynamic from "next/dynamic";
import AnimatedText from "./components/AnimatedText";

const Earth3D = dynamic(() => import("./components/Earth3D"), { ssr: false });

export default function Home() {
    return (
        <div>
            <AnimatedText as="h1">HOW FAR BACK IN TIME CAN WE SEE?</AnimatedText>
            <Earth3D />
        </div>
    );
}
