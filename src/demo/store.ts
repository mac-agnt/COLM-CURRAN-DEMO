/* One in-memory source of truth for the demo. PulseLogic (JS) and the module
   views (TSX) both read it; every simulated action goes through `act` and
   writes an audit event. Nothing leaves the browser. Reload or Reset = 07:20. */
import { useSyncExternalStore } from "react";
import { buildFixture, DEMO_DATE, DEMO_TIME } from "./fixtures";
import { fromMins, toMins } from "./format";
import type { ActionStatus, AuditCategory, ClockEvent, DemoData, Draft, PipelineStage, RecordRef } from "./types";

export type ModuleKey = "Sites" | "Workforce" | "Timesheets" | "Communications" | "Quotations" | "Finance" | "Agents" | "RecordsExplorer";

export const MODULE_TABS: Record<ModuleKey, [string, string][]> = {
  Sites: [["overview", "Overview"], ["live", "Live sites"], ["programmes", "Programmes"], ["jobs", "Jobs"], ["documents", "Documents"], ["issues", "Issues"]],
  Workforce: [["live", "Live attendance"], ["staff", "Staff"], ["allocations", "Allocations"], ["absences", "Absences"], ["mobile", "Mobile clock-in"]],
  Timesheets: [["overview", "Overview"], ["daily", "Daily records"], ["reconciliation", "Reconciliation"], ["approvals", "Approvals"], ["payroll", "Payroll export"]],
  Communications: [["inbox", "Unified inbox"], ["priority", "Priority"], ["drafts", "Draft replies"], ["followups", "Follow-ups"], ["history", "Customer history"]],
  Quotations: [["pipeline", "Pipeline"], ["enquiries", "Enquiries"], ["drawings", "Drawings"], ["estimates", "QS estimates"], ["quotes", "Quotes"], ["followups", "Follow-ups"]],
  Finance: [["overview", "Overview"], ["invoices", "Invoices"], ["debtors", "Debtors"], ["costs", "Job costs"], ["forecast", "Cash forecast"]],
  Agents: [["overview", "Overview"], ["detail", "Agent detail"], ["runs", "Run history"], ["approvals", "Approvals"]],
  RecordsExplorer: [["explorer", "Explorer"]]
};

export interface UIState {
  tabs: Record<string, string>;
  record: RecordRef | null;
  recordTab: string;
  siteFilter: string;            // "all" | site id
  agentFocus: string;            // agent id for Agent detail
  selected: Record<string, string>;
  toast: { text: string; n: number } | null;
  clock: string;                 // HH:MM, starts 07:20
  payrollPreview: "none" | "generated";
  forecastSlip: boolean;
}

export interface DemoState extends DemoData {
  ui: UIState;
  seq: number;
}

function initial(): DemoState {
  const tabs: Record<string, string> = {};
  (Object.keys(MODULE_TABS) as ModuleKey[]).forEach(k => { tabs[k] = MODULE_TABS[k][0][0]; });
  return {
    ...buildFixture(),
    ui: { tabs, record: null, recordTab: "overview", siteFilter: "all", agentFocus: "attendance", selected: {},
      toast: null, clock: DEMO_TIME, payrollPreview: "none", forecastSlip: false },
    seq: 1
  };
}

let state: DemoState = initial();
const listeners = new Set<() => void>();

export const getState = () => state;
export function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
function emit() { listeners.forEach(l => l()); }

/** Replace state with a mutated deep copy. Small dataset, so a copy per action is fine. */
function commit(mutate: (s: DemoState) => void) {
  const next: DemoState = JSON.parse(JSON.stringify(state));
  mutate(next);
  next.seq = state.seq + 1;
  state = next;
  emit();
}

export function useDemo(): DemoState {
  return useSyncExternalStore(subscribe, getState, getState);
}

/* ── navigation bridge: PulseLogic owns the page, the store owns module tabs ── */
let navigator: ((page: string) => void) | null = null;
export function registerNavigator(fn: (page: string) => void) { navigator = fn; }
export function goTo(page: string, tab?: string, record?: RecordRef | null) {
  if (tab) commit(s => { s.ui.tabs[page] = tab; });
  navigator?.(page);
  if (record) act.openRecord(record);
}

const nowIso = (s: DemoState) => DEMO_DATE + "T" + s.ui.clock;
const tick = (s: DemoState) => { s.ui.clock = fromMins(Math.min(toMins(s.ui.clock) + 1, 23 * 60)); };

