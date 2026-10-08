import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * A bottom sheet: the mobile-native way to ask for a few fields without
 * losing the page behind it. It traps focus while open, closes on Escape
 * or a tap outside, and returns focus to whatever opened it.
 *
 * It renders through a portal to <body>. `fixed` resolves against the
 * nearest ancestor with a filter, backdrop-filter or transform rather than
 * the viewport, so a sheet opened from a control inside a blurred header
 * would otherwise be laid out against the header and sit off-screen.
 */
export default function Sheet({ open, onClose, title, description, children }) {
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = () =>
      panel?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [];

    focusables()[0]?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = [...focusables()];
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="დახურვა"
        onClick={onClose}
        className="animate-fade absolute inset-0 cursor-default bg-board-900/75 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-board-600 bg-board-850 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-rule px-4 pb-3 pt-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-xl font-semibold text-ivory">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-ivory-3">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="დახურვა"
            className="-mr-1 grid size-11 shrink-0 place-items-center rounded-lg text-ivory-3 transition-colors hover:bg-board-700 hover:text-ivory"
          >
            <X size={19} strokeWidth={1.75} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** A labelled form field. `optional` is marked, not `required`. */
export function Field({ label, hint, optional = false, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-ivory-2">
        {label}
        {optional && <span className="ml-1.5 text-ivory-3">არასავალდებულო</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-meta text-ivory-3">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "min-h-12 w-full rounded-lg border border-board-600 bg-board-700 px-3 text-base text-ivory outline-none transition-colors focus:border-gold";
