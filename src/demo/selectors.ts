/* Derived views. Every total on screen comes from here, computed from rows. */
import { DEMO_DATE } from "./fixtures";
import { daysBetween, eur, fmtDate, toMins } from "./format";
import type { DemoState } from "./store";
import type { ClockEvent, Draft, Invoice, Person, Quote, RecordRef, Site, TimesheetException } from "./types";

export const TODAY = DEMO_DATE;

export const byId = <T extends { id: string }>(list: T[], id?: string) => list.find(x => x.id === id);
export const person = (s: DemoState, id?: string) => byId(s.people, id);
export const site = (s: DemoState, id?: string) => byId(s.sites, id);
export const job = (s: DemoState, id?: string) => byId(s.jobs, id);
export const customer = (s: DemoState, id?: string) => byId(s.customers, id);
export const quote = (s: DemoState, id?: string) => byId(s.quotes, id);
export const invoice = (s: DemoState, id?: string) => byId(s.invoices, id);

/* ── attendance ── */
export type AttStatus = "On time" | "Late" | "No clock-in" | "Held for review";

export interface AttRow {
  person: Person;
  site: Site;
  scheduled: string;
  inEvent?: ClockEvent;
  outEvent?: ClockEvent;
  status: AttStatus;
  minsLate: number;
  hoursSoFar: number;
  correction: boolean;
}

export function attendance(s: DemoState, siteId = "all"): AttRow[] {
  return s.allocations.filter(a => a.date === TODAY && (siteId === "all" || a.siteId === siteId)).map(a => {
    const evs = s.clockEvents.filter(e => e.personId === a.personId && e.date === TODAY);
    const inEvent = evs.filter(e => e.type === "in").sort((x, y) => toMins(x.time) - toMins(y.time))[0];
    const outEvent = evs.filter(e => e.type === "out").pop();
    const late = inEvent ? Math.max(0, toMins(inEvent.time) - toMins(a.start)) : 0;
    const status: AttStatus = !inEvent ? "No clock-in" : !inEvent.verified ? "Held for review" : late > 0 ? "Late" : "On time";
    const end = outEvent ? toMins(outEvent.time) : toMins(s.ui.clock);
    const hoursSoFar = inEvent ? Math.max(0, (end - toMins(inEvent.time)) / 60) : 0;
    return { person: person(s, a.personId)!, site: site(s, a.siteId)!, scheduled: a.start, inEvent, outEvent, status, minsLate: late,
      hoursSoFar, correction: s.corrections.some(c => c.personId === a.personId && c.date === TODAY) };
  }).sort((x, y) => order(x.status) - order(y.status) || x.site.name.localeCompare(y.site.name) || x.person.name.localeCompare(y.person.name));
}
const order = (st: AttStatus) => ({ "No clock-in": 0, "Held for review": 1, Late: 2, "On time": 3 }[st]);

export function attendanceSummary(s: DemoState) {
  const rows = attendance(s);
  const count = (st: AttStatus, list = rows) => list.filter(r => r.status === st).length;
  const field = s.people.filter(p => p.kind === "field");
  const scheduledIds = new Set(rows.map(r => r.person.id));
  return {
    rows,
    fieldCrew: field.length,
    scheduled: rows.length,
    onTime: count("On time"),
    late: count("Late"),
    missing: count("No clock-in") + count("Held for review"),
    noClock: count("No clock-in"),
    held: count("Held for review"),
    clockedIn: rows.filter(r => r.inEvent).length,
    notScheduled: field.filter(p => !scheduledIds.has(p.id)),
    bySite: s.sites.map(st => {
      const r = rows.filter(x => x.site.id === st.id);
      return { site: st, scheduled: r.length, onTime: count("On time", r), late: count("Late", r),
        missing: count("No clock-in", r) + count("Held for review", r), clockedIn: r.filter(x => x.inEvent).length, rows: r };
    })
  };
}

