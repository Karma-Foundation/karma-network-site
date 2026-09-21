import { guard, ok } from "@/lib/api";
import { getLedger, isLive } from "@/lib/ledger";
import { liveJson } from "@/lib/ledger/live/json";

export const dynamic = "force-dynamic";

export const GET = () => guard(async () => ok(isLive() ? await liveJson.upgrades() : await getLedger().upgrades()));
