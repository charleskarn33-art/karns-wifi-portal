import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };

  try {
    const supabase = await createAdminClient();

    // Ping the payments table (count only — no data returned)
    const { count, error } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true });

    if (error) {
      checks.database = { ok: false, error: error.message, code: error.code };
    } else {
      checks.database = { ok: true, payments_count: count };
    }
  } catch (err) {
    checks.database = { ok: false, error: String(err) };
  }

  const allOk =
    Object.values(checks.env as Record<string, boolean>).every(Boolean) &&
    (checks.database as { ok: boolean }).ok;

  return NextResponse.json({ status: allOk ? "ok" : "degraded", ...checks }, {
    status: allOk ? 200 : 503,
  });
}
