import { fail, guard, ok } from "@/lib/api";
import { getLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export const GET = (_req: Request, { params }: { params: Promise<{ n: string }> }) =>
  guard(async () => {
    const { n } = await params;
    const block = /^\d{1,12}$/.test(n) ? await getLedger().block(Number(n)) : null;
    return block ? ok(block) : fail(404, "block not found");
  });
