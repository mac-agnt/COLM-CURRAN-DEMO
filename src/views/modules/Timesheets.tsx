/* Timesheets: day records, main-contractor reconciliation, approvals and a payroll preview.
   Pulse never changes pay. Every variance is decided by a named reviewer with a reason. */
import { useState } from "react";
import { act, useDemo, type DemoState } from "../../demo/store";
import { attendance, job, payroll, person, reconciliation, TODAY, variance } from "../../demo/selectors";
import { fmtDate, fmtWhen, hrs } from "../../demo/format";
import type { DayRecord, TimesheetException } from "../../demo/types";
import {
  Badge, Bars, Btn, Card, Chips, Columns, DemoNote, Empty, Field, KV, Kpi, Label, Lifecycle, Muted, PageHead, RecordChip, Seg, StatusBadge, Table, Timeline, type Col
} from "./ui";

const DATES: [string, string][] = [["2026-11-16", "Mon 16"], ["2026-11-17", "Tue 17"], ["2026-11-18", "Wed 18 (live)"]];
const OUTCOMES = ["Internal record confirmed (8.0h)", "Main contractor record accepted (10.0h)", "Query raised with main contractor"];
const REVIEWERS = ["Aoife O'Shea", "Colm Curran"];

const sumHours = (rows: DayRecord[]) => rows.reduce((n, d) => n + d.hours, 0);
const jobShort = (s: DemoState, id: string) => (job(s, id)?.title || id).split(" ")[0];

export default function Timesheets({ tab }: { tab: string }) {
  const s = useDemo();
  if (tab === "daily") return <Daily s={s} />;
  if (tab === "reconciliation") return <Reconciliation s={s} />;
  if (tab === "approvals") return <Approvals s={s} />;
  if (tab === "payroll") return <Payroll s={s} />;
  return <Overview s={s} />;
}

function openCase(id: string) {
  act.select("tsExc", id);
  act.setTab("Timesheets", "reconciliation");
}

