/**
 * Georgian dates and relative time, computed in Asia/Tbilisi.
 *
 * Everything here ignores the device timezone on purpose: a tournament
 * starts at the same moment for the whole school, whatever a phone is set
 * to. Georgian takes no plural agreement after a numeral — "1 დღე",
 * "5 დღე" — so there are no plural rules, but weekdays do inflect, and the
 * "on Monday" form is ორშაბათს rather than ორშაბათი.
 */

export const TZ = "Asia/Tbilisi";

const MONTHS = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];

const MONTHS_SHORT = [
  "იან", "თებ", "მარ", "აპრ", "მაი", "ივნ",
  "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ",
];

/** Index 0 = Monday. */
export const WEEKDAYS = [
  "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი",
  "პარასკევი", "შაბათი", "კვირა",
];

const WEEKDAYS_LOCATIVE = [
  "ორშაბათს", "სამშაბათს", "ოთხშაბათს", "ხუთშაბათს",
  "პარასკევს", "შაბათს", "კვირას",
];

const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
});

const WEEKDAY_INDEX = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export const toDate = (v) => (v instanceof Date ? v : new Date(v));

export function tbilisiParts(value) {
  const p = parts.formatToParts(toDate(value));
  const get = (t) => p.find((x) => x.type === t)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

export function tbilisiDayNumber(value) {
  const { year, month, day } = tbilisiParts(value);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

export const dayDelta = (to, from = new Date()) =>
  tbilisiDayNumber(to) - tbilisiDayNumber(from);

export function formatTime(value) {
  const { hour, minute } = tbilisiParts(value);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatDate(value, { short = false, year = false } = {}) {
  const p = tbilisiParts(value);
  const names = short ? MONTHS_SHORT : MONTHS;
  return `${p.day} ${names[p.month - 1]}${year ? ` ${p.year}` : ""}`;
}

export const weekdayLocative = (value) =>
  WEEKDAYS_LOCATIVE[tbilisiParts(value).weekday];

/** "ხვალ", "3 დღეში", "გასულია" — for an upcoming event. */
export function describeWhen(value, now = new Date()) {
  const delta = dayDelta(value, now);
  if (delta < 0) return { label: "ჩატარდა", past: true, delta };
  if (delta === 0) return { label: "დღეს", past: false, delta };
  if (delta === 1) return { label: "ხვალ", past: false, delta };
  if (delta === 2) return { label: "ზეგ", past: false, delta };
  if (delta <= 9) return { label: `${delta} დღეში`, past: false, delta };
  return { label: formatDate(value, { short: true }), past: false, delta };
}

export function relativeAgo(value, now = new Date()) {
  const ms = toDate(now).getTime() - toDate(value).getTime();
  if (ms < 60000) return "ახლახან";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} წთ წინ`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} სთ წინ`;
  const d = Math.floor(h / 24);
  if (d === 1) return "გუშინ";
  if (d < 7) return `${d} დღის წინ`;
  return formatDate(value, { short: true });
}

/** Whole days between two instants, for "days holding the title". */
export const daysSince = (value, now = new Date()) =>
  Math.max(0, dayDelta(now, value));

/** Ergative case for attribution: ნინო → ნინომ, მარიამ → მარიამმა. */
const VOWELS = new Set(["ა", "ე", "ი", "ო", "უ"]);
export function ergative(name) {
  if (!name) return "";
  const last = name.trim().slice(-1);
  return name + (VOWELS.has(last) ? "მ" : "მა");
}

/** The value a datetime-local input needs, in Tbilisi wall-clock time. */
export function toLocalInputValue(value) {
  const p = tbilisiParts(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** The inverse: read a datetime-local string as Tbilisi wall-clock time. */
export function fromLocalInputValue(text) {
  if (!text) return null;
  const [date, time = "00:00"] = text.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  // Tbilisi is UTC+4 all year — Georgia has not observed DST since 2005.
  return new Date(Date.UTC(y, m - 1, d, hh - 4, mm, 0));
}
