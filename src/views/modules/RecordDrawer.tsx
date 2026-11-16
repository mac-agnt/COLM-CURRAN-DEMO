/* The one record view every screen opens. Same IDs, same rows, wherever you came from. */
import { useState, type ReactNode } from "react";
import { act, goTo, useDemo, type DemoState } from "../../demo/store";
import {
  agentName, attendance, customer, daysOverdue, draftFor, estimateTotal, invStatus, job, jobRollup, person, quote, quoteAge,
  recordHome, site, variance, weekHours
} from "../../demo/selectors";
import { eur, fmtDate, fmtShortDate, fmtTime, fmtWhen } from "../../demo/format";
import type { RecordRef } from "../../demo/types";
import { Avatar, Badge, Btn, Card, Chips, DemoNote, Field, KV, Label, Lifecycle, Progress, RecordChip, StatusBadge, Table, Timeline } from "./ui";

const KIND_LABEL: Record<string, string> = {
  person: "PERSON", customer: "CUSTOMER", site: "SITE", job: "JOB", quote: "QUOTE", invoice: "INVOICE", message: "MESSAGE",
  exception: "TIMESHEET VARIANCE", document: "DOCUMENT", estimate: "QS ESTIMATE", enquiry: "ENQUIRY", draft: "DRAFT", issue: "SITE ISSUE", agent: "AGENT"
};

export default function RecordDrawer() {
  const s = useDemo();
  const r = s.ui.record;
  if (!r) return null;
  const ref: RecordRef = r.kind === "site" ? { kind: "job", id: site(s, r.id)?.jobId || "JOB-101" } : r;
  const wide = ref.kind === "job";
  const home = recordHome(ref);
  return (
    <div onClick={() => act.closeRecord()} style={{ position: "fixed", inset: 0, zIndex: 66, background: "var(--scrim)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: wide ? "min(1000px,100%)" : "min(640px,100%)", height: "100%", display: "flex", flexDirection: "column",
        background: "var(--overlay)", borderLeft: "1px solid var(--border)", backdropFilter: "blur(20px)", boxShadow: "-30px 0 80px rgba(0,0,0,.5)", animation: "ccDrawer .3s var(--ease) both" }}>
        <Header s={s} r={ref} onOpenPage={() => { act.closeRecord(); goTo(home.page, home.tab); }} pageLabel={home.page} />
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 24px 30px" }}>
          <Body s={s} r={ref} />
        </div>
      </div>
    </div>
  );
}

function titleOf(s: DemoState, r: RecordRef): { title: string; status?: string; sub?: string } {
  switch (r.kind) {
    case "person": { const p = person(s, r.id); return { title: p?.name || r.id, sub: p?.role }; }
    case "customer": { const c = customer(s, r.id); return { title: c?.name || r.id, sub: c?.type }; }
    case "job": { const j = job(s, r.id); return { title: j?.title || r.id, status: j?.status, sub: r.id + " · " + customer(s, j?.customerId)?.name }; }
    case "quote": { const q = quote(s, r.id); return { title: q?.title || r.id, status: q?.stage, sub: r.id + (q?.indicative ? " · indicative estimate, not issued" : "") }; }
    case "invoice": { const i = s.invoices.find(x => x.id === r.id); return { title: r.id + " · " + (i ? eur(i.amount) : ""), status: i ? invStatus(i) : undefined, sub: i?.ref }; }
    case "exception": { const x = s.exceptions.find(e => e.id === r.id); return { title: r.id + ": " + person(s, x?.personId)?.name, status: x?.status, sub: x ? fmtDate(x.date) + " · " + job(s, x.jobId)?.title : "" }; }
    case "message": { const m = s.messages.find(x => x.id === r.id); return { title: m?.subject || r.id, sub: m ? m.channel + " · " + m.from : "" }; }
    case "draft": { const d = s.drafts.find(x => x.id === r.id); return { title: d?.subject || r.id, status: d?.status, sub: d?.kind }; }
    case "document": { const d = s.documents.find(x => x.id === r.id); return { title: d?.title || r.id, sub: d ? d.kind + " · " + d.version : "" }; }
    case "estimate": { const e = s.estimates.find(x => x.id === r.id); return { title: r.id + " · " + quote(s, e?.quoteId)?.title, status: e?.status, sub: e?.version }; }
    case "enquiry": { const e = s.enquiries.find(x => x.id === r.id); return { title: e?.title || r.id, status: e?.stage, sub: r.id + " · " + customer(s, e?.customerId)?.name }; }
    case "issue": { const i = s.issues.find(x => x.id === r.id); return { title: i?.title || r.id, status: i?.status, sub: r.id + " · " + site(s, i?.siteId)?.name }; }
    case "agent": return { title: agentName(s, r.id) };
    default: return { title: r.id };
  }
}

