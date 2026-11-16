/* Sites: overview, live sites, programmes, job register, documents, issues. */
import { useMemo, useState } from "react";
import { act, goTo, useDemo, type DemoState } from "../../demo/store";
import { attendanceSummary, customer, jobRollup, person, quote, site, totals } from "../../demo/selectors";
import { daysBetween, eur, fmtDate, fmtShortDate, fmtWhen } from "../../demo/format";
import type { Doc, DocKind, Issue, Job, Milestone } from "../../demo/types";
import {
  Avatar, Badge, Bars, Btn, Card, Chips, Columns, DemoNote, Empty, Field, Kpi, KV, Label, Muted, PageHead, Progress,
  RecordChip, Seg, StatusBadge, Table, TONE, type Tone
} from "./ui";

const SITE_TONE: Record<string, Tone> = { "SITE-CAP": "accent", "SITE-TRA": "info", "SITE-KIL": "ok" };
const slip = (m: Milestone) => daysBetween(m.planned, m.forecast);
const atRisk = (s: DemoState) => s.jobs.flatMap(j => j.milestones.filter(m => !m.done && slip(m) > 0).map(m => ({ job: j, m })));

export default function Sites({ tab }: { tab: string }) {
  switch (tab) {
    case "live": return <LiveSites />;
    case "programmes": return <Programmes />;
    case "jobs": return <Jobs />;
    case "documents": return <Documents />;
    case "issues": return <Issues />;
    default: return <Overview />;
  }
}

