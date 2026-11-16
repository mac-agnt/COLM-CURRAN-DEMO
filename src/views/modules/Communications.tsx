/* Communications: one simulated inbox for email, site texts and manually logged call notes.
   Agents sort and draft; nothing is ever sent from the demo. */
import { useState, type ReactNode } from "react";
import { act, goTo, useDemo, type DemoState } from "../../demo/store";
import { agentName, customer, inboxSorted, invStatus, priorityInbox, quoteAge, TODAY } from "../../demo/selectors";
import { daysBetween, eur, fmtDate, fmtWhen } from "../../demo/format";
import type { Awaiting, Draft, Message, MsgCategory, RecordRef } from "../../demo/types";
import { Avatar, Badge, Btn, Card, Chips, DemoNote, Empty, KV, Kpi, Label, Lifecycle, Muted, PageHead, Seg, StatusBadge, Timeline, type Tone } from "./ui";

const SIM_NOTE = <DemoNote>Simulated inbox. No live mailbox or phone sync.</DemoNote>;

const CAT_TONE: Record<MsgCategory, Tone> = {
  Attendance: "bad", Timesheet: "warn", Payment: "warn", Quote: "accent", Drawings: "info", Site: "neutral", Supplier: "neutral", Enquiry: "accent", Admin: "neutral"
};

const STORY: Record<string, [string, string]> = {
  "MSG-01": ["A", "Morning roll call"],
  "MSG-02": ["B", "Two-hour conflict"],
  "MSG-03": ["C", "Payment to chase"],
  "MSG-04": ["D", "Quote at risk"],
  "MSG-05": ["E", "QS handoff"]
};

const channelLabel = (m: Message) => m.channel === "Call note" ? "Manually logged call note" : m.channel === "Text" ? "Site text" : "Email";

