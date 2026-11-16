/* Records → Explorer: every record type in one searchable list, with the
   relationship chain for the selected record. Ontology stays the first tab. */
import { useMemo, useState } from "react";
import { act, useDemo, type DemoState } from "../../demo/store";
import { customer, invStatus, job, quote, recordLabel, searchRecords, type SearchHit } from "../../demo/selectors";
import { eur } from "../../demo/format";
import type { RecordKind, RecordRef } from "../../demo/types";
import { Badge, Btn, Card, DemoNote, Label, PageHead, RecordChip, Seg } from "./ui";

const TYPES: [string, string][] = [["all", "All"], ["customer", "Customers"], ["job", "Jobs"], ["person", "People"], ["quote", "Quotes"], ["invoice", "Invoices"], ["document", "Documents"]];

function allOf(s: DemoState, kind: string): SearchHit[] {
  const list: SearchHit[] = [];
  if (kind === "all" || kind === "customer") s.customers.forEach(c => list.push({ ref: { kind: "customer", id: c.id }, title: c.name, meta: "Customer · " + c.source }));
  if (kind === "all" || kind === "job") s.jobs.forEach(j => list.push({ ref: { kind: "job", id: j.id }, title: j.id + " · " + j.title, meta: "Job · " + eur(j.contractValue) }));
  if (kind === "all" || kind === "person") s.people.forEach(p => list.push({ ref: { kind: "person", id: p.id }, title: p.name, meta: p.role }));
  if (kind === "all" || kind === "quote") s.quotes.forEach(q => list.push({ ref: { kind: "quote", id: q.id }, title: q.id + " · " + q.title, meta: "Quote · " + q.stage }));
  if (kind === "all" || kind === "invoice") s.invoices.forEach(i => list.push({ ref: { kind: "invoice", id: i.id }, title: i.id + " · " + eur(i.amount), meta: "Invoice · " + invStatus(i) }));
  if (kind === "all" || kind === "document") s.documents.forEach(d => list.push({ ref: { kind: "document", id: d.id }, title: d.title, meta: d.kind + " · " + d.version }));
  return list;
}

/** The chain the brief asks for: customer → enquiry → drawings → QS → quote → job → site → workforce → timesheets, job → invoice → payment. */
function chainFor(s: DemoState, r: RecordRef): { label: string; refs: RecordRef[] }[] {
  let customerId: string | undefined, quoteId: string | undefined, jobId: string | undefined;
  if (r.kind === "customer") customerId = r.id;
  if (r.kind === "quote") { quoteId = r.id; customerId = quote(s, r.id)?.customerId; jobId = quote(s, r.id)?.jobId; }
  if (r.kind === "job") { jobId = r.id; customerId = job(s, r.id)?.customerId; quoteId = job(s, r.id)?.quoteId; }
  if (r.kind === "invoice") { const i = s.invoices.find(x => x.id === r.id); jobId = i?.jobId; customerId = i?.customerId; quoteId = job(s, jobId)?.quoteId; }
  if (r.kind === "person") { const a = s.allocations.find(x => x.personId === r.id && x.date === "2026-11-18") || s.allocations.find(x => x.personId === r.id); const st = s.sites.find(x => x.id === a?.siteId); jobId = st?.jobId; customerId = job(s, jobId)?.customerId; quoteId = job(s, jobId)?.quoteId; }
  if (r.kind === "document") { const d = s.documents.find(x => x.id === r.id); jobId = d?.jobId; quoteId = d?.quoteId; customerId = d?.customerId; }
  if (!customerId && jobId) customerId = job(s, jobId)?.customerId;
  if (!quoteId && customerId) quoteId = s.quotes.find(q => q.customerId === customerId && q.stage !== "Lost")?.id;
  if (!jobId && quoteId) jobId = quote(s, quoteId)?.jobId;
  const q = quote(s, quoteId);
  const enq = s.enquiries.filter(e => e.quoteId === quoteId || (e.customerId === customerId && !e.quoteId));
  const st = s.sites.find(x => x.jobId === jobId);
  const crew = st ? s.allocations.filter(a => a.siteId === st.id && a.date === "2026-11-18") : [];
  const invs = s.invoices.filter(i => i.jobId === jobId);
  const L = <K extends RecordKind>(kind: K, ids: (string | undefined)[]) => ids.filter(Boolean).map(id => ({ kind, id: id! }));
  return [
    { label: "Customer", refs: L("customer", [customerId]) },
    { label: "Enquiry", refs: L("enquiry", enq.map(e => e.id)) },
    { label: "Drawings", refs: L("document", q ? q.drawingIds.filter(d => s.documents.find(x => x.id === d)?.kind !== "QS estimate") : []) },
    { label: "QS estimate", refs: L("estimate", q?.estimateId ? [q.estimateId] : []) },
    { label: "Quote", refs: L("quote", [quoteId]) },
    { label: "Job", refs: L("job", [jobId]) },
    { label: "Site", refs: L("site", [st?.id]) },
    { label: "Workforce today", refs: L("person", crew.map(a => a.personId)) },
    { label: "Timesheets", refs: L("exception", s.exceptions.filter(x => x.jobId === jobId).map(x => x.id)) },
    { label: "Invoices", refs: L("invoice", invs.map(i => i.id)) },
    { label: "Payments", refs: [] as RecordRef[] },
    { label: "Messages", refs: L("message", s.messages.filter(m => m.linked.some(l => (l.kind === "job" && l.id === jobId) || (l.kind === "quote" && l.id === quoteId))).map(m => m.id)) }
  ].map(x => x.label === "Payments" ? { label: x.label, refs: [] } : x);
}

