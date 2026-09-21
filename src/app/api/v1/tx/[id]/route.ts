import { fail, guard, ok } from "@/lib/api";
import { getLedger, isLive } from "@/lib/ledger";
import { liveJson } from "@/lib/ledger/live/json";
import { TX_ID_RE } from "@/lib/ledger/rules";

export const dynamic = "force-dynamic";

export const GET = (_req: Request, { params }: { params: Promise<{ id: string }> }) =>
  guard(async () => {
    const { id } = await params;
    const tx = isLive() ? await liveJson.tx(id.toLowerCase()) : TX_ID_RE.test(id) ? await getLedger().tx(id) : null;
    return tx ? ok(tx) : fail(404, "transaction not found");
  });
