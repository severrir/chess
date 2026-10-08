/**
 * Elo ratings.
 *
 * Everyone starts at 1000. K is higher while a player is new, so a
 * beginner's rating finds its real level in a handful of games instead of
 * creeping there over a term, and then settles down so one bad blitz game
 * cannot undo a season.
 */

export const START_RATING = 1000;

export function kFactor(gamesPlayed, rating) {
  if (gamesPlayed < 10) return 40; // still finding their level
  if (rating >= 1600) return 16; // established, protect the ladder
  return 24;
}

/** Expected score for A against B, from the rating difference alone. */
export const expectedScore = (a, b) => 1 / (1 + 10 ** ((b - a) / 400));

/**
 * `result` is from White's point of view: 1 win, 0.5 draw, 0 loss —
 * the same 1-0 / ½-½ / 0-1 a scoresheet is written in.
 */
export function nextRatings(white, black, result) {
  const expW = expectedScore(white.rating, black.rating);
  const expB = 1 - expW;
  const kW = kFactor(white.games ?? 0, white.rating);
  const kB = kFactor(black.games ?? 0, black.rating);

  return {
    white: Math.round(white.rating + kW * (result - expW)),
    black: Math.round(black.rating + kB * (1 - result - expB)),
  };
}

/** "1–0", "½–½", "0–1" — how a result is actually written down. */
export function scoreLine(result) {
  if (result === 1) return "1–0";
  if (result === 0) return "0–1";
  return "½–½";
}

export const RESULT_OPTIONS = [
  { value: 1, label: "1–0", description: "თეთრების მოგება" },
  { value: 0.5, label: "½–½", description: "ფრე" },
  { value: 0, label: "0–1", description: "შავების მოგება" },
];

export const GAME_TYPES = [
  { id: "blitz", name: "ბლიცი" },
  { id: "classical", name: "კლასიკური" },
  { id: "rapid", name: "რაპიდი" },
];

export const gameTypeName = (id) =>
  GAME_TYPES.find((t) => t.id === id)?.name ?? id;

/** A title-holder keeps the crown until someone beats them in a rated game. */
export function titleBadge(rank) {
  if (rank === 0) return { label: "ოქრო", color: "var(--color-gold)" };
  if (rank === 1) return { label: "ვერცხლი", color: "var(--color-silver)" };
  if (rank === 2) return { label: "ბრინჯაო", color: "var(--color-bronze)" };
  return null;
}
