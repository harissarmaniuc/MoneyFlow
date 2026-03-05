"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, DollarSign, LayoutDashboard, ChartColumn, FileText, PiggyBank, CreditCard, RefreshCw, TrendingUp, Cake, Car, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/bills", label: "Bills", icon: FileText },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/debts", label: "Debts", icon: CreditCard },
  { href: "/subscriptions", label: "Subscriptions", icon: RefreshCw },
  { href: "/spending", label: "Spending", icon: TrendingUp },
  { href: "/birthdays", label: "Birthdays", icon: Cake },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative flex flex-col w-72 bg-gray-900 text-white h-full shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-emerald-400" />
                <span className="text-lg font-bold">MoneyFlow</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive ? "bg-emerald-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
