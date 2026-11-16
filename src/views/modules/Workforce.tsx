/* Workforce: live roll call, staff, allocations, absences and the mobile clock-in simulator. */
import { useMemo, useState, type CSSProperties } from "react";
import { act, goTo, useDemo, type DemoState } from "../../demo/store";
import { attendance, attendanceSummary, person, site, TODAY, weekHours, type AttRow } from "../../demo/selectors";
import { daysBetween, fmtDate, fmtShortDate, fmtWhen } from "../../demo/format";
import type { Absence, ClockEvent, Person } from "../../demo/types";
import {
  Avatar, Badge, Bars, Btn, Card, Chips, DemoNote, Empty, Field, Kpi, KV, Label, Lifecycle, Muted, PageHead, Seg,
  StatusBadge, Table, Timeline, TONE, type Tone
} from "./ui";

const SITE_TONE: Record<string, Tone> = { "SITE-CAP": "accent", "SITE-TRA": "info", "SITE-KIL": "ok" };
const WEEK = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];
const CORRECTORS = ["Liam Walsh", "Aoife O'Shea", "Colm Curran"];

const absenceOn = (s: DemoState, personId: string, date: string): Absence | undefined =>
  s.absences.find(a => a.personId === personId && a.from <= date && a.to >= date);

const approvalOf = (r: AttRow): { label: string; tone: Tone } =>
  r.correction ? { label: "Supervisor approved", tone: "accent" }
    : r.status === "No clock-in" ? { label: "Needs confirmation", tone: "bad" }
    : r.status === "Held for review" ? { label: "Needs review", tone: "warn" }
    : r.inEvent?.source === "Foreman entry" ? { label: "Lead verified", tone: "ok" }
    : r.status === "Late" ? { label: "Verified · late noted", tone: "warn" }
    : { label: "Verified", tone: "ok" };

export default function Workforce({ tab }: { tab: string }) {
  switch (tab) {
    case "staff": return <Staff />;
    case "allocations": return <Allocations />;
    case "absences": return <Absences />;
    case "mobile": return <Mobile />;
    default: return <Live />;
  }
}

function scopeOf(s: DemoState) {
  const sum = attendanceSummary(s);
  const f = s.ui.siteFilter;
  const b = sum.bySite.find(x => x.site.id === f);
  return { sum, scope: b ? { scheduled: b.scheduled, onTime: b.onTime, late: b.late, missing: b.missing, clockedIn: b.clockedIn } : sum, label: b ? b.site.name : "All sites" };
}

function RollCallKpis({ compact }: { compact?: boolean }) {
  const s = useDemo();
  const { scope, label } = scopeOf(s);
  return (
    <div className={"cc-grid " + (compact ? "cc-c5" : "cc-c5")}>
      <Kpi small={compact} label={"Scheduled · " + label} value={scope.scheduled} hint="07:00 start, Wed 18 Nov" delay={0} />
      <Kpi small={compact} label="On time" value={scope.onTime} hint="Clocked in by 07:00" tone="ok" delay={50} />
      <Kpi small={compact} label="Late" value={scope.late} hint="Clocked in after 07:00" tone={scope.late ? "warn" : "ok"} delay={100} />
      <Kpi small={compact} label="Missing or unverified" value={scope.missing} hint="Needs a person to confirm" tone={scope.missing ? "bad" : "ok"} delay={150} />
      <Kpi small={compact} label={"Clocked in at " + s.ui.clock} value={scope.clockedIn + " / " + scope.scheduled} hint="Any verified or held event" tone="accent" delay={200} />
    </div>
  );
}

function SiteFilter() {
  const s = useDemo();
  return <Seg options={[["all", "All sites"], ...s.sites.map(x => [x.id, x.name] as [string, string])]} value={s.ui.siteFilter} onChange={v => act.setSiteFilter(v)} />;
}

