import { fail, guard, ok } from "@/lib/api";
import { getLedger, isLive } from "@/lib/ledger";
import { liveJson } from "@/lib/ledger/live/json";

export const dynamic = "force-dynamic";

export const GET = (_req: Request, { params }: { params: Promise<{ n: string }> }) =>
  guard(async () => {
    const { n } = await params;
    const block = !/^\d{1,12}$/.test(n) ? null : isLive() ? await liveJson.block(Number(n)) : await getLedger().block(Number(n));
    return block ? ok(block) : fail(404, "block not found");
  });
