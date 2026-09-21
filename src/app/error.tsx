"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="wrap page">
      <h1>The ledger did not answer</h1>
      <p className="body" style={{ margin: "12px 0 20px" }}>This page reads the ledger directly and the request failed or timed out. Nothing is shown rather than something stale.</p>
      <button type="button" className="btn" onClick={reset}>Try again</button>
    </div>
  );
}