export default function RecordsExplorer() {
  const s = useDemo();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [sel, setSel] = useState<RecordRef>({ kind: "job", id: "JOB-101" });
  const hits = useMemo(() => (q.trim() ? searchRecords(s, q, 80).filter(h => type === "all" || h.ref.kind === type) : allOf(s, type)), [s, q, type]);
  const chain = chainFor(s, sel);
  const payments = (() => { const invIds = chain.find(c => c.label === "Invoices")?.refs.map(r => r.id) || []; return s.payments.filter(p => invIds.includes(p.invoiceId)); })();
  return (
    <div className="cc-page">
      <PageHead title="Records explorer" sub="Customers, sites, people, quotes, invoices and documents. Search by name, job ID or customer, then follow the chain."
        right={<><DemoNote /><Btn onClick={() => act.openRecord(sel)}>Open record details</Btn></>} />
      <div className="cc-grid cc-split-r">
        <Card pad={false} title={hits.length + " records"} right={<Badge>{type === "all" ? "All types" : TYPES.find(t => t[0] === type)?.[1]}</Badge>}>
          <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="cc-input" placeholder="Try “Murphy”, “JOB-101”, “Killorglin”, “INV-301”" value={q} onChange={e => setQ(e.target.value)} />
            <Seg options={TYPES} value={type} onChange={setType} />
          </div>
          <div style={{ maxHeight: 620, overflowY: "auto", borderTop: "1px solid var(--border)" }}>
            {hits.map(h => {
              const on = h.ref.kind === sel.kind && h.ref.id === sel.id;
              return (
                <button key={h.ref.kind + h.ref.id} type="button" onClick={() => setSel(h.ref)} className={"cc-row cc-click" + (on ? " cc-sel" : "")} style={{ display: "block", width: "100%", textAlign: "left",
                  padding: "10px 16px", border: 0, borderBottom: "1px solid var(--border)", background: "none", color: "inherit", font: "inherit", cursor: "pointer" }}>
                  <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{h.meta}</div>
                </button>
              );
            })}
            {!hits.length && <div style={{ padding: 24, fontSize: 13, color: "var(--dim)", textAlign: "center" }}>No record matches. It searches names, IDs, customers and sites.</div>}
          </div>
        </Card>
        <Card title={recordLabel(s, sel)} sub="How this record connects to the rest of the business" right={<Btn size="sm" kind="primary" onClick={() => act.openRecord(sel)}>Open details</Btn>}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {chain.map((c, i) => (
              <div key={c.label} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 12, padding: "10px 0", borderTop: i ? "1px solid var(--border)" : 0, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: c.refs.length || (c.label === "Payments" && payments.length) ? "var(--accent)" : "var(--track)" }} />
                  <Label>{c.label}</Label>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {c.label === "Payments"
                    ? (payments.length ? payments.map(p => <Badge key={p.id} tone="ok">{eur(p.amount)} · {p.date.slice(8)} Nov</Badge>) : <span style={{ fontSize: 12, color: "var(--faint)" }}>None yet</span>)
                    : c.refs.length ? c.refs.slice(0, 8).map(r => <RecordChip key={r.kind + r.id} r={r} label={r.kind === "person" ? undefined : undefined} />) : <span style={{ fontSize: 12, color: "var(--faint)" }}>None linked</span>}
                  {c.refs.length > 8 && <Badge>+{c.refs.length - 8} more</Badge>}
                </div>
              </div>
            ))}
          </div>
          {sel.kind === "customer" && <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--dim)" }}>{customer(s, sel.id)?.note}</div>}
        </Card>
      </div>
    </div>
  );
}
