"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

/** Hand-built primitives — no component library, per the design brief. */

type ButtonVariant = "primary" | "ghost" | "outline" | "danger";

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    pill?: boolean;
    loading?: boolean;
  }
>(function Button(
  { variant = "primary", pill, loading, className = "", children, ...rest },
  ref
) {
  const base =
    "inline-flex items-center justify-center gap-2 text-body font-medium transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none active:scale-[.98]";
  const shape = pill ? "rounded-pill px-5 py-2" : "rounded-input px-4 py-2";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-accent text-white hover:bg-[#16302b]",
    ghost: "bg-transparent text-ink-2 hover:bg-accent-soft/40 hover:text-ink",
    outline:
      "border border-line bg-surface text-ink hover:bg-accent-soft/40",
    danger: "bg-transparent text-danger hover:bg-danger/10",
  };
  return (
    <button
      ref={ref}
      className={`${base} ${shape} ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
      {children}
    </button>
  );
});

export function Pill({
  selected,
  gold,
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  gold?: boolean;
}) {
  const tone = gold
    ? "border-gold/60 text-ink hover:bg-[var(--gold-soft)]"
    : selected
      ? "border-accent bg-accent-soft text-accent"
      : "border-line bg-surface text-ink-2 hover:bg-accent-soft/40";
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-label transition-colors duration-150 ${tone} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "blue" | "amber" | "rose";
}) {
  const tones = {
    neutral: "bg-bg text-ink-2 border-line",
    green: "bg-accent-soft text-accent border-accent/20",
    blue: "bg-[#eaf0f5] text-[#2b4a63] border-[#2b4a63]/15",
    amber: "bg-[#f7f1e6] text-[#8a6a34] border-[#8a6a34]/15",
    rose: "bg-[#f6ecea] text-[#8d4436] border-[#8d4436]/15",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-pill border px-2.5 py-0.5 text-label ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <Loader2
      className={`h-4 w-4 animate-spin text-ink-3 ${className}`}
      strokeWidth={1.5}
      aria-label="جارٍ التحميل"
    />
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && <div className="text-ink-3 opacity-60">{icon}</div>}
      <p className="text-body text-ink-2">{title}</p>
      {hint && <p className="text-label text-ink-3">{hint}</p>}
    </div>
  );
}

/** Relative Arabic time, e.g. "منذ ساعتين". */
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 2) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "منذ ساعة";
  if (hours === 2) return "منذ ساعتين";
  if (hours < 24) return `منذ ${hours} ساعات`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "أمس";
  if (days === 2) return "منذ يومين";
  if (days < 7) return `منذ ${days} أيام`;
  return new Date(iso).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateAr(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