function Header({ s, r, onOpenPage, pageLabel }: { s: DemoState; r: RecordRef; onOpenPage: () => void; pageLabel: string }) {
  const t = titleOf(s, r);
  return (
    <div style={{ flex: "none", display: "flex", alignItems: "flex-start", gap: 12, padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <Label>{KIND_LABEL[r.kind]}</Label>
          {t.status && <StatusBadge status={t.status} />}
        </div>
        <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.5px", marginTop: 7, lineHeight: 1.25 }}>{t.title}</div>
        {t.sub && <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 4 }}>{t.sub}</div>}
      </div>
      <Btn size="sm" onClick={onOpenPage}>Open in {pageLabel}</Btn>
      <button type="button" onClick={() => act.closeRecord()} aria-label="Close" className="cc-btn" style={{ flex: "none", width: 30, height: 30, border: "1px solid var(--border)", borderRadius: "var(--r-ctl,11px)",
        background: "none", color: "var(--dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12 M18 6 6 18" /></svg>
      </button>
    </div>
  );
}

function Body({ s, r }: { s: DemoState; r: RecordRef }) {
  switch (r.kind) {
    case "job": return <JobDetail s={s} id={r.id} />;
    case "person": return <PersonView s={s} id={r.id} />;
    case "customer": return <CustomerView s={s} id={r.id} />;
    case "quote": return <QuoteView s={s} id={r.id} />;
    case "invoice": return <InvoiceView s={s} id={r.id} />;
    case "exception": return <ExceptionView s={s} id={r.id} />;
    case "message": return <MessageView s={s} id={r.id} />;
    case "draft": return <DraftView s={s} id={r.id} />;
    case "document": return <DocView s={s} id={r.id} />;
    case "estimate": return <EstimateView s={s} id={r.id} />;
    case "enquiry": return <EnquiryView s={s} id={r.id} />;
    case "issue": return <IssueView s={s} id={r.id} />;
    case "agent": { const a = s.agents.find(x => x.id === r.id); return a ? <Block title="Agent"><p style={P}>{a.purpose}</p><KV cols={2} items={[["Trigger", a.trigger], ["Output", a.output], ["Escalation", a.escalation], ["Approval rule", a.approvalRule]]} /></Block> : null; }
    default: return null;
  }
}

const P = { fontSize: 13.5, lineHeight: 1.65, color: "var(--body)", margin: 0 } as const;

function Block({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><Label style={{ flex: 1 }}>{title}</Label>{right}</div>
      {children}
    </div>
  );
}

const audits = (s: DemoState, refs: RecordRef[]) => s.audit.filter(a => a.related.some(x => refs.some(r => r.kind === x.kind && r.id === x.id)));
const auditItems = (s: DemoState, refs: RecordRef[]) => audits(s, refs).slice(0, 12).map(a => ({
  at: fmtWhen(a.at, "2026-11-18"), actor: a.actor, text: a.action + ". " + a.detail, tone: a.category === "agent" ? "accent" as const : a.category === "system" ? "info" as const : "neutral" as const
}));

/* ── Job detail: the deep drill-down ── */
const JOB_TABS: [string, string][] = [["overview", "Overview"], ["team", "Team"], ["attendance", "Attendance"], ["programme", "Programme"], ["commercial", "Commercial"], ["documents", "Documents"], ["activity", "Activity"]];

function JobDetail({ s, id }: { s: DemoState; id: string }) {
  const R = jobRollup(s, id);
  const tab = s.ui.recordTab;
  const onTime = R.att.filter(a => a.status === "On time").length;
  const late = R.att.filter(a => a.status === "Late").length;
  const miss = R.att.filter(a => a.status === "No clock-in" || a.status === "Held for review").length;
  return (
    <div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 18, padding: 3, background: "var(--surface-faint)", border: "1px solid var(--border)", borderRadius: "var(--r-ctl,12px)", width: "fit-content", maxWidth: "100%" }}>
        {JOB_TABS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => act.setRecordTab(k)} className="cc-btn" style={{ height: 30, padding: "0 13px", border: 0, borderRadius: "var(--r-ctl,9px)", cursor: "pointer", fontSize: 12.5,
            background: tab === k ? "var(--pill-bg)" : "none", color: tab === k ? "var(--pill-ink)" : "var(--dim)", fontWeight: tab === k ? 600 : 500 }}>{l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="cc-stack">
          <div className="cc-grid cc-c4">
            <Mini label="Contract value" value={eur(R.job.contractValue)} hint="Contracted, not earned" />
            <Mini label="Progress" value={R.job.pctComplete + "%"} hint={"Planned " + R.job.plannedPct + "%"} />
            <Mini label="Crew today" value={(onTime + late) + " / " + R.att.length} hint={onTime + " on time · " + late + " late · " + miss + " missing"} tone={miss ? "bad" : undefined} />
            <Mini label="Owed" value={eur(R.unpaid)} hint={R.overdue ? eur(R.overdue) + " overdue" : "Nothing overdue"} tone={R.overdue ? "bad" : undefined} />
          </div>
          <div className="cc-grid cc-split-even">
            <Card title="Scope" sub={R.job.type}>
              <p style={P}>{R.job.scope}</p>
              <div style={{ marginTop: 12 }}><Progress value={R.job.pctComplete} planned={R.job.plannedPct} /></div>
              <div style={{ marginTop: 14 }}><KV cols={2} items={[["Customer", R.customer.name], ["Site", R.site.town + ", " + R.site.county], ["Site lead", R.lead.name], ["Billing", R.job.billing],
                ["Start", fmtDate(R.job.start)], ["Hand-over", fmtDate(R.job.finish)]]} /></div>
            </Card>
            <div className="cc-stack">
              <Card title="Needs attention" sub="Everything on this job that is waiting on a person">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {R.att.filter(a => a.status === "No clock-in" || a.status === "Held for review").map(a => (
                    <Row key={a.person.id} tone="bad" title={a.person.name + ": no verified clock-in"} meta={"Scheduled " + a.scheduled} r={{ kind: "person", id: a.person.id }} />
                  ))}
                  {R.exceptions.filter(x => x.status === "Open").map(x => <Row key={x.id} tone="warn" title={x.id + ": +" + variance(x).toFixed(1) + "h vs main contractor"} meta={person(s, x.personId)?.name + " · " + fmtDate(x.date)} r={{ kind: "exception", id: x.id }} />)}
                  {R.invoices.filter(i => invStatus(i) === "Overdue").map(i => <Row key={i.id} tone="bad" title={i.id + " " + eur(i.amount) + " overdue"} meta={daysOverdue(i) + " days · " + i.ref} r={{ kind: "invoice", id: i.id }} />)}
                  {R.openIssues.filter(i => i.id !== "ISS-1" && i.id !== "ISS-6").map(i => <Row key={i.id} tone={i.severity === "High" ? "bad" : "warn"} title={i.title} meta={i.id + " · owner " + person(s, i.ownerId)?.name} r={{ kind: "issue", id: i.id }} />)}
                  {!R.att.some(a => a.status === "No clock-in") && !R.exceptions.some(x => x.status === "Open") && !R.overdue && !R.openIssues.length && <div style={{ fontSize: 13, color: "var(--dim)" }}>Nothing waiting on this job.</div>}
                </div>
              </Card>
              <Card title="Next milestone">
                {R.nextMilestone ? <div style={{ fontSize: 13.5 }}><b style={{ fontWeight: 600 }}>{R.nextMilestone.name}</b><div style={{ color: "var(--dim)", marginTop: 4, fontSize: 12.5 }}>Planned {fmtDate(R.nextMilestone.planned)} · forecast {fmtDate(R.nextMilestone.forecast)}</div></div> : <div style={{ fontSize: 13 }}>Hand-over complete.</div>}
              </Card>
            </div>
          </div>
        </div>
      )}

      {tab === "team" && (
        <Card pad={false} title={"Crew allocated today · " + R.att.length} sub={"Site lead " + R.lead.name}>
          <Table minWidth={560} rowKey={a => a.person.id} rows={R.att} onRow={a => act.openRecord({ kind: "person", id: a.person.id })} cols={[
            { key: "n", label: "Person", w: "1.6fr", render: a => <span style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={a.person.name} size={24} />{a.person.name}</span> },
            { key: "r", label: "Role", w: "1fr", render: a => <span style={{ color: "var(--dim)" }}>{a.person.role}</span> },
            { key: "t", label: "Tickets", w: "1.6fr", render: a => <span style={{ color: "var(--dim)", fontSize: 12 }}>{a.person.tickets.join(", ")}</span> },
            { key: "w", label: "This week", w: ".8fr", align: "right", render: a => weekHours(s, a.person.id).toFixed(1) + "h" }
          ]} />
        </Card>
      )}

      {tab === "attendance" && (
        <div className="cc-stack">
          <div className="cc-grid cc-c4">
            <Mini label="Scheduled" value={String(R.att.length)} /><Mini label="On time" value={String(onTime)} /><Mini label="Late" value={String(late)} tone={late ? "warn" : undefined} /><Mini label="Missing" value={String(miss)} tone={miss ? "bad" : undefined} />
          </div>
          <Card pad={false} title="Today's roll call" sub="Location is checked once, at the clock event. A missing event is a question for a person to confirm.">
            <Table minWidth={620} rowKey={a => a.person.id} rows={R.att} onRow={a => act.openRecord({ kind: "person", id: a.person.id })} cols={[
              { key: "n", label: "Person", w: "1.5fr", render: a => a.person.name },
              { key: "s", label: "Scheduled", w: ".7fr", mono: true, render: a => a.scheduled },
              { key: "i", label: "Clocked in", w: ".8fr", mono: true, render: a => a.inEvent?.time || "—" },
              { key: "src", label: "Source", w: "1.2fr", render: a => <span style={{ color: "var(--dim)", fontSize: 12 }}>{a.inEvent ? a.inEvent.source : "No event"}</span> },
              { key: "st", label: "Status", w: "1fr", render: a => <StatusBadge status={a.status} /> }
            ]} />
          </Card>
          {R.exceptions.length > 0 && <Card title="Timesheet history on this job"><Chips refs={R.exceptions.map(x => ({ kind: "exception" as const, id: x.id }))} /></Card>}
        </div>
      )}

      {tab === "programme" && (
        <Card title="Programme" sub={"Planned " + R.job.plannedPct + "% · actual " + R.job.pctComplete + "%"}>
          <div style={{ marginBottom: 16 }}><Progress value={R.job.pctComplete} planned={R.job.plannedPct} height={8} /></div>
          {R.job.milestones.map((m, i) => {
            const slip = Math.round((+new Date(m.forecast) - +new Date(m.planned)) / 86400000);
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "18px 1fr auto", gap: 12, padding: "10px 0", borderTop: i ? "1px solid var(--border)" : 0, alignItems: "center" }}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: m.done ? "var(--ok)" : "var(--track)", border: "1px solid var(--border)" }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>Planned {fmtDate(m.planned)} · forecast {fmtDate(m.forecast)} · {m.plannedPct}% point</div>
                </div>
                {m.done ? <Badge tone="ok">Done</Badge> : slip > 0 ? <Badge tone="warn">+{slip} days</Badge> : slip < 0 ? <Badge tone="ok">{slip} days</Badge> : <Badge>On plan</Badge>}
              </div>
            );
          })}
        </Card>
      )}

      {tab === "commercial" && (
        <div className="cc-stack">
          <div className="cc-grid cc-c4">
            <Mini label="Contract" value={eur(R.job.contractValue)} hint="Contracted value" />
            <Mini label="Invoiced" value={eur(R.invoiced)} hint={R.invoices.length + " invoices"} />
            <Mini label="Unpaid" value={eur(R.unpaid)} tone={R.overdue ? "bad" : undefined} hint={R.overdue ? eur(R.overdue) + " overdue" : "None overdue"} />
            <Mini label="Budget margin" value={R.marginPct + "%"} hint="Illustrative estimate" />
          </div>
          <Card pad={false} title="Invoices (QuickBooks export, simulated)">
            <Table minWidth={520} rowKey={i => i.id} rows={R.invoices} onRow={i => act.openRecord({ kind: "invoice", id: i.id })} cols={[
              { key: "id", label: "Invoice", w: ".8fr", mono: true, render: i => i.id },
              { key: "ref", label: "Reference", w: "1.6fr", render: i => i.ref },
              { key: "due", label: "Due", w: ".9fr", render: i => fmtDate(i.due) },
              { key: "a", label: "Amount", w: ".9fr", align: "right", render: i => eur(i.amount) },
              { key: "st", label: "Status", w: "1fr", render: i => <StatusBadge status={invStatus(i)} label={invStatus(i) === "Overdue" ? "Overdue " + daysOverdue(i) + "d" : undefined} /> }
            ]} />
          </Card>
          <Card title="Cost to date vs budget" sub="Illustrative estimates, not the ledger">
            <KV cols={3} items={[["Labour", eur(R.job.costToDate.labour) + " / " + eur(R.job.budgetCost.labour)], ["Materials", eur(R.job.costToDate.material) + " / " + eur(R.job.budgetCost.material)], ["Subcontract", eur(R.job.costToDate.subcontract) + " / " + eur(R.job.budgetCost.subcontract)]]} />
          </Card>
          <Card title="Won from"><RecordChip r={{ kind: "quote", id: R.job.quoteId }} /></Card>
        </div>
      )}

      {tab === "documents" && (
        <Card pad={false} title={"Documents · " + R.docs.length}>
          <Table minWidth={520} rowKey={d => d.id} rows={R.docs} onRow={d => act.openRecord({ kind: "document", id: d.id })} cols={[
            { key: "t", label: "Document", w: "2fr", render: d => d.title },
            { key: "k", label: "Kind", w: "1fr", render: d => <span style={{ color: "var(--dim)" }}>{d.kind}</span> },
            { key: "v", label: "Version", w: ".8fr", render: d => d.version },
            { key: "d", label: "Date", w: ".8fr", render: d => fmtShortDate(d.date) }
          ]} />
        </Card>
      )}

      {tab === "activity" && (
        <div className="cc-grid cc-split-even">
          <Card title="Activity on this job">
            <Timeline items={R.audit.slice(0, 14).map(a => ({ at: fmtWhen(a.at, "2026-11-18"), actor: a.actor, text: a.action + ". " + a.detail, tone: a.category === "agent" ? "accent" : a.category === "system" ? "info" : "neutral" }))} />
          </Card>
          <Card title="Messages linked to this job">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {R.messages.map(m => <Row key={m.id} title={m.subject} meta={m.channel + " · " + m.from + " · " + fmtWhen(m.at, "2026-11-18")} r={{ kind: "message", id: m.id }} tone={m.priority ? "warn" : undefined} />)}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "bad" | "warn" }) {
  return (
    <div style={{ padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-r,18px)", minWidth: 0 }}>
      <Label>{label}</Label>
      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.6px", marginTop: 6, color: tone ? "var(--" + tone + ")" : "var(--ink)" }}>{value}</div>
      {hint && <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function Row({ title, meta, r, tone }: { title: string; meta?: string; r: RecordRef; tone?: "bad" | "warn" | "ok" }) {
  return (
    <button type="button" onClick={() => act.openRecord(r)} className="cc-row cc-click" style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 11px", textAlign: "left",
      background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)", color: "inherit", font: "inherit", cursor: "pointer" }}>
      <span style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: tone ? "var(--" + tone + ")" : "var(--border-strong)" }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        {meta && <span style={{ display: "block", fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{meta}</span>}
      </span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg>
    </button>
  );
}

/* ── Person ── */
function PersonView({ s, id }: { s: DemoState; id: string }) {
  const p = person(s, id)!;
  const row = attendance(s).find(a => a.person.id === id);
  const evs = s.clockEvents.filter(e => e.personId === id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const days = s.dayRecords.filter(d => d.personId === id);
  const cors = s.corrections.filter(c => c.personId === id);
  const abs = s.absences.filter(a => a.personId === id);
  const draft = s.drafts.find(d => d.kind === "Attendance confirmation" && d.linked.some(l => l.id === id));
  const [time, setTime] = useState("07:05");
  const [reason, setReason] = useState("");
  const [by, setBy] = useState("Liam Walsh");
  const missing = row && (row.status === "No clock-in" || row.status === "Held for review");
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Avatar name={p.name} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--dim)" }}>{p.role}{p.homeSiteId ? " · usually " + site(s, p.homeSiteId)?.name : ""} · with the company since {p.startedWith}</div>
          <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 3 }}>{p.phone} (placeholder) · {p.email}</div>
        </div>
      </div>
      {row ? (
        <Block title="Today" right={<StatusBadge status={row.status} />}>
          <KV cols={3} items={[["Site", row.site.name], ["Scheduled", row.scheduled], ["Clocked in", row.inEvent ? row.inEvent.time : "No event"],
            ["Source", row.inEvent ? row.inEvent.source : "—"], ["Location check", row.inEvent ? row.inEvent.location : "—"], ["Hours so far", row.hoursSoFar.toFixed(1) + "h"]]} />
          {missing && (
            <div style={{ marginTop: 12, padding: 14, borderRadius: "var(--r-md,14px)", background: "var(--bad-soft)", border: "1px solid var(--bad-soft)" }}>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>No verified clock-in as of {s.ui.clock}. This is a missing event, not a confirmed absence. Pay is never adjusted automatically; a person confirms what happened and the correction is audited.</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {draft ? <Badge tone="warn">Confirmation draft: {draft.status}</Badge> : <Btn kind="primary" size="sm" onClick={() => act.requestConfirmation(id)}>Request confirmation</Btn>}
                <Btn size="sm" onClick={() => goTo("Workforce", "mobile")}>Open mobile clock-in</Btn>
              </div>
              <div className="cc-grid cc-c3" style={{ marginTop: 14 }}>
                <Field label="Arrived at"><input className="cc-input" type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>
                <Field label="Entered by"><select className="cc-input" value={by} onChange={e => setBy(e.target.value)}>{["Liam Walsh", "Aoife O'Shea", "Colm Curran"].map(n => <option key={n}>{n}</option>)}</select></Field>
                <div style={{ display: "flex", alignItems: "flex-end" }}><Btn full disabled={!reason.trim()} onClick={() => { act.addCorrection(id, time, reason.trim(), by); setReason(""); }}>Add supervisor correction</Btn></div>
              </div>
              <div style={{ marginTop: 10 }}><Field label="Reason (required, kept in the audit trail)"><textarea className="cc-input" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Seen on site by Liam at 07:05, phone off" /></Field></div>
            </div>
          )}
        </Block>
      ) : p.kind === "field" ? <Block title="Today"><div style={{ fontSize: 13, color: "var(--dim)" }}>Not scheduled today{abs.length ? ": " + abs.map(a => a.kind.toLowerCase()).join(", ") : ""}.</div></Block> : null}
      {cors.length > 0 && <Block title="Corrections"><Timeline items={cors.map(c => ({ at: fmtTime(c.at), actor: c.enteredBy, text: c.field + " " + c.before + " → " + c.after + ". " + c.reason + " Approved by " + c.approvedBy + ".", tone: "warn" as const }))} /></Block>}
      {p.kind === "field" && (
        <Block title={"This week · " + weekHours(s, id).toFixed(1) + "h recorded · 4-week average " + p.avgWeekHours.toFixed(1) + "h"}>
          <Table minWidth={440} dense rowKey={d => d.id} rows={days} cols={[
            { key: "d", label: "Day", w: "1fr", render: d => fmtDate(d.date) },
            { key: "j", label: "Job", w: ".8fr", mono: true, render: d => d.jobId },
            { key: "io", label: "In / out", w: "1fr", mono: true, render: d => d.in + "–" + d.out },
            { key: "h", label: "Hours", w: ".6fr", align: "right", render: d => d.hours.toFixed(1) },
            { key: "s", label: "Status", w: "1fr", render: d => <StatusBadge status={d.status} /> }
          ]} />
        </Block>
      )}
      {evs.length > 0 && <Block title="Clock events"><Timeline items={evs.slice(0, 8).map(e => ({ at: fmtDate(e.date) + " " + e.time, actor: e.type === "in" ? "Clock-in" : "Clock-out", text: e.source + " · " + e.location + (e.note ? ". " + e.note : ""), tone: e.verified ? "ok" as const : "warn" as const }))} /></Block>}
      {p.tickets.length > 0 && <Block title="Tickets"><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{p.tickets.map(t => <Badge key={t}>{t}</Badge>)}</div></Block>}
      <Block title="Audit"><Timeline items={auditItems(s, [{ kind: "person", id }])} /></Block>
    </div>
  );
}

/* ── Customer ── */
function CustomerView({ s, id }: { s: DemoState; id: string }) {
  const c = customer(s, id)!;
  const jobs = s.jobs.filter(j => j.customerId === id);
  const qs = s.quotes.filter(q => q.customerId === id);
  const inv = s.invoices.filter(i => i.customerId === id);
  const msgs = s.messages.filter(m => m.customerId === id).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div>
      <Block title="Contact"><KV cols={2} items={[["Contact", c.contact + ", " + c.contactRole], ["Email", c.email], ["Source", c.source], ["County", c.county]]} /><p style={{ ...P, marginTop: 10 }}>{c.note}</p></Block>
      <Block title="Linked records"><Chips refs={[...jobs.map(j => ({ kind: "job" as const, id: j.id })), ...qs.map(q => ({ kind: "quote" as const, id: q.id })), ...inv.map(i => ({ kind: "invoice" as const, id: i.id }))]} /></Block>
      <Block title={"Messages and call notes · " + msgs.length}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{msgs.map(m => <Row key={m.id} title={m.subject} meta={m.channel + " · " + m.from + " · " + fmtWhen(m.at, "2026-11-18")} r={{ kind: "message", id: m.id }} tone={m.priority ? "warn" : undefined} />)}</div>
      </Block>
      <Btn onClick={() => { act.closeRecord(); act.select("historyCustomer", id); goTo("Communications", "history"); }}>Open full customer history</Btn>
    </div>
  );
}

