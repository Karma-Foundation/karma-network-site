"use client";

import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    } catch {}
  };
  return (
    <button type="button" className="copy" aria-label="Copy address" onClick={copy} style={done ? { borderColor: "var(--green)" } : undefined}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="5" y="5" width="9" height="9" rx="1" />
        <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" />
      </svg>
    </button>
  );
}
