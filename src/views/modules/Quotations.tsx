/* Quotations: enquiry to signed quote. Pipeline, enquiries, drawings, QS estimates,
   quotes and follow-ups, all read from the one demo store. */
import { useEffect, useState, type ReactNode } from "react";
import { act, goTo, useDemo, type DemoState } from "../../demo/store";
import {
  ACTIVE_STAGES, TODAY, customer, draftFor, estimateTotal, person, quoteAge, quotesByStage, totals
} from "../../demo/selectors";
import { daysBetween, eur, fmtDate, fmtShortDate, fmtWhen } from "../../demo/format";
import type { Doc, Draft, Enquiry, QSLine, Quote } from "../../demo/types";
import {
  Badge, Btn, Card, Chips, DemoNote, Empty, KV, Kpi, Label, Lifecycle, Muted, PageHead, Progress, RecordChip,
  SectionTitle, StatusBadge, Table, Timeline, type Col
} from "./ui";

/* ── shared bits ───────────────────────────────────────────────────────── */

function Tick({ done }: { done: boolean }) {
  return (
    <span style={{ width: 16, height: 16, flex: "none", borderRadius: 5, display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: done ? "var(--accent-fill,var(--accent))" : "var(--track)", color: done ? "var(--on-accent)" : "transparent" }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </span>
  );
}

function Checklist({ items }: { items: { label: string; done: boolean }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map(c => (
        <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: c.done ? "var(--body)" : "var(--dim)" }}>
          <Tick done={c.done} />{c.label}
        </div>
      ))}
    </div>
  );
}