/* ── Quote ── */
function QuoteView({ s, id }: { s: DemoState; id: string }) {
  const q = quote(s, id)!;
  const est = q.estimateId ? s.estimates.find(e => e.id === q.estimateId) : undefined;
  const d = draftFor(s, { kind: "quote", id });
  const enq = s.enquiries.find(e => e.quoteId === id);
  return (
    <div>
      <div className="cc-grid cc-c3" style={{ marginBottom: 18 }}>
        <Mini label={q.indicative ? "Indicative value" : "Quote value"} value={eur(q.value)} hint={q.indicative ? "QS estimate, not issued" : "Ex VAT"} />
        <Mini label="Customer" value={customer(s, q.customerId)?.name.split(" ")[0] || ""} hint={customer(s, q.customerId)?.contact} />
        <Mini label="Age" value={q.sentDate ? quoteAge(q) + " days" : "Not sent"} hint={q.followUpDue ? "Follow-up " + fmtDate(q.followUpDue) : undefined} tone={q.sentDate && quoteAge(q) >= 7 && ["Sent", "Follow-up"].includes(q.stage) ? "warn" : undefined} />
      </div>
      <p style={{ ...P, marginBottom: 16 }}>{q.note}{q.lostReason ? " Reason: " + q.lostReason + "." : ""}</p>
      {q.lines.length > 0 && (
        <Block title="Itemised">
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md,12px)", overflow: "hidden" }}>
            {q.lines.map((l, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 14px", borderTop: i ? "1px solid var(--border)" : 0, fontSize: 13 }}><span>{l.item}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(l.amount)}</span></div>)}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 14px", borderTop: "1px solid var(--border)", background: "var(--surface-2)", fontWeight: 600, fontSize: 13.5 }}><span>Total ex VAT</span><span>{eur(q.lines.reduce((n, l) => n + l.amount, 0))}</span></div>
          </div>
        </Block>
      )}
      {est && <Block title="QS estimate"><RecordChip r={{ kind: "estimate", id: est.id }} /> <span style={{ fontSize: 12.5, color: "var(--dim)", marginLeft: 8 }}>{est.version} · {est.status} · {eur(estimateTotal(est))}</span></Block>}
      {d && <Block title="Follow-up draft" right={<StatusBadge status={d.status} />}><DraftCard s={s} id={d.id} /></Block>}
      <Block title="Linked"><Chips refs={[...(enq ? [{ kind: "enquiry" as const, id: enq.id }] : []), ...q.drawingIds.map(x => ({ kind: "document" as const, id: x })), ...(q.jobId ? [{ kind: "job" as const, id: q.jobId }] : []), { kind: "customer", id: q.customerId }]} /></Block>
      <Block title="Audit"><Timeline items={auditItems(s, [{ kind: "quote", id }])} /></Block>
    </div>
  );
}

