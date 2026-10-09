/**
 * The club as a notebook you can keep.
 *
 * One self-contained HTML file: no network, no build, no app. It opens on
 * any phone or computer, works with the Wi-Fi off, and prints onto A4 —
 * which is the point, because a ladder pinned to the club door settles
 * more arguments than a ladder on a server.
 *
 * The screen app is dark wood; paper is not. Everything here is re-set for
 * ink on cream: the board becomes a faint watermark, gold becomes a sober
 * ochre that survives a school printer, and the ruled line under the text
 * is the notebook it is named after.
 */

import { gameTypeName, scoreLine } from "./elo.js";
import { daysSince, formatDate, formatTime } from "./georgian.js";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** A whole term of games is the point; the cap keeps the file a download. */
const GAME_LIMIT = 400;

const PAGE_CSS = `
:root {
  --paper: #f8f3e7;
  --paper-2: #fffdf7;
  --ink: #1e222a;
  --ink-2: #4e5865;
  --ink-3: #78828f;
  --rule: #ddd2b8;
  --rule-soft: #e9e0cc;
  --ochre: #936f12;
  --crimson: #9c3030;
  --line: 26px;
  --serif: "Noto Serif Georgian", "BPG Nino Elite", Sylfaen, Georgia, serif;
  --sans: "Noto Sans Georgian", Sylfaen, system-ui, -apple-system, sans-serif;
}

* { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: #e7e0cf;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 15px;
  line-height: var(--line);
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
}

/* The sheet. On screen it floats; in print it *is* the page. */
.sheet {
  max-width: 820px;
  margin: 0 auto;
  padding: 34px 26px 56px;
  background: var(--paper);
  background-image:
    repeating-linear-gradient(
      to bottom,
      transparent 0 calc(var(--line) - 1px),
      var(--rule-soft) calc(var(--line) - 1px) var(--line)
    );
  background-position: 0 12px;
  box-shadow: 0 1px 0 #fff inset, 0 18px 50px -24px rgb(0 0 0 / 0.45);
  min-height: 100vh;
}

/* The chessboard, as a watermark rather than a decoration. */
.sheet::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.035;
  background-image:
    linear-gradient(45deg, var(--ink) 25%, transparent 25% 75%, var(--ink) 75%),
    linear-gradient(45deg, var(--ink) 25%, transparent 25% 75%, var(--ink) 75%);
  background-size: 56px 56px;
  background-position: 0 0, 28px 28px;
}

h1, h2, h3 { font-weight: 600; margin: 0; text-wrap: balance; }
h1 { font-size: 30px; line-height: 1.18; }
h2 { font-size: 20px; line-height: 1.3; }
h3 { font-size: 16px; line-height: 1.35; }
p { margin: 0; text-wrap: pretty; }

a { color: inherit; text-decoration: none; }

.eyebrow {
  font-family: var(--sans);
  font-size: 11.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.meta { font-family: var(--sans); font-size: 12px; color: var(--ink-3); }
.sub  { font-family: var(--sans); font-size: 13px; color: var(--ink-2); }

/* ---- Masthead ---- */
.plate {
  border-top: 3px double var(--ink);
  border-bottom: 1px solid var(--rule);
  padding: 14px 0 12px;
  margin-bottom: 22px;
}
.plate h1 { margin: 2px 0 6px; }
.tally { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 10px; }
.tally div { font-family: var(--sans); font-size: 12px; color: var(--ink-3); }
.tally b { display: block; font-family: var(--serif); font-size: 19px; color: var(--ink); }

/* ---- Sections ---- */
section { margin-top: 30px; break-inside: auto; }
section > h2 {
  padding-bottom: 5px;
  border-bottom: 1px solid var(--rule);
  break-after: avoid;
}
section > h2 .n {
  font-family: var(--sans);
  font-size: 11px;
  color: var(--ink-3);
  margin-left: 8px;
  letter-spacing: 0.04em;
}
.note { margin-top: 6px; font-family: var(--sans); font-size: 12.5px; color: var(--ink-2); }

/* ---- Contents ---- */
.contents ol { margin: 10px 0 0; padding: 0; list-style: none; columns: 2; column-gap: 26px; }
.contents li {
  font-family: var(--sans);
  font-size: 13px;
  padding: 3px 0;
  break-inside: avoid;
}
.contents .dots { color: var(--rule); }

/* ---- The crown ---- */
.crown {
  margin-top: 12px;
  padding: 16px 18px;
  background: var(--paper-2);
  border: 1px solid var(--rule);
  border-left: 3px solid var(--ochre);
  break-inside: avoid;
}
.crown .name { font-size: 25px; line-height: 1.2; }
.crown .facts { display: flex; flex-wrap: wrap; gap: 4px 26px; margin-top: 12px; }
.crown .facts div { font-family: var(--sans); font-size: 12px; color: var(--ink-3); }
.crown .facts b { display: block; font-family: var(--serif); font-size: 20px; color: var(--ochre); }

/* ---- Tables ---- */
table { width: 100%; border-collapse: collapse; margin-top: 12px; }
thead { display: table-header-group; }
th {
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-3);
  text-align: right;
  padding: 0 6px 6px;
  border-bottom: 1px solid var(--ink);
  white-space: nowrap;
}
th:first-child, th.l { text-align: left; }
td {
  padding: 5px 6px;
  border-bottom: 1px solid var(--rule-soft);
  text-align: right;
  vertical-align: baseline;
}
td:first-child, td.l { text-align: left; }
tr { break-inside: avoid; }
.rk { width: 30px; color: var(--ink-3); font-size: 13px; }
tr.top .rk { color: var(--ochre); font-weight: 600; }
tr.top td.l { font-weight: 600; }
.dim { color: var(--ink-3); }
.w { color: var(--ink); }
.nowrap { white-space: nowrap; }
caption { caption-side: bottom; margin-top: 8px; font-family: var(--sans); font-size: 11.5px; color: var(--ink-3); text-align: left; }

/* ---- Brackets ---- */
.rounds { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 12px; }
.round { flex: 1 1 210px; min-width: 190px; break-inside: avoid; }
.round h3 { font-size: 13px; color: var(--ink-2); padding-bottom: 4px; border-bottom: 1px solid var(--rule); }
.match { margin-top: 8px; padding-left: 9px; border-left: 2px solid var(--rule); break-inside: avoid; }
.match .side { display: flex; justify-content: space-between; gap: 10px; font-size: 14px; }
.match .side.won { border-left: 2px solid var(--ochre); margin-left: -11px; padding-left: 9px; font-weight: 600; }
.match .side.lost { color: var(--ink-3); }
.match .score { font-family: var(--sans); font-size: 11.5px; color: var(--ink-3); }

/* ---- Lists of dated things ---- */
.diary { margin: 12px 0 0; padding: 0; list-style: none; }
.diary li {
  padding: 9px 0 9px 14px;
  border-left: 2px solid var(--rule);
  border-bottom: 1px solid var(--rule-soft);
  break-inside: avoid;
}
.diary li.next { border-left-color: var(--ochre); }
.diary .when { font-family: var(--sans); font-size: 11.5px; color: var(--ink-3); }
.diary h3 { margin-top: 1px; }

/* ---- Toolbar, screen only ---- */
.bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  max-width: 820px;
  margin: 0 auto;
  padding: 10px 26px 0;
}
.bar button {
  font: 600 13px var(--sans);
  color: var(--paper);
  background: var(--ink);
  border: 0;
  border-radius: 7px;
  padding: 9px 14px;
  min-height: 40px;
  cursor: pointer;
}

footer {
  margin-top: 36px;
  padding-top: 12px;
  border-top: 3px double var(--ink);
  font-family: var(--sans);
  font-size: 11.5px;
  color: var(--ink-3);
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  justify-content: space-between;
}

@media (max-width: 560px) {
  .sheet { padding: 24px 16px 44px; }
  h1 { font-size: 25px; }
  .contents ol { columns: 1; }
  .bar { padding: 8px 16px 0; }
  table { font-size: 14px; }
  td, th { padding-left: 4px; padding-right: 4px; }
}

@page { size: A4; margin: 15mm 14mm; }

@media print {
  body { background: #fff; }
  .bar { display: none; }
  .sheet {
    max-width: none;
    margin: 0;
    padding: 0;
    box-shadow: none;
    background: #fff;
    min-height: 0;
  }
  .sheet::before { display: none; }
  .crown { background: #fff; }
  section { break-inside: auto; }
  .page-break { break-before: page; }
  a::after { content: ""; }
}
`;

