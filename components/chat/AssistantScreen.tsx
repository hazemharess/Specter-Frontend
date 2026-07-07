"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Scope } from "@/lib/types";
import { api } from "@/lib/api";
import { ChatView } from "@/components/chat/ChatView";

/**
 * Assistant entry. Deep-link contract:
 *   /?thread=<id>          reopen a conversation
 *   /?case=<id>            start pre-scoped to a case
 *   /?doc=<id>             start pre-scoped to one document
 *   /?q=<text>             auto-send a first question
 *   /?new=<nonce>          force a fresh conversation (sidebar button)
 */
export function AssistantScreen() {
  const params = useSearchParams();
  const threadId = params.get("thread") ?? undefined;
  const caseId = params.get("case");
  const docId = params.get("doc");
  const q = params.get("q") ?? undefined;
  const nonce = params.get("new") ?? "";

  const [scope, setScope] = useState<Scope | undefined>(undefined);
  const [resolved, setResolved] = useState(!caseId && !docId);

  useEffect(() => {
    let alive = true;
    if (docId) {
      api.library.getDocument(docId).then((d) => {
        if (!alive) return;
        if (d) setScope({ type: "document", docId, caseId: d.caseId ?? undefined, label: d.name });
        setResolved(true);
      });
    } else if (caseId) {
      api.cases.get(caseId).then((c) => {
        if (!alive) return;
        if (c) setScope({ type: "case", caseId, label: c.number });
        setResolved(true);
      });
    }
    return () => {
      alive = false;
    };
  }, [caseId, docId]);

  if (!resolved) return null;

  return (
    <ChatView
      key={`${threadId ?? ""}-${caseId ?? ""}-${docId ?? ""}-${nonce}`}
      initialThreadId={threadId}
      initialScope={scope}
      autoSendText={q}
    />
  );
}
