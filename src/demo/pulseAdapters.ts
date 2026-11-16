/* Adapters: shape the demo store into the data structures the original Pulse
   views already render (KPI band, Dashboard areas, Work approvals and tasks,
   Activity lanes, notifications). One source of truth, legacy shapes. */
import { act, goTo, type DemoState } from "./store";
import {
  agentName, attendanceSummary, customer, daysOverdue, estimateTotal, invStatus, jobCosts, jobRollup, openExceptions,
  pendingDrafts, person, priorityInbox, quoteAge, reconciliation, totals
} from "./selectors";
import { daysBetween, eur, fmtTime, fmtWhen, initials, parse } from "./format";
import { DEMO_DATE } from "./fixtures";

const OK = "var(--ok)", WARN = "var(--warn)", BAD = "var(--bad)";

/* ── KPI band ── */
export function kpiDefs(s: DemoState) {
  const a = attendanceSummary(s), t = totals(s);
  const appr = approvalsWaiting(s);
  return {
    attendance: { label: "On site at 07:00", value: a.onTime + " of " + a.scheduled, delta: a.late + " late · " + a.missing + " unverified", dir: a.missing ? "down" : "up", hint: "" },
    contract: { label: "Active contracts", value: eur(t.contractValue), delta: "3 jobs", dir: "up", hint: "contracted, not earned" },
    pipeline: { label: "Quote pipeline", value: eur(t.pipeline), delta: t.pipelineCount + " active", dir: "up", hint: t.indicativeCount + " indicative" },
    unpaid: { label: "Unpaid invoices", value: eur(t.unpaid), delta: t.unpaidInv.length + " invoices", dir: "up", hint: "QuickBooks export (sim.)" },
    overdue: { label: "Overdue", value: eur(t.overdue), delta: t.overdueInv.map(i => daysOverdue(i) + " days").join(", ") || "none", dir: t.overdue ? "down" : "up", hint: "" },
    approvals: { label: "Waiting on you", value: String(appr), delta: "approvals", dir: appr ? "down" : "up", hint: "" },
    variance: { label: "Timesheet variance", value: openExceptions(s).reduce((n, x) => n + (x.contractorHours - x.internalHours), 0).toFixed(1) + "h", delta: openExceptions(s).length + " open", dir: openExceptions(s).length ? "down" : "up", hint: "vs main contractor" },
    crew: { label: "Clocked in", value: a.clockedIn + " / " + a.scheduled, delta: "at " + s.ui.clock, dir: "up", hint: a.fieldCrew + " field crew" }
  } as Record<string, { label: string; value: string; delta: string; dir: string; hint: string }>;
}

export function approvalsWaiting(s: DemoState) {
  return pendingDrafts(s).length + openExceptions(s).length + s.estimates.filter(e => e.status === "With Colm").length;
}

