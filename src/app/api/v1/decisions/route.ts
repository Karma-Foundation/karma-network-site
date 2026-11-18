import { guard, ok } from "@/lib/api";
import { decisionJson, sortedDecisions } from "@/content/decisions";

export const dynamic = "force-dynamic";

// The council's decision log, newest first. Read from src/content/decisions.ts.
export const GET = () => guard(async () => ok(sortedDecisions().map(decisionJson)));