/* ── Invoice ── */
function InvoiceView({ s, id }: { s: DemoState; id: string }) {
  const i = s.invoices.find(x => x.id === id)!;
  const pay = s.payments.find(p => p.invoiceId === id);
  const d = draftFor(s, { kind: "invoice", id });
  const st = invStatus(i);
  return (
    <div>
      <div style={{ marginBottom: 14 }}><DemoNote>Mirrors the QuickBooks invoice (simulated export). QuickBooks is the system of record.</DemoNote></div>
      <KV cols={3} items={[["Customer", customer(s, i.customerId)?.name], ["Job", i.jobId], ["Reference", i.ref], ["Issued", fmtDate(i.issued)], ["Due", fmtDate(i.due)],
        ["Status", st === "Overdue" ? daysOverdue(i) + " days overdue" : st === "Paid" ? "Paid " + fmtDate(i.paidDate!) : "Due in " + Math.max(0, Math.round((+new Date(i.due) - +new Date("2026-11-18")) / 86400000)) + " days"]]} />
      {pay && <Block title="Payment"><div style={{ fontSize: 13 }}>{eur(pay.amount)} on {fmtDate(pay.date)} · {pay.method}</div></Block>}
      {d && <div style={{ marginTop: 18 }}><Block title="Reminder draft" right={<StatusBadge status={d.status} />}><DraftCard s={s} id={d.id} /></Block></div>}
      <Block title="Linked"><Chips refs={[{ kind: "job", id: i.jobId }, { kind: "customer", id: i.customerId }, ...s.messages.filter(m => m.linked.some(l => l.id === id)).map(m => ({ kind: "message" as const, id: m.id }))]} /></Block>
      <Block title="Audit"><Timeline items={auditItems(s, [{ kind: "invoice", id }])} /></Block>
    </div>
  );
}

