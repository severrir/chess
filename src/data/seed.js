/**
 * The club as it stands when the site is first opened.
 *
 * Players and fixtures are written out; the game log is generated from a
 * fixed seed so the ladder, streaks and rating curves look like a real
 * term of play rather than twenty identical rows — and so they come out
 * the same for everyone, every time.
 */

const DAY = 86_400_000;

/** Deterministic PRNG, so the seeded season never shifts between loads. */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A date `daysAgo` days back, at a given Tbilisi hour (UTC+4). */
function at(daysAgo, hour = 15, minute = 0) {
  const d = new Date(Date.now() - daysAgo * DAY);
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      hour - 4,
      minute,
    ),
  ).toISOString();
}

/** `skill` is invisible in the UI — it only shapes the seeded results. */
const PLAYERS = [
  { id: "p-saba", name: "საბა ყურაშვილი", klass: "IX-ბ", skill: 0.80 },
  { id: "p-nika", name: "ნიკა ბერიძე", klass: "XI-ა", skill: 0.84 },
  { id: "p-giorgi", name: "გიორგი მაისურაძე", klass: "X-ა", skill: 0.72 },
  { id: "p-luka", name: "ლუკა ჯაფარიძე", klass: "IX-ბ", skill: 0.64 },
  { id: "p-nino", name: "ნინო ხაჩიძე", klass: "X-ბ", skill: 0.76 },
  { id: "p-mariam", name: "მარიამ გოგოლაძე", klass: "XI-ა", skill: 0.68 },
  { id: "p-dato", name: "დათო წიკლაური", klass: "VIII-ა", skill: 0.52 },
  { id: "p-elene", name: "ელენე კვარაცხელია", klass: "IX-ა", skill: 0.60 },
  { id: "p-irakli", name: "ირაკლი ნოზაძე", klass: "XII-ა", skill: 0.78 },
  { id: "p-tekla", name: "თეკლა ბოლქვაძე", klass: "VIII-ბ", skill: 0.46 },
  { id: "p-lasha", name: "ლაშა ქავთარაძე", klass: "X-ა", skill: 0.58 },
  { id: "p-ana", name: "ანა ჩიქოვანი", klass: "IX-ა", skill: 0.66 },
  { id: "p-tornike", name: "თორნიკე ასლანიშვილი", klass: "XII-ა", skill: 0.70 },
  { id: "p-salome", name: "სალომე მჭედლიშვილი", klass: "VIII-ა", skill: 0.44 },
  { id: "p-vakho", name: "ვახო შენგელია", klass: "XI-ბ", skill: 0.62 },
  { id: "p-gvantsa", name: "გვანცა ლომიძე", klass: "X-ბ", skill: 0.56 },
  { id: "p-sandro", name: "სანდრო თავაძე", klass: "VII-ა", skill: 0.38 },
  { id: "p-natia", name: "ნათია ფხაკაძე", klass: "VII-ა", skill: 0.42 },
].map(({ skill, ...p }) => ({ ...p, _skill: skill }));

const TYPES = ["blitz", "classical", "rapid"];

/**
 * ~190 games over the last ten weeks. Stronger players win more often, but
 * not always — the point of a ladder is that it can be climbed.
 */
function generateGames() {
  const rnd = mulberry32(20261008);
  const games = [];
  const n = PLAYERS.length;

  for (let i = 0; i < 190; i += 1) {
    let a = Math.floor(rnd() * n);
    let b = Math.floor(rnd() * n);
    while (b === a) b = Math.floor(rnd() * n);

    const white = PLAYERS[a];
    const black = PLAYERS[b];

    // Probability white wins, from the skill gap, with room for upsets.
    const edge = white._skill - black._skill;
    const pWhite = 0.5 + edge * 0.85;
    const roll = rnd();

    let result;
    if (roll < 0.12) result = 0.5; // draws happen at every level
    else if (roll < 0.12 + (1 - 0.12) * Math.min(0.94, Math.max(0.06, pWhite)))
      result = 1;
    else result = 0;

    games.push({
      id: `g-${i + 1}`,
      whiteId: white.id,
      blackId: black.id,
      result,
      type: TYPES[Math.floor(rnd() * TYPES.length)],
      playedAt: at(70 - Math.floor((i / 190) * 70), 14 + (i % 5)),
      note: null,
    });
  }
  return games;
}

export const SEED = {
  players: PLAYERS.map(({ _skill, ...p }) => ({
    ...p,
    joinedAt: at(80),
  })),

  games: generateGames(),

  events: [
    {
      id: "e-1",
      title: "ბლიცის ოთხშაბათი",
      kind: "ბლიცი",
      startsAt: at(-2, 15, 30),
      location: "სააქტო დარბაზი",
      note: "5+0. ყველას შეუძლია მოსვლა, ჩაწერა ადგილზე.",
    },
    {
      id: "e-2",
      title: "სკოლათაშორისი მატჩი — №7 სკოლა",
      kind: "მატჩი",
      startsAt: at(-9, 13, 0),
      location: "№7 საჯარო სკოლა, რუსთავი",
      note: "ოთხდაფიანი მატჩი. გუნდი ოთხშაბათს გამოცხადდება.",
    },
    {
      id: "e-3",
      title: "შემოდგომის ჩემპიონატი — ფინალი",
      kind: "ტურნირი",
      startsAt: at(-16, 12, 0),
      location: "ბიბლიოთეკა",
      note: "კლასიკური, 60+30.",
    },
    {
      id: "e-4",
      title: "ბლიცის ოთხშაბათი",
      kind: "ბლიცი",
      startsAt: at(5, 15, 30),
      location: "სააქტო დარბაზი",
      note: null,
    },
  ],

  tournaments: [
    {
      id: "t-1",
      name: "შემოდგომის ჩემპიონატი",
      status: "live",
      format: "ნოკაუტი, 8 მოთამაშე",
      startedAt: at(12),
      rounds: [
        {
          name: "მეოთხედფინალი",
          matches: [
            { a: "p-nika", b: "p-sandro", winner: "p-nika", score: "2–0" },
            { a: "p-nino", b: "p-lasha", winner: "p-nino", score: "1½–½" },
            { a: "p-irakli", b: "p-tekla", winner: "p-irakli", score: "2–0" },
            { a: "p-saba", b: "p-ana", winner: "p-saba", score: "1½–½" },
          ],
        },
        {
          name: "ნახევარფინალი",
          matches: [
            { a: "p-nika", b: "p-nino", winner: "p-nika", score: "1½–½" },
            { a: "p-irakli", b: "p-saba", winner: "p-saba", score: "1½–½" },
          ],
        },
        {
          name: "ფინალი",
          matches: [{ a: "p-nika", b: "p-saba", winner: null, score: null }],
        },
      ],
    },
    {
      id: "t-2",
      name: "საგაზაფხულო ბლიცი",
      status: "finished",
      format: "შვეიცარიული, 7 ტური",
      startedAt: at(140),
      winnerId: "p-irakli",
      runnerUpId: "p-nika",
      rounds: [],
    },
    {
      id: "t-3",
      name: "ახალბედების თასი",
      status: "finished",
      format: "წრიული, 6 მოთამაშე",
      startedAt: at(100),
      winnerId: "p-ana",
      runnerUpId: "p-dato",
      rounds: [],
    },
  ],
};
