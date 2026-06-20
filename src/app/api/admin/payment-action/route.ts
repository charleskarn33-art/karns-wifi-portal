import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/orange-sms";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { paymentId, action, notes } = await req.json();
    if (!paymentId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const adminSupabase = await createAdminClient();

    if (action === "approve") {
      const { data: rawPayment, error: paymentErr } = await adminSupabase
        .from("payments")
        .select("package_id, amount, customer_phone, customer_name, status")
        .eq("id", paymentId)
        .single();

      const payment = rawPayment as {
        package_id: string;
        amount: number;
        customer_phone: string;
        customer_name: string;
        status: string;
      } | null;

      if (paymentErr || !payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      if (payment.status !== "pending") {
        return NextResponse.json({ error: "Payment has already been processed." }, { status: 409 });
      }

      // Find a candidate available voucher
      const { data: rawVoucher, error: voucherErr } = await adminSupabase
        .from("vouchers")
        .select("id, code")
        .eq("package_id", payment.package_id)
        .eq("is_used", false)
        .is("payment_id", null)
        .limit(1)
        .single();

      const candidate = rawVoucher as { id: string; code: string } | null;

      if (voucherErr || !candidate) {
        return NextResponse.json(
          { error: "No available vouchers for this package. Please add more vouchers." },
          { status: 422 }
        );
      }

      const now = new Date().toISOString();

      // Atomically claim the voucher
      const { data: claimed, error: claimErr } = await adminSupabase
        .from("vouchers")
        .update({
          is_used: true,
          payment_id: paymentId,
          used_at: now,
          assigned_at: now,
          assigned_to_phone: payment.customer_phone,
        })
        .eq("id", candidate.id)
        .eq("is_used", false)
        .is("payment_id", null)
        .select("id, code")
        .single();

      if (claimErr || !claimed) {
        return NextResponse.json(
          { error: "Voucher was just assigned to another payment. Please try again." },
          { status: 409 }
        );
      }

      const voucher = claimed as { id: string; code: string };

      // Update payment to approved
      const { error: updateErr } = await adminSupabase
        .from("payments")
        .update({
          status: "approved",
          voucher_id: voucher.id,
          admin_notes: notes || null,
        })
        .eq("id", paymentId);

      if (updateErr) {
        console.error("payment-action: failed to update payment:", updateErr);
        // Roll back voucher claim
        await adminSupabase
          .from("vouchers")
          .update({ is_used: false, payment_id: null, used_at: null, assigned_at: null, assigned_to_phone: null })
          .eq("id", voucher.id);
        return NextResponse.json({ error: "Failed to update payment status." }, { status: 500 });
      }

      // Send SMS with voucher code
      const smsMessage =
        `Hello ${payment.customer_name}! Your Karn's WiFi voucher is ready.\n\n` +
        `Code: ${voucher.code}\n\n` +
        `Connect to Karn's WiFi and enter this code at the login page to get online.`;

      const smsResult = await sendSms(payment.customer_phone, smsMessage);

      // Store SMS result on payment
      await adminSupabase
        .from("payments")
        .update({
          sms_status: smsResult.ok ? "sent" : "failed",
          sms_message_id: smsResult.ok ? smsResult.messageId : null,
          sms_sent_at: smsResult.ok ? new Date().toISOString() : null,
          sms_error: smsResult.ok ? null : smsResult.error,
        })
        .eq("id", paymentId);

      // Write to sms_logs
      await adminSupabase.from("sms_logs").insert({
        payment_id: paymentId,
        phone: payment.customer_phone,
        message: smsMessage,
        status: smsResult.ok ? "sent" : "failed",
        message_id: smsResult.ok ? smsResult.messageId : null,
        error: smsResult.ok ? null : smsResult.error,
      });

      console.log(`[payment-action] SMS for payment ${paymentId}:`, smsResult);

      return NextResponse.json({
        success: true,
        voucherCode: voucher.code,
        sms: smsResult.ok
          ? { sent: true, messageId: smsResult.messageId }
          : { sent: false, error: smsResult.error },
      });
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