/* ── Exception ── */
function ExceptionView({ s, id }: { s: DemoState; id: string }) {
  const x = s.exceptions.find(e => e.id === id)!;
  return (
    <div>
      <div className="cc-grid cc-c3" style={{ marginBottom: 16 }}>
        <Mini label="Internal (Pulse)" value={x.internalHours.toFixed(1) + "h"} hint="Clock events + day sheet" />
        <Mini label="Main contractor" value={x.contractorHours.toFixed(1) + "h"} hint="CHD site register" />
        <Mini label="Difference" value={"+" + variance(x).toFixed(1) + "h"} tone={x.status === "Open" ? "warn" : undefined} hint={x.status === "Open" ? "Payroll line held" : "Resolved"} />
      </div>
      <div style={{ marginBottom: 16 }}><Lifecycle status={x.lifecycle} /></div>
      <p style={{ ...P, marginBottom: 16 }}>{x.notes}</p>
      {x.resolution && (
        <Card accent="ok" style={{ marginBottom: 16 }} title={"Resolved: " + x.resolution.outcome} sub={"By " + x.resolution.reviewer + " at " + fmtTime(x.resolution.at)}>
          <div style={{ fontSize: 13 }}>{x.resolution.reason}</div>
        </Card>
      )}
      <Block title="Evidence">
        {x.evidence.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
            <span style={{ flex: "0 0 160px", fontSize: 12, color: "var(--dim)" }}>{e.label}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{e.detail}</span>
            {e.docId && <RecordChip r={{ kind: "document", id: e.docId }} label="View" />}
          </div>
        ))}
      </Block>
      <Block title="History"><Timeline items={x.history.slice().sort((a, b) => a.at.localeCompare(b.at)).map(h => ({ at: fmtWhen(h.at, "2026-11-18"), actor: h.actor, text: h.text }))} /></Block>
      {x.status === "Open" && <Btn kind="primary" onClick={() => { act.closeRecord(); goTo("Timesheets", "reconciliation"); }}>Review in Timesheets</Btn>}
      <div style={{ marginTop: 16 }}><Chips refs={[{ kind: "person", id: x.personId }, { kind: "job", id: x.jobId }, { kind: "message", id: "MSG-02" }]} /></div>
    </div>
  );
}

