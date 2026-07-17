"use client";

import { useState } from "react";
import { Menu, Scale } from "lucide-react";
import { Sidebar } from "@/components/shell/Sidebar";
import { ProactiveNotification } from "@/components/agent/ProactiveNotification";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-4 py-3 md:hidden">
        <button
          aria-label="فتح القائمة"
          onClick={() => setMobileOpen(true)}
          className="rounded-input p-1.5 text-ink-2 hover:bg-accent-soft/40"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <span className="flex items-center gap-2 text-body font-semibold text-ink">
          <Scale className="h-4 w-4 text-accent" strokeWidth={1.5} />
          مكتب الحق للمحاماة
        </span>
      </header>

      <main className="min-h-screen md:mr-16 xl:mr-60">{children}</main>

      <ProactiveNotification />
    </div>
  );
}
