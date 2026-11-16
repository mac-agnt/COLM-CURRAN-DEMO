/* Small component kit for the Colm Curran modules, built on the Pulse theme
   tokens so every new screen reads as the same Pulse Glass product. */
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { act, useDemo } from "../../demo/store";
import { recordLabel } from "../../demo/selectors";
import { initials } from "../../demo/format";
import type { RecordRef } from "../../demo/types";

export type Tone = "ok" | "warn" | "bad" | "accent" | "neutral" | "info";

export const TONE: Record<Tone, { fg: string; bg: string; line: string }> = {
  ok: { fg: "var(--ok)", bg: "var(--ok-soft)", line: "var(--ok)" },
  warn: { fg: "var(--warn)", bg: "var(--warn-soft)", line: "var(--warn)" },
  bad: { fg: "var(--bad)", bg: "var(--bad-soft)", line: "var(--bad)" },
  accent: { fg: "var(--accent)", bg: "var(--accent-faint)", line: "var(--accent-line)" },
  neutral: { fg: "var(--body)", bg: "var(--track)", line: "var(--border-strong)" },
  info: { fg: "var(--info,#7fb8e0)", bg: "rgba(127,184,224,.13)", line: "rgba(127,184,224,.4)" }
};

const MONO: CSSProperties = { fontFamily: "var(--mono)", fontSize: "9.5px", letterSpacing: ".13em", textTransform: "uppercase", color: "var(--faint)" };

export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...MONO, ...style }}>{children}</div>;
}

