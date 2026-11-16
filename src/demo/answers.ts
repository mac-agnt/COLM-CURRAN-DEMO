/* Deterministic answers for the Home chat. No model behind this: every
   sentence is built from the current demo state, so after a simulated
   clock-in or approval the answer changes with it. */
import { act, getState, goTo, type DemoState } from "./store";
import { attendanceSummary, customer, daysOverdue, invStatus, jobRollup, openExceptions, pendingDrafts, person, priorityInbox, quoteAge, reconciliation, totals, variance } from "./selectors";
import { eur, fmtDate } from "./format";
import type { RecordRef } from "./types";

export interface AnswerAction { label: string; primary?: boolean; run: () => void; ask?: string }
export interface Answer {
  tool: string;
  effect: "read" | "write";
  text: string;
  cols?: string[];
  rows?: string[][];
  chips?: RecordRef[];
  actions?: AnswerAction[];
}

export const SUGGESTED_QUESTIONS = [
  "Who was on site at 7?",
  "Who was late today?",
  "Who hasn't clocked in?",
  "Which timesheets don't match?",
  "Which invoices are overdue?",
  "Which quotes need chasing?",
  "What's happening at Cappamore?",
  "What's the most important thing for me to do?"
];

const nav = (label: string, page: string, tab?: string, record?: RecordRef, primary = false): AnswerAction =>
  ({ label, primary, run: () => goTo(page, tab, record || null) });

const list = (names: string[]) => names.length <= 1 ? names.join("") : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];

function onSite(s: DemoState): Answer {
  const a = attendanceSummary(s);
  const parts = a.bySite.map(b => {
    const late = b.rows.filter(r => r.status === "Late").map(r => r.person.name + " (" + r.inEvent!.time + ")");
    const miss = b.rows.filter(r => r.status === "No clock-in" || r.status === "Held for review").map(r => r.person.name);
    let t = b.site.name + ": " + b.onTime + " of " + b.scheduled + " on time";
    if (late.length) t += ", " + list(late) + " late";
    if (miss.length) t += ", " + list(miss) + (miss.length > 1 ? " have" : " has") + " no verified clock-in";
    return t + ".";
  });
  const missRow = a.rows.find(r => r.status === "No clock-in");
  return {
    tool: "attendance.rollcall", effect: "read",
    text: "At 07:00, " + a.onTime + " of the " + a.scheduled + " people scheduled were on site on time. " + parts.join(" ")
      + " " + a.clockedIn + " of " + a.scheduled + " have clocked in as of " + s.ui.clock + ". Open a name or job below for the clock events behind it.",
    cols: ["Site", "Scheduled", "On time", "Late", "Missing"],
    rows: a.bySite.map(b => [b.site.name, String(b.scheduled), String(b.onTime), String(b.late), String(b.missing)]),
    chips: [...(missRow ? [{ kind: "person" as const, id: missRow.person.id }] : []), { kind: "job", id: "JOB-101" }, { kind: "job", id: "JOB-102" }, { kind: "job", id: "JOB-103" }],
    actions: [
      ...(missRow ? [{ label: "Request confirmation from " + missRow.person.name.split(" ")[0], primary: true, run: () => act.requestConfirmation(missRow.person.id) }] : []),
      { label: "Open live attendance", run: () => { act.setSiteFilter("all"); goTo("Workforce", "live"); } }
    ]
  };
}

function late(s: DemoState): Answer {
  const a = attendanceSummary(s);
  const rows = a.rows.filter(r => r.status === "Late");
  return {
    tool: "attendance.late", effect: "read",
    text: rows.length
      ? rows.length + " people clocked in after their 07:00 start: " + list(rows.map(r => r.person.name + " at " + r.site.name + " (" + r.inEvent!.time + ", " + r.minsLate + " min)")) + ". "
        + "Declan texted Liam at 07:02 that his bus was delayed; Daniel Fitzgerald texted that Shane was ten minutes out. Lateness is noted, not deducted."
      : "Nobody was late today.",
    cols: ["Person", "Site", "Scheduled", "Clocked in", "Late by"],
    rows: rows.map(r => [r.person.name, r.site.name, r.scheduled, r.inEvent!.time, r.minsLate + " min"]),
    chips: rows.map(r => ({ kind: "person" as const, id: r.person.id })),
    actions: [nav("Open live attendance", "Workforce", "live", undefined, true)]
  };
}

