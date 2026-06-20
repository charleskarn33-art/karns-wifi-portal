export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";

async function runChecks() {
  const results: {
    env: Record<string, boolean>;
    db: { ok: boolean; error?: string; payments_count?: number | null };
    insertTest: { ok: boolean; error?: string; id?: string };
  } = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    db: { ok: false },
    insertTest: { ok: false },
  };

  try {
    const supabase = await createAdminClient();

    const { count, error: countErr } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true });

    if (countErr) {
      results.db = { ok: false, error: countErr.message };
    } else {
      results.db = { ok: true, payments_count: count };
    }

    // Test insert then immediately delete
    const { data: inserted, error: insertErr } = await supabase
      .from("payments")
      .insert({
        package_id: "00000000-0000-0000-0000-000000000000",
        customer_name: "__debug_test__",
        customer_phone: "0000000000",
        transaction_id: `DEBUG-${Date.now()}`,
        amount: 0,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertErr) {
      results.insertTest = { ok: false, error: insertErr.message };
    } else {
      const id = (inserted as { id: string }).id;
      await supabase.from("payments").delete().eq("id", id);
      results.insertTest = { ok: true, id };
    }
  } catch (err) {
    results.db = { ok: false, error: String(err) };
  }

  return results;
}

export default async function DebugPage() {
  const checks = await runChecks();
  const allGreen =
    Object.values(checks.env).every(Boolean) && checks.db.ok && checks.insertTest.ok;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-mono text-sm">
      <h1 className="text-xl font-bold mb-6">
        System Debug{" "}
        <span className={allGreen ? "text-green-600" : "text-red-600"}>
          {allGreen ? "✓ All OK" : "✗ Issues detected"}
        </span>
      </h1>

      <section className="mb-8">
        <h2 className="font-semibold text-gray-700 mb-2">Environment Variables</h2>
        <table className="w-full max-w-lg border border-gray-200 rounded bg-white">
          <tbody>
            {Object.entries(checks.env).map(([key, present]) => (
              <tr key={key} className="border-b border-gray-100">
                <td className="px-3 py-2 text-gray-600">{key}</td>
                <td className={`px-3 py-2 font-semibold ${present ? "text-green-600" : "text-red-600"}`}>
                  {present ? "✓ set" : "✗ MISSING"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-gray-700 mb-2">Database Connection</h2>
        <div className={`inline-block px-3 py-2 rounded border ${checks.db.ok ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"}`}>
          {checks.db.ok
            ? `✓ Connected — ${checks.db.payments_count} payment rows`
            : `✗ ${checks.db.error}`}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-gray-700 mb-2">Insert Test (auto-deleted)</h2>
        <div className={`inline-block px-3 py-2 rounded border ${checks.insertTest.ok ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"}`}>
          {checks.insertTest.ok
            ? `✓ Insert succeeded (id: ${checks.insertTest.id})`
            : `✗ ${checks.insertTest.error}`}
        </div>
        {!checks.insertTest.ok && checks.insertTest.error?.includes("package_id") && (
          <p className="text-yellow-700 mt-2 text-xs">
            Note: insert test uses a fake package_id. If FK constraint fails that&apos;s expected — the DB connection itself is fine.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-gray-700 mb-2">API Health</h2>
        <a
          href="/api/health"
          target="_blank"
          className="text-blue-600 underline"
        >
          /api/health (opens in new tab)
        </a>
      </section>
    </div>
  );
}
