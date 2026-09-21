import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Libre_Caslon_Text } from "next/font/google";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { currentHeight, isLive, showDummyBanner } from "@/lib/ledger";
import { BANNER_TEXT, LIVE_BANNER_TEXT } from "@/lib/site";
import "./globals.css";

const serif = Libre_Caslon_Text({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-serif", display: "swap" });
const sans = IBM_Plex_Sans({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Karma Network", template: "Karma Network - %s" },
  description:
    "The public record of the Karma protocol: the rules, the ledger, who controls what, and what changed. This site sells nothing.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Runs before first paint so a stored override never flashes the other theme.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const height = await currentHeight();
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Nav initialHeight={height} />
        {showDummyBanner() && (
          <div className="wrap banner">
            <div className="note" role="note">{isLive() ? LIVE_BANNER_TEXT : BANNER_TEXT}</div>
          </div>
        )}
        <main>{children}</main>
        <footer className="footer">
          <div className="wrap">
            <div className="about">
              <div className="brandline">Karma Network</div>
              <div>
                This site publishes information about the Karma protocol and its ledger. It does not sell, offer or promote any asset, and nothing on it is financial advice. Data is read from the ledger and refreshed every block.
              </div>
            </div>
            <div className="flinks">
              <Link href="/why">Why</Link>
              <Link href="/runners">Runners</Link>
              <Link href="/documents">Contact</Link>
              <Link href="/documents">Ledger API</Link>
              <Link href="/status">Status</Link>
              <ThemeToggle />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