function Live() {
  const s = useDemo();
  const rows = attendance(s, s.ui.siteFilter);
  const { sum, scope } = scopeOf(s);
  const [sel, setSel] = useState<string>("");
  const cur = rows.find(r => r.person.id === sel) || rows[0];
  return (
    <div className="cc-page">
      <PageHead title="Live attendance" sub={"Today's 07:00 roll call from mobile clock events. Demo clock " + s.ui.clock + ". Click a worker for their events and actions."}
        right={<><DemoNote /><SiteFilter /></>} />
      <RollCallKpis />
      <div style={{ fontSize: 12.5, color: "var(--dim)", padding: "0 2px" }}>
        <span style={{ color: "var(--ok)" }}>{scope.onTime} on time</span> + <span style={{ color: "var(--warn)" }}>{scope.late} late</span> + <span style={{ color: "var(--bad)" }}>{scope.missing} missing or unverified</span> = <span style={{ color: "var(--ink)", fontWeight: 600 }}>{scope.scheduled} scheduled</span>
        {s.ui.siteFilter === "all" && <span> · {sum.fieldCrew} field crew, {sum.notScheduled.length} not scheduled today</span>}
      </div>
      <div className="cc-grid cc-split">
        <Card pad={false} title="Roll call" sub="Exceptions first. Location is checked once, at the clock event.">
          <Table minWidth={1040} rowKey={r => r.person.id} rows={rows} selected={cur?.person.id} onRow={r => setSel(r.person.id)} cols={[
            { key: "w", label: "Worker", w: "1.7fr", render: r => <span style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={r.person.name} size={24} tone={r.status === "No clock-in" ? "bad" : r.status === "On time" ? undefined : "warn"} /><span style={{ fontWeight: 500 }}>{r.person.name}</span></span> },
            { key: "r", label: "Role", w: "1.1fr", render: r => <Muted>{r.person.role}</Muted> },
            { key: "s", label: "Site", w: ".9fr", render: r => <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: 2, background: TONE[SITE_TONE[r.site.id]].fg }} />{r.site.name}</span> },
            { key: "sc", label: "Sched.", w: ".6fr", mono: true, render: r => r.scheduled },
            { key: "in", label: "Clock-in", w: ".7fr", mono: true, render: r => r.inEvent ? <span style={{ color: r.minsLate ? "var(--warn)" : "var(--ink)" }}>{r.inEvent.time}</span> : <span style={{ color: "var(--bad)" }}>--:--</span> },
            { key: "st", label: "Status · location", w: "1.6fr", render: r => <span style={{ display: "flex", flexDirection: "column", gap: 3 }}><StatusBadge status={r.status} /><span style={{ fontSize: 10.5, color: "var(--faint)" }}>{r.inEvent ? r.inEvent.location : "No event"}</span></span> },
            { key: "out", label: "Clock-out", w: ".7fr", mono: true, render: r => r.outEvent ? r.outEvent.time : <Muted>On shift</Muted> },
            { key: "h", label: "Hours", w: ".6fr", align: "right", render: r => r.inEvent ? r.hoursSoFar.toFixed(1) + "h" : "0.0h" },
            { key: "a", label: "Approval", w: "1.2fr", render: r => { const a = approvalOf(r); return <Badge tone={a.tone}>{a.label}</Badge>; } },
            { key: "src", label: "Source", w: "1.1fr", render: r => <Muted>{r.inEvent ? r.inEvent.source : "None"}</Muted> }
          ]} />
        </Card>
        {cur ? <WorkerPanel key={cur.person.id} row={cur} /> : <Card><Empty title="No one scheduled here today" /></Card>}
      </div>
      <div className="cc-grid cc-c2">
        <Card title="Not scheduled today" sub="Field crew without an allocation for Wed 18 Nov">
          {sum.notScheduled.map(p => {
            const ab = absenceOn(s, p.id, TODAY);
            return (
              <div key={p.id} className="cc-row cc-click" onClick={() => act.openRecord({ kind: "person", id: p.id })}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 6px", margin: "0 -6px", borderRadius: 10 }}>
                <Avatar name={p.name} size={26} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--dim)" }}>{p.role} · usually {site(s, p.homeSiteId)?.name}</span>
                </span>
                {ab ? <Badge tone="neutral">{ab.kind}</Badge> : <Badge tone="neutral">Not rostered</Badge>}
              </div>
            );
          })}
          {sum.notScheduled.length === 0 && <Muted>Everyone is rostered today.</Muted>}
        </Card>
        <Card title="By site" sub="Clocked in against scheduled">
          <Bars data={sum.bySite.map(b => ({ label: b.site.name + " · " + b.onTime + " on time, " + b.late + " late, " + b.missing + " missing", value: b.clockedIn, text: b.clockedIn + " / " + b.scheduled,
            tone: (b.missing ? "warn" : "ok") as Tone }))} max={Math.max(...sum.bySite.map(b => b.scheduled))} />
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <Btn size="sm" onClick={() => act.setTab("Workforce", "mobile")}>Open mobile clock-in</Btn>
            <Btn size="sm" onClick={() => goTo("Timesheets", "daily")}>Daily records</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

