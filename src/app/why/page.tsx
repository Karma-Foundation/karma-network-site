import type { Metadata } from "next";
import { Crumb } from "@/components/ui";

export const metadata: Metadata = { title: "Why" };

// Placeholder by design. The body is Roy's to write (about 600 words); brackets mark what is open.
export default function Why() {
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/", label: "Home" }, { label: "Why" }]} />
      <div className="kicker">Why</div>
      <h1>Why the protocol exists</h1>
      <p className="muted mono f13" style={{ margin: "12px 0 32px" }}>[DATE]</p>
      <div className="prose">
        <p>[WHY - Roy to write]</p>
        <h2>Why the protocol exists</h2>
        <p>[WHY - Roy to write]</p>
        <h2>What it rewards</h2>
        <p>[WHY - Roy to write]</p>
        <h2>What it refuses to do</h2>
        <p>[WHY - Roy to write]</p>
        <p className="mono f14" style={{ marginTop: 40 }}>[SIGNED BY - name, name]</p>
      </div>
    </div>
  );
}