/* ---------------------------------------------------------------- *
 * Sections
 * ---------------------------------------------------------------- */

function masthead(state, now) {
  const played = state.games.length;
  return `
<header class="plate">
  <p class="eyebrow">რუსთავის №4 საჯარო სკოლა</p>
  <h1>ჭადრაკის კლუბის რვეული</h1>
  <p class="sub">შედგენილია ${esc(formatDate(now, { year: true }))}, ${esc(
    formatTime(now),
  )}</p>
  <div class="tally">
    <div><b>${state.players.length}</b>მოთამაშე</div>
    <div><b>${played}</b>პარტია</div>
    <div><b>${state.tournaments.length}</b>ტურნირი</div>
    <div><b>${state.classes.length}</b>კლასი</div>
  </div>
</header>`;
}

function contents(items) {
  return `
<section class="contents">
  <h2>სარჩევი</h2>
  <ol>
    ${items
      .map(
        (it, i) =>
          `<li>${i + 1}. <a href="#${it.id}">${esc(it.title)}</a> <span class="dots">—</span> <span class="dim">${esc(it.hint)}</span></li>`,
      )
      .join("\n    ")}
  </ol>
</section>`;
}

function crown(state) {
  const k = state.king;
  if (!k) return "";
  return `
<section id="king">
  <h2>სკოლის მეფე</h2>
  <div class="crown">
    <p class="eyebrow">რეიტინგის სათავე</p>
    <h3 class="name">${esc(k.name)}</h3>
    <p class="sub">${esc(k.klass)}, რეიტინგი ${k.rating}</p>
    <div class="facts">
      <div><b>${k.reignFrom ? `${daysSince(k.reignFrom)} დღე` : "ახალი"}</b>ტახტზე</div>
      <div><b>${k.beaten}</b>მოგერიებული გამოწვევა</div>
      <div><b>${k.wins} / ${k.draws} / ${k.losses}</b>მოგება, ფრე, წაგება</div>
      <div><b>${k.bestStreak}</b>საუკეთესო სერია</div>
    </div>
  </div>
</section>`;
}

