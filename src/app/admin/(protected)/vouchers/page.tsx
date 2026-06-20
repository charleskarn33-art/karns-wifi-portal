import { createClient } from "@/lib/supabase/server";
import { VouchersManager } from "@/components/admin/VouchersManager";

export default async function VouchersPage() {
  const supabase = await createClient();

  const [vouchersResult, packagesResult] = await Promise.all([
    supabase
      .from("vouchers")
      .select("*, packages(name)")
      .order("created_at", { ascending: false }),
    supabase.from("packages").select("*").eq("is_active", true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vouchers</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your WiFi voucher inventory</p>
      </div>
      <VouchersManager
        vouchers={vouchersResult.data ?? []}
        packages={packagesResult.data ?? []}
      />
    </div>
  );
}
