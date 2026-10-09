import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Trophy,
  UserPlus,
  CalendarPlus,
  RotateCcw,
} from "lucide-react";
import { Field, inputClass } from "./Sheet.jsx";
import { Pill } from "./LeaderboardView.jsx";
import {
  GAME_TYPES,
  RESULT_OPTIONS,
  expectedScore,
  nextRatings,
  scoreLine,
} from "../lib/elo.js";
import {
  BRACKET_SIZES,
  SCORES,
  buildBracket,
  recordMatch,
  roundNames,
} from "../lib/bracket.js";
import {
  addEvent,
  addGame,
  addPlayer,
  addTournament,
  removeEvent,
  removeGame,
  removePlayer,
  removeTournament,
  resetAll,
  updateTournament,
} from "../lib/store.js";
import {
  formatDate,
  fromLocalInputValue,
  toLocalInputValue,
} from "../lib/georgian.js";

/**
 * The admin panel, built for a phone held in one hand at the edge of a
 * tournament hall: three tabs, large targets, and no modal in the way.
 *
 * Ratings are never typed. Entering a result recomputes the whole ladder
 * from the game log, and the form shows what the result will cost or earn
 * before it is saved.
 */
export default function AdminView({ state, onToast }) {
  const [tab, setTab] = useState("game");

  return (
    <div className="flex flex-col gap-5 px-4 pt-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ivory">
          ადმინისტრირება
        </h1>
        <p className="mt-1 text-sm text-ivory-2">
          რეიტინგი ავტომატურად გადაითვლება ყოველი შედეგის შემდეგ.
        </p>
      </div>

      <div className="rail -mx-4 flex gap-1 px-4 pb-1">
        <Pill active={tab === "game"} onClick={() => setTab("game")}>
          პარტია
        </Pill>
        <Pill active={tab === "player"} onClick={() => setTab("player")}>
          მოთამაშე
        </Pill>
        <Pill active={tab === "event"} onClick={() => setTab("event")}>
          ღონისძიება
        </Pill>
        <Pill active={tab === "tournament"} onClick={() => setTab("tournament")}>
          ტურნირი
        </Pill>
      </div>

      {tab === "game" && <GameForm state={state} onToast={onToast} />}
      {tab === "player" && <PlayerForm state={state} onToast={onToast} />}
      {tab === "event" && <EventForm state={state} onToast={onToast} />}
      {tab === "tournament" && (
        <TournamentPanel state={state} onToast={onToast} />
      )}

      <section className="mt-2 border-t border-rule pt-4">
        <h2 className="font-serif text-base text-ivory-2">საშიში ზონა</h2>
        <button
          type="button"
          onClick={() => {
            resetAll();
            onToast("ყველაფერი დაბრუნდა საწყის მდგომარეობაში");
          }}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg border border-board-600 px-3.5 text-sm text-loss transition-colors hover:bg-board-700"
        >
          <RotateCcw size={15} strokeWidth={1.75} />
          საწყის მდგომარეობაზე დაბრუნება
        </button>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Games
 * ---------------------------------------------------------------- */

function GameForm({ state, onToast }) {
  const players = state.players;
  const [whiteId, setWhiteId] = useState(players[0]?.id ?? "");
  const [blackId, setBlackId] = useState(players[1]?.id ?? "");
  const [result, setResult] = useState(1);
  const [type, setType] = useState("blitz");
  const [playedAt, setPlayedAt] = useState(toLocalInputValue(new Date()));
  const [error, setError] = useState(null);

  const white = state.playersById[whiteId];
  const black = state.playersById[blackId];

  // What this result will do to both ratings, before it is committed.
  const preview =
    white && black && white.id !== black.id
      ? nextRatings(white, black, Number(result))
      : null;

  function submit(e) {
    e.preventDefault();
    if (!whiteId || !blackId || whiteId === blackId) {
      setError("აირჩიე ორი სხვადასხვა მოთამაშე.");
      return;
    }
    const at = fromLocalInputValue(playedAt);
    if (!at || Number.isNaN(at.getTime())) {
      setError("თარიღი არასწორია.");
      return;
    }
    save();

    async function save() {
      try {
        await addGame({
          whiteId,
          blackId,
          result: Number(result),
          type,
          playedAt: at.toISOString(),
          note: null,
        });
        setError(null);
        onToast(`პარტია დაემატა — ${scoreLine(Number(result))}`);
      } catch {
        setError("ვერ შევინახე. შეამოწმე კავშირი და უფლებები.");
      }
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="თეთრები">
        <select
          value={whiteId}
          onChange={(e) => setWhiteId(e.target.value)}
          className={inputClass}
        >
          {players.map((p) => (
            <option key={p.id} value={p.id} className="bg-board-700">
              {p.name} ({p.rating})
            </option>
          ))}
        </select>
      </Field>

      <Field label="შავები">
        <select
          value={blackId}
          onChange={(e) => setBlackId(e.target.value)}
          className={inputClass}
        >
          {players.map((p) => (
            <option key={p.id} value={p.id} className="bg-board-700">
              {p.name} ({p.rating})
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm text-ivory-2">შედეგი</legend>
        <div className="grid grid-cols-3 gap-2">
          {RESULT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={Number(result) === o.value}
              onClick={() => setResult(o.value)}
              className={`min-h-14 rounded-lg border px-2 transition-colors ${
                Number(result) === o.value
                  ? "border-gold bg-gold-dim/30 text-ivory"
                  : "border-board-600 text-ivory-2 hover:bg-board-700"
              }`}
            >
              <span className="tnum block font-serif text-lg">{o.label}</span>
              <span className="block text-[10px] leading-tight text-ivory-3">
                {o.description}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {preview && (
        <div className="tnum sheet px-3 py-2.5 text-sm">
          <p className="text-meta text-ivory-3">
            მოსალოდნელი შედეგი თეთრებისთვის{" "}
            {(expectedScore(white.rating, black.rating) * 100).toFixed(0)}%
          </p>
          <p className="mt-1 text-ivory">
            {white.name}: {white.rating} →{" "}
            <Delta from={white.rating} to={preview.white} />
          </p>
          <p className="text-ivory">
            {black.name}: {black.rating} →{" "}
            <Delta from={black.rating} to={preview.black} />
          </p>
        </div>
      )}

      <Field label="ტიპი">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputClass}
        >
          {GAME_TYPES.map((t) => (
            <option key={t.id} value={t.id} className="bg-board-700">
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="როდის">
        <input
          type="datetime-local"
          value={playedAt}
          onChange={(e) => setPlayedAt(e.target.value)}
          className={inputClass}
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-loss">
          {error}
        </p>
      )}

      <Submit icon={Plus}>პარტიის დამატება</Submit>

      <RecentList
        title="ბოლო პარტიები"
        items={state.games.slice(0, 6).map((g) => ({
          id: g.id,
          main: `${state.playersById[g.whiteId]?.name ?? "—"} — ${
            state.playersById[g.blackId]?.name ?? "—"
          }`,
          meta: `${scoreLine(g.result)}, ${formatDate(g.playedAt, { short: true })}`,
          onRemove: () => {
            removeGame(g.id)
              .then(() => onToast("პარტია წაიშალა"))
              .catch(() => onToast("ვერ წავშალე", { tone: "error" }));
          },
        }))}
      />
    </form>
  );
}

function Delta({ from, to }) {
  const d = to - from;
  return (
    <span className={d >= 0 ? "text-win" : "text-loss"}>
      {to} ({d >= 0 ? "+" : "−"}
      {Math.abs(d)})
    </span>
  );
}

/* ---------------------------------------------------------------- *
 * Players
 * ---------------------------------------------------------------- */

function PlayerForm({ state, onToast }) {
  const [name, setName] = useState("");
  const [klass, setKlass] = useState("");
  const [error, setError] = useState(null);

  function submit(e) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("სახელი აუცილებელია.");
      return;
    }
    if (!klass.trim()) {
      setError("კლასი აუცილებელია.");
      return;
    }
    addPlayer({ name: name.trim(), klass: klass.trim() })
      .then(() => {
        setName("");
        setKlass("");
        setError(null);
        onToast("მოთამაშე დაემატა, რეიტინგი 1000");
      })
      .catch(() => setError("ვერ შევინახე. შეამოწმე კავშირი და უფლებები."));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="სახელი და გვარი">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ნიკა ბერიძე"
          maxLength={60}
          className={inputClass}
        />
      </Field>

      <Field label="კლასი" hint="მაგალითად IX-ბ">
        <input
          type="text"
          value={klass}
          onChange={(e) => setKlass(e.target.value)}
          placeholder="IX-ბ"
          maxLength={10}
          className={inputClass}
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-loss">
          {error}
        </p>
      )}

      <Submit icon={UserPlus}>მოთამაშის დამატება</Submit>

      <RecentList
        title="მოთამაშეები"
        items={state.players.map((p) => ({
          id: p.id,
          main: p.name,
          meta: `${p.klass}, რეიტინგი ${p.rating}`,
          onRemove: () => {
            removePlayer(p.id)
              .then(() => onToast("მოთამაშე და მისი პარტიები წაიშალა"))
              .catch(() => onToast("ვერ წავშალე", { tone: "error" }));
          },
        }))}
      />
    </form>
  );
}

/* ---------------------------------------------------------------- *
 * Events
 * ---------------------------------------------------------------- */

function EventForm({ state, onToast }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("ბლიცი");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [startsAt, setStartsAt] = useState(toLocalInputValue(new Date()));
  const [error, setError] = useState(null);

  function submit(e) {
    e.preventDefault();
    if (title.trim().length < 2) {
      setError("დასახელება აუცილებელია.");
      return;
    }
    const at = fromLocalInputValue(startsAt);
    if (!at || Number.isNaN(at.getTime())) {
      setError("თარიღი არასწორია.");
      return;
    }
    addEvent({
      title: title.trim(),
      kind,
      location: location.trim() || "სკოლა",
      note: note.trim() || null,
      startsAt: at.toISOString(),
    })
      .then(() => {
        setTitle("");
        setLocation("");
        setNote("");
        setError(null);
        onToast("ღონისძიება დაემატა");
      })
      .catch(() => setError("ვერ შევინახე. შეამოწმე კავშირი და უფლებები."));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="დასახელება">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ბლიცის ოთხშაბათი"
          maxLength={80}
          className={inputClass}
        />
      </Field>

      <Field label="ტიპი">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className={inputClass}
        >
          {["ბლიცი", "ტურნირი", "მატჩი", "ვარჯიში"].map((k) => (
            <option key={k} value={k} className="bg-board-700">
              {k}
            </option>
          ))}
        </select>
      </Field>

      <Field label="ადგილი">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="სააქტო დარბაზი"
          maxLength={60}
          className={inputClass}
        />
      </Field>

      <Field label="როდის">
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="შენიშვნა" optional>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="დროის კონტროლი, ვის შეუძლია მონაწილეობა…"
          maxLength={300}
          className={`${inputClass} resize-y py-2.5`}
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-loss">
          {error}
        </p>
      )}

      <Submit icon={CalendarPlus}>ღონისძიების დამატება</Submit>

      <RecentList
        title="ღონისძიებები"
        items={state.events.map((e) => ({
          id: e.id,
          main: e.title,
          meta: formatDate(e.startsAt, { short: true }),
          onRemove: () => {
            removeEvent(e.id)
              .then(() => onToast("ღონისძიება წაიშალა"))
              .catch(() => onToast("ვერ წავშალე", { tone: "error" }));
          },
        }))}
      />
    </form>
  );
}

/* ---------------------------------------------------------------- *
 * Tournaments — draw a bracket, then fill it in as it is played
 * ---------------------------------------------------------------- */

function TournamentPanel({ state, onToast }) {
  const live = state.tournaments.filter((t) => t.status === "live");
  const [openId, setOpenId] = useState(live[0]?.id ?? "");
  const current = live.find((t) => t.id === openId) ?? live[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      {current ? (
        <section>
          {live.length > 1 && (
            <Field label="ტურნირი">
              <select
                value={current.id}
                onChange={(e) => setOpenId(e.target.value)}
                className={inputClass}
              >
                {live.map((t) => (
                  <option key={t.id} value={t.id} className="bg-board-700">
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <BracketEditor
            key={current.id}
            state={state}
            tournament={current}
            onToast={onToast}
          />
        </section>
      ) : (
        <p className="sheet px-4 py-6 text-center text-sm text-ivory-2">
          მიმდინარე ტურნირი არ არის — დახაზე ახალი ბადე ქვემოთ.
        </p>
      )}

      <NewTournamentForm state={state} onToast={onToast} />

      <RecentList
        title="ტურნირები"
        items={state.tournaments.map((t) => ({
          id: t.id,
          main: t.name,
          meta:
            t.status === "live"
              ? `მიმდინარე, ${formatDate(t.startedAt, { short: true })}`
              : `გამარჯვებული ${state.playersById[t.winnerId]?.name ?? "—"}`,
          onRemove: () => {
            removeTournament(t.id)
              .then(() => onToast("ტურნირი წაიშალა"))
              .catch(() => onToast("ვერ წავშალე", { tone: "error" }));
          },
        }))}
      />
    </div>
  );
}

/**
 * The bracket, one round under the next. Tapping a name declares the
 * winner and carries them down immediately — the public page is reading
 * the same rounds, so the bracket is live in the plainest sense.
 */
function BracketEditor({ state, tournament, onToast }) {
  const [scores, setScores] = useState({});
  const [busy, setBusy] = useState(false);

  const rounds = tournament.rounds ?? [];

  async function pick(ri, mi, winnerId) {
    const key = `${ri}-${mi}`;
    const next = recordMatch(
      rounds,
      ri,
      mi,
      winnerId,
      scores[key] ?? SCORES[0],
    );
    setBusy(true);
    try {
      await updateTournament(tournament.id, {
        rounds: next.rounds,
        status: next.status,
        winnerId: next.winnerId,
        runnerUpId: next.runnerUpId,
      });
      onToast(
        next.status === "finished"
          ? `ტურნირი დასრულდა — ${state.playersById[next.winnerId]?.name ?? ""}`
          : "ბადე განახლდა",
      );
    } catch {
      onToast("ვერ შევინახე. შეამოწმე კავშირი და უფლებები.", {
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  if (rounds.length === 0) {
    return (
      <p className="sheet mt-3 px-4 py-6 text-center text-sm text-ivory-2">
        ამ ტურნირს ბადე არ აქვს.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-5">
      {rounds.map((round, ri) => (
        <section key={round.name}>
          <h2 className="font-serif text-base text-ivory-2">{round.name}</h2>

          <ul className="mt-2 flex flex-col gap-2">
            {round.matches.map((m, mi) => {
              const key = `${ri}-${mi}`;
              const ready = Boolean(m.a && m.b);
              return (
                <li key={key} className="sheet overflow-hidden">
                  {["a", "b"].map((side, i) => {
                    const pid = m[side];
                    const p = state.playersById[pid];
                    const won = m.winner && m.winner === pid;
                    return (
                      <div key={side}>
                        {i === 1 && <div className="h-px bg-rule" />}
                        <button
                          type="button"
                          disabled={!ready || busy}
                          onClick={() => pick(ri, mi, pid)}
                          aria-pressed={Boolean(won)}
                          className={`flex min-h-12 w-full items-center gap-2 px-3 text-left transition-colors disabled:opacity-50 ${
                            m.winner && !won ? "opacity-55" : ""
                          } ${ready ? "hover:bg-board-700/60" : ""}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`h-5 w-[2px] shrink-0 rounded-full ${
                              won ? "bg-gold" : "bg-board-600"
                            }`}
                          />
                          <span className="min-w-0 flex-1 truncate text-sm text-ivory">
                            {p?.name ?? "ელოდება"}
                          </span>
                          {p && (
                            <span className="tnum shrink-0 text-meta text-ivory-3">
                              {p.rating}
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}

                  <div className="flex items-center gap-2 border-t border-rule px-3 py-2">
                    {m.winner ? (
                      <>
                        <span className="tnum flex-1 text-meta text-ivory-3">
                          {m.score ?? "ჩაწერილია"}
                        </span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => pick(ri, mi, null)}
                          className="min-h-11 text-meta text-ivory-3 transition-colors hover:text-loss"
                        >
                          გაუქმება
                        </button>
                      </>
                    ) : (
                      <>
                        <label
                          htmlFor={`score-${key}`}
                          className="text-meta text-ivory-3"
                        >
                          ანგარიში
                        </label>
                        <select
                          id={`score-${key}`}
                          value={scores[key] ?? SCORES[0]}
                          onChange={(e) =>
                            setScores((s) => ({ ...s, [key]: e.target.value }))
                          }
                          disabled={!ready}
                          className="tnum min-h-11 rounded-lg border border-board-600 bg-transparent px-2 text-sm text-ivory"
                        >
                          {SCORES.map((s) => (
                            <option key={s} value={s} className="bg-board-700">
                              {s}
                            </option>
                          ))}
                        </select>
                        <span className="flex-1 text-right text-meta text-ivory-3">
                          {ready ? "აირჩიე გამარჯვებული" : "ელოდება"}
                        </span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function NewTournamentForm({ state, onToast }) {
  const [name, setName] = useState("");
  const [size, setSize] = useState(8);
  const [picked, setPicked] = useState([]);
  const [error, setError] = useState(null);

  // Strongest first, because the seeding pairs 1 against the lowest seed.
  const ladder = useMemo(
    () => [...state.players].sort((a, b) => b.rating - a.rating),
    [state.players],
  );

  const toggle = (id) =>
    setPicked((list) =>
      list.includes(id)
        ? list.filter((x) => x !== id)
        : list.length >= size
          ? list
          : [...list, id],
    );

  async function submit(e) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("დასახელება აუცილებელია.");
      return;
    }
    if (picked.length !== size) {
      setError(`აირჩიე ზუსტად ${size} მოთამაშე.`);
      return;
    }
    // Seed by rating, whatever order they were tapped in.
    const seeded = ladder.filter((p) => picked.includes(p.id)).map((p) => p.id);

    try {
      await addTournament({
        name: name.trim(),
        status: "live",
        format: `ნოკაუტი, ${size} მოთამაშე`,
        startedAt: new Date().toISOString(),
        rounds: buildBracket(seeded),
        winnerId: null,
        runnerUpId: null,
      });
      setName("");
      setPicked([]);
      setError(null);
      onToast("ბადე დაიხაზა");
    } catch {
      setError("ვერ შევინახე. შეამოწმე კავშირი და უფლებები.");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 border-t border-rule pt-5"
    >
      <h2 className="font-serif text-base text-ivory-2">ახალი ბადე</h2>

      <Field label="დასახელება">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="შემოდგომის ჩემპიონატი"
          maxLength={60}
          className={inputClass}
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm text-ivory-2">მონაწილეთა რიცხვი</legend>
        <div className="grid grid-cols-3 gap-2">
          {BRACKET_SIZES.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={size === n}
              onClick={() => {
                setSize(n);
                setPicked((list) => list.slice(0, n));
              }}
              className={`tnum min-h-12 rounded-lg border text-base transition-colors ${
                size === n
                  ? "border-gold bg-gold-dim/30 text-ivory"
                  : "border-board-600 text-ivory-2 hover:bg-board-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-meta text-ivory-3">
          {roundNames(size).join(" → ")}
        </p>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm text-ivory-2">
          მონაწილეები — არჩეულია {picked.length}/{size}
        </legend>
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-lg border border-board-600 p-1">
          {ladder.map((p) => {
            const on = picked.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(p.id)}
                className={`flex min-h-11 items-center gap-2 rounded-md px-2.5 text-left transition-colors ${
                  on ? "bg-gold-dim/30 text-ivory" : "text-ivory-2 hover:bg-board-700"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-4 shrink-0 place-items-center rounded-sm border ${
                    on ? "border-gold bg-gold" : "border-board-600"
                  }`}
                >
                  {on && (
                    <span className="block size-1.5 rounded-sm bg-board-900" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                <span className="tnum shrink-0 text-meta text-ivory-3">
                  {p.klass} · {p.rating}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-loss">
          {error}
        </p>
      )}

      <Submit icon={Trophy}>ბადის დახაზვა</Submit>
    </form>
  );
}

/* ---------------------------------------------------------------- *
 * Shared bits
 * ---------------------------------------------------------------- */

function Submit({ icon: Icon, children }) {
  return (
    <button
      type="submit"
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gold text-base font-semibold text-board-900 transition-opacity hover:opacity-90"
    >
      <Icon size={17} strokeWidth={2.2} />
      {children}
    </button>
  );
}

function RecentList({ title, items }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-2">
      <h2 className="mb-2 font-serif text-base text-ivory-2">{title}</h2>
      <ul className="sheet divide-y divide-rule">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-2 py-1.5 pl-3 pr-1.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ivory">
                {it.main}
              </span>
              <span className="tnum block text-meta text-ivory-3">
                {it.meta}
              </span>
            </span>
            <button
              type="button"
              onClick={it.onRemove}
              aria-label={`${it.main} — წაშლა`}
              className="grid size-11 shrink-0 place-items-center rounded-lg text-ivory-3 transition-colors hover:text-loss"
            >
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
