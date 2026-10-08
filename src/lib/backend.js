/**
 * Where the club's data actually lives.
 *
 * With no credentials the site runs entirely on localStorage and the seeded
 * season, which is what makes it demoable the moment it is opened. Set the
 * two Supabase variables and the same app reads and writes the real
 * database instead, shared across every phone in the school.
 *
 * Nothing above this file knows which is in use: `store.js` calls `load`
 * and `save`, and both drivers answer with the same shape.
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isRemote = Boolean(url && key);

let client = null;

/**
 * Loaded on demand. A school phone on mobile data should not download the
 * Supabase SDK at all when the site is running on seed data.
 */
export async function supabase() {
  if (!isRemote) return null;
  if (client) return client;
  const { createClient } = await import("@supabase/supabase-js");
  client = createClient(url, key, {
    auth: { persistSession: true, storageKey: "chess.auth" },
  });
  return client;
}

/* ---------------------------------------------------------------- *
 * Row shapes. The database uses snake_case; the app uses camelCase,
 * and the mapping lives here rather than in the components.
 * ---------------------------------------------------------------- */

const toPlayer = (r) => ({
  id: r.id,
  name: r.name,
  klass: r.klass,
  joinedAt: r.joined_at,
});

const toGame = (r) => ({
  id: r.id,
  whiteId: r.white_id,
  blackId: r.black_id,
  result: Number(r.result),
  type: r.type,
  playedAt: r.played_at,
  note: r.note,
});

const toEvent = (r) => ({
  id: r.id,
  title: r.title,
  kind: r.kind,
  startsAt: r.starts_at,
  location: r.location,
  note: r.note,
});

const toTournament = (r) => ({
  id: r.id,
  name: r.name,
  status: r.status,
  format: r.format,
  startedAt: r.started_at,
  rounds: r.rounds ?? [],
  winnerId: r.winner_id,
  runnerUpId: r.runner_up_id,
});

/** Read the whole club. Small enough that four queries beat pagination. */
export async function load() {
  const sb = await supabase();
  if (!sb) return null;

  const [players, games, events, tournaments] = await Promise.all([
    sb.from("chess_players").select("*"),
    sb.from("chess_games").select("*").order("played_at", { ascending: true }),
    sb.from("chess_events").select("*"),
    sb.from("chess_tournaments").select("*"),
  ]);

  const failed = [players, games, events, tournaments].find((r) => r.error);
  if (failed) throw failed.error;

  return {
    players: players.data.map(toPlayer),
    games: games.data.map(toGame),
    events: events.data.map(toEvent),
    tournaments: tournaments.data.map(toTournament),
  };
}

/** Live updates, so a result entered at the board appears on every phone. */
export async function watch(onChange) {
  const sb = await supabase();
  if (!sb) return () => {};
  const channel = sb
    .channel("chess")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "chess_games" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "chess_players" },
      onChange,
    )
    .subscribe();
  return () => sb.removeChannel(channel);
}

/* ---------------------------------------------------------------- *
 * Writes. Row-level security is the real check; these just carry the
 * request. A non-admin gets a 403 from the database, not from here.
 * ---------------------------------------------------------------- */

export async function insertPlayer(p) {
  const sb = await supabase();
  const { error } = await sb
    .from("chess_players")
    .insert({ name: p.name, klass: p.klass });
  if (error) throw error;
}

export async function insertGame(g) {
  const sb = await supabase();
  const { error } = await sb.from("chess_games").insert({
    white_id: g.whiteId,
    black_id: g.blackId,
    result: g.result,
    type: g.type,
    played_at: g.playedAt,
    note: g.note ?? null,
  });
  if (error) throw error;
}

export async function insertEvent(e) {
  const sb = await supabase();
  const { error } = await sb.from("chess_events").insert({
    title: e.title,
    kind: e.kind,
    starts_at: e.startsAt,
    location: e.location,
    note: e.note ?? null,
  });
  if (error) throw error;
}

export async function removeRow(table, id) {
  const sb = await supabase();
  const { error } = await sb.from(table).delete().eq("id", id);
  if (error) throw error;
}

/* ---------------------------------------------------------------- *
 * Admin sign-in, when a backend is attached. Membership of
 * chess_admins — not merely having an account — is what grants writes.
 * ---------------------------------------------------------------- */

export async function signInRemote(email, password) {
  const sb = await supabase();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error("ელფოსტა ან პაროლი არ ემთხვევა.");

  const { data: user } = await sb.auth.getUser();
  const { data: admin } = await sb
    .from("chess_admins")
    .select("id")
    .eq("id", user.user.id)
    .maybeSingle();

  if (!admin) {
    await sb.auth.signOut();
    throw new Error("ამ ანგარიშს ცვლილებების შეტანა არ შეუძლია.");
  }
  return true;
}

export async function signOutRemote() {
  const sb = await supabase();
  await sb?.auth.signOut();
}