/* ── Dashboard areas (Executive, Delivery, Labour, Commercial) ── */
export function aspects(s: DemoState) {
  const a = attendanceSummary(s), t = totals(s);
  const jc = jobCosts(s);
  const hoursBy = (siteJob: string, d: string) => s.dayRecords.filter(r => r.jobId === siteJob && r.date === d).reduce((n, r) => n + r.hours, 0);
  const liveBy = (siteId: string) => Math.round(a.rows.filter(r => r.site.id === siteId).reduce((n, r) => n + r.hoursSoFar, 0) * 10) / 10;
  const open = openExceptions(s);
  const stale = t.active.filter(q => q.sentDate);
  return [
    { id: "executive", label: "Executive", color: "var(--accent)", owner: "COLM CURRAN", description: "Owner control centre. Contracted value, cash owed, pipeline and today's crew. Illustrative demo data.",
      kind: "columns", chartTitle: "Invoiced vs paid by month (illustrative)", chartUnit: "EUR",
      chart: [["Jun", 31, "€31k"], ["Jul", 38, "€38k"], ["Aug", 44, "€44k"], ["Sep", 52, "€52k"], ["Oct", 46, "€46k"], ["Nov", Math.round(t.invoiced / 1000), eur(t.invoiced, { k: true })]],
      splitTitle: "Contract value by job", split: s.jobs.map((j, i) => [j.title.replace(/ (Housing Roof Package|Commercial Roofing|Re-roofing Programme)/, ""), eur(j.contractValue), Math.round(100 * j.contractValue / t.contractValue) + "%", i === 0 ? 1 : 0]),
      tableCols: ["Job", "Contract", "Progress", "Owed"],
      table: s.jobs.map(j => { const r = jobRollup(s, j.id); return [j.id + " " + j.title.split(" ")[0], eur(j.contractValue), "+" + j.pctComplete + "%", r.overdue ? eur(r.overdue) + " overdue" : r.unpaid ? eur(r.unpaid) + " unpaid" : "Nothing owed"]; }),
      metrics: [["Active contracts", eur(t.contractValue), "+3 jobs", "up", "contracted, not earned", [.4, .5, .55, .6, .62, .7, .74, .8, 1]],
        ["Unpaid", eur(t.unpaid), "+" + eur(t.overdue) + " overdue", "down", "QuickBooks export (sim.)", [.3, .4, .5, .45, .6, .7, .72, .8, .9]],
        ["Pipeline", eur(t.pipeline), "+" + t.pipelineCount + " active", "up", "1 indicative", [.5, .55, .6, .58, .66, .7, .72, .8, .86]],
        ["On site 07:00", a.onTime + "/" + a.scheduled, "−" + (a.late + a.missing), a.missing ? "down" : "up", "late or unverified", [.9, .95, .9, 1, .95, .9, 1, .95, a.onTime / a.scheduled]]] },
    { id: "delivery", label: "Delivery", color: "#9fd6f0", owner: "SITE LEADS", description: "Job completion against programme and the risks to it.",
      kind: "rows", rows: s.jobs.map(j => [j.title, j.pctComplete + "% · planned " + j.plannedPct + "%", j.pctComplete]),
      chartTitle: "Progress by job", chartUnit: "% COMPLETE",
      chart: s.jobs.map(j => [j.id, j.pctComplete, j.pctComplete + "%"]),
      splitTitle: "Open site issues by site", split: s.sites.map((st, i) => [st.name, String(s.issues.filter(x => x.siteId === st.id && x.status === "Open").length), "", i === 0 ? 1 : 0]),
      tableCols: ["Milestone", "Forecast", "Slip", "Job"],
      table: s.jobs.flatMap(j => j.milestones.filter(m => !m.done).slice(0, 1).map(m => [m.name, m.forecast.slice(8) + " Nov", (daysBetween(m.planned, m.forecast) > 0 ? "−" + daysBetween(m.planned, m.forecast) + " days" : "+0 days"), j.id])),
      metrics: s.jobs.map(j => [j.id, j.pctComplete + "%", (j.pctComplete - j.plannedPct >= 0 ? "+" : "−") + Math.abs(j.pctComplete - j.plannedPct) + "pt", j.pctComplete >= j.plannedPct ? "up" : "down", "vs programme", [.2, .3, .4, .5, .55, .6, .7, j.pctComplete / 100, j.pctComplete / 100]])
        .concat([["Open issues", String(s.issues.filter(x => x.status === "Open").length), "+" + s.issues.filter(x => x.status === "Open" && x.severity === "High").length + " high", "down", "across 3 sites", [.3, .4, .3, .5, .4, .6, .5, .6, .7]]]) },
    { id: "labour", label: "Labour", color: "#e6c78a", owner: "AOIFE O'SHEA", description: "Allocated hours, verified hours and exceptions this week.",
      kind: "stacked", legend: ["Cappamore", "Tralee", "Killarney"],
      stacked: [["Mon", [hoursBy("JOB-101", "2026-11-16"), hoursBy("JOB-102", "2026-11-16"), hoursBy("JOB-103", "2026-11-16")]],
        ["Tue", [hoursBy("JOB-101", "2026-11-17"), hoursBy("JOB-102", "2026-11-17"), hoursBy("JOB-103", "2026-11-17")]],
        ["Wed", [liveBy("SITE-CAP"), liveBy("SITE-TRA"), liveBy("SITE-KIL")]]],
      chartTitle: "Verified hours by site (Wed live)", chartUnit: "HOURS",
      chart: [["Mon", 0, ""], ["Tue", 0, ""], ["Wed", 0, ""]],
      splitTitle: "Crew today by site", split: a.bySite.map((b, i) => [b.site.name, String(b.scheduled), b.onTime + " on time", i === 0 ? 1 : 0]),
      tableCols: ["Person", "Exception", "Detail", "Site / status"],
      table: [...a.rows.filter(r => r.status !== "On time").map(r => [r.person.name, r.status, r.inEvent ? "−" + r.minsLate + " min late" : "−no clock-in", r.site.name]),
        ...s.exceptions.map(x => [person(s, x.personId)?.name || "", x.id, (x.status === "Open" ? "−" : "+") + (x.contractorHours - x.internalHours).toFixed(1) + "h variance", x.status])],
      metrics: [["Scheduled", String(a.scheduled), "+" + a.notScheduled.length + " off", "up", "of " + a.fieldCrew + " field crew", [.9, .9, .95, .9, 1, .95, .9, .95, .9]],
        ["On time", String(a.onTime), "−" + (a.scheduled - a.onTime), "down", "at 07:00", [.9, 1, .95, .9, 1, .95, .9, 1, a.onTime / a.scheduled]],
        ["Hours this week", s.dayRecords.reduce((n, d) => n + d.hours, 0).toFixed(1), "+2 days", "up", "Mon and Tue recorded", [.3, .4, .5, .6, .7, .75, .8, .9, 1]],
        ["Variance open", open.reduce((n, x) => n + x.contractorHours - x.internalHours, 0).toFixed(1) + "h", open.length ? "+" + open.length + " case" : "−0", open.length ? "down" : "up", "vs main contractor", [.2, .2, .3, .2, .3, .4, .3, .5, open.length ? .8 : .1]]] },
    { id: "commercial", label: "Commercial", color: "#7fd8a4", owner: "COLM CURRAN", description: "Quote pipeline from first call to signed, and debt ageing.",
      kind: "funnel", funnel: [["Enquiries", String(s.enquiries.length), "since 27 Oct", s.enquiries.length], ["Priced", String(t.active.length), "estimate or quote", t.active.length],
        ["Sent", String(stale.length), "with the customer", stale.length], ["Follow-up due", String(t.staleQuotes.length), "today", t.staleQuotes.length]],
      chartTitle: "Pipeline", chartUnit: "EUR",
      chart: t.active.map(q => [q.id, q.value, eur(q.value)]),
      splitTitle: "Debt by age", split: [["Current", eur(t.unpaidInv.filter(i => invStatus(i) === "Unpaid").reduce((n, i) => n + i.amount, 0)), "", 0], ["1-30 days overdue", eur(t.overdue), "", 1], ["31+ days", "€0", "", 0]],
      tableCols: ["Quote", "Value", "Age", "Stage"],
      table: t.active.map(q => [q.id + " " + (customer(s, q.customerId)?.name.split(" ")[0] || ""), eur(q.value) + (q.indicative ? " (ind.)" : ""), q.sentDate ? "−" + quoteAge(q) + " days" : "+0 days", q.stage]),
      metrics: [["Pipeline", eur(t.pipeline), "+" + t.pipelineCount, "up", "active opportunities", [.4, .5, .55, .6, .7, .66, .72, .8, .86]],
        ["Quiet quotes", String(t.staleQuotes.length), "+" + t.staleQuotes.length, "down", "follow-up due", [.2, .3, .3, .4, .4, .5, .5, .6, .7]],
        ["Overdue", eur(t.overdue), "+18 days", "down", "INV-301", [.2, .3, .4, .5, .6, .7, .8, .9, 1]],
        ["Won value", eur(s.quotes.filter(q => q.stage === "Won").reduce((n, q) => n + q.value, 0)), "+3 jobs", "up", "this autumn", [.3, .4, .5, .6, .7, .8, .85, .9, 1]]] }
  ].map(x => x.id === "labour" ? { ...x, chart: (x.stacked as [string, number[]][]).map(([d, v]) => [d, Math.round(v.reduce((n, k) => n + k, 0)), String(Math.round(v.reduce((n, k) => n + k, 0)))]) } : x);
}