function WorkerPanel({ row }: { row: AttRow }) {
  const s = useDemo();
  const p = row.person;
  const events = s.clockEvents.filter(e => e.personId === p.id && e.date === TODAY).sort((a, b) => a.time.localeCompare(b.time));
  const corrections = s.corrections.filter(c => c.personId === p.id);
  const msgs = s.messages.filter(m => m.linked.some(l => l.kind === "person" && l.id === p.id));
  const draft = s.drafts.find(d => d.kind === "Attendance confirmation" && d.linked.some(l => l.kind === "person" && l.id === p.id));
  const open = row.status === "No clock-in" || row.status === "Held for review";
  const lead = person(s, row.site.leadId);
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [by, setBy] = useState(lead && CORRECTORS.includes(lead.name) ? lead.name : "Liam Walsh");
  const ev = row.inEvent;
  return (
    <Card accent={open ? "bad" : undefined} title={<span style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={p.name} />{p.name}</span>}
      sub={p.role + " · " + row.site.name + " · scheduled " + row.scheduled} right={<StatusBadge status={row.status} />}>
      <KV cols={3} items={[
        ["Clock-in", ev ? ev.time : "None"], ["Location check", ev ? ev.location : "No event"], ["Source", ev ? ev.source : "None"],
        ["Clock-out", row.outEvent ? row.outEvent.time : "On shift"], ["Hours so far", row.hoursSoFar.toFixed(1) + "h"], ["This week", weekHours(s, p.id).toFixed(1) + "h (Mon, Tue)"]
      ]} />
      {ev?.note && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 10, lineHeight: 1.5 }}>{ev.note}</div>}
      {open && (
        <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: "var(--r-sm,10px)", background: "var(--warn-soft)", fontSize: 12.5, lineHeight: 1.55, color: "var(--body)" }}>
          <span style={{ color: "var(--warn)", fontWeight: 600 }}>A missing clock-in is a question, not an absence.</span> Pay is never adjusted automatically. A person confirms what happened and every correction is audited.
        </div>
      )}
      {open && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Btn kind="primary" disabled={!!draft} onClick={() => act.requestConfirmation(p.id)}>{draft ? "Confirmation requested" : "Request confirmation"}</Btn>
            {draft && <Btn size="sm" onClick={() => goTo("Communications", "drafts")}>Review draft</Btn>}
          </div>
          {draft && <Lifecycle status={draft.status} />}
          <div style={{ paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            <Label>Add supervisor correction</Label>
            <div className="cc-grid cc-c2" style={{ marginTop: 10 }}>
              <Field label="Arrival time"><input type="time" className="cc-input" value={time} onChange={e => setTime(e.target.value)} /></Field>
              <Field label="Entered by">
                <select className="cc-input" value={by} onChange={e => setBy(e.target.value)}>{CORRECTORS.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </Field>
            </div>
            <div style={{ marginTop: 10 }}>
              <Field label="Reason" hint="Required. Written to the audit trail with your approval.">
                <textarea className="cc-input" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Arrived 07:05, phone off, confirmed in person by the lead roofer" />
              </Field>
            </div>
            <div style={{ marginTop: 10 }}>
              <Btn disabled={!time || !reason.trim()} onClick={() => { act.addCorrection(p.id, time, reason.trim(), by); setTime(""); setReason(""); }}>Record correction</Btn>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <Label>Today's events</Label>
        <div style={{ marginTop: 10 }}>
          {events.length || corrections.length ? (
            <Timeline items={[
              ...events.map(e => ({ at: e.time, actor: e.type === "in" ? "Clock-in" : "Clock-out", tone: (e.verified ? "ok" : "warn") as Tone, text: e.source + " · " + e.location + (e.verified ? "" : " · held for review") })),
              ...corrections.map(c => ({ at: fmtWhen(c.at, TODAY), actor: "Correction by " + c.enteredBy, tone: "accent" as Tone, text: c.field + " " + c.before + " → " + c.after + ". " + c.reason + (c.approvedBy ? " Approved by " + c.approvedBy + "." : "") }))
            ]} />
          ) : <Muted>No clock events today. Last seen: Tue 17 Nov clock-out.</Muted>}
        </div>
      </div>
      <div style={{ marginTop: 6 }}>
        <Label>Contact</Label>
        <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 6 }}>{p.phone} · {p.email} · site lead {lead?.name}</div>
      </div>
      {msgs.length > 0 && <div style={{ marginTop: 12 }}><Label>Related messages</Label><div style={{ marginTop: 8 }}><Chips refs={msgs.map(m => ({ kind: "message" as const, id: m.id }))} /></div></div>}
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <Btn size="sm" onClick={() => act.openRecord({ kind: "person", id: p.id })}>Open full record</Btn>
        <Btn size="sm" onClick={() => act.openRecord({ kind: "job", id: row.site.jobId }, "attendance")}>Site attendance</Btn>
      </div>
    </Card>
  );
}

