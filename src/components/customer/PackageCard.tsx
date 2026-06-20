"use client";

import { useState } from "react";
import { Check, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "./PaymentModal";
import type { Package } from "@/types/database";

interface PackageCardProps {
  pkg: Package;
  featured?: boolean;
}

export function PackageCard({ pkg, featured = false }: PackageCardProps) {
  const [showModal, setShowModal] = useState(false);

  const durationLabel =
    pkg.duration_hours >= 720
      ? `${Math.round(pkg.duration_hours / 720)} Month${Math.round(pkg.duration_hours / 720) > 1 ? "s" : ""}`
      : `${pkg.duration_hours} Hours`;

  return (
    <>
      <Card
        className={`relative transition-all duration-200 hover:shadow-lg ${
          featured
            ? "border-2 border-blue-500 shadow-blue-100 shadow-lg"
            : "border border-gray-200"
        }`}
      >
        {featured && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-blue-600 text-white flex items-center gap-1 px-3 py-1">
              <Star className="w-3 h-3 fill-white" />
              Best Value
            </Badge>
          </div>
        )}

        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              {durationLabel}
            </div>
          </div>
          <div className="mt-2">
            <span className="text-4xl font-bold text-gray-900">
              GHS {Number(pkg.price).toFixed(2)}
            </span>
          </div>
          {pkg.description && (
            <p className="text-sm text-gray-500 mt-1">{pkg.description}</p>
          )}
        </CardHeader>

        <CardContent className="pb-4">
          <ul className="space-y-2">
            {[
              "Unlimited data access",
              "High-speed connection",
              `${durationLabel} validity`,
              "Instant voucher delivery",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-green-600" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter>
          <Button
            className={`w-full ${featured ? "bg-blue-600 hover:bg-blue-700" : ""}`}
            onClick={() => setShowModal(true)}
          >
            Get Started — GHS {Number(pkg.price).toFixed(2)}
          </Button>
        </CardFooter>
      </Card>

      {showModal && (
        <PaymentModal pkg={pkg} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