/* ── money ── */
export type InvStatus = "Paid" | "Overdue" | "Unpaid";
export const invStatus = (inv: Invoice): InvStatus => inv.paidDate ? "Paid" : daysBetween(inv.due, TODAY) > 0 ? "Overdue" : "Unpaid";
export const daysOverdue = (inv: Invoice) => inv.paidDate ? 0 : Math.max(0, daysBetween(inv.due, TODAY));
export const daysToDue = (inv: Invoice) => daysBetween(TODAY, inv.due);

export const ACTIVE_STAGES = ["New Enquiry", "Drawings Received", "With QS", "Colm Review", "Sent", "Follow-up"];
export const PIPELINE_STAGES = ["New Enquiry", "Drawings Received", "With QS", "Colm Review", "Sent", "Follow-up", "Won", "Lost"] as const;
export const quoteAge = (q: Quote) => (q.sentDate ? daysBetween(q.sentDate, TODAY) : 0);

export function totals(s: DemoState) {
  const unpaidInv = s.invoices.filter(i => invStatus(i) !== "Paid");
  const overdueInv = s.invoices.filter(i => invStatus(i) === "Overdue");
  const active = s.quotes.filter(q => ACTIVE_STAGES.includes(q.stage));
  return {
    contractValue: s.jobs.reduce((n, j) => n + j.contractValue, 0),
    pipeline: active.reduce((n, q) => n + q.value, 0),
    pipelineCount: active.length,
    indicativeCount: active.filter(q => q.indicative).length,
    unpaid: unpaidInv.reduce((n, i) => n + i.amount, 0),
    overdue: overdueInv.reduce((n, i) => n + i.amount, 0),
    paid: s.invoices.filter(i => invStatus(i) === "Paid").reduce((n, i) => n + i.amount, 0),
    invoiced: s.invoices.reduce((n, i) => n + i.amount, 0),
    overdueInv, unpaidInv, active,
    staleQuotes: active.filter(q => q.followUpDue && daysBetween(q.followUpDue, TODAY) >= 0 && !q.indicative)
  };
}

/* ── timesheets ── */
export const openExceptions = (s: DemoState) => s.exceptions.filter(e => e.status === "Open");
export const variance = (x: TimesheetException) => x.contractorHours - x.internalHours;

export function reconciliation(s: DemoState, date: string) {
  return s.contractorLines.filter(l => l.date === date).map(l => {
    const internal = s.dayRecords.find(d => d.personId === l.personId && d.date === date);
    const exc = s.exceptions.find(e => e.personId === l.personId && e.date === date);
    const ih = exc ? exc.internalHours : internal ? internal.hours : 0;
    return { line: l, person: person(s, l.personId)!, internal, internalHours: ih, contractorHours: l.hours, delta: l.hours - ih, exception: exc };
  });
}

export function weekHours(s: DemoState, personId: string) {
  return s.dayRecords.filter(d => d.personId === personId).reduce((n, d) => n + d.hours, 0);
}

export function payroll(s: DemoState) {
  const field = s.people.filter(p => p.kind === "field");
  return field.map(p => {
    const days = s.dayRecords.filter(d => d.personId === p.id);
    const approved = days.filter(d => d.status === "Approved" || d.status === "Exported").reduce((n, d) => n + d.hours, 0);
    const pending = days.filter(d => d.status === "Submitted").reduce((n, d) => n + d.hours, 0);
    const held = days.filter(d => d.status === "Exception");
    return { person: p, days: days.length, approved, pending, heldHours: held.reduce((n, d) => n + d.hours, 0), held: held.length > 0 };
  });
}

/* ── approvals: one queue across drafts, exceptions, estimates, agent findings ── */
export interface ApprovalItem {
  id: string;
  kind: "Draft" | "Timesheet variance" | "QS estimate" | "Agent finding";
  title: string;
  detail: string;
  reviewer: string;
  department: string;
  deadline: string;
  status: string;
  related: RecordRef[];
  ref: RecordRef;
}

