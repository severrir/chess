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

## Attach Supabase

The club shares the `rveuli` Supabase project under a `chess_` prefix,
because the free tier allows two active projects and both are in use.

1. Run `supabase/0001_chess.sql` in the SQL editor (already applied to the
   live project).
2. Copy `.env.example` to `.env` and fill in the two values.
3. Add the same two as GitHub Actions secrets for the deployed site.

Anyone may read. Only a row in `chess_admins` may write — having an account
is not enough. The seeded season stays on screen until the database has a
real player, so the site is never an empty page.

## Deploy

Push to `main`. The included workflow builds and publishes to GitHub Pages;
set **Settings → Pages → Source: GitHub Actions** once.

---

Made By საბა ყურაშვილი
