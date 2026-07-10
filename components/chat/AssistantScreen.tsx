"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Scope } from "@/lib/types";
import { api } from "@/lib/api";
import { ChatView, caseLockInfo } from "@/components/chat/ChatView";
import type { LockInfo } from "@/components/chat/LockedScopeBanner";

/**
 * Assistant entry. Deep-link contract:
 *   /?thread=<id>          reopen a conversation
 *   /?case=<id>            start pre-scoped to a case (locked)
 *   /?doc=<id>             start pre-scoped to one document (locked)
 *   /?q=<text>             auto-send a first question
 *   /?lock=1               force the case/document scope to be locked
 *   /?new=<nonce>          force a fresh, unlocked conversation
 *
 * Opening from a case or a document locks the conversation to that context:
 * the assistant only sees that case's material — simpler and safer per user.
 */
export function AssistantScreen() {
  const params = useSearchParams();
  const threadId = params.get("thread") ?? undefined;
  const caseId = params.get("case");
  const docId = params.get("doc");
  const q = params.get("q") ?? undefined;
  const nonce = params.get("new") ?? "";

  // deep-linking from a case/document context locks the conversation
  const wantsLock =
    !threadId && (params.get("lock") === "1" || !!caseId || !!docId);

  const [scope, setScope] = useState<Scope | undefined>(undefined);
  const [lockInfo, setLockInfo] = useState<LockInfo | undefined>(undefined);
  const [resolved, setResolved] = useState(!caseId && !docId);

  useEffect(() => {
    let alive = true;
    if (docId) {
      api.library.getDocument(docId).then(async (d) => {
        if (!alive) return;
        if (d) {
          setScope({
            type: "document",
            docId,
            caseId: d.caseId ?? undefined,
            label: d.name,
          });
          const c = d.caseId ? await api.cases.get(d.caseId) : null;
          setLockInfo({
            label: d.name,
            sublabel: c ? `مستند ضمن ${c.number}` : "مستند محدد",
            facts: c
              ? [
                  { label: "القضية", value: c.number },
                  { label: "الموكل", value: c.client },
                ]
              : undefined,
          });
        }
        setResolved(true);
      });
    } else if (caseId) {
      api.cases.get(caseId).then((c) => {
        if (!alive) return;
        if (c) {
          setScope({ type: "case", caseId, label: c.number });
          setLockInfo(caseLockInfo(c));
        }
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
      initialLocked={wantsLock}
      initialLockInfo={lockInfo}
    />
  );
}