function Staff() {
  const s = useDemo();
  const [f, setF] = useState<"all" | "field" | "office">("all");
  const [q, setQ] = useState("");
  const today = useMemo(() => new Map(attendance(s).map(r => [r.person.id, r])), [s]);
  const rows = s.people.filter(p => (f === "all" || (f === "field" ? p.kind === "field" : p.kind !== "field"))
    && (!q.trim() || (p.name + " " + p.role).toLowerCase().includes(q.trim().toLowerCase())));
  const field = s.people.filter(p => p.kind === "field");
  return (
    <div className="cc-page">
      <PageHead title="Staff" sub="Field crew, office and the external QS. Phone numbers are hidden in the demo; hours come from clock events."
        right={<><DemoNote /><input className="cc-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or role" style={{ width: 210 }} /><Seg options={[["all", "All"], ["field", "Field crew"], ["office", "Office & QS"]]} value={f} onChange={setF} /></>} />
      <div className="cc-grid cc-c4">
        <Kpi label="Field crew" value={field.length} hint={field.filter(p => p.role === "Apprentice").length + " apprentices"} />
        <Kpi label="Site leads" value={s.sites.length} hint={s.sites.map(x => person(s, x.leadId)?.name.split(" ")[0]).join(", ")} tone="accent" />
        <Kpi label="Hours this week" value={field.reduce((n, p) => n + weekHours(s, p.id), 0).toFixed(1) + "h"} hint="Mon and Tue, from day records" />
        <Kpi label="Tickets to renew" value={field.filter(p => p.tickets.some(t => /renew/i.test(t))).length} hint="Safe Pass, James Collins by 30 Nov" tone="warn" />
      </div>
      <Card pad={false} title={rows.length + " people"} sub="Click a row for the person's record">
        <Table minWidth={1000} rowKey={p => p.id} rows={rows} onRow={p => act.openRecord({ kind: "person", id: p.id })} cols={[
          { key: "n", label: "Name", w: "1.6fr", render: p => <span style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={p.name} size={24} tone={p.kind === "field" ? undefined : "accent"} /><span style={{ fontWeight: 500 }}>{p.name}</span></span> },
          { key: "r", label: "Role", w: "1.4fr", render: p => p.role },
          { key: "s", label: "Usual site", w: ".9fr", render: p => p.homeSiteId ? site(s, p.homeSiteId)?.name : <Muted>Office</Muted> },
          { key: "ph", label: "Phone", w: "1fr", mono: true, render: p => <Muted>{p.phone}</Muted> },
          { key: "t", label: "Tickets", w: "2fr", render: p => p.tickets.length ? <span style={{ fontSize: 12, color: p.tickets.some(t => /renew/i.test(t)) ? "var(--warn)" : "var(--body)" }}>{p.tickets.join(", ")}</span> : <Muted>None needed</Muted> },
          { key: "wk", label: "This week", w: ".8fr", align: "right", render: p => p.kind === "field" ? weekHours(s, p.id).toFixed(1) + "h" : "" },
          { key: "avg", label: "4-wk avg", w: ".8fr", align: "right", render: p => p.avgWeekHours ? p.avgWeekHours.toFixed(1) + "h" : "" },
          { key: "td", label: "Today", w: "1.2fr", render: p => { const r = today.get(p.id); if (r) return <StatusBadge status={r.status} />; const ab = absenceOn(s, p.id, TODAY); return ab ? <Badge tone="neutral">{ab.kind}</Badge> : <Muted>{p.kind === "field" ? "Not rostered" : p.kind === "external" ? "External" : "Office"}</Muted>; } }
        ]} />
      </Card>
    </div>
  );
}

