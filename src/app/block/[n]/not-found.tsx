import { fmt } from "@/lib/format";
import { getLedger } from "@/lib/ledger";

export default async function BlockNotFound() {
  const { height } = await getLedger().supply();
  return (
    <div className="wrap page">
      <h1>Block not found</h1>
      <p className="body" style={{ marginTop: 12 }}>The ledger is at block {fmt(height)}.</p>
    </div>
  );
}
