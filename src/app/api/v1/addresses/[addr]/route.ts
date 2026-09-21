import { fail, guard, ok } from "@/lib/api";
import { getLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export const GET = (_req: Request, { params }: { params: Promise<{ addr: string }> }) =>
  guard(async () => {
    const { addr } = await params;
    const ledger = getLedger();
    const address = await ledger.address(addr);
    if (!address) return fail(404, "address not found");
    const transactions = await ledger.txForAddress(addr);
    return ok({ ...address, transactions });
  });
