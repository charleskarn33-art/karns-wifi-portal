import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify admin
    const { data: admin } = await supabase.from("admins").select("id").eq("user_id", user.id).single();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { paymentId, action, notes } = await req.json();
    if (!paymentId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const adminSupabase = await createAdminClient();

    if (action === "approve") {
      // Get payment to find package
      const { data: rawPayment, error: paymentErr } = await adminSupabase
        .from("payments")
        .select("package_id, amount")
        .eq("id", paymentId)
        .single();

      const payment = rawPayment as { package_id: string; amount: number } | null;

      if (paymentErr || !payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      // Find an available voucher for this package
      const { data: rawVoucher, error: voucherErr } = await adminSupabase
        .from("vouchers")
        .select("id, code")
        .eq("package_id", payment.package_id)
        .eq("is_used", false)
        .limit(1)
        .single();

      const voucher = rawVoucher as { id: string; code: string } | null;

      if (voucherErr || !voucher) {
        return NextResponse.json(
          { error: "No available vouchers for this package. Please add more vouchers." },
          { status: 422 }
        );
      }

      // Mark voucher as used
      await adminSupabase
        .from("vouchers")
        .update({ is_used: true, payment_id: paymentId, used_at: new Date().toISOString() })
        .eq("id", voucher.id);

      // Update payment status
      await adminSupabase
        .from("payments")
        .update({
          status: "approved",
          voucher_id: voucher.id,
          admin_notes: notes || null,
        })
        .eq("id", paymentId);

      return NextResponse.json({ success: true, voucherCode: voucher.code });
    } else {
      // Reject
      await adminSupabase
        .from("payments")
        .update({ status: "rejected", admin_notes: notes || null })
        .eq("id", paymentId);

      return NextResponse.json({ success: true });
    }
  } catch (err) {
    console.error("payment-action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
