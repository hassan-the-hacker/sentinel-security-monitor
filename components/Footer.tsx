import React from "react";
import Link from "next/link";
import { ShieldCheck, Github, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & Mission */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-semibold text-base text-slate-100 tracking-tight">Sentinel</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Fast, non-invasive security auditing for SSL/TLS certificates, HTTP security headers, and domain DNS hygiene.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Product</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/scanner" className="hover:text-slate-200 transition-colors">
                Security scanner
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-slate-200 transition-colors">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/history" className="hover:text-slate-200 transition-colors">
                Scan history
              </Link>
            </li>
            <li>
              <Link href="/reports" className="hover:text-slate-200 transition-colors">
                PDF reports
              </Link>
            </li>
          </ul>
        </div>

        {/* Security & Compliance */}
        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Responsible use</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sentinel performs strictly passive, external health checks. Private network addresses (RFC 1918) and cloud metadata services are blocked by default.
          </p>
        </div>

        {/* Developer & Architecture */}
        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Source & Stack</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="https://github.com/hassan-the-hacker/sentinel-security-monitor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-slate-200 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub repository</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </li>
            <li className="text-slate-400">
              Built with Next.js 14 & Supabase
            </li>
            <li className="text-slate-500 text-[11px] pt-1">
              Open source under MIT License
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© {new Date().getFullYear()} Sentinel. Free & open-source security tool.</p>
        <p className="text-xs text-slate-500">Non-invasive • SSL/TLS • Security Headers • DNS</p>
      </div>
    </footer>
  );
}
