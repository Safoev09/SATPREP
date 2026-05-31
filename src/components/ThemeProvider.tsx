"use client";

import { useEffect } from "react";

// Zen dark mode is currently disabled.
// This component just ensures any stale "dark" class is removed from <html>
// and clears any saved theme preference from when the toggle existed.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    try { localStorage.removeItem("satprep-theme"); } catch {}
  }, []);

  return <>{children}</>;
}