function ladder(state) {
  if (state.players.length === 0) return "";
  const rows = state.players
    .map(
      (p) => `
      <tr class="${p.rank <= 3 ? "top" : ""}">
        <td class="rk">${p.rank}</td>
        <td class="l">${esc(p.name)}</td>
        <td class="l dim nowrap">${esc(p.klass)}</td>
        <td class="w">${p.rating}</td>
        <td>${p.wins}</td>
        <td>${p.draws}</td>
        <td>${p.losses}</td>
        <td class="dim">${p.games}</td>
        <td class="dim">${p.bestStreak}</td>
      </tr>`,
    )
    .join("");

  return `
<section id="ladder">
  <h2>რეიტინგი<span class="n">${state.players.length} მოთამაშე</span></h2>
  <p class="note">ყველა იწყებს 1000-დან. რეიტინგი არ ინახება — ის ყოველ ჯერზე
  პარტიების სრული ჟურნალიდან გადაითვლება.</p>
  <table>
    <thead>
      <tr>
        <th>#</th><th class="l">სახელი</th><th class="l">კლასი</th>
        <th>რეიტინგი</th><th>მოგ.</th><th>ფრე</th><th>წაგ.</th>
        <th>პარტია</th><th>სერია</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
    <caption>პირველი სამი ოქროს ციფრით. „სერია“ — ზედიზედ მოგებების რეკორდი.</caption>
  </table>
</section>`;
}

