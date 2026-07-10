"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, FileText, Folder, FolderOpen, Search } from "lucide-react";
import type { LegalDocument, LibraryNode } from "@/lib/types";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui";

const KIND_FILTERS = ["الكل", "تشريع", "مبدأ قضائي"] as const;

function TreeBranch({
  node,
  depth,
  selectedDocId,
  onSelect,
}: {
  node: LibraryNode;
  depth: number;
  selectedDocId: string | null;
  onSelect: (docId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  if (node.docId) {
    const selected = selectedDocId === node.docId;
    return (
      <button
        onClick={() => onSelect(node.docId!)}
        aria-current={selected ? "true" : undefined}
        className={`flex w-full items-center gap-2 rounded-input py-1.5 pl-2 text-right text-label transition-colors duration-150 ${
          selected
            ? "bg-accent-soft font-medium text-accent"
            : "text-ink-2 hover:bg-accent-soft/40 hover:text-ink"
        }`}
        style={{ paddingRight: `${depth * 16 + 8}px` }}
      >
        <FileText className="h-3.5 w-3.5 shrink-0 text-ink-3" strokeWidth={1.5} />
        <span className="min-w-0 flex-1 truncate">{node.label}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-input py-1.5 pl-2 text-right text-label text-ink transition-colors duration-150 hover:bg-accent-soft/40"
        style={{ paddingRight: `${depth * 16 + 8}px` }}
      >
        {open ? (
          <FolderOpen className="h-3.5 w-3.5 shrink-0 text-ink-3" strokeWidth={1.5} />
        ) : (
          <Folder className="h-3.5 w-3.5 shrink-0 text-ink-3" strokeWidth={1.5} />
        )}
        <span className="min-w-0 flex-1 truncate font-medium">{node.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-ink-3 transition-transform duration-150 ${open ? "" : "rotate-90"}`}
          strokeWidth={1.5}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {node.children?.map((child) => (
              <TreeBranch
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedDocId={selectedDocId}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LibraryTree({
  selectedDocId,
  onSelect,
}: {
  selectedDocId: string | null;
  onSelect: (docId: string) => void;
}) {
  const [tree, setTree] = useState<LibraryNode[] | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<(typeof KIND_FILTERS)[number]>("الكل");
  const [results, setResults] = useState<LegalDocument[] | null>(null);

  useEffect(() => {
    api.library.tree().then(setTree);
  }, []);

  useEffect(() => {
    if (!query && kind === "الكل") {
      setResults(null);
      return;
    }
    let alive = true;
    api.library
      .search(query, kind === "الكل" ? undefined : kind)
      .then((r) => alive && setResults(r));
    return () => {
      alive = false;
    };
  }, [query, kind]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-3">
        <div className="relative mb-2">
          <Search
            className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3"
            strokeWidth={1.5}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في المكتبة…"
            aria-label="بحث في المكتبة"
            className="w-full rounded-input border border-line bg-bg py-1.5 pl-2.5 pr-8 text-label text-ink placeholder:text-ink-3 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>
        <div className="flex gap-1.5">
          {KIND_FILTERS.map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={`rounded-pill border px-2.5 py-0.5 text-label transition-colors duration-150 ${
                kind === k
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-ink-3 hover:bg-accent-soft/40"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {!tree && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}
        {results
          ? results.map((d) => (
              <button
                key={d.id}
                onClick={() => onSelect(d.id)}
                className={`flex w-full items-center gap-2 rounded-input px-2 py-1.5 text-right text-label transition-colors duration-150 ${
                  selectedDocId === d.id
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-ink-2 hover:bg-accent-soft/40"
                }`}
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-ink-3" strokeWidth={1.5} />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
              </button>
            ))
          : tree?.map((node) => (
              <TreeBranch
                key={node.id}
                node={node}
                depth={0}
                selectedDocId={selectedDocId}
                onSelect={onSelect}
              />
            ))}
        {results && results.length === 0 && (
          <p className="py-8 text-center text-label text-ink-3">لا توجد نتائج.</p>
        )}
      </div>
    </div>
  );
}