export function approvals(s: DemoState): ApprovalItem[] {
  const out: ApprovalItem[] = [];
  s.exceptions.forEach(x => out.push({ id: x.id, kind: "Timesheet variance", title: x.id + ": " + person(s, x.personId)?.name + ", +" + variance(x).toFixed(1) + "h",
    detail: fmtDate(x.date) + " · " + job(s, x.jobId)?.title + " · internal " + x.internalHours.toFixed(1) + "h vs contractor " + x.contractorHours.toFixed(1) + "h",
    reviewer: "Aoife O'Shea / Colm Curran", department: "Office", deadline: "Before Friday payroll", status: x.status === "Open" ? "Awaiting approval" : "Approved",
    related: [{ kind: "person", id: x.personId }, { kind: "job", id: x.jobId }], ref: { kind: "exception", id: x.id } }));
  s.drafts.forEach(d => out.push({ id: d.id, kind: "Draft", title: d.kind + ": " + d.subject, detail: "To " + d.to + " · drafted by " + agentName(s, d.agentId),
    reviewer: "Colm Curran", department: d.kind === "Payment reminder" ? "Finance" : d.kind === "Attendance confirmation" ? "Operations" : "Commercial",
    deadline: d.kind === "Attendance confirmation" ? "Now" : "Today", status: d.status, related: d.linked, ref: { kind: "draft", id: d.id } }));
  s.estimates.forEach(e => out.push({ id: e.id, kind: "QS estimate", title: e.id + ": " + quote(s, e.quoteId)?.title + " (" + e.version + ")",
    detail: "Indicative " + eur(estimateTotal(e)) + " · " + e.status, reviewer: e.status === "Awaiting measurements" ? "Eoin McCarthy (QS)" : "Colm Curran",
    department: "Commercial", deadline: "Fri 20 Nov",
    status: e.status === "Approved" ? "Approved" : e.status === "With Colm" ? "Awaiting approval" : "Drafted",
    related: [{ kind: "quote", id: e.quoteId }], ref: { kind: "estimate", id: e.id } }));
  return out;
}

export const estimateTotal = (e: { lines: { qty: number; rate: number }[] }) => e.lines.reduce((n, l) => n + l.qty * l.rate, 0);
export const agentName = (s: DemoState, id: string) => s.agents.find(a => a.id === id)?.name || id;

export const pendingDrafts = (s: DemoState) => s.drafts.filter(d => d.status === "Awaiting approval");
export const draftFor = (s: DemoState, ref: RecordRef): Draft | undefined =>
  s.drafts.find(d => d.linked.some(l => l.kind === ref.kind && l.id === ref.id) && d.status !== "Rejected");

/* ── inbox ── */
export const priorityInbox = (s: DemoState) => s.messages.filter(m => m.priority).sort((a, b) => a.rank - b.rank);
export const inboxSorted = (s: DemoState) => s.messages.slice().sort((a, b) => b.at.localeCompare(a.at));

