"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CompleteScanResult } from "@/types/scanner";
import { generateSecurityReportPdf } from "@/services/pdf-report-generator";
import { createClient } from "@/lib/supabase/client";

export default function ReportsPage() {
  const router = useRouter();
  const [scans, setScans] = useState<CompleteScanResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const supabase = createClient();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: dbScans, error } = await supabase
              .from("scans")
              .select("*")
              .order("created_at", { ascending: false });

            if (!error && dbScans && dbScans.length > 0) {
              const formatted: CompleteScanResult[] = (dbScans as any[])
                .map((s) => {
                  if (s.raw_payload) {
                    return { ...(s.raw_payload as CompleteScanResult), id: s.id };
                  }
                  return null;
                })
                .filter((s): s is CompleteScanResult => s !== null);

              if (formatted.length > 0) {
                setScans(formatted);
                setLoading(false);
                return;
              }
            }
          }
        }
      } catch {
        // Fallback
      }

      try {
        const historyStr = localStorage.getItem("sentinel_scan_history");
        if (historyStr) {
          setScans(JSON.parse(historyStr));
        } else {
          setScans([]);
        }
      } catch {
        setScans([]);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 cyber-grid min-h-[90vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 mb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-emerald-400" />
            Executive Security Reports Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Export publication-ready compliance audits and technical security posture documentation in PDF format.
          </p>
        </div>

        <Link href="/scanner">
          <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            New Security Audit
          </Button>
        </Link>
      </div>

      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-100 to-surface-200 border border-slate-800 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>EXECUTIVE AUDIT ENGINE (PDF)</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100">
            Confidential Technical Reports Ready for Leadership & Audits
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Reports aggregate cryptographic validation telemetry, full HTTP security headers matrices, SPF/DMARC anti-spoofing policies, and detailed remediation instructions with zero external paid APIs.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <span className="text-xs font-mono px-3 py-2 rounded-lg bg-navy-950 border border-slate-800 text-slate-300">
            Available Audits: <strong className="text-emerald-400">{scans.length}</strong>
          </span>
        </div>
      </div>

      {/* Reports Grid */}
      {scans.length === 0 ? (
        <div className="p-12 rounded-xl bg-surface-200 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No Audits Available for Export</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Run a passive security assessment on your website or API domain to generate an executive PDF report.
          </p>
          <div className="pt-2">
            <Link href="/scanner">
              <Button variant="primary" size="sm">
                Launch Security Scan
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scans.map((scan) => (
            <Card key={scan.id} glow="none" className="p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge grade={scan.grade} dot>
                    GRADE {scan.grade} ({scan.overallScore}/100)
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(scan.scannedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 font-mono tracking-tight truncate">
                  {scan.domain}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {scan.categories.ssl.summary}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div className="p-2 rounded bg-navy-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">SSL</div>
                    <div className="font-bold text-emerald-400 mt-0.5">
                      {scan.categories.ssl.score}/25
                    </div>
                  </div>
                  <div className="p-2 rounded bg-navy-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">HEADERS</div>
                    <div className="font-bold text-cyan-400 mt-0.5">
                      {scan.categories.headers.score}/30
                    </div>
                  </div>
                  <div className="p-2 rounded bg-navy-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">DNS</div>
                    <div className="font-bold text-purple-400 mt-0.5">
                      {scan.categories.dns.score}/25
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => generateSecurityReportPdf(scan)}
                  className="w-full text-xs"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download PDF
                </Button>
                <Link
                  href={`/scan/${scan.id}?domain=${encodeURIComponent(scan.domain)}`}
                  className="shrink-0"
                >
                  <Button variant="secondary" size="sm" className="text-xs">
                    View
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