function classes(state) {
  if (state.classes.length === 0) return "";
  const rows = state.classes
    .map(
      (c, i) => `
      <tr class="${i === 0 ? "top" : ""}">
        <td class="rk">${i + 1}</td>
        <td class="l">${esc(c.klass)}</td>
        <td class="w">${c.average}</td>
        <td class="dim">${c.players.length}</td>
        <td class="l dim">${esc(c.best?.name ?? "—")}</td>
      </tr>`,
    )
    .join("");

  return `
<section id="classes">
  <h2>კლასების ცხრილი</h2>
  <p class="note">კლასები საშუალო რეიტინგით, არა მოთამაშეების რიცხვით — ერთი
  ძლიერი კლასი ვერ დაიმალება ბევრი ახალბედის უკან.</p>
  <table>
    <thead>
      <tr><th>#</th><th class="l">კლასი</th><th>საშუალო</th><th>მოთამაშე</th><th class="l">საუკეთესო</th></tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>
</section>`;
}

function tournaments(state) {
  if (state.tournaments.length === 0) return "";
  const live = state.tournaments.filter((t) => t.status === "live");
  const past = state.tournaments
    .filter((t) => t.status !== "live")
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

  const name = (id) => esc(state.playersById[id]?.name ?? "—");

  const brackets = live
    .map(
      (t) => `
  <h3>${esc(t.name)} <span class="meta">— ${esc(t.format ?? "")}, დაიწყო ${esc(
    formatDate(t.startedAt),
  )}</span></h3>
  <div class="rounds">
    ${(t.rounds ?? [])
      .map(
        (r) => `
    <div class="round">
      <h3>${esc(r.name)}</h3>
      ${r.matches
        .map(
          (m) => `
      <div class="match">
        <div class="side ${m.winner ? (m.winner === m.a ? "won" : "lost") : ""}"><span>${name(
          m.a,
        )}</span></div>
        <div class="side ${m.winner ? (m.winner === m.b ? "won" : "lost") : ""}"><span>${name(
          m.b,
        )}</span></div>
        <div class="score">${esc(m.score ?? "ჯერ არ ჩატარებულა")}</div>
      </div>`,
        )
        .join("")}
    </div>`,
      )
      .join("")}
  </div>`,
    )
    .join("");

  const history =
    past.length === 0
      ? ""
      : `
  <table>
    <thead>
      <tr><th class="l">ტურნირი</th><th class="l">ფორმატი</th><th class="l">გამარჯვებული</th><th class="l">მეორე</th><th>თარიღი</th></tr>
    </thead>
    <tbody>
      ${past
        .map(
          (t) => `
      <tr>
        <td class="l">${esc(t.name)}</td>
        <td class="l dim">${esc(t.format ?? "—")}</td>
        <td class="l">${name(t.winnerId)}</td>
        <td class="l dim">${name(t.runnerUpId)}</td>
        <td class="dim nowrap">${esc(formatDate(t.startedAt, { short: true, year: true }))}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;

  return `
<section id="tournaments">
  <h2>ტურნირები</h2>
  ${brackets}
  ${history}
</section>`;
}

function games(state) {
  if (state.games.length === 0) return "";
  const shown = state.games.slice(0, GAME_LIMIT);
  const rows = shown
    .map((g) => {
      const w = state.playersById[g.whiteId];
      const b = state.playersById[g.blackId];
      return `
      <tr>
        <td class="l dim nowrap">${esc(formatDate(g.playedAt, { short: true }))}</td>
        <td class="l">${esc(w?.name ?? "—")}</td>
        <td class="nowrap">${esc(scoreLine(g.result))}</td>
        <td class="l">${esc(b?.name ?? "—")}</td>
        <td class="l dim nowrap">${esc(gameTypeName(g.type))}</td>
      </tr>`;
    })
    .join("");

  return `
<section id="games" class="page-break">
  <h2>პარტიების ჟურნალი<span class="n">${state.games.length} პარტია</span></h2>
  <p class="note">შედეგი ისე იწერება, როგორც ოქმში — 1–0, ½–½, 0–1 — თეთრების
  თვალსაზრისით.</p>
  <table>
    <thead>
      <tr><th class="l">თარიღი</th><th class="l">თეთრები</th><th>შედეგი</th><th class="l">შავები</th><th class="l">ტიპი</th></tr>
    </thead>
    <tbody>${rows}
    </tbody>
    ${
      state.games.length > shown.length
        ? `<caption>ნაჩვენებია ბოლო ${shown.length} პარტია ${state.games.length}-დან.</caption>`
        : ""
    }
  </table>
</section>`;
}

