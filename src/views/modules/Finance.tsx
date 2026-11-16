/* Finance: an intelligence and follow-up layer over the QuickBooks export (simulated).
   QuickBooks stays the system of record; nothing here posts back to it. */
import { useState } from "react";
import { act, goTo, useDemo, type DemoState } from "../../demo/store";
import { TODAY, cashForecast, customer, daysOverdue, daysToDue, draftFor, invStatus, job, jobCosts, totals } from "../../demo/selectors";
import { eur, fmtDate, fmtShortDate, fmtWhen } from "../../demo/format";
import type { Invoice } from "../../demo/types";
import { Badge, Bars, Btn, Card, Chips, Columns, DemoNote, Empty, KV, Kpi, Label, Muted, PageHead, Progress, StatusBadge, Table, type Col } from "./ui";
import { DraftPanel } from "./Quotations";

const QB_NOTE = "QuickBooks stays the system of record. Pulse reads a simulated export and coordinates follow-up.";

function QbStrip({ s }: { s: DemoState }) {
  const imp = s.audit.find(a => /QuickBooks/i.test(a.actor));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 14px", background: "var(--surface-faint)",
      border: "1px dashed var(--border-strong)", borderRadius: "var(--card-r,18px)", fontSize: 12.5, color: "var(--body)" }}>
      <span style={{ width: 7, height: 7, borderRadius: 2, background: "var(--accent)", flex: "none" }} />
      <span style={{ flex: "1 1 280px" }}>{QB_NOTE}</span>
      {imp && <Muted>Last export (simulated): {fmtWhen(imp.at, TODAY)} · {imp.action.toLowerCase()}</Muted>}
    </div>
  );
}

