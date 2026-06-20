import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Ticket, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [paymentsResult, vouchersResult] = await Promise.all([
    supabase.from("payments").select("id, status, amount, created_at, customer_name, package_id, packages(name)"),
    supabase.from("vouchers").select("id, is_used, package_id"),
  ]);

  type PaymentSummary = {
    id: string;
    status: "pending" | "approved" | "rejected";
    amount: number;
    created_at: string;
    customer_name: string;
    package_id: string;
    packages: { name: string } | null;
  };
  type VoucherSummary = { id: string; is_used: boolean; package_id: string };

  const payments = (paymentsResult.data ?? []) as unknown as PaymentSummary[];
  const vouchers = (vouchersResult.data ?? []) as unknown as VoucherSummary[];

  const pending = payments.filter((p) => p.status === "pending").length;
  const approved = payments.filter((p) => p.status === "approved").length;
  const rejected = payments.filter((p) => p.status === "rejected").length;
  const totalRevenue = payments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const availableVouchers = vouchers.filter((v) => !v.is_used).length;
  const usedVouchers = vouchers.filter((v) => v.is_used).length;

  const recentPayments: PaymentSummary[] = [...payments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const stats = [
    {
      title: "Pending Payments",
      value: pending,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      href: "/admin/payments?status=pending",
    },
    {
      title: "Approved",
      value: approved,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/admin/payments?status=approved",
    },
    {
      title: "Total Revenue",
      value: `GHS ${totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/reports",
    },
    {
      title: "Available Vouchers",
      value: availableVouchers,
      icon: Ticket,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/admin/vouchers",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your WiFi portal</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{stat.title}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-gray-900">{payments.length}</div>
            <div className="text-sm text-gray-500">Total Payments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-red-500">{rejected}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <div className="text-3xl font-bold text-gray-400">{usedVouchers}</div>
            <div className="text-sm text-gray-500">Used Vouchers</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
          <Link href="/admin/payments" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentPayments.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-gray-400 text-center py-8">
              No payments yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentPayments.map((payment) => {
                const pkg = payment.packages as { name: string } | null;
                return (
                  <div key={payment.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        {pkg?.name} &bull; {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">GHS {Number(payment.amount).toFixed(2)}</span>
                      <Badge
                        variant={
                          payment.status === "approved"
                            ? "success"
                            : payment.status === "rejected"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      {pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {pending} payment{pending > 1 ? "s" : ""} waiting for review
            </span>
          </div>
          <Link
            href="/admin/payments?status=pending"
            className="text-sm font-medium text-yellow-700 hover:text-yellow-900 underline"
          >
            Review now
          </Link>
        </div>
      )}
    </div>
  );
}
