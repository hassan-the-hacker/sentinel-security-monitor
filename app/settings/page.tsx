"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Database,
  Sliders,
  Bell,
  Terminal,
  Save,
  CheckCircle2,
  Key,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  const [scanTimeout, setScanTimeout] = useState("8000");
  const [maxRedirects, setMaxRedirects] = useState("5");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 cyber-grid min-h-[90vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 mb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-emerald-400" />
            Scanner & Security Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure scan execution bounds, SSRF guard parameters, and Supabase database integrations.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences Saved Successfully</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Scanner Engine Execution Bounds */}
        <Card glow="none" className="p-6">
          <CardHeader>
            <CardTitle>
              <Sliders className="w-4 h-4 text-emerald-400" />
              Scanner Engine Execution Limits
            </CardTitle>
            <CardDescription>
              Fine-tune network socket timeouts and redirect depth for passive HTTP and TLS checks.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Request Timeout (Milliseconds)
                </label>
                <Input
                  type="number"
                  min="2000"
                  max="15000"
                  value={scanTimeout}
                  onChange={(e) => setScanTimeout(e.target.value)}
                  className="font-mono text-xs"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Vercel serverless timeout limit is 10-15s. Default: 8000ms.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Max HTTP Redirect Hops
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={maxRedirects}
                  onChange={(e) => setMaxRedirects(e.target.value)}
                  className="font-mono text-xs"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Prevents infinite redirect loops and redirect SSRF. Default: 5.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />}>
                Save Execution Parameters
              </Button>
            </div>
          </form>
        </Card>

        {/* Database & Cloud Connectivity */}
        <Card glow="none" className="p-6">
          <CardHeader>
            <CardTitle>
              <Database className="w-4 h-4 text-cyan-400" />
              Database & Storage Status
            </CardTitle>
            <CardDescription>
              Supabase PostgreSQL configuration with Row Level Security (RLS).
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-slate-200 font-mono">
                    Supabase PostgreSQL + RLS Ready
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Tables: <code className="text-emerald-400">users</code>, <code className="text-cyan-400">scans</code>, <code className="text-purple-400">scan_results</code>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-100 border border-slate-800/80 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Migration Instructions for Supabase Free Tier:</span>
              </div>
              <p className="leading-relaxed">
                SQL schema migrations are saved in <code className="text-slate-200 bg-navy-950 px-1 py-0.5 rounded">database/migrations/001_initial_schema.sql</code>. Copy and paste the script directly into the Supabase SQL Editor to initialize full schema and Row Level Security policies.
              </p>
            </div>
          </div>
        </Card>

        {/* Security Notification Preferences */}
        <Card glow="none" className="p-6">
          <CardHeader>
            <CardTitle>
              <Bell className="w-4 h-4 text-amber-400" />
              Audit Alert Notifications
            </CardTitle>
            <CardDescription>
              Configure automated notifications when critical certificate expiration or SSL drops occur.
            </CardDescription>
          </CardHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100 border border-slate-800">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Notify on SSL Expiration Warning (&lt; 30 Days)
                </div>
                <div className="text-[11px] text-slate-400">
                  Surface critical notices when domain certificates require renewal.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-surface-200 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