function Overview({ s }: { s: DemoState }) {
  const t = totals(s);
  const due14 = s.invoices.filter(i => invStatus(i) === "Unpaid" && daysToDue(i) <= 14);
  const due14Sum = due14.reduce((n, i) => n + i.amount, 0);
  const costs = jobCosts(s);
  const notOverdueUnpaid = t.unpaid - t.overdue;
  const reminder = draftFor(s, { kind: "invoice", id: "INV-301" });
  return (
    <div className="cc-page">
      <PageHead title="Finance overview" sub={QB_NOTE}
        right={<><DemoNote /><Btn onClick={() => act.setTab("Finance", "invoices")}>Invoice register</Btn><Btn kind="primary" onClick={() => act.setTab("Finance", "debtors")}>Debtors</Btn></>} />
      <div className="cc-grid cc-c5">
        <Kpi label="Unpaid" value={eur(t.unpaid)} hint={t.unpaidInv.length + " invoices open"} onClick={() => act.setTab("Finance", "invoices")} />
        <Kpi label="Overdue" value={eur(t.overdue)} hint={t.overdueInv.map(i => i.id + " · " + daysOverdue(i) + " days").join(", ") || "Nothing overdue"} tone="bad" delay={60}
          onClick={() => act.setTab("Finance", "debtors")} />
        <Kpi label="Paid" value={eur(t.paid)} hint="In this 3-invoice example" tone="ok" delay={120} />
        <Kpi label="Invoiced" value={eur(t.invoiced)} hint="Payment applications to date (example)" delay={180} />
        <Kpi label="Due next 14 days" value={eur(due14Sum)} hint={due14.map(i => i.id + " due " + fmtShortDate(i.due)).join(", ") || "Nothing falls due"} tone="accent" delay={240}
          onClick={() => act.setTab("Finance", "forecast")} />
      </div>
      <QbStrip s={s} />
      <div className="cc-grid cc-c3">
        <Card title="Paid and unpaid" sub="From the invoice rows below, not a headline figure.">
          <Bars data={[
            { label: "Paid", value: t.paid, text: eur(t.paid), tone: "ok" },
            { label: "Unpaid, not yet due", value: notOverdueUnpaid, text: eur(notOverdueUnpaid), tone: "neutral" },
            { label: "Overdue", value: t.overdue, text: eur(t.overdue), tone: "bad" }
          ]} />
          <div style={{ marginTop: 14 }}><Chips refs={s.invoices.map(i => ({ kind: "invoice" as const, id: i.id }))} /></div>
        </Card>
        <Card title="Jobs by gross margin" sub="Budget margin on contract value. Estimates, illustrative.">
          <Bars data={costs.slice().sort((a, b) => b.marginPct - a.marginPct).map(c => ({
            label: c.job.id + " · " + c.site.name, value: c.marginPct, text: c.marginPct + "% · " + eur(c.margin), tone: "accent" as const
          }))} max={40} />
          <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 12 }}>Contract value {eur(t.contractValue)} across {s.jobs.length} active jobs. This is contracted work, not revenue earned.</div>
        </Card>
        <Card title="Needs a decision" sub="Money items waiting on Colm.">
          {t.overdueInv.map(i => {
            const d = draftFor(s, { kind: "invoice", id: i.id });
            return (
              <div key={i.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{i.id} · {eur(i.amount)}</span>
                  <Badge tone="bad">{daysOverdue(i)} days overdue</Badge>
                </div>
                <Muted>{customer(s, i.customerId)?.name} · {i.ref}</Muted>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {d && <StatusBadge status={d.status} />}
                  {d && d.status === "Awaiting approval" && <Btn size="sm" kind="primary" onClick={() => act.approveDraft(d.id)}>Approve reminder</Btn>}
                  <Btn size="sm" onClick={() => act.setTab("Finance", "debtors")}>Open debtors</Btn>
                </div>
              </div>
            );
          })}
          {!t.overdueInv.length && <Empty title="Nothing overdue" />}
          <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 10 }}>
            {reminder?.status === "Simulated complete" ? "Reminder marked sent in the demo. Nothing was emailed." : "Approving marks a reminder ready to send. Nothing is emailed from this demo."}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Invoices({ s }: { s: DemoState }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const rows = s.invoices.filter(i => !term || [i.id, i.ref, i.jobId, customer(s, i.customerId)?.name || "", job(s, i.jobId)?.title || "", invStatus(i)].join(" ").toLowerCase().includes(term));
  const cols: Col<Invoice>[] = [
    { key: "id", label: "Invoice", w: "90px", mono: true, render: i => i.id },
    { key: "c", label: "Customer", w: "1.4fr", render: i => customer(s, i.customerId)?.name },
    { key: "j", label: "Job", w: "1.3fr", render: i => <span style={{ color: "var(--dim)" }}>{i.jobId} · {job(s, i.jobId)?.title}</span> },
    { key: "r", label: "Reference", w: "1.2fr", render: i => i.ref },
    { key: "is", label: "Issued", w: "95px", render: i => fmtShortDate(i.issued) },
    { key: "d", label: "Due", w: "95px", render: i => fmtShortDate(i.due) },
    { key: "a", label: "Amount", w: "100px", align: "right", render: i => eur(i.amount) },
    { key: "s", label: "Status", w: "170px", render: i => {
      const st = invStatus(i);
      return <StatusBadge status={st} label={st === "Overdue" ? "Overdue · " + daysOverdue(i) + " days" : st === "Paid" ? "Paid " + fmtShortDate(i.paidDate!) : "Due in " + daysToDue(i) + " days"} />;
    } }
  ];
  const sum = (f: (i: Invoice) => boolean) => rows.filter(f).reduce((n, i) => n + i.amount, 0);
  return (
    <div className="cc-page">
      <PageHead title="Invoice register" sub="Mirrors the QuickBooks invoices (simulated export). Search by invoice, customer, job or status."
        right={<><DemoNote /><Btn onClick={() => act.setTab("Finance", "debtors")}>Debtors</Btn></>} />
      <QbStrip s={s} />
      <Card title="Invoices" sub={rows.length + " of " + s.invoices.length + " shown"} pad={false}
        right={<input className="cc-input" style={{ width: 240 }} placeholder="Search INV-301, Cappamore, overdue…" value={q} onChange={e => setQ(e.target.value)} />}>
        <Table cols={cols} rows={rows} rowKey={i => i.id} onRow={i => act.openRecord({ kind: "invoice", id: i.id })} minWidth={980}
          empty={"No invoice matches “" + q + "”."} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--surface-faint)", fontSize: 12.5 }}>
          <span><Muted>Total </Muted><strong>{eur(sum(() => true))}</strong></span>
          <span><Muted>Unpaid </Muted><strong>{eur(sum(i => invStatus(i) !== "Paid"))}</strong></span>
          <span><Muted>Overdue </Muted><strong style={{ color: "var(--bad)" }}>{eur(sum(i => invStatus(i) === "Overdue"))}</strong></span>
          <span><Muted>Paid </Muted><strong>{eur(sum(i => invStatus(i) === "Paid"))}</strong></span>
        </div>
      </Card>
      <div className="cc-grid cc-c3">
        {s.payments.map(p => (
          <Card key={p.id} title={"Payment " + p.id} sub={p.method}>
            <KV cols={2} items={[["Amount", eur(p.amount)], ["Received", fmtDate(p.date)]]} />
            <div style={{ marginTop: 10 }}><Chips refs={[{ kind: "invoice", id: p.invoiceId }]} /></div>
          </Card>
        ))}
        <Card title="How this stays honest" sub="Read, match, remind.">
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}>
            <li>Aoife keeps invoicing and wages in QuickBooks, as today.</li>
            <li>Pulse reads the nightly export and links each invoice to its job and customer.</li>
            <li>Remittances are matched for review. Pulse never posts to QuickBooks.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

