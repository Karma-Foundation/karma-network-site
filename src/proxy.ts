import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

/*
 * Whole-site password gate (HTTP Basic auth), on whenever SITE_PASSWORD is set.
 *
 * The password lives ONLY in the host's environment. This repo is public, so it must never
 * be committed, not even as a hash. Any username is accepted; only the password is checked.
 * Basic auth was chosen over a login page because it needs no cookie and no client code, and
 * the browser sends it on same-origin fetches, so the block pill keeps working.
 *
 * Unset SITE_PASSWORD to open the site (local dev runs open by default).
 *
 * Review hosts: REVIEW_HOSTS is a comma-separated list of hostnames that skip the password,
 * for handing the site to reviewers (including browsing agents that cannot send a password)
 * without giving out the password. Each is a random, unlisted address; it is kept only in the
 * host's environment, never in this public repo, and removing it closes access at once. Every
 * response on a review host carries noindex, nofollow, which keeps it out of search results.
 * Its robots.txt ALLOWS everything: review agents obey robots.txt, and a Disallow would also
 * stop crawlers from ever seeing the noindex header.
 */

const digest = (s: string) => createHash("sha256").update(s).digest();

function passwordFrom(header: string | null): string | null {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const i = decoded.indexOf(":");
    return i < 0 ? null : decoded.slice(i + 1);
  } catch {
    return null;
  }
}

const reviewHosts = (): Set<string> =>
  new Set((process.env.REVIEW_HOSTS ?? "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean));

function requestHost(req: NextRequest): string {
  const raw = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  return raw.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
}

export function proxy(req: NextRequest) {
  if (reviewHosts().has(requestHost(req))) {
    if (req.nextUrl.pathname === "/robots.txt") {
      return new NextResponse("User-agent: *\nAllow: /\n", { headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow" } });
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return NextResponse.next();
  const given = passwordFrom(req.headers.get("authorization"));
  // Compare digests so the comparison is constant-time whatever the lengths.
  if (given !== null && timingSafeEqual(digest(given), digest(expected))) return NextResponse.next();
  return new NextResponse("Password required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Karma Network", charset="UTF-8"', "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

// Everything is gated except the hashed build assets, which hold no content.
export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
