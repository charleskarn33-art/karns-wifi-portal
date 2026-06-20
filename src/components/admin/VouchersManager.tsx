"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import type { Package } from "@/types/database";

type VoucherRow = {
  id: string;
  code: string;
  is_used: boolean;
  package_id: string;
  created_at: string;
  used_at: string | null;
  packages: { name: string } | null;
};

interface VouchersManagerProps {
  vouchers: VoucherRow[];
  packages: Package[];
}

export function VouchersManager({ vouchers, packages }: VouchersManagerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [packageId, setPackageId] = useState("");
  const [codes, setCodes] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterPkg, setFilterPkg] = useState("all");
  const [filterUsed, setFilterUsed] = useState("all");
  const { toast } = useToast();
  const supabase = createClient();

  const filtered = vouchers.filter((v) => {
    if (filterPkg !== "all" && v.package_id !== filterPkg) return false;
    if (filterUsed === "available" && v.is_used) return false;
    if (filterUsed === "used" && !v.is_used) return false;
    return true;
  });

  const available = vouchers.filter((v) => !v.is_used).length;
  const used = vouchers.filter((v) => v.is_used).length;

  const handleAdd = async () => {
    if (!packageId || !codes.trim()) {
      toast({ title: "Please select a package and enter voucher codes.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const codeList = codes
        .split(/[\n,]+/)
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);

      if (codeList.length === 0) {
        toast({ title: "No valid codes found", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("vouchers").insert(
        codeList.map((code) => ({ code, package_id: packageId }))
      );

      if (error) {
        if (error.code === "23505") {
          throw new Error("Some codes already exist. Please check for duplicates.");
        }
        throw error;
      }

      toast({ title: `${codeList.length} voucher(s) added successfully`, variant: "success" });
      setShowAddDialog(false);
      setCodes("");
      setPackageId("");
      startTransition(() => router.refresh());
    } catch (err) {
      toast({
        title: "Failed to add vouchers",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this voucher?")) return;
    const { error } = await supabase.from("vouchers").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } else {
      startTransition(() => router.refresh());
    }
  };

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{vouchers.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{available}</div>
            <div className="text-xs text-gray-500 mt-0.5">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{used}</div>
            <div className="text-xs text-gray-500 mt-0.5">Used</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Select value={filterPkg} onValueChange={setFilterPkg}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All packages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Packages</SelectItem>
              {packages.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterUsed} onValueChange={setFilterUsed}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="used">Used</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-1" />
          Add Vouchers
        </Button>
      </div>

      {/* Voucher list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {filtered.length} voucher{filtered.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Ticket className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No vouchers found. Add some above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Package</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Added</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Used At</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-medium text-gray-900">{v.code}</td>
                      <td className="px-4 py-3 text-gray-700">{v.packages?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={v.is_used ? "secondary" : "success"}>
                          {v.is_used ? "Used" : "Available"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(v.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {v.used_at ? new Date(v.used_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {!v.is_used && (
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Vouchers</DialogTitle>
            <DialogDescription>
              Enter voucher codes separated by commas or new lines.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Package</Label>
              <Select value={packageId} onValueChange={setPackageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package..." />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — L$ {Number(p.price).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Voucher Codes</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                placeholder={"CODE001\nCODE002\nCODE003"}
                value={codes}
                onChange={(e) => setCodes(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                One code per line or comma-separated.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Vouchers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
