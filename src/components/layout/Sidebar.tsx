"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, PiggyBank, CreditCard, RefreshCw,
  TrendingUp, Cake, Car, Bell, Settings, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-gray-900 text-white border-r border-gray-800">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-800">
        <DollarSign className="h-7 w-7 text-emerald-400" />
        <span className="text-xl font-bold text-white">MoneyFlow</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
