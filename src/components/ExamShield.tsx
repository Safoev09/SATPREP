"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type ShieldMode = "strict" | "focus";

export type Violation = {
  kind: "tab_switch" | "fullscreen_exit" | "paste_attempt" | "copy_attempt" | "context_menu" | "reload_attempt" | "print_attempt";
  at: number; // ms timestamp
};

export type ExamShieldHandle = {
  violations: Violation[];
  isFullscreen: boolean;
};

const VIOLATION_LABEL: Record<Violation["kind"], string> = {
  tab_switch: "Left the test window",
  fullscreen_exit: "Exited fullscreen",
  paste_attempt: "Paste blocked",
  copy_attempt: "Copy blocked",
  context_menu: "Right-click blocked",
  reload_attempt: "Reload blocked",
  print_attempt: "Print blocked",
};

export default function ExamShield({
  mode,
  threshold = 2,
  onViolation,
  onThresholdReached,
  active = true,
}: {
  mode: ShieldMode;
  threshold?: number;
  onViolation?: (v: Violation, all: Violation[]) => void;
  onThresholdReached?: (all: Violation[]) => void;
  active?: boolean;
}) {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showStartGate, setShowStartGate] = useState(mode === "strict");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const violationsRef = useRef<Violation[]>([]);
  const thresholdHitRef = useRef(false);

  const logViolation = useCallback(
    (kind: Violation["kind"]) => {
      if (!active) return;
      const v: Violation = { kind, at: Date.now() };
      violationsRef.current = [...violationsRef.current, v];
      setViolations(violationsRef.current);
      setToastMsg(
        `⚠️ ${VIOLATION_LABEL[kind]} — warning ${violationsRef.current.length} of ${threshold}`
      );
      setTimeout(() => setToastMsg(null), 3500);
      onViolation?.(v, violationsRef.current);
      if (!thresholdHitRef.current && violationsRef.current.length >= threshold) {
        thresholdHitRef.current = true;
        onThresholdReached?.(violationsRef.current);
      }
    },
    [active, threshold, onViolation, onThresholdReached]
  );

  // Tab/window blur detection
  useEffect(() => {
    if (!active) return;
    const onVisibility = () => {
      if (document.hidden) logViolation("tab_switch");
    };
    const onBlur = () => {
      // Only count blur if document isn't already hidden (avoid double-count)
      if (!document.hidden) logViolation("tab_switch");
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [active, logViolation]);

  // Copy / paste / context menu / print blocking
  useEffect(() => {
    if (!active) return;
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation("copy_attempt");
    };
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation("paste_attempt");
    };
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      logViolation("context_menu");
    };
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + P (print)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        logViolation("print_attempt");
      }
      // Ctrl/Cmd + S (save), Ctrl + U (view source) — block silently
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "s" || e.key.toLowerCase() === "u")) {
        e.preventDefault();
      }
      // F12 (devtools) — can't actually block, but we can try to discourage
      if (e.key === "F12") {
        e.preventDefault();
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [active, logViolation]);

  // Fullscreen detection (strict only)
  useEffect(() => {
    if (!active || mode !== "strict") return;
    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      // If we were in fullscreen and now we're not, that's a violation.
      // We avoid logging when we INITIALLY enter fullscreen.
      if (!fs && violationsRef.current.length >= 0 && !showStartGate) {
        // Use a setTimeout so we don't fire on initial mount
        setTimeout(() => {
          if (!document.fullscreenElement) {
            logViolation("fullscreen_exit");
          }
        }, 50);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [active, mode, showStartGate, logViolation]);

  // Hide the global sidebar/header when shield is active.
  // This works by adding a class to <body>; CSS in globals.css can react.
  useEffect(() => {
    if (!active) return;
    document.body.classList.add("exam-mode");
    return () => {
      document.body.classList.remove("exam-mode");
    };
  }, [active]);

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowStartGate(false);
    } catch {
      // user may have denied; we still let them proceed but flag immediately
      setShowStartGate(false);
      logViolation("fullscreen_exit");
    }
  };

  // Strict-mode start gate: ask the user to enter fullscreen before the test starts
  if (mode === "strict" && showStartGate) {
    return (
      <div className="fixed inset-0 z-[9999] bg-coffee-900/95 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-cream-50 rounded-3xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🛡️</div>
          <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-2">
            Exam mode
          </h2>
          <p className="text-coffee-700 mb-5 leading-relaxed text-sm">
            This test runs in full-screen anti-cheating mode. Before starting, please understand:
          </p>
          <ul className="text-left text-sm text-coffee-700 space-y-2 mb-6 bg-cream-100 rounded-2xl p-4">
            <li className="flex items-start gap-2"><span>•</span><span>The test will open in browser full-screen.</span></li>
            <li className="flex items-start gap-2"><span>•</span><span>Leaving full-screen, switching tabs, or copy/paste attempts are flagged.</span></li>
            <li className="flex items-start gap-2"><span>•</span><span>After <strong>{threshold} violations</strong>, the test auto-submits.</span></li>
            <li className="flex items-start gap-2"><span>•</span><span>Press <kbd className="bg-cream-200 px-1.5 py-0.5 rounded text-[10px] font-mono">F11</kbd> if you want to manually toggle fullscreen at any time.</span></li>
          </ul>
          <button
            onClick={requestFullscreen}
            className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-6 py-3 rounded-full text-sm font-medium hover:scale-[1.02] transition w-full"
          >
            Enter exam mode →
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Violation toast */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-[fadeup_0.25s_ease-out] max-w-md text-center">
          {toastMsg}
        </div>
      )}

      {/* Re-enter fullscreen prompt (strict mode only, when we lost fullscreen) */}
      {active && mode === "strict" && !isFullscreen && !showStartGate && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9997] bg-coffee-900 text-cream-50 px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3">
          <span className="text-sm">You're not in full-screen.</span>
          <button
            onClick={requestFullscreen}
            className="bg-accent hover:bg-accent/90 text-cream-50 text-xs font-medium px-3 py-1.5 rounded-full"
          >
            Re-enter →
          </button>
        </div>
      )}

      {/* Subtle exam indicator (top corner) */}
      {active && (
        <div className="fixed top-3 right-4 z-[9990] flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-coffee-900/80 backdrop-blur text-cream-50 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span>{mode === "strict" ? "Exam mode" : "Focus mode"}</span>
            {violations.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {violations.length}/{threshold}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Export the labels so results pages can render them nicely
export { VIOLATION_LABEL };
