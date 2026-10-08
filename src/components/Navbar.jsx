import { Crown, Lock, LogOut } from "lucide-react";

/**
 * The header stays put while the page scrolls, so the club and the current
 * role are always answerable. The blur keeps the title legible over moving
 * content; it is not decoration.
 */
export default function Navbar({ admin, onAdmin, onSignOut }) {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-board-900/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <Crown
          size={20}
          strokeWidth={1.75}
          aria-hidden="true"
          className="shrink-0 text-gold"
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-lg font-semibold leading-tight text-ivory">
            ჭადრაკის კლუბი
          </h1>
          <p className="truncate text-meta text-ivory-3">
            <span className="sm:hidden">რუსთავის №4</span>
            <span className="hidden sm:inline">
              რუსთავის №4 საჯარო სკოლა
            </span>
          </p>
        </div>

        {admin ? (
          <button
            type="button"
            onClick={onSignOut}
            aria-label="გასვლა"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-board-600 px-3 text-sm text-ivory-2 transition-colors hover:bg-board-700 hover:text-ivory"
          >
            <LogOut size={16} strokeWidth={1.75} />
            <span className="hidden sm:inline">გასვლა</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdmin}
            aria-label="ადმინისტრატორის შესვლა"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-board-600 px-3 text-sm text-ivory-2 transition-colors hover:bg-board-700 hover:text-ivory"
          >
            <Lock size={16} strokeWidth={1.75} />
            <span className="hidden sm:inline">შესვლა</span>
          </button>
        )}
      </div>
    </header>
  );
}
