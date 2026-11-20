-- =========================================================================
-- SENTINEL - CYBERSECURITY HEALTH MONITOR
-- DATABASE INITIAL SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
-- Tracks authenticated users synchronized from auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. SCANS TABLE
-- Stores top-level website scan results per user
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    security_grade VARCHAR(4) NOT NULL CHECK (security_grade IN ('A+', 'A', 'B', 'C', 'D', 'F')),
    scan_status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (scan_status IN ('completed', 'failed', 'in_progress')),
    duration_ms INTEGER DEFAULT 0,
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. SCAN_RESULTS TABLE
-- Stores detailed check-level findings for audits and security breakdowns
CREATE TABLE IF NOT EXISTS public.scan_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_domain ON public.scans(domain);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_results_scan_id ON public.scan_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_severity ON public.scan_results(severity);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
-- -------------------------------------------------------------

-- Users table policies: users can read their own profile
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Scans table policies: users can only view, insert, and delete their own scans
CREATE POLICY "Users can view own scans"
    ON public.scans
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
    ON public.scans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans"
    ON public.scans
    FOR DELETE
    USING (auth.uid() = user_id);

-- Scan results table policies: users can only view results of scans they own
CREATE POLICY "Users can view own scan results"
    ON public.scan_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.scans
            WHERE public.scans.id = public.scan_results.scan_id
            AND public.scans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own scan results"
    ON public.scan_results
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.scans
            WHERE public.scans.id = public.scan_results.scan_id
            AND public.scans.user_id = auth.uid()
        )
    );

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
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at)
    VALUES (NEW.id, NEW.email, NEW.created_at)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

