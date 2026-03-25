"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => void;
  maxLength?: number;
  className?: string;
  as?: "span" | "div" | "p";
  original?: string;
  onReset?: () => void;
}

export function EditableText({
  value,
  onSave,
  maxLength,
  className = "",
  as: Tag = "span",
  original,
  onReset,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const isModified = original !== undefined && value !== original;
  const isMultiline = (maxLength ?? 0) > 60;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function save() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
      setSaved(true);
      setTimeout(() => setSaved(false), 800);
    }
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") {
      cancel();
    }
  }

  const charCount = draft.length;
  const nearLimit = maxLength && charCount > maxLength * 0.85;
  const overLimit = maxLength && charCount > maxLength;

  if (editing) {
    return (
      <span className={`inline-flex flex-col ${className}`}>
        {isMultiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={save}
            rows={2}
            className="w-full resize-none rounded-md border border-indigo-300 bg-white px-2 py-1 text-inherit outline-none ring-2 ring-indigo-100 transition-all duration-150"
            style={{ font: "inherit", fontSize: "inherit", lineHeight: "inherit" }}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={save}
            className="w-full rounded-md border border-indigo-300 bg-white px-2 py-0.5 text-inherit outline-none ring-2 ring-indigo-100 transition-all duration-150"
            style={{ font: "inherit", fontSize: "inherit" }}
          />
        )}
        {maxLength && (
          <span
            className={`mt-0.5 self-end font-mono text-[10px] ${
              overLimit
                ? "text-red-500"
                : nearLimit
                  ? "text-amber-500"
                  : "text-muted-foreground/40"
            }`}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`group relative inline ${className}`}>
      <Tag
        onClick={() => setEditing(true)}
        className={`cursor-text transition-all duration-150 hover:decoration-dashed hover:underline hover:underline-offset-2 hover:decoration-muted-foreground/30 ${
          saved ? "editable-saved" : ""
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
      >
        {value}
      </Tag>
      {isModified && onReset && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 hover:text-muted-foreground"
          title="Återställ original"
        >
          <RotateCcw className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}
