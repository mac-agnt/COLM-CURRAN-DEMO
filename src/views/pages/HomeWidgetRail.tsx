import { Fragment, type ReactNode } from "react";
import { arr, cat, css, txt } from "../../runtime/template";
import { act, goTo, useDemo } from "../../demo/store";
import { attendanceSummary, daysOverdue, jobRollup, openExceptions, pendingDrafts, quoteAge, totals } from "../../demo/selectors";
import { morningBriefing } from "../../demo/answers";
import { eur, fmtWhen } from "../../demo/format";
import type { RecordRef } from "../../demo/types";

type Props = { v: any };

function W({ title, hint, children, delay = 0 }: { title: string; hint?: string; children: ReactNode; delay?: number }) {
  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-r,18px)", padding: "14px 16px 15px", minWidth: 0,
      boxShadow: "var(--card-shadow)", animation: "springIn .5s var(--ease) " + delay + "ms both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
        <span style={{ flex: 1, fontFamily: "var(--mono)", fontSize: "9.5px", letterSpacing: ".13em", color: "var(--faint)", textTransform: "uppercase" }}>{title}</span>
        {hint && <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--faint)" }}>{hint}</span>}
      </div>
      {children}
    </section>
  );
}


/* The right rail is where briefings, inbox items and to-dos live on Home.
   The centre column stays the chat. Everything here reads the demo store. */
