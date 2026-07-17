"use client";

import { useEffect, useRef, useState } from "react";
import type { Case } from "@/lib/types";
import { api } from "@/lib/api";
import { POLL_INTERVAL_MS } from "@/lib/api/hermes";

/**
 * Polls GET /api/cases on an interval and flashes the newest case when a
 * previously-unseen one lands at the top of the list (e.g. a lawyer just
 * created one from Telegram). Keeps the last good data on transient errors
 * so the shell stays rendered if the backend blips.
 */
export function useCases(query?: string, pollMs = POLL_INTERVAL_MS) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  const lastTopIdRef = useRef<string | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    // A fresh query is a fresh list; don't treat its top item as "new".
    lastTopIdRef.current = null;

    async function tick() {
      try {
        const data = await api.cases.list(query || undefined);
        if (!alive) return;
        const topId = data[0]?.id ?? null;
        if (topId && lastTopIdRef.current !== null && topId !== lastTopIdRef.current) {
          setFlashId(topId);
          if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
          flashTimerRef.current = setTimeout(() => alive && setFlashId(null), 2500);
        }
        lastTopIdRef.current = topId;
        setCases(data);
        setError(null);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "تعذّر تحميل القضايا");
      } finally {
        if (alive) setLoading(false);
      }
    }

    setLoading(true);
    tick();
    const iv = setInterval(tick, pollMs);
    return () => {
      alive = false;
      clearInterval(iv);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [query, pollMs]);

  return { cases, loading, error, flashId };
}