/* ── Overview ── */
function Overview({ s }: { s: DemoState }) {
  const approved = sumHours(s.dayRecords.filter(d => d.status === "Approved" || d.status === "Exported"));
  const submitted = s.dayRecords.filter(d => d.status === "Submitted");
  const held = s.dayRecords.filter(d => d.status === "Exception");
  const open = s.exceptions.filter(x => x.status === "Open");
  const live = attendance(s);
  const liveHours = live.reduce((n, r) => n + r.hoursSoFar, 0);
  const sched = (date: string) => s.allocations.filter(a => a.date === date).length * 8;
  const days = [
    { label: "Mon 16", a: sumHours(s.dayRecords.filter(d => d.date === "2026-11-16")), b: sched("2026-11-16") },
    { label: "Tue 17", a: sumHours(s.dayRecords.filter(d => d.date === "2026-11-17")), b: sched("2026-11-17") },
    { label: "Wed 18 (live)", a: Math.round(liveHours * 10) / 10, b: sched(TODAY) },
    { label: "Thu 19", a: 0, b: sched("2026-11-19") },
    { label: "Fri 20", a: 0, b: sched("2026-11-20") }
  ];
  const byJob = s.jobs.map(j => {
    const h = sumHours(s.dayRecords.filter(d => d.jobId === j.id)) + live.filter(r => r.site.jobId === j.id).reduce((n, r) => n + r.hoursSoFar, 0);
    return { label: j.id + " · " + j.title, value: h, text: hrs(h) };
  });
  return (
    <div className="cc-page">
      <PageHead title="Timesheets" sub="Week 47 (16 to 22 November). Day records are built from clock events, then checked against the main contractor's register before payroll."
        right={<><DemoNote /><Btn onClick={() => act.setTab("Timesheets", "reconciliation")}>Open reconciliation</Btn></>} />
      <div className="cc-grid cc-c6">
        <Kpi label="Approved hours" value={hrs(approved)} hint="Week 47 to date" tone="ok" delay={0} />
        <Kpi label="Submitted" value={hrs(sumHours(submitted))} hint={submitted.length + " day records awaiting sign-off"} delay={60} onClick={() => act.setTab("Timesheets", "approvals")} />
        <Kpi label="Held" value={hrs(sumHours(held))} hint={held.length ? "Payroll line held for review" : "Nothing held"} tone={held.length ? "bad" : "ok"} delay={120} onClick={() => act.setTab("Timesheets", "payroll")} />
        <Kpi label="Open exceptions" value={open.length} hint={open.length ? open.map(x => x.id).join(", ") : "All variances decided"} tone={open.length ? "warn" : "ok"} delay={180} onClick={() => open[0] && openCase(open[0].id)} />
        <Kpi label="Live today" value={hrs(liveHours)} hint={live.filter(r => r.inEvent).length + " of " + live.length + " clocked in at " + s.ui.clock} tone="accent" delay={240} onClick={() => act.setTab("Timesheets", "daily")} />
        <Kpi label="Payroll" value={s.ui.payrollPreview === "generated" ? "Preview ready" : "Due Fri 20"} hint={s.ui.payrollPreview === "generated" ? "Mock file, payroll unchanged" : "Aoife submits week 47"} delay={300} onClick={() => act.setTab("Timesheets", "payroll")} />
      </div>
      <div className="cc-grid cc-split">
        <Card title="Hours by day" sub="Recorded hours against scheduled hours (crew × 8h). Wednesday counts up live from clock-ins.">
          <Columns data={days} height={170} legend={["Recorded hours", "Scheduled hours"]} />
        </Card>
        <Card title="Hours by job" sub="Week 47 to date, including today's live hours.">
          <Bars data={byJob} />
          <div style={{ marginTop: 14, fontSize: 12, color: "var(--dim)", lineHeight: 1.55 }}>
            Cappamore is billed partly on hourly dayworks, so its hours are reconciled line by line against the main contractor's register.
          </div>
        </Card>
      </div>
      <Card title="Exceptions" sub="Every variance over 0.5h opens a case. Nobody's pay changes until a named reviewer decides." pad={false}>
        <ExceptionTable s={s} />
      </Card>
    </div>
  );
}

function ExceptionTable({ s }: { s: DemoState }) {
  const cols: Col<TimesheetException>[] = [
    { key: "id", label: "Case", w: "110px", render: x => <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{x.id}</span> },
    { key: "p", label: "Person", w: "1.2fr", render: x => person(s, x.personId)?.name },
    { key: "j", label: "Job", w: "1.3fr", render: x => x.jobId + " · " + jobShort(s, x.jobId) },
    { key: "d", label: "Date", w: "100px", render: x => fmtDate(x.date) },
    { key: "i", label: "Internal", w: "80px", align: "right", render: x => hrs(x.internalHours) },
    { key: "c", label: "Contractor", w: "90px", align: "right", render: x => hrs(x.contractorHours) },
    { key: "v", label: "Difference", w: "90px", align: "right", render: x => <span style={{ color: "var(--bad)" }}>+{variance(x).toFixed(1)}h</span> },
    { key: "st", label: "Status", w: "1.3fr", render: x => x.status === "Open" ? <StatusBadge status="Awaiting approval" label="Open · needs review" /> : <StatusBadge status="Resolved" label={"Resolved · " + x.resolution?.reviewer} /> },
    { key: "a", label: "", w: "110px", align: "right", render: x => <Btn size="sm" kind={x.status === "Open" ? "primary" : "ghost"} onClick={() => openCase(x.id)}>{x.status === "Open" ? "Review" : "View"}</Btn> }
  ];
  return <Table cols={cols} rows={s.exceptions} rowKey={x => x.id} onRow={x => openCase(x.id)} minWidth={820} empty="No exceptions this week." />;
}

/* ── Daily records ── */
interface DailyRow { key: string; personId: string; jobId: string; in: string; out: string; brk: string; hours: string; source: string; status: string }

