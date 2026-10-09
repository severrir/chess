# ჭადრაკის კლუბი — რუსთავის №4 საჯარო სკოლა

სკოლის ჭადრაკის კლუბის რეიტინგი, პარტიები, ტურნირები და ღონისძიებები.
მთლიანად ქართულად, ტელეფონისთვის აგებული.

**ცოცხალი:** https://severrir.github.io/chess/

---

## Start it

```bash
npm install
npm run dev
```

It runs immediately on a seeded season — 18 players and ~190 games, so the
ladder, streaks and rating curves look like a real term of play. Press the
lock icon and sign in to see the admin tools.

## The design

The world is a tournament scoresheet resting on a board. The page ground is
a faint chessboard, cards are sheets clipped to it, and **gold appears only
on the crown** — the school champion and the top of the ladder.

Results are written the way a scoresheet writes them, `1–0`, `½–½`, `0–1`,
rather than as coloured win/loss chips: that notation already says who had
white and who won, in three characters.

## How ratings work

Everyone starts at **1000**. K is 40 while a player is new, 24 once
settled, 16 above 1600 — so a beginner finds their level in a handful of
games and one bad blitz game cannot undo a season.

Ratings are **never stored**. The whole ladder is replayed from the game log
every time it changes, so a mistyped result can simply be corrected and the
table re-derives itself.

## The screens

| | |
|---|---|
| `#/` | the crown, the top of the ladder, the next event, the last games |
| `#/leaderboard` | the ladder by player, or the same data summed by class |
| `#/games` | every game played, filtered by type |
| `#/tournaments` | live brackets and past winners |
| `#/events` | blitz days, tournaments, inter-school matches |
| `#/player/<id>` | one player: rating curve, record, games, achievements |
| `#/admin` | games, players, events, tournament brackets |

Hash routes, so any screen can be sent to a classmate and the back button
behaves — and GitHub Pages needs no rewrite rules.

## Tournaments

The admin panel draws a knockout for 4, 8 or 16 players, seeded by rating
so the top two can only meet in the final. Tapping a name declares the
winner and carries them into the round below at once; the public bracket is
reading the same rounds, so it updates with it. A decided final finishes
the tournament and records the winner and runner-up.

Correcting a mistake is safe: the winner changes, the rounds below are
refilled from it, and anything that depended on the wrong result is cleared
rather than left pointing at a player who is no longer in that match.

## Attach Supabase

Without credentials everything above runs on the seeded season in
localStorage, which is what makes the site demoable the moment it opens.
With them, the same app reads and writes the real database, shared across
every phone in the school.

The club shares the `rveuli` Supabase project under a `chess_` prefix,
because the free tier allows two active projects and both are in use.

1. Run [`supabase/0001_chess.sql`](supabase/0001_chess.sql) in the SQL
   editor — it is the live schema, policies and realtime publication, and
   it is safe to re-run.
2. Authentication → Users → add the club's account.
3. `insert into chess_admins (id) values ('<that account's uid>');` — this
   is the step that grants writes.
4. Copy `.env.example` to `.env` and fill in the two values from
   Project Settings → Data API.
5. Add the same two as the GitHub Actions secrets `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (Settings → Secrets and variables → Actions),
   or the deployed site will fall back to seed data.

Anyone may read. Only a row in `chess_admins` may write — having an account
is not enough, and an account without that row is told so instead of
meeting a panel where every button fails. The seeded season stays on screen
until the database has a real player, so the site is never an empty page.

## Deploy

Push to `main`. The included workflow builds with `base=/chess/` and
publishes to GitHub Pages; set **Settings → Pages → Source: GitHub
Actions** once.

```bash
git add -A
git commit -m "..."
git push
```

---

Made By საბა ყურაშვილი