export default function HomeWidgetRail({ v }: Props) {
  const s = useDemo();
  const a = attendanceSummary(s);
  const t = totals(s);
  const miss = a.rows.filter(r => r.status === "No clock-in" || r.status === "Held for review");
  const exc = openExceptions(s);
  const drafts = pendingDrafts(s);
  const inv301 = s.invoices.find(i => i.id === "INV-301")!;
  const q201 = s.quotes.find(q => q.id === "QUO-201")!;
  const d01 = s.drafts.find(d => d.id === "DRF-01")!;
  const d02 = s.drafts.find(d => d.id === "DRF-02")!;
  const est = s.estimates.find(e => e.id === "EST-202")!;
  const confirmDraft = (pid: string) => s.drafts.find(d => d.kind === "Attendance confirmation" && d.linked.some(l => l.id === pid));

  const attention: { tone: string; title: string; meta: string; r: RecordRef }[] = [
    ...miss.map(m => ({ tone: "var(--bad)", title: m.person.name + ": no clock-in at " + m.site.name, meta: "Scheduled " + m.scheduled + " · Liam texted 07:16", r: { kind: "person" as const, id: m.person.id } })),
    ...exc.map(x => ({ tone: "var(--warn)", title: x.id + ": Patrick O'Sullivan +" + (x.contractorHours - x.internalHours).toFixed(1) + "h", meta: "Mon 16 Nov · Cappamore · 8.0h vs 10.0h", r: { kind: "exception" as const, id: x.id } })),
    ...(inv301.paidDate ? [] : [{ tone: "var(--bad)", title: "INV-301 " + eur(inv301.amount) + " overdue", meta: daysOverdue(inv301) + " days · Cappamore payment application 3", r: { kind: "invoice" as const, id: "INV-301" } }]),
    ...(["Sent", "Follow-up"].includes(q201.stage) ? [{ tone: "var(--warn)", title: "QUO-201 " + eur(q201.value) + " no reply", meta: quoteAge(q201) + " days · Killorglin Homes", r: { kind: "quote" as const, id: "QUO-201" } }] : [])
  ];

  const suggestions: { label: string; meta: string; done: boolean; run: () => void }[] = [
    ...miss.slice(0, 1).map(m => {
      const d = confirmDraft(m.person.id);
      return { label: d ? "Approve the text to " + m.person.name.split(" ")[0] : "Request confirmation from " + m.person.name.split(" ")[0], meta: d ? d.status : "Drafts a text, cc " + m.site.name + " lead",
        done: false, run: () => d ? act.approveDraft(d.id) : act.requestConfirmation(m.person.id) };
    }),
    { label: "Review EXC-401", meta: exc.length ? "Payroll line held" : "Resolved", done: !exc.length, run: () => { act.select("tsExc", "EXC-401"); goTo("Timesheets", "reconciliation"); } },
    { label: "Approve INV-301 reminder", meta: d01.status, done: d01.status !== "Awaiting approval", run: () => act.approveDraft("DRF-01") },
    { label: "Approve QUO-201 follow-up", meta: d02.status, done: d02.status !== "Awaiting approval", run: () => act.approveDraft("DRF-02") },
    { label: "Castleisland: QS needs measurements", meta: est.status, done: est.status === "Approved", run: () => goTo("Quotations", "estimates") }
  ];

  const rowBtn = { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 9px", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)",
    background: "var(--surface-2)", color: "inherit", font: "inherit", textAlign: "left" as const, cursor: "pointer" };

  return (
    <>
      <aside className="cc-home-rail" style={{ position: "relative", zIndex: 1, width: "clamp(340px,33vw,720px)", flex: "none", minHeight: 0, overflowY: "auto", scrollbarWidth: "none",
        display: "flex", flexDirection: "column", gap: 12, padding: "2px 0 6px 20px" }}>
        <div style={{ flex: "0 0 auto", minWidth: 0, overflow: "hidden", display: "flex", flexWrap: "nowrap", alignItems: "center", justifyContent: "space-between", gap: 4, padding: "2px 0 4px", fontFamily: "var(--mono)" }}>
          {arr(v.flipUnits).map((u: any, i15: number) => (
            <Fragment key={i15}>
              <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center", gap: 3 }}>
                {arr(u?.tiles).map((tl: any, i16: number) => (
                  <Fragment key={i16}>
                    {tl?.isColon && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 1px" }}>
                        <span style={{ width: "2.5px", height: "2.5px", borderRadius: 2, background: "var(--accent)", animation: "tickPulse 1s ease-in-out infinite" }} />
                        <span style={{ width: "2.5px", height: "2.5px", borderRadius: 2, background: "var(--accent)", animation: "tickPulse 1s ease-in-out .1s infinite" }} />
                      </div>
                    )}
                    {tl?.isTile && (
                      <span style={css(cat("position:relative;display:flex;align-items:center;justify-content:center;min-width:", tl?.w, ";height:", tl?.h, ";padding:0 3px;border-radius:var(--r-sm,9px);background:var(--flap);border:1px solid var(--border);box-shadow:0 3px 8px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.13);font-size:", tl?.size, ";font-weight:500;letter-spacing:-0.3px;color:", tl?.color, ";overflow:hidden"))}>
                        <span style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "var(--flap-hinge)", zIndex: 4 }} />
                        {txt(tl?.v)}
                      </span>
                    )}
                  </Fragment>
                ))}
              </div>
            </Fragment>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12, alignItems: "start" }}>
          <W title="Business today" hint="ILLUSTRATIVE">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
              {[
                [a.onTime + "/" + a.scheduled, "on time 07:00", a.missing ? "var(--warn)" : "var(--ink)", () => goTo("Workforce", "live")],
                [String(a.late), "late", a.late ? "var(--warn)" : "var(--ink)", () => goTo("Workforce", "live")],
                [String(a.missing), "unverified", a.missing ? "var(--bad)" : "var(--ink)", () => goTo("Workforce", "live")],
                ["3", "live sites", "var(--ink)", () => goTo("Sites", "overview")],
                [String(drafts.length + exc.length + s.estimates.filter(e => e.status === "With Colm").length), "approvals", "var(--ink)", () => goTo("Work")],
                [eur(t.overdue, { k: true }), "overdue", t.overdue ? "var(--bad)" : "var(--ink)", () => goTo("Finance", "debtors")]
              ].map(([val, lbl, col, go], i) => (
                <button key={i} type="button" onClick={go as () => void} className="cc-btn" style={{ ...rowBtn, flexDirection: "column", alignItems: "flex-start", gap: 3, padding: "9px 10px" }}>
                  <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.5px", color: col as string }}>{val as string}</span>
                  <span style={{ fontSize: 11, color: "var(--dim)" }}>{lbl as string}</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 10 }}>
              {t.staleQuotes.length} quotes due a follow-up · {eur(t.pipeline)} pipeline · {a.clockedIn} of {a.scheduled} clocked in at {s.ui.clock}
            </div>
          </W>

          <W title="Morning briefing" hint="BRIEFING · 07:18" delay={50}>
            <div style={{ fontSize: 13, lineHeight: 1.62, color: "var(--body)" }}>{morningBriefing(s)}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 11, flexWrap: "wrap" }}>
              <button type="button" className="cc-btn" onClick={() => goTo("Communications", "drafts")} style={{ height: 28, padding: "0 12px", border: 0, borderRadius: "var(--cta-r,10px)", background: "var(--accent-fill,var(--accent))", color: "var(--on-accent)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                Review {drafts.length} drafts
              </button>
              <button type="button" className="cc-btn" onClick={() => goTo("Agents", "overview")} style={{ height: 28, padding: "0 12px", border: "1px solid var(--border)", borderRadius: "var(--cta-r,10px)", background: "var(--surface-2)", color: "var(--body)", fontSize: 12, cursor: "pointer" }}>
                Agents
              </button>
            </div>
          </W>

          <W title="Needs attention" hint={attention.length + " OPEN"} delay={100}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {attention.map(x => (
                <button key={x.r.kind + x.r.id} type="button" className="cc-row cc-click" onClick={() => act.openRecord(x.r)} style={rowBtn}>
                  <span style={{ width: 6, height: 6, flex: "none", borderRadius: 2, background: x.tone }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.title}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--dim)", marginTop: 2 }}>{x.meta}</span>
                  </span>
                </button>
              ))}
              {!attention.length && <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Nothing needs you right now.</div>}
            </div>
          </W>

          <W title="Site snapshot" hint="3 SITES" delay={150}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {s.jobs.map(j => {
                const r = jobRollup(s, j.id);
                const b = a.bySite.find(x => x.site.id === j.siteId)!;
                return (
                  <button key={j.id} type="button" className="cc-row cc-click" onClick={() => act.openRecord({ kind: "job", id: j.id })} style={{ ...rowBtn, flexDirection: "column", alignItems: "stretch", gap: 7 }}>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{r.site.name}</span>
                      <span style={{ fontSize: 11, color: b.missing ? "var(--bad)" : b.late ? "var(--warn)" : "var(--dim)" }}>{b.clockedIn}/{b.scheduled} in · {b.late} late{b.missing ? " · " + b.missing + " missing" : ""}</span>
                    </span>
                    <span style={{ position: "relative", height: 5, borderRadius: 3, background: "var(--track)" }}>
                      <span style={{ position: "absolute", inset: 0, width: j.pctComplete + "%", borderRadius: 3, background: "var(--accent)" }} />
                      <span style={{ position: "absolute", top: -2, bottom: -2, left: j.plannedPct + "%", width: 2, background: "var(--ink)", opacity: .5 }} />
                    </span>
                    <span style={{ fontSize: 11, color: "var(--dim)" }}>{j.pctComplete}% · {r.openIssues.length} open issues · next: {r.nextMilestone?.name}</span>
                  </button>
                );
              })}
            </div>
          </W>

          <W title="Suggested actions" delay={200}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {suggestions.map(x => (
                <button key={x.label} type="button" className="cc-row cc-click" onClick={x.run} disabled={x.done} style={{ ...rowBtn, opacity: x.done ? .55 : 1, cursor: x.done ? "default" : "pointer" }}>
                  <span style={{ width: 16, height: 16, flex: "none", borderRadius: 5, background: x.done ? "var(--ok)" : "var(--track)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--on-accent)" }}>
                    {x.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, textDecoration: x.done ? "line-through" : "none" }}>{x.label}</span>
                  <span style={{ fontSize: 10.5, color: "var(--faint)", whiteSpace: "nowrap" }}>{x.meta}</span>
                </button>
              ))}
            </div>
          </W>

          <W title="Recent activity" hint="AUDITED" delay={250}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {s.audit.slice(0, 6).map((x, i) => (
                <button key={x.id} type="button" onClick={() => x.related[0] ? act.openRecord(x.related[0]) : goTo("Activity")} className="cc-row cc-click"
                  style={{ display: "flex", gap: 10, padding: "8px 2px", border: 0, borderTop: i ? "1px solid var(--border)" : 0, background: "none", color: "inherit", font: "inherit", textAlign: "left", cursor: "pointer" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)", width: 38, flex: "none", paddingTop: 1 }}>{fmtWhen(x.at, "2026-11-18")}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12 }}><b style={{ fontWeight: 600 }}>{x.actor}</b> <span style={{ color: "var(--dim)" }}>{x.action.charAt(0).toLowerCase() + x.action.slice(1)}</span></span>
                </button>
              ))}
            </div>
          </W>
        </div>
      </aside>
    </>
  );
}