function audit(s: DemoState, actor: string, category: AuditCategory, action: string, detail: string, related: RecordRef[] = []) {
  s.audit.unshift({ id: "AU-N" + s.seq + "-" + s.audit.length, at: nowIso(s), actor, category, action, detail, related });
}
function toast(s: DemoState, text: string) { s.ui.toast = { text, n: s.seq }; }

const ME = "Colm Curran";
const nameOf = (s: DemoState, id: string) => s.people.find(p => p.id === id)?.name || id;

export const act = {
  reset() {
    state = initial();
    state.ui.toast = { text: "Demo reset to Wednesday 18 November, 07:20", n: Date.now() };
    emit();
  },
  setTab(module: string, tab: string) { commit(s => { s.ui.tabs[module] = tab; }); },
  setSiteFilter(id: string) { commit(s => { s.ui.siteFilter = id; }); },
  setAgentFocus(id: string) { commit(s => { s.ui.agentFocus = id; s.ui.tabs.Agents = "detail"; }); },
  select(key: string, id: string) { commit(s => { s.ui.selected[key] = id; }); },
  openRecord(ref: RecordRef, tab = "overview") { commit(s => { s.ui.record = ref; s.ui.recordTab = tab; }); },
  setRecordTab(tab: string) { commit(s => { s.ui.recordTab = tab; }); },
  closeRecord() { commit(s => { s.ui.record = null; }); },
  dismissToast() { commit(s => { s.ui.toast = null; }); },
  setForecastSlip(on: boolean) { commit(s => { s.ui.forecastSlip = on; }); },

  /* ── attendance ── */
  simulateClock(personId: string, type: "in" | "out", inside: boolean, viaForeman = false) {
    commit(s => {
      tick(s);
      const alloc = s.allocations.find(a => a.personId === personId && a.date === DEMO_DATE);
      const siteId = alloc?.siteId || s.people.find(p => p.id === personId)?.homeSiteId || "SITE-CAP";
      const ev: ClockEvent = {
        id: "CE-SIM-" + s.seq, personId, siteId, date: DEMO_DATE, type, time: s.ui.clock,
        source: viaForeman ? "Foreman entry" : "Mobile clock-in",
        location: viaForeman ? "Not captured" : inside ? "Inside site boundary" : "Outside site boundary",
        verified: viaForeman ? true : inside,
        note: viaForeman ? "Location permission unavailable. Arrival entered by the site lead for review."
          : inside ? "Location checked at this event only (simulated)." : "Outside the site boundary at the moment of clock-in. Held for review."
      };
      s.clockEvents.push(ev);
      const who = nameOf(s, personId);
      audit(s, who, "staff", (type === "in" ? "Clocked in" : "Clocked out") + " (simulated)",
        ev.time + " · " + ev.source + " · " + ev.location, [{ kind: "person", id: personId }]);
      if (type === "in" && personId === "P01") {
        const iss = s.issues.find(i => i.id === "ISS-1");
        if (iss && inside) { iss.status = "Resolved"; iss.resolution = "John Murphy clocked in at " + ev.time + " (simulated)."; }
        const t = s.tasks.find(t => t.id === "T-01");
        if (t && inside) t.status = "Done";
        const aa = s.agentActions.find(a => a.id === "AA-02");
        if (aa && inside) aa.status = "Simulated complete";
      }
      toast(s, who + (type === "in" ? " clocked in " : " clocked out ") + ev.time + (ev.verified ? "" : " (held for review)"));
    });
  },
  addCorrection(personId: string, time: string, reason: string, enteredBy: string) {
    commit(s => {
      const before = s.clockEvents.find(e => e.personId === personId && e.date === DEMO_DATE && e.type === "in");
      const alloc = s.allocations.find(a => a.personId === personId && a.date === DEMO_DATE);
      s.corrections.push({ id: "COR-" + s.seq, personId, date: DEMO_DATE, field: "Clock-in", before: before ? before.time : "No event",
        after: time, reason, enteredBy, approvedBy: ME, at: nowIso(s) });
      if (before) { before.time = time; before.source = "Supervisor correction"; before.verified = true; before.note = reason; }
      else s.clockEvents.push({ id: "CE-COR-" + s.seq, personId, siteId: alloc?.siteId || "SITE-CAP", date: DEMO_DATE, type: "in", time,
        source: "Supervisor correction", location: "Not captured", verified: true, note: reason });
      const who = nameOf(s, personId);
      audit(s, enteredBy, "staff", "Recorded a supervisor correction", who + ": clock-in " + (before ? before.time : "none") + " → " + time + ". Reason: " + reason,
        [{ kind: "person", id: personId }]);
      if (personId === "P01") {
        const iss = s.issues.find(i => i.id === "ISS-1");
        if (iss) { iss.status = "Resolved"; iss.resolution = "Supervisor correction: arrived " + time + ". " + reason; }
        const t = s.tasks.find(t => t.id === "T-01"); if (t) t.status = "Done";
        const aa = s.agentActions.find(a => a.id === "AA-02"); if (aa) aa.status = "Simulated complete";
      }
      toast(s, "Correction recorded for " + who + ", audit trail updated");
    });
  },
  requestConfirmation(personId: string) {
    commit(s => {
      const who = nameOf(s, personId);
      const alloc = s.allocations.find(a => a.personId === personId && a.date === DEMO_DATE);
      const site = s.sites.find(x => x.id === alloc?.siteId);
      const lead = site ? nameOf(s, site.leadId) : "the site lead";
      const id = "DRF-N" + s.seq;
      const d: Draft = { id, kind: "Attendance confirmation", to: who + " (text) · cc " + lead,
        subject: "Are you on site at " + (site?.name || "site") + "?",
        body: "Morning " + who.split(" ")[0] + ", Pulse has no clock-in for you at " + (site?.name || "site") + " this morning. Are you on site or on the way? Reply here or tell " + lead.split(" ")[0] + ".",
        status: "Awaiting approval", agentId: "attendance", linked: [{ kind: "person", id: personId }, ...(site ? [{ kind: "job" as const, id: site.jobId }] : [])],
        createdAt: nowIso(s), edited: false };
      s.drafts.unshift(d);
      s.agentActions.unshift({ id: "AA-N" + s.seq, agentId: "attendance", at: nowIso(s), title: "Drafted attendance confirmation for " + who,
        detail: "Requested by Colm. Waiting for approval before it is marked ready.", related: [{ kind: "draft", id }, { kind: "person", id: personId }],
        status: "Awaiting approval", reviewerId: "P19" });
      audit(s, ME, "staff", "Requested attendance confirmation", who + " · draft " + id + " awaiting approval", [{ kind: "person", id: personId }, { kind: "draft", id }]);
      toast(s, "Confirmation drafted for " + who + ". Approve it in Communications → Draft replies");
    });
  },

  /* ── drafts ── */
  editDraft(id: string, body: string) { commit(s => { const d = s.drafts.find(x => x.id === id); if (d) { d.body = body; d.edited = true; } }); },
  approveDraft(id: string) {
    commit(s => {
      const d = s.drafts.find(x => x.id === id);
      if (!d || d.status !== "Awaiting approval") return;
      d.status = "Approved"; d.approvedBy = ME; d.approvedAt = nowIso(s);
      s.agentActions.filter(a => a.related.some(r => r.kind === "draft" && r.id === id)).forEach(a => { a.status = "Approved"; });
      const taskFor: Record<string, string> = { "DRF-01": "T-03", "DRF-02": "T-04" };
      const t = s.tasks.find(t => t.id === taskFor[id]); if (t) t.status = "Done";
      audit(s, ME, "staff", "Approved " + d.kind.toLowerCase(), d.subject + " · ready to send (simulated, nothing sent)", d.linked.concat([{ kind: "draft", id }]));
      toast(s, "Approved. Ready to send (simulated, no email leaves the demo)");
    });
  },
  rejectDraft(id: string) {
    commit(s => {
      const d = s.drafts.find(x => x.id === id);
      if (!d) return;
      d.status = "Rejected";
      s.agentActions.filter(a => a.related.some(r => r.kind === "draft" && r.id === id)).forEach(a => { a.status = "Rejected"; });
      audit(s, ME, "staff", "Rejected a draft", d.subject, [{ kind: "draft", id }]);
      toast(s, "Draft rejected. The agent will not raise it again today");
    });
  },
  simulateSend(id: string) {
    commit(s => {
      const d = s.drafts.find(x => x.id === id);
      if (!d || d.status !== "Approved") return;
      d.status = "Simulated complete";
      s.agentActions.filter(a => a.related.some(r => r.kind === "draft" && r.id === id)).forEach(a => { a.status = "Simulated complete"; });
      const msg = d.replyTo ? s.messages.find(m => m.id === d.replyTo) : undefined;
      if (msg && d.kind !== "Email reply") msg.awaiting = d.kind === "Payment reminder" ? "Payment" : "Customer";
      audit(s, "Pulse (simulated)", "system", "Marked as sent (simulated)", d.subject + " · no email was sent", [{ kind: "draft", id }]);
      toast(s, "Marked as sent in the demo. No real message was sent");
    });
  },

  /* ── timesheets ── */
  resolveException(id: string, outcome: string, reviewer: string, reason: string) {
    commit(s => {
      const x = s.exceptions.find(e => e.id === id);
      if (!x || x.status !== "Open") return;
      x.status = "Resolved"; x.lifecycle = "Approved";
      x.resolution = { outcome, reviewer, reason, at: nowIso(s) };
      x.history.push({ at: nowIso(s), actor: reviewer, text: "Resolved: " + outcome + ". " + reason });
      const dr = s.dayRecords.find(d => d.personId === x.personId && d.date === x.date);
      if (dr) {
        dr.status = "Approved";
        if (/contractor/i.test(outcome)) dr.hours = x.contractorHours;
      }
      const iss = s.issues.find(i => i.id === "ISS-6"); if (iss) { iss.status = "Resolved"; iss.resolution = outcome + " (" + reviewer + ")"; }
      const t = s.tasks.find(t => t.id === "T-02"); if (t) t.status = "Done";
      s.agentActions.filter(a => a.related.some(r => r.kind === "exception" && r.id === id)).forEach(a => { a.status = "Approved"; });
      audit(s, reviewer, "staff", "Resolved " + id, outcome + ". Reason: " + reason, [{ kind: "exception", id }, { kind: "person", id: x.personId }]);
      toast(s, id + " resolved by " + reviewer + ". Payroll line released");
    });
  },
  importContractorSheet() {
    commit(s => {
      if (s.contractorLines.some(l => l.date === "2026-11-17")) return;
      tick(s);
      s.dayRecords.filter(d => d.date === "2026-11-17" && d.jobId === "JOB-101").forEach(d => {
        s.contractorLines.push({ id: "CL-17-" + d.personId, personId: d.personId, jobId: "JOB-101", date: "2026-11-17", hours: d.hours, sheetRef: "CHD site register wk 47, p.2 (simulated import)" });
      });
      s.documents.unshift({ id: "DOC-TS-CHD-47B", title: "CHD site register wk 47 (17 Nov page)", kind: "Timesheet", version: "Import", date: DEMO_DATE,
        by: "Simulated upload", size: "CSV · 7 lines", jobId: "JOB-101", customerId: "CUS-CHD", note: "Imported in the demo. All lines matched." });
      s.agentActions.unshift({ id: "AA-N" + s.seq, agentId: "timesheet", at: nowIso(s), title: "Matched 7 of 7 Cappamore lines for 17 Nov",
        detail: "Simulated import of the main contractor's register. No variances.", related: [{ kind: "job", id: "JOB-101" }], status: "Simulated complete" });
      audit(s, "Timesheet import", "system", "Imported CHD site register (17 Nov, simulated)", "7 lines, 7 matched, 0 variances", [{ kind: "job", id: "JOB-101" }]);
      toast(s, "17 Nov register imported: 7 of 7 lines match");
    });
  },
  approveDay(date: string, jobId: string) {
    commit(s => {
      const rows = s.dayRecords.filter(d => d.date === date && d.jobId === jobId && d.status === "Submitted");
      if (!rows.length) return;
      rows.forEach(d => { d.status = "Approved"; });
      audit(s, ME, "staff", "Approved day records", rows.length + " lines · " + jobId + " · " + date.slice(8) + " Nov", [{ kind: "job", id: jobId }]);
      toast(s, rows.length + " day records approved for " + jobId);
    });
  },
  generatePayrollPreview() {
    commit(s => {
      s.ui.payrollPreview = "generated";
      audit(s, ME, "staff", "Generated payroll export preview", "Week 47 to date. Preview only, payroll not changed.", []);
      toast(s, "Preview file generated (mock). Payroll has not been changed");
    });
  },

  /* ── quotations ── */
  moveQuote(id: string, stage: PipelineStage, note: string) {
    commit(s => {
      const q = s.quotes.find(x => x.id === id);
      if (!q) return;
      const from = q.stage;
      q.stage = stage;
      const enq = s.enquiries.find(e => e.quoteId === id); if (enq) enq.stage = stage;
      const est = q.estimateId ? s.estimates.find(e => e.id === q.estimateId) : undefined;
      if (est && stage === "Colm Review") {
        est.status = "With Colm";
        est.history.push({ at: nowIso(s), actor: "Eoin McCarthy", text: "Marked ready for Colm's review. " + note });
        const ck = enq?.checklist.find(c => c.label === "Site measurements"); if (ck) ck.done = true;
      }
      audit(s, stage === "Colm Review" ? "Eoin McCarthy (QS)" : ME, "staff", id + ": " + from + " → " + stage, note, [{ kind: "quote", id }]);
      toast(s, id + " moved to " + stage);
    });
  },
  approveEstimate(id: string) {
    commit(s => {
      const est = s.estimates.find(e => e.id === id);
      if (!est || est.status !== "With Colm") return;
      est.status = "Approved";
      est.history.push({ at: nowIso(s), actor: ME, text: "Approved the estimate. Ready to issue as a formal quote." });
      const enq = s.enquiries.find(e => e.quoteId === est.quoteId);
      const ck = enq?.checklist.find(c => c.label === "Estimate reviewed by Colm"); if (ck) ck.done = true;
      audit(s, ME, "staff", "Approved QS estimate " + id, "Indicative €24,800 approved for issue. Not sent.", [{ kind: "estimate", id }, { kind: "quote", id: est.quoteId }]);
      toast(s, "Estimate approved. Issue it from Quotes when ready (simulated)");
    });
  },
  issueQuote(id: string) {
    commit(s => {
      const q = s.quotes.find(x => x.id === id);
      if (!q) return;
      q.stage = "Sent"; q.indicative = false; q.sentDate = DEMO_DATE; q.followUpDue = "2026-11-25";
      const enq = s.enquiries.find(e => e.quoteId === id); if (enq) { enq.stage = "Sent"; const ck = enq.checklist.find(c => c.label === "Quote issued"); if (ck) ck.done = true; }
      audit(s, ME, "staff", "Issued " + id + " (simulated)", "Marked sent in the demo. No email was sent.", [{ kind: "quote", id }]);
      toast(s, id + " marked as issued (simulated). Follow-up set for 25 Nov");
    });
  },
  handToQS(enquiryId: string) {
    commit(s => {
      const e = s.enquiries.find(x => x.id === enquiryId);
      if (!e) return;
      e.stage = "With QS";
      const ck = e.checklist.find(c => c.label === "Handed to QS"); if (ck) ck.done = true;
      const t = s.tasks.find(t => t.related.some(r => r.kind === "enquiry" && r.id === enquiryId)); if (t) t.status = "Done";
      audit(s, ME, "staff", "Handed " + enquiryId + " to the QS", e.title + " → Eoin McCarthy", [{ kind: "enquiry", id: enquiryId }]);
      toast(s, e.title + " handed to Eoin McCarthy (QS)");
    });
  },

  /* ── work ── */
  toggleTask(id: string) {
    commit(s => {
      const t = s.tasks.find(x => x.id === id);
      if (!t) return;
      t.status = t.status === "Done" ? "Open" : "Done";
      audit(s, ME, "staff", t.status === "Done" ? "Completed a task" : "Reopened a task", t.title, t.related);
    });
  },
  addTask(title: string, priority: "High" | "Medium" | "Low") {
    commit(s => {
      s.tasks.unshift({ id: "T-N" + s.seq, title, priority, ownerId: "P19", due: DEMO_DATE, dueLabel: "Today", department: "Operations", related: [], status: "Open" });
      audit(s, ME, "staff", "Created a task", title, []);
    });
  },
  resolveIssue(id: string, note: string) {
    commit(s => {
      const i = s.issues.find(x => x.id === id);
      if (!i) return;
      i.status = "Resolved"; i.resolution = note;
      audit(s, ME, "staff", "Resolved site issue " + id, i.title + ". " + note, [{ kind: "issue", id }]);
      toast(s, "Issue " + id + " resolved");
    });
  },
  markRead(id: string) { commit(s => { const m = s.messages.find(x => x.id === id); if (m) m.read = true; }); },
  setPolicy(key: string, on: boolean) {
    commit(s => {
      const p = s.policies.find(x => x.key === key);
      if (!p || p.locked) return;
      p.on = on;
      audit(s, ME, "staff", "Changed AI control", p.label + ": " + (on ? "on" : "off"), []);
    });
  },
  /** Agent approvals that are not drafts (e.g. acknowledge a detected issue). */
  acknowledgeAgentAction(id: string) {
    commit(s => {
      const a = s.agentActions.find(x => x.id === id);
      if (!a) return;
      a.status = "Approved";
      audit(s, ME, "agent", "Acknowledged agent finding", a.title, a.related);
      toast(s, "Acknowledged. Logged against " + (a.related[0]?.id || "the record"));
    });
  }
};

export type { ActionStatus };
