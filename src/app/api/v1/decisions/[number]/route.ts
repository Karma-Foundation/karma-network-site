import { fail, guard, ok } from "@/lib/api";
import { decisionJson, findDecision } from "@/content/decisions";

export const dynamic = "force-dynamic";

// One decision by number: /api/v1/decisions/D-001 (a bare 1 is accepted too).
export const GET = (_req: Request, { params }: { params: Promise<{ number: string }> }) =>
  guard(async () => {
    const { number } = await params;
    const d = findDecision(decodeURIComponent(number));
    return d ? ok(decisionJson(d)) : fail(404, "decision not found");
  });