function Allocations() {
  const s = useDemo();
  const field = s.people.filter(p => p.kind === "field").slice().sort((a, b) => (a.homeSiteId || "").localeCompare(b.homeSiteId || "") || a.id.localeCompare(b.id));
  const grid = "minmax(180px,1.6fr) repeat(5,minmax(96px,1fr))";
  const cell = (p: Person, date: string) => {
    const a = s.allocations.find(x => x.personId === p.id && x.date === date);
    if (a) {
      const st = site(s, a.siteId)!;
      const moved = a.siteId !== p.homeSiteId;
      return (
        <div title={moved ? "Moved from " + site(s, p.homeSiteId)?.name : undefined} style={{ height: 30, display: "flex", alignItems: "center", gap: 6, padding: "0 9px", borderRadius: "var(--r-sm,8px)",
          background: TONE[SITE_TONE[st.id]].bg, color: TONE[SITE_TONE[st.id]].fg, fontSize: 12, fontWeight: 500, border: moved ? "1px solid " + TONE[SITE_TONE[st.id]].fg : "1px solid transparent" }}>
          {st.name}{moved && <span style={{ fontSize: 10, opacity: .85 }}>moved</span>}
        </div>
      );
    }
    const ab = absenceOn(s, p.id, date);
    return <div style={{ height: 30, display: "flex", alignItems: "center", padding: "0 9px", borderRadius: "var(--r-sm,8px)", border: "1px dashed var(--border-strong)", fontSize: 11.5, color: "var(--dim)" }}>{ab ? ab.kind : "Off"}</div>;
  };
  return (
    <div className="cc-page">
      <PageHead title="Allocations" sub="Week 47 crew roster per site. Wednesday is today. Changes from someone's usual site are outlined."
        right={<><DemoNote /><Btn onClick={() => act.setTab("Workforce", "absences")}>Absences</Btn></>} />
      <div className="cc-grid cc-c3">
        {s.sites.map(st => {
          const n = s.allocations.filter(a => a.date === TODAY && a.siteId === st.id).length;
          return <Kpi key={st.id} label={st.name + " today"} value={n} hint={"Lead: " + person(s, st.leadId)?.name} tone={SITE_TONE[st.id]} onClick={() => { act.setSiteFilter(st.id); act.setTab("Workforce", "live"); }} />;
        })}
      </div>
      <Card pad={false} title="Week roster, Mon 16 to Fri 20 November" sub="Michael Casey moves to Tralee on Thursday and Friday for the Unit 2 membrane delivery">
        <div className="cc-scroll-x">
          <div style={{ minWidth: 760 }}>
            <div style={{ display: "grid", gridTemplateColumns: grid, background: "var(--surface-faint)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ padding: "9px 14px" }}><Label>Person</Label></div>
              {WEEK.map(d => <div key={d} style={{ padding: "9px 10px", background: d === TODAY ? "var(--accent-faint)" : undefined }}><Label style={{ color: d === TODAY ? "var(--accent)" : undefined }}>{fmtDate(d)}{d === TODAY ? " · today" : ""}</Label></div>)}
            </div>
            {field.map((p, i) => (
              <div key={p.id} className="cc-row cc-click" onClick={() => act.openRecord({ kind: "person", id: p.id })} style={{ display: "grid", gridTemplateColumns: grid, borderTop: i ? "1px solid var(--border)" : 0, alignItems: "center" }}>
                <div style={{ padding: "7px 14px", display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                  <Avatar name={p.name} size={22} />
                  <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span><span style={{ display: "block", fontSize: 10.5, color: "var(--faint)" }}>{p.role}</span></span>
                </div>
                {WEEK.map(d => <div key={d} style={{ padding: "6px 8px", background: d === TODAY ? "var(--accent-faint)" : undefined }}>{cell(p, d)}</div>)}
              </div>
            ))}
            {s.sites.map(st => (
              <div key={st.id} style={{ display: "grid", gridTemplateColumns: grid, borderTop: "1px solid var(--border)", background: "var(--surface-faint)" }}>
                <div style={{ padding: "9px 14px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: TONE[SITE_TONE[st.id]].fg }} />{st.name} headcount</div>
                {WEEK.map(d => <div key={d} style={{ padding: "9px 12px", fontSize: 13, fontVariantNumeric: "tabular-nums", fontWeight: d === TODAY ? 600 : 400 }}>{s.allocations.filter(a => a.date === d && a.siteId === st.id).length}</div>)}
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: grid, borderTop: "1px solid var(--border-strong)" }}>
              <div style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600 }}>Total scheduled</div>
              {WEEK.map(d => <div key={d} style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{s.allocations.filter(a => a.date === d).length}</div>)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Absences() {
  const s = useDemo();
  const sum = attendanceSummary(s);
  const rows = s.absences.slice().sort((a, b) => a.from.localeCompare(b.from));
  const onToday = rows.filter(a => a.from <= TODAY && a.to >= TODAY);
  return (
    <div className="cc-page">
      <PageHead title="Absences" sub="Planned time off, training and cover. Unplanned no-shows are handled in Live attendance, never assumed from a missing clock-in."
        right={<><DemoNote /><Btn onClick={() => act.setTab("Workforce", "allocations")}>Week roster</Btn></>} />
      <div className="cc-grid cc-c4">
        <Kpi label="Off today" value={onToday.length} hint={onToday.map(a => person(s, a.personId)?.name).join(", ")} />
        <Kpi label="Not scheduled today" value={sum.notScheduled.length} hint={sum.fieldCrew + " field crew, " + sum.scheduled + " scheduled"} />
        <Kpi label="Cover requests open" value={rows.filter(a => a.cover === "Cover requested").length} hint="Needs a name on the roster" tone="warn" />
        <Kpi label="Upcoming, next 30 days" value={rows.filter(a => a.from > TODAY && daysBetween(TODAY, a.from) <= 30).length} hint="Leave and training booked" tone="accent" />
      </div>
      <div className="cc-grid cc-split">
        <Card pad={false} title="Planned absences" sub="Click a row for the person">
          <Table minWidth={760} rowKey={a => a.id} rows={rows} onRow={a => act.openRecord({ kind: "person", id: a.personId })} cols={[
            { key: "p", label: "Person", w: "1.5fr", render: a => <span style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={person(s, a.personId)?.name || ""} size={24} /><span style={{ fontWeight: 500 }}>{person(s, a.personId)?.name}</span></span> },
            { key: "k", label: "Type", w: "1.1fr", render: a => a.kind },
            { key: "f", label: "From", w: ".9fr", render: a => fmtShortDate(a.from) },
            { key: "t", label: "To", w: ".9fr", render: a => fmtShortDate(a.to) },
            { key: "d", label: "Days", w: ".5fr", align: "right", render: a => daysBetween(a.from, a.to) + 1 },
            { key: "c", label: "Cover", w: "1.1fr", render: a => <Badge tone={a.cover === "Cover requested" ? "warn" : a.cover === "Covered" ? "ok" : "neutral"}>{a.cover}</Badge> },
            { key: "n", label: "Note", w: "1.8fr", render: a => <Muted>{a.note}</Muted> }
          ]} />
        </Card>
        <Card title="Today, Wed 18 Nov" sub="Field crew not on the roster">
          {sum.notScheduled.map(p => {
            const ab = absenceOn(s, p.id, TODAY);
            return (
              <div key={p.id} style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={p.name} size={24} /><span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{p.name}</span>{ab && <Badge tone="neutral">{ab.kind}</Badge>}</div>
                <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 5 }}>{ab ? ab.note + " " + (ab.to > TODAY ? "Back " + fmtDate(next(ab.to)) + "." : "") : "Not rostered."}</div>
              </div>
            );
          })}
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--dim)", lineHeight: 1.55 }}>Declan Foley's block release from 30 Nov leaves Cappamore one apprentice short. Cover is requested on the roster.</div>
          <div style={{ marginTop: 10 }}><Btn size="sm" onClick={() => act.openRecord({ kind: "person", id: "P05" })}>Open Declan Foley</Btn></div>
        </Card>
      </div>
    </div>
  );
}
const next = (iso: string) => { const d = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

type Step = "start" | "confirmed" | "checked";

function Mobile() {
  const s = useDemo();
  const rows = attendance(s);
  const [pid, setPid] = useState("P01");
  const [step, setStep] = useState<Step>("start");
  const [inside, setInside] = useState(true);
  const row = rows.find(r => r.person.id === pid) || rows[0];
  const pick = (id: string) => { setPid(id); setStep("start"); };
  const events = s.clockEvents.filter(e => e.date === TODAY).slice().sort((a, b) => b.time.localeCompare(a.time) || b.id.localeCompare(a.id));
  const corrections = s.corrections.filter(c => c.personId === row.person.id);
  return (
    <div className="cc-page">
      <PageHead title="Mobile clock-in" sub="What a worker sees on their phone. Tap through it and watch the roll call update. Frontend simulation only."
        right={<><DemoNote>Location verification simulated</DemoNote><Btn onClick={() => act.setTab("Workforce", "live")}>Live attendance</Btn></>} />
      <div className="cc-grid cc-split-narrow">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Phone row={row} step={step} setStep={setStep} inside={inside} corrections={corrections.map(c => c.at.slice(11, 16) + " · " + c.before + " → " + c.after + " by " + c.enteredBy)} />
        </div>
        <div className="cc-stack">
          <Card title="Simulator controls" sub="Pick who is holding the phone and where they are standing when they tap">
            <div className="cc-grid cc-c2">
              <Field label="Worker">
                <select className="cc-input" value={row.person.id} onChange={e => pick(e.target.value)}>
                  {rows.map(r => <option key={r.person.id} value={r.person.id}>{r.person.name} · {r.site.name} · {r.status}</option>)}
                </select>
              </Field>
              <Field label="Location at the moment of the event">
                <Seg options={[["in", "Inside site boundary"], ["out", "Outside boundary"]]} value={inside ? "in" : "out"} onChange={v => { setInside(v === "in"); if (step === "checked") setStep("confirmed"); }} />
              </Field>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <Btn size="sm" onClick={() => setStep("start")}>Restart the flow</Btn>
              <Btn size="sm" onClick={() => act.openRecord({ kind: "person", id: row.person.id })}>Open {row.person.name.split(" ")[0]}'s record</Btn>
            </div>
            <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 12, lineHeight: 1.55 }}>Location is checked once, at the clock event. No continuous tracking. Outside the boundary, the clock-in is held for the site lead to review rather than refused.</div>
          </Card>
          <RollCallKpis compact />
          <Card pad={false} title="Today's clock events" sub={events.length + " events · newest first"}>
            <Table minWidth={720} dense rowKey={e => e.id} rows={events} onRow={e => { pick(e.personId); }} cols={[
              { key: "t", label: "Time", w: ".6fr", mono: true, render: (e: ClockEvent) => e.time },
              { key: "p", label: "Person", w: "1.4fr", render: e => person(s, e.personId)?.name },
              { key: "s", label: "Site", w: ".9fr", render: e => site(s, e.siteId)?.name },
              { key: "ty", label: "Event", w: ".6fr", render: e => e.type === "in" ? "In" : "Out" },
              { key: "src", label: "Source", w: "1.2fr", render: e => <Muted>{e.source}</Muted> },
              { key: "l", label: "Location", w: "1.3fr", render: e => <Muted>{e.location}</Muted> },
              { key: "v", label: "Status", w: "1fr", render: e => e.verified ? <Badge tone="ok" dot>Verified</Badge> : <Badge tone="warn" dot>Held</Badge> }
            ]} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Phone({ row, step, setStep, inside, corrections }: { row: AttRow; step: Step; setStep: (s: Step) => void; inside: boolean; corrections: string[] }) {
  const s = useDemo();
  const p = row.person;
  const lead = person(s, row.site.leadId);
  const ev = row.inEvent;
  const stepIdx = ev ? 3 : step === "start" ? 0 : step === "confirmed" ? 1 : 2;
  const screen: CSSProperties = { position: "relative", height: 640, borderRadius: 32, background: "var(--bg)", border: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column" };
  return (
    <div className="cc-phone" style={{ padding: 10, borderRadius: 42, background: "var(--surface-2)", border: "1px solid var(--border-strong)", boxShadow: "0 30px 70px rgba(0,0,0,.35)" }}>
      <div style={screen}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px 6px", fontSize: 12, fontWeight: 600 }}>
          <span>{s.ui.clock}</span>
          <span style={{ width: 80, height: 20, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)" }} />
          <span style={{ fontSize: 10.5, color: "var(--dim)" }}>4G · 82%</span>
        </div>
        <div style={{ padding: "8px 18px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 10, background: "var(--accent-fill,var(--accent))", color: "var(--on-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>CC</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Clock in</div>
            <div style={{ fontSize: 10.5, color: "var(--dim)" }}>Colm Curran Roofing & Building</div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 16px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ padding: "14px 15px", borderRadius: 18, background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={p.name} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{p.role}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
              <PhoneFact k="Site" v={row.site.name + ", " + row.site.county} />
              <PhoneFact k="Shift" v={"Wed 18 Nov · " + row.scheduled} />
              <PhoneFact k="Job" v={row.site.jobId} />
              <PhoneFact k="Lead" v={lead?.name || ""} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["Confirm arrival", "Check location", "Clock in"].map((l, i) => (
              <div key={l} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 4, borderRadius: 3, background: i < stepIdx ? "var(--accent)" : "var(--track)" }} />
                <div style={{ fontSize: 10, marginTop: 5, color: i < stepIdx ? "var(--ink)" : "var(--faint)" }}>{l}</div>
              </div>
            ))}
          </div>
          {ev ? (
            <div style={{ padding: "14px 15px", borderRadius: 18, background: ev.verified ? "var(--ok-soft)" : "var(--warn-soft)", border: "1px solid " + (ev.verified ? "var(--ok)" : "var(--warn)") }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: ev.verified ? "var(--ok)" : "var(--warn)" }}>{row.outEvent ? "Shift complete" : ev.verified ? "You're clocked in" : "Clocked in, held for review"}</div>
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-1px", marginTop: 6 }}>{ev.time}</div>
              <div style={{ fontSize: 11.5, color: "var(--body)", marginTop: 6, lineHeight: 1.5 }}>
                {ev.source} · {ev.location}{row.minsLate ? " · " + row.minsLate + " min after start" : ""}
              </div>
              {!ev.verified && <div style={{ fontSize: 11.5, color: "var(--body)", marginTop: 6, lineHeight: 1.5 }}>{lead?.name.split(" ")[0]} will confirm. Nothing changes on pay until a person does.</div>}
              {row.outEvent && <div style={{ fontSize: 11.5, color: "var(--body)", marginTop: 6 }}>Clocked out {row.outEvent.time} · {row.hoursSoFar.toFixed(1)}h on site</div>}
            </div>
          ) : (
            <div style={{ padding: "14px 15px", borderRadius: 18, background: "var(--surface)", border: "1px solid var(--border)" }}>
              {step === "start" && <>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Are you at {row.site.name}?</div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4, lineHeight: 1.5 }}>Your shift started at {row.scheduled}. Confirm you have arrived on site.</div>
              </>}
              {step === "confirmed" && <>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Arrival confirmed</div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4, lineHeight: 1.5 }}>Next, one location check for this clock-in only. Pulse does not track you after this.</div>
              </>}
              {step === "checked" && <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: inside ? "var(--ok)" : "var(--warn)" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: inside ? "var(--ok)" : "var(--warn)" }}>{inside ? "Inside the site boundary" : "Outside the site boundary"}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4, lineHeight: 1.5 }}>
                  {inside ? "Within " + row.site.geofenceM + " m of the " + row.site.name + " compound." : "You can still clock in. It will be held for " + (lead?.name.split(" ")[0] || "the site lead") + " to review."}
                </div>
              </>}
            </div>
          )}
          {corrections.length > 0 && (
            <div style={{ padding: "11px 13px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <Label>Correction history</Label>
              {corrections.map(c => <div key={c} style={{ fontSize: 11.5, color: "var(--body)", marginTop: 6 }}>{c}</div>)}
            </div>
          )}
        </div>
        <div style={{ padding: "10px 16px 14px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          {!ev && step === "start" && <Btn kind="primary" full onClick={() => setStep("confirmed")}>Confirm arrival</Btn>}
          {!ev && step === "confirmed" && <Btn kind="primary" full onClick={() => setStep("checked")}>Check location for this event</Btn>}
          {!ev && step === "checked" && <Btn kind="primary" full onClick={() => act.simulateClock(p.id, "in", inside)}>Clock in</Btn>}
          {!ev && <Btn kind="quiet" size="sm" full onClick={() => act.simulateClock(p.id, "in", false, true)}>Location permission unavailable · ask {lead?.name.split(" ")[0] || "the lead"} to verify</Btn>}
          {ev && !row.outEvent && <Btn full onClick={() => act.simulateClock(p.id, "out", true)}>Clock out (preview)</Btn>}
          {ev && row.outEvent && <Btn full disabled>Shift closed</Btn>}
          <div style={{ fontSize: 10, color: "var(--faint)", textAlign: "center", lineHeight: 1.45 }}>Location verification simulated. Location is checked once, at the clock event. No continuous tracking.</div>
        </div>
      </div>
    </div>
  );
}

function PhoneFact({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ padding: "7px 9px", borderRadius: 10, background: "var(--surface-2)", minWidth: 0 }}>
      <div style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--faint)" }}>{k}</div>
      <div style={{ fontSize: 11.5, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</div>
    </div>
  );
}
