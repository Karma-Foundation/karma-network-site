import type { MetadataRoute } from "next";

// This site is meant to be public and indexed. Do not copy the wallet's noindex.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" } };
}
