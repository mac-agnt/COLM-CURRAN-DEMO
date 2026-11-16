import { useEffect } from "react";
import { act, useDemo } from "../../demo/store";

/* Confirms every simulated action, then gets out of the way. */
export default function Toast() {
  const s = useDemo();
  const t = s.ui.toast;
  useEffect(() => {
    if (!t) return;
    const id = setTimeout(() => act.dismissToast(), 4200);
    return () => clearTimeout(id);
  }, [t?.n]);
  if (!t) return null;
  return (
    <div role="status" key={t.n} style={{ position: "fixed", left: "50%", bottom: 26, zIndex: 95, transform: "translateX(-50%)", maxWidth: "min(560px,92vw)",
      display: "flex", alignItems: "center", gap: 10, padding: "11px 12px 11px 16px", background: "var(--tooltip)", color: "var(--tooltip-ink)",
      border: "1px solid var(--border-strong)", borderRadius: "var(--r-md,14px)", boxShadow: "0 18px 44px rgba(0,0,0,.45)", fontSize: 13, animation: "ccToast .32s var(--ease) both" }}>
      <span style={{ width: 7, height: 7, flex: "none", borderRadius: 2, background: "var(--accent)" }} />
      <span style={{ flex: 1, minWidth: 0 }}>{t.text}</span>
      <button type="button" onClick={() => act.dismissToast()} style={{ flex: "none", border: 0, background: "none", color: "inherit", opacity: .6, cursor: "pointer", fontSize: 12 }}>Dismiss</button>
    </div>
  );
}