function events(state, now) {
  if (state.events.length === 0) return "";
  const sorted = [...state.events].sort(
    (a, b) => new Date(a.startsAt) - new Date(b.startsAt),
  );
  const ahead = sorted.filter((e) => new Date(e.startsAt) >= now);
  const behind = sorted.filter((e) => new Date(e.startsAt) < now).reverse();

  const li = (e, i, future) => `
    <li class="${future && i === 0 ? "next" : ""}">
      <p class="when">${esc(formatDate(e.startsAt, { year: true }))}, ${esc(
        formatTime(e.startsAt),
      )} · ${esc(e.kind ?? "ღონისძიება")} · ${esc(e.location ?? "სკოლა")}</p>
      <h3>${esc(e.title)}</h3>
      ${e.note ? `<p class="note">${esc(e.note)}</p>` : ""}
    </li>`;

  return `
<section id="events">
  <h2>ღონისძიებები</h2>
  ${
    ahead.length > 0
      ? `<ul class="diary">${ahead.map((e, i) => li(e, i, true)).join("")}</ul>`
      : `<p class="note">დაგეგმილი ღონისძიება არ არის.</p>`
  }
  ${
    behind.length > 0
      ? `<h3 style="margin-top:18px">ჩატარებული</h3>
         <ul class="diary">${behind
           .slice(0, 8)
           .map((e, i) => li(e, i, false))
           .join("")}</ul>`
      : ""
  }
</section>`;
}

/* ---------------------------------------------------------------- *
 * The file
 * ---------------------------------------------------------------- */

export function buildNotebook(state, now = new Date()) {
  const index = [
    state.king && { id: "king", title: "სკოლის მეფე", hint: "ტახტი და გამოწვევები" },
    state.players.length && {
      id: "ladder",
      title: "რეიტინგი",
      hint: `${state.players.length} მოთამაშე`,
    },
    state.classes.length && {
      id: "classes",
      title: "კლასების ცხრილი",
      hint: "საშუალო რეიტინგით",
    },
    state.tournaments.length && {
      id: "tournaments",
      title: "ტურნირები",
      hint: "ბადეები და გამარჯვებულები",
    },
    state.games.length && {
      id: "games",
      title: "პარტიების ჟურნალი",
      hint: `${state.games.length} პარტია`,
    },
    state.events.length && {
      id: "events",
      title: "ღონისძიებები",
      hint: "კალენდარი",
    },
  ].filter(Boolean);

  return `<!doctype html>
<html lang="ka">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>ჭადრაკის რვეული — ${esc(formatDate(now, { year: true }))}</title>
<style>${PAGE_CSS}</style>
</head>
<body>
<div class="bar"><button type="button" onclick="window.print()">დაბეჭდე</button></div>
<main class="sheet">
${masthead(state, now)}
${contents(index)}
${crown(state)}
${ladder(state)}
${classes(state)}
${tournaments(state)}
${games(state)}
${events(state, now)}
<footer>
  <span>ჭადრაკის კლუბი · რუსთავის №4 საჯარო სკოლა</span>
  <span>ეს ფაილი ინტერნეტის გარეშე მუშაობს</span>
  <span>Made By საბა ყურაშვილი</span>
</footer>
</main>
</body>
</html>`;
}

/** Hand the file to the browser. Returns the name it was saved under. */
export function downloadNotebook(state, now = new Date()) {
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const filename = `chess-rveuli-${stamp}.html`;

  const blob = new Blob([buildNotebook(state, now)], {
    type: "text/html;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.append(a);
  a.click();
  a.remove();
  // Safari needs the URL to outlive the click by a moment.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return filename;
}