/** One approval panel for any agent draft: edit, approve, reject, mark sent (simulated). */
export function DraftPanel({ draft, editable = true, note }: { draft: Draft; editable?: boolean; note?: ReactNode }) {
  const [text, setText] = useState(draft.body);
  useEffect(() => { setText(draft.body); }, [draft.id, draft.body]);
  const waiting = draft.status === "Awaiting approval";
  const dirty = text !== draft.body;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Lifecycle status={draft.status} />
      <div style={{ display: "grid", gridTemplateColumns: "64px minmax(0,1fr)", gap: "4px 10px", fontSize: 12.5 }}>
        <Muted>To</Muted><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{draft.to}</span>
        <Muted>Subject</Muted><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{draft.subject}</span>
      </div>
      {editable && waiting
        ? <textarea className="cc-input" rows={7} value={text} onChange={e => setText(e.target.value)} />
        : <div style={{ whiteSpace: "pre-wrap", fontSize: 12.5, lineHeight: 1.6, color: "var(--body)", padding: "10px 12px", background: "var(--surface-2)",
            border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)" }}>{draft.body}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {waiting && editable && <Btn size="sm" disabled={!dirty} onClick={() => act.editDraft(draft.id, text)}>Save changes</Btn>}
        {waiting && <Btn size="sm" kind="primary" onClick={() => { if (dirty) act.editDraft(draft.id, text); act.approveDraft(draft.id); }}>Approve</Btn>}
        {waiting && <Btn size="sm" kind="quiet" onClick={() => act.rejectDraft(draft.id)}>Reject</Btn>}
        {draft.status === "Approved" && <Btn size="sm" kind="primary" onClick={() => act.simulateSend(draft.id)}>Mark sent (simulated)</Btn>}
        {draft.status === "Simulated complete" && <Badge tone="ok" dot>Marked sent in the demo. Nothing was emailed.</Badge>}
        {draft.status === "Rejected" && <Badge tone="neutral">Rejected. The agent will not raise it again today.</Badge>}
        {draft.edited && <Badge tone="info">Edited by Colm</Badge>}
      </div>
      <Muted style={{ fontSize: 11.5 }}>{note || "Approving marks it ready to send. No email leaves this demo."}</Muted>
    </div>
  );
}

const enquiryOf = (s: DemoState, d: Doc): Enquiry | undefined =>
  (d.quoteId && s.enquiries.find(e => e.quoteId === d.quoteId))
  || s.enquiries.find(e => !e.quoteId && e.customerId === d.customerId && (e.drawingsAt || "").slice(0, 10) === d.date);

const quoteValueLabel = (q: Quote) => eur(q.value) + (q.indicative ? " indicative, not issued" : "");

function ageLabel(q: Quote) {
  if (q.stage === "Won") return "Won";
  if (q.stage === "Lost") return "Lost" + (q.lostReason ? ": " + q.lostReason.toLowerCase() : "");
  if (!q.sentDate) return q.indicative ? "Not issued" : "Not sent";
  const d = quoteAge(q);
  return d === 0 ? "Sent today" : "Sent " + d + " day" + (d === 1 ? "" : "s") + " ago";
}

function followState(q: Quote): { label: string; tone: "bad" | "warn" | "neutral" } | null {
  if (!q.followUpDue || !ACTIVE_STAGES.includes(q.stage) || q.indicative) return null;
  const d = daysBetween(q.followUpDue, TODAY);
  return d > 0 ? { label: "Follow-up overdue " + d + "d", tone: "bad" } : d === 0 ? { label: "Follow-up due today", tone: "warn" } : { label: "Follow-up " + fmtShortDate(q.followUpDue), tone: "neutral" };
}

/* ── tabs ──────────────────────────────────────────────────────────────── */

function Pipeline({ s }: { s: DemoState }) {
  const t = totals(s);
  const cols = quotesByStage(s);
  const won = s.quotes.filter(q => q.stage === "Won");
  return (
    <div className="cc-page">
      <PageHead title="Quote pipeline" sub="Every enquiry from first phone call to signed quote. Values are quotes only; enquiries without drawings carry no value yet."
        right={<><DemoNote /><Btn onClick={() => act.setTab("Quotations", "followups")}>Follow-ups</Btn><Btn kind="primary" onClick={() => act.setTab("Quotations", "estimates")}>QS estimates</Btn></>} />
      <div className="cc-grid cc-c5">
        <Kpi label="Active pipeline" value={eur(t.pipeline)} hint={"Across " + t.pipelineCount + " quoted or estimated opportunities"} tone="accent" />
        <Kpi label="Indicative" value={String(t.indicativeCount)} hint="QS estimate only, not a formal quote" tone="info" delay={60}
          onClick={() => act.setTab("Quotations", "estimates")} />
        <Kpi label="Follow-ups due" value={String(t.staleQuotes.length)} hint={t.staleQuotes.map(q => q.id).join(" and ") || "None today"} tone="warn" delay={120}
          onClick={() => act.setTab("Quotations", "followups")} />
        <Kpi label="New enquiries" value={String(s.enquiries.filter(e => !e.quoteId).length)} hint="Logged, not yet priced" delay={180} onClick={() => act.setTab("Quotations", "enquiries")} />
        <Kpi label="Won (now jobs)" value={eur(won.reduce((n, q) => n + q.value, 0))} hint={won.map(q => q.jobId).join(", ")} tone="ok" delay={240} />
      </div>
      <div className="cc-kanban">
        {cols.map(c => {
          const sum = c.quotes.reduce((n, q) => n + q.value, 0);
          const count = c.quotes.length + c.enquiries.length;
          return (
            <div key={c.stage} style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 8, padding: 10, background: "var(--surface-faint)",
              border: "1px solid var(--border)", borderRadius: "var(--card-r,18px)", minHeight: 260 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px 4px" }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.stage}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)" }}>{count}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--dim)", padding: "0 4px" }}>{sum ? eur(sum) : "No value yet"}</div>
              {c.quotes.map(q => {
                const f = followState(q);
                return (
                  <div key={q.id} onClick={() => act.openRecord({ kind: "quote", id: q.id })} className="cc-card-click" style={{ padding: "11px 12px", background: "var(--surface)",
                    border: "1px solid " + (q.indicative ? "var(--accent-line)" : "var(--border)"), borderRadius: "var(--r-md,14px)", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)" }}>{q.id}</span>
                      <span style={{ flex: 1 }} />
                      {q.indicative && <Badge tone="info">Indicative</Badge>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}>{q.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{customer(s, q.customerId)?.name}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: q.stage === "Lost" ? "var(--dim)" : "var(--ink)" }}>{quoteValueLabel(q)}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <Muted style={{ fontSize: 11 }}>{ageLabel(q)}</Muted>
                      {f && <Badge tone={f.tone}>{f.label}</Badge>}
                    </div>
                  </div>
                );
              })}
              {c.enquiries.map(e => (
                <div key={e.id} onClick={() => act.openRecord({ kind: "enquiry", id: e.id })} className="cc-card-click" style={{ padding: "11px 12px", background: "var(--surface)",
                  border: "1px dashed var(--border-strong)", borderRadius: "var(--r-md,14px)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)" }}>{e.id} · enquiry</span>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}>{e.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{customer(s, e.customerId)?.name}</div>
                  <Muted style={{ fontSize: 11 }}>{e.channel} {fmtWhen(e.receivedAt, TODAY)} · {e.source}</Muted>
                </div>
              ))}
              {!count && <div style={{ padding: "18px 6px", textAlign: "center", fontSize: 11.5, color: "var(--faint)" }}>Nothing at this stage</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Enquiries({ s }: { s: DemoState }) {
  const sel = s.enquiries.find(e => e.id === s.ui.selected.enquiry) || s.enquiries.find(e => e.id === "ENQ-505")!;
  const cols: Col<Enquiry>[] = [
    { key: "id", label: "ID", w: "84px", mono: true, render: e => e.id },
    { key: "t", label: "Enquiry", w: "1.6fr", render: e => <span style={{ fontWeight: 500 }}>{e.title}</span> },
    { key: "c", label: "Customer", w: "1.3fr", render: e => customer(s, e.customerId)?.name },
    { key: "src", label: "Source", w: "1.3fr", render: e => <span style={{ color: "var(--dim)" }}>{e.source}{e.referredBy ? " via " + e.referredBy : ""}</span> },
    { key: "r", label: "Received", w: "100px", render: e => <span style={{ color: "var(--dim)" }}>{fmtWhen(e.receivedAt, TODAY)}</span> },
    { key: "d", label: "Drawings", w: "100px", render: e => e.drawingsAt ? fmtShortDate(e.drawingsAt) : <span style={{ color: "var(--warn)" }}>Not yet</span> },
    { key: "s", label: "Stage", w: "150px", render: e => <StatusBadge status={e.stage} /> },
    { key: "p", label: "Checklist", w: "120px", render: e => {
      const done = e.checklist.filter(c => c.done).length;
      return <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1 }}><Progress value={(100 * done) / e.checklist.length} /></div><span style={{ fontSize: 11, color: "var(--dim)" }}>{done}/{e.checklist.length}</span></div>;
    } }
  ];
  const quoteOf = sel.quoteId ? s.quotes.find(q => q.id === sel.quoteId) : undefined;
  const handed = sel.checklist.find(c => c.label === "Handed to QS")?.done;
  return (
    <div className="cc-page">
      <PageHead title="Enquiries" sub="New business arrives by phone from referrals and repeat customers. Drawings follow by email and go to the QS."
        right={<><DemoNote /><Btn onClick={() => act.setTab("Quotations", "drawings")}>Drawing register</Btn></>} />
      <div className="cc-grid cc-c4">
        <Kpi label="Enquiries logged" value={String(s.enquiries.length)} hint="Last 4 weeks" />
        <Kpi label="From referrals" value={String(s.enquiries.filter(e => e.source === "Referral").length)} hint="Rest are repeat customers" tone="accent" delay={60} />
        <Kpi label="Waiting on drawings" value={String(s.enquiries.filter(e => !e.drawingsAt).length)} hint="Customer to send" tone="warn" delay={120} />
        <Kpi label="Ready for the QS" value={String(s.enquiries.filter(e => e.stage === "Drawings Received").length)} hint="Drawings in, not handed over" tone="info" delay={180} />
      </div>
      <div className="cc-grid cc-split">
        <Card title="Enquiry log" sub="Select a row for the call note and intake checklist." pad={false}>
          <Table cols={cols} rows={s.enquiries} rowKey={e => e.id} selected={sel.id} onRow={e => act.select("enquiry", e.id)} minWidth={900} />
        </Card>
        <div className="cc-stack">
          <Card title={sel.title} sub={sel.id + " · " + customer(s, sel.customerId)?.name} right={<StatusBadge status={sel.stage} />}>
            <Label>{sel.channel === "Phone call" ? "Manually logged call note" : "Email enquiry"} · {fmtWhen(sel.receivedAt, TODAY)}</Label>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--body)", marginTop: 7, padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)" }}>
              {sel.callNote}
            </div>
            <div style={{ marginTop: 14 }}><Label style={{ marginBottom: 9 }}>Intake checklist</Label><Checklist items={sel.checklist} /></div>
            <div style={{ marginTop: 14 }}>
              <Chips refs={[{ kind: "customer", id: sel.customerId }, ...(sel.quoteId ? [{ kind: "quote" as const, id: sel.quoteId }] : [])]} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              {sel.stage === "Drawings Received" && !handed && <Btn kind="primary" onClick={() => act.handToQS(sel.id)}>Hand to QS (Eoin McCarthy)</Btn>}
              {quoteOf && <Btn onClick={() => { act.select("quote", quoteOf.id); act.setTab("Quotations", "quotes"); }}>Open {quoteOf.id}</Btn>}
              {!sel.drawingsAt && <Muted>Waiting on drawings from the customer. Nothing to hand over yet.</Muted>}
              {sel.stage === "With QS" && !quoteOf && <Badge tone="info" dot>With Eoin McCarthy (QS)</Badge>}
            </div>
          </Card>
          <Card title="Where enquiries come from" sub="Colm reports no shortage of work. Referrals and repeat customers carry it.">
            {(["Referral", "Repeat customer"] as const).map(src => {
              const n = s.enquiries.filter(e => e.source === src).length;
              return (
                <div key={src} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span>{src}</span><span>{n} of {s.enquiries.length}</span></div>
                  <div style={{ marginTop: 6 }}><Progress value={(100 * n) / s.enquiries.length} tone={src === "Referral" ? "accent" : "info"} /></div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
}

const categoryOf = (d: Doc) => d.kind === "Specification" ? (/report/i.test(d.title) ? "Assessor report + photos" : "Property schedule")
  : d.kind === "QS estimate" ? "QS takeoff" : /elevation/i.test(d.title) ? "Roof plan + elevation" : "Roof plan";

function Drawings({ s }: { s: DemoState }) {
  const docs = s.documents.filter(d => (d.kind === "Drawing" || d.kind === "Specification") && (d.quoteId || enquiryOf(s, d)))
    .sort((a, b) => b.date.localeCompare(a.date));
  const sel = docs.find(d => d.id === s.ui.selected.drawing) || docs.find(d => d.id === "DOC-202B") || docs[0];
  const enq = sel ? enquiryOf(s, sel) : undefined;
  const handed = enq ? (enq.checklist.find(c => c.label === "Handed to QS")?.done ?? enq.checklist.find(c => c.label === "Priced")?.done ?? false) : false;
  const cols: Col<Doc>[] = [
    { key: "t", label: "Drawing / document", w: "1.8fr", render: d => <span style={{ fontWeight: 500, color: d.supersededBy ? "var(--dim)" : "var(--ink)" }}>{d.title}</span> },
    { key: "v", label: "Version", w: "90px", render: d => d.version },
    { key: "d", label: "Received", w: "90px", render: d => fmtShortDate(d.date) },
    { key: "b", label: "From", w: "1.3fr", render: d => <span style={{ color: "var(--dim)" }}>{d.by}</span> },
    { key: "l", label: "Linked to", w: "110px", mono: true, render: d => d.quoteId || enquiryOf(s, d)?.id || "" },
    { key: "c", label: "Category (confirmed)", w: "1.2fr", render: d => categoryOf(d) },
    { key: "s", label: "Status", w: "140px", render: d => d.supersededBy ? <Badge tone="neutral">Superseded</Badge> : <Badge tone="ok" dot>Current</Badge> }
  ];
  return (
    <div className="cc-page">
      <PageHead title="Drawing register" sub="Drawings arrive by email after the phone call. Each revision is filed against its enquiry and the old one is marked superseded."
        right={<><DemoNote /><Btn onClick={() => act.setTab("Quotations", "estimates")}>QS estimates</Btn></>} />
      <div className="cc-grid cc-c4">
        <Kpi label="Documents on file" value={String(docs.length)} hint="Drawings, schedules and reports" />
        <Kpi label="Current revisions" value={String(docs.filter(d => !d.supersededBy).length)} hint="Superseded sets kept for audit" tone="accent" delay={60} />
        <Kpi label="Received this week" value={String(docs.filter(d => daysBetween(d.date, TODAY) <= 2).length)} hint="Since Monday 16 Nov" delay={120} />
        <Kpi label="Waiting for the QS" value={String(s.enquiries.filter(e => e.stage === "Drawings Received").length)} hint="Drawings in, not handed over" tone="warn" delay={180} />
      </div>
      <div className="cc-grid cc-split">
        <Card title="Register" sub="Select a document for its intake checklist." pad={false}>
          <Table cols={cols} rows={docs} rowKey={d => d.id} selected={sel?.id} onRow={d => act.select("drawing", d.id)} minWidth={860} />
        </Card>
        <div className="cc-stack">
          {sel && (
            <Card title={sel.title} sub={sel.version + " · " + sel.size + " · " + fmtDate(sel.date)}
              right={sel.supersededBy ? <Badge tone="neutral">Superseded</Badge> : <Badge tone="ok" dot>Current</Badge>}>
              <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.55 }}>{sel.note}</div>
              <div style={{ marginTop: 14 }}>
                <Label style={{ marginBottom: 9 }}>Intake checklist</Label>
                <Checklist items={[
                  { label: "Received and filed", done: true },
                  { label: "Linked to " + (sel.quoteId || enq?.id || "an enquiry"), done: !!(sel.quoteId || enq) },
                  { label: sel.supersededBy ? "Revision checked: superseded by the newer set" : "Revision checked: current set", done: true },
                  { label: "Category confirmed by a person", done: true },
                  { label: enq && enq.checklist.some(c => c.label === "Priced") ? "Priced" : "Handed to QS", done: handed }
                ]} />
              </div>
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <Chips refs={[{ kind: "document", id: sel.id }, ...(sel.quoteId ? [{ kind: "quote" as const, id: sel.quoteId }] : []), ...(enq ? [{ kind: "enquiry" as const, id: enq.id }] : [])]} />
                {sel.supersededBy && <RecordChip r={{ kind: "document", id: sel.supersededBy }} label="Open the current revision" />}
              </div>
              {enq && !handed && enq.stage === "Drawings Received" && (
                <div style={{ marginTop: 14 }}><Btn kind="primary" onClick={() => act.handToQS(enq.id)}>Hand to QS (Eoin McCarthy)</Btn></div>
              )}
            </Card>
          )}
          <Card title="Agent-assisted categorisation" sub="Proposed workflow. Pulse suggests, a person confirms." accent="accent">
            <Timeline items={[
              { at: "Step 1", actor: "Drawing arrives by email", text: "Attached to the customer's enquiry by sender and project name." },
              { at: "Step 2", actor: "Quotation Agent proposes", text: "A category (roof plan, elevation, section, schedule) and whether it replaces an earlier revision." },
              { at: "Step 3", actor: "A person confirms or corrects", text: "Nothing is filed as final until Colm or Aoife says yes.", tone: "warn" },
              { at: "Step 4", actor: "Filed and handed on", text: "Older revision marked superseded, QS notified with the current set." }
            ]} />
            <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.55, padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)" }}>
              Example: Rev B for Castleisland was proposed as "roof plan + elevation" and confirmed by Colm on 17 Nov. Pulse does not measure or price drawings. Takeoff stays with the QS.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const TYPE_ORDER: QSLine["type"][] = ["Labour", "Material", "Plant", "Subcontract", "Overheads"];

function Estimates({ s }: { s: DemoState }) {
  const est = s.estimates.find(e => e.id === "EST-202") || s.estimates[0];
  if (!est) return <div className="cc-page"><Empty title="No QS estimates" /></div>;
  const q = s.quotes.find(x => x.id === est.quoteId)!;
  const enq = s.enquiries.find(e => e.quoteId === q.id);
  const qsName = person(s, est.qsId)?.name || "QS";
  const total = estimateTotal(est);
  const drawings = q.drawingIds.map(id => s.documents.find(d => d.id === id)).filter((d): d is Doc => !!d && d.kind === "Drawing").sort((a, b) => a.date.localeCompare(b.date));
  const email = s.messages.find(m => m.id === "MSG-05");
  const draft = draftFor(s, { kind: "estimate", id: est.id });
  const measured = est.status !== "Awaiting measurements";
  const story = [
    { label: "Phone enquiry", date: enq ? fmtShortDate(enq.receivedAt) : "", done: true },
    ...drawings.map(d => ({ label: "Drawings " + d.version, date: fmtShortDate(d.date), done: true })),
    { label: "QS draft " + est.version, date: fmtShortDate(est.history[est.history.length - 1]?.at || TODAY), done: true },
    { label: "Site measurements", date: measured ? "Received" : "Needed", done: measured },
    { label: "Colm approval", date: est.status === "Approved" ? "Approved" : est.status === "With Colm" ? "Waiting" : "", done: est.status === "Approved" },
    { label: "Issued to customer", date: q.stage === "Sent" ? "Simulated" : "", done: q.stage === "Sent" }
  ];
  const current = story.findIndex(x => !x.done);
  return (
    <div className="cc-page">
      <PageHead title={"QS estimate · " + q.title} sub="Colm doesn't measure drawings at night any more. The QS works from the current revision and Pulse keeps the handoff visible."
        right={<><DemoNote /><Badge tone="info">Indicative, not a formal quote</Badge></>} />
      <Card pad>
        <div style={{ display: "flex", alignItems: "stretch", gap: 6, flexWrap: "wrap" }}>
          {story.map((st, i) => (
            <div key={st.label + i} style={{ flex: "1 1 130px", minWidth: 0, padding: "10px 12px", borderRadius: "var(--r-md,14px)",
              background: i === current ? "var(--accent-faint)" : st.done ? "var(--surface-2)" : "transparent",
              border: "1px solid " + (i === current ? "var(--accent-line)" : "var(--border)") }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Tick done={st.done} /><span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--faint)" }}>{String(i + 1).padStart(2, "0")}</span></div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 7 }}>{st.label}</div>
              <div style={{ fontSize: 11.5, color: i === current ? "var(--accent)" : "var(--dim)", marginTop: 2 }}>{st.date || "Pending"}</div>
            </div>
          ))}
        </div>
      </Card>
      <div className="cc-grid cc-split">
        <div className="cc-stack">
          <Card title={est.id + " · " + est.version} sub={"Prepared by " + qsName + " from " + drawings.map(d => d.version).join(" and ")}
            right={<StatusBadge status={est.status} />}>
            <KV cols={4} items={[
              ["Indicative value", eur(total)],
              ["Status", est.status],
              ["Quantity surveyor", qsName],
              ["Pipeline stage", q.stage]
            ]} />
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Muted>Based on</Muted>
              <Chips refs={[...est.basedOn.map(id => ({ kind: "document" as const, id })), { kind: "quote", id: q.id }, ...(enq ? [{ kind: "enquiry" as const, id: enq.id }] : [])]} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
              {q.stage === "With QS" && est.status === "Awaiting measurements" && (
                <Btn kind="primary" onClick={() => act.moveQuote(q.id, "Colm Review", "Site measurements received, hip and valley lengths confirmed.")}>
                  Measurements received: send to Colm review
                </Btn>
              )}
              {est.status === "With Colm" && <Btn kind="primary" onClick={() => act.approveEstimate(est.id)}>Approve estimate</Btn>}
              {est.status === "Approved" && q.stage !== "Sent" && <Btn kind="primary" onClick={() => act.issueQuote(q.id)}>Issue as formal quote (simulated)</Btn>}
              {q.stage === "Sent" && <Badge tone="ok" dot>Issued in the demo. Nothing was emailed.</Badge>}
              <Btn onClick={() => act.openRecord({ kind: "estimate", id: est.id })}>Open record</Btn>
            </div>
          </Card>
          <Card title="Measured takeoff" sub="Line totals and subtotals are calculated from quantity × rate." pad={false}>
            <div className="cc-scroll-x">
              <div style={{ minWidth: 640 }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2.4fr) 70px 60px 80px 100px", background: "var(--surface-faint)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                  {["Item", "Qty", "Unit", "Rate", "Line total"].map((h, i) => <Label key={h} style={{ padding: "9px 14px", textAlign: i ? "right" : "left" }}>{h}</Label>)}
                </div>
                {TYPE_ORDER.map(type => {
                  const lines = est.lines.filter(l => l.type === type);
                  if (!lines.length) return null;
                  const sub = lines.reduce((n, l) => n + l.qty * l.rate, 0);
                  return (
                    <div key={type}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px 5px" }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{type}</span>
                        <Muted style={{ fontSize: 11 }}>{Math.round((100 * sub) / total)}% of total</Muted>
                      </div>
                      {lines.map(l => (
                        <div key={l.item} className="cc-row" style={{ display: "grid", gridTemplateColumns: "minmax(0,2.4fr) 70px 60px 80px 100px", fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>
                          <span style={{ padding: "7px 14px 7px 24px", color: "var(--body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.item}</span>
                          <span style={{ padding: "7px 14px", textAlign: "right" }}>{l.qty}</span>
                          <span style={{ padding: "7px 14px", textAlign: "right", color: "var(--dim)" }}>{l.unit}</span>
                          <span style={{ padding: "7px 14px", textAlign: "right" }}>{eur(l.rate)}</span>
                          <span style={{ padding: "7px 14px", textAlign: "right" }}>{eur(l.qty * l.rate)}</span>
                        </div>
                      ))}
                      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 120px", fontSize: 12, borderBottom: "1px solid var(--border)" }}>
                        <span style={{ padding: "6px 14px 9px 24px", color: "var(--dim)" }}>{type} subtotal</span>
                        <span style={{ padding: "6px 14px 9px", textAlign: "right", fontWeight: 600 }}>{eur(sub)}</span>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 160px", background: "var(--accent-faint)" }}>
                  <span style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600 }}>Indicative total (ex VAT)</span>
                  <span style={{ padding: "12px 14px", textAlign: "right", fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{eur(total)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="cc-stack">
          <Card title="Caveats from the QS" accent="warn">
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 7 }}>
              {est.caveats.map(c => <li key={c} style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--body)" }}>{c}</li>)}
            </ul>
            <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 10 }}>{est.notes}</div>
          </Card>
          {email && (
            <Card title={email.subject} sub={email.from + " · " + email.fromRole + " · " + fmtWhen(email.at, TODAY)}
              right={<Btn size="sm" onClick={() => act.openRecord({ kind: "message", id: email.id })}>Open</Btn>}>
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--body)" }}>{email.body}</div>
              {draft && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <SectionTitle right={<Btn size="sm" kind="quiet" onClick={() => goTo("Communications", "drafts")}>All drafts</Btn>}>Drafted reply</SectionTitle>
                  <div style={{ marginTop: 9 }}><DraftPanel draft={draft} /></div>
                </div>
              )}
            </Card>
          )}
          <Card title="History">
            <Timeline items={est.history.slice().reverse().map(h => ({ at: fmtWhen(h.at, TODAY), actor: h.actor, text: h.text }))} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Quotes({ s }: { s: DemoState }) {
  const list = s.quotes.slice().sort((a, b) => Number(!ACTIVE_STAGES.includes(a.stage)) - Number(!ACTIVE_STAGES.includes(b.stage)) || b.value - a.value);
  const sel = list.find(q => q.id === s.ui.selected.quote) || list.find(q => q.id === "QUO-201")!;
  const c = customer(s, sel.customerId);
  const linesTotal = sel.lines.reduce((n, l) => n + l.amount, 0);
  const est = sel.estimateId ? s.estimates.find(e => e.id === sel.estimateId) : undefined;
  const f = followState(sel);
  return (
    <div className="cc-page">
      <PageHead title="Quotes" sub="Every quote already priced, with its lines, dates and the job it became."
        right={<><DemoNote /><Btn onClick={() => act.setTab("Quotations", "followups")}>Follow-ups</Btn></>} />
      <div className="cc-grid cc-split-narrow">
        <Card title="All quotes" sub={list.length + " on file · active first"} pad={false}>
          {list.map((q, i) => (
            <div key={q.id} onClick={() => act.select("quote", q.id)} className={"cc-row cc-click" + (q.id === sel.id ? " cc-sel" : "")}
              style={{ padding: "11px 16px", borderTop: i ? "1px solid var(--border)" : "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)" }}>{q.id}</span>
                <span style={{ flex: 1 }} />
                <StatusBadge status={q.stage} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{q.title}</div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                <Muted>{customer(s, q.customerId)?.name}</Muted>
                <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{eur(q.value)}{q.indicative ? " ind." : ""}</span>
              </div>
            </div>
          ))}
        </Card>
        <div className="cc-stack">
          <Card title={sel.id + " · " + sel.title} sub={c?.name + " · " + c?.contact + ", " + c?.contactRole}
            right={<><StatusBadge status={sel.stage} />{f && <Badge tone={f.tone}>{f.label}</Badge>}</>}>
            <KV cols={4} items={[
              ["Value", quoteValueLabel(sel)],
              ["Sent", sel.sentDate ? fmtDate(sel.sentDate) : "Not issued"],
              ["Follow-up due", sel.followUpDue ? fmtDate(sel.followUpDue) : "None set"],
              ["Age", sel.sentDate ? quoteAge(sel) + " days" : "Not sent"]
            ]} />
            <div style={{ marginTop: 14 }}>
              {sel.lines.length ? (
                <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)", overflow: "hidden" }}>
                  {sel.lines.map((l, i) => (
                    <div key={l.item} style={{ display: "flex", gap: 10, padding: "10px 14px", borderTop: i ? "1px solid var(--border)" : 0, fontSize: 13 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)", width: 20, paddingTop: 2 }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, color: "var(--body)" }}>{l.item}</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(l.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--accent-faint)", borderTop: "1px solid var(--border)", fontSize: 13.5, fontWeight: 600 }}>
                    <span style={{ flex: 1 }}>Total ex VAT</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(linesTotal)}</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "14px 16px", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-md,14px)", fontSize: 12.5, color: "var(--body)", lineHeight: 1.6 }}>
                  No formal quote lines yet. This is an indicative QS estimate of {eur(sel.value)}{est ? " (" + est.id + " " + est.version + ", " + est.lines.length + " takeoff lines)" : ""}.
                  {" "}It has not been issued to the customer.
                </div>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 12 }}>{sel.note}{sel.lostReason ? " Reason: " + sel.lostReason + "." : ""}</div>
            <div style={{ marginTop: 12 }}>
              <Chips refs={[
                { kind: "customer", id: sel.customerId },
                ...(sel.enquiryId ? [{ kind: "enquiry" as const, id: sel.enquiryId }] : []),
                ...sel.drawingIds.map(id => ({ kind: "document" as const, id })),
                ...(sel.estimateId ? [{ kind: "estimate" as const, id: sel.estimateId }] : []),
                ...(sel.jobId ? [{ kind: "job" as const, id: sel.jobId }] : [])
              ]} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              {sel.estimateId && <Btn kind="primary" onClick={() => act.setTab("Quotations", "estimates")}>Open QS estimate</Btn>}
              {f && <Btn kind="primary" onClick={() => act.setTab("Quotations", "followups")}>Go to follow-up</Btn>}
              {sel.jobId && <Btn onClick={() => act.openRecord({ kind: "job", id: sel.jobId! })}>Open {sel.jobId}</Btn>}
              <Btn onClick={() => act.openRecord({ kind: "quote", id: sel.id })}>Open full record</Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FollowUps({ s }: { s: DemoState }) {
  const aged = s.quotes.filter(q => ACTIVE_STAGES.includes(q.stage) && q.sentDate).sort((a, b) => quoteAge(b) - quoteAge(a));
  const drafts = aged.map(q => draftFor(s, { kind: "quote", id: q.id })).filter((d): d is Draft => !!d);
  const SUGGEST: Record<string, string> = {
    "QUO-201": "Send the drafted follow-up and offer to walk the site. Nine days of silence on a first job with a new developer is worth one personal nudge.",
    "QUO-203": "A short call to Ciarán Doyle. Four days is a nudge, not a chase, and they are a repeat customer."
  };
  return (
    <div className="cc-page">
      <PageHead title="Quote follow-ups" sub="Quotes already priced stay in view until someone answers. Agents draft the chase, Colm approves it."
        right={<><DemoNote /><Btn onClick={() => goTo("Communications", "drafts")}>All drafts</Btn></>} />
      <div className="cc-grid cc-c4">
        <Kpi label="Awaiting a response" value={String(aged.length)} hint="Sent, no answer yet" tone="warn" />
        <Kpi label="Value waiting" value={eur(aged.reduce((n, q) => n + q.value, 0))} hint={aged.map(q => q.id).join(", ")} delay={60} />
        <Kpi label="Oldest" value={aged[0] ? quoteAge(aged[0]) + " days" : "None"} hint={aged[0]?.title} tone="bad" delay={120} />
        <Kpi label="Drafts to approve" value={String(drafts.filter(d => d.status === "Awaiting approval").length)} hint="Prepared by the Quotation Agent" tone="accent" delay={180} />
      </div>
      {!aged.length && <Card><Empty title="No quotes waiting on a response" body="Everything sent has an answer." /></Card>}
      <div className="cc-grid cc-c2">
        {aged.map(q => {
          const f = followState(q);
          const d = draftFor(s, { kind: "quote", id: q.id });
          const c = customer(s, q.customerId);
          const sent = s.messages.find(m => m.linked.some(l => l.kind === "quote" && l.id === q.id) && m.from.includes("(sent)"));
          return (
            <Card key={q.id} title={q.id + " · " + q.title} sub={c?.name + " · " + c?.contact} right={f ? <Badge tone={f.tone}>{f.label}</Badge> : undefined}
              accent={f?.tone === "warn" || f?.tone === "bad" ? "warn" : undefined}>
              <KV cols={3} items={[
                ["Value", eur(q.value)],
                ["Sent", q.sentDate ? fmtShortDate(q.sentDate) : ""],
                ["No response", quoteAge(q) + " days"]
              ]} />
              <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--accent-faint)", border: "1px solid var(--accent-line)", borderRadius: "var(--r-sm,10px)" }}>
                <Label>Suggested action</Label>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--ink)", marginTop: 5 }}>{SUGGEST[q.id] || "Check in with the customer before the follow-up date."}</div>
              </div>
              <div style={{ marginTop: 14 }}>
                {d ? (
                  <DraftPanel draft={d} />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 12.5, color: "var(--body)" }}>No draft yet. Flagged for Colm.</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Btn kind="primary" onClick={() => act.openRecord({ kind: "quote", id: q.id })}>Open {q.id}</Btn>
                      {sent && <Btn onClick={() => act.openRecord({ kind: "message", id: sent.id })}>See the original email</Btn>}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function Quotations({ tab }: { tab: string }) {
  const s = useDemo();
  switch (tab) {
    case "enquiries": return <Enquiries s={s} />;
    case "drawings": return <Drawings s={s} />;
    case "estimates": return <Estimates s={s} />;
    case "quotes": return <Quotes s={s} />;
    case "followups": return <FollowUps s={s} />;
    default: return <Pipeline s={s} />;
  }
}

