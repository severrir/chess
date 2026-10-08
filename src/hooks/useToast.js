import { useCallback, useRef, useState } from "react";

let seq = 0;

/**
 * Confirmation in the same words as the control that caused it:
 * დამატება → დაემატა. One optional action, used for undo.
 */
export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((message, { tone = "info", duration = 4000 } = {}) => {
    clearTimeout(timer.current);
    setToast({ id: ++seq, message, tone });
    timer.current = setTimeout(() => setToast(null), duration);
  }, []);

  return { toast, show, dismiss };
}