/* ── Work: approvals in the original approval-card shape ── */
export function workApprovals(s: DemoState) {
  const out: any[] = [];
  s.drafts.filter(d => d.status !== "Rejected").forEach(d => {
    const done = d.status === "Approved" || d.status === "Simulated complete";
    out.push({
      id: d.id, title: d.kind + ": " + d.subject.replace(/^Re:\s*/, "").split(":")[0], subject: "To " + d.to + " · drafted by " + agentName(s, d.agentId),
      age: fmtWhen(d.createdAt, DEMO_DATE), status: done ? "approved" : "awaiting you",
      steps: [{ who: agentName(s, d.agentId), state: "drafted " + fmtTime(d.createdAt), dot: OK }, { who: "Colm Curran", state: done ? "approved " + fmtTime(d.approvedAt || "") : "pending", dot: done ? OK : WARN }],
      work: { kind: "doc", label: d.kind.toUpperCase(), viewLabel: "Read draft", headline: d.subject,
        sub: done ? "Approved. Marked ready to send (simulated, nothing sent)" : "On approval: marked ready to send. Nothing is emailed from this demo",
        doc: [["Message", d.body], ["What approving does", "Moves it to Approved, ready to send. The demo never sends email; Mark as sent (simulated) is a separate step in Communications."]],
        thinking: thinkingFor(s, d.id), tools: [["records.read", "read"], ["drafts.mark_ready", "write"]],
        risk: d.kind === "Payment reminder" ? "Customer relationship: Cappamore is a repeat main contractor. Tone kept friendly." : "None. Nothing leaves Pulse." },
      approve: () => act.approveDraft(d.id),
      decline: () => act.rejectDraft(d.id)
    });
  });
  s.exceptions.forEach(x => {
    const rec = reconciliation(s, x.date);
    out.push({
      id: x.id, title: "Timesheet variance " + x.id + ": " + person(s, x.personId)?.name + " +" + (x.contractorHours - x.internalHours).toFixed(1) + "h",
      subject: "Cappamore · Mon 16 Nov · detected by Timesheet Agent", age: "Tue", status: x.status === "Resolved" ? "approved" : "awaiting you",
      steps: [{ who: "Timesheet Agent", state: "detected 17:02", dot: OK }, { who: "Aoife O'Shea", state: x.status === "Resolved" ? "reviewed" : "reviewing", dot: x.status === "Resolved" ? OK : WARN },
        { who: "Colm Curran", state: x.status === "Resolved" ? "resolved" : "pending", dot: x.status === "Resolved" ? OK : WARN }],
      work: { kind: "table", label: "RECONCILIATION · 16 NOV", viewLabel: "View lines", headline: "Cappamore: internal vs main contractor register",
        sub: x.status === "Resolved" ? "Resolved by " + x.resolution?.reviewer + ": " + x.resolution?.outcome : "Needs a reviewer and a reason. Payroll line held until then",
        cols: ["Person", "Internal", "Contractor", "Difference"], align: ["left", "right", "right", "right"],
        rows: rec.map(r => [r.person.name, r.internalHours.toFixed(1) + "h", r.contractorHours.toFixed(1) + "h", (r.delta > 0 ? "+" : "") + r.delta.toFixed(1) + "h"]),
        totals: [["Lines matching", (rec.filter(r => r.delta === 0).length) + " of " + rec.length], ["Variance", "+" + (x.contractorHours - x.internalHours).toFixed(1) + "h"]],
        thinking: [["Compared registers", "7 Cappamore lines, 6 match to the half hour"], ["Read clock events", "06:56 in, 15:26 out, 30-minute break"], ["Read site diary", "Crew stood down 15:30 for wind"], ["Held payroll", "Patrick's Monday line held until resolved"]],
        tools: [["timesheets.read", "read"], ["timesheets.resolve", "write"]], risk: "The main contractor will process dayworks from their register. Reply to Gerard Ryan once decided." },
      approve: () => { act.select("tsExc", x.id); goTo("Timesheets", "reconciliation"); },
      decline: () => { act.select("tsExc", x.id); goTo("Timesheets", "reconciliation"); }
    });
  });
  s.estimates.forEach(e => {
    const q = s.quotes.find(x => x.id === e.quoteId)!;
    out.push({
      id: e.id, title: "QS estimate " + e.id + ": " + q.title + " " + eur(estimateTotal(e)), subject: "Eoin McCarthy (QS) · " + e.version + " · indicative, not issued",
      age: "07:00", status: e.status === "Approved" ? "approved" : "awaiting you",
      steps: [{ who: "Eoin McCarthy", state: e.status === "Awaiting measurements" ? "pending" : "measured", dot: e.status === "Awaiting measurements" ? WARN : OK },
        { who: "Colm Curran", state: e.status === "Approved" ? "approved" : "pending", dot: e.status === "Approved" ? OK : WARN }],
      work: { kind: "table", label: "QS TAKEOFF · " + e.version.toUpperCase(), viewLabel: "View takeoff", headline: q.title + " · " + e.status,
        sub: "Indicative estimate. Not a formal quote", cols: ["Item", "Qty", "Rate", "Total"], align: ["left", "right", "right", "right"],
        rows: e.lines.map(l => [l.item, l.qty + " " + l.unit, eur(l.rate), eur(l.qty * l.rate)]),
        totals: [["Indicative total", eur(estimateTotal(e))]],
        thinking: [["Logged Rev B", "Rev A superseded on 17 Nov"], ["Flagged by QS", "Hip and valley lengths need a site check"], ["Checked pipeline", "Indicative, excluded from formal quotes"]],
        tools: [["estimates.read", "read"], ["estimates.approve", "write"]], risk: "Rear elevation not yet measured on site." },
      approve: () => { if (e.status === "With Colm") act.approveEstimate(e.id); else goTo("Quotations", "estimates"); },
      decline: () => goTo("Quotations", "estimates")
    });
  });
  return out;
}

