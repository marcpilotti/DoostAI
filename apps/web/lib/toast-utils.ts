/**
 * Undo toast utility for destructive actions.
 *
 * Usage:
 *   const { toast } = useToast();
 *   showUndoToast(toast, "Kampanjen raderades", () => restoreCampaign(id));
 *
 * Shows a warning toast with an "Angra" (Undo) button that stays visible
 * for 5 seconds. If the user clicks "Angra", the onUndo callback fires
 * and the toast is dismissed.
 */

type ToastFn = (t: {
  type: "warning";
  title: string;
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}) => void;

export function showUndoToast(
  toast: ToastFn,
  message: string,
  onUndo: () => void,
) {
  toast({
    type: "warning",
    title: message,
    duration: 5000,
    action: {
      label: "\u00c5ngra",
      onClick: onUndo,
    },
  });
}
