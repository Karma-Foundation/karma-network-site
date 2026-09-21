import { fail, guard, ok } from "@/lib/api";
import { getLedger, isLive } from "@/lib/ledger";
import { liveJson } from "@/lib/ledger/live/json";

export const dynamic = "force-dynamic";

export const GET = (_req: Request, { params }: { params: Promise<{ addr: string }> }) =>
  guard(async () => {
    const { addr } = await params;
    if (isLive()) {
      const live = await liveJson.address(addr);
      return live ? ok(live) : fail(404, "address not found");
    }
    const ledger = getLedger();
    const address = await ledger.address(addr);
    if (!address) return fail(404, "address not found");
    const transactions = await ledger.txForAddress(addr);
    return ok({ ...address, transactions });
  });