/* ── job roll-up: everything linked to one job ── */
export function jobRollup(s: DemoState, jobId: string) {
  const j = job(s, jobId)!;
  const st = site(s, j.siteId)!;
  const att = attendance(s, st.id);
  const invs = s.invoices.filter(i => i.jobId === jobId);
  const cost = j.costToDate.labour + j.costToDate.material + j.costToDate.subcontract;
  const budget = j.budgetCost.labour + j.budgetCost.material + j.budgetCost.subcontract;
  return {
    job: j, site: st, customer: customer(s, j.customerId)!, lead: person(s, st.leadId)!, att,
    issues: s.issues.filter(i => i.siteId === st.id),
    openIssues: s.issues.filter(i => i.siteId === st.id && i.status === "Open"),
    invoices: invs,
    unpaid: invs.filter(i => invStatus(i) !== "Paid").reduce((n, i) => n + i.amount, 0),
    overdue: invs.filter(i => invStatus(i) === "Overdue").reduce((n, i) => n + i.amount, 0),
    invoiced: invs.reduce((n, i) => n + i.amount, 0),
    exceptions: s.exceptions.filter(x => x.jobId === jobId),
    docs: s.documents.filter(d => d.jobId === jobId),
    messages: s.messages.filter(m => m.linked.some(l => (l.kind === "job" && l.id === jobId))),
    tasks: s.tasks.filter(t => t.related.some(r => r.kind === "job" && r.id === jobId)),
    audit: s.audit.filter(a => a.related.some(r => (r.kind === "job" && r.id === jobId) || (r.kind === "invoice" && invs.some(i => i.id === r.id))
      || (r.kind === "person" && att.some(x => x.person.id === r.id)) || (r.kind === "exception" && s.exceptions.some(x => x.id === r.id && x.jobId === jobId)))),
    cost, budget, margin: j.contractValue - budget, marginPct: Math.round(100 * (j.contractValue - budget) / j.contractValue),
    nextMilestone: j.milestones.find(m => !m.done)
  };
}

/* ── record labels, search and routing ── */
export function recordLabel(s: DemoState, r: RecordRef): string {
  switch (r.kind) {
    case "person": return person(s, r.id)?.name || r.id;
    case "customer": return customer(s, r.id)?.name || r.id;
    case "site": return (site(s, r.id)?.name || r.id) + " site";
    case "job": return r.id + " · " + (job(s, r.id)?.title || "");
    case "quote": return r.id + " · " + (quote(s, r.id)?.title || "");
    case "invoice": { const i = invoice(s, r.id); return r.id + (i ? " · " + eur(i.amount) : ""); }
    case "exception": return r.id + " · timesheet variance";
    case "estimate": return r.id + " · QS estimate";
    case "enquiry": return r.id + " · " + (byId(s.enquiries, r.id)?.title || "");
    case "document": { const d = byId(s.documents, r.id); return d ? d.title + " (" + d.version + ")" : r.id; }
    case "message": return byId(s.messages, r.id)?.subject || r.id;
    case "draft": { const d = byId(s.drafts, r.id); return d ? "Draft: " + d.kind.toLowerCase() : r.id; }
    case "issue": return r.id + " · " + (byId(s.issues, r.id)?.title || "");
    case "agent": return agentName(s, r.id);
    default: return r.id;
  }
}

export interface SearchHit { ref: RecordRef; title: string; meta: string }

export function searchRecords(s: DemoState, q: string, limit = 40): SearchHit[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const hits: SearchHit[] = [];
  const push = (ref: RecordRef, title: string, meta: string, hay: string) => { if (hay.toLowerCase().includes(t)) hits.push({ ref, title, meta }); };
  s.jobs.forEach(j => push({ kind: "job", id: j.id }, j.id + " · " + j.title, "Job · " + customer(s, j.customerId)?.name, j.id + " " + j.title + " " + customer(s, j.customerId)?.name + " " + site(s, j.siteId)?.name));
  s.people.forEach(p => push({ kind: "person", id: p.id }, p.name, p.role + (p.homeSiteId ? " · " + site(s, p.homeSiteId)?.name : ""), p.name + " " + p.role));
  s.customers.forEach(c => push({ kind: "customer", id: c.id }, c.name, "Customer · " + c.contact, c.name + " " + c.contact + " " + c.county));
  s.quotes.forEach(q2 => push({ kind: "quote", id: q2.id }, q2.id + " · " + q2.title, "Quote · " + q2.stage + " · " + eur(q2.value), q2.id + " " + q2.title + " " + customer(s, q2.customerId)?.name));
  s.invoices.forEach(i => push({ kind: "invoice", id: i.id }, i.id + " · " + eur(i.amount), "Invoice · " + invStatus(i) + " · " + customer(s, i.customerId)?.name, i.id + " " + customer(s, i.customerId)?.name + " " + i.jobId));
  s.exceptions.forEach(x => push({ kind: "exception", id: x.id }, x.id + " · " + person(s, x.personId)?.name, "Timesheet variance · " + x.status, x.id + " " + person(s, x.personId)?.name + " " + x.jobId + " timesheet"));
  s.enquiries.forEach(e => push({ kind: "enquiry", id: e.id }, e.id + " · " + e.title, "Enquiry · " + e.stage, e.id + " " + e.title + " " + customer(s, e.customerId)?.name));
  s.documents.forEach(d => push({ kind: "document", id: d.id }, d.title, d.kind + " · " + d.version, d.title + " " + d.kind + " " + (d.quoteId || "") + " " + (d.jobId || "")));
  s.sites.forEach(x => push({ kind: "site", id: x.id }, x.name + " site", x.town + ", " + x.county, x.name + " " + x.town + " " + x.county));
  s.messages.forEach(m => push({ kind: "message", id: m.id }, m.subject, m.channel + " · " + m.from, m.subject + " " + m.from + " " + m.body));
  return hits.slice(0, limit);
}

