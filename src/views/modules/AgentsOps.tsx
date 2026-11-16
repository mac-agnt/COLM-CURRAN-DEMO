/* Agents: Overview, Run history and Approvals. Agent detail reuses the original Pulse agent chat. */
import { useState } from "react";
import AgentFace from "../../components/AgentFace";
import { act, goTo, useDemo } from "../../demo/store";
import { agentName, approvals, person } from "../../demo/selectors";
import { fmtWhen } from "../../demo/format";
import { Badge, Btn, Card, Chips, DemoNote, Kpi, Label, Lifecycle, PageHead, Seg, StatusBadge, Table } from "./ui";

const STATE_TONE = { working: "accent", thinking: "info", waiting: "warn", complete: "ok", attention: "bad", idle: "neutral" } as const;
const STATE_WORD = { working: "working", thinking: "thinking", waiting: "waiting on you", complete: "up to date", attention: "needs you", idle: "idle" } as const;

export default function AgentsOps({ tab }: { tab: string }) {
  const s = useDemo();
  const [agentFilter, setAgentFilter] = useState("all");

  if (tab === "runs") {
    const rows = s.agentActions.filter(a => agentFilter === "all" || a.agentId === agentFilter).slice().sort((a, b) => b.at.localeCompare(a.at));
    return (
      <div className="cc-page">
        <PageHead title="Run history" sub="Every action an agent took, on the same records you see everywhere else." right={<DemoNote>Simulated runs on demo records</DemoNote>} />
        <Seg options={[["all", "All agents"] as [string, string]].concat(s.agents.map(a => [a.id, a.name] as [string, string]))} value={agentFilter} onChange={setAgentFilter} />
        <Card pad={false}>
          <Table minWidth={860} rowKey={a => a.id} rows={rows} cols={[
            { key: "t", label: "When", w: ".7fr", mono: true, render: a => fmtWhen(a.at, "2026-11-18") },
            { key: "a", label: "Agent", w: "1fr", render: a => agentName(s, a.agentId) },
            { key: "w", label: "What it did", w: "2.4fr", render: a => <div><div style={{ fontSize: 13 }}>{a.title}</div><div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{a.detail}</div></div> },
            { key: "r", label: "Records", w: "1.6fr", render: a => <Chips refs={a.related.slice(0, 2)} /> },
            { key: "s", label: "Status", w: "1.1fr", render: a => <StatusBadge status={a.status} /> }
          ]} />
        </Card>
      </div>
    );
  }

  if (tab === "approvals") {
    const list = approvals(s).concat(s.agentActions.filter(a => a.status === "Detected" && a.reviewerId).map(a => ({
      id: a.id, kind: "Agent finding" as const, title: a.title, detail: a.detail, reviewer: person(s, a.reviewerId)?.name || "", department: agentName(s, a.agentId),
      deadline: "Today", status: a.status, related: a.related, ref: a.related[0] || { kind: "agent" as const, id: a.agentId }
    })));
    const open = list.filter(a => a.status === "Awaiting approval" || a.status === "Detected" || a.status === "Drafted");
    return (
      <div className="cc-page">
        <PageHead title="Agent approvals" sub="What the agents proposed, and the named person accountable for each decision. Nothing with an effect happens without a yes."
          right={<DemoNote />} />
        <div className="cc-grid cc-c4">
          <Kpi label="Waiting on a person" value={String(open.length)} tone="warn" />
          <Kpi label="Drafts to approve" value={String(s.drafts.filter(d => d.status === "Awaiting approval").length)} />
          <Kpi label="Approved today" value={String(list.filter(a => a.status === "Approved" || a.status === "Simulated complete").length)} tone="ok" />
          <Kpi label="Sent automatically" value="0" hint="Agents never send. Policy locked." />
        </div>
        <div className="cc-grid cc-c2">
          {list.map(a => (
            <Card key={a.kind + a.id} title={a.title} sub={a.detail} right={<Badge>{a.kind}</Badge>}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "var(--dim)", marginBottom: 10 }}>
                <span>Reviewer: <b style={{ color: "var(--body)", fontWeight: 600 }}>{a.reviewer}</b></span><span>Area: {a.department}</span><span>By: {a.deadline}</span>
              </div>
              <Lifecycle status={a.status} />
              <div style={{ marginTop: 10 }}><Chips refs={a.related.slice(0, 3)} /></div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {a.kind === "Draft" && a.status === "Awaiting approval" && <><Btn kind="primary" size="sm" onClick={() => act.approveDraft(a.id)}>Approve</Btn><Btn size="sm" onClick={() => act.openRecord(a.ref)}>Review draft</Btn></>}
                {a.kind === "Draft" && a.status === "Approved" && <Btn size="sm" onClick={() => act.simulateSend(a.id)}>Mark as sent (simulated)</Btn>}
                {a.kind === "Timesheet variance" && a.status === "Awaiting approval" && <Btn kind="primary" size="sm" onClick={() => goTo("Timesheets", "reconciliation")}>Review in Timesheets</Btn>}
                {a.kind === "QS estimate" && <Btn size="sm" onClick={() => goTo("Quotations", "estimates")}>Open estimate</Btn>}
                {a.kind === "Agent finding" && a.status === "Detected" && <><Btn kind="primary" size="sm" onClick={() => act.acknowledgeAgentAction(a.id)}>Acknowledge</Btn><Btn size="sm" onClick={() => act.openRecord(a.ref)}>Open record</Btn></>}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  /* overview */
  const recent = (id: string) => s.agentActions.filter(a => a.agentId === id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 2);
  const waiting = s.agentActions.filter(a => a.status === "Awaiting approval").length;
  return (
    <div className="cc-page">
      <PageHead title="Seven operational agents" sub="Each one has one job, a trigger, the records it may read, and a person it answers to. They draft and detect; people decide."
        right={<><DemoNote /><Btn onClick={() => act.setTab("Agents", "approvals")}>Approvals</Btn></>} />
      <div className="cc-grid cc-c4">
        <Kpi label="Agents" value={String(s.agents.length)} hint="Briefing, Ops Watchdog + 5 new" />
        <Kpi label="Actions this morning" value={String(s.agentActions.filter(a => a.at.startsWith("2026-11-18")).length)} hint="Since 06:00" />
        <Kpi label="Waiting on you" value={String(waiting)} tone={waiting ? "warn" : "ok"} onClick={() => act.setTab("Agents", "approvals")} />
        <Kpi label="Sent without approval" value="0" tone="ok" hint="Locked in Settings, AI controls" />
      </div>
      <div className="cc-grid cc-c3">
        {s.agents.map((a, i) => (
          <Card key={a.id} className="cc-card-click" onClick={() => act.setAgentFocus(a.id)} style={{ animation: "springIn .5s var(--ease) " + i * 50 + "ms both" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <AgentFace shape={a.shape} state={a.state} tint={a.tint} size={"40"} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{STATE_WORD[a.state]} · confidence {a.confidence}%</div>
              </div>
              <Badge tone={STATE_TONE[a.state]} dot>{STATE_WORD[a.state]}</Badge>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.55, marginTop: 10 }}>{a.purpose}</div>
            <div style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: "6px 10px", marginTop: 12, fontSize: 12 }}>
              <Label style={{ paddingTop: 2 }}>Trigger</Label><span>{a.trigger}</span>
              <Label style={{ paddingTop: 2 }}>Inputs</Label><span style={{ color: "var(--dim)" }}>{a.inputs.join(" · ")}</span>
              <Label style={{ paddingTop: 2 }}>Output</Label><span>{a.output}</span>
              <Label style={{ paddingTop: 2 }}>Escalates</Label><span style={{ color: "var(--dim)" }}>{a.escalation}</span>
              <Label style={{ paddingTop: 2 }}>Approval</Label><span style={{ color: "var(--dim)" }}>{a.approvalRule}</span>
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
              <Label>Recent</Label>
              {recent(a.id).map(r => <div key={r.id} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 7, fontSize: 12 }}>
                <span style={{ fontFamily: "var(--mono)", color: "var(--faint)", flex: "none" }}>{fmtWhen(r.at, "2026-11-18")}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
              </div>)}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Btn size="sm" onClick={() => act.setAgentFocus(a.id)}>Open agent</Btn>
              <Btn size="sm" kind="quiet" onClick={() => act.setTab("Agents", "runs")}>Run history</Btn>
            </div>
          </Card>
        ))}
        <Card title="How they connect" sub="One shared record set. An agent's output is another agent's input.">
          <div style={{ fontSize: 12.5, lineHeight: 1.75, color: "var(--body)" }}>
            Attendance flags John Murphy → Briefing puts it first → Timesheet holds payroll lines until a person resolves EXC-401 → Communications links Gerard Ryan's email to the same case → Finance and Quotation draft the INV-301 and QUO-201 follow-ups → Ops Watchdog watches the programme.
          </div>
          <div style={{ marginTop: 12 }}><Btn size="sm" onClick={() => goTo("Records")}>See it in the ontology</Btn></div>
        </Card>
      </div>
    </div>
  );
}
