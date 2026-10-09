import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Navbar from "./components/Navbar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import HomeView from "./components/HomeView.jsx";
import LeaderboardView from "./components/LeaderboardView.jsx";
import PlayerView from "./components/PlayerView.jsx";
import GamesView from "./components/GamesView.jsx";
import TournamentsView from "./components/TournamentsView.jsx";
import EventsView from "./components/EventsView.jsx";
import AdminView from "./components/AdminView.jsx";
import Sheet, { Field, inputClass } from "./components/Sheet.jsx";
import Toast from "./components/Toast.jsx";
import Watermark from "./components/Watermark.jsx";

import { downloadNotebook } from "./lib/notebook.js";
import { useStore } from "./hooks/useStore.js";
import { useToast } from "./hooks/useToast.js";
import { REMOTE_AUTH, isAdmin, signIn, signOut, subscribeAuth } from "./lib/auth.js";

/**
 * Views are addressed through the hash, so a player page can be sent to a
 * classmate and the browser's back button does what a phone user expects
 * — without pulling in a router for six screens.
 */
function readHash() {
  const raw = decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
  const [view = "home", param] = raw.split("/");
  return { view, param };
}

export default function App() {
  const state = useStore();
  const { toast, show, dismiss } = useToast();
  const admin = useSyncExternalStore(subscribeAuth, isAdmin, () => false);

  const [route, setRoute] = useState(readHash);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = useCallback((view, param) => {
    window.location.hash = param ? `/${view}/${param}` : `/${view}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openPlayer = useCallback((id) => go("player", id), [go]);

  // An admin tab only exists while signed in; signing out must leave it.
  useEffect(() => {
    if (!admin && route.view === "admin") go("home");
  }, [admin, route.view, go]);

  const tab = ["home", "leaderboard", "games", "tournaments", "events"].includes(
    route.view,
  )
    ? route.view
    : null;

  return (
    <div className="min-h-dvh pb-[calc(84px+env(safe-area-inset-bottom))]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ivory focus:px-4 focus:py-2 focus:text-board-900"
      >
        გადადი შიგთავსზე
      </a>

      <Navbar
        admin={admin}
        onNotebook={() => {
          try {
            show(`რვეული ჩამოიტვირთა — ${downloadNotebook(state)}`);
          } catch {
            show("რვეული ვერ შეიქმნა", { tone: "error" });
          }
        }}
        onAdmin={() => setLoginOpen(true)}
        onSignOut={() => {
          signOut();
          show("გამოხვედი");
          go("home");
        }}
      />

      <main id="main" className="mx-auto max-w-5xl">
        {route.view === "player" ? (
          <PlayerView
            state={state}
            playerId={route.param}
            onBack={() => go("leaderboard")}
            onPlayer={openPlayer}
          />
        ) : route.view === "admin" && admin ? (
          <AdminView state={state} onToast={show} />
        ) : route.view === "leaderboard" ? (
          <LeaderboardView state={state} onPlayer={openPlayer} />
        ) : route.view === "games" ? (
          <GamesView state={state} onPlayer={openPlayer} />
        ) : route.view === "tournaments" ? (
          <TournamentsView state={state} onPlayer={openPlayer} />
        ) : route.view === "events" ? (
          <EventsView state={state} />
        ) : (
          <HomeView state={state} onPlayer={openPlayer} onView={go} />
        )}

        {admin && route.view !== "admin" && (
          <div className="px-4 pt-8">
            <button
              type="button"
              onClick={() => go("admin")}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-gold/50 bg-gold-dim/20 text-base font-semibold text-gold-soft transition-colors hover:bg-gold-dim/35"
            >
              ადმინისტრირება
            </button>
          </div>
        )}
        <Watermark />
      </main>

      <BottomNav view={tab ?? "home"} onChange={(v) => go(v)} />

      <LoginSheet
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onDone={() => {
          show("შემოხვედი როგორც ადმინისტრატორი");
          go("admin");
        }}
      />

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}

function LoginSheet({ open, onClose, onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn(password, email);
      setPassword("");
      setError(null);
      onClose();
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="ადმინისტრატორის შესვლა"
      description="პარტიების და მოთამაშეების დამატება მხოლოდ კლუბის ხელმძღვანელს შეუძლია."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {REMOTE_AUTH && (
          <Field label="ელფოსტა">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
        )}

        <Field label="პაროლი">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-loss">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="min-h-12 rounded-lg bg-gold text-base font-semibold text-board-900 transition-opacity disabled:opacity-60"
        >
          {busy ? "შემოწმება" : "შესვლა"}
        </button>
      </form>
    </Sheet>
  );
}
