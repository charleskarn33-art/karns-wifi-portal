"use client";

import { useState } from "react";
import { Phone, Copy, CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import type { Package } from "@/types/database";

const MOBILE_MONEY_NUMBER = process.env.NEXT_PUBLIC_MOBILE_MONEY_NUMBER ?? "0XX-XXX-XXXX";

interface PaymentModalProps {
  pkg: Package;
  onClose: () => void;
}

type Step = "instructions" | "form" | "success";

export function PaymentModal({ pkg, onClose }: PaymentModalProps) {
  const [step, setStep] = useState<Step>("instructions");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    transactionId: "",
  });
  const { toast } = useToast();
  const supabase = createClient();

  const copyNumber = async () => {
    await navigator.clipboard.writeText(MOBILE_MONEY_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.transactionId) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("payments").insert({
        package_id: pkg.id,
        customer_name: form.customerName.trim(),
        customer_phone: form.customerPhone.trim(),
        transaction_id: form.transactionId.trim().toUpperCase(),
        amount: Number(pkg.price),
        status: "pending",
      });

      if (error) throw error;
      setStep("success");
    } catch (err) {
      console.error(err);
      toast({
        title: "Submission failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {step === "instructions" && (
          <>
            <DialogHeader>
              <DialogTitle>Purchase {pkg.name}</DialogTitle>
              <DialogDescription>
                Send L$ {Number(pkg.price).toFixed(2)} via Mobile Money, then submit your
                transaction ID.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">Send Mobile Money to:</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-700 font-mono">
                    {MOBILE_MONEY_NUMBER}
                  </span>
                  <Button variant="outline" size="sm" onClick={copyNumber}>
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Amount: <strong>L$ {Number(pkg.price).toFixed(2)}</strong>
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Open your Mobile Money app and send the exact amount.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Note the transaction ID from your confirmation SMS.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Click below and fill in your details.</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => setStep("form")}>
                  I&apos;ve Paid — Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Submit Payment Details</DialogTitle>
              <DialogDescription>
                Enter your information so we can verify and send your voucher.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name</Label>
                <Input
                  id="customerName"
                  placeholder="John Doe"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="customerPhone"
                    placeholder="0XX-XXX-XXXX"
                    className="pl-9"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  placeholder="e.g. TXN1234567890"
                  className="font-mono"
                  value={form.transactionId}
                  onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500">
                  Found in your Mobile Money confirmation SMS.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Package</span>
                  <span className="font-medium">{pkg.name}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium text-blue-600">L$ {Number(pkg.price).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("instructions")}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Payment
                </Button>
              </div>
            </form>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle>Payment Submitted!</DialogTitle>
            </DialogHeader>
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">Thank you, {form.customerName}!</p>
                <p className="text-gray-500 text-sm mt-1">
                  Your payment is being reviewed. Once approved, your WiFi voucher will be
                  sent to <strong>{form.customerPhone}</strong>.
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                Approval typically takes 5–30 minutes during business hours.
              </div>
              <Button className="w-full" onClick={onClose}>
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
