import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sentinel | Cybersecurity Health Monitor",
  description: "Enterprise-grade passive cybersecurity posture assessment, SSL/TLS audit, security header analysis, and DNS hygiene monitoring.",
  keywords: ["cybersecurity", "security scanner", "SSL audit", "security headers", "DNSSEC", "SPF", "DMARC", "vulnerability monitor"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        <div className="relative min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

