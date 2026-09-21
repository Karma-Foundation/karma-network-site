import { NextResponse } from "next/server";
import { NotPublishedError } from "@/lib/ledger/live/json";

// This site's own read-only JSON. It shares the /api/v1 prefix with the protocol API
// (chain.karmaterminal.com/api/v1) and the { data } envelope, but is a separate API.
const HEADERS = { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" };

export const ok = (data: unknown) => NextResponse.json({ data }, { headers: HEADERS });
export const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: HEADERS });

export async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof NotPublishedError) return fail(501, e.message);
    return fail(503, e instanceof Error ? e.message : "ledger unavailable");
  }
}