function Daily({ s }: { s: DemoState }) {
  const [date, setDate] = useState<string>(TODAY);
  const [jobF, setJobF] = useState<string>("all");
  let rows: DailyRow[];
  if (date === TODAY) {
    rows = attendance(s).map(r => ({ key: r.person.id, personId: r.person.id, jobId: r.site.jobId, in: r.inEvent?.time || "-", out: r.outEvent?.time || "-",
      brk: "-", hours: r.inEvent ? hrs(r.hoursSoFar) + " so far" : "0.0h", source: r.inEvent ? r.inEvent.source : "No event yet",
      status: r.status === "No clock-in" ? "No clock-in" : r.status === "Held for review" ? "Held for review" : "In progress" }));
  } else {
    rows = s.dayRecords.filter(d => d.date === date).map(d => ({ key: d.id, personId: d.personId, jobId: d.jobId, in: d.in, out: d.out, brk: d.breakMins + " min",
      hours: hrs(d.hours), source: d.source, status: d.status }));
  }
  rows = rows.filter(r => jobF === "all" || r.jobId === jobF).sort((a, b) => a.jobId.localeCompare(b.jobId) || (person(s, a.personId)?.name || "").localeCompare(person(s, b.personId)?.name || ""));
  const total = date === TODAY ? attendance(s).filter(r => jobF === "all" || r.site.jobId === jobF).reduce((n, r) => n + r.hoursSoFar, 0)
    : sumHours(s.dayRecords.filter(d => d.date === date && (jobF === "all" || d.jobId === jobF)));
  const submittedRecs = date === TODAY ? [] : s.dayRecords.filter(d => d.date === date && d.status === "Submitted" && (jobF === "all" || d.jobId === jobF));
  const pendingJobs = Array.from(new Set(submittedRecs.map(d => d.jobId)));
  const submittedCount = submittedRecs.length;
  const cols: Col<DailyRow>[] = [
    { key: "p", label: "Person", w: "1.3fr", render: r => <span style={{ fontWeight: 500 }}>{person(s, r.personId)?.name}</span> },
    { key: "j", label: "Job", w: "1.2fr", render: r => <Muted style={{ fontSize: 12.5 }}>{r.jobId + " · " + jobShort(s, r.jobId)}</Muted> },
    { key: "i", label: "In", w: "70px", mono: true, render: r => r.in },
    { key: "o", label: "Out", w: "70px", mono: true, render: r => r.out },
    { key: "b", label: "Break", w: "70px", render: r => <Muted>{r.brk}</Muted> },
    { key: "h", label: "Hours", w: "110px", align: "right", render: r => <span style={{ fontVariantNumeric: "tabular-nums" }}>{r.hours}</span> },
    { key: "s", label: "Source", w: "1.2fr", render: r => <Muted>{r.source}</Muted> },
    { key: "st", label: "Status", w: "1.1fr", render: r => r.status === "Exception" ? <StatusBadge status="Exception" label="Held · EXC-401" /> : <StatusBadge status={r.status} /> }
  ];
  return (
    <div className="cc-page">
      <PageHead title="Daily records" sub="One line per person per day, built from clock events. Wednesday is live and counts up from each clock-in."
        right={<DemoNote />} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Seg options={DATES} value={date} onChange={setDate} />
        <Seg options={[["all", "All jobs"] as [string, string]].concat(s.jobs.map(j => [j.id, j.id + " " + jobShort(s, j.id)] as [string, string]))} value={jobF} onChange={setJobF} />
        <span style={{ flex: 1 }} />
        <Muted>{rows.length} records · {hrs(total)}{date === TODAY ? " so far" : ""}</Muted>
        {pendingJobs.length > 0 && <Btn kind="primary" size="sm" onClick={() => pendingJobs.forEach(j => act.approveDay(date, j))}>
          Approve day ({submittedCount} submitted)</Btn>}
      </div>
      <Card pad={false}>
        <Table cols={cols} rows={rows} rowKey={r => r.key} onRow={r => act.openRecord({ kind: "person", id: r.personId })} minWidth={880}
          empty={date === TODAY ? "Nobody scheduled for this job today." : "No records for this date and job."} />
      </Card>
    </div>
  );
}