export function PageHead({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", padding: "6px 2px 2px" }}>
      <div style={{ flex: "1 1 320px", minWidth: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.6px", lineHeight: 1.15 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 6, lineHeight: 1.55, maxWidth: "78ch" }}>{sub}</div>}
      </div>
      {right && <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>{right}</div>}
    </div>
  );
}

export function Card({ title, sub, right, children, pad = true, style, className, onClick, accent }: {
  title?: ReactNode; sub?: ReactNode; right?: ReactNode; children?: ReactNode; pad?: boolean; style?: CSSProperties;
  className?: string; onClick?: () => void; accent?: Tone;
}) {
  return (
    <section onClick={onClick} className={className} style={{
      position: "relative", minWidth: 0, background: "var(--surface)", border: "1px solid " + (accent ? TONE[accent].line : "var(--border)"),
      borderRadius: "var(--card-r,18px)", boxShadow: "var(--card-shadow)", overflow: "hidden", ...style
    }}>
      {(title || right) && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "15px 18px 0" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.2px" }}>{title}</div>}
            {sub && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3, lineHeight: 1.5 }}>{sub}</div>}
          </div>
          {right && <div style={{ flex: "none", display: "flex", gap: 6, alignItems: "center" }}>{right}</div>}
        </div>
      )}
      <div style={{ padding: pad ? "14px 18px 18px" : (title || right) ? "12px 0 0" : 0 }}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, hint, tone, onClick, active, delay = 0, small }: {
  label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; onClick?: () => void; active?: boolean; delay?: number; small?: boolean;
}) {
  const t = tone ? TONE[tone] : null;
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={onClick ? "cc-card-click" : undefined} style={{
      textAlign: "left", minWidth: 0, padding: small ? "12px 14px 13px" : "15px 17px 16px", cursor: onClick ? "pointer" : "default",
      background: active ? "var(--accent-faint)" : "var(--surface)", border: "1px solid " + (active ? "var(--accent-line)" : "var(--border)"),
      borderRadius: "var(--card-r,18px)", color: "inherit", font: "inherit", animation: "springIn .5s var(--ease) " + delay + "ms both", opacity: 1
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {t && <span style={{ width: 6, height: 6, borderRadius: 2, background: t.fg, flex: "none" }} />}
        <span style={{ ...MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      </div>
      <div style={{ fontSize: small ? 20 : 25, fontWeight: 600, letterSpacing: "-.8px", marginTop: 8, lineHeight: 1, color: t && tone !== "ok" && tone !== "accent" ? t.fg : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {hint && <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 7, lineHeight: 1.4 }}>{hint}</div>}
    </button>
  );
}

export function Badge({ tone = "neutral", children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  const t = TONE[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 22, padding: "0 9px", borderRadius: "var(--chip-r,7px)", background: t.bg,
      color: t.fg, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", flex: "none" }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: 2, background: t.fg }} />}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  "On time": "ok", Late: "warn", "No clock-in": "bad", "Held for review": "warn", Paid: "ok", Overdue: "bad", Unpaid: "neutral",
  Detected: "info", Drafted: "neutral", "Awaiting approval": "warn", Approved: "accent", "Simulated complete": "ok", Rejected: "neutral",
  Open: "warn", Resolved: "ok", "In progress": "accent", Done: "ok", Submitted: "neutral", Exception: "bad", Exported: "ok",
  High: "bad", Medium: "warn", Low: "neutral", Won: "ok", Lost: "neutral", "With QS": "info", "Colm Review": "warn", Sent: "accent", "Follow-up": "warn",
  "New Enquiry": "neutral", "Drawings Received": "info", "On programme": "ok", "At risk": "warn", Ahead: "ok",
  "Awaiting measurements": "warn", "Draft estimate": "neutral", "With Colm": "warn"
};
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <Badge tone={STATUS_TONE[status] || "neutral"} dot>{label || status}</Badge>;
}

export const LIFECYCLE = ["Detected", "Drafted", "Awaiting approval", "Approved", "Simulated complete"];
export function Lifecycle({ status }: { status: string }) {
  const at = LIFECYCLE.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {LIFECYCLE.map((step, i) => {
        const done = at >= 0 && i <= at;
        return (
          <span key={step} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ height: 22, padding: "0 8px", display: "inline-flex", alignItems: "center", borderRadius: "var(--chip-r,7px)", fontSize: 10.5,
              background: i === at ? "var(--accent-faint)" : done ? "var(--surface-2)" : "transparent", color: i === at ? "var(--accent)" : done ? "var(--body)" : "var(--faint)",
              border: "1px solid " + (i === at ? "var(--accent-line)" : "var(--border)") }}>{step}</span>
            {i < LIFECYCLE.length - 1 && <span style={{ width: 8, height: 1, background: "var(--border-strong)" }} />}
          </span>
        );
      })}
      {status === "Rejected" && <Badge tone="neutral">Rejected</Badge>}
    </div>
  );
}

export function Btn({ kind = "ghost", size = "md", onClick, children, disabled, title, full, style }: {
  kind?: "primary" | "ghost" | "quiet" | "danger"; size?: "sm" | "md"; onClick?: (e: MouseEvent) => void; children: ReactNode;
  disabled?: boolean; title?: string; full?: boolean; style?: CSSProperties;
}) {
  const h = size === "sm" ? 28 : 34;
  const base: CSSProperties = { height: h, padding: size === "sm" ? "0 11px" : "0 15px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
    borderRadius: "var(--cta-r,10px)", fontSize: size === "sm" ? 12 : 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap",
    width: full ? "100%" : undefined, flex: "none" };
  const look: CSSProperties = kind === "primary"
    ? { background: "var(--accent-fill,var(--accent))", color: "var(--on-accent)", border: "1px solid transparent", boxShadow: "var(--accent-glow,none)" }
    : kind === "danger" ? { background: "var(--bad-soft)", color: "var(--bad)", border: "1px solid var(--bad-soft)" }
    : kind === "quiet" ? { background: "none", color: "var(--dim)", border: "1px solid transparent" }
    : { background: "var(--surface-2)", color: "var(--body)", border: "1px solid var(--border)" };
  return <button type="button" title={title} disabled={disabled} onClick={e => { e.stopPropagation(); onClick?.(e); }}
    className={"cc-btn" + (kind === "primary" ? " cc-primary" : "")} style={{ ...base, ...look, ...style }}>{children}</button>;
}

export function Seg<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 2, padding: 3, background: "var(--surface-faint)", border: "1px solid var(--border)", borderRadius: "var(--r-ctl,11px)" }}>
      {options.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)} className="cc-btn" style={{ height: 28, padding: "0 12px", border: 0, borderRadius: "var(--r-ctl,9px)", cursor: "pointer",
          fontSize: 12, whiteSpace: "nowrap", background: value === v ? "var(--pill-bg)" : "none", color: value === v ? "var(--pill-ink)" : "var(--dim)", fontWeight: value === v ? 600 : 500 }}>{l}</button>
      ))}
    </div>
  );
}

