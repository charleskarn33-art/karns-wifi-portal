"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, Search, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type PaymentRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  transaction_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  voucher_id: string | null;
  packages: { name: string; duration_hours: number } | null;
};

interface PaymentsTableProps {
  payments: PaymentRow[];
  currentStatus?: string;
}

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function PaymentsTable({ payments, currentStatus }: PaymentsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const updateFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) params.set("status", status);
    else params.delete("status");
    startTransition(() => router.push(`/admin/payments?${params.toString()}`));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("q", search);
    else params.delete("q");
    startTransition(() => router.push(`/admin/payments?${params.toString()}`));
  };

  const openAction = (payment: PaymentRow, type: "approve" | "reject") => {
    setSelectedPayment(payment);
    setActionType(type);
    setNotes("");
  };

  const handleAction = async () => {
    if (!selectedPayment || !actionType) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/payment-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          action: actionType,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");

      toast({
        title: actionType === "approve" ? "Payment approved" : "Payment rejected",
        variant: actionType === "approve" ? "success" : "default",
      });

      setSelectedPayment(null);
      setActionType(null);
      startTransition(() => router.refresh());
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                (currentStatus ?? "") === f.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search name, phone, transaction ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {payments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No payments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Package</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Transaction ID</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{payment.customer_name}</div>
                      <div className="text-xs text-gray-500">{payment.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {payment.packages?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {payment.transaction_id}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      GHS {Number(payment.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          payment.status === "approved"
                            ? "success"
                            : payment.status === "rejected"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {payment.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {payment.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                        {payment.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(payment.created_at).toLocaleDateString()}
                      <br />
                      {new Date(payment.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {payment.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50 h-7 px-2"
                              onClick={() => openAction(payment, "approve")}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 h-7 px-2"
                              onClick={() => openAction(payment, "reject")}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {payment.status !== "pending" && (
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => { setSelectedPayment(payment); setActionType(null); }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action dialog */}
      {selectedPayment && actionType && (
        <Dialog open onOpenChange={() => { setSelectedPayment(null); setActionType(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" ? "Approve Payment" : "Reject Payment"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve"
                  ? "A voucher will be assigned and the customer will be notified."
                  : "The payment will be marked as rejected."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-medium">{selectedPayment.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Package</span>
                  <span className="font-medium">{selectedPayment.packages?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium text-blue-600">
                    GHS {Number(selectedPayment.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono">{selectedPayment.transaction_id}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Admin Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add a note..."
                  className="h-20 resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setSelectedPayment(null); setActionType(null); }}>
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={actionLoading}
                className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {actionType === "approve" ? "Approve & Assign Voucher" : "Reject Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View dialog for non-pending */}
      {selectedPayment && !actionType && (
        <Dialog open onOpenChange={() => setSelectedPayment(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              {[
                ["Customer", selectedPayment.customer_name],
                ["Phone", selectedPayment.customer_phone],
                ["Package", selectedPayment.packages?.name ?? "—"],
                ["Transaction ID", selectedPayment.transaction_id],
                ["Amount", `GHS ${Number(selectedPayment.amount).toFixed(2)}`],
                ["Status", selectedPayment.status],
                ["Date", new Date(selectedPayment.created_at).toLocaleString()],
                ...(selectedPayment.admin_notes ? [["Admin Notes", selectedPayment.admin_notes]] : []),
                ...(selectedPayment.voucher_id ? [["Voucher ID", selectedPayment.voucher_id]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-right max-w-[60%] break-all">{value}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => setSelectedPayment(null)} className="w-full">Close</Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