function Overview() {
  const s = useDemo();
  const t = totals(s);
  const a = attendanceSummary(s);
  const open = s.issues.filter(i => i.status === "Open");
  const risk = atRisk(s);
  return (
    <div className="cc-page">
      <PageHead title="Sites" sub="Three live sites, one view: crew on site, progress against programme, what is blocking each job and what it is worth."
        right={<><DemoNote /><Btn onClick={() => goTo("Workforce", "live")}>Roll call</Btn><Btn kind="primary" onClick={() => act.setTab("Sites", "jobs")}>Job register</Btn></>} />
      <div className="cc-grid cc-c4">
        <Kpi label="Active contract value" value={eur(t.contractValue)} hint="Contracted, not revenue earned" tone="accent" delay={0} />
        <Kpi label="Crew on site today" value={a.clockedIn + " / " + a.scheduled} hint={a.onTime + " on time · " + a.late + " late · " + a.missing + " unverified"}
          tone={a.missing ? "warn" : "ok"} delay={60} onClick={() => goTo("Workforce", "live")} />
        <Kpi label="Open site issues" value={open.length} hint={open.filter(i => i.severity === "High").length + " high severity"} tone={open.some(i => i.severity === "High") ? "bad" : "warn"}
          delay={120} onClick={() => act.setTab("Sites", "issues")} />
        <Kpi label="Milestones at risk" value={risk.length} hint={risk.map(r => r.job.id).filter((x, i, l) => l.indexOf(x) === i).join(", ") || "None"} tone={risk.length ? "warn" : "ok"}
          delay={180} onClick={() => act.setTab("Sites", "programmes")} />
      </div>
      <div className="cc-grid cc-c3">
        {s.jobs.map(j => <SiteCard key={j.id} job={j} />)}
      </div>
      <div className="cc-grid cc-split">
        <Card title="Needs attention across sites" sub="Open blockers, highest severity first" pad={false}
          right={<Btn size="sm" onClick={() => act.setTab("Sites", "issues")}>All issues</Btn>}>
          <IssueTable issues={open.slice().sort((x, y) => sev(x) - sev(y))} compact />
        </Card>
        <Card title="Next milestones" sub="Forecast against the programme">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {s.jobs.map(j => {
              const m = j.milestones.find(x => !x.done);
              if (!m) return null;
              const d = slip(m);
              return (
                <button key={j.id} type="button" className="cc-row cc-click" onClick={() => act.openRecord({ kind: "job", id: j.id })}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", margin: "0 -6px", background: "none", border: 0, borderRadius: 10, textAlign: "left", color: "inherit", font: "inherit" }}>
                  <span style={{ width: 8, height: 34, borderRadius: 3, background: TONE[SITE_TONE[j.siteId]].fg, flex: "none" }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 500 }}>{m.name}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{site(s, j.siteId)?.name} · planned {fmtShortDate(m.planned)} · forecast {fmtShortDate(m.forecast)}</span>
                  </span>
                  {d > 0 ? <Badge tone="warn">+{d} days</Badge> : d < 0 ? <Badge tone="ok">{d} days</Badge> : <Badge tone="ok">On date</Badge>}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 14 }}>
            <Label>Progress vs plan</Label>
            <div style={{ marginTop: 10 }}>
              <Bars data={s.jobs.map(j => ({ label: site(s, j.siteId)!.name + " (" + j.plannedPct + "% planned)", value: j.pctComplete, text: j.pctComplete + "%",
                tone: (j.pctComplete >= j.plannedPct ? "ok" : "warn") as Tone }))} max={100} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const sev = (i: Issue) => ({ High: 0, Medium: 1, Low: 2 }[i.severity]);

function SiteCard({ job }: { job: Job }) {
  const s = useDemo();
  const r = jobRollup(s, job.id);
  const onTime = r.att.filter(x => x.status === "On time").length;
  const late = r.att.filter(x => x.status === "Late").length;
  const miss = r.att.filter(x => x.status === "No clock-in" || x.status === "Held for review");
  const m = r.nextMilestone;
  return (
    <Card accent={miss.length ? "warn" : undefined} className="cc-card-click" onClick={() => act.openRecord({ kind: "job", id: job.id })}
      title={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: 3, background: TONE[SITE_TONE[job.siteId]].fg }} />{r.site.name}<Muted>{r.site.county}</Muted></span>}
      sub={job.id + " · " + job.title} right={<StatusBadge status={job.status} />}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.8px" }}>{job.pctComplete}%</span>
        <Muted>planned {job.plannedPct}% today</Muted>
      </div>
      <div style={{ marginTop: 8 }}><Progress value={job.pctComplete} planned={job.plannedPct} tone={job.pctComplete >= job.plannedPct ? "ok" : "warn"} /></div>
      <div style={{ marginTop: 14 }}>
        <KV cols={3} items={[
          ["Crew today", <span key="c">{r.att.filter(x => x.inEvent).length}/{r.att.length}</span>],
          ["Contract", eur(job.contractValue)],
          ["Owed", r.unpaid ? <span key="o" style={{ color: r.overdue ? "var(--bad)" : "var(--ink)" }}>{eur(r.unpaid)}</span> : "€0"]
        ]} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
        <Badge tone="ok" dot>{onTime} on time</Badge>
        {late > 0 && <Badge tone="warn" dot>{late} late</Badge>}
        {miss.length > 0 && <Badge tone="bad" dot>{miss.length} unverified</Badge>}
      </div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {miss.map(x => (
          <div key={x.person.id} style={{ fontSize: 12.5, color: "var(--bad)" }}>No clock-in: {x.person.name}, scheduled {x.scheduled}</div>
        ))}
        {r.openIssues.slice(0, 2).map(i => (
          <div key={i.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5 }}>
            <StatusBadge status={i.severity} />
            <span style={{ color: "var(--body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.title}</span>
          </div>
        ))}
      </div>
      {m && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
          <Label>Next milestone</Label>
          <div style={{ marginTop: 5, display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>{m.name}</span>
            <span style={{ color: slip(m) > 0 ? "var(--warn)" : "var(--dim)", whiteSpace: "nowrap" }}>{fmtShortDate(m.forecast)}{slip(m) > 0 ? " (+" + slip(m) + "d)" : ""}</span>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <Btn size="sm" kind="primary" onClick={() => act.openRecord({ kind: "job", id: job.id })}>Open job</Btn>
        <Btn size="sm" onClick={() => { act.setSiteFilter(job.siteId); goTo("Workforce", "live"); }}>Attendance</Btn>
        <Btn size="sm" onClick={() => act.openRecord({ kind: "customer", id: job.customerId })}>{r.customer.name.split(" ")[0]}</Btn>
      </div>
    </Card>
  );
}

function LiveSites() {
  const s = useDemo();
  const a = attendanceSummary(s);
  return (
    <div className="cc-page">
      <PageHead title="Live sites" sub={"Who is on each site right now, who leads it, and what is in the way. Demo clock " + s.ui.clock + ", Wed 18 Nov."}
        right={<><DemoNote /><Btn onClick={() => goTo("Workforce", "mobile")}>Mobile clock-in</Btn></>} />
      <div className="cc-grid cc-c3">
        {a.bySite.map(b => {
          const r = jobRollup(s, b.site.jobId);
          return (
            <Card key={b.site.id} pad={false}
              title={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: 3, background: TONE[SITE_TONE[b.site.id]].fg }} />{b.site.name}</span>}
              sub={r.job.title + " · " + b.site.county} right={<Badge tone={b.missing ? "warn" : "ok"}>{b.clockedIn}/{b.scheduled} in</Badge>}>
              <div style={{ padding: "0 18px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)" }}>
                  <Avatar name={r.lead.name} tone="accent" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.lead.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{r.lead.role} · site lead · {r.lead.phone}</div>
                  </div>
                  <Btn size="sm" onClick={() => act.openRecord({ kind: "person", id: r.lead.id })}>Open</Btn>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8 }}>Access: {b.site.access}</div>
              </div>
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {b.rows.map(x => (
                  <div key={x.person.id} className="cc-row cc-click" onClick={() => act.openRecord({ kind: "person", id: x.person.id })}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 18px", borderTop: "1px solid var(--border)" }}>
                    <Avatar name={x.person.name} size={24} tone={x.status === "No clock-in" ? "bad" : x.status === "Late" ? "warn" : undefined} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 12.5, fontWeight: 500 }}>{x.person.name}</span>
                      <span style={{ display: "block", fontSize: 11, color: "var(--dim)" }}>{x.person.role}</span>
                    </span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--body)", width: 42, textAlign: "right" }}>{x.inEvent ? x.inEvent.time : "--:--"}</span>
                    <StatusBadge status={x.status} />
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 18px 16px", borderTop: "1px solid var(--border)" }}>
                <Label>Immediate issues</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
                  {r.openIssues.length ? r.openIssues.map(i => (
                    <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                      <StatusBadge status={i.severity} />
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.title}</span>
                      <Muted>{person(s, i.ownerId)?.name.split(" ")[0]}</Muted>
                    </div>
                  )) : <Muted>Nothing open.</Muted>}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <Btn size="sm" kind="primary" onClick={() => act.openRecord({ kind: "job", id: r.job.id })}>Job detail</Btn>
                  <Btn size="sm" onClick={() => { act.setSiteFilter(b.site.id); goTo("Workforce", "live"); }}>Roll call</Btn>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Programmes() {
  const s = useDemo();
  const risk = atRisk(s);
  return (
    <div className="cc-page">
      <PageHead title="Programmes" sub="Milestones per job, planned against forecast. Slippage is measured in calendar days from the programme date."
        right={<DemoNote />} />
      <div className="cc-grid cc-split">
        <div className="cc-stack">
          {s.jobs.map(j => (
            <Card key={j.id} pad={false} title={site(s, j.siteId)!.name + " · " + j.title} sub={fmtDate(j.start) + " to " + fmtDate(j.finish) + " · " + customer(s, j.customerId)?.name}
              right={<><StatusBadge status={j.status} /><Btn size="sm" onClick={() => act.openRecord({ kind: "job", id: j.id }, "programme")}>Open</Btn></>}>
              <div style={{ padding: "0 18px 12px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1 }}><Progress value={j.pctComplete} planned={j.plannedPct} tone={j.pctComplete >= j.plannedPct ? "ok" : "warn"} height={8} /></div>
                <span style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{j.pctComplete}% actual · {j.plannedPct}% planned</span>
              </div>
              <Table minWidth={560} dense rowKey={m => m.name} rows={j.milestones} cols={[
                { key: "n", label: "Milestone", w: "2fr", render: m => <span style={{ color: m.done ? "var(--dim)" : "var(--ink)" }}>{m.name}</span> },
                { key: "p", label: "Planned", w: "1fr", render: m => fmtShortDate(m.planned) },
                { key: "f", label: "Forecast", w: "1fr", render: m => fmtShortDate(m.forecast) },
                { key: "pp", label: "Plan %", w: ".7fr", align: "right", render: m => m.plannedPct + "%" },
                { key: "s", label: "Slip", w: ".8fr", align: "right", render: m => slip(m) > 0 ? <span style={{ color: "var(--warn)" }}>+{slip(m)}d</span> : slip(m) < 0 ? <span style={{ color: "var(--ok)" }}>{slip(m)}d</span> : "0d" },
                { key: "st", label: "Status", w: "1fr", render: m => m.done ? <Badge tone="ok">Done</Badge> : slip(m) > 0 ? <Badge tone="warn">At risk</Badge> : <Badge tone="neutral">Upcoming</Badge> }
              ]} />
            </Card>
          ))}
        </div>
        <div className="cc-stack">
          <Card title="Actual vs planned" sub="Percent complete today">
            <Columns height={150} legend={["Actual", "Planned"]} data={s.jobs.map(j => ({ label: site(s, j.siteId)!.name, a: j.pctComplete, b: j.plannedPct }))} />
          </Card>
          <Card title="Milestones at risk" sub="Forecast later than the programme date">
            {risk.length ? risk.map(({ job: j, m }) => (
              <div key={j.id + m.name} style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</span><Badge tone="warn">+{slip(m)} days</Badge>
                </div>
                <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>{j.id} · {site(s, j.siteId)?.name} · {fmtShortDate(m.planned)} → {fmtShortDate(m.forecast)}</div>
                <div style={{ marginTop: 8 }}><Chips refs={s.issues.filter(i => i.siteId === j.siteId && i.status === "Open" && i.severity !== "Low").slice(0, 2).map(i => ({ kind: "issue" as const, id: i.id }))} /></div>
              </div>
            )) : <Empty title="Nothing slipping" />}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Jobs() {
  const s = useDemo();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return s.jobs.filter(j => !t || (j.id + " " + j.title + " " + customer(s, j.customerId)?.name + " " + site(s, j.siteId)?.name + " " + j.type).toLowerCase().includes(t));
  }, [q, s]);
  const total = rows.reduce((n, j) => n + j.contractValue, 0);
  return (
    <div className="cc-page">
      <PageHead title="Job register" sub="Every live job with its customer, type, progress and contract value. Click a job for the full drill-down."
        right={<><DemoNote /><input className="cc-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search job ID, title or customer" style={{ width: 260 }} /></>} />
      <Card pad={false} title={rows.length + " of " + s.jobs.length + " jobs"} sub={"Total contracted " + eur(total) + ". Contracted value, not revenue earned."}>
        <Table minWidth={900} rowKey={j => j.id} rows={rows} onRow={j => act.openRecord({ kind: "job", id: j.id })} empty="No job matches that search." cols={[
          { key: "id", label: "Job", w: ".7fr", mono: true, render: j => j.id },
          { key: "t", label: "Title", w: "2fr", render: j => <span style={{ fontWeight: 500 }}>{j.title}</span> },
          { key: "c", label: "Customer", w: "1.7fr", render: j => customer(s, j.customerId)?.name },
          { key: "ty", label: "Type", w: "1.4fr", render: j => <Muted>{j.type}</Muted> },
          { key: "st", label: "Status", w: "1fr", render: j => <StatusBadge status={j.status} /> },
          { key: "p", label: "Complete", w: "1.2fr", render: j => <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ flex: 1 }}><Progress value={j.pctComplete} planned={j.plannedPct} tone={j.pctComplete >= j.plannedPct ? "ok" : "warn"} /></span>{j.pctComplete}%</span> },
          { key: "v", label: "Contract", w: "1fr", align: "right", render: j => eur(j.contractValue) }
        ]} />
      </Card>
      <div className="cc-grid cc-c3">
        {rows.map(j => {
          const r = jobRollup(s, j.id);
          return (
            <Card key={j.id} title={j.id + " at a glance"} sub={r.customer.name} right={<Btn size="sm" onClick={() => act.openRecord({ kind: "job", id: j.id }, "commercial")}>Commercial</Btn>}>
              <KV cols={2} items={[
                ["Invoiced", eur(r.invoiced)], ["Unpaid", eur(r.unpaid)],
                ["Budget cost", eur(r.budget)], ["Est. margin", r.marginPct + "%"],
                ["Billing", <span key="b" style={{ fontSize: 12 }}>{j.billing}</span>], ["Won from", quote(s, j.quoteId) ? j.quoteId : "Direct"]
              ]} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const DOC_KINDS: (DocKind | "all")[] = ["all", "Drawing", "Site photo", "QS estimate", "Safety checklist", "Programme", "Timesheet", "Specification", "Invoice"];

function Documents() {
  const s = useDemo();
  const [kind, setKind] = useState<DocKind | "all">("all");
  const rows = s.documents.filter(d => kind === "all" || d.kind === kind).slice().sort((a, b) => b.date.localeCompare(a.date));
  const counts = DOC_KINDS.slice(1).map(k => ({ k, n: s.documents.filter(d => d.kind === k).length })).filter(x => x.n > 0);
  const drawings = s.documents.filter(d => d.kind === "Drawing");
  return (
    <div className="cc-page">
      <PageHead title="Documents" sub="Drawings, site photos, QS estimates, safety checklists, programmes and timesheets, each filed against its job or quote with its version."
        right={<DemoNote />} />
      <Seg options={DOC_KINDS.filter(k => k === "all" || counts.some(c => c.k === k)).map(k => [k, k === "all" ? "All (" + s.documents.length + ")" : k + " (" + counts.find(c => c.k === k)?.n + ")"] as [DocKind | "all", string])}
        value={kind} onChange={setKind} />
      <div className="cc-grid cc-split">
        <Card pad={false} title={rows.length + " documents"} sub="Click a row to open it with its linked records">
          <Table minWidth={780} rowKey={d => d.id} rows={rows} onRow={d => act.openRecord({ kind: "document", id: d.id })} cols={[
            { key: "t", label: "Document", w: "2.2fr", render: d => <span style={{ fontWeight: 500, color: d.supersededBy ? "var(--dim)" : "var(--ink)" }}>{d.title}</span> },
            { key: "k", label: "Kind", w: "1.1fr", render: d => <Muted>{d.kind}</Muted> },
            { key: "v", label: "Version", w: "1fr", render: d => d.supersededBy ? <Badge tone="neutral">{d.version} · superseded</Badge> : <span>{d.version}</span> },
            { key: "l", label: "Linked", w: "1fr", render: d => <LinkedFor d={d} /> },
            { key: "d", label: "Date", w: ".9fr", render: d => fmtShortDate(d.date) },
            { key: "b", label: "By", w: "1.3fr", render: d => <Muted>{d.by}</Muted> }
          ]} />
        </Card>
        <div className="cc-stack">
          <Card title="Drawing revisions" sub="Latest revision is the one the QS prices from">
            {drawings.map(d => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid var(--border)" }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 500 }}>{d.title}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--dim)" }}>{d.version} · {fmtShortDate(d.date)} · {d.size}</span>
                </span>
                {d.supersededBy ? <Badge tone="neutral">Superseded</Badge> : <Badge tone="accent">Current</Badge>}
                <Btn size="sm" onClick={() => act.openRecord({ kind: "document", id: d.id })}>Open</Btn>
              </div>
            ))}
          </Card>
          <Card title="Today's safety paperwork" sub="Completed on site before work starts">
            {s.documents.filter(d => d.kind === "Safety checklist").map(d => (
              <div key={d.id} style={{ padding: "9px 0", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={{ fontSize: 12.5, fontWeight: 500 }}>{d.title}</span><Badge tone="ok" dot>Done</Badge></div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{d.by} · {d.note}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function LinkedFor({ d }: { d: Doc }) {
  if (d.jobId) return <RecordChip r={{ kind: "job", id: d.jobId }} label={d.jobId} />;
  if (d.quoteId) return <RecordChip r={{ kind: "quote", id: d.quoteId }} label={d.quoteId} />;
  if (d.customerId) return <RecordChip r={{ kind: "customer", id: d.customerId }} label="Customer" />;
  return <Muted>None</Muted>;
}

function IssueTable({ issues, compact, onSelect, selected }: { issues: Issue[]; compact?: boolean; onSelect?: (i: Issue) => void; selected?: string }) {
  const s = useDemo();
  return (
    <Table minWidth={compact ? 620 : 820} dense={compact} rowKey={i => i.id} rows={issues} selected={selected}
      onRow={i => onSelect ? onSelect(i) : act.setTab("Sites", "issues")} empty="No open issues." cols={[
        { key: "sev", label: "Severity", w: ".8fr", render: i => <StatusBadge status={i.severity} /> },
        { key: "t", label: "Issue", w: "2.4fr", render: i => <span><span style={{ fontWeight: 500 }}>{i.title}</span><span style={{ display: "block", fontSize: 11, color: "var(--faint)" }}>{i.id} · {site(s, i.siteId)?.name}</span></span> },
        { key: "o", label: "Owner", w: "1.1fr", render: i => person(s, i.ownerId)?.name },
        { key: "d", label: "Due", w: ".8fr", render: i => fmtShortDate(i.due) },
        ...(compact ? [] : [{ key: "s", label: "Status", w: ".9fr", render: (i: Issue) => <StatusBadge status={i.status} /> }])
      ]} />
  );
}

function Issues() {
  const s = useDemo();
  const [siteF, setSiteF] = useState("all");
  const [show, setShow] = useState<"Open" | "all">("Open");
  const rows = s.issues.filter(i => (siteF === "all" || i.siteId === siteF) && (show === "all" || i.status === "Open")).slice().sort((a, b) => sev(a) - sev(b));
  const [sel, setSel] = useState<string>(rows[0]?.id || "");
  const [note, setNote] = useState("");
  const cur = s.issues.find(i => i.id === sel && (siteF === "all" || i.siteId === siteF)) || rows[0];
  return (
    <div className="cc-page">
      <PageHead title="Site issues" sub="Blockers by site with an owner and a due date. Resolving one writes a note to the audit trail."
        right={<><DemoNote /><Seg options={[["Open", "Open"], ["all", "All"]]} value={show} onChange={setShow} /></>} />
      <Seg options={[["all", "All sites"], ...s.sites.map(x => [x.id, x.name] as [string, string])]} value={siteF} onChange={setSiteF} />
      <div className="cc-grid cc-split">
        <Card pad={false} title={rows.length + " issues"} sub="Highest severity first">
          <IssueTable issues={rows} selected={cur?.id} onSelect={i => { setSel(i.id); setNote(""); }} />
        </Card>
        {cur ? (
          <Card title={cur.title} sub={cur.id + " · " + site(s, cur.siteId)?.name + " · raised " + fmtWhen(cur.raised, "2026-11-18")} right={<StatusBadge status={cur.status} />}>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--body)" }}>{cur.detail}</div>
            <div style={{ marginTop: 12 }}>
              <KV cols={3} items={[["Severity", cur.severity], ["Owner", person(s, cur.ownerId)?.name || ""], ["Due", fmtDate(cur.due)]]} />
            </div>
            <div style={{ marginTop: 12 }}><Chips refs={[{ kind: "job", id: site(s, cur.siteId)!.jobId }, ...cur.related]} /></div>
            {cur.status === "Open" ? (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <Field label="Resolution note" hint="Required. Logged against the issue and the job.">
                  <textarea className="cc-input" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="What was done, and who confirmed it" />
                </Field>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn kind="primary" disabled={!note.trim()} onClick={() => { act.resolveIssue(cur.id, note.trim()); setNote(""); }}>Resolve issue</Btn>
                  <Btn onClick={() => act.openRecord({ kind: "job", id: site(s, cur.siteId)!.jobId })}>Open job</Btn>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--ok-soft)", borderRadius: "var(--r-sm,10px)", fontSize: 12.5, color: "var(--ok)" }}>Resolved: {cur.resolution}</div>
            )}
          </Card>
        ) : <Card><Empty title="No issues match" body="Try another site or show all." /></Card>}
      </div>
    </div>
  );
}