function missing(s: DemoState): Answer {
  const a = attendanceSummary(s);
  const rows = a.rows.filter(r => r.status === "No clock-in" || r.status === "Held for review");
  if (!rows.length) return {
    tool: "attendance.missing", effect: "read",
    text: "Everyone scheduled today has a verified clock-in as of " + s.ui.clock + ". " + a.notScheduled.map(p => p.name).join(" and ") + " are not scheduled today.",
    actions: [nav("Open live attendance", "Workforce", "live", undefined, true)]
  };
  const r = rows[0];
  const draft = s.drafts.find(d => d.kind === "Attendance confirmation" && d.linked.some(l => l.id === r.person.id));
  return {
    tool: "attendance.missing", effect: "read",
    text: r.person.name + " was scheduled at " + r.site.name + " for " + r.scheduled + " and has no " + (r.status === "Held for review" ? "verified " : "") + "clock-in as of " + s.ui.clock + ". "
      + "Liam Walsh texted at 07:16 that he isn't answering. This is a missing event, not a confirmed absence: nothing changes on pay until someone confirms what happened. "
      + (draft ? "A confirmation text is already drafted (" + draft.status.toLowerCase() + ")." : "I can draft a confirmation text, or Liam can add a correction if John turns up."),
    cols: ["Person", "Site", "Scheduled", "Status", "Last contact"],
    rows: rows.map(x => [x.person.name, x.site.name, x.scheduled, x.status, x.person.id === "P01" ? "Liam Walsh, 07:16" : "—"]),
    chips: [{ kind: "person", id: r.person.id }, { kind: "job", id: r.site.jobId }, { kind: "message", id: "MSG-01" }],
    actions: [
      ...(draft ? [] : [{ label: "Request confirmation", primary: true, run: () => act.requestConfirmation(r.person.id) }]),
      { label: "Add supervisor correction", run: () => goTo("Workforce", "live", { kind: "person", id: r.person.id }) },
      nav("Open mobile clock-in", "Workforce", "mobile")
    ]
  };
}

function timesheets(s: DemoState): Answer {
  const open = openExceptions(s);
  const rec = reconciliation(s, "2026-11-16");
  if (!open.length) return {
    tool: "timesheets.reconcile", effect: "read",
    text: "No timesheets are out of line right now. " + s.exceptions.map(x => x.id + " was resolved by " + x.resolution?.reviewer + " (" + x.resolution?.outcome + ")").join(". ") + ".",
    chips: s.exceptions.map(x => ({ kind: "exception" as const, id: x.id })),
    actions: [nav("Open reconciliation", "Timesheets", "reconciliation", undefined, true)]
  };
  const x = open[0];
  return {
    tool: "timesheets.reconcile", effect: "read",
    text: "One line doesn't match. " + x.id + ": " + person(s, x.personId)?.name + " at Cappamore on " + fmtDate(x.date) + " is " + x.internalHours.toFixed(1)
      + "h on our records and " + x.contractorHours.toFixed(1) + "h on the main contractor's register, a +" + variance(x).toFixed(1) + "h difference. "
      + "Our clock events show 06:56 to 15:26 with a 30-minute break, and Liam's site diary says the crew stood down at 15:30 for wind. "
      + "The other " + (rec.length - 1) + " Cappamore lines match. The payroll line is held until a reviewer decides.",
    cols: ["Person", "Date", "Internal", "Contractor", "Difference"],
    rows: rec.map(r => [r.person.name, fmtDate(r.line.date), r.internalHours.toFixed(1) + "h", r.contractorHours.toFixed(1) + "h", (r.delta > 0 ? "+" : "") + r.delta.toFixed(1) + "h"]),
    chips: [{ kind: "exception", id: x.id }, { kind: "person", id: x.personId }, { kind: "message", id: "MSG-02" }],
    actions: [nav("Review " + x.id, "Timesheets", "reconciliation", { kind: "exception", id: x.id }, true)]
  };
}

