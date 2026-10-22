"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Settings, Wallet, type LucideIcon } from "lucide-react";
import { StreakBadges } from "./StreakHeader";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Today", icon: CalendarCheck },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Floating navigation chrome — the only blurred surface besides sheets
 * (design.md §2). Bottom tab bar under 768px, left sidebar from 768px.
 * Children must stay solid: never nest another `.liquid-glass-chrome`.
 */
export default function LiquidGlassBar() {
  const pathname = usePathname();

  return (
    <>
      {/* iPhone: floating pill tab bar, 16px above the safe area */}
      <nav
        aria-label="Primary"
        className="liquid-glass-chrome fixed inset-x-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm rounded-full p-1.5 md:hidden"
      >
        <ul className="grid grid-cols-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-full py-1 text-xs font-medium",
                    active ? "text-blue" : "text-secondary",
                  )}
                >
                  <Icon size={22} strokeWidth={1.75} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Laptop: 240px sidebar with live streak counters */}
      <aside className="liquid-glass-chrome fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-8 rounded-none border-y-0 border-l-0 px-4 py-6 md:flex">
        <p className="px-3 text-xl font-bold tracking-[-0.02em]">Pulse</p>

        <section className="flex flex-col gap-2">
          <h2 className="px-3 text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary">
            Streaks
          </h2>
          <StreakBadges className="flex-col" />
        </section>

        <nav aria-label="Primary">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium",
                      active ? "bg-surface text-blue" : "text-primary",
                    )}
                  >
                    <Icon size={20} strokeWidth={1.75} aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