const BUCKETS: { label: string; test: (d: number, i: Invoice) => boolean }[] = [
  { label: "Current", test: (d) => d === 0 },
  { label: "1-30 days", test: (d) => d >= 1 && d <= 30 },
  { label: "31-60 days", test: (d) => d >= 31 && d <= 60 },
  { label: "60+ days", test: (d) => d > 60 }
];

function Debtors({ s }: { s: DemoState }) {
  const open = s.invoices.filter(i => invStatus(i) !== "Paid");
  const buckets = BUCKETS.map(b => {
    const list = open.filter(i => b.test(daysOverdue(i), i));
    return { ...b, list, sum: list.reduce((n, i) => n + i.amount, 0) };
  });
  const overdue = open.filter(i => invStatus(i) === "Overdue").sort((a, b) => daysOverdue(b) - daysOverdue(a));
  const cols: Col<Invoice>[] = [
    { key: "c", label: "Customer", w: "1.5fr", render: i => customer(s, i.customerId)?.name },
    { key: "i", label: "Invoice", w: "90px", mono: true, render: i => i.id },
    { key: "a", label: "Amount", w: "100px", align: "right", render: i => eur(i.amount) },
    { key: "d", label: "Due", w: "100px", render: i => fmtShortDate(i.due) },
    { key: "o", label: "Age", w: "130px", render: i => invStatus(i) === "Overdue" ? <Badge tone="bad">{daysOverdue(i)} days overdue</Badge> : <Badge tone="neutral">Due in {daysToDue(i)} days</Badge> },
    { key: "l", label: "Last contact", w: "1.3fr", render: i => {
      const m = s.messages.filter(x => x.linked.some(l => l.kind === "invoice" && l.id === i.id)).sort((a, b) => b.at.localeCompare(a.at))[0];
      return <span style={{ color: "var(--dim)" }}>{m ? m.from + ", " + fmtWhen(m.at, TODAY) : "None logged"}</span>;
    } },
    { key: "r", label: "Reminder", w: "170px", render: i => { const d = draftFor(s, { kind: "invoice", id: i.id }); return d ? <StatusBadge status={d.status} /> : <Muted>Not needed yet</Muted>; } }
  ];
  return (
    <div className="cc-page">
      <PageHead title="Debtors" sub="Who owes what, how old it is, and the chase already drafted. Approving a reminder never sends it from this demo."
        right={<><DemoNote /><Btn onClick={() => goTo("Communications", "drafts")}>All drafts</Btn></>} />
      <div className="cc-grid cc-c4">
        {buckets.map((b, i) => (
          <Kpi key={b.label} label={b.label} value={eur(b.sum)} hint={b.list.map(x => x.id).join(", ") || "Nothing in this band"}
            tone={i === 0 ? undefined : b.sum ? "bad" : "ok"} delay={i * 60} />
        ))}
      </div>
      <div className="cc-grid cc-split">
        <div className="cc-stack">
          <Card title="Aged receivables" sub={open.length + " open invoices · " + eur(open.reduce((n, i) => n + i.amount, 0)) + " unpaid"} pad={false}>
            <Table cols={cols} rows={open.slice().sort((a, b) => daysOverdue(b) - daysOverdue(a))} rowKey={i => i.id}
              onRow={i => act.openRecord({ kind: "invoice", id: i.id })} minWidth={880} empty="Nothing owed." />
          </Card>
          <Card title="Ageing by band">
            <Bars data={buckets.map((b, i) => ({ label: b.label, value: b.sum, text: eur(b.sum), tone: i === 0 ? "neutral" as const : "bad" as const }))} />
          </Card>
        </div>
        <div className="cc-stack">
          {overdue.map(i => {
            const c = customer(s, i.customerId);
            const d = draftFor(s, { kind: "invoice", id: i.id });
            const msgs = s.messages.filter(m => m.linked.some(l => l.kind === "invoice" && l.id === i.id) && m.priority);
            return (
              <Card key={i.id} title={i.id + " · " + eur(i.amount)} sub={c?.name + " · " + i.ref} right={<Badge tone="bad">{daysOverdue(i)} days overdue</Badge>} accent="bad">
                <KV cols={2} items={[
                  ["Contact", c ? c.contact + ", " + c.contactRole : ""],
                  ["Email", c?.email || ""],
                  ["Job", i.jobId + " · " + job(s, i.jobId)?.title],
                  ["Due", fmtDate(i.due)]
                ]} />
                <div style={{ marginTop: 10 }}>
                  <Chips refs={[{ kind: "customer", id: i.customerId }, { kind: "job", id: i.jobId }, ...msgs.map(m => ({ kind: "message" as const, id: m.id }))]} />
                </div>
                {msgs.map(m => (
                  <div key={m.id} style={{ marginTop: 12, padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)" }}>
                    <Label>{m.from} · {fmtWhen(m.at, TODAY)}</Label>
                    <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--body)", marginTop: 5 }}>{m.body}</div>
                  </div>
                ))}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <Label style={{ marginBottom: 9 }}>Payment reminder drafted by the Finance Agent</Label>
                  {d ? <DraftPanel draft={d} /> : <Muted>No reminder drafted.</Muted>}
                </div>
              </Card>
            );
          })}
          {!overdue.length && <Card><Empty title="Nothing overdue" body="Every open invoice is inside its terms." /></Card>}
        </div>
      </div>
    </div>
  );
}

