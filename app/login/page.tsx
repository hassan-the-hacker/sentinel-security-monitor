"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      if (supabase) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          // If Supabase authentication fails, inform the user
          setError(authError.message);
          setLoading(false);
          return;
        }
      }

      // Store local session for UI persistence and offline/demo support
      localStorage.setItem(
        "sentinel_user",
        JSON.stringify({
          email: email || "analyst@sentinel.sec",
          role: "SecOps Lead",
          id: "usr_" + Math.random().toString(36).substring(2, 9),
        })
      );

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail("analyst@sentinel.sec");
    setPassword("SentinelSec#2025");
    setDemoNotice(true);
    // Instant login for evaluation convenience
    localStorage.setItem(
      "sentinel_user",
      JSON.stringify({
        email: "analyst@sentinel.sec",
        role: "SecOps Lead",
        id: "usr_demo_recruiter_preview",
      })
    );
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 cyber-grid">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-wider text-slate-100">SENTINEL</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">Sign In to Console</h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Access real-time security posture telemetry and scan history
          </p>
        </div>

        {/* Demo Fast-Track Card */}
        <div className="mb-6 p-3.5 rounded-xl bg-surface-100 border border-emerald-500/30 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono">
              <KeyRound className="w-3.5 h-3.5" />
              <span>RECRUITER & AUDITOR PREVIEW</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              1-CLICK
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-2.5">
            Quickly authenticate as a Lead Security Analyst to explore the full dashboard and scanning engine.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDemoLogin}
            className="w-full text-xs font-mono justify-center"
          >
            Launch Instant SecOps Session
          </Button>
          {demoNotice && (
            <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3" /> Initializing session... redirecting
            </p>
          )}
        </div>

        {/* Form Card */}
        <Card glow="none" className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <Input
                type="email"
                required
                placeholder="analyst@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <Link
                  href="/register"
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full mt-2 font-semibold"
            >
              Sign In to Console
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-medium text-emerald-400 hover:text-emerald-300 ml-1 underline underline-offset-4"
            >
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

