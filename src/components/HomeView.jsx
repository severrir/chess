import { ChevronRight, Crown, MapPin, Swords } from "lucide-react";
import { scoreLine, gameTypeName } from "../lib/elo.js";
import {
  daysSince,
  describeWhen,
  formatDate,
  formatTime,
  relativeAgo,
} from "../lib/georgian.js";

/**
 * The opening answer to the only question the club actually argues about:
 * who is the king right now, and how long have they survived.
 *
 * The crown is the one place gold is used at size. Everything beneath it
 * is quiet so that it reads as the single loud thing on the page.
 */
export default function HomeView({ state, onPlayer, onView }) {
  const { king, players, games, events } = state;
  const top = players.slice(0, 10);
  const recent = games.slice(0, 5);
  const next = [...events]
    .filter((e) => !describeWhen(e.startsAt).past)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0];

  return (
    <div className="flex flex-col gap-7">
      {/* ---- The crown ---- */}
      {king && (
        <section className="animate-crown px-4 pt-6">
          <p className="text-sm text-ivory-3">სკოლის მეფე</p>
          <a
            href={`#/player/${king.id}`}
            className="mt-1 block w-full text-left no-underline"
          >
            <span className="flex items-start gap-3">
              <Crown
                size={34}
                strokeWidth={1.4}
                aria-hidden="true"
                className="mt-1 shrink-0 text-gold"
              />
              <span className="min-w-0">
                <span className="block font-serif text-2xl font-semibold text-ivory sm:text-3xl">
                  {king.name}
                </span>
                <span className="tnum mt-0.5 block text-base text-ivory-2">
                  {king.klass}, რეიტინგი {king.rating}
                </span>
              </span>
            </span>
          </a>

          <dl className="tnum mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-rule bg-board-600/40">
            <div className="bg-board-800 px-4 py-3">
              <dt className="text-meta text-ivory-3">ტახტზე</dt>
              <dd className="font-serif text-xl text-gold">
                {king.reignFrom ? `${daysSince(king.reignFrom)} დღე` : "ახალი"}
              </dd>
            </div>
            <div className="bg-board-800 px-4 py-3">
              <dt className="text-meta text-ivory-3">მოგერიებული</dt>
              <dd className="font-serif text-xl text-ivory">{king.beaten}</dd>
            </div>
          </dl>
        </section>
      )}

      {/* ---- Next event ---- */}
      {next && (
        <section className="px-4">
          <SectionHead title="შემდეგი" onMore={() => onView("events")} />
          <article className="sheet mt-2 px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-lg text-ivory">{next.title}</h3>
              <span className="shrink-0 text-sm font-semibold text-gold-soft">
                {describeWhen(next.startsAt).label}
              </span>
            </div>
            <p className="tnum mt-1 text-sm text-ivory-2">
              {formatDate(next.startsAt)}, {formatTime(next.startsAt)}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-meta text-ivory-3">
              <MapPin size={13} strokeWidth={1.75} aria-hidden="true" />
              {next.location}
            </p>
          </article>
        </section>
      )}

      {/* ---- Leaderboard preview ---- */}
      <section className="px-4">
        <SectionHead title="ტოპ 10" onMore={() => onView("leaderboard")} />
        <ol className="sheet mt-2 divide-y divide-rule">
          {top.map((p) => (
            <li key={p.id}>
              <a
                href={`#/player/${p.id}`}
                className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left no-underline transition-colors hover:bg-board-700/60"
              >
                <Rank rank={p.rank} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base text-ivory">
                    {p.name}
                  </span>
                  <span className="block text-meta text-ivory-3">{p.klass}</span>
                </span>
                <span className="tnum shrink-0 font-serif text-lg text-ivory">
                  {p.rating}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- Recent games ---- */}
      <section className="px-4">
        <SectionHead title="ბოლო პარტიები" onMore={() => onView("games")} />
        <ul className="sheet mt-2 divide-y divide-rule">
          {recent.map((g) => {
            const w = state.playersById[g.whiteId];
            const b = state.playersById[g.blackId];
            if (!w || !b) return null;
            return (
              <li key={g.id} className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Swords
                    size={14}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="shrink-0 text-ivory-3"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-ivory">
                    {w.name} — {b.name}
                  </span>
                  <span className="tnum shrink-0 font-serif text-base text-ivory">
                    {scoreLine(g.result)}
                  </span>
                </div>
                <p className="mt-0.5 pl-6 text-meta text-ivory-3">
                  {gameTypeName(g.type)}, {relativeAgo(g.playedAt)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function SectionHead({ title, onMore }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-serif text-xl font-semibold text-ivory">{title}</h2>
      {onMore && (
        <button
          type="button"
          onClick={onMore}
          className="inline-flex min-h-11 items-center gap-0.5 text-sm text-gold-soft"
        >
          ყველა
          <ChevronRight size={15} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Top three carry metal; everyone else just carries their number. */
export function Rank({ rank }) {
  const metal =
    rank === 1
      ? "border-gold text-gold"
      : rank === 2
        ? "border-silver text-silver"
        : rank === 3
          ? "border-bronze text-bronze"
          : "border-board-600 text-ivory-3";
  return (
    <span
      className={`tnum grid size-8 shrink-0 place-items-center rounded-full border text-sm ${metal}`}
    >
      {rank}
    </span>
  );
}