export interface Col<R> { key: string; label: string; w?: string; align?: "left" | "right" | "center"; render: (r: R) => ReactNode; mono?: boolean }

export function Table<R>({ cols, rows, onRow, empty, rowKey, selected, minWidth = 640, dense }: {
  cols: Col<R>[]; rows: R[]; onRow?: (r: R) => void; empty?: ReactNode; rowKey: (r: R) => string; selected?: string; minWidth?: number; dense?: boolean;
}) {
  const grid = cols.map(c => c.w || "1fr").join(" ");
  return (
    <div className="cc-scroll-x">
      <div style={{ minWidth }}>
        <div style={{ display: "grid", gridTemplateColumns: grid, background: "var(--surface-faint)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          {cols.map(c => <div key={c.key} style={{ ...MONO, padding: "9px 14px", textAlign: c.align || "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</div>)}
        </div>
        {rows.map((r, i) => {
          const k = rowKey(r);
          return (
            <div key={k} onClick={onRow ? () => onRow(r) : undefined} className={"cc-row" + (onRow ? " cc-click" : "") + (selected === k ? " cc-sel" : "")}
              style={{ display: "grid", gridTemplateColumns: grid, borderTop: i ? "1px solid var(--border)" : 0, alignItems: "center" }}>
              {cols.map(c => (
                <div key={c.key} style={{ padding: dense ? "8px 14px" : "11px 14px", minWidth: 0, fontSize: 13, textAlign: c.align || "left",
                  fontFamily: c.mono ? "var(--mono)" : undefined, fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis" }}>{c.render(r)}</div>
              ))}
            </div>
          );
        })}
        {!rows.length && <div style={{ padding: "34px 18px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>{empty || "Nothing here."}</div>}
      </div>
    </div>
  );
}

export function Progress({ value, planned, tone = "accent", height = 6 }: { value: number; planned?: number; tone?: Tone; height?: number }) {
  return (
    <div style={{ position: "relative", height, borderRadius: 4, background: "var(--track)", overflow: "visible", minWidth: 40 }}>
      <div style={{ position: "absolute", inset: 0, width: Math.min(100, value) + "%", borderRadius: 4, background: TONE[tone].fg, transformOrigin: "left", animation: "sweep .8s var(--ease) both" }} />
      {planned !== undefined && <div title={"Planned " + planned + "%"} style={{ position: "absolute", top: -3, bottom: -3, left: planned + "%", width: 2, borderRadius: 1, background: "var(--ink)", opacity: .55 }} />}
    </div>
  );
}

export function Avatar({ name, size = 28, tone }: { name: string; size?: number; tone?: Tone }) {
  return (
    <span style={{ width: size, height: size, flex: "none", borderRadius: Math.round(size / 3), display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: tone ? TONE[tone].bg : "var(--surface-2)", border: "1px solid var(--border)", color: tone ? TONE[tone].fg : "var(--body)",
      fontSize: size < 26 ? 9.5 : 11, fontWeight: 600 }}>{initials(name)}</span>
  );
}

export function RecordChip({ r, label }: { r: RecordRef; label?: string }) {
  const s = useDemo();
  return (
    <button type="button" className="cc-chip" onClick={e => { e.stopPropagation(); act.openRecord(r); }} title="Open linked record" style={{
      height: 26, maxWidth: "100%", display: "inline-flex", alignItems: "center", gap: 6, padding: "0 10px", borderRadius: "var(--chip-r,8px)",
      background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--body)", fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
    }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", opacity: .7 }}>
        <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1 M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
      </svg>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label || recordLabel(s, r)}</span>
    </button>
  );
}

export function Chips({ refs }: { refs: RecordRef[] }) {
  if (!refs.length) return null;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{refs.map(r => <RecordChip key={r.kind + r.id} r={r} />)}</div>;
}

export function DemoNote({ children }: { children?: ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 26, padding: "0 10px", borderRadius: "var(--chip-r,8px)", border: "1px dashed var(--border-strong)",
      fontSize: 11, color: "var(--dim)", whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: 2, background: "var(--accent)" }} />
      {children || "Illustrative demo data"}
    </span>
  );
}

export function Timeline({ items }: { items: { at: string; actor: string; text: ReactNode; tone?: Tone; related?: RecordRef[] }[] }) {
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: "none", width: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ width: 8, height: 8, marginTop: 5, borderRadius: 3, background: it.tone ? TONE[it.tone].fg : "var(--border-strong)" }} />
            {i < items.length - 1 && <span style={{ flex: 1, width: 1, background: "var(--border)", minHeight: 14 }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{it.actor}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--faint)" }}>{it.at}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 3, lineHeight: 1.55 }}>{it.text}</div>
            {it.related && it.related.length > 0 && <div style={{ marginTop: 7 }}><Chips refs={it.related} /></div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function KV({ items, cols = 3 }: { items: [string, ReactNode][]; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(" + cols + ",minmax(0,1fr))", gap: 8 }}>
      {items.map(([k, v]) => (
        <div key={k} style={{ padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)", minWidth: 0 }}>
          <Label>{k}</Label>
          <div style={{ fontSize: 13, marginTop: 5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--body)" }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: "var(--dim)" }}>{hint}</span>}
    </label>
  );
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <div style={{ padding: "30px 18px", textAlign: "center" }}>
      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{title}</div>
      {body && <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 5 }}>{body}</div>}
    </div>
  );
}

/** Horizontal bars: label, value, display text. */
export function Bars({ data, tone = "accent", max }: { data: { label: string; value: number; text: string; tone?: Tone }[]; tone?: Tone; max?: number }) {
  const m = max || Math.max(1, ...data.map(d => d.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map(d => (
        <div key={d.label}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5 }}>
            <span style={{ color: "var(--body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)", whiteSpace: "nowrap" }}>{d.text}</span>
          </div>
          <div style={{ height: 6, marginTop: 6, borderRadius: 4, background: "var(--track)" }}>
            <div style={{ height: 6, width: Math.max(2, (100 * d.value) / m) + "%", borderRadius: 4, background: TONE[d.tone || tone].fg, transformOrigin: "left", animation: "sweep .8s var(--ease) both" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Vertical column chart with optional second series. */
export function Columns({ data, height = 140, tone = "accent", legend }: {
  data: { label: string; a: number; b?: number; note?: string }[]; height?: number; tone?: Tone; legend?: [string, string];
}) {
  const m = Math.max(1, ...data.map(d => Math.max(d.a, d.b || 0)));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height, paddingTop: 8 }}>
        {data.map(d => (
          <div key={d.label} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 6, height: "100%", justifyContent: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: "100%" }}>
              <div title={String(d.a)} style={{ flex: 1, height: Math.max(2, (100 * d.a) / m) + "%", borderRadius: "4px 4px 2px 2px", background: TONE[tone].fg, transformOrigin: "bottom", animation: "growBar .7s var(--ease) both" }} />
              {d.b !== undefined && <div title={String(d.b)} style={{ flex: 1, height: Math.max(2, (100 * d.b) / m) + "%", borderRadius: "4px 4px 2px 2px", background: "var(--neutral)", transformOrigin: "bottom", animation: "growBar .7s var(--ease) both" }} />}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 7 }}>
        {data.map(d => <div key={d.label} style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: 10.5, color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.label}</div>)}
      </div>
      {legend && (
        <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11.5, color: "var(--dim)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: TONE[tone].fg }} />{legend[0]}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--neutral)" }} />{legend[1]}</span>
        </div>
      )}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
      <Label style={{ flex: 1 }}>{children}</Label>
      {right}
    </div>
  );
}

export function Muted({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ color: "var(--dim)", fontSize: 12, ...style }}>{children}</span>;
}
