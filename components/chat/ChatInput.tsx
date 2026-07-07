"use client";

import { useRef, useState } from "react";
import { Mic, Paperclip, ArrowUp } from "lucide-react";

export function ChatInput({
  onSend,
  onMic,
  disabled,
  autoFocus,
  initialValue = "",
}: {
  onSend: (text: string) => void;
  onMic: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const text = value.trim();
    if (!text || disabled) return;
    setValue("");
    onSend(text);
  };

  return (
    <div className="rounded-card border border-line bg-surface shadow-raised">
      <textarea
        ref={ref}
        rows={2}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder="اسأل عن أي شيء… أو اكتب @ لإضافة مصدر"
        aria-label="اكتب سؤالك"
        className="w-full resize-none bg-transparent px-5 pt-4 text-body text-ink placeholder:text-ink-3 focus:outline-none"
      />
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-1">
          <button
            aria-label="إرفاق ملف"
            className="rounded-input p-2 text-ink-3 transition-colors duration-150 hover:bg-accent-soft/40 hover:text-ink"
          >
            <Paperclip className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
          <button
            aria-label="الوضع الصوتي"
            onClick={onMic}
            className="rounded-input p-2 text-ink-3 transition-colors duration-150 hover:bg-accent-soft/40 hover:text-ink"
          >
            <Mic className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        </div>
        <button
          aria-label="إرسال"
          onClick={send}
          disabled={!value.trim() || disabled}
          className="flex h-9 w-9 items-center justify-center rounded-input bg-accent text-white transition-all duration-150 hover:bg-[#16302b] active:scale-[.96] disabled:opacity-30"
        >
          <ArrowUp className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
