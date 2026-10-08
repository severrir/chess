import { ArrowLeft, Award, Crown, Flame, Medal, Sparkles } from "lucide-react";
import RatingSpark from "./RatingSpark.jsx";
import { Rank } from "./HomeView.jsx";
import { Empty } from "./LeaderboardView.jsx";
import { START_RATING, gameTypeName, scoreLine } from "../lib/elo.js";
import { formatDate } from "../lib/georgian.js";

/**
 * One player: where they stand, how they got there, and what they have to
 * show for it. Achievements are derived from the game log rather than
 * awarded by hand, so nobody has to remember to grant them.
 */
export default function PlayerView({ state, playerId, onBack, onPlayer }) {
  const p = state.playersById[playerId];
  if (!p) {
    return (
      <div className="px-4 pt-6">
        <BackButton onBack={onBack} />
        <Empty
          title="მოთამაშე ვერ ვიპოვე"
          body="შესაძლოა ჩანაწერი წაშლილია."
        />
      </div>
    );
  }

  const games = state.games.filter(
    (g) => g.whiteId === p.id || g.blackId === p.id,
  );
  const peak = Math.max(...p.history.map((h) => h.rating));
  const delta = p.rating - START_RATING;
  const beatKing =
    state.king &&
    state.king.id !== p.id &&
    games.some(
      (g) =>
        (g.result === 1 && g.whiteId === p.id && g.blackId === state.king.id) ||
        (g.result === 0 && g.blackId === p.id && g.whiteId === state.king.id),
    );

  const achievements = [
    p.rank === 1 && {
      icon: Crown,
      label: "სკოლის მეფე",
      note: "ამჟამად ლიდერობს",
    },
    p.bestStreak >= 5 && {
      icon: Flame,
      label: `${p.bestStreak} მოგებიანი სერია`,
      note: "ზედიზედ მოგებები",
    },
    beatKing && {
      icon: Medal,
      label: "დაამარცხა მეფე",
      note: "მოიგო ლიდერთან",
    },
    p.games > 0 && {
      icon: Sparkles,
      label: "პირველი ტურნირი",
      note: "კლუბის წევრი",
    },
    peak >= 1200 && {
      icon: Award,
      label: `პიკი ${peak}`,
      note: "საუკეთესო რეიტინგი",
    },
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6 px-4 pt-4">
      <BackButton onBack={onBack} />

      <header className="animate-settle">
        <div className="flex items-start gap-3">
          <Rank rank={p.rank} />
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-semibold text-ivory">
              {p.name}
            </h1>
            <p className="text-sm text-ivory-2">{p.klass}</p>
          </div>
        </div>

        <dl className="tnum mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-rule bg-board-600/40">
          <Stat label="რეიტინგი" value={p.rating} accent />
          <Stat label="პარტია" value={p.games} />
          <Stat
            label="ცვლილება"
            value={`${delta >= 0 ? "+" : "−"}${Math.abs(delta)}`}
          />
        </dl>
      </header>

      <section>
        <h2 className="font-serif text-xl font-semibold text-ivory">
          რეიტინგის დინამიკა
        </h2>
        <div className="sheet mt-2 px-3 py-3">
          <RatingSpark history={p.history} start={START_RATING} />
          <p className="tnum mt-1 flex justify-between text-meta text-ivory-3">
            <span>დასაწყისი {START_RATING}</span>
            <span>პიკი {peak}</span>
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-ivory">
          მიღწევები
        </h2>
        {achievements.length === 0 ? (
          <p className="mt-2 text-sm text-ivory-2">
            ჯერ არაფერი. პირველი პარტია საწყისია.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {achievements.map((a) => {
              const Icon = a.icon;
              return (
                <li
                  key={a.label}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-board-600 bg-board-800 px-3 py-1.5"
                >
                  <Icon
                    size={15}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="shrink-0 text-gold"
                  />
                  <span>
                    <span className="block text-sm text-ivory">{a.label}</span>
                    <span className="block text-meta text-ivory-3">
                      {a.note}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-ivory">
          პარტიები
          <span className="tnum ml-2 text-base font-normal text-ivory-3">
            {games.length}
          </span>
        </h2>

        {games.length === 0 ? (
          <p className="mt-2 text-sm text-ivory-2">ჯერ არ უთამაშია.</p>
        ) : (
          <ul className="sheet mt-2 divide-y divide-rule">
            {games.map((g) => {
              const white = g.whiteId === p.id;
              const opponent =
                state.playersById[white ? g.blackId : g.whiteId];
              const score = white ? g.result : 1 - g.result;
              const tone =
                score === 1
                  ? "text-win"
                  : score === 0
                    ? "text-loss"
                    : "text-ivory-2";
              const word =
                score === 1 ? "მოგება" : score === 0 ? "წაგება" : "ფრე";
              const diff = g._delta?.[white ? "white" : "black"] ?? 0;

              return (
                <li key={g.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    aria-hidden="true"
                    title={white ? "თეთრები" : "შავები"}
                    className={`size-3 shrink-0 rounded-full border ${
                      white
                        ? "border-ivory-2 bg-ivory"
                        : "border-ivory-3 bg-board-900"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <a
                      href={opponent ? `#/player/${opponent.id}` : undefined}
                      className="flex min-h-11 items-center truncate text-base text-ivory no-underline"
                    >
                      {opponent?.name ?? "—"}
                    </a>
                    <span className="block text-meta text-ivory-3">
                      {gameTypeName(g.type)}, {formatDate(g.playedAt, { short: true })}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className={`tnum block font-serif text-base ${tone}`}>
                      {scoreLine(g.result)}
                    </span>
                    <span className="tnum block text-meta text-ivory-3">
                      {word} {diff >= 0 ? "+" : "−"}
                      {Math.abs(diff)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent = false }) {
  return (
    <div className="bg-board-800 px-3 py-3">
      <dt className="text-meta text-ivory-3">{label}</dt>
      <dd
        className={`font-serif text-xl ${accent ? "text-gold" : "text-ivory"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function BackButton({ onBack }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-ivory-2 transition-colors hover:text-ivory"
    >
      <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
      უკან
    </button>
  );
}
