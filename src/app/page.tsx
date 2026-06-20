import { Wifi, Clock, Calendar, Shield, Zap, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PackageCard } from "@/components/customer/PackageCard";
import type { Package } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-none">Karn&apos;s WiFi</h1>
              <p className="text-xs text-gray-500">Fast &amp; Reliable</p>
            </div>
          </div>
          <a
            href="tel:+2310777770438"
            className="flex items-center gap-1.5 text-sm text-blue-600 font-medium"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Need help?</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Zap className="w-3.5 h-3.5" />
          Instant activation after approval
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Stay Connected,{" "}
          <span className="text-blue-600">Anywhere</span>
        </h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">
          Purchase a WiFi voucher using Mobile Money and get instant internet access.
          Simple, fast, and affordable.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-12">
          {[
            { label: "Uptime", value: "99.9%" },
            { label: "Speed", value: "Fast" },
            { label: "Support", value: "24/7" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="font-bold text-blue-600 text-lg">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Package Selection */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h3 className="text-xl font-bold text-gray-900 text-center mb-8">
          Choose Your Package
        </h3>

        {packages && packages.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {(packages as Package[]).map((pkg, idx) => (
              <PackageCard key={pkg.id} pkg={pkg} featured={idx === 1} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            No packages available at the moment. Please check back later.
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-xl font-bold text-gray-900 text-center mb-10">
            How It Works
          </h3>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="w-6 h-6" />,
                title: "Choose a Package",
                desc: "Select between 24-hour or 30-day access.",
              },
              {
                icon: <Phone className="w-6 h-6" />,
                title: "Pay via Mobile Money",
                desc: "Send payment and enter your transaction ID.",
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Receive Your Voucher",
                desc: "Admin approves and sends your voucher code.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  {item.icon}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-400" />
            <span className="text-white font-medium">Karn&apos;s WiFi</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Shield className="w-3.5 h-3.5" />
            Secure Mobile Money payments
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} Karn&apos;s WiFi</p>
        </div>
      </footer>
    </div>
  );
}
