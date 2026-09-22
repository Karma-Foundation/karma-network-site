export default function TxNotFound() {
  return (
    <div className="wrap page">
      <h1>Transaction not found</h1>
      <p className="body" style={{ marginTop: 12 }}>No transfer or grant with this id is on the ledger.</p>
    </div>
  );
}
