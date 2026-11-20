import React from "react";
import Link from "next/link";
import { ShieldCheck, Github, ExternalLink, Lock, Terminal, Activity } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-navy-950/90 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & Mission */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-wider text-slate-100">SENTINEL</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enterprise-grade passive cybersecurity health monitor providing actionable visibility into SSL/TLS, HTTP security headers, and DNS hygiene.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400/90">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>SECURE PASSIVE AUDIT ENGINE</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-3">Capabilities</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/scanner" className="hover:text-emerald-400 transition-colors">
                SSL / TLS Inspector
              </Link>
            </li>
            <li>
              <Link href="/scanner" className="hover:text-emerald-400 transition-colors">
                Security Headers Auditor
              </Link>
            </li>
            <li>
              <Link href="/scanner" className="hover:text-emerald-400 transition-colors">
                DNS, SPF & DMARC Validation
              </Link>
            </li>
            <li>
              <Link href="/scanner" className="hover:text-emerald-400 transition-colors">
                HTTPS Configuration Check
              </Link>
            </li>
            <li>
              <Link href="/reports" className="hover:text-emerald-400 transition-colors">
                PDF Executive Reports
              </Link>
            </li>
          </ul>
        </div>

        {/* Security & Compliance */}
        <div>
          <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-3">Safe & Responsible</h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Sentinel performs safe, non-invasive, passive security health checks. It strictly prohibits and rejects internal IP ranges, private subnets (SSRF protection), and aggressive exploitation.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Data Exfiltration</span>
          </div>
        </div>

        {/* Developer & Architecture */}
        <div>
          <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-3">Platform & Source</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="https://github.com/hassan-the-hacker"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </li>
            <li className="flex items-center gap-1.5 text-slate-400">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next.js 14 + Node.js Native</span>
            </li>
            <li className="flex items-center gap-1.5 text-slate-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase PostgreSQL + RLS</span>
            </li>
            <li className="text-[11px] text-slate-400 pt-1">
              Licensed under MIT License
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-800/60 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Sentinel Cybersecurity. Free & Open-Source Security Tool.</p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono text-[11px]">
          <span>RFC 1918 PROTECTED</span>
          <span>•</span>
          <span>100% PASSIVE SCANNING</span>
          <span>•</span>
          <span>ZERO EXTERNAL PAID APIS</span>
        </div>
      </div>
    </footer>
  );
}

