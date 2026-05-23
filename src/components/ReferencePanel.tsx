"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BlockMath } from "react-katex";
import { MATH_REFERENCE, MATH_REFERENCE_FACTS } from "@/lib/math-reference";

const PANEL_WIDTH = 420;
const PANEL_HEIGHT = 500;

export default function ReferencePanel({ onClose }: { onClose: () => void }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPos({
      x: window.innerWidth - PANEL_WIDTH - 24,
      y: 90,
    });
  }, []);

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
    nx = Math.max(0, Math.min(nx, window.innerWidth - PANEL_WIDTH));
    ny = Math.max(0, Math.min(ny, window.innerHeight - 80));
    setPos({ x: nx, y: ny });
  }, []);

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

  return (
    <div
      className="fixed z-40 bg-cream-50 rounded-2xl shadow-2xl border border-coffee-700/15 overflow-hidden"
      style={{ left: pos.x, top: pos.y, width: PANEL_WIDTH }}
    >
      <div
        onMouseDown={onDragStart}
        className="flex justify-between items-center px-4 py-2.5 bg-coffee-800 text-cream-50 cursor-move select-none"
      >
        <span className="font-medium text-sm flex items-center gap-2">
          <span className="text-cream-200">⠿</span> Reference sheet
        </span>
        <button
          onClick={onClose}
          className="text-cream-200 hover:text-cream-50 text-lg leading-none"
          aria-label="Close reference"
        >
          ×
        </button>
      </div>
      <div className="p-5 overflow-y-auto" style={{ maxHeight: PANEL_HEIGHT }}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
          {MATH_REFERENCE.map((item) => (
            <div key={item.label} className="bg-cream-100 rounded-lg p-3">
              <div className="text-xs text-coffee-600 mb-1">{item.label}</div>
              <BlockMath math={item.latex} />
            </div>
          ))}
        </div>
        <div className="border-t border-coffee-700/10 pt-3 space-y-1.5">
          {MATH_REFERENCE_FACTS.map((fact, i) => (
            <p key={i} className="text-xs text-coffee-700 leading-relaxed">
              • {fact}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
