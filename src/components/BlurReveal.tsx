"use client";

import { useEffect, useRef, useState } from "react";

// Splits text into words and reveals them one by one with a blur-to-sharp
// motion. Respects prefers-reduced-motion by rendering instantly.
export default function BlurReveal({
  text,
  className = "",
  as: Tag = "span",
  delayStep = 60,
  startDelay = 0,
}: {
  text: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "p";
  delayStep?: number;   // ms between each word
  startDelay?: number;  // ms before the first word starts
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const words = text.split(" ");

  if (reduceMotion) {
    const El = Tag as any;
    return <El ref={ref} className={className}>{text}</El>;
  }

  const El = Tag as any;
  return (
    <El ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            filter: visible ? "blur(0px)" : "blur(10px)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transition: `filter 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)`,
            transitionDelay: `${startDelay + i * delayStep}ms`,
            marginRight: "0.28em",
          }}
        >
          {word}
        </span>
      ))}
    </El>
  );
}
