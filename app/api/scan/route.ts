import { NextRequest, NextResponse } from "next/server";
import { executeSecurityScan, SSRFSecurityException } from "@/services/scanner";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { domain, authorized } = body;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "Invalid target: Domain parameter is required." },
        { status: 400 }
      );
    }

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "Authorization required: You must explicitly confirm authorization before scanning target domains.",
        },
        { status: 403 }
      );
    }

    // Execute scan
    const scanResult = await executeSecurityScan(domain);

    // Attempt to persist to Supabase if user is authenticated and Supabase is configured
    try {
      const supabase = createServerSupabaseClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.id) {
          // Ensure user record exists in public.users to satisfy foreign key
          await (supabase as any).from("users").upsert(
            {
              id: user.id,
              email: user.email || `${user.id}@sentinel.local`,
            },
            { onConflict: "id" }
          );

          // 1. Insert scan record
          const { data: scanRow, error: scanInsertError } = await (supabase as any)
            .from("scans")
            .insert({
              user_id: user.id,
              domain: scanResult.domain,
              overall_score: scanResult.overallScore,
              security_grade: scanResult.grade,
              scan_status: "completed",
              duration_ms: scanResult.durationMs,
              raw_payload: scanResult,
            })
            .select()
            .single();

          if (scanRow && !scanInsertError) {
            // 2. Insert scan findings into scan_results
            const findingsToInsert = scanResult.findings.map((f) => ({
              scan_id: scanRow.id,
              category: f.category,
              check_name: f.checkName,
              status: f.status,
              severity: f.severity,
              score_impact: f.scoreImpact,
              description: f.description,
              recommendation: f.recommendation,
              raw_result: f.rawDetails ? JSON.parse(JSON.stringify(f.rawDetails)) : null,
            }));

            if (findingsToInsert.length > 0) {
              await (supabase as any).from("scan_results").insert(findingsToInsert);
            }

            // Sync generated database ID with scanResult
            scanResult.id = scanRow.id;
          }
        }
      }
    } catch {
      // Supabase insertion is non-blocking to ensure scan results are always returned to the user
    }

    return NextResponse.json(scanResult, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof SSRFSecurityException) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    const errorMessage = err instanceof Error ? err.message : "Internal Scanner Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

