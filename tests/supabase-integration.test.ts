import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import * as fs from "fs";
import * as path from "path";

describe("Supabase Integration & Safety", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("safely handles unconfigured environment variables without crashing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const browserClient = createClient();
    expect(browserClient).toBeNull();
  });

  it("safely rejects dummy placeholder URLs from .env.example", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-project-id.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-supabase-anon-publishable-key-here";

    const browserClient = createClient();
    expect(browserClient).toBeNull();
  });

  it("initializes client when valid credentials are provided", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcdefghijklm.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "valid-test-anon-key";

    const browserClient = createClient();
    expect(browserClient).not.toBeNull();
  });

  it("supports NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as alias for anon key", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcdefghijklm.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "valid-test-publishable-key";

    const browserClient = createClient();
    expect(browserClient).not.toBeNull();
  });

  describe("SQL Migration File (001_initial_schema.sql)", () => {
    const migrationPath = path.resolve(__dirname, "../database/migrations/001_initial_schema.sql");
    const sqlContent = fs.readFileSync(migrationPath, "utf-8");

    it("creates required tables: users, scans, scan_results", () => {
      expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS public.users");
      expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS public.scans");
      expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS public.scan_results");
    });

    it("configures foreign keys with CASCADE delete", () => {
      expect(sqlContent).toContain("REFERENCES auth.users(id) ON DELETE CASCADE");
      expect(sqlContent).toContain("REFERENCES public.users(id) ON DELETE CASCADE");
      expect(sqlContent).toContain("REFERENCES public.scans(id) ON DELETE CASCADE");
    });

    it("enables Row Level Security (RLS) on all tables", () => {
      expect(sqlContent).toContain("ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;");
      expect(sqlContent).toContain("ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;");
      expect(sqlContent).toContain("ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;");
    });

    it("enforces RLS policies for user isolation on scans (read, create, delete)", () => {
      expect(sqlContent).toContain("CREATE POLICY \"Users can read own scans\"");
      expect(sqlContent).toContain("CREATE POLICY \"Users can create own scans\"");
      expect(sqlContent).toContain("CREATE POLICY \"Users can delete own scans\"");
      expect(sqlContent).toContain("USING (auth.uid() = user_id)");
      expect(sqlContent).toContain("WITH CHECK (auth.uid() = user_id)");
    });

    it("enforces RLS policies for user isolation on scan_results", () => {
      expect(sqlContent).toContain("CREATE POLICY \"Users can read own scan results\"");
      expect(sqlContent).toContain("CREATE POLICY \"Users can create own scan results\"");
      expect(sqlContent).toContain("CREATE POLICY \"Users can delete own scan results\"");
    });

    it("creates performance indexes on foreign keys, domains, dates, and severity", () => {
      expect(sqlContent).toContain("CREATE INDEX IF NOT EXISTS idx_scans_user_id");
      expect(sqlContent).toContain("CREATE INDEX IF NOT EXISTS idx_scans_domain");
      expect(sqlContent).toContain("CREATE INDEX IF NOT EXISTS idx_scans_created_at");
      expect(sqlContent).toContain("CREATE INDEX IF NOT EXISTS idx_scan_results_scan_id");
      expect(sqlContent).toContain("CREATE INDEX IF NOT EXISTS idx_scan_results_severity");
    });

    it("includes automatic user provisioning trigger from auth.users", () => {
      expect(sqlContent).toContain("CREATE OR REPLACE FUNCTION public.handle_new_user()");
      expect(sqlContent).toContain("CREATE TRIGGER on_auth_user_created");
      expect(sqlContent).toContain("SECURITY DEFINER");
    });
  });
});

