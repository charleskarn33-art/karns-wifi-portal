import { createClient } from "@/lib/supabase/server";
import { PaymentsTable } from "@/components/admin/PaymentsTable";

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const { status, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("payments")
    .select("*, packages(name, duration_hours)")
    .order("created_at", { ascending: false });

  if (status && ["pending", "approved", "rejected"].includes(status)) {
    query = query.eq("status", status as "pending" | "approved" | "rejected");
  }
  if (q) {
    query = query.or(
      `customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,transaction_id.ilike.%${q}%`
    );
  }

  const { data: payments } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve customer payments</p>
      </div>
      <PaymentsTable payments={payments ?? []} currentStatus={status} />
    </div>
  );
}
