import { fmt } from "@/lib/format";
import { currentHeight } from "@/lib/ledger";

export default async function BlockNotFound() {
  const height = await currentHeight();
  return (
    <div className="wrap page">
      <h1>Block not found</h1>
      <p className="body" style={{ marginTop: 12 }}>{height !== null ? `The ledger is at block ${fmt(height)}.` : "No such block."}</p>
    </div>
  );
}
