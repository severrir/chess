import { CalendarDays, MapPin } from "lucide-react";
import { Empty } from "./LeaderboardView.jsx";
import {
  describeWhen,
  formatDate,
  formatTime,
  weekdayLocative,
} from "../lib/georgian.js";

/**
 * Blitz afternoons, tournaments and inter-school matches.
 *
 * Upcoming first, because that is the only part anyone can still act on;
 * past fixtures stay below as a record, dimmed rather than hidden.
 */
export default function EventsView({ state }) {
  const sorted = [...state.events].sort(
    (a, b) => new Date(a.startsAt) - new Date(b.startsAt),
  );
  const upcoming = sorted.filter((e) => !describeWhen(e.startsAt).past);
  const past = sorted
    .filter((e) => describeWhen(e.startsAt).past)
    .reverse();

  return (
    <div className="flex flex-col gap-7 px-4 pt-6">
      <section>
        <h2 className="font-serif text-xl font-semibold text-ivory">
          მომავალი
        </h2>
        {upcoming.length === 0 ? (
          <div className="mt-2">
            <Empty
              title="დაგეგმილი არაფერია"
              body="შემდეგი ბლიცის დღე მალე გამოცხადდება."
            />
          </div>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold text-ivory">
            ჩატარებული
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {past.map((e) => (
              <EventCard key={e.id} event={e} past />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function EventCard({ event, past = false }) {
  const when = describeWhen(event.startsAt);
  const soon = !past && when.delta <= 2;

  return (
    <li className={`sheet px-4 py-3.5 ${past ? "opacity-60" : ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-lg text-ivory">{event.title}</h3>
        <span
          className={`shrink-0 text-sm font-semibold ${
            soon ? "text-gold-soft" : "text-ivory-3"
          }`}
        >
          {when.label}
        </span>
      </div>

      <p className="tnum mt-1 inline-flex items-center gap-1.5 text-sm text-ivory-2">
        <CalendarDays size={13} strokeWidth={1.75} aria-hidden="true" />
        {weekdayLocative(event.startsAt)}, {formatDate(event.startsAt)},{" "}
        {formatTime(event.startsAt)}
      </p>

      <p className="mt-1 inline-flex items-center gap-1.5 text-meta text-ivory-3">
        <MapPin size={13} strokeWidth={1.75} aria-hidden="true" />
        {event.location}
      </p>

      {event.note && (
        <p className="measure mt-2 border-t border-rule pt-2 text-sm text-ivory-2">
          {event.note}
        </p>
      )}
    </li>
  );
}