function invoices(s: DemoState): Answer {
  const t = totals(s);
  const d = s.drafts.find(x => x.linked.some(l => l.id === "INV-301"));
  return {
    tool: "finance.debtors", effect: "read",
    text: (t.overdueInv.length
      ? t.overdueInv.map(i => i.id + " for " + eur(i.amount) + " (" + customer(s, i.customerId)?.name + ", " + i.ref.toLowerCase() + ") is " + daysOverdue(i) + " days overdue").join(". ") + ". "
      : "Nothing is overdue. ")
      + "Total unpaid is " + eur(t.unpaid) + ", of which " + eur(t.overdue) + " is overdue. INV-302 (" + eur(13200) + ") isn't due until 25 November, and INV-303 was paid on 13 November. "
      + (d ? "The reminder for INV-301 is " + d.status.toLowerCase() + "." : "")
      + " Figures come from the QuickBooks export (simulated); QuickBooks stays the system of record.",
    cols: ["Invoice", "Customer", "Amount", "Due", "Status"],
    rows: s.invoices.map(i => [i.id, customer(s, i.customerId)?.name || "", eur(i.amount), fmtDate(i.due), invStatus(i) + (invStatus(i) === "Overdue" ? " · " + daysOverdue(i) + "d" : "")]),
    chips: s.invoices.filter(i => invStatus(i) !== "Paid").map(i => ({ kind: "invoice" as const, id: i.id })),
    actions: [
      ...(d && d.status === "Awaiting approval" ? [{ label: "Approve the INV-301 reminder", primary: true, run: () => act.approveDraft(d.id) }] : []),
      nav("Open debtors", "Finance", "debtors")
    ]
  };
}

function quotes(s: DemoState): Answer {
  const t = totals(s);
  const q201 = s.quotes.find(q => q.id === "QUO-201")!;
  const d = s.drafts.find(x => x.id === "DRF-02");
  return {
    tool: "quotes.aging", effect: "read",
    text: "Two quotes need chasing. QUO-201, the " + eur(q201.value) + " Killorglin roof package, has had no response for " + quoteAge(q201) + " days. "
      + "QUO-203, the " + eur(42000) + " Limerick maintenance contract, was sent on 14 November and its follow-up is due today. "
      + "QUO-202 (Castleisland, " + eur(24800) + " indicative) is still with Eoin waiting on site measurements, so it isn't ready to chase. "
      + "Active pipeline is " + eur(t.pipeline) + " across " + t.pipelineCount + " opportunities. "
      + (d ? "The QUO-201 follow-up is " + d.status.toLowerCase() + "." : ""),
    cols: ["Quote", "Customer", "Value", "Stage", "Age"],
    rows: t.active.map(q => [q.id, customer(s, q.customerId)?.name || "", eur(q.value) + (q.indicative ? " (indicative)" : ""), q.stage, q.sentDate ? quoteAge(q) + " days" : "—"]),
    chips: t.active.map(q => ({ kind: "quote" as const, id: q.id })),
    actions: [
      ...(d && d.status === "Awaiting approval" ? [{ label: "Approve the QUO-201 follow-up", primary: true, run: () => act.approveDraft(d.id) }] : []),
      nav("Open quote follow-ups", "Quotations", "followups")
    ]
  };
}

