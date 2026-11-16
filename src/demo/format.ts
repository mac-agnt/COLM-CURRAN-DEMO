/* Formatting helpers. All dates are fixed to the demo clock, never the system clock. */

export const eur = (n: number, opts: { k?: boolean } = {}) => {
  if (opts.k && Math.abs(n) >= 1000) return "€" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
  return "€" + Math.round(n).toLocaleString("en-IE");
};

export const hrs = (n: number) => n.toFixed(1) + "h";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parse "2026-11-18" or "2026-11-18T07:16" as a local date with no timezone drift. */
export function parse(iso: string): Date {
  const [d, t] = iso.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = (t || "00:00").split(":").map(Number);
  return new Date(y, m - 1, day, hh || 0, mm || 0);
}

export const fmtDate = (iso: string) => {
  const d = parse(iso);
  return DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()];
};
export const fmtShortDate = (iso: string) => {
  const d = parse(iso);
  return d.getDate() + " " + MONTHS[d.getMonth()];
};
export const fmtTime = (iso: string) => (iso.split("T")[1] || "").slice(0, 5);

/** "07:16", "Tue 16:42" or "13 Nov" relative to the demo day. */
export function fmtWhen(iso: string, today: string): string {
  const day = iso.slice(0, 10);
  if (day === today) return fmtTime(iso);
  const diff = daysBetween(day, today);
  if (diff > 0 && diff < 7) return DAYS[parse(iso).getDay()] + " " + fmtTime(iso);
  return fmtShortDate(iso);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = parse(fromIso.slice(0, 10)), b = parse(toIso.slice(0, 10));
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export const toMins = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
export const fromMins = (m: number) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");

export const initials = (name: string) => name.split(/\s+/).filter(w => /[A-Za-z]/.test(w[0] || "")).map(w => w[0]).slice(0, 2).join("").toUpperCase();

export const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);
