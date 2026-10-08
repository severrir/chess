/**
 * The club's data.
 *
 * Everything lives in localStorage behind one small reactive store, so the
 * site runs with no backend at all. `backend.js` can swap the persistence
 * layer for Firestore without any component changing — the shape of the
 * state and the actions below are the whole contract.
 *
 * Ratings are never stored as a separate truth: they are recomputed from
 * the full game list every time it changes, so a mistyped result can be
 * corrected and the ladder simply re-derives itself.
 */

import { START_RATING, nextRatings } from "./elo.js";
import { SEED } from "../data/seed.js";
import * as backend from "./backend.js";

export const isRemote = backend.isRemote;

const KEY = "chess.club.v1";

let state = null;
const listeners = new Set();

/* ---------------------------------------------------------------- *
 * Persistence
 * ---------------------------------------------------------------- */

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(SEED);
    const parsed = JSON.parse(raw);
    // Merge so a seed addition in a later version is not lost.
    return { ...structuredClone(SEED), ...parsed };
  } catch {
    return structuredClone(SEED);
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Out of quota or blocked storage: the session still works.
  }
}

function emit() {
  snapshot = null;
  for (const fn of listeners) fn();
}

/* ---------------------------------------------------------------- *
 * Derivation — ratings, records and the crown
 * ---------------------------------------------------------------- */

/**
 * Replays every game in date order to produce current ratings, win/loss
 * records and each player's rating history. Replaying rather than
 * incrementing means the ladder is always consistent with the game log.
 */
