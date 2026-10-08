export default function Toast({ toast }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(78px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
    >
      {toast && (
        <div
          key={toast.id}
          className="animate-settle pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-board-600 bg-board-700 px-4 py-2.5 shadow-[0_10px_30px_-10px_rgb(0_0_0/0.85)]"
        >
          <span
            aria-hidden="true"
            className={`h-6 w-[2px] shrink-0 rounded-full ${
              toast.tone === "error" ? "bg-loss" : "bg-gold"
            }`}
          />
          <p className="text-sm text-ivory">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
