import { fail, guard, ok } from "@/lib/api";
import { getLedger } from "@/lib/ledger";
import { TX_ID_RE } from "@/lib/ledger/rules";

export const dynamic = "force-dynamic";

export const GET = (_req: Request, { params }: { params: Promise<{ id: string }> }) =>
  guard(async () => {
    const { id } = await params;
    const tx = TX_ID_RE.test(id) ? await getLedger().tx(id) : null;
    return tx ? ok(tx) : fail(404, "transaction not found");
  });