export function derive(raw) {
  const players = new Map(
    raw.players.map((p) => [
      p.id,
      {
        ...p,
        rating: START_RATING,
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        history: [{ at: null, rating: START_RATING }],
        streak: 0,
        bestStreak: 0,
      },
    ]),
  );

  const games = [...raw.games].sort(
    (a, b) => new Date(a.playedAt) - new Date(b.playedAt),
  );

  for (const g of games) {
    const w = players.get(g.whiteId);
    const b = players.get(g.blackId);
    if (!w || !b) continue;

    const before = { white: w.rating, black: b.rating };
    const next = nextRatings(w, b, g.result);

    w.rating = next.white;
    b.rating = next.black;
    w.games += 1;
    b.games += 1;

    if (g.result === 1) {
      w.wins += 1;
      b.losses += 1;
      w.streak += 1;
      b.streak = 0;
    } else if (g.result === 0) {
      b.wins += 1;
      w.losses += 1;
      b.streak += 1;
      w.streak = 0;
    } else {
      w.draws += 1;
      b.draws += 1;
      w.streak = 0;
      b.streak = 0;
    }

    w.bestStreak = Math.max(w.bestStreak, w.streak);
    b.bestStreak = Math.max(b.bestStreak, b.streak);
    w.history.push({ at: g.playedAt, rating: w.rating });
    b.history.push({ at: g.playedAt, rating: b.rating });

    // Kept on the game so a feed row can show what the result cost.
    g._delta = {
      white: next.white - before.white,
      black: next.black - before.black,
    };
  }

  const ranked = [...players.values()].sort(
    (a, b) =>
      b.rating - a.rating ||
      b.wins - a.wins ||
      a.name.localeCompare(b.name, "ka"),
  );
  ranked.forEach((p, i) => {
    p.rank = i + 1;
  });

  /* The crown: top of the ladder, and how long they have held it. The
     reign starts at the first game after which nobody has been above them. */
  const king = ranked[0] ?? null;
  let reignFrom = null;
  let beaten = 0;
  if (king) {
    const replay = new Map(raw.players.map((p) => [p.id, START_RATING]));
    const counts = new Map(raw.players.map((p) => [p.id, 0]));
    for (const g of games) {
      const w = { rating: replay.get(g.whiteId), games: counts.get(g.whiteId) };
      const b = { rating: replay.get(g.blackId), games: counts.get(g.blackId) };
      if (w.rating == null || b.rating == null) continue;
      const n = nextRatings(w, b, g.result);
      replay.set(g.whiteId, n.white);
      replay.set(g.blackId, n.black);
      counts.set(g.whiteId, w.games + 1);
      counts.set(g.blackId, b.games + 1);

      const leader = [...replay.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
      if (leader === king.id) {
        if (reignFrom === null) reignFrom = g.playedAt;
      } else {
        reignFrom = null;
      }
    }
    // Challenges beaten: wins since the reign began.
    beaten = games.filter(
      (g) =>
        reignFrom &&
        new Date(g.playedAt) >= new Date(reignFrom) &&
        ((g.result === 1 && g.whiteId === king.id) ||
          (g.result === 0 && g.blackId === king.id)),
    ).length;
  }

  /* Class standings: average rating, but only for classes with players. */
  const byClass = new Map();
  for (const p of ranked) {
    const row = byClass.get(p.klass) ?? {
      klass: p.klass,
      players: [],
      total: 0,
    };
    row.players.push(p);
    row.total += p.rating;
    byClass.set(p.klass, row);
  }
  const classes = [...byClass.values()]
    .map((c) => ({
      ...c,
      average: Math.round(c.total / c.players.length),
      best: c.players[0],
    }))
    .sort((a, b) => b.average - a.average);

  return {
    ...raw,
    players: ranked,
    playersById: Object.fromEntries(ranked.map((p) => [p.id, p])),
    games: [...games].reverse(), // newest first for the feed
    king: king ? { ...king, reignFrom, beaten } : null,
    classes,
  };
}

/* ---------------------------------------------------------------- *
 * Reading
 * ---------------------------------------------------------------- */

let snapshot = null;

/**
 * When Supabase is configured the club is loaded from it once at startup
 * and kept live by a realtime subscription. Until that first load lands,
 * the seeded season is shown rather than an empty page — and if the
 * network is down it simply stays, which beats a blank ladder.
 */
let hydrated = false;

export function hydrate() {
  if (!backend.isRemote || hydrated) return;
  hydrated = true;

  const pull = async () => {
    try {
      const remote = await backend.load();
      // An empty database would blank the club. Keep the seeded season on
      // screen until a real player exists, so the site is never a void.
      if (remote && remote.players.length > 0) {
        state = remote;
        persist();
        emit();
      }
    } catch (err) {
      console.error("[ჭადრაკი] ბაზა ვერ ჩაიტვირთა", err);
    }
  };

  pull();
  backend.watch(pull);
}

export function getState() {
  if (!state) state = read();
  if (!snapshot) snapshot = derive(state);
  return snapshot;
}

export function subscribe(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key === KEY) {
      state = read();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

/* ---------------------------------------------------------------- *
 * Writing — admin only; the UI gates these behind a sign-in
 * ---------------------------------------------------------------- */

const id = () =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random()}`;

function mutate(fn) {
  if (!state) state = read();
  fn(state);
  persist();
  emit();
}

export async function addPlayer(player) {
  if (backend.isRemote) {
    await backend.insertPlayer(player);
    return;
  }
  mutate((s) => {
    s.players.push({ id: id(), joinedAt: new Date().toISOString(), ...player });
  });
}

export const updatePlayer = (playerId, patch) =>
  mutate((s) => {
    const p = s.players.find((x) => x.id === playerId);
    if (p) Object.assign(p, patch);
  });

export async function removePlayer(playerId) {
  if (backend.isRemote) {
    // The foreign keys cascade, so the games go with the player.
    await backend.removeRow("chess_players", playerId);
    return;
  }
  mutate((s) => {
    s.players = s.players.filter((p) => p.id !== playerId);
    s.games = s.games.filter(
      (g) => g.whiteId !== playerId && g.blackId !== playerId,
    );
  });
}

export async function addGame(game) {
  if (backend.isRemote) {
    await backend.insertGame(game);
    return;
  }
  mutate((s) => {
    s.games.push({ id: id(), ...game });
  });
}

export async function removeGame(gameId) {
  if (backend.isRemote) {
    await backend.removeRow("chess_games", gameId);
    return;
  }
  mutate((s) => {
    s.games = s.games.filter((g) => g.id !== gameId);
  });
}

export async function addEvent(event) {
  if (backend.isRemote) {
    await backend.insertEvent(event);
    return;
  }
  mutate((s) => {
    s.events.push({ id: id(), ...event });
  });
}

export async function removeEvent(eventId) {
  if (backend.isRemote) {
    await backend.removeRow("chess_events", eventId);
    return;
  }
  mutate((s) => {
    s.events = s.events.filter((e) => e.id !== eventId);
  });
}

export const addTournament = (t) =>
  mutate((s) => {
    s.tournaments.push({ id: id(), rounds: [], ...t });
  });

export const updateTournament = (tid, patch) =>
  mutate((s) => {
    const t = s.tournaments.find((x) => x.id === tid);
    if (t) Object.assign(t, patch);
  });

export const removeTournament = (tid) =>
  mutate((s) => {
    s.tournaments = s.tournaments.filter((t) => t.id !== tid);
  });

/** Throw everything away and return to the seeded club. */
export const resetAll = () =>
  mutate((s) => {
    const fresh = structuredClone(SEED);
    Object.keys(s).forEach((k) => delete s[k]);
    Object.assign(s, fresh);
  });
