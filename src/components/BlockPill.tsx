"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/format";

const REFRESH_MS = 30_000;

/**
 * Live block height. Polls this site's own /api/v1/supply rather than recomputing from the
 * genesis constants, so it keeps working unchanged when the ledger source becomes rpc.
 */
export function BlockPill({ initialHeight }: { initialHeight: number | null }) {
  const [height, setHeight] = useState<number | null>(initialHeight);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/v1/supply", { cache: "no-store" });
        if (!res.ok) return;
        const json: unknown = await res.json();
        const h = (json as { data?: { height?: unknown } })?.data?.height;
        if (alive && typeof h === "number" && Number.isFinite(h)) setHeight(h);
      } catch {}
    };
    tick();
    const id = setInterval(tick, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <Link className="blockpill mono" href="/status">
      <span className="dot" aria-hidden="true" />
      <span className="num">Block {height === null ? "-" : fmt(height)}</span>
    </Link>
  );
}
