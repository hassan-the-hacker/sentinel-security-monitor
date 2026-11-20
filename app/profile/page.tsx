"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  ShieldCheck,
  Key,
  LogOut,
  Mail,
  Calendar,
  Lock,
  Radar,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CompleteScanResult } from "@/types/scanner";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; role: string; id: string } | null>(null);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    async function initProfile() {
      // 1. Initial local fallback
      try {
        const stored = localStorage.getItem("sentinel_user");
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser({
            email: "analyst@sentinel.sec",
            role: "Lead Cybersecurity Engineer",
            id: "usr_786sec",
          });
        }

        const historyStr = localStorage.getItem("sentinel_scan_history");
        if (historyStr) {
          const history: CompleteScanResult[] = JSON.parse(historyStr);
          setScanCount(history.length);
        }
      } catch {
        setUser({
          email: "analyst@sentinel.sec",
          role: "Lead Cybersecurity Engineer",
          id: "usr_786sec",
        });
      }

      // 2. Fetch live data from Supabase if connected
      try {
        const supabase = createClient();
        if (supabase) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            setUser({
              email: authUser.email || "analyst@sentinel.sec",
              role: "Lead Cybersecurity Engineer",
              id: authUser.id,
            });

            const { count } = await supabase
              .from("scans")
              .select("*", { count: "exact", head: true });

            if (count !== null && count !== undefined) {
              setScanCount(count);
            }
          }
        }
      } catch {
        // Fallback intact
      }
    }

    initProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // non-fatal
    }
    localStorage.removeItem("sentinel_user");
    localStorage.removeItem("sentinel_token");
    window.location.href = "/login";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[90vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 mb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight flex items-center gap-2.5">
            <User className="w-7 h-7 text-emerald-400" />
            Security Operator Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your authenticated session, role entitlements, and audit activity.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={handleLogout}
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
        >
          Sign Out
        </Button>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card glow="none" className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-2xl font-mono shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100 font-mono">
                  {user?.email || "analyst@sentinel.sec"}
                </h3>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] font-mono">
                  VERIFIED OPERATOR
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Role: <span className="text-slate-200">{user?.role || "Security Analyst"}</span> • Operator ID: <span className="text-slate-200">{user?.id || "usr_786"}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
            <div className="p-3.5 rounded-lg bg-surface-100 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400">Total Audits Run</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {scanCount}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-100 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400">Auth Method</div>
              <div className="text-sm font-bold font-mono text-slate-200 mt-2">
                Supabase JWT
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-100 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400">Permissions Level</div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-2">
                SecOps Administrator
              </div>
            </div>
          </div>
        </Card>

        {/* Security Assessment Quota */}
        <Card glow="none" className="p-6">
          <CardHeader>
            <CardTitle>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Scanning Authorization & Compliance Status
            </CardTitle>
            <CardDescription>
              Status of your active legal scanning authorization agreement.
            </CardDescription>
          </CardHeader>

          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Responsible Disclosure & Passive Scanning Agreement: ACCEPTED</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your account is authorized to trigger non-invasive, passive external security scans. All scans are automatically filtered through Sentinel&apos;s SSRF Guard to block private internal networks (RFC 1918) and cloud metadata services.
            </p>
          </div>
        </Card>

        {/* Quick Shortcuts */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-surface-200 border border-slate-800 gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
            <Radar className="w-4 h-4 text-emerald-400" />
            <span>Ready to conduct another security inspection?</span>
          </div>
          <Link href="/scanner">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Scanner
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