/* ── Message / draft ── */
function MessageView({ s, id }: { s: DemoState; id: string }) {
  const m = s.messages.find(x => x.id === id)!;
  const d = s.drafts.find(x => x.replyTo === id);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <Badge>{m.channel === "Call note" ? "Manually logged call note" : m.channel}</Badge><Badge>{m.category}</Badge>{m.priority && <Badge tone="warn">Needs Colm</Badge>}{m.awaiting && <Badge tone="info">Waiting on {m.awaiting.toLowerCase()}</Badge>}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--dim)", marginBottom: 12 }}>{m.from} · {m.fromRole} · {fmtWhen(m.at, "2026-11-18")}</div>
      <div style={{ padding: 16, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{m.body}</div>
      <div style={{ fontSize: 12.5, color: "var(--dim)", margin: "12px 0 18px" }}><b style={{ color: "var(--body)", fontWeight: 600 }}>Why it's here: </b>{m.why}</div>
      {d && <Block title="Drafted reply" right={<StatusBadge status={d.status} />}><DraftCard s={s} id={d.id} /></Block>}
      <Block title="Linked records"><Chips refs={m.linked.filter(l => l.kind !== "draft")} /></Block>
      <div style={{ fontSize: 11.5, color: "var(--faint)" }}>Simulated inbox. No live mailbox or phone sync.</div>
    </div>
  );
}

