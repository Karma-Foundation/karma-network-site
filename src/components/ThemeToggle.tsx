"use client";

import { useSyncExternalStore } from "react";

type Theme = "auto" | "light" | "dark";
const NEXT: Record<Theme, Theme> = { auto: "light", light: "dark", dark: "auto" };

// The source of truth is the data-theme attribute the inline head script sets before paint.
const read = (): Theme => {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "auto";
};
const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
};

/** Cycles the prototype's data-theme override. "auto" follows prefers-color-scheme. */
export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribe, read, () => "auto");

  const cycle = () => {
    const next = NEXT[theme];
    if (next === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", next);
    try {
      if (next === "auto") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {}
  };

  return (
    <button type="button" className="theme-btn" onClick={cycle} aria-label={`Theme: ${theme}. Change theme`}>
      Theme: {theme}
    </button>
  );
}