function ChannelIcon({ m }: { m: Message }) {
  const d = m.channel === "Email" ? "M4 6.5h16v11H4z M4 7l8 6 8-6"
    : m.channel === "Text" ? "M4 5.5h16v10H9l-5 4v-14Z"
    : "M7.5 4h3l1.5 4-2 1.5a10 10 0 0 0 4.5 4.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A15 15 0 0 1 6 5.6 1.5 1.5 0 0 1 7.5 4Z";
  return (
    <span title={channelLabel(m)} style={{ width: 28, height: 28, flex: "none", borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: m.priority ? "var(--accent-faint)" : "var(--surface-2)", border: "1px solid " + (m.priority ? "var(--accent-line)" : "var(--border)"), color: m.priority ? "var(--accent)" : "var(--dim)" }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
    </span>
  );
}

const draftForMessage = (s: DemoState, m: Message): Draft | undefined =>
  s.drafts.find(d => d.replyTo === m.id) || s.drafts.find(d => m.linked.some(l => l.kind === "draft" && l.id === d.id));

function openInInbox(id: string) {
  act.select("commsMsg", id);
  act.setTab("Communications", "inbox");
  act.markRead(id);
}

export default function Communications({ tab }: { tab: string }) {
  const s = useDemo();
  if (tab === "priority") return <Priority s={s} />;
  if (tab === "drafts") return <Drafts s={s} />;
  if (tab === "followups") return <Followups s={s} />;
  if (tab === "history") return <History s={s} />;
  return <Inbox s={s} />;
}

/* ── Unified inbox ── */
type Filter = "all" | "priority" | "unread" | MsgCategory;

function Inbox({ s }: { s: DemoState }) {
  const [filter, setFilter] = useState<Filter>("all");
  const all = inboxSorted(s);
  const list = all.filter(m => filter === "all" ? true : filter === "priority" ? m.priority : filter === "unread" ? !m.read : m.category === filter);
  const selId = s.ui.selected.commsMsg || priorityInbox(s)[0]?.id;
  const sel = s.messages.find(m => m.id === selId) || list[0];
  const cats = Array.from(new Set(all.map(m => m.category)));
  const pick = (m: Message) => { act.select("commsMsg", m.id); if (!m.read) act.markRead(m.id); };
  return (
    <div className="cc-page">
      <PageHead title="Unified inbox" sub="Email, site texts and logged call notes in one place, each linked to the job, quote or invoice it is about."
        right={<>{SIM_NOTE}<Btn onClick={() => act.setTab("Communications", "priority")}>Priority ({priorityInbox(s).length})</Btn></>} />
      <div className="cc-grid cc-c4">
        <Kpi small label="Threads" value={all.length} hint="Email, texts and call notes" active={filter === "all"} onClick={() => setFilter("all")} />
        <Kpi small label="Need Colm" value={all.filter(m => m.priority).length} tone="warn" hint="Ranked in Priority" active={filter === "priority"} onClick={() => setFilter("priority")} />
        <Kpi small label="Unread" value={all.filter(m => !m.read).length} hint="Opening marks as read" active={filter === "unread"} onClick={() => setFilter("unread")} />
        <Kpi small label="Drafts waiting" value={s.drafts.filter(d => d.status === "Awaiting approval").length} tone="accent" hint="Agent-proposed, not sent" onClick={() => act.setTab("Communications", "drafts")} />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Seg<Filter> options={[["all", "All"], ["priority", "Priority"], ["unread", "Unread"]]} value={filter === "all" || filter === "priority" || filter === "unread" ? filter : "all"} onChange={setFilter} />
        <select className="cc-input" style={{ width: 190 }} value={cats.includes(filter as MsgCategory) ? filter : ""} onChange={e => setFilter((e.target.value || "all") as Filter)}>
          <option value="">Any category</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <Muted>{list.length} of {all.length} threads</Muted>
      </div>
      <div className="cc-grid cc-split-even">
        <Card pad={false}>
          <div style={{ maxHeight: 760, overflowY: "auto" }}>
            {list.map((m, i) => (
              <div key={m.id} onClick={() => pick(m)} className={"cc-row cc-click" + (sel?.id === m.id ? " cc-sel" : "")}
                style={{ display: "flex", gap: 11, padding: "12px 16px", borderTop: i ? "1px solid var(--border)" : 0 }}>
                <ChannelIcon m={m} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {!m.read && <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--accent)", flex: "none" }} />}
                    <span style={{ fontSize: 13, fontWeight: m.read ? 500 : 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{m.from}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)", flex: "none" }}>{fmtWhen(m.at, TODAY)}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject}</div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.body}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap", alignItems: "center" }}>
                    {m.priority && <Badge tone="warn" dot>Priority {STORY[m.id] ? "· " + STORY[m.id][0] : ""}</Badge>}
                    <Badge tone={CAT_TONE[m.category]}>{m.category}</Badge>
                    {m.channel === "Call note" && <Badge tone="neutral">Logged call note</Badge>}
                    {m.linked.filter(l => l.kind !== "draft").slice(0, 2).map(l => <span key={l.kind + l.id} style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)" }}>{l.id}</span>)}
                  </div>
                </div>
              </div>
            ))}
            {!list.length && <Empty title="No threads match" body="Try another filter." />}
          </div>
        </Card>
        {sel ? <ReadingPane s={s} m={sel} /> : <Card><Empty title="Select a thread" /></Card>}
      </div>
    </div>
  );
}

function ReadingPane({ s, m }: { s: DemoState; m: Message }) {
  const d = draftForMessage(s, m);
  const cust = m.customerId ? customer(s, m.customerId) : undefined;
  return (
    <Card accent={m.priority ? "warn" : undefined}>
      <div className="cc-stack" style={{ gap: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Avatar name={m.from.replace(/\(.*\)/, "")} size={36} tone={m.priority ? "accent" : undefined} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.3px", lineHeight: 1.3 }}>{m.subject}</div>
            <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 4 }}>{m.from} · {m.fromRole}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <Badge tone="neutral">{channelLabel(m)}</Badge>
              <Badge tone={CAT_TONE[m.category]}>{m.category}</Badge>
              {m.awaiting && <Badge tone="info" dot>Waiting on {m.awaiting.toLowerCase()}</Badge>}
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--faint)", alignSelf: "center" }}>{fmtDate(m.at)} · {m.at.slice(11, 16)}</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--body)", padding: "14px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)", whiteSpace: "pre-wrap" }}>
          {m.body}
          {m.channel === "Call note" && <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--faint)" }}>Manually logged call note. Pulse does not record or transcribe calls in this demo.</div>}
        </div>
        <div style={{ padding: "11px 13px", borderRadius: "var(--r-sm,10px)", background: m.priority ? "var(--warn-soft)" : "var(--surface-faint)", border: "1px solid var(--border)" }}>
          <Label>{m.priority ? "Why it needs Colm" : "How it was handled"}</Label>
          <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 5, lineHeight: 1.55 }}>{m.why}</div>
          <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 5 }}>Sorted by the Communications Agent{m.priority ? " · rank " + m.rank + " of " + priorityInbox(s).length : ""}</div>
        </div>
        <div>
          <Label style={{ marginBottom: 8 }}>Linked records</Label>
          <Chips refs={m.linked.filter(l => l.kind !== "draft").concat(cust && !m.linked.some(l => l.kind === "customer") ? [{ kind: "customer", id: cust.id }] : [])} />
        </div>
        {d ? <DraftCard s={s} d={d} compact /> : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <NextAction s={s} m={m} />
            {cust && <Btn onClick={() => { act.select("commsCustomer", cust.id); act.setTab("Communications", "history"); }}>Customer history</Btn>}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Draft card, shared by the inbox, priority and drafts views ── */
function DraftCard({ s, d, compact }: { s: DemoState; d: Draft; compact?: boolean }) {
  const editable = d.status === "Awaiting approval";
  return (
    <div style={{ border: "1px solid " + (d.status === "Awaiting approval" ? "var(--accent-line)" : "var(--border)"), borderRadius: "var(--r-md,14px)",
      background: d.status === "Awaiting approval" ? "var(--accent-faint)" : "var(--surface-2)", padding: 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <Label>{d.kind} · {d.id}</Label>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 5 }}>{d.subject}</div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>To {d.to}</div>
        </div>
        <StatusBadge status={d.status} />
      </div>
      <div style={{ marginTop: 10 }}><Lifecycle status={d.status} /></div>
      <textarea className="cc-input" readOnly={!editable} value={d.body} rows={compact ? 6 : 8} onChange={e => act.editDraft(d.id, e.target.value)}
        style={{ marginTop: 10, fontSize: 13, background: editable ? "var(--surface)" : "var(--surface-faint)", color: editable ? "var(--ink)" : "var(--body)" }} />
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", fontSize: 11.5, color: "var(--dim)" }}>
        <span>Proposed by {agentName(s, d.agentId)} at {d.createdAt.slice(11, 16)}{d.edited ? " · edited by Colm" : ""}</span>
        {d.approvedBy && <span>· Approved by {d.approvedBy} at {(d.approvedAt || "").slice(11, 16)}</span>}
      </div>
      {!compact && <div style={{ marginTop: 10 }}><Chips refs={d.linked} /></div>}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        {d.status === "Awaiting approval" && <>
          <Btn kind="primary" onClick={() => act.approveDraft(d.id)}>Approve</Btn>
          <Btn onClick={() => act.rejectDraft(d.id)}>Reject</Btn>
          <Muted>Approving marks it ready to send. Nothing is sent.</Muted>
        </>}
        {d.status === "Approved" && <>
          <Btn kind="primary" onClick={() => act.simulateSend(d.id)}>Mark as sent (simulated)</Btn>
          <Muted>Approved by a person. Still not sent.</Muted>
        </>}
        {d.status === "Simulated complete" && <Muted>Marked as sent in the demo. No email or text left Pulse.</Muted>}
        {d.status === "Rejected" && <Muted>Rejected. The agent will not raise it again today.</Muted>}
      </div>
    </div>
  );
}

/* One-click next step for a thread, per story thread. */
function NextAction({ s, m }: { s: DemoState; m: Message }): ReactNode {
  if (m.id === "MSG-01") {
    const d = s.drafts.find(x => x.kind === "Attendance confirmation" && x.linked.some(l => l.id === "P01"));
    const resolved = s.issues.find(i => i.id === "ISS-1")?.status === "Resolved";
    if (resolved) return <><Badge tone="ok" dot>John Murphy confirmed</Badge><Btn size="sm" onClick={() => goTo("Workforce", "live")}>Open attendance</Btn></>;
    return d
      ? <><StatusBadge status={d.status} label={"Confirmation " + d.status.toLowerCase()} /><Btn size="sm" onClick={() => act.setTab("Communications", "drafts")}>Open draft</Btn></>
      : <><Btn kind="primary" size="sm" onClick={() => act.requestConfirmation("P01")}>Request confirmation</Btn><Btn size="sm" onClick={() => { act.setSiteFilter("SITE-CAP"); goTo("Workforce", "live"); }}>Open attendance</Btn></>;
  }
  if (m.id === "MSG-02") {
    const x = s.exceptions.find(e => e.id === "EXC-401");
    return x?.status === "Resolved"
      ? <><Badge tone="ok" dot>EXC-401 resolved · {x.resolution?.reviewer}</Badge><Btn size="sm" onClick={() => { act.select("tsExc", "EXC-401"); goTo("Timesheets", "reconciliation"); }}>View case</Btn></>
      : <Btn kind="primary" size="sm" onClick={() => { act.select("tsExc", "EXC-401"); goTo("Timesheets", "reconciliation"); }}>Open EXC-401</Btn>;
  }
  const d = draftForMessage(s, m);
  if (d) {
    const label = m.id === "MSG-03" ? "Approve INV-301 reminder" : m.id === "MSG-04" ? "Approve QUO-201 follow-up" : m.id === "MSG-05" ? "Approve reply to Eoin" : "Approve draft";
    return d.status === "Awaiting approval"
      ? <><Btn kind="primary" size="sm" onClick={() => act.approveDraft(d.id)}>{label}</Btn><Btn size="sm" onClick={() => openInInbox(m.id)}>Read draft</Btn></>
      : <><StatusBadge status={d.status} />{d.status === "Approved" && <Btn size="sm" onClick={() => act.simulateSend(d.id)}>Mark as sent (simulated)</Btn>}</>;
  }
  const first = m.linked.find(l => l.kind !== "draft");
  return first ? <Btn size="sm" onClick={() => act.openRecord(first)}>Open {first.id}</Btn> : <Btn size="sm" onClick={() => openInInbox(m.id)}>Open thread</Btn>;
}

/* ── Priority ── */
function Priority({ s }: { s: DemoState }) {
  const items = priorityInbox(s);
  return (
    <div className="cc-page">
      <PageHead title="Priority" sub={items.length + " threads need Colm personally, ranked. The other " + (s.messages.length - items.length) + " are handled, waiting on someone else, or for information."}
        right={<>{SIM_NOTE}<Btn onClick={() => act.setTab("Communications", "drafts")}>Draft replies</Btn></>} />
      <div className="cc-stack">
        {items.map((m, i) => {
          const story = STORY[m.id];
          return (
            <Card key={m.id} accent={i === 0 ? "warn" : undefined} style={{ animation: "springIn .45s var(--ease) " + i * 60 + "ms both" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                <span style={{ width: 34, height: 34, flex: "none", borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: i === 0 ? "var(--accent-fill,var(--accent))" : "var(--surface-2)", color: i === 0 ? "var(--on-accent)" : "var(--ink)", fontWeight: 700, fontSize: 14, border: "1px solid var(--border)" }}>{i + 1}</span>
                <div style={{ flex: "1 1 360px", minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {story && <Badge tone="accent">{story[0]} · {story[1]}</Badge>}
                    <Badge tone={CAT_TONE[m.category]}>{m.category}</Badge>
                    <span style={{ fontSize: 12, color: "var(--dim)" }}>{channelLabel(m)} · {m.from} · {fmtWhen(m.at, TODAY)}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 7, letterSpacing: "-.2px" }}>{m.subject}</div>
                  <div style={{ fontSize: 13, color: "var(--body)", marginTop: 5, lineHeight: 1.55 }}>{m.why}</div>
                  <div style={{ marginTop: 10 }}><Chips refs={m.linked.filter(l => l.kind !== "draft")} /></div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", flex: "0 1 auto" }}>
                  <NextAction s={s} m={m} />
                  <Btn size="sm" kind="quiet" onClick={() => openInInbox(m.id)}>Open thread</Btn>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ── Drafts ── */
function Drafts({ s }: { s: DemoState }) {
  const order = ["Awaiting approval", "Approved", "Simulated complete", "Drafted", "Detected", "Rejected"];
  const list = s.drafts.slice().sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || b.createdAt.localeCompare(a.createdAt));
  const count = (st: string) => s.drafts.filter(d => d.status === st).length;
  return (
    <div className="cc-page">
      <PageHead title="Draft replies" sub="Agents propose; a person approves. Every draft moves Detected, Drafted, Awaiting approval, Approved, Simulated complete."
        right={SIM_NOTE} />
      <div style={{ padding: "13px 16px", borderRadius: "var(--card-r,18px)", border: "1px solid var(--accent-line)", background: "var(--accent-faint)", fontSize: 13, lineHeight: 1.55 }}>
        <strong>Approving never sends an email or text.</strong> It marks the draft Approved, ready to send. "Mark as sent" only changes its status inside the demo.
      </div>
      <div className="cc-grid cc-c4">
        <Kpi small label="Awaiting approval" value={count("Awaiting approval")} tone="warn" hint="Agent-proposed" />
        <Kpi small label="Approved" value={count("Approved")} tone="accent" hint="Staff-approved, not sent" />
        <Kpi small label="Simulated complete" value={count("Simulated complete")} tone="ok" hint="Marked sent in the demo" />
        <Kpi small label="Rejected" value={count("Rejected")} hint="Not raised again today" />
      </div>
      <div className="cc-grid cc-c2">
        {list.map(d => (
          <Card key={d.id} title={d.kind} sub={d.status === "Awaiting approval" ? "Agent-proposed by " + agentName(s, d.agentId) : d.approvedBy ? "Staff-approved by " + d.approvedBy : "Proposed by " + agentName(s, d.agentId)}>
            <DraftCard s={s} d={d} />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Follow-ups ── */
const GROUPS: [Exclude<Awaiting, null>, string, string][] = [
  ["Customer", "Waiting on customer", "Quotes and questions with the customer"],
  ["Supervisor", "Waiting on a site lead", "Things a foreman or supervisor needs to confirm"],
  ["QS", "Waiting on the QS", "Drawings and estimates with Eoin McCarthy"],
  ["Payment", "Waiting on payment", "Invoices the customer owes"]
];

function age(iso: string) {
  const d = daysBetween(iso.slice(0, 10), TODAY);
  return d <= 0 ? "Today " + iso.slice(11, 16) : d === 1 ? "1 day" : d + " days";
}

function Followups({ s }: { s: DemoState }) {
  const waiting = s.messages.filter(m => m.awaiting);
  return (
    <div className="cc-page">
      <PageHead title="Follow-ups" sub="Every open thread grouped by who it is waiting on, oldest first, so nothing goes quiet without someone noticing."
        right={SIM_NOTE} />
      <div className="cc-grid cc-c4">
        {GROUPS.map(([key, title, sub]) => {
          const items = waiting.filter(m => m.awaiting === key).sort((a, b) => a.at.localeCompare(b.at));
          return (
            <Card key={key} title={title} sub={sub} right={<Badge tone={items.length ? "warn" : "ok"}>{items.length}</Badge>}>
              <div className="cc-stack" style={{ gap: 8 }}>
                {items.map(m => {
                  const q = m.linked.find(l => l.kind === "quote");
                  const quote = q ? s.quotes.find(x => x.id === q.id) : undefined;
                  const inv = m.linked.find(l => l.kind === "invoice");
                  const invoice = inv ? s.invoices.find(x => x.id === inv.id) : undefined;
                  return (
                    <div key={m.id} onClick={() => openInInbox(m.id)} className="cc-row cc-click"
                      style={{ padding: "10px 11px", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)", background: "var(--surface-2)" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <Badge tone={daysBetween(m.at.slice(0, 10), TODAY) >= 7 ? "bad" : daysBetween(m.at.slice(0, 10), TODAY) >= 2 ? "warn" : "neutral"}>{age(m.at)}</Badge>
                        <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{m.from.replace(" (sent)", "")}</span>
                      </div>
                      {quote && quote.sentDate && <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 5 }}>{quote.id} · {eur(quote.value)} · sent {quoteAge(quote)} days ago</div>}
                      {invoice && <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 5 }}>{invoice.id} · {eur(invoice.amount)} · {invStatus(invoice)}</div>}
                    </div>
                  );
                })}
                {!items.length && <Empty title="Nothing waiting" />}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ── Customer history ── */
interface HistItem { at: string; actor: string; text: string; tone?: Tone; related: RecordRef[] }

function History({ s }: { s: DemoState }) {
  const selId = s.ui.selected.commsCustomer || "CUS-CHD";
  const c = customer(s, selId) || s.customers[0];
  const items: HistItem[] = [];
  s.messages.filter(m => m.customerId === c.id).forEach(m => items.push({ at: m.at, actor: m.channel === "Call note" ? "Call note (logged)" : m.from,
    text: m.subject + ". " + m.body, tone: m.priority ? "warn" : undefined, related: [{ kind: "message", id: m.id }, ...m.linked.filter(l => l.kind !== "draft" && l.kind !== "message").slice(0, 2)] }));
  s.enquiries.filter(e => e.customerId === c.id).forEach(e => items.push({ at: e.receivedAt, actor: "Enquiry " + e.id, text: e.title + " · " + e.channel.toLowerCase() + " · " + e.callNote, tone: "accent", related: [{ kind: "enquiry", id: e.id }] }));
  s.quotes.filter(q => q.customerId === c.id && q.sentDate).forEach(q => items.push({ at: q.sentDate + "T09:00", actor: "Quote " + q.id, text: q.title + " · " + eur(q.value) + " · " + q.stage, tone: q.stage === "Won" ? "ok" : undefined, related: [{ kind: "quote", id: q.id }] }));
  s.invoices.filter(i => i.customerId === c.id).forEach(i => {
    items.push({ at: i.issued + "T09:00", actor: "Invoice " + i.id, text: i.ref + " · " + eur(i.amount) + " · due " + fmtDate(i.due), related: [{ kind: "invoice", id: i.id }] });
    if (i.paidDate) items.push({ at: i.paidDate + "T12:00", actor: "Payment", text: i.id + " paid " + eur(i.amount), tone: "ok", related: [{ kind: "invoice", id: i.id }] });
  });
  s.jobs.filter(j => j.customerId === c.id).forEach(j => items.push({ at: j.start + "T07:00", actor: "Job " + j.id, text: j.title + " started · " + eur(j.contractValue) + " contract", tone: "accent", related: [{ kind: "job", id: j.id }] }));
  s.documents.filter(d => d.customerId === c.id).forEach(d => items.push({ at: d.date + "T08:00", actor: d.kind, text: d.title + " (" + d.version + ") · " + d.by, related: [{ kind: "document", id: d.id }] }));
  items.sort((a, b) => b.at.localeCompare(a.at));
  const jobs = s.jobs.filter(j => j.customerId === c.id);
  const invs = s.invoices.filter(i => i.customerId === c.id);
  const unpaid = invs.filter(i => invStatus(i) !== "Paid").reduce((n, i) => n + i.amount, 0);
  const quotes = s.quotes.filter(q => q.customerId === c.id);
  return (
    <div className="cc-page">
      <PageHead title="Customer history" sub="Every email, logged call, drawing, quote, invoice and job for one relationship, in one timeline."
        right={SIM_NOTE} />
      <div className="cc-grid cc-split-narrow">
        <Card title="Customers" pad={false}>
          {s.customers.map((x, i) => {
            const n = s.messages.filter(m => m.customerId === x.id).length;
            return (
              <div key={x.id} onClick={() => act.select("commsCustomer", x.id)} className={"cc-row cc-click" + (x.id === c.id ? " cc-sel" : "")}
                style={{ display: "flex", gap: 10, alignItems: "center", padding: "11px 16px", borderTop: i ? "1px solid var(--border)" : 0 }}>
                <Avatar name={x.name} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)" }}>{x.contact} · {x.source}</div>
                </div>
                <Badge tone="neutral">{n}</Badge>
              </div>
            );
          })}
        </Card>
        <div className="cc-stack">
          <Card title={c.name} sub={c.type + " · Co. " + c.county + " · " + c.source} right={<Btn size="sm" onClick={() => act.openRecord({ kind: "customer", id: c.id })}>Open record</Btn>}>
            <KV cols={3} items={[["Contact", c.contact + ", " + c.contactRole], ["Email", c.email], ["Phone", "On file (hidden in demo)"],
              ["Jobs", jobs.length ? jobs.map(j => j.id).join(", ") + " · " + eur(jobs.reduce((n, j) => n + j.contractValue, 0)) : "None yet"],
              ["Quotes", quotes.length ? quotes.length + " · " + quotes.map(q => q.stage).join(", ") : "None"],
              ["Unpaid", unpaid ? eur(unpaid) : "Nothing owed"]]} />
            <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 12, lineHeight: 1.55 }}>{c.note}</div>
          </Card>
          <Card title="Relationship timeline" sub={items.length + " events, newest first"}>
            {items.length ? <Timeline items={items.map(it => ({ at: fmtDate(it.at) + " " + it.at.slice(11, 16), actor: it.actor, text: it.text, tone: it.tone, related: it.related }))} />
              : <Empty title="No history yet" />}
          </Card>
        </div>
      </div>
    </div>
  );
}