/** Which page a record naturally lives on. */
export function recordHome(r: RecordRef): { page: string; tab?: string } {
  switch (r.kind) {
    case "person": return { page: "Workforce", tab: "staff" };
    case "job": case "site": case "issue": return { page: "Sites", tab: "jobs" };
    case "quote": case "estimate": case "enquiry": return { page: "Quotations", tab: "quotes" };
    case "invoice": return { page: "Finance", tab: "invoices" };
    case "exception": return { page: "Timesheets", tab: "reconciliation" };
    case "message": case "draft": return { page: "Communications", tab: "inbox" };
    case "customer": return { page: "Communications", tab: "history" };
    default: return { page: "Records" };
  }
}

/* ── finance ── */
export function jobCosts(s: DemoState) {
  return s.jobs.map(j => {
    const r = jobRollup(s, j.id);
    const earnedBudget = r.budget * (j.pctComplete / 100);
    return { ...r, earnedBudget, variance: earnedBudget - r.cost };
  });
}

export function cashForecast(s: DemoState) {
  const slip = s.ui.forecastSlip;
  // Illustrative weekly view for the next six weeks. Inflows come from the invoice rows;
  // wages and materials are illustrative run-rates, clearly marked as mock in the UI.
  const weeks = ["w/c 16 Nov", "w/c 23 Nov", "w/c 30 Nov", "w/c 7 Dec", "w/c 14 Dec", "w/c 21 Dec"];
  const inflow = [0, 0, 0, 0, 0, 0];
  s.invoices.filter(i => invStatus(i) !== "Paid").forEach(i => {
    let wk = i.id === "INV-301" ? (slip ? 4 : 1) : i.id === "INV-302" ? 1 : Math.min(5, Math.max(0, Math.floor(daysBetween(TODAY, i.due) / 7) + 1));
    inflow[wk] += i.amount;
  });
  inflow[3] += 26400; // payment application 4, JOB-101 (illustrative)
  inflow[4] += 14800; // payment application 2, JOB-102 (illustrative)
  inflow[2] += 9500;  // stage payment, JOB-103 houses 5–6 (illustrative)
  const wages = [15600, 15600, 15600, 15600, 15600, 9400];
  const materials = [6200, 9800, 4100, 7300, 3900, 1200];
  let bal = 41800; // illustrative opening bank balance
  return weeks.map((w, i) => {
    const out = wages[i] + materials[i];
    bal += inflow[i] - out;
    return { week: w, inflow: inflow[i], wages: wages[i], materials: materials[i], out, net: inflow[i] - out, balance: bal };
  });
}

export const quotesByStage = (s: DemoState) =>
  PIPELINE_STAGES.map(stage => ({ stage, quotes: s.quotes.filter(q => q.stage === stage), enquiries: s.enquiries.filter(e => !e.quoteId && e.stage === stage) }));
