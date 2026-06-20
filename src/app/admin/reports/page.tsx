import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, CreditCard, Ticket } from "lucide-react";

export default async function ReportsPage() {
  const supabase = await createClient();

  const [paymentsResult, packagesResult, vouchersResult] = await Promise.all([
    supabase.from("payments").select("id, status, amount, created_at, customer_name, package_id, packages(name, price)").order("created_at", { ascending: false }),
    supabase.from("packages").select("*"),
    supabase.from("vouchers").select("id, is_used"),
  ]);

  type ReportPayment = {
    id: string;
    status: "pending" | "approved" | "rejected";
    amount: number;
    created_at: string;
    customer_name: string;
    package_id: string;
    packages: { name: string; price: number } | null;
  };

  type ReportPackage = { id: string; name: string; price: number; is_active: boolean };

  const payments = (paymentsResult.data ?? []) as unknown as ReportPayment[];
  const packages = (packagesResult.data ?? []) as unknown as ReportPackage[];
  const vouchers = (vouchersResult.data ?? []) as unknown as { id: string; is_used: boolean }[];

  const approved = payments.filter((p) => p.status === "approved");
  const pending = payments.filter((p) => p.status === "pending");
  const rejected = payments.filter((p) => p.status === "rejected");
  const totalRevenue = approved.reduce((sum, p) => sum + Number(p.amount), 0);

  // Revenue by package
  const revenueByPackage = packages.map((pkg) => {
    const pkgPayments = approved.filter((p) => p.package_id === pkg.id);
    return {
      name: pkg.name,
      count: pkgPayments.length,
      revenue: pkgPayments.reduce((sum, p) => sum + Number(p.amount), 0),
    };
  });

  // Last 7 days revenue
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split("T")[0];
    const dayPayments = approved.filter((p) => p.created_at.startsWith(dateStr));
    return {
      date: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      count: dayPayments.length,
      revenue: dayPayments.reduce((sum, p) => sum + Number(p.amount), 0),
    };
  });

  const maxDayRevenue = Math.max(...last7Days.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of revenue and sales performance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `L$ ${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Approved Sales", value: approved.length, icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending", value: pending.length, icon: Package, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Vouchers Used", value: vouchers.filter((v) => v.is_used).length, icon: Ticket, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by package */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Package</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByPackage.length === 0 ? (
              <p className="text-gray-400 text-sm">No data yet.</p>
            ) : (
              <div className="space-y-4">
                {revenueByPackage.map((pkg) => (
                  <div key={pkg.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{pkg.name}</span>
                      <span className="text-gray-500">{pkg.count} sales · L$ {pkg.revenue.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${totalRevenue > 0 ? (pkg.revenue / totalRevenue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Approved", count: approved.length, variant: "success" as const, pct: payments.length > 0 ? (approved.length / payments.length) * 100 : 0 },
                { label: "Pending", count: pending.length, variant: "warning" as const, pct: payments.length > 0 ? (pending.length / payments.length) * 100 : 0 },
                { label: "Rejected", count: rejected.length, variant: "destructive" as const, pct: payments.length > 0 ? (rejected.length / payments.length) * 100 : 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <Badge variant={item.variant} className="w-20 justify-center">{item.label}</Badge>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.label === "Approved" ? "bg-green-500" :
                        item.label === "Pending" ? "bg-yellow-400" : "bg-red-500"
                      }`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-6 text-right">{item.count}</span>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">Total: {payments.length} payments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last 7 days chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Last 7 Days Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {last7Days.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500 font-medium">
                  {day.revenue > 0 ? `L$ ${day.revenue.toFixed(0)}` : ""}
                </span>
                <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all"
                    style={{
                      height: `${(day.revenue / maxDayRevenue) * 80}px`,
                      minHeight: day.revenue > 0 ? "4px" : "0",
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 text-center leading-tight">{day.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent approved payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Approved Sales</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {approved.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No approved payments yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Customer</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Package</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Amount</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {approved.slice(0, 10).map((p) => {
                    const pkg = p.packages;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{p.customer_name}</td>
                        <td className="px-4 py-2.5 text-gray-600">{pkg?.name ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-green-600">
                          L$ {Number(p.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
