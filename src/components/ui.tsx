import Link from "next/link";
import { K, ago, dateStr, fmt, pct, short, shortTx } from "@/lib/format";
import { getLedger } from "@/lib/ledger";
import type { Address, ProtocolWallet, Runner, Signer, Supply, Tx, Upgrade } from "@/lib/ledger";
import { BLOCK_MINUTES, HALVING, HALVING_YEARS_TEXT, MAX_SUPPLY, PER_BLOCK, SHARE_PCT, SPEC_VERSION } from "@/lib/ledger/rules";

export const UPTIME = "99.94%";

export const Dash = () => <span className="muted">-</span>;

export function Crumb({ items }: { items: { href?: string; label: React.ReactNode }[] }) {
  return (
    <div className="crumb">
      {items.map((it, i) => (
        <span key={i} style={{ display: "contents" }}>
          {i > 0 && <span>/</span>}
          {it.href ? <Link href={it.href}>{it.label}</Link> : <span>{it.label}</span>}
        </span>
      ))}
    </div>
  );
}

export function Tabs({ items, on }: { items: { id: string; href: string; label: string }[]; on: string }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((i) => (
        <Link key={i.id} className={`chip${i.id === on ? " on" : ""}`} href={i.href} aria-current={i.id === on ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export function LedgerTabs({ on }: { on: "blocks" | "tx" | "addr" }) {
  return (
    <div style={{ margin: "16px 0 20px" }}>
      <Tabs
        on={on}
        items={[
          { id: "blocks", href: "/ledger/blocks", label: "Blocks" },
          { id: "tx", href: "/ledger/transactions", label: "Transactions" },
          { id: "addr", href: "/ledger/addresses", label: "Addresses" },
        ]}
      />
    </div>
  );
}

export function Pager({ href, page, total, per, shown }: { href: (p: number) => string; page: number; total: number; per: number; shown: number }) {
  const pages = Math.max(1, Math.ceil(total / per));
  return (
    <div className="pager">
      <div>
        Showing {fmt(shown)} of {fmt(total)} · page {fmt(page)} of {fmt(pages)}
      </div>
      <div className="pb">
        {page > 1 && <Link className="chip" href={href(page - 1)}>Newer</Link>}
        {page < pages && <Link className="chip" href={href(page + 1)}>Older</Link>}
      </div>
    </div>
  );
}

export function Stats({ supply, runners }: { supply: Supply; runners: Runner[] }) {
  return (
    <div className="stats">
      <div className="stat"><div className="l">Block height</div><div className="v">{fmt(supply.height)}</div><div className="s">last block {ago(supply.lastBlockTime)}</div></div>
      <div className="stat"><div className="l">Issued</div><div className="v">{K(supply.issued)}</div><div className="s">{pct(supply.issued, MAX_SUPPLY)} of max supply</div></div>
      <div className="stat"><div className="l">Max supply</div><div className="v">{K(MAX_SUPPLY)}</div><div className="s">fixed, no minting</div></div>
      <div className="stat"><div className="l">Holding addresses</div><div className="v">{fmt(supply.holders)}</div><div className="s">balance above 0</div></div>
      <div className="stat"><div className="l">Protocol runners</div><div className="v">{runners.length}</div><div className="s">{runners.filter((r) => r.independent).length} independent operators</div></div>
      <div className="stat"><div className="l">Genesis</div><div className="v">{dateStr(supply.genesis)}</div><div className="s">uptime {UPTIME}</div></div>
    </div>
  );
}

export function AddrLink({ addr, labels, full }: { addr: string; labels: Record<string, string>; full?: boolean }) {
  const label = labels[addr];
  return (
    <>
      <Link className="mono" href={`/address/${addr}`}>{full ? addr : short(addr)}</Link>
      {label && <> <span className="muted small">{label}</span></>}
    </>
  );
}

export function HoldersTable({ list, issued }: { list: Address[]; issued: number }) {
  return (
    <div className="tw">
      <table>
        <thead>
          <tr><th>#</th><th>Address</th><th>Label</th><th className="right">Balance</th><th className="right">of issued</th><th className="right">of max</th></tr>
        </thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.addr}>
              <td className="muted">{a.rank}</td>
              <td><Link className="mono" href={`/address/${a.addr}`}>{short(a.addr)}</Link></td>
              <td>
                {a.label ? a.label : <Dash />}
                {a.tag && <> <span className={`tag${a.kind === "third" ? " gray" : ""}`}>{a.tag}</span></>}
              </td>
              <td className="right mono">{K(a.balance)}</td>
              <td className="right mono">{pct(a.balance, issued)}</td>
              <td className="right mono">{pct(a.balance, MAX_SUPPLY, 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function TxTable({ list, memo = true }: { list: Tx[]; memo?: boolean }) {
  if (!list.length) return <div className="empty">No transactions.</div>;
  const labels = await getLedger().labels([...new Set(list.flatMap((t) => [t.from, t.to]).filter(Boolean))]);
  return (
    <div className="tw">
      <table>
        <thead>
          <tr><th>Tx</th><th>Block</th><th>Time</th><th>Type</th><th>From</th><th>To</th><th className="right">Amount</th>{memo && <th>Memo</th>}</tr>
        </thead>
        <tbody>
          {list.map((t) => (
            <tr key={t.id}>
              <td>{t.type === "Issuance" ? <span className="mono muted">issuance</span> : <Link className="mono" href={`/tx/${t.id}`}>{shortTx(t.id)}</Link>}</td>
              <td><Link className="mono" href={`/block/${t.block}`}>{fmt(t.block)}</Link></td>
              <td className="mono muted">{ago(t.time)}</td>
              <td>{t.type}</td>
              <td>{t.from ? <AddrLink addr={t.from} labels={labels} /> : <span className="muted">protocol</span>}</td>
              <td>{t.to ? <AddrLink addr={t.to} labels={labels} /> : <Dash />}</td>
              <td className="right mono">{t.amount ? K(t.amount) : "-"}</td>
              {memo && (
                <td className="wrap-ok">
                  {t.memo}
                  {t.signed && <> <span className="muted mono small">{t.signed}</span></>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SignersTable({ list }: { list: Signer[] }) {
  return (
    <div className="tw">
      <table>
        <thead>
          <tr><th>#</th><th>Signer</th><th>Public key</th><th>Since</th><th>Term ends</th></tr>
        </thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.n}>
              <td className="mono muted">{s.n}</td>
              <td className="wrap-ok"><div className={s.open ? "amber" : undefined}>{s.name}</div><div className="muted small">{s.role}</div></td>
              <td className="mono">{s.key}</td>
              <td className="mono muted">{s.since}</td>
              <td className="mono muted">{s.ends}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ShareBars() {
  const rows: [string, number, string][] = [
    ["Builders (Kreators + Stakers)", SHARE_PCT.builders, ""],
    ["Foundation", SHARE_PCT.foundation, "acc"],
    ["Tech Builders", SHARE_PCT.tech, "acc"],
    ["Validators (Runners)", SHARE_PCT.validators, ""],
  ];
  return (
    <div className="list">
      {rows.map(([name, p, cls]) => (
        <div key={name} className="sharebar mono">
          <div className="n">{name}</div>
          <div>{p}%</div>
          <div className="bar"><i className={cls || undefined} style={{ width: `${p}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export function WalletCard({ w }: { w: ProtocolWallet }) {
  return (
    <div className="panel col">
      <div className="panel-h">
        <div>
          <h3>{w.address.label}</h3>
          <div className="mono muted small">{short(w.address.addr)} · receives {w.sharePct}% of issuance</div>
        </div>
        <span className="tag">{w.threshold} signatures</span>
      </div>
      <div className="panel-b list f14">
        {w.signers.map((s) => (
          <div key={s.n} className="signer-row">
            <span className="mono muted">{s.n}</span>
            <span className={s.open ? "amber" : undefined}>{s.name}{s.open ? "" : ` - ${s.role}`}</span>
            <span className="mono muted small">{s.open ? "seat open" : s.since}</span>
          </div>
        ))}
      </div>
      <div className="panel-b f14 col" style={{ borderTop: "1px solid var(--line)", gap: 6 }}>
        <div><b className="fw5">Purpose:</b> {w.purpose}</div>
        <div><b className="fw5">Policy:</b> {w.policy}</div>
        <Link href={`/address/${w.address.addr}`} className="fw5">Wallet page: balance, signers, every transaction →</Link>
      </div>
    </div>
  );
}

export function UpgradeTable({ list }: { list: Upgrade[] }) {
  return (
    <div className="tw">
      <table>
        <thead>
          <tr><th>Version</th><th>Adopted</th><th>Change</th><th>Signed</th><th>Status</th></tr>
        </thead>
        <tbody>
          {list.map((u) => (
            <tr key={u.v}>
              <td><Link className="mono" href={`/governance/${u.v}`}>{u.v}</Link></td>
              <td className="mono muted">{u.block ? `blk ${fmt(u.block)}` : "-"}</td>
              <td className="wrap-ok">{u.title}</td>
              <td className="mono muted">{u.signed}</td>
              <td className={u.status === "Active" ? "green" : "amber"}>{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocCards({ specTitle }: { specTitle?: string } = {}) {
  const d: [string, string, string][] = [
    [specTitle ?? `Protocol specification ${SPEC_VERSION}`, "Issuance schedule, distribution, reward formula, signature scheme", "/protocol"],
    ["Source code", "Protocol node, open repository, release tags per version", "/documents"],
    ["Whitepaper", "The protocol, its economics, its limits and the questions still open", "/whitepaper"],
    ["Why", "Why the protocol exists, what it rewards, what it refuses to do", "/why"],
    ["Governance framework", "Elections, recall, upgrade process, signer duties", "/governance"],
    ["Run a node", "Requirements, setup, current runner list", "/runners"],
  ];
  return (
    <div className="grid2">
      {d.map(([t, desc, href]) => (
        <Link key={t} className="card" href={href}><div className="t">{t}</div><div className="d">{desc}</div></Link>
      ))}
      <div className="card">
        <div className="t" style={{ display: "flex", gap: 8, alignItems: "center" }}>Security audit <span className="tag amber">not yet</span></div>
        <div className="d">No third-party audit has been completed. Status here will change when one is commissioned.</div>
      </div>
    </div>
  );
}

export function Numbered({ items }: { items: string[] }) {
  return (
    <>
      {items.map((t, i) => (
        <div key={i} className="numbered"><span className="mono muted">{i + 1}</span><span>{t}</span></div>
      ))}
    </>
  );
}

/** Rule text shared by the home and protocol pages, built from rules.ts. */
export const RULE_TEXT = {
  maxSupply: `${K(MAX_SUPPLY)}. Fixed at genesis. No function in the protocol can create more.`,
  blockTime: `${BLOCK_MINUTES} minutes`,
  issuance: `${PER_BLOCK} к per block, halving every ${fmt(HALVING)} blocks (${HALVING_YEARS_TEXT}).`,
};