/* ── Reconciliation ── */
function Reconciliation({ s }: { s: DemoState }) {
  const [date, setDate] = useState<string>("2026-11-16");
  const rows = reconciliation(s, date);
  const matched = rows.filter(r => Math.abs(r.delta) < 0.01).length;
  const selId = s.ui.selected.tsExc || (date === "2026-11-16" ? "EXC-401" : "");
  const selected = s.exceptions.find(x => x.id === selId && x.date === date);
  const imported17 = s.contractorLines.some(l => l.date === "2026-11-17");
  const cols: Col<(typeof rows)[number]>[] = [
    { key: "p", label: "Person", w: "1.4fr", render: r => <span style={{ fontWeight: 500 }}>{r.person.name}</span> },
    { key: "i", label: "Internal (Pulse clock events)", w: "1.3fr", align: "right", render: r => <span>{hrs(r.internalHours)}{r.internal ? <Muted style={{ marginLeft: 8, fontFamily: "var(--mono)", fontSize: 11 }}>{r.internal.in} to {r.internal.out}</Muted> : null}</span> },
    { key: "c", label: "Main contractor register", w: "1.2fr", align: "right", render: r => hrs(r.contractorHours) },
    { key: "d", label: "Difference", w: "100px", align: "right", render: r => Math.abs(r.delta) < 0.01 ? <Muted>0.0h</Muted> : <span style={{ color: "var(--bad)", fontWeight: 600 }}>{(r.delta > 0 ? "+" : "") + r.delta.toFixed(1)}h</span> },
    { key: "s", label: "Result", w: "1.2fr", render: r => r.exception
      ? (r.exception.status === "Open" ? <Badge tone="bad" dot>{r.exception.id} · needs review</Badge> : <Badge tone="ok" dot>{r.exception.id} · resolved</Badge>)
      : Math.abs(r.delta) < 0.01 ? <Badge tone="ok" dot>Matched</Badge> : <Badge tone="warn" dot>Variance</Badge> }
  ];
  return (
    <div className="cc-page">
      <PageHead title="Reconciliation" sub="Our day records side by side with the main contractor's register for Cappamore (JOB-101), line by line."
        right={<><DemoNote /><Btn kind={imported17 ? "ghost" : "primary"} disabled={imported17} onClick={() => { act.importContractorSheet(); setDate("2026-11-17"); }}>
          {imported17 ? "17 Nov register imported" : "Import main contractor sheet (simulated)"}</Btn></>} />
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Seg options={[["2026-11-16", "Mon 16 Nov"], ["2026-11-17", "Tue 17 Nov"]]} value={date} onChange={setDate} />
        <Muted>JOB-101 · Cappamore Housing Roof Package · Cappamore Housing Developments</Muted>
      </div>
      <div className="cc-grid cc-split-even">
        <div className="cc-stack">
          <div className="cc-grid cc-c3">
            <Kpi small label="Lines compared" value={rows.length} hint={rows.length ? "From the register for " + fmtDate(date) : "Register not imported"} />
            <Kpi small label="Matched" value={rows.length ? matched + " of " + rows.length : "-"} tone="ok" hint="To the half hour" />
            <Kpi small label="Variance" value={rows.length ? (rows.reduce((n, r) => n + r.delta, 0) > 0 ? "+" : "") + rows.reduce((n, r) => n + r.delta, 0).toFixed(1) + "h" : "-"}
              tone={rows.some(r => Math.abs(r.delta) > 0.01) ? "bad" : "ok"} hint="Contractor minus internal" />
          </div>
          <Card title={"Line by line · " + fmtDate(date)} sub={rows.length ? matched + " of " + rows.length + " lines match. Select a variance to open its case." : undefined} pad={false}>
            {rows.length
              ? <Table cols={cols} rows={rows} rowKey={r => r.line.id} selected={selected ? rows.find(r => r.exception?.id === selected.id)?.line.id : undefined}
                  onRow={r => { if (r.exception) act.select("tsExc", r.exception.id); else act.openRecord({ kind: "person", id: r.person.id }); }} minWidth={720} />
              : <div style={{ padding: "8px 18px 22px" }}>
                  <Empty title="The main contractor's register for Tuesday hasn't been imported" body="Import the page to compare it with our 7 Cappamore day records." />
                  <div style={{ display: "flex", justifyContent: "center" }}><Btn kind="primary" onClick={() => act.importContractorSheet()}>Import main contractor sheet (simulated)</Btn></div>
                </div>}
          </Card>
          <Card title="How the comparison works" pad>
            <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.6 }}>
              Internal hours come from Pulse clock events less the recorded break. The register is imported as the main contractor sends it.
              Differences over 0.5h open a case, hold that person's payroll line and route to Aoife O'Shea and Colm Curran. Pulse never decides which sheet is right.
            </div>
          </Card>
        </div>
        {selected ? <CasePanel s={s} x={selected} /> : (
          <Card title="No case selected">
            <Empty title={rows.length ? "Every line on this date matches" : "Nothing to reconcile yet"} body={rows.length ? "No variance case was opened for " + fmtDate(date) + "." : "Import the register to start."} />
          </Card>
        )}
      </div>
    </div>
  );
}

