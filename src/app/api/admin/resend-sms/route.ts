import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
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

    const { paymentId } = await req.json();
    if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });

    const adminSupabase = await createAdminClient();

    // Fetch payment + voucher code
    const { data: raw, error } = await adminSupabase
      .from("payments")
      .select("customer_name, customer_phone, status, vouchers(code)")
      .eq("id", paymentId)
      .single();

    const payment = raw as {
      customer_name: string;
      customer_phone: string;
      status: string;
      vouchers: { code: string } | null;
    } | null;

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status !== "approved" || !payment.vouchers?.code) {
      return NextResponse.json(
        { error: "Payment is not approved or has no voucher assigned" },
        { status: 422 }
      );
    }

    const smsMessage =
      `Hello ${payment.customer_name}! Your Karn's WiFi voucher is ready.\n\n` +
      `Code: ${payment.vouchers.code}\n\n` +
      `Connect to Karn's WiFi and enter this code at the login page to get online.`;

    const smsResult = await sendSms(payment.customer_phone, smsMessage);

    // Update payment sms fields
    await adminSupabase
      .from("payments")
      .update({
        sms_status: smsResult.ok ? "sent" : "failed",
        sms_message_id: smsResult.ok ? smsResult.messageId : null,
        sms_sent_at: smsResult.ok ? new Date().toISOString() : null,
        sms_error: smsResult.ok ? null : smsResult.error,
      })
      .eq("id", paymentId);

    // Log the resend attempt
    await adminSupabase.from("sms_logs").insert({
      payment_id: paymentId,
      phone: payment.customer_phone,
      message: smsMessage,
      status: smsResult.ok ? "sent" : "failed",
      message_id: smsResult.ok ? smsResult.messageId : null,
      error: smsResult.ok ? null : smsResult.error,
    });

    console.log(`[resend-sms] payment ${paymentId}:`, smsResult);

    if (!smsResult.ok) {
      return NextResponse.json({ error: smsResult.error }, { status: 502 });
    }

    return NextResponse.json({ success: true, messageId: smsResult.messageId });
  } catch (err) {
    console.error("[resend-sms] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
