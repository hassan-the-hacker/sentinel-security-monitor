"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!agreedTerms) {
      setError("You must agree to the Responsible Security Assessment policy.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError(
          "Supabase database connection is not configured. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables."
        );
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        setError("Registration could not be completed. Please try again.");
        setLoading(false);
        return;
      }

      // If Supabase has email confirmation enabled, session is null until confirmed
      if (!authData.session) {
        setConfirmationRequired(true);
        setSuccess(true);
        setLoading(false);
        return;
      }

      setSuccess(true);
      localStorage.setItem(
        "sentinel_user",
        JSON.stringify({
          email: authData.user.email || email,
          role: "SecOps Lead",
          id: authData.user.id,
        })
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 cyber-grid">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-wider text-slate-100">SENTINEL</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">Create Security Account</h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Register to save audit history and generate executive compliance reports
          </p>
        </div>

        <Card glow="none" className="p-6">
          {success ? (
            confirmationRequired ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Check Your Email</h3>
                <p className="text-xs text-slate-400">
                  A confirmation email was sent to <strong className="text-slate-200">{email}</strong>. Please confirm your email address, then{" "}
                  <Link href="/login" className="text-emerald-400 underline font-semibold">
                    sign in to your console
                  </Link>.
                </p>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Account Created Successfully</h3>
                <p className="text-xs text-slate-400">
                  Directing you into your Sentinel Cybersecurity Console...
                </p>
              </div>
            )
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
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
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password (min. 8 characters)
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-emerald-400 focus:outline-none transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="p-1 text-slate-400 hover:text-emerald-400 focus:outline-none transition-colors"
                      title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-navy-950 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-slate-400 cursor-pointer select-none leading-tight">
                  I agree to the <span className="text-emerald-400">Responsible Disclosure & Assessment Policy</span>. I agree to only scan web properties I own or have legal authorization to evaluate.
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full mt-2 font-semibold"
              >
                Create SecOps Account
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-400 hover:text-emerald-300 ml-1 underline underline-offset-4"
            >
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

