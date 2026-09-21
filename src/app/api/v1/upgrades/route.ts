import { guard, ok } from "@/lib/api";
import { getLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export const GET = () => guard(async () => ok(await getLedger().upgrades()));
