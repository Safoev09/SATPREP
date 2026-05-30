"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    Desmos?: any;
  }
}

// Three size presets the resize button cycles through
const SIZES = [
  { label: "S", width: 360, height: 340 },
  { label: "M", width: 460, height: 440 },
  { label: "L", width: 600, height: 560 },
];

export default function CalculatorPanel({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calcRef = useRef<any>(null);

  // Position (top-left corner) and size
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [sizeIndex, setSizeIndex] = useState(1); // start at "M"
  const size = SIZES[sizeIndex];

  // Place it bottom-right on first render
  useEffect(() => {
    setPos({
      x: window.innerWidth - size.width - 24,
      y: window.innerHeight - size.height - 24,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep it on-screen when size changes
  useEffect(() => {
    setPos((p) => ({
      x: Math.min(p.x, window.innerWidth - size.width - 8),
      y: Math.min(p.y, window.innerHeight - size.height - 8),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeIndex]);

  // ---- Load + init Desmos ----
  useEffect(() => {
    let cancelled = false;

    const initCalculator = () => {
      if (cancelled || !containerRef.current || !window.Desmos) return;
      if (calcRef.current) return; // already initialised
      calcRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
        keypad: true,
        expressions: true,
        settingsMenu: false,
        zoomButtons: true,
        border: false,
      });
    };

    if (window.Desmos) {
      initCalculator();
    } else {
      const existing = document.getElementById("desmos-script");
      if (existing) {
        existing.addEventListener("load", initCalculator);
      } else {
        const script = document.createElement("script");
        script.id = "desmos-script";
        script.src =
          "https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
        script.async = true;
        script.onload = initCalculator;
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (calcRef.current) {
        try {
          calcRef.current.destroy();
        } catch {
          // ignore
        }
        calcRef.current = null;
      }
    };
  }, []);

  // Desmos needs a resize nudge when the container size changes
  useEffect(() => {
    if (calcRef.current) {
      try {
        calcRef.current.resize();
      } catch {
        // ignore
      }
    }
  }, [sizeIndex]);

  // ---- Dragging ----
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onDragStart = (e: React.MouseEvent) => {
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    e.preventDefault();
  };

  const onDragMove = useCallback((e: MouseEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    let nx = dragState.current.origX + dx;
    let ny = dragState.current.origY + dy;
    // Clamp to viewport
    nx = Math.max(0, Math.min(nx, window.innerWidth - size.width));
    ny = Math.max(0, Math.min(ny, window.innerHeight - size.height));
    setPos({ x: nx, y: ny });
  }, [size.width, size.height]);

  const onDragEnd = useCallback(() => {
    dragState.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragEnd);
    };
  }, [onDragMove, onDragEnd]);

  const cycleSize = () => setSizeIndex((i) => (i + 1) % SIZES.length);

  return (
    <div
      className="fixed z-40 glass rounded-2xl overflow-hidden"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.width,
      }}
    >
      {/* Drag handle / title bar */}
      <div
        onMouseDown={onDragStart}
        className="flex justify-between items-center px-4 py-2.5 bg-coffee-800 text-cream-50 cursor-move select-none"
      >
        <span className="font-medium text-sm flex items-center gap-2">
          <span className="text-cream-200">⠿</span> Calculator
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={cycleSize}
            className="text-cream-200 hover:text-cream-50 text-xs border border-cream-100/30 rounded px-2 py-0.5"
            title="Change size"
          >
            Size: {size.label}
          </button>
          <button
            onClick={onClose}
            className="text-cream-200 hover:text-cream-50 text-lg leading-none px-1"
            aria-label="Close calculator"
          >
            ×
          </button>
        </div>
      </div>
      <div ref={containerRef} style={{ width: "100%", height: size.height }} />
    </div>
  );
}
