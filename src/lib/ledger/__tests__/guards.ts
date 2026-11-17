/* Shared checks for the tests: no person is named in this repo, and no bracketed placeholder is on the site. */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/*
 * The first names and account handles of real people. The repo is public, so the words
 * themselves are not written here either: each entry is the SHA-256 of the lowercase word.
 * To add one:  printf '%s' theword | shasum -a 256
 */
const BANNED = new Set([
  "a59b1da0739609cfd823420304bebb268693eade4ff3e1269fce24548c301240",
  "1323f7a05a2b6b4d4fc2a2cc9ef4e35168d641c78b4435d10aa5437db90f2fb9",
  "766a5ad0a3494a7f2089692e368ac32f974ab0995a32ba605c64148de06f6a05",
  "e780a93378e33cbbd5a90d6fde258a3fc1ad8d9dd7b83bb14b37ddea054cee18",
  "d7b8988f8fd2edbd7c5a63ff60009a39f9cc9546f2ca1a5e8eafea8e2f2fa97b",
  "a7d84a49c39b439be782bf173669c932c43072f8a56e7a16099a012ec3fbccce",
  "9dda0eb6efef3ca6bbaad32e31d2a80df542953911797b9d3291b8c974f46df5",
  "12b583025af1f2e0d75ee9f093008b2316e8aea6618f481d27cb11a38fe1193a",
]);

/** The banned words found in a text. Empty when it is clean. */
export function personNames(text: string): string[] {
  const words = new Set((text.match(/[A-Za-z]+/g) ?? []).map((w) => w.toLowerCase()));
  return [...words].filter((w) => BANNED.has(createHash("sha256").update(w).digest("hex")));
}

/** Bracketed placeholders such as an upper-case word in square brackets. Empty when there is none. */
export function placeholders(text: string): string[] {
  return text.match(/\[[A-Z][A-Za-z ,\-]*\]/g) ?? [];
}

export const REPO = join(__dirname, "../../../..");
const SKIP = new Set(["node_modules", ".next", ".git", "package-lock.json"]);

/** Every text file under a folder or file path, relative to the repo root. */
export function textFiles(rel: string, opts: { tests?: boolean } = {}): string[] {
  const walk = (p: string): string[] => {
    let entries;
    try { entries = readdirSync(p, { withFileTypes: true }); } catch { return [p]; }
    return entries.flatMap((e) => {
      if (SKIP.has(e.name) || (!opts.tests && e.name === "__tests__")) return [];
      const child = join(p, e.name);
      if (e.isDirectory()) return walk(child);
      return /\.(tsx?|css|md|html|json|mjs)$/.test(e.name) ? [child] : [];
    });
  };
  return walk(join(REPO, rel));
}

export const read = (file: string): string => readFileSync(file, "utf8");