function CasePanel({ s, x }: { s: DemoState; x: TimesheetException }) {
  const [outcome, setOutcome] = useState(OUTCOMES[0]);
  const [reviewer, setReviewer] = useState(REVIEWERS[0]);
  const [reason, setReason] = useState("");
  const p = person(s, x.personId);
  const j = job(s, x.jobId);
  const history = x.history.slice().sort((a, b) => a.at.localeCompare(b.at));
  const canSubmit = reason.trim().length >= 5;
  return (
    <Card accent={x.status === "Open" ? "warn" : "ok"} title={x.id + " · " + p?.name + " · " + (x.contractorHours > x.internalHours ? "+" : "") + variance(x).toFixed(1) + "h"}
      sub={j?.id + " " + (j?.title || "") + " · " + fmtDate(x.date) + " · detected by " + x.detectedBy}
      right={x.status === "Open" ? <Badge tone="warn" dot>Open · needs review</Badge> : <Badge tone="ok" dot>Resolved</Badge>}>
      <div className="cc-stack" style={{ gap: 14 }}>
        <KV cols={3} items={[["Internal", hrs(x.internalHours)], ["Main contractor", hrs(x.contractorHours)], ["Difference", "+" + variance(x).toFixed(1) + "h claimed by contractor sheet"],
          ["Person", p?.name || ""], ["Site", "Cappamore"], ["Date", fmtDate(x.date)]]} />
        <div>
          <Label style={{ marginBottom: 7 }}>Status</Label>
          <Lifecycle status={x.lifecycle} />
        </div>
        <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.6, padding: "11px 13px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)" }}>
          {x.notes}
        </div>
        <div>
          <Label style={{ marginBottom: 8 }}>Evidence</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {x.evidence.map(e => (
              <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, fontWeight: 500, minWidth: 150 }}>{e.label}</span>
                <span style={{ flex: 1, minWidth: 160, fontSize: 12.5, color: "var(--dim)" }}>{e.detail}</span>
                {e.docId && <RecordChip r={{ kind: "document", id: e.docId }} />}
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label style={{ marginBottom: 8 }}>Linked</Label>
          <Chips refs={[{ kind: "person", id: x.personId }, { kind: "job", id: x.jobId }, { kind: "message", id: "MSG-02" }, { kind: "customer", id: "CUS-CHD" }]} />
        </div>
        <div>
          <Label style={{ marginBottom: 10 }}>History</Label>
          <Timeline items={history.map(h => ({ at: fmtWhen(h.at, TODAY), actor: h.actor, text: h.text, tone: /Resolved/.test(h.text) ? "ok" as const : /Variance|detected/i.test(h.text) ? "warn" as const : undefined }))} />
        </div>
        {x.status === "Open" ? (
          <div style={{ padding: 14, borderRadius: "var(--r-md,14px)", border: "1px solid var(--accent-line)", background: "var(--accent-faint)" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Human review</div>
            <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>A named reviewer decides and gives a reason. The decision is written to the audit trail and releases the payroll line.</div>
            <div className="cc-grid cc-c2" style={{ marginTop: 12 }}>
              <Field label="Outcome">
                <select className="cc-input" value={outcome} onChange={e => setOutcome(e.target.value)}>
                  {OUTCOMES.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Reviewer">
                <select className="cc-input" value={reviewer} onChange={e => setReviewer(e.target.value)}>
                  {REVIEWERS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ marginTop: 10 }}>
              <Field label="Reason (required)" hint="For example: clock-out 15:26 and site diary stand-down at 15:30 support 8.0h.">
                <textarea className="cc-input" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Why this outcome" />
              </Field>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
              <Btn kind="primary" disabled={!canSubmit} onClick={() => act.resolveException(x.id, outcome, reviewer, reason.trim())}>Resolve {x.id}</Btn>
              <Muted>{canSubmit ? "Pulse records the outcome. It does not change anyone's pay." : "Add a reason to resolve."}</Muted>
            </div>
          </div>
        ) : <ResolutionBlock x={x} />}
      </div>
    </Card>
  );
}

function ResolutionBlock({ x }: { x: TimesheetException }) {
  if (!x.resolution) return null;
  return (
    <div style={{ padding: 14, borderRadius: "var(--r-md,14px)", border: "1px solid var(--ok)", background: "var(--ok-soft)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>Resolved: {x.resolution.outcome}</span>
        <Badge tone="ok" dot>Payroll line released</Badge>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 6, lineHeight: 1.55 }}>
        {x.resolution.reviewer} at {x.resolution.at.slice(11, 16)} today. Reason: {x.resolution.reason}
      </div>
    </div>
  );
}

/* ── Approvals ── */
interface SignOff { key: string; date: string; jobId: string; count: number; hours: number; status: string; submitted: number }

function Approvals({ s }: { s: DemoState }) {
  const groups: SignOff[] = [];
  ["2026-11-16", "2026-11-17"].forEach(date => s.jobs.forEach(j => {
    const recs = s.dayRecords.filter(d => d.date === date && d.jobId === j.id);
    if (!recs.length) return;
    const st = recs.some(d => d.status === "Exception") ? "Exception" : recs.every(d => d.status === "Approved" || d.status === "Exported") ? "Approved" : "Submitted";
    groups.push({ key: date + j.id, date, jobId: j.id, count: recs.length, hours: sumHours(recs), status: st, submitted: recs.filter(d => d.status === "Submitted").length });
  }));
  const trail = s.audit.filter(a => a.related.some(r => r.kind === "exception") || /timesheet|register|payroll|day sheet|correction|EXC-/i.test(a.action + " " + a.detail)).slice(0, 12);
  const cols: Col<SignOff>[] = [
    { key: "d", label: "Date", w: "100px", render: g => fmtDate(g.date) },
    { key: "j", label: "Job", w: "1.5fr", render: g => g.jobId + " · " + (job(s, g.jobId)?.title || "") },
    { key: "c", label: "Records", w: "80px", align: "right", render: g => g.count },
    { key: "h", label: "Hours", w: "80px", align: "right", render: g => hrs(g.hours) },
    { key: "st", label: "Status", w: "1.3fr", render: g => g.status === "Exception" ? <StatusBadge status="Exception" label="1 line held (EXC-401)" /> : g.status === "Submitted" ? <StatusBadge status="Submitted" label="Awaiting sign-off" /> : <StatusBadge status="Approved" label="Approved" /> },
    { key: "r", label: "Sign-off", w: "1.2fr", render: g => <Muted>{g.status === "Approved" ? "Aoife O'Shea" : "Aoife O'Shea, by Fri 20 Nov"}</Muted> },
    { key: "a", label: "", w: "130px", align: "right", render: g => g.submitted > 0
      ? <Btn size="sm" kind="primary" onClick={() => act.approveDay(g.date, g.jobId)}>Approve day</Btn> : <Muted>-</Muted> }
  ];
  const open = s.exceptions.filter(x => x.status === "Open");
  return (
    <div className="cc-page">
      <PageHead title="Approvals" sub="Exceptions need a decision; clean days are signed off in one pass before payroll. Every decision names its reviewer."
        right={<DemoNote />} />
      <div className="cc-grid cc-split">
        <div className="cc-stack">
          <Card title="Needs a decision" sub={open.length ? open.length + " variance case open" : "No variance cases open"} accent={open.length ? "warn" : undefined}>
            {s.exceptions.map(x => (
              <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{x.id} · {person(s, x.personId)?.name} · +{variance(x).toFixed(1)}h</div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>{fmtDate(x.date)} · {x.jobId} Cappamore · internal {hrs(x.internalHours)} vs contractor {hrs(x.contractorHours)}</div>
                  {x.resolution && <div style={{ fontSize: 12, color: "var(--ok)", marginTop: 4 }}>{x.resolution.outcome} · {x.resolution.reviewer}</div>}
                </div>
                <Lifecycle status={x.lifecycle} />
                <Btn kind={x.status === "Open" ? "primary" : "ghost"} size="sm" onClick={() => openCase(x.id)}>{x.status === "Open" ? "Resolve" : "View case"}</Btn>
              </div>
            ))}
          </Card>
          <Card title="Day sign-off queue" sub="Grouped by date and job. Lines with an open case stay held until it is decided." pad={false}>
            <Table cols={cols} rows={groups} rowKey={g => g.key} minWidth={820} />
          </Card>
        </div>
        <div className="cc-stack">
          <Card title="Authorised reviewers">
            {[["Aoife O'Shea", "Office administrator", "Signs off day records, resolves variances, prepares payroll"],
              ["Colm Curran", "Owner / Managing Director", "Final sign-off, resolves variances"],
              ["Site leads", "Liam Walsh, Daniel Fitzgerald, Kevin O'Donoghue", "Enter supervisor corrections. Cannot approve pay."]].map(([n, r, d]) => (
              <div key={n} style={{ padding: "9px 0", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{n} <Muted>· {r}</Muted></div>
                <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>{d}</div>
              </div>
            ))}
          </Card>
          <Card title="Audit trail" sub="Timesheet decisions, imports and corrections">
            {trail.length ? <Timeline items={trail.map(a => ({ at: fmtWhen(a.at, TODAY), actor: a.actor, text: a.action + ". " + a.detail, related: a.related.slice(0, 2),
              tone: a.category === "system" ? "info" as const : a.category === "agent" ? "accent" as const : undefined }))} />
              : <Empty title="No timesheet events yet" />}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Payroll export ── */
function Payroll({ s }: { s: DemoState }) {
  const rows = payroll(s);
  const tot = rows.reduce((t, r) => ({ a: t.a + r.approved, p: t.p + r.pending, h: t.h + r.heldHours }), { a: 0, p: 0, h: 0 });
  const generated = s.ui.payrollPreview === "generated";
  const cols: Col<(typeof rows)[number]>[] = [
    { key: "p", label: "Person", w: "1.4fr", render: r => <span style={{ fontWeight: 500 }}>{r.person.name}</span> },
    { key: "r", label: "Role", w: "1fr", render: r => <Muted>{r.person.role}</Muted> },
    { key: "d", label: "Days", w: "60px", align: "right", render: r => r.days },
    { key: "a", label: "Approved", w: "90px", align: "right", render: r => hrs(r.approved) },
    { key: "pe", label: "Pending", w: "90px", align: "right", render: r => r.pending ? hrs(r.pending) : <Muted>0.0h</Muted> },
    { key: "h", label: "Held", w: "80px", align: "right", render: r => r.held ? <span style={{ color: "var(--bad)" }}>{hrs(r.heldHours)}</span> : <Muted>0.0h</Muted> },
    { key: "st", label: "Status", w: "1.2fr", render: r => r.held ? <Badge tone="bad" dot>Held · EXC-401 open</Badge> : r.pending ? <Badge tone="neutral" dot>Awaiting sign-off</Badge> : <Badge tone="ok" dot>Ready</Badge> }
  ];
  const csv = ["employee,name,week,approved_hours,pending_hours,held_hours,status"].concat(rows.map(r =>
    [r.person.id, '"' + r.person.name + '"', "2026-W47", r.approved.toFixed(1), r.pending.toFixed(1), r.heldHours.toFixed(1), r.held ? "held" : r.pending ? "pending" : "ready"].join(",")));
  const patrick = rows.find(r => r.person.id === "P04");
  return (
    <div className="cc-page">
      <PageHead title="Payroll export" sub="Week 47 to date (Mon 16 and Tue 17). A preview of what goes to payroll on Friday, not a payroll run."
        right={<><DemoNote /><Btn kind="primary" onClick={() => act.generatePayrollPreview()}>{generated ? "Regenerate export preview" : "Generate export preview"}</Btn></>} />
      <div style={{ padding: "13px 16px", borderRadius: "var(--card-r,18px)", border: "1px solid var(--warn)", background: "var(--warn-soft)", fontSize: 13, lineHeight: 1.55, color: "var(--ink)" }}>
        <strong>Preview only.</strong> Pulse does not change payroll and does not pay anyone. Approved hours are handed to Aoife O'Shea for the payroll system; QuickBooks and the payroll system stay the systems of record. A held line is never deducted, it waits for a reviewer.
      </div>
      <div className="cc-grid cc-c4">
        <Kpi label="Approved" value={hrs(tot.a)} tone="ok" hint="Ready for Friday" />
        <Kpi label="Pending sign-off" value={hrs(tot.p)} hint="Tuesday's day records" />
        <Kpi label="Held" value={hrs(tot.h)} tone={tot.h ? "bad" : "ok"} hint={patrick?.held ? "Patrick O'Sullivan, EXC-401" : "Nothing held"} onClick={() => openCase("EXC-401")} />
        <Kpi label="People" value={rows.length} hint="Field crew of 18" />
      </div>
      <div className="cc-grid cc-split">
        <Card title="Hours by person" sub={patrick?.held ? "Patrick O'Sullivan's Monday line is held until EXC-401 is decided." : "EXC-401 decided. Patrick O'Sullivan's line is released."} pad={false}>
          <Table cols={cols} rows={rows} rowKey={r => r.person.id} onRow={r => act.openRecord({ kind: "person", id: r.person.id })} minWidth={760} dense />
          <div style={{ display: "flex", gap: 18, padding: "11px 14px", borderTop: "1px solid var(--border)", background: "var(--surface-faint)", fontSize: 12.5, flexWrap: "wrap" }}>
            <span style={{ flex: 1 }}>Totals</span>
            <span>Approved {hrs(tot.a)}</span><span>Pending {hrs(tot.p)}</span><span style={{ color: tot.h ? "var(--bad)" : undefined }}>Held {hrs(tot.h)}</span>
          </div>
        </Card>
        <Card title="Export file" sub="Mock file for the office. Nothing is sent to a payroll provider.">
          {generated ? (
            <div className="cc-stack" style={{ gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)", background: "var(--surface-2)" }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--accent-faint)", color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 10 }}>CSV</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>payroll_wk47_preview.csv</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{rows.length} rows · generated {s.ui.clock} · preview, not submitted</div>
                </div>
                <Badge tone="accent" dot>Preview</Badge>
              </div>
              <pre style={{ margin: 0, padding: "11px 12px", maxHeight: 300, overflow: "auto", fontFamily: "var(--mono)", fontSize: 10.5, lineHeight: 1.6, color: "var(--body)",
                background: "var(--surface-faint)", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)", whiteSpace: "pre" }}>{csv.join("\n")}</pre>
            </div>
          ) : <Empty title="No preview generated yet" body="Generate a preview to see the file the office would hand to payroll." />}
        </Card>
      </div>
    </div>
  );
}
