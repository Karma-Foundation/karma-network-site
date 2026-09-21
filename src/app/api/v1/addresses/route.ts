import type { NextRequest } from "next/server";
import { guard, ok } from "@/lib/api";
import { getLedger } from "@/lib/ledger";
import { pageParam } from "@/lib/site";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest) =>
  guard(async () => ok(await getLedger().addresses(pageParam(req.nextUrl.searchParams.get("p") ?? undefined))));
