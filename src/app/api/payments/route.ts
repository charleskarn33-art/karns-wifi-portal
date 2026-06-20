import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log("[/api/payments] request payload:", JSON.stringify(body));

  const { package_id, customer_name, customer_phone, transaction_id, amount } =
    body as Record<string, unknown>;

  // Validate required fields
  const missing: string[] = [];
  if (!package_id) missing.push("package_id");
  if (!customer_name) missing.push("customer_name");
  if (!customer_phone) missing.push("customer_phone");
  if (!transaction_id) missing.push("transaction_id");
  if (amount === undefined || amount === null) missing.push("amount");

  if (missing.length) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Sanitise
  const payload = {
    package_id: String(package_id),
    customer_name: String(customer_name).trim(),
    customer_phone: String(customer_phone).trim(),
    transaction_id: String(transaction_id).trim().toUpperCase(),
    amount: Number(amount),
    status: "pending" as const,
  };

  if (isNaN(payload.amount) || payload.amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  try {
    // Use service-role client so RLS doesn't block public inserts
    const supabase = await createAdminClient();

    console.log("[/api/payments] inserting:", JSON.stringify(payload));

    const { data, error } = await supabase.from("payments").insert(payload).select("id").single();

    console.log("[/api/payments] supabase response — data:", data, "error:", error);

    if (error) {
      console.error("[/api/payments] insert error:", error);
      const message =
        process.env.NODE_ENV === "development"
          ? `Database error: ${error.message} (code ${error.code})`
          : "Payment submission failed. Please try again.";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: (data as { id: string }).id }, { status: 201 });
  } catch (err) {
    console.error("[/api/payments] unexpected error:", err);
    const message =
      process.env.NODE_ENV === "development"
        ? String(err)
        : "An unexpected error occurred. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
