import { Trophy } from "lucide-react";
import { Empty } from "./LeaderboardView.jsx";
import { formatDate } from "../lib/georgian.js";

/**
 * Brackets and past winners.
 *
 * A knockout is a tree, so it is drawn as one: rounds as columns that
 * scroll sideways on a phone, each match a small card with the winner's
 * line carried in gold. Nothing here is a generic card grid.
 */
export default function TournamentsView({ state, onPlayer }) {
  const live = state.tournaments.filter((t) => t.status === "live");
  const past = state.tournaments
    .filter((t) => t.status !== "live")
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

  if (state.tournaments.length === 0) {
    return (
      <div className="px-4 pt-6">
        <Empty
          title="ტურნირი ჯერ არ არის"
          body="როგორც კი დაიწყება, ბადე აქ გამოჩნდება."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 px-4 pt-6">
      {live.map((t) => (
        <section key={t.id}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold text-ivory">
              {t.name}
            </h2>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-meta text-gold-soft">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-gold"
              />
              მიმდინარე
            </span>
          </div>
          <p className="mt-0.5 text-sm text-ivory-3">
            {t.format}, დაიწყო {formatDate(t.startedAt)}
          </p>

          <div className="rail -mx-4 mt-3 flex gap-3 px-4 pb-2">
            {t.rounds.map((round) => (
              <div
                key={round.name}
                className="w-[232px] shrink-0 scroll-ml-4 [scroll-snap-align:start]"
              >
                <h3 className="mb-2 font-serif text-base text-ivory-2">
                  {round.name}
                </h3>
                <ul className="flex flex-col gap-2">
                  {round.matches.map((m, i) => (
                    <li key={i} className="sheet overflow-hidden">
                      <MatchSide
                        id={m.a}
                        state={state}
                        winner={m.winner}
                        onPlayer={onPlayer}
                      />
                      <div className="h-px bg-rule" />
                      <MatchSide
                        id={m.b}
                        state={state}
                        winner={m.winner}
                        onPlayer={onPlayer}
                      />
                      <p className="tnum border-t border-rule px-3 py-1.5 text-meta text-ivory-3">
                        {m.score ?? "ჯერ არ ჩატარებულა"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}

      {past.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold text-ivory">
            დასრულებული ტურნირები
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {past.map((t) => {
              const winner = state.playersById[t.winnerId];
              const second = state.playersById[t.runnerUpId];
              return (
                <li key={t.id} className="sheet px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-serif text-lg text-ivory">{t.name}</h3>
                    <span className="tnum shrink-0 text-meta text-ivory-3">
                      {formatDate(t.startedAt, { short: true, year: true })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-meta text-ivory-3">{t.format}</p>

                  {winner && (
                    <p className="mt-2 inline-flex items-center gap-2 text-base">
                      <Trophy
                        size={16}
                        strokeWidth={1.75}
                        aria-hidden="true"
                        className="shrink-0 text-gold"
                      />
                      <a
                        href={`#/player/${winner.id}`}
                        className="inline-flex min-h-11 items-center text-ivory underline-offset-4 hover:underline"
                      >
                        {winner.name}
                      </a>
                    </p>
                  )}
                  {second && (
                    <p className="mt-0.5 pl-6 text-meta text-ivory-3">
                      მეორე ადგილი — {second.name}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function MatchSide({ id, state, winner, onPlayer }) {
  const p = state.playersById[id];
  const won = winner && winner === id;
  const lost = winner && winner !== id;

  return (
    <button
      type="button"
      onClick={() => p && onPlayer(p.id)}
      className={`flex min-h-11 w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-board-700/60 ${
        lost ? "opacity-55" : ""
      }`}
    >
      {/* The winner's line is carried by a gold rule, not a badge. */}
      <span
        aria-hidden="true"
        className={`h-5 w-[2px] shrink-0 rounded-full ${
          won ? "bg-gold" : "bg-board-600"
        }`}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-ivory">
        {p?.name ?? "—"}
      </span>
      {won && <span className="sr-only">გამარჯვებული</span>}
    </button>
  );
}
