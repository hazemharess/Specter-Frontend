"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  History,
  LibraryBig,
  MessageSquareText,
  Plus,
  Scale,
  Settings,
  Workflow,
  X,
} from "lucide-react";

const NAV = [
  { href: "/", label: "المساعد", icon: MessageSquareText },
  { href: "/cases", label: "القضايا", icon: Briefcase },
  { href: "/workflows", label: "الإجراءات", icon: Workflow },
  { href: "/library", label: "المكتبة", icon: LibraryBig },
  { href: "/history", label: "السجل", icon: History },
];

export function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const nav = (
    <>
      {/* logo */}
      <div className="flex items-center gap-2.5 px-4 pt-6 pb-4 md:max-xl:justify-center md:max-xl:px-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-input bg-accent text-white">
          <Scale className="h-4 w-4" strokeWidth={1.5} />
        </span>
        <span className="text-body font-semibold text-ink md:max-xl:hidden">
          مكتب الحق للمحاماة
        </span>
      </div>

      <div className="px-4 pb-4 md:max-xl:px-2">
        <button
          onClick={() => {
            router.push(`/?new=${Date.now()}`);
            onCloseMobile();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-4 py-2.5 text-body font-medium text-white transition-colors duration-150 hover:bg-[#16302b] active:scale-[.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          <span className="md:max-xl:hidden">محادثة جديدة</span>
        </button>
      </div>

      <nav aria-label="التنقل الرئيسي" className="flex flex-1 flex-col gap-1 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onCloseMobile}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-input px-3 py-2.5 text-body transition-colors duration-150 md:max-xl:justify-center md:max-xl:px-2 ${
                active
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-ink-2 hover:bg-accent-soft/40 hover:text-ink"
              }`}
            >
              {active && (
                <span className="absolute -right-2 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
              )}
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
              <span className="md:max-xl:hidden">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* bottom: settings + user */}
      <div className="border-t border-line px-4 py-4 md:max-xl:px-2">
        <div className="flex items-center gap-3 md:max-xl:justify-center">
          <span
            aria-label="أحمد مصطفى"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-label font-semibold text-accent"
          >
            أ.م
          </span>
          <div className="min-w-0 flex-1 md:max-xl:hidden">
            <p className="truncate text-body font-medium text-ink">أحمد مصطفى</p>
            <p className="truncate text-label text-ink-3">محامٍ أول</p>
          </div>
          <button
            aria-label="الإعدادات"
            className="rounded-input p-2 text-ink-3 transition-colors duration-150 hover:bg-accent-soft/40 hover:text-ink md:max-xl:hidden"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* desktop / tablet rail */}
      <aside
        aria-label="الشريط الجانبي"
        className="fixed inset-y-0 right-0 z-40 hidden w-60 flex-col border-l border-line bg-surface md:flex md:max-xl:w-16"
      >
        {nav}
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="إغلاق القائمة"
            className="absolute inset-0 bg-black/30"
            onClick={onCloseMobile}
          />
          <aside className="absolute inset-y-0 right-0 flex w-64 flex-col bg-surface shadow-floating">
            <button
              aria-label="إغلاق"
              onClick={onCloseMobile}
              className="absolute left-3 top-4 rounded-input p-1.5 text-ink-3 hover:bg-accent-soft/40"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
