-- =========================================================================
-- SENTINEL - CYBERSECURITY HEALTH MONITOR
-- DATABASE INITIAL SCHEMA, INDEXES & ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
-- Execution: Copy and execute this script in Supabase Dashboard -> SQL Editor
-- Target: PostgreSQL 14+ / 15+ (Supabase Native)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
-- Tracks application user profiles synchronized automatically from auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. SCANS TABLE
-- Stores top-level website security posture audits per user
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    security_grade VARCHAR(4) NOT NULL CHECK (security_grade IN ('A+', 'A', 'B', 'C', 'D', 'F')),
    scan_status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (scan_status IN ('completed', 'failed', 'in_progress')),
    duration_ms INTEGER DEFAULT 0,
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. SCAN_RESULTS TABLE
-- Stores granular finding-level checks (SSL/TLS, Security Headers, DNS Anti-Spoofing, Ports)
CREATE TABLE IF NOT EXISTS public.scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL,
    check_name TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pass', 'fail', 'warning', 'info')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info', 'safe')),
    score_impact INTEGER DEFAULT 0,
    description TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    raw_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. INDEXES FOR PERFORMANCE & FAST AUDIT LOOKUPS
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_domain ON public.scans(domain);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_results_scan_id ON public.scan_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_severity ON public.scan_results(severity);
CREATE INDEX IF NOT EXISTS idx_scan_results_status ON public.scan_results(status);

-- 6. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- Guarantees complete tenant isolation at the database engine level
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES: USERS TABLE
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES: SCANS TABLE
-- Users can strictly READ, CREATE, and DELETE their own scans
-- (Scans are immutable audit records; updates are disbarred)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can read own scans" ON public.scans;
CREATE POLICY "Users can read own scans"
    ON public.scans
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can create own scans" ON public.scans;
CREATE POLICY "Users can create own scans"
    ON public.scans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own scans" ON public.scans;
CREATE POLICY "Users can delete own scans"
    ON public.scans
    FOR DELETE
    USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES: SCAN_RESULTS TABLE
-- Users can strictly READ, CREATE, and DELETE findings of scans they own
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own scan results" ON public.scan_results;
DROP POLICY IF EXISTS "Users can read own scan results" ON public.scan_results;
CREATE POLICY "Users can read own scan results"
    ON public.scan_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.scans
            WHERE public.scans.id = public.scan_results.scan_id
            AND public.scans.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own scan results" ON public.scan_results;
DROP POLICY IF EXISTS "Users can create own scan results" ON public.scan_results;
CREATE POLICY "Users can create own scan results"
    ON public.scan_results
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.scans
            WHERE public.scans.id = public.scan_results.scan_id
            AND public.scans.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own scan results" ON public.scan_results;
CREATE POLICY "Users can delete own scan results"
    ON public.scan_results
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.scans
            WHERE public.scans.id = public.scan_results.scan_id
            AND public.scans.user_id = auth.uid()
        )
    );

-- -------------------------------------------------------------
-- AUTOMATIC USER PROVISIONING TRIGGER (Sync auth.users -> public.users)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.created_at, TIMEZONE('utc'::text, NOW())))
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill any existing auth users who registered before this migration ran
INSERT INTO public.users (id, email, created_at)
SELECT id, email, COALESCE(created_at, TIMEZONE('utc'::text, NOW())) 
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email;
