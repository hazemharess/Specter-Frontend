"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Workflow } from "@/lib/types";
import { api } from "@/lib/api";
import { WorkflowRunner } from "@/components/workflow/WorkflowRunner";
import { Spinner } from "@/components/ui";

export default function WorkflowRunPage() {
  const { id } = useParams<{ id: string }>();
  const [workflow, setWorkflow] = useState<Workflow | null | undefined>(undefined);

  useEffect(() => {
    api.workflows.get(id).then((w) => setWorkflow(w));
  }, [id]);

  if (workflow === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <p className="py-24 text-center text-body text-ink-3">لم يُعثر على الإجراء.</p>
    );
  }

  return (
    <div className="py-10">
      <div className="mx-auto mb-8 max-w-2xl px-6 max-md:px-4">
        <Link
          href="/workflows"
          className="mb-3 inline-flex items-center gap-1 text-label text-ink-3 transition-colors duration-150 hover:text-ink"
        >
          الإجراءات
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          {workflow.title}
        </Link>
        <h1 className="text-page font-semibold text-ink">{workflow.title}</h1>
        <p className="mt-1 text-body text-ink-2">{workflow.description}</p>
      </div>

      {workflow.steps ? (
        <WorkflowRunner workflow={workflow} />
      ) : (
        <div className="mx-auto max-w-2xl px-6 max-md:px-4">
          <div className="rounded-card border border-line bg-surface px-6 py-12 text-center">
            <p className="text-body text-ink-2">
              هذا الإجراء قيد الإعداد وسيتوفر قريبًا.
            </p>
            <p className="mt-1 text-label text-ink-3">
              جرّب «إنذار على يد محضر» أو «مذكرة دفاع» — كلاهما جاهز للتشغيل الكامل.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
