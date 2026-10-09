/**
 * Knockout brackets.
 *
 * A bracket is a tree, and the whole tree is one value: an array of rounds,
 * each with an array of matches `{ a, b, winner, score }`. Nothing is
 * stored twice — who plays in the semi-final is not written down, it is
 * whoever won the quarter-final above it, which is what `propagate` does.
 *
 * That is also why correcting a result is safe: the winner changes, the
 * rounds below are refilled, and anything that depended on the mistake is
 * cleared rather than left pointing at a player who is no longer there.
 */

/** Round names, read from the final backwards so every size agrees. */
const NAMES_FROM_FINAL = [
  "ფინალი",
  "ნახევარფინალი",
  "მეოთხედფინალი",
  "1/8 ფინალი",
];

export const BRACKET_SIZES = [4, 8, 16];

export const roundNames = (size) => {
  const rounds = Math.log2(size);
  return NAMES_FROM_FINAL.slice(0, rounds).reverse();
};

/**
 * Standard seeding: 1 meets the lowest seed, and the top two can only meet
 * in the final. Built by mirroring the order at every doubling.
 */
function seedOrder(size) {
  let order = [0];
  while (order.length < size) {
    const span = order.length * 2;
    order = order.flatMap((i) => [i, span - 1 - i]);
  }
  return order;
}

export const isBracketSize = (n) => BRACKET_SIZES.includes(n);

/** `playerIds` strongest first; the pairing is done by the seeding above. */
export function buildBracket(playerIds) {
  const size = playerIds.length;
  if (!isBracketSize(size)) return [];

  const seeded = seedOrder(size).map((i) => playerIds[i]);
  const names = roundNames(size);

  const rounds = names.map((name, r) => ({
    name,
    matches: Array.from({ length: size / 2 ** (r + 1) }, () => ({
      a: null,
      b: null,
      winner: null,
      score: null,
    })),
  }));

  rounds[0].matches = rounds[0].matches.map((_, i) => ({
    a: seeded[i * 2],
    b: seeded[i * 2 + 1],
    winner: null,
    score: null,
  }));

  return rounds;
}

/** Carry every winner into the round below, clearing what it invalidates. */
export function propagate(rounds) {
  for (let r = 0; r < rounds.length - 1; r += 1) {
    const next = rounds[r + 1];
    rounds[r].matches.forEach((m, i) => {
      const slot = next.matches[Math.floor(i / 2)];
      const side = i % 2 === 0 ? "a" : "b";
      const incoming = m.winner ?? null;
      if (slot[side] !== incoming) {
        slot[side] = incoming;
        // Whoever was recorded here was playing someone else.
        slot.winner = null;
        slot.score = null;
      }
    });
  }
  return rounds;
}

/**
 * Record one match and return the new bracket plus the tournament fields
 * that follow from it — a decided final finishes the tournament.
 */
export function recordMatch(rounds, roundIndex, matchIndex, winnerId, score) {
  const next = structuredClone(rounds);
  const match = next[roundIndex]?.matches[matchIndex];
  if (!match) return { rounds, status: "live", winnerId: null, runnerUpId: null };

  match.winner = winnerId ?? null;
  match.score = winnerId ? (score || null) : null;
  propagate(next);

  return { rounds: next, ...standing(next) };
}

/** Who won the whole thing, if the final has been played. */
export function standing(rounds) {
  const final = rounds.at(-1)?.matches?.[0];
  if (!final?.winner) {
    return { status: "live", winnerId: null, runnerUpId: null };
  }
  return {
    status: "finished",
    winnerId: final.winner,
    runnerUpId: final.winner === final.a ? final.b : final.a,
  };
}

/** Common knockout match scores, shortest first. */
export const SCORES = ["1–0", "1½–½", "2–0", "2½–½", "3–1"];