function cappamore(s: DemoState): Answer {
  const r = jobRollup(s, "JOB-101");
  const onTime = r.att.filter(x => x.status === "On time").length;
  const lateN = r.att.filter(x => x.status === "Late").length;
  const miss = r.att.filter(x => x.status === "No clock-in" || x.status === "Held for review");
  const exc = r.exceptions.find(x => x.status === "Open");
  return {
    tool: "sites.job", effect: "read",
    text: "Cappamore (JOB-101, " + eur(r.job.contractValue) + " contract) is " + r.job.pctComplete + "% complete against " + r.job.plannedPct + "% planned. Next milestone: "
      + (r.nextMilestone ? r.nextMilestone.name + ", forecast " + fmtDate(r.nextMilestone.forecast) : "hand-over") + ". "
      + "Today " + r.att.length + " are scheduled: " + onTime + " on time, " + lateN + " late"
      + (miss.length ? ", and " + list(miss.map(m => m.person.name)) + " with no verified clock-in" : "") + ". "
      + (exc ? exc.id + " (Patrick O'Sullivan, +" + variance(exc).toFixed(1) + "h on 16 Nov) is open with the main contractor. " : "")
      + (r.overdue ? "INV-301 for " + eur(r.overdue) + " is " + daysOverdue(s.invoices.find(i => i.id === "INV-301")!) + " days overdue. " : "")
      + r.openIssues.length + " site issues are open, including the Rev C eaves detail for Block C.",
    cols: ["Area", "Status"],
    rows: [
      ["Crew today", onTime + " on time · " + lateN + " late · " + miss.length + " missing"],
      ["Progress", r.job.pctComplete + "% (planned " + r.job.plannedPct + "%)"],
      ["Timesheets", exc ? exc.id + " open" : "All matched"],
      ["Money", r.overdue ? eur(r.overdue) + " overdue" : "Nothing overdue"],
      ["Issues", r.openIssues.length + " open"]
    ],
    chips: [{ kind: "job", id: "JOB-101" }, ...(miss[0] ? [{ kind: "person" as const, id: miss[0].person.id }] : []), ...(exc ? [{ kind: "exception" as const, id: exc.id }] : []), { kind: "invoice", id: "INV-301" }],
    actions: [{ label: "Open the Cappamore job", primary: true, run: () => goTo("Sites", "jobs", { kind: "job", id: "JOB-101" }) }, { label: "Cappamore attendance", run: () => { act.setSiteFilter("SITE-CAP"); goTo("Workforce", "live"); } }]
  };
}

function important(s: DemoState): Answer {
  const a = attendanceSummary(s);
  const miss = a.rows.find(r => r.status === "No clock-in");
  const exc = openExceptions(s)[0];
  const drafts = pendingDrafts(s);
  const steps: string[] = [];
  if (miss) steps.push("confirm where " + miss.person.name + " is (Cappamore, no clock-in)");
  if (exc) steps.push("decide " + exc.id + " before Friday's payroll");
  if (drafts.length) steps.push("approve " + drafts.length + " drafted " + (drafts.length === 1 ? "reply" : "replies") + ", led by the " + eur(24600) + " INV-301 reminder and the QUO-201 follow-up");
  steps.push("get the Castleisland rear elevation measured so Eoin can firm up QUO-202");
  return {
    tool: "briefing.priorities", effect: "read",
    text: (miss ? "The most important thing is " + miss.person.name + ". " : "Attendance is settled. ")
      + "In order: " + steps.map((x, i) => (i + 1) + ". " + x).join("; ") + ". Everything else (" + (priorityInbox(s).length) + " priority threads, " + s.issues.filter(i => i.status === "Open").length + " site issues) is either covered by a site lead or can wait until this evening.",
    chips: [...(miss ? [{ kind: "person" as const, id: miss.person.id }] : []), ...(exc ? [{ kind: "exception" as const, id: exc.id }] : []), { kind: "invoice", id: "INV-301" }, { kind: "quote", id: "QUO-201" }, { kind: "quote", id: "QUO-202" }],
    actions: [
      ...(miss ? [{ label: "Request confirmation", primary: true, run: () => act.requestConfirmation(miss.person.id) }] : []),
      nav("Open the approval queue", "Agents", "approvals", undefined, !miss)
    ]
  };
}

