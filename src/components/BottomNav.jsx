import { CalendarDays, Home, ListOrdered, Swords, Trophy } from "lucide-react";

/**
 * Thumb-zone navigation. The bar clears the iOS home indicator through the
 * safe-area inset, and the labels are short enough to survive 360px.
 */
export const TABS = [
  { id: "home", label: "მთავარი", icon: Home },
  { id: "leaderboard", label: "რეიტინგი", icon: ListOrdered },
  { id: "games", label: "პარტიები", icon: Swords },
  { id: "tournaments", label: "ტურნირები", icon: Trophy },
  { id: "events", label: "ღონისძიებები", icon: CalendarDays },
];

export default function BottomNav({ view, onChange }) {
  return (
    <nav
      aria-label="განყოფილებები"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-board-850/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = view === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 px-0.5 transition-colors ${
                active ? "text-ivory" : "text-ivory-3 hover:text-ivory-2"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.6} />
              <span className="text-[10px] leading-none">{tab.label}</span>
              <span
                aria-hidden="true"
                className={`absolute inset-x-3 top-0 h-[2px] rounded-full bg-gold transition-[opacity,transform] duration-300 ${
                  active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