function DraftView({ s, id }: { s: DemoState; id: string }) {
  return <div><DraftCard s={s} id={id} /><div style={{ marginTop: 16 }}><Block title="Audit"><Timeline items={auditItems(s, [{ kind: "draft", id }])} /></Block></div></div>;
}

export function DraftCard({ s, id }: { s: DemoState; id: string }) {
  const d = s.drafts.find(x => x.id === id)!;
  return (
    <div style={{ padding: 14, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)" }}>
      <div style={{ fontSize: 12, color: "var(--dim)" }}>To {d.to} · drafted by {agentName(s, d.agentId)}{d.edited ? " · edited" : ""}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 6 }}>{d.subject}</div>
      <textarea className="cc-input" rows={6} value={d.body} disabled={d.status !== "Awaiting approval"} onChange={e => act.editDraft(id, e.target.value)} style={{ marginTop: 10 }} />
      <div style={{ marginTop: 10 }}><Lifecycle status={d.status} /></div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        {d.status === "Awaiting approval" && <><Btn kind="primary" size="sm" onClick={() => act.approveDraft(id)}>Approve</Btn><Btn size="sm" onClick={() => act.rejectDraft(id)}>Reject</Btn></>}
        {d.status === "Approved" && <Btn size="sm" onClick={() => act.simulateSend(id)}>Mark as sent (simulated)</Btn>}
        {d.approvedBy && <span style={{ fontSize: 11.5, color: "var(--dim)" }}>Approved by {d.approvedBy} at {fmtTime(d.approvedAt || "")}</span>}
        <span style={{ fontSize: 11.5, color: "var(--faint)", marginLeft: "auto" }}>Approving never sends an email in this demo</span>
      </div>
    </div>
  );
}

