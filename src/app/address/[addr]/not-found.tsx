import { Crumb } from "@/components/ui";

export default function AddressNotFound() {
  return (
    <div className="wrap page">
      <Crumb items={[{ href: "/ledger/addresses", label: "Addresses" }, { label: "Not found" }]} />
      <h1>Address not found</h1>
      <p className="body" style={{ marginTop: 12 }}>No such address has appeared on the ledger.</p>
    </div>
  );
}
