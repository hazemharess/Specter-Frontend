"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Download, Share2 } from "lucide-react";
import type { TaskItem, TaskListArtifactData, TaskStatus } from "@/lib/types";
import { toArabicDigits } from "@/components/chat/MessageContent";

const STATUS_LABEL: Record<TaskStatus, string> = {
  done: "منجز",
  review: "قيد المراجعة",
  pending: "قيد الانتظار",
  blocked: "متوقف",
};

/** Neutral pills; the state color lives in a small leading dot (design §6.4). */
const STATUS_DOT: Record<TaskStatus, string> = {
  done: "bg-status-done",
  review: "bg-status-review",
  pending: "bg-status-pending",
  blocked: "bg-danger",
};

function initials(t: TaskItem): string {
  if (t.assigneeName) {
    return t.assigneeName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);
  }
  return t.assignee === "lawyer" ? "م" : "ك";
}

function assigneeLabel(t: TaskItem): string {
  return t.assigneeName ?? (t.assignee === "lawyer" ? "المحامي" : "الموكل");
}

/**
 * The deliverable that seals the pitch: not a chat reply, a firm asset —
 * editable, shareable, exportable. Toggling a checkbox proves it's live.
 */
export function TaskListArtifact({ data }: { data: TaskListArtifactData }) {
  const [tasks, setTasks] = useState<TaskItem[]>(data.tasks);

  const toggle = (id: string) =>
    setTasks((ts) =>
      ts.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "done" ? "pending" : "done" }
          : t,
      ),
    );

  return (
    <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-raised">
      {/* header — yellow dot is the one sanctioned emoji-color exception */}
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F2C24B]">
          <CheckCircle2 className="h-3 w-3 text-[#7a5a00]" strokeWidth={2} />
        </span>
        <h3 className="text-title font-semibold text-ink">{data.title}</h3>
        <span className="mr-auto text-label text-ink-3">
          {toArabicDigits(tasks.length)} مهام
        </span>
      </div>

      {/* rows */}
      <div className="px-2 py-1">
        {/* column header */}
        <div className="flex items-center gap-3 px-3 py-2 text-label text-ink-3">
          <span className="w-5 shrink-0" />
          <span className="min-w-0 flex-1">المهمة</span>
          <span className="w-28 shrink-0 max-md:hidden">الحالة</span>
          <span className="w-32 shrink-0 max-md:w-20">المسؤول</span>
        </div>

        {tasks.map((t) => {
          const done = t.status === "done";
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 border-t border-line px-3 py-3"
            >
              <button
                onClick={() => toggle(t.id)}
                aria-label={done ? "إلغاء الإنجاز" : "وضع علامة منجز"}
                className="shrink-0 text-ink-3 transition-colors duration-150 hover:text-ink"
              >
                {done ? (
                  <CheckCircle2 className="h-[18px] w-[18px] text-status-done" strokeWidth={2} />
                ) : (
                  <Circle className="h-[18px] w-[18px]" strokeWidth={1.75} />
                )}
              </button>

              <span
                className={`min-w-0 flex-1 truncate text-body ${
                  done ? "text-ink-3 line-through" : "text-ink"
                }`}
              >
                {t.title}
              </span>

              <span className="w-28 shrink-0 max-md:hidden">
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-pill-bg px-2.5 py-1 text-label text-pill-text">
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[t.status]}`} />
                  {STATUS_LABEL[t.status]}
                </span>
              </span>

              <span className="flex w-32 shrink-0 items-center gap-2 max-md:w-20">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-medium text-ink-2">
                  {initials(t)}
                </span>
                <span className="truncate text-label text-ink-2 max-md:hidden">
                  {assigneeLabel(t)}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div className="flex items-center gap-2 border-t border-line px-5 py-3.5">
        <button className="inline-flex items-center gap-2 rounded-input border border-line-strong bg-surface px-4 py-2 text-label font-medium text-ink transition-colors duration-150 hover:bg-surface-2">
          <Share2 className="h-4 w-4" strokeWidth={1.5} />
          مشاركة مع الموكل
        </button>
        <button className="inline-flex items-center gap-2 rounded-input px-3 py-2 text-label text-ink-2 transition-colors duration-150 hover:bg-surface-2">
          <Download className="h-4 w-4" strokeWidth={1.5} />
          تصدير
        </button>
      </div>
    </div>
  );
}