function thinkingFor(s: DemoState, id: string): [string, string][] {
  if (id === "DRF-01") return [["Read the QuickBooks export (simulated)", "INV-301 unpaid, due 31 Oct"], ["Checked remittances", "Nothing matched since issue"], ["Checked the relationship", "Repeat main contractor, last paid on time in September"], ["Drafted", "Friendly first reminder, no penalty wording"]];
  if (id === "DRF-02") return [["Aged the quote", quoteAge(s.quotes.find(q => q.id === "QUO-201")!) + " days with no reply"], ["Checked the inbox", "No call note or email from Killorglin Homes since"], ["Drafted", "Short follow-up offering a site walk"]];
  if (id === "DRF-03") return [["Read Eoin's email", "Needs hip and valley measurements"], ["Checked drawings", "Rev B is current, Rev A superseded"], ["Drafted", "Confirms measurements this week"]];
  return [["Checked the roll call", "No clock-in by 07:15"], ["Checked messages", "Liam Walsh texted at 07:16"], ["Drafted", "Plain question, no assumption of absence"]];
}

/* ── Work: tasks in the original task shape ── */
export function workTasks(s: DemoState) {
  return s.tasks.map(t => {
    const done = t.status === "Done";
    const dueDay = t.due.slice(0, 10);
    const late = !done && (dueDay < DEMO_DATE || (dueDay === DEMO_DATE && t.due.length > 10 && t.due.slice(11, 16) < s.ui.clock));
    const owner = person(s, t.ownerId)?.name || "";
    const rel = t.related[0];
    const client = rel ? (rel.kind === "job" ? s.jobs.find(j => j.id === rel.id)?.title || rel.id : rel.id) : t.department;
    return { id: t.id, title: t.title, status: done ? "Done" : t.status === "In progress" ? "In progress" : t.priority === "High" ? "Review" : "Not started",
      priority: t.priority, who: initials(owner), due: t.dueLabel, late, client, day: dueDay === DEMO_DATE ? "Today" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][parse(dueDay).getDay()],
      mins: t.department, view: done ? "Done" : dueDay === DEMO_DATE ? "Due tasks" : t.priority === "High" ? "Review" : "All tasks", done };
  });
}

