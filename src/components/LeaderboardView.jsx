import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Rank } from "./HomeView.jsx";
import PlayerLink from "./PlayerLink.jsx";

/**
 * The ladder, and the same ladder summed by class.
 *
 * Two readings of one dataset, so they live on one screen behind a
 * segmented control rather than in two places a student has to find.
 */
export default function LeaderboardView({ state, onPlayer }) {
  const [mode, setMode] = useState("players");
  const [klass, setKlass] = useState("all");
  const [query, setQuery] = useState("");

  const classes = useMemo(
    () => [...new Set(state.players.map((p) => p.klass))].sort((a, b) =>
      a.localeCompare(b, "ka"),
    ),
    [state.players],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.players.filter(
      (p) =>
        (klass === "all" || p.klass === klass) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [state.players, klass, query]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div
        role="group"
        aria-label="ხედი"
        className="grid grid-cols-2 gap-1 rounded-xl border border-board-600 p-1"
      >
        {[
          ["players", "მოთამაშეები"],
          ["classes", "კლასები"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            onClick={() => setMode(id)}
            className={`min-h-11 rounded-lg text-sm transition-colors ${
              mode === id
                ? "bg-board-700 text-ivory"
                : "text-ivory-3 hover:text-ivory-2"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "players" ? (
        <>
          <div className="relative">
            <Search
              size={17}
              strokeWidth={1.75}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ivory-3"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="მოთამაშის ძებნა"
              aria-label="მოთამაშის ძებნა"
              className="min-h-11 w-full rounded-lg border border-board-600 bg-board-700 py-2 pl-10 pr-10 text-base text-ivory outline-none transition-colors focus:border-gold [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="ძებნის გასუფთავება"
                className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded text-ivory-3 hover:text-ivory"
              >
                <X size={17} strokeWidth={1.75} />
              </button>
            )}
          </div>

          <div className="rail -mx-4 flex gap-1 px-4 pb-1">
            <Pill active={klass === "all"} onClick={() => setKlass("all")}>
              ყველა კლასი
            </Pill>
            {classes.map((c) => (
              <Pill key={c} active={klass === c} onClick={() => setKlass(c)}>
                {c}
              </Pill>
            ))}
          </div>

          {rows.length === 0 ? (
            <Empty
              title="ვერავინ ვიპოვე"
              body="სცადე სხვა სახელი ან სხვა კლასი."
            />
          ) : (
            <div className="sheet overflow-hidden">
              <table className="w-full text-sm">
                <caption className="sr-only">მოთამაშეების რეიტინგი</caption>
                <thead>
                  <tr className="border-b border-rule text-left text-meta text-ivory-3">
                    <th scope="col" className="py-2 pl-3 pr-1 font-normal">
                      #
                    </th>
                    <th scope="col" className="px-1 py-2 font-normal">
                      მოთამაშე
                    </th>
                    <th scope="col" className="px-1 py-2 text-right font-normal">
                      რეიტ.
                    </th>
                    <th scope="col" className="px-1 py-2 text-right font-normal">
                      მ
                    </th>
                    <th scope="col" className="px-1 py-2 text-right font-normal">
                      წ
                    </th>
                    <th scope="col" className="py-2 pl-1 pr-3 text-right font-normal">
                      ფ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {rows.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-board-700/60">
                      <td className="py-2 pl-3 pr-1">
                        <Rank rank={p.rank} />
                      </td>
                      <td className="max-w-0 px-1 py-2">
                        <PlayerLink id={p.id} sub={p.klass}>
                          {p.name}
                        </PlayerLink>
                      </td>
                      <td className="px-1 py-2 text-right font-serif text-base text-ivory">
                        {p.rating}
                      </td>
                      <td className="px-1 py-2 text-right text-ivory-2">
                        {p.wins}
                      </td>
                      <td className="px-1 py-2 text-right text-ivory-2">
                        {p.losses}
                      </td>
                      <td className="py-2 pl-1 pr-3 text-right text-ivory-2">
                        {p.draws}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-rule px-3 py-2 text-meta text-ivory-3">
                მ — მოგება, წ — წაგება, ფ — ფრე
              </p>
            </div>
          )}
        </>
      ) : (
        <ClassTable state={state} />
      )}
    </div>
  );
}

/** Classes ranked by the average rating of the players in them. */
function ClassTable({ state }) {
  const max = state.classes[0]?.average ?? 1;
  const min = Math.min(...state.classes.map((c) => c.average), max) - 60;

  return (
    <ol className="flex flex-col gap-2">
      {state.classes.map((c, i) => (
        <li key={c.klass} className="sheet px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-serif text-lg text-ivory">
              <Rank rank={i + 1} />
              <span className="ml-2.5 align-middle">{c.klass}</span>
            </h3>
            <span className="tnum shrink-0 font-serif text-lg text-ivory">
              {c.average}
            </span>
          </div>

          {/* One bar per class, scaled between the weakest and strongest. */}
          <div
            aria-hidden="true"
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-board-700"
          >
            <div
              className="animate-bar h-full rounded-full bg-gold/70"
              style={{
                width: `${Math.max(6, ((c.average - min) / (max - min || 1)) * 100)}%`,
              }}
            />
          </div>

          <p className="mt-2 text-meta text-ivory-3">
            {c.players.length} მოთამაშე, საუკეთესო{" "}
            <a
              href={`#/player/${c.best.id}`}
              className="inline-flex min-h-11 items-center text-gold-soft underline-offset-4 hover:underline"
            >
              {c.best.name}
            </a>
          </p>
        </li>
      ))}
    </ol>
  );
}

export function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 shrink-0 scroll-ml-4 whitespace-nowrap rounded-lg border px-3.5 text-sm transition-colors [scroll-snap-align:start] ${
        active
          ? "border-gold bg-gold-dim/30 text-ivory"
          : "border-board-600 text-ivory-3 hover:text-ivory-2"
      }`}
    >
      {children}
    </button>
  );
}

export function Empty({ title, body }) {
  return (
    <div className="sheet px-4 py-10 text-center">
      <h3 className="font-serif text-lg text-ivory">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-ivory-2">{body}</p>
    </div>
  );
}