function briefing(s: DemoState): Answer {
  return { tool: "briefing.morning", effect: "read", text: morningBriefing(s), chips: [{ kind: "person", id: "P01" }, { kind: "exception", id: "EXC-401" }, { kind: "invoice", id: "INV-301" }, { kind: "quote", id: "QUO-201" }],
    actions: [nav("Review drafts", "Communications", "drafts", undefined, true)] };
}

function qs(s: DemoState): Answer {
  const q = s.quotes.find(x => x.id === "QUO-202")!;
  const e = s.estimates.find(x => x.id === "EST-202")!;
  return {
    tool: "quotes.qs", effect: "read",
    text: "Castleisland (QUO-202) came in as a phone call on 13 November, drawings arrived on the 16th and Rev B on the 17th. Eoin has a " + e.version + " draft at " + eur(q.value)
      + " indicative, but the hip and valley lengths on the rear elevation don't scale reliably, so he needs site measurements. Stage: " + q.stage + ". Estimate status: " + e.status.toLowerCase()
      + ". It is not a formal quote and has not been sent.",
    chips: [{ kind: "quote", id: "QUO-202" }, { kind: "estimate", id: "EST-202" }, { kind: "document", id: "DOC-202B" }],
    actions: [nav("Open QS estimate", "Quotations", "estimates", undefined, true)]
  };
}

export function morningBriefing(s: DemoState): string {
  const a = attendanceSummary(s);
  const t = totals(s);
  const miss = a.rows.find(r => r.status === "No clock-in" || r.status === "Held for review");
  const exc = openExceptions(s)[0];
  const q = s.quotes.find(x => x.id === "QUO-201")!;
  const drafts = pendingDrafts(s);
  return "Good morning, Colm. You have " + a.scheduled + " workers scheduled across three sites: " + a.onTime + " on time, " + numWord(a.late) + " late and "
    + numWord(a.missing) + " clock-in" + (a.missing === 1 ? "" : "s") + " unverified. "
    + (miss ? miss.person.name + " hasn't checked in at " + miss.site.name + " as of " + s.ui.clock + ". " : "Everyone scheduled has checked in. ")
    + (exc ? "A two-hour timesheet difference for " + person(s, exc.personId)?.name + " needs review. " : "No timesheet differences are open. ")
    + "Your overdue balance is " + eur(t.overdue) + ", and the " + eur(q.value) + " Killorglin quote has had no response for " + numWord(quoteAge(q)) + " days. "
    + (drafts.length ? "I've prepared the follow-ups for approval." : "The follow-ups are approved.");
}
const numWord = (n: number) => ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] || String(n);

export function answer(q: string): Answer {
  const s = getState();
  const t = q.toLowerCase();
  if (/import|first thing|priority|priorit|what should i|most important|do first/.test(t)) return important(s);
  if (/brief|summary|morning|today\b.*overview/.test(t)) return briefing(s);
  if (/cappamore|job-101/.test(t)) return cappamore(s);
  if (/hasn.?t clocked|not clocked|no clock|missing|john|murphy|who.*(isn.?t|not) (in|on site)/.test(t)) return missing(s);
  if (/late/.test(t)) return late(s);
  if (/on.?site|at 7|7 ?am|07:00|roll ?call|who (was|is) (on|at|in)/.test(t)) return onSite(s);
  if (/timesheet|match|variance|exc-401|patrick|hours/.test(t)) return timesheets(s);
  if (/invoice|overdue|owe|debtor|payment|paid|cash/.test(t)) return invoices(s);
  if (/castleisland|qs\b|drawing|estimate|quo-202/.test(t)) return qs(s);
  if (/quote|chas|follow|pipeline|killorglin/.test(t)) return quotes(s);
  return {
    tool: "pulse.search", effect: "read",
    text: "I can answer from Colm Curran Roofing's records in this demo: attendance and clock events, timesheets and reconciliations, quotes and QS estimates, invoices from the QuickBooks export (simulated), site issues and the inbox. Try one of these.",
    actions: SUGGESTED_QUESTIONS.slice(0, 4).map(x => ({ label: x, ask: x, run: () => {} }))
  };
}