/* ── Home queue tasks (palette, mini) ── */
export function queueTasks(s: DemoState) {
  return s.tasks.filter(t => t.status !== "Done").map(t => ({
    id: t.id, title: t.title, due: t.dueLabel, who: initials(person(s, t.ownerId)?.name || ""),
    queue: ["all"].concat(t.ownerId === "P19" ? ["mine"] : ["team"]).concat(t.due.slice(0, 10) === DEMO_DATE ? [] : ["upcoming"]),
    subject: t.department, priority: t.priority === "High" ? "high" : t.priority === "Low" ? "low" : "normal", late: false
  }));
}

/* ── Activity lanes from the audit trail and agent runs ── */
const demoNowMs = (s: DemoState) => parse(DEMO_DATE + "T" + s.ui.clock).getTime();
const srcOf = (actor: string) => /quickbooks/i.test(actor) ? "QuickBooks" : /import/i.test(actor) ? "Import" : /drawing/i.test(actor) ? "Email" : "Pulse";

export function activityFeeds(s: DemoState, realNow: number) {
  const offset = (iso: string) => realNow - Math.max(0, demoNowMs(s) - parse(iso).getTime());
  const ev = (stream: string, id: string, title: string, note: string, actor: string, rel: string, src: string, status: string, at: string) =>
    ({ id, stream, title, note, actor, rel, src, status, progress: 100, at: offset(at), fresh: false });
  const people = s.audit.filter(a => a.category === "staff").map(a => ev("people", a.id, a.action, a.detail, a.actor, a.related[0] ? a.related[0].id : "", /clock/i.test(a.action) ? "Mobile" : "Pulse", "completed", a.at));
  const data = s.audit.filter(a => a.category === "system").map(a => ev("data", a.id, a.action, a.detail, a.actor, a.related[0] ? a.related[0].id : "", srcOf(a.actor), "completed", a.at));
  const ai = s.agentActions.map(a => ev("ai", a.id, a.title, a.detail, agentName(s, a.agentId), a.related[0] ? a.related[0].id : "", "Agent",
    a.status === "Awaiting approval" || a.status === "Detected" ? "awaiting" : "completed", a.at))
    .concat(s.audit.filter(a => a.category === "agent").map(a => ev("ai", a.id, a.action, a.detail, a.actor, a.related[0] ? a.related[0].id : "", "Agent", "completed", a.at)));
  const byTime = (x: { at: number }, y: { at: number }) => y.at - x.at;
  return { people: people.sort(byTime), data: data.sort(byTime), ai: ai.sort(byTime) };
}

