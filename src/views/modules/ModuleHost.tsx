import { useDemo } from "../../demo/store";
import Sites from "./Sites";
import Workforce from "./Workforce";
import Timesheets from "./Timesheets";
import Communications from "./Communications";
import Quotations from "./Quotations";
import Finance from "./Finance";
import AgentsOps from "./AgentsOps";

export const MODULE_PAGES = ["Sites", "Workforce", "Timesheets", "Communications", "Quotations", "Finance"];

/* Renders the six operational modules; the active tab lives in the demo store
   so the top bar, Home answers and deep links all agree on it. */
export default function ModuleHost({ page }: { page: string }) {
  const s = useDemo();
  const tab = s.ui.tabs[page];
  switch (page) {
    case "Sites": return <Sites key={tab} tab={tab} />;
    case "Workforce": return <Workforce key={tab} tab={tab} />;
    case "Timesheets": return <Timesheets key={tab} tab={tab} />;
    case "Communications": return <Communications key={tab} tab={tab} />;
    case "Quotations": return <Quotations key={tab} tab={tab} />;
    case "Finance": return <Finance key={tab} tab={tab} />;
    case "Agents": return <AgentsOps key={tab} tab={tab} />;
    default: return null;
  }
}
