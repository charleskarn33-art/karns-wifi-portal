import { createClient } from "@/lib/supabase/server";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function SmsLogsPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("sms_logs")
    .select("*, payments(customer_name, transaction_id)")
    .order("created_at", { ascending: false })
    .limit(200);

  type LogRow = {
    id: string;
    phone: string;
    message: string;
    status: string;
    message_id: string | null;
    error: string | null;
    created_at: string;
    payment_id: string | null;
    payments: { customer_name: string; transaction_id: string } | null;
  };

  const rows = (logs ?? []) as unknown as LogRow[];

  const sentCount = rows.filter((r) => r.status === "sent").length;
  const failedCount = rows.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SMS Logs</h1>
        <p className="text-gray-500 text-sm mt-1">Orange SMS delivery history</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Sent", value: rows.length, color: "text-gray-900" },
          { label: "Delivered", value: sentCount, color: "text-green-600" },
          { label: "Failed", value: failedCount, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Log table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No SMS logs yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Message ID / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString()}
                      <br />
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {log.payments?.customer_name ?? "—"}
                      </div>
                      {log.payments?.transaction_id && (
                        <div className="text-xs text-gray-400 font-mono">
                          {log.payments.transaction_id}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-mono">{log.phone}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={log.status === "sent" ? "success" : "destructive"}>
                        {log.status === "sent" ? (
                          <><CheckCircle className="w-3 h-3 mr-1" />sent</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" />failed</>
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono max-w-xs truncate">
                      {log.status === "sent" ? (
                        <span className="text-gray-500">{log.message_id ?? "—"}</span>
                      ) : (
                        <span className="text-red-600">{log.error ?? "unknown error"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
