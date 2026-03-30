"use client";

import { useState, useCallback } from "react";

type EditableField = "headline" | "bodyCopy" | "cta";

type AdEditorState = {
  headline: string;
  bodyCopy: string;
  cta: string;
};

type UndoEntry = {
  field: EditableField;
  previous: string;
  timestamp: number;
};

/**
 * Manages inline ad-copy editing with a bounded undo stack (max 20 entries).
 *
 * Extracted from the monolithic editing state in copy-preview-card.tsx so the
 * logic can be tested in isolation and reused across preview variants.
 *
 * @example
 * ```tsx
 * const editor = useAdEditor({ headline: "Boka nu", bodyCopy: "...", cta: "Läs mer" });
 * editor.updateField("headline", "Ny rubrik");
 * if (editor.canUndo) editor.undo();
 * ```
 */
export function useAdEditor(initial: AdEditorState) {
  const [state, setState] = useState<AdEditorState>(initial);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const updateField = useCallback(
    (field: EditableField, value: string) => {
      setState((prev) => {
        // Push the old value onto the undo stack (capped at 20 entries)
        setUndoStack((stack) => [
          ...stack.slice(-19),
          { field, previous: prev[field], timestamp: Date.now() },
        ]);
        setHasChanges(true);
        return { ...prev, [field]: value };
      });
    },
    [],
  );

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const last = stack[stack.length - 1]!;
      setState((prev) => ({ ...prev, [last.field]: last.previous }));
      return stack.slice(0, -1);
    });
  }, []);

  /** Reset to the original values and clear all history. */
  const reset = useCallback(() => {
    setState(initial);
    setUndoStack([]);
    setHasChanges(false);
  }, [initial]);

  /** Discard edits (revert to initial) but keep the undo stack intact. */
  const discard = useCallback(() => {
    setState(initial);
    setHasChanges(false);
  }, [initial]);

  return {
    state,
    updateField,
    undo,
    reset,
    discard,
    hasChanges,
    canUndo: undoStack.length > 0,
  };
}