/* ── Document / estimate / enquiry / issue ── */
function DocView({ s, id }: { s: DemoState; id: string }) {
  const d = s.documents.find(x => x.id === id)!;
  return (
    <div>
      <div style={{ height: 150, borderRadius: "var(--r-md,14px)", border: "1px solid var(--border)", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center",
        background: "repeating-linear-gradient(0deg, var(--surface-2) 0 23px, var(--border) 23px 24px), var(--surface)", color: "var(--dim)", fontSize: 12.5 }}>
        {d.kind === "Drawing" ? "Drawing preview (" + d.size + ")" : d.kind + " · " + d.size}
      </div>
      <KV cols={3} items={[["Kind", d.kind], ["Version", d.version], ["Date", fmtDate(d.date)], ["From", d.by], ["Size", d.size], ["State", d.supersededBy ? "Superseded" : "Current"]]} />
      <p style={{ ...P, marginTop: 14 }}>{d.note}</p>
      {d.supersededBy && <div style={{ marginTop: 10 }}><RecordChip r={{ kind: "document", id: d.supersededBy }} label="Open current revision" /></div>}
      <div style={{ marginTop: 16 }}><Chips refs={[...(d.jobId ? [{ kind: "job" as const, id: d.jobId }] : []), ...(d.quoteId ? [{ kind: "quote" as const, id: d.quoteId }] : []), ...(d.customerId ? [{ kind: "customer" as const, id: d.customerId }] : [])]} /></div>
    </div>
  );
}

function EstimateView({ s, id }: { s: DemoState; id: string }) {
  const e = s.estimates.find(x => x.id === id)!;
  return (
    <div>
      <div className="cc-grid cc-c3" style={{ marginBottom: 14 }}>
        <Mini label="Indicative total" value={eur(estimateTotal(e))} hint="Not a formal quote" />
        <Mini label="Version" value={e.version} hint={"QS " + person(s, e.qsId)?.name} />
        <Mini label="Status" value={e.status} />
      </div>
      <Block title="Takeoff">
        {e.lines.map((l, i) => <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px", gap: 8, padding: "8px 0", borderTop: i ? "1px solid var(--border)" : 0, fontSize: 12.5 }}>
          <span>{l.item} <span style={{ color: "var(--faint)" }}>· {l.type}</span></span><span style={{ color: "var(--dim)", textAlign: "right" }}>{l.qty} {l.unit}</span><span style={{ textAlign: "right" }}>{eur(l.qty * l.rate)}</span></div>)}
      </Block>
      <Block title="Caveats"><ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: "var(--body)" }}>{e.caveats.map(c => <li key={c}>{c}</li>)}</ul></Block>
      <Btn kind="primary" onClick={() => { act.closeRecord(); goTo("Quotations", "estimates"); }}>Open in QS estimates</Btn>
    </div>
  );
}

function EnquiryView({ s, id }: { s: DemoState; id: string }) {
  const e = s.enquiries.find(x => x.id === id)!;
  return (
    <div>
      <KV cols={3} items={[["Channel", e.channel], ["Source", e.source + (e.referredBy ? " (" + e.referredBy + ")" : "")], ["Received", fmtWhen(e.receivedAt, "2026-11-18")]]} />
      <Block title={e.channel === "Phone call" ? "Call note (manually logged)" : "Enquiry"}><p style={{ ...P, marginTop: 10 }}>{e.callNote}</p></Block>
      <Block title="Checklist">{e.checklist.map(c => <div key={c.label} style={{ display: "flex", gap: 9, alignItems: "center", padding: "6px 0", fontSize: 13 }}>
        <span style={{ width: 14, height: 14, borderRadius: 4, background: c.done ? "var(--ok)" : "var(--track)" }} />{c.label}</div>)}</Block>
      {e.stage === "Drawings Received" && <Btn kind="primary" onClick={() => act.handToQS(id)}>Hand to the QS</Btn>}
      <div style={{ marginTop: 14 }}><Chips refs={[{ kind: "customer", id: e.customerId }, ...(e.quoteId ? [{ kind: "quote" as const, id: e.quoteId }] : [])]} /></div>
    </div>
  );
}

function IssueView({ s, id }: { s: DemoState; id: string }) {
  const i = s.issues.find(x => x.id === id)!;
  const [note, setNote] = useState("");
  return (
    <div>
      <KV cols={3} items={[["Site", site(s, i.siteId)?.name], ["Severity", i.severity], ["Owner", person(s, i.ownerId)?.name], ["Raised", fmtWhen(i.raised, "2026-11-18")], ["Due", fmtDate(i.due)], ["Status", i.status]]} />
      <p style={{ ...P, marginTop: 14 }}>{i.detail}</p>
      {i.resolution && <p style={{ ...P, marginTop: 10, color: "var(--ok)" }}>Resolution: {i.resolution}</p>}
      {i.status === "Open" && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input className="cc-input" placeholder="Resolution note" value={note} onChange={e => setNote(e.target.value)} />
          <Btn kind="primary" disabled={!note.trim()} onClick={() => act.resolveIssue(id, note.trim())}>Resolve</Btn>
        </div>
      )}
      <div style={{ marginTop: 16 }}><Chips refs={[{ kind: "job", id: site(s, i.siteId)?.jobId || "" }, ...i.related]} /></div>
    </div>
  );
}
