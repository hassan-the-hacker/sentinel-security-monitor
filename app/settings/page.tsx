"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Database,
  Sliders,
  Bell,
  Save,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const SETTINGS_STORAGE_KEY = "sentinel_scanner_settings";

export default function SettingsPage() {
  const [scanTimeout, setScanTimeout] = useState("8000");
  const [maxRedirects, setMaxRedirects] = useState("5");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load saved settings on initial page mount so values persist across refreshes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.scanTimeout) setScanTimeout(String(parsed.scanTimeout));
        if (parsed.maxRedirects) setMaxRedirects(String(parsed.maxRedirects));
        if (parsed.emailAlerts !== undefined) setEmailAlerts(Boolean(parsed.emailAlerts));
      }
    } catch {
      // Keep default values if localStorage is unavailable
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        scanTimeout: Number(scanTimeout) || 8000,
        maxRedirects: Number(maxRedirects) || 5,
        emailAlerts,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      // Local storage fallback
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[90vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 mb-8 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-emerald-400" />
            Scanner & security settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure scan execution bounds, SSRF guard parameters, and Supabase database integrations.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Preferences saved successfully</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Scanner Engine Execution Bounds */}
        <Card glow="none" className="p-6 border-slate-800/80 bg-slate-900/60">
          <CardHeader>
            <CardTitle>
              <Sliders className="w-4 h-4 text-emerald-400" />
              Scanner engine execution limits
            </CardTitle>
            <CardDescription>
              Fine-tune network socket timeouts and redirect depth for passive HTTP and TLS checks.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Request Timeout (Milliseconds)
                </label>
                <Input
                  type="number"
                  min="2000"
                  max="15000"
                  value={scanTimeout}
                  onChange={(e) => setScanTimeout(e.target.value)}
                  className="text-xs"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Vercel serverless timeout limit is 10-15s. Default: 8000ms.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Max HTTP Redirect Hops
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={maxRedirects}
                  onChange={(e) => setMaxRedirects(e.target.value)}
                  className="text-xs"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Prevents infinite redirect loops and redirect SSRF. Default: 5.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />}>
                Save execution parameters
              </Button>
            </div>
          </form>
        </Card>

        {/* Database & Cloud Connectivity */}
        <Card glow="none" className="p-6 border-slate-800/80 bg-slate-900/60">
          <CardHeader>
            <CardTitle>
              <Database className="w-4 h-4 text-emerald-400" />
              Database & storage status
            </CardTitle>
            <CardDescription>
              Supabase PostgreSQL configuration with Row Level Security (RLS).
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Supabase PostgreSQL + RLS Ready
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Tables: <code className="text-slate-300">users</code>, <code className="text-slate-300">scans</code>, <code className="text-slate-300">scan_results</code>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>Migration instructions for Supabase free tier:</span>
              </div>
              <p className="leading-relaxed">
                SQL schema migrations are saved in <code className="text-slate-200 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[11px]">database/migrations/001_initial_schema.sql</code>. Copy and paste the script directly into the Supabase SQL Editor to initialize full schema and Row Level Security policies.
              </p>
            </div>
          </div>
        </Card>

        {/* Security Notification Preferences */}
        <Card glow="none" className="p-6 border-slate-800/80 bg-slate-900/60">
          <CardHeader>
            <CardTitle>
              <Bell className="w-4 h-4 text-amber-400" />
              Audit alert notifications
            </CardTitle>
            <CardDescription>
              Configure automated notifications when critical certificate expiration or SSL drops occur.
            </CardDescription>
          </CardHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div>
                <div className="text-xs font-medium text-slate-200">
                  Notify on SSL expiration warning (&lt; 30 days)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Surface critical notices when domain certificates require renewal.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => {
                  const updated = e.target.checked;
                  setEmailAlerts(updated);
                  try {
                    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
                    const parsed = saved ? JSON.parse(saved) : {};
                    parsed.emailAlerts = updated;
                    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed));
                  } catch {}
                }}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
