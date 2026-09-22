import type { NextRequest } from "next/server";
import { guard, ok } from "@/lib/api";
import { getLedger, isLive } from "@/lib/ledger";
import { liveJson } from "@/lib/ledger/live/json";
import { pageParam } from "@/lib/site";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest) =>
  guard(async () => {
    const p = pageParam(req.nextUrl.searchParams.get("p") ?? undefined);
    return ok(isLive() ? await liveJson.addresses(p) : await getLedger().addresses(p));
  });
