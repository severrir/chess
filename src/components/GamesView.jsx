import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Empty, Pill } from "./LeaderboardView.jsx";
import { GAME_TYPES, gameTypeName, scoreLine } from "../lib/elo.js";
import { formatDate, formatTime } from "../lib/georgian.js";

/**
 * Every game the club has played, newest first.
 *
 * Results are written the way a scoresheet writes them — 1–0, ½–½, 0–1 —
 * rather than as coloured win/loss chips, because that notation already
 * says who had white and who won in three characters.
 */
export default function GamesView({ state, onPlayer }) {
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.games.filter((g) => {
      if (type !== "all" && g.type !== type) return false;
      if (!q) return true;
      const w = state.playersById[g.whiteId]?.name.toLowerCase() ?? "";
      const b = state.playersById[g.blackId]?.name.toLowerCase() ?? "";
      return w.includes(q) || b.includes(q);
    });
  }, [state.games, state.playersById, type, query]);

  // Group by day so a blitz afternoon reads as one session.
  const groups = useMemo(() => {
    const out = [];
    for (const g of rows) {
      const key = formatDate(g.playedAt, { year: true });
      const last = out.at(-1);
      if (last?.key === key) last.items.push(g);
      else out.push({ key, items: [g] });
    }
    return out;
  }, [rows]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
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
          aria-label="პარტიების ძებნა მოთამაშით"
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
        <Pill active={type === "all"} onClick={() => setType("all")}>
          ყველა
        </Pill>
        {GAME_TYPES.map((t) => (
          <Pill key={t.id} active={type === t.id} onClick={() => setType(t.id)}>
            {t.name}
          </Pill>
        ))}
      </div>

      <p className="tnum text-sm text-ivory-3">სულ {rows.length} პარტია</p>

      {rows.length === 0 ? (
        <Empty
          title="პარტია ვერ ვიპოვე"
          body="სცადე სხვა სახელი ან სხვა ტიპი."
        />
      ) : (
        groups.map((group) => (
          <section key={group.key}>
            <h2 className="tnum mb-2 font-serif text-base text-ivory-2">
              {group.key}
            </h2>
            <ul className="sheet divide-y divide-rule">
              {group.items.map((g) => {
                const w = state.playersById[g.whiteId];
                const b = state.playersById[g.blackId];
                return (
                  <li key={g.id} className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="min-w-0 flex-1">
                        <Side player={w} white onPlayer={onPlayer} />
                        <Side player={b} onPlayer={onPlayer} />
                      </span>
                      <span className="tnum shrink-0 text-right">
                        <span className="block font-serif text-lg text-ivory">
                          {scoreLine(g.result)}
                        </span>
                        <span className="block text-meta text-ivory-3">
                          {formatTime(g.playedAt)}
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 text-meta text-ivory-3">
                      {gameTypeName(g.type)}
                      {g.note ? `, ${g.note}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

/** A disc shows the colour; the notation already shows the outcome. */
function Side({ player, white = false, onPlayer }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`size-2.5 shrink-0 rounded-full border ${
          white ? "border-ivory-2 bg-ivory" : "border-ivory-3 bg-board-900"
        }`}
      />
      <a
        href={player ? `#/player/${player.id}` : undefined}
        className="flex min-h-11 min-w-0 flex-1 items-center truncate text-sm text-ivory no-underline"
      >
        {player?.name ?? "—"}
      </a>
      <span className="sr-only">{white ? "თეთრები" : "შავები"}</span>
    </span>
  );
}
