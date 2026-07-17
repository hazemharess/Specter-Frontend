"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { DocumentContent, LegalDocument } from "@/lib/types";
import { api } from "@/lib/api";
import { PdfPage } from "@/components/reader/PdfPage";
import { LibraryTree } from "@/components/reader/LibraryTree";
import { EmptyState, Spinner } from "@/components/ui";
import { toArabicDigits } from "@/components/chat/MessageContent";

function LibraryScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const initialDoc = params.get("doc");

  const [docId, setDocId] = useState<string | null>(initialDoc);
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [content, setContent] = useState<DocumentContent | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!docId) return;
    let alive = true;
    setDoc(null);
    setContent(null);
    setPageNum(1);
    Promise.all([api.library.getDocument(docId), api.library.getContent(docId)]).then(
      ([d, c]) => {
        if (!alive) return;
        setDoc(d);
        setContent(c);
      }
    );
    return () => {
      alive = false;
    };
  }, [docId]);

  const total = content?.pages.length ?? 0;
  const page = content?.pages.find((p) => p.page === pageNum) ?? null;

  // TOC entries are index-aligned with the page paragraphs; jump + briefly pulse.
  const jumpToParagraph = (i: number) => {
    const el = document.getElementById(`reader-p-${i}`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.add("citation-highlight", "citation-highlight--pulse");
    window.setTimeout(
      () => el.classList.remove("citation-highlight", "citation-highlight--pulse"),
      1300,
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* right pane: tree (first in RTL) */}
      <aside
        aria-label="فهرس المكتبة"
        className="w-72 shrink-0 border-l border-line bg-surface max-md:hidden"
      >
        <LibraryTree selectedDocId={docId} onSelect={setDocId} />
      </aside>

      {/* left pane: reader */}
      <section className="relative flex min-w-0 flex-1 flex-col" aria-label="قارئ المستندات">
        {!docId && (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={<BookOpen className="h-12 w-12" strokeWidth={1} />}
              title="اختر مستندًا من الفهرس للقراءة"
              hint="التشريعات ومبادئ النقض مصنفة حسب مجال الممارسة"
            />
          </div>
        )}

        {docId && !content && (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {docId && content && doc && (
          <>
            {/* toolbar */}
            <header className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium text-ink">{doc.name}</p>
                <p className="text-label text-ink-3">
                  صفحة {toArabicDigits(pageNum)} من {toArabicDigits(total)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(1)))}
                  aria-label="تصغير"
                  className="rounded-input p-2 text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40"
                >
                  <ZoomOut className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <span className="min-w-12 text-center text-label text-ink-3">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(1)))}
                  aria-label="تكبير"
                  className="rounded-input p-2 text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40"
                >
                  <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </header>

            <div className="flex min-h-0 flex-1">
              {/* TOC strip */}
              <nav
                aria-label="فهرس المحتويات"
                className="w-44 shrink-0 overflow-y-auto border-l border-line bg-surface p-3 max-lg:hidden"
              >
                <p className="mb-2 text-label font-medium text-ink-3">المحتويات</p>
                {content.tableOfContents.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => jumpToParagraph(i)}
                    className="block w-full rounded-input px-2 py-1.5 text-right text-label text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40 hover:text-accent"
                  >
                    {t.label}
                  </button>
                ))}
              </nav>

              {/* page */}
              <div className="relative min-w-0 flex-1 overflow-y-auto bg-[#efeeea] p-6 max-md:p-3">
                {page && (
                  <motion.div
                    key={pageNum}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <PdfPage page={page} zoom={zoom} />
                  </motion.div>
                )}

                {/* docked ask button */}
                <button
                  onClick={() => router.push(`/?doc=${docId}`)}
                  className="fixed bottom-6 left-6 z-20 inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-body font-medium text-white shadow-floating transition-colors duration-150 hover:bg-accent-hover active:scale-[.98]"
                >
                  <MessageSquareText className="h-4 w-4" strokeWidth={1.5} />
                  اسأل عن هذا المستند
                </button>
              </div>
            </div>

            {/* pager */}
            <footer className="flex items-center justify-center gap-4 border-t border-line bg-surface py-2">
              <button
                onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                disabled={pageNum <= 1}
                aria-label="الصفحة السابقة"
                className="rounded-input p-2 text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40 disabled:opacity-30"
              >
                <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
              <span className="min-w-16 text-center text-label text-ink-2">
                {toArabicDigits(pageNum)} / {toArabicDigits(total)}
              </span>
              <button
                onClick={() => setPageNum((p) => Math.min(total, p + 1))}
                disabled={pageNum >= total}
                aria-label="الصفحة التالية"
                className="rounded-input p-2 text-ink-2 transition-colors duration-150 hover:bg-accent-soft/40 disabled:opacity-30"
              >
                <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
            </footer>
          </>
        )}

        {/* mobile: tree replaces empty reader */}
        {!docId && (
          <div className="hidden max-md:block max-md:h-72 max-md:border-t max-md:border-line">
            <LibraryTree selectedDocId={docId} onSelect={setDocId} />
          </div>
        )}
      </section>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <LibraryScreen />
    </Suspense>
  );
}
