"use client";

import { useSpring, useTrail, animated, config } from "@react-spring/web";
import { ReactNode, useEffect, useState, useRef } from "react";

type AnimationType = "fadeUp" | "fadeIn" | "scaleIn" | "letterByLetter" | "wordByWord";

interface AnimatedTextProps {
    children: ReactNode;
    type?: AnimationType;
    delay?: number;
    duration?: number;
    className?: string;
    as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";
    triggerOnView?: boolean;
}

export default function AnimatedText({ children, type = "fadeUp", delay = 0, duration = 600, className = "", as: Tag = "span", triggerOnView = true }: AnimatedTextProps) {
    const [inView, setInView] = useState(!triggerOnView);
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!triggerOnView || !ref.current) return;
        const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setInView(true), { threshold: 0.1 });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [triggerOnView]);

    const spring = useSpring({
        from: getFromState(type),
        to: inView ? getToState(type) : getFromState(type),
        delay,
        config: { ...config.gentle, duration },
    });

    const text = typeof children === "string" ? children : "";
    const items = type === "letterByLetter" ? text.split("") : type === "wordByWord" ? text.split(" ") : [];

    const trail = useTrail(items.length, {
        from: { opacity: 0, y: 20 },
        to: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
        delay,
        config: { ...config.gentle, duration: duration / 2 },
    });

    if (type === "letterByLetter" || type === "wordByWord") {
        const AnimatedTag = animated[Tag as "span"];
        return (
            <AnimatedTag ref={ref as React.Ref<HTMLSpanElement>} className={className} style={{ display: "inline-block" }}>
                {trail.map((style, i) => (
                    <animated.span key={i} style={{ ...style, display: "inline-block", whiteSpace: "pre" }}>
                        {items[i]}
                        {type === "wordByWord" && i < items.length - 1 ? " " : ""}
                    </animated.span>
                ))}
            </AnimatedTag>
        );
    }

    const AnimatedTag = animated[Tag as "span"];
    return (
        <AnimatedTag ref={ref as React.Ref<HTMLSpanElement>} className={className} style={spring}>
            {children}
        </AnimatedTag>
    );
}

function getFromState(type: AnimationType) {
    switch (type) {
        case "fadeUp":
            return { opacity: 0, y: 40 };
        case "fadeIn":
            return { opacity: 0 };
        case "scaleIn":
            return { opacity: 0, scale: 0.8 };
        default:
            return { opacity: 0 };
    }
}

function getToState(type: AnimationType) {
    switch (type) {
        case "fadeUp":
            return { opacity: 1, y: 0 };
        case "fadeIn":
            return { opacity: 1 };
        case "scaleIn":
            return { opacity: 1, scale: 1 };
        default:
            return { opacity: 1 };
    }
}