/* ── Notifications ── */
export function notifications(s: DemoState) {
  const list: { dot: string; text: string; event: string; channel: string; meta: string }[] = [];
  const a = attendanceSummary(s);
  a.rows.filter(r => r.status === "No clock-in").forEach(r => list.push({ dot: BAD, text: r.person.name + " has no clock-in at " + r.site.name + " (scheduled " + r.scheduled + ")", event: "attendance.missing", channel: "Home · mobile", meta: s.ui.clock }));
  pendingDrafts(s).forEach(d => list.push({ dot: WARN, text: agentName(s, d.agentId) + " drafted: " + d.subject.split(":")[0], event: "draft.awaiting_approval", channel: "Communications", meta: fmtWhen(d.createdAt, DEMO_DATE) }));
  openExceptions(s).forEach(x => list.push({ dot: WARN, text: x.id + ": " + person(s, x.personId)?.name + " +" + (x.contractorHours - x.internalHours).toFixed(1) + "h vs main contractor", event: "timesheet.variance", channel: "Timesheets", meta: "Tue" }));
  s.invoices.filter(i => invStatus(i) === "Overdue").forEach(i => list.push({ dot: BAD, text: i.id + " (" + eur(i.amount) + ") is " + daysOverdue(i) + " days overdue", event: "finance.overdue", channel: "Finance", meta: "02:05" }));
  list.push({ dot: "var(--accent)", text: "Your morning briefing is ready", event: "briefing.posted", channel: "Home", meta: "07:18" });
  return list;
}

export const priorityCount = (s: DemoState) => priorityInbox(s).filter(m => !m.read).length;