function Costs({ s }: { s: DemoState }) {
  const rows = jobCosts(s);
  type R = typeof rows[number];
  const cols: Col<R>[] = [
    { key: "j", label: "Job", w: "1.6fr", render: r => <span><span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--faint)" }}>{r.job.id}</span> {r.job.title}</span> },
    { key: "p", label: "Complete", w: "130px", render: r => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1 }}><Progress value={r.job.pctComplete} planned={r.job.plannedPct} /></div><span style={{ fontSize: 11.5 }}>{r.job.pctComplete}%</span></div> },
    { key: "cv", label: "Contract", w: "100px", align: "right", render: r => eur(r.job.contractValue) },
    { key: "b", label: "Budget cost", w: "105px", align: "right", render: r => eur(r.budget) },
    { key: "c", label: "Cost to date", w: "105px", align: "right", render: r => eur(r.cost) },
    { key: "e", label: "Earned budget", w: "110px", align: "right", render: r => eur(r.earnedBudget) },
    { key: "v", label: "Variance", w: "100px", align: "right", render: r => <span style={{ color: r.variance < 0 ? "var(--bad)" : "var(--ok)" }}>{r.variance < 0 ? "−" : "+"}{eur(Math.abs(r.variance))}</span> },
    { key: "m", label: "Budget margin", w: "110px", align: "right", render: r => r.marginPct + "%" }
  ];
  const tot = rows.reduce((a, r) => ({ budget: a.budget + r.budget, cost: a.cost + r.cost, earned: a.earned + r.earnedBudget }), { budget: 0, cost: 0, earned: 0 });
  return (
    <div className="cc-page">
      <PageHead title="Job costs" sub="Labour, material and subcontract cost to date against budget, by site. Estimates, illustrative."
        right={<><DemoNote>Estimates, illustrative</DemoNote></>} />
      <div className="cc-grid cc-c4">
        <Kpi label="Budget cost (3 jobs)" value={eur(tot.budget)} hint="From the won quotes" />
        <Kpi label="Cost to date" value={eur(tot.cost)} hint="Labour, material, subcontract" delay={60} />
        <Kpi label="Earned budget" value={eur(Math.round(tot.earned))} hint="Budget × % complete" tone="accent" delay={120} />
        <Kpi label="Variance" value={(tot.earned - tot.cost < 0 ? "−" : "+") + eur(Math.abs(Math.round(tot.earned - tot.cost)))} hint="Earned budget less cost to date"
          tone={tot.earned - tot.cost < 0 ? "warn" : "ok"} delay={180} />
      </div>
      <Card title="By job" sub="Planned progress marked on each bar. Select a row for the job." pad={false}>
        <Table cols={cols} rows={rows} rowKey={r => r.job.id} onRow={r => act.openRecord({ kind: "job", id: r.job.id })} minWidth={1000} />
      </Card>
      <div className="cc-grid cc-c3">
        {rows.map(r => {
          const parts = [
            ["Labour", r.job.budgetCost.labour, r.job.costToDate.labour],
            ["Material", r.job.budgetCost.material, r.job.costToDate.material],
            ["Subcontract", r.job.budgetCost.subcontract, r.job.costToDate.subcontract]
          ] as const;
          return (
            <Card key={r.job.id} title={r.job.id + " · " + r.site.name} sub={r.job.pctComplete + "% complete · budget margin " + r.marginPct + "%"}
              right={<StatusBadge status={r.job.status} />}>
              {parts.map(([label, budget, cost]) => (
                <div key={label} style={{ marginBottom: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span>{label}</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(cost)} <Muted>of {eur(budget)}</Muted></span>
                  </div>
                  <div style={{ marginTop: 6 }}><Progress value={(100 * cost) / budget} planned={r.job.pctComplete} tone={cost / budget > r.job.pctComplete / 100 ? "warn" : "accent"} /></div>
                </div>
              ))}
              <Muted style={{ fontSize: 11 }}>Marker shows % complete. A bar past it means that cost is running ahead of progress.</Muted>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Forecast({ s }: { s: DemoState }) {
  const rows = cashForecast(s);
  const slip = s.ui.forecastSlip;
  const low = rows.reduce((m, r) => (r.balance < m.balance ? r : m), rows[0]);
  const inflow = rows.reduce((n, r) => n + r.inflow, 0);
  const out = rows.reduce((n, r) => n + r.out, 0);
  return (
    <div className="cc-page">
      <PageHead title="Cash forecast" sub="Six weeks, built from the open invoice rows plus illustrative run-rates."
        right={<><DemoNote>Illustrative, mock-derived</DemoNote>
          <Btn kind={slip ? "primary" : "ghost"} onClick={() => act.setForecastSlip(!slip)}>{slip ? "Scenario on: INV-301 slips 30 days" : "Test: INV-301 slips 30 days"}</Btn></>} />
      <div style={{ padding: "10px 14px", background: "var(--surface-faint)", border: "1px dashed var(--border-strong)", borderRadius: "var(--card-r,18px)", fontSize: 12.5, color: "var(--body)", lineHeight: 1.55 }}>
        Illustrative, mock-derived: wages and materials are run-rate assumptions, the opening balance is illustrative, and future payment applications are estimates. Invoice inflows come from the invoice rows.
      </div>
      <div className="cc-grid cc-c4">
        <Kpi label="Inflows, 6 weeks" value={eur(inflow)} hint={slip ? "INV-301 moved to w/c 14 Dec" : "INV-301 assumed w/c 23 Nov after the chase"} tone="ok" />
        <Kpi label="Outflows, 6 weeks" value={eur(out)} hint="Wages and materials, run-rate" delay={60} />
        <Kpi label="Lowest balance" value={eur(low.balance)} hint={low.week} tone={low.balance < 20000 ? "warn" : "accent"} delay={120} />
        <Kpi label="Closing balance" value={eur(rows[rows.length - 1].balance)} hint={rows[rows.length - 1].week} delay={180} />
      </div>
      <div className="cc-grid cc-split">
        <Card title="Inflow vs outflow by week" sub={slip ? "Scenario: INV-301 paid 30 days later than expected" : "Expected case"}>
          <Columns data={rows.map(r => ({ label: r.week.replace("w/c ", ""), a: r.inflow, b: r.out }))} height={170} tone="accent" legend={["Inflows", "Outflows"]} />
        </Card>
        <Card title="Running balance" sub="Opening balance is illustrative.">
          <Bars data={rows.map(r => ({ label: r.week, value: Math.max(0, r.balance), text: eur(r.balance), tone: r.balance < 20000 ? "warn" as const : "accent" as const }))} />
        </Card>
      </div>
      <Card title="Weekly detail" pad={false}>
        <Table cols={[
          { key: "w", label: "Week", w: "1fr", render: r => r.week },
          { key: "i", label: "Inflows", w: "1fr", align: "right", render: r => r.inflow ? eur(r.inflow) : <Muted>None</Muted> },
          { key: "wg", label: "Wages (run-rate)", w: "1fr", align: "right", render: r => eur(r.wages) },
          { key: "m", label: "Materials (run-rate)", w: "1fr", align: "right", render: r => eur(r.materials) },
          { key: "n", label: "Net", w: "1fr", align: "right", render: r => <span style={{ color: r.net < 0 ? "var(--bad)" : "var(--ok)" }}>{r.net < 0 ? "−" : "+"}{eur(Math.abs(r.net))}</span> },
          { key: "b", label: "Balance", w: "1fr", align: "right", render: r => <strong>{eur(r.balance)}</strong> }
        ] as Col<typeof rows[number]>[]} rows={rows} rowKey={r => r.week} minWidth={760} />
      </Card>
    </div>
  );
}

export default function Finance({ tab }: { tab: string }) {
  const s = useDemo();
  switch (tab) {
    case "invoices": return <Invoices s={s} />;
    case "debtors": return <Debtors s={s} />;
    case "costs": return <Costs s={s} />;
    case "forecast": return <Forecast s={s} />;
    default: return <Overview s={s} />;
  }
}
