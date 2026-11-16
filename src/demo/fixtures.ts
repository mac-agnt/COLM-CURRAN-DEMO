/* Pristine 07:20 fixture for the Colm Curran demo.
   Real: Colm Curran's name, the trading name, Co. Kerry base, the service list.
   Everything else (people other than Colm, customers, jobs, amounts, dates,
   messages) is FICTIONAL and illustrative. Addresses use example.com. */
import type {
  AgentAction, AgentDef, Allocation, AuditEvent, ClockEvent, Company, ContractorLine, Customer,
  DayRecord, DemoData, Doc, Draft, Enquiry, Invoice, Issue, Job, Message, Payment, Person, Policy,
  QSEstimate, Quote, Site, Task, TimesheetException, Absence
} from "./types";

export const DEMO_DATE = "2026-11-18";
export const DEMO_TIME = "07:20";
export const DEMO_DAY_LABEL = "Wednesday 18 November 2026";

const company: Company = {
  tradingName: "Colm Curran Roofing & Building Contractor",
  region: "County Kerry, Ireland",
  base: "Co. Kerry",
  coverage: "Kerry and beyond (Limerick, Cork, Clare)",
  services: [
    "Pitched & hand-cut roofs", "Roof trusses", "Flat roofing", "Re-roofing", "Slating & tiling",
    "Roof maintenance", "Renovations", "New builds", "Insurance works"
  ],
  md: "Colm Curran",
  website: "colmcurran.com",
  demoDate: DEMO_DATE,
  demoTime: DEMO_TIME,
  timezone: "Europe/Dublin"
};

const phone = "087 ••• ••••";
const mail = (n: string) => n.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".") + "@example.com";

const field = (id: string, name: string, role: string, site: string, since: string, tickets: string[], avg: number): Person =>
  ({ id, name, role, kind: "field", phone, email: mail(name), homeSiteId: site, startedWith: since, tickets, avgWeekHours: avg });

const people: Person[] = [
  field("P01", "John Murphy", "Roofer", "SITE-CAP", "2021", ["Safe Pass", "Working at height"], 39.5),
  field("P02", "Liam Walsh", "Lead roofer", "SITE-CAP", "2016", ["Safe Pass", "Working at height", "First aid", "MEWP"], 42.0),
  field("P03", "Sean O'Connor", "Carpenter", "SITE-CAP", "2019", ["Safe Pass", "Working at height"], 40.0),
  field("P04", "Patrick O'Sullivan", "Roofer", "SITE-CAP", "2020", ["Safe Pass", "Working at height"], 40.5),
  field("P05", "Declan Foley", "Apprentice", "SITE-CAP", "2025", ["Safe Pass"], 38.0),
  field("P06", "Thomas Kelly", "Roofer", "SITE-CAP", "2018", ["Safe Pass", "Working at height"], 40.0),
  field("P07", "Michael Casey", "Roofer", "SITE-CAP", "2022", ["Safe Pass", "Working at height"], 39.0),
  field("P08", "Daniel Fitzgerald", "Foreman", "SITE-TRA", "2015", ["Safe Pass", "Working at height", "First aid", "SSWP"], 43.5),
  field("P09", "Michael Hayes", "Roofer", "SITE-TRA", "2019", ["Safe Pass", "Working at height"], 40.0),
  field("P10", "Shane McCarthy", "Roofer", "SITE-TRA", "2023", ["Safe Pass", "Working at height"], 38.5),
  field("P11", "Ryan O'Shea", "Carpenter", "SITE-TRA", "2020", ["Safe Pass", "Working at height"], 40.0),
  field("P12", "Conor O'Brien", "Roofer", "SITE-TRA", "2021", ["Safe Pass", "Working at height", "Torch-on membrane"], 40.5),
  field("P13", "Kevin O'Donoghue", "Site supervisor", "SITE-KIL", "2014", ["Safe Pass", "Working at height", "First aid", "SSSP"], 42.5),
  field("P14", "Brian Reilly", "Roofer", "SITE-KIL", "2019", ["Safe Pass", "Working at height"], 40.0),
  field("P15", "Niall O'Leary", "Roofer", "SITE-KIL", "2022", ["Safe Pass", "Working at height"], 39.5),
  field("P16", "Alan Brennan", "Apprentice", "SITE-KIL", "2025", ["Safe Pass"], 38.0),
  field("P17", "Mark Daly", "Roofer", "SITE-TRA", "2017", ["Safe Pass", "Working at height"], 40.0),
  field("P18", "James Collins", "Carpenter", "SITE-KIL", "2018", ["Safe Pass (renew by 30 Nov)", "Working at height"], 39.0),
  { id: "P19", name: "Colm Curran", role: "Owner / Managing Director", kind: "office", phone, email: "colm@example.com", startedWith: "Founder", tickets: [], avgWeekHours: 0 },
  { id: "P20", name: "Aoife O'Shea", role: "Office administrator", kind: "office", phone, email: "office@example.com", startedWith: "2020", tickets: [], avgWeekHours: 0 },
  { id: "P21", name: "Eoin McCarthy", role: "Quantity surveyor (external)", kind: "external", phone, email: "qs@example.com", startedWith: "2019", tickets: [], avgWeekHours: 0 }
];

const customers: Customer[] = [
  { id: "CUS-CHD", name: "Cappamore Housing Developments", type: "Main contractor / developer", contact: "Gerard Ryan", contactRole: "Site manager",
    email: "g.ryan@cappamorehousing.example", source: "Repeat customer", county: "Limerick", note: "Hourly-rate dayworks on Block C plus the fixed roof package. Their site register is the main-contractor sheet." },
  { id: "CUS-TCP", name: "Tralee Commercial Property Ltd", type: "Commercial landlord", contact: "Siobhán Horan", contactRole: "Property manager",
    email: "s.horan@traleecommercial.example", source: "Referral", county: "Kerry", note: "Occupied units. Tenant access windows matter." },
  { id: "CUS-KRM", name: "Killarney Residential Management", type: "Property management company", contact: "Denis Cronin", contactRole: "Estate manager",
    email: "d.cronin@killarneyresidential.example", source: "Repeat customer", county: "Kerry", note: "Pays on time. Referred Castleisland and Killorglin work." },
  { id: "CUS-KHL", name: "Killorglin Homes Ltd", type: "Developer", contact: "Pádraig Sheehan", contactRole: "Director",
    email: "p.sheehan@killorglinhomes.example", source: "Referral", county: "Kerry", note: "8-house scheme. First job with them." },
  { id: "CUS-CPG", name: "Castleisland Property Group", type: "Commercial owner", contact: "Maura Brosnan", contactRole: "Development manager",
    email: "m.brosnan@castleislandproperty.example", source: "Referral", county: "Kerry", note: "Two-storey commercial building, full strip and re-slate." },
  { id: "CUS-SPM", name: "Shannon Property Maintenance Ltd", type: "Maintenance contractor", contact: "Ciarán Doyle", contactRole: "Contracts manager",
    email: "c.doyle@shannonpm.example", source: "Repeat customer", county: "Limerick", note: "12-month planned maintenance across 34 properties." }
];

const sites: Site[] = [
  { id: "SITE-CAP", name: "Cappamore", town: "Cappamore", county: "Co. Limerick", jobId: "JOB-101", leadId: "P02", geofenceM: 150, access: "Main contractor compound, sign in at CHD cabin" },
  { id: "SITE-TRA", name: "Tralee", town: "Tralee", county: "Co. Kerry", jobId: "JOB-102", leadId: "P08", geofenceM: 120, access: "Units 1–4 rear yard, tenant access from 08:00" },
  { id: "SITE-KIL", name: "Killarney", town: "Killarney", county: "Co. Kerry", jobId: "JOB-103", leadId: "P13", geofenceM: 200, access: "Residential estate, park on service road" }
];

const jobs: Job[] = [
  { id: "JOB-101", title: "Cappamore Housing Roof Package", customerId: "CUS-CHD", siteId: "SITE-CAP", type: "New build roof package",
    scope: "Trusses, membrane, battens and slate to Blocks A–C (22 houses), fascia, soffit and rainwater goods. Block C extras on hourly dayworks.",
    contractValue: 168000, pctComplete: 64, plannedPct: 66, status: "On programme", start: "2026-09-07", finish: "2026-12-18",
    billing: "Monthly payment applications + hourly dayworks against the main contractor's register", quoteId: "QUO-171",
    milestones: [
      { name: "Block A trusses & felt", planned: "2026-09-25", forecast: "2026-09-24", done: true, plannedPct: 18 },
      { name: "Block A slated", planned: "2026-10-16", forecast: "2026-10-15", done: true, plannedPct: 36 },
      { name: "Block B slated", planned: "2026-11-06", forecast: "2026-11-09", done: true, plannedPct: 58 },
      { name: "Block C slating complete", planned: "2026-11-27", forecast: "2026-11-30", done: false, plannedPct: 82 },
      { name: "Fascia, soffit & gutters", planned: "2026-12-11", forecast: "2026-12-14", done: false, plannedPct: 96 },
      { name: "Snag & hand-over", planned: "2026-12-18", forecast: "2026-12-18", done: false, plannedPct: 100 }
    ],
    budgetCost: { labour: 70400, material: 52800, subcontract: 11200 },
    costToDate: { labour: 46100, material: 35600, subcontract: 6500 } },
  { id: "JOB-102", title: "Tralee Commercial Roofing", customerId: "CUS-TCP", siteId: "SITE-TRA", type: "Commercial re-roof & flat roofing",
    scope: "Torch-on membrane to Units 1–3 flat roofs, strip and re-slate the Unit 2 pitched section, new rooflights.",
    contractValue: 92000, pctComplete: 42, plannedPct: 45, status: "At risk", start: "2026-10-12", finish: "2027-01-29",
    billing: "Fixed price, monthly payment applications", quoteId: "QUO-183",
    milestones: [
      { name: "Unit 1 membrane", planned: "2026-10-30", forecast: "2026-10-30", done: true, plannedPct: 22 },
      { name: "Unit 2 pitched strip-out", planned: "2026-11-13", forecast: "2026-11-13", done: true, plannedPct: 38 },
      { name: "Unit 2 membrane", planned: "2026-11-25", forecast: "2026-11-27", done: false, plannedPct: 52 },
      { name: "Unit 3 membrane & rooflights", planned: "2026-12-18", forecast: "2026-12-18", done: false, plannedPct: 78 },
      { name: "Unit 2 re-slate & hand-over", planned: "2027-01-29", forecast: "2027-01-29", done: false, plannedPct: 100 }
    ],
    budgetCost: { labour: 38600, material: 29400, subcontract: 5600 },
    costToDate: { labour: 15400, material: 13900, subcontract: 2800 } },
  { id: "JOB-103", title: "Killarney Re-roofing Programme", customerId: "CUS-KRM", siteId: "SITE-KIL", type: "Re-roofing",
    scope: "Strip and re-slate 6 houses, new ridge, leadwork and valleys. Timber repairs at day rate if found.",
    contractValue: 38000, pctComplete: 75, plannedPct: 72, status: "Ahead", start: "2026-10-05", finish: "2026-12-04",
    billing: "Fixed price, stage payments per house", quoteId: "QUO-188",
    milestones: [
      { name: "Houses 1–2", planned: "2026-10-16", forecast: "2026-10-15", done: true, plannedPct: 33 },
      { name: "Houses 3–4", planned: "2026-11-02", forecast: "2026-10-30", done: true, plannedPct: 66 },
      { name: "House 5 ridge & leadwork", planned: "2026-11-20", forecast: "2026-11-17", done: true, plannedPct: 80 },
      { name: "House 6 strip & re-slate", planned: "2026-12-01", forecast: "2026-12-01", done: false, plannedPct: 96 },
      { name: "Snag & hand-over", planned: "2026-12-04", forecast: "2026-12-04", done: false, plannedPct: 100 }
    ],
    budgetCost: { labour: 16200, material: 11400, subcontract: 1700 },
    costToDate: { labour: 12600, material: 8900, subcontract: 1100 } }
];

/* Week roster (Mon 16 – Fri 20 Nov). Mark Daly on leave 17–19, James Collins off on the 18th,
   Michael Casey moves to Tralee for Thursday/Friday membrane work. */
const CREW: Record<string, string[]> = {
  "SITE-CAP": ["P01", "P02", "P03", "P04", "P05", "P06", "P07"],
  "SITE-TRA": ["P08", "P09", "P10", "P11", "P12"],
  "SITE-KIL": ["P13", "P14", "P15", "P16"]
};
const ROLE_OF = (id: string) => people.find(p => p.id === id)!.role;
const WEEK = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];
const allocations: Allocation[] = [];
WEEK.forEach(date => {
  Object.entries(CREW).forEach(([siteId, ids]) => {
    ids.forEach(pid => {
      let s = siteId;
      if (pid === "P07" && (date === "2026-11-19" || date === "2026-11-20")) s = "SITE-TRA";
      allocations.push({ id: `AL-${date.slice(8)}-${pid}`, personId: pid, siteId: s, date, start: "07:00", role: ROLE_OF(pid) });
    });
  });
  if (date === "2026-11-16" || date === "2026-11-20") allocations.push({ id: `AL-${date.slice(8)}-P17`, personId: "P17", siteId: "SITE-TRA", date, start: "07:00", role: "Roofer" });
  if (date !== "2026-11-18") allocations.push({ id: `AL-${date.slice(8)}-P18`, personId: "P18", siteId: "SITE-KIL", date, start: "07:00", role: "Carpenter" });
});

/* Today's clock-in events as of 07:20. John Murphy has none. */
const TODAY_IN: [string, string, string, string?][] = [
  ["P02", "06:54", "SITE-CAP"], ["P03", "06:58", "SITE-CAP"], ["P04", "06:56", "SITE-CAP"], ["P05", "07:14", "SITE-CAP"],
  ["P06", "06:51", "SITE-CAP"], ["P07", "06:55", "SITE-CAP"],
  ["P08", "06:57", "SITE-TRA"], ["P09", "06:53", "SITE-TRA"], ["P10", "07:11", "SITE-TRA"], ["P11", "06:59", "SITE-TRA"], ["P12", "06:52", "SITE-TRA"],
  ["P13", "06:48", "SITE-KIL"], ["P14", "06:56", "SITE-KIL"], ["P15", "06:58", "SITE-KIL"], ["P16", "06:50", "SITE-KIL", "foreman"]
];
const clockEvents: ClockEvent[] = TODAY_IN.map(([pid, time, siteId, how]) => how === "foreman"
  ? { id: `CE-18-${pid}-in`, personId: pid, siteId, date: DEMO_DATE, type: "in", time, source: "Foreman entry", location: "Not captured", verified: true,
      note: "Phone battery dead. Kevin O'Donoghue entered the arrival from site at 06:52." }
  : { id: `CE-18-${pid}-in`, personId: pid, siteId, date: DEMO_DATE, type: "in", time, source: "Mobile clock-in", location: "Inside site boundary", verified: true });

/* Mon 16 and Tue 17: completed days from clock events. */
const dayRecords: DayRecord[] = [];
const PAST: Record<string, { in: string; out: string }> = {
  P01: { in: "06:58", out: "15:28" }, P02: { in: "06:50", out: "15:50" }, P03: { in: "06:57", out: "15:27" }, P04: { in: "06:56", out: "15:26" },
  P05: { in: "06:59", out: "15:29" }, P06: { in: "06:52", out: "15:22" }, P07: { in: "06:55", out: "15:25" },
  P08: { in: "06:55", out: "16:25" }, P09: { in: "06:54", out: "15:24" }, P10: { in: "06:59", out: "15:29" }, P11: { in: "06:57", out: "15:27" },
  P12: { in: "06:53", out: "15:23" }, P13: { in: "06:46", out: "15:46" }, P14: { in: "06:55", out: "15:25" }, P15: { in: "06:57", out: "15:27" },
  P16: { in: "06:52", out: "15:22" }, P17: { in: "06:56", out: "15:26" }, P18: { in: "06:58", out: "15:28" }
};
const toMins = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
["2026-11-16", "2026-11-17"].forEach(date => {
  allocations.filter(a => a.date === date).forEach(a => {
    const t = PAST[a.personId];
    const hours = Math.round(((toMins(t.out) - toMins(t.in) - 30) / 60) * 2) / 2;
    const job = sites.find(s => s.id === a.siteId)!.jobId;
    dayRecords.push({ id: `DR-${date.slice(8)}-${a.personId}`, personId: a.personId, jobId: job, date, in: t.in, out: t.out, breakMins: 30, hours,
      source: "Pulse clock events",
      status: date === "2026-11-16" ? (a.personId === "P04" ? "Exception" : "Approved") : "Submitted" });
  });
});

/* Main contractor's register for Cappamore, Mon 16 Nov. One line disagrees. */
const contractorLines: ContractorLine[] = CREW["SITE-CAP"].map(pid => ({
  id: `CL-16-${pid}`, personId: pid, jobId: "JOB-101", date: "2026-11-16",
  hours: pid === "P04" ? 10 : dayRecords.find(d => d.date === "2026-11-16" && d.personId === pid)!.hours,
  sheetRef: "CHD site register wk 47, p.1"
}));

const exceptions: TimesheetException[] = [{
  id: "EXC-401", personId: "P04", jobId: "JOB-101", date: "2026-11-16", internalHours: 8, contractorHours: 10,
  status: "Open", lifecycle: "Awaiting approval", detectedBy: "Timesheet Agent",
  notes: "Main contractor's register shows 07:00–17:00 with no break deducted. Pulse clock events show 06:56–15:26 with a 30-minute break. The rest of the Cappamore crew match to the half hour.",
  evidence: [
    { label: "Pulse clock-in", detail: "Mon 16 Nov 06:56 · mobile · inside site boundary" },
    { label: "Pulse clock-out", detail: "Mon 16 Nov 15:26 · mobile · inside site boundary" },
    { label: "Internal day sheet", detail: "8.0h signed by Liam Walsh (lead roofer)", docId: "DOC-TS-INT-16" },
    { label: "Main contractor register", detail: "10.0h, 07:00–17:00, line 4", docId: "DOC-TS-CHD-47" },
    { label: "Site diary (Liam Walsh)", detail: "Crew stood down 15:30 on Block C, wind gusting at eaves level" },
    { label: "Same-day crew comparison", detail: "6 of 7 Cappamore lines match exactly" }
  ],
  history: [
    { at: "2026-11-17T16:50", actor: "System", text: "Main contractor register wk 47 imported (16 Nov page)" },
    { at: "2026-11-17T17:02", actor: "Timesheet Agent", text: "Variance detected: +2.0h on Patrick O'Sullivan, 16 Nov" },
    { at: "2026-11-17T17:03", actor: "Timesheet Agent", text: "Routed to Aoife O'Shea and Colm Curran for review. Payroll line held." },
    { at: "2026-11-17T16:42", actor: "Gerard Ryan (CHD)", text: "Emailed asking to confirm Monday's hours before dayworks are processed" }
  ]
}];

const enquiries: Enquiry[] = [
  { id: "ENQ-501", customerId: "CUS-KHL", title: "Killorglin Housing Roof Package", channel: "Phone call", source: "Referral", referredBy: "Killarney Residential Management",
    receivedAt: "2026-10-27T18:05", callNote: "Pádraig Sheehan rang Colm. 8 semi-detached houses, trusses in, needs full roof package from felt up. Will email drawings.",
    drawingsAt: "2026-10-28T09:40", quoteId: "QUO-201", stage: "Follow-up",
    checklist: [{ label: "Call logged", done: true }, { label: "Drawings received", done: true }, { label: "Handed to QS", done: true }, { label: "Estimate reviewed by Colm", done: true }, { label: "Quote issued", done: true }] },
  { id: "ENQ-502", customerId: "CUS-CPG", title: "Castleisland Roof Replacement", channel: "Phone call", source: "Referral", referredBy: "Killarney Residential Management",
    receivedAt: "2026-11-13T18:20", callNote: "Maura Brosnan. Two-storey commercial building, roughly 210 m², full strip and re-slate. Drawings Monday.",
    drawingsAt: "2026-11-16T10:02", quoteId: "QUO-202", stage: "With QS",
    checklist: [{ label: "Call logged", done: true }, { label: "Drawings received", done: true }, { label: "Handed to QS", done: true }, { label: "Site measurements", done: false }, { label: "Estimate reviewed by Colm", done: false }, { label: "Quote issued", done: false }] },
  { id: "ENQ-503", customerId: "CUS-SPM", title: "Limerick Maintenance Contract", channel: "Phone call", source: "Repeat customer",
    receivedAt: "2026-11-03T12:30", callNote: "Ciarán Doyle. 12-month planned maintenance, 34 properties around Limerick. Schedule of properties to follow by email.",
    drawingsAt: "2026-11-04T08:55", quoteId: "QUO-203", stage: "Sent",
    checklist: [{ label: "Call logged", done: true }, { label: "Property schedule received", done: true }, { label: "Priced", done: true }, { label: "Quote issued", done: true }] },
  { id: "ENQ-504", customerId: "CUS-KRM", title: "Muckross Road block re-roof", channel: "Phone call", source: "Repeat customer",
    receivedAt: "2026-11-17T18:40", callNote: "Denis Cronin rang. Apartment block on Muckross Road, slipped slates and moss, wants a price for a re-roof in spring. Will send drawings.",
    stage: "New Enquiry",
    checklist: [{ label: "Call logged", done: true }, { label: "Drawings received", done: false }, { label: "Handed to QS", done: false }] },
  { id: "ENQ-505", customerId: "CUS-TCP", title: "Unit 4 storm damage (insurance works)", channel: "Email", source: "Repeat customer",
    receivedAt: "2026-11-17T11:30", callNote: "Siobhán Horan emailed the assessor's report and photos for Unit 4. Insurance repair, scope to be priced against the report.",
    drawingsAt: "2026-11-17T11:30", stage: "Drawings Received",
    checklist: [{ label: "Enquiry logged", done: true }, { label: "Assessor report + photos received", done: true }, { label: "Handed to QS", done: false }] }
];

const documents: Doc[] = [
  { id: "DOC-202A", title: "Castleisland roof plan", kind: "Drawing", version: "Rev A", date: "2026-11-16", by: "Maura Brosnan (CPG)", size: "2.4 MB · 3 sheets", quoteId: "QUO-202", customerId: "CUS-CPG", note: "Superseded by Rev B.", supersededBy: "DOC-202B" },
  { id: "DOC-202B", title: "Castleisland roof plan & rear elevation", kind: "Drawing", version: "Rev B", date: "2026-11-17", by: "Maura Brosnan (CPG)", size: "2.9 MB · 4 sheets", quoteId: "QUO-202", customerId: "CUS-CPG", note: "Rear elevation revised. Hip and valley lengths need checking on site." },
  { id: "DOC-EST-202", title: "QS estimate, Castleisland", kind: "QS estimate", version: "v0.3", date: "2026-11-18", by: "Eoin McCarthy (QS)", size: "Pulse record", quoteId: "QUO-202", customerId: "CUS-CPG", note: "Indicative. Awaiting site measurements." },
  { id: "DOC-201C", title: "Killorglin house type A roof plan", kind: "Drawing", version: "Rev C", date: "2026-10-28", by: "Pádraig Sheehan (KHL)", size: "3.1 MB · 6 sheets", quoteId: "QUO-201", customerId: "CUS-KHL", note: "8 units, same house type." },
  { id: "DOC-EST-201", title: "QS takeoff, Killorglin", kind: "QS estimate", version: "v1.0 final", date: "2026-11-05", by: "Eoin McCarthy (QS)", size: "Pulse record", quoteId: "QUO-201", customerId: "CUS-KHL", note: "Final, approved by Colm 6 Nov." },
  { id: "DOC-203S", title: "Shannon PM property schedule", kind: "Specification", version: "v1", date: "2026-11-04", by: "Ciarán Doyle (SPM)", size: "XLSX · 34 rows", quoteId: "QUO-203", customerId: "CUS-SPM", note: "34 properties, Limerick city and county." },
  { id: "DOC-505R", title: "Unit 4 assessor's report + photos", kind: "Specification", version: "v1", date: "2026-11-17", by: "Siobhán Horan (TCP)", size: "PDF + 14 photos", customerId: "CUS-TCP", note: "Insurance works. Not yet with the QS." },
  { id: "DOC-PRG-101", title: "Cappamore programme", kind: "Programme", version: "v4", date: "2026-11-09", by: "Colm Curran", size: "PDF · 2 pages", jobId: "JOB-101", customerId: "CUS-CHD", note: "Block C slating forecast moved 3 days after Block B." },
  { id: "DOC-SC-101", title: "Daily safety checklist, Cappamore", kind: "Safety checklist", version: "18 Nov", date: "2026-11-18", by: "Liam Walsh", size: "Pulse form", jobId: "JOB-101", note: "Completed 06:58. Scaffold tagged, harness points checked." },
  { id: "DOC-SC-102", title: "Working at height permit, Tralee Unit 2", kind: "Safety checklist", version: "18 Nov", date: "2026-11-18", by: "Daniel Fitzgerald", size: "Pulse form", jobId: "JOB-102", note: "Issued 07:02. Wind check due 12:00." },
  { id: "DOC-SC-103", title: "Daily safety checklist, Killarney", kind: "Safety checklist", version: "18 Nov", date: "2026-11-18", by: "Kevin O'Donoghue", size: "Pulse form", jobId: "JOB-103", note: "Completed 06:55." },
  { id: "DOC-PH-103", title: "House 6 rafters at eaves", kind: "Site photo", version: "6 photos", date: "2026-11-17", by: "Kevin O'Donoghue", size: "6 × JPG", jobId: "JOB-103", note: "Soft timber at the eaves on the rear slope." },
  { id: "DOC-PH-101", title: "Block C progress", kind: "Site photo", version: "9 photos", date: "2026-11-17", by: "Liam Walsh", size: "9 × JPG", jobId: "JOB-101", note: "Battens complete on C1–C4." },
  { id: "DOC-TS-INT-16", title: "Internal day sheet, Cappamore, Mon 16 Nov", kind: "Timesheet", version: "Scan", date: "2026-11-17", by: "Aoife O'Shea", size: "PDF · 1 page", jobId: "JOB-101", note: "Signed by Liam Walsh." },
  { id: "DOC-TS-CHD-47", title: "CHD site register wk 47 (16 Nov page)", kind: "Timesheet", version: "Import", date: "2026-11-17", by: "Gerard Ryan (CHD)", size: "PDF · 1 page", jobId: "JOB-101", customerId: "CUS-CHD", note: "Main contractor's register." },
  { id: "DOC-INV-301", title: "INV-301 payment application 3", kind: "Invoice", version: "Issued", date: "2026-10-17", by: "Aoife O'Shea", size: "PDF · 2 pages", jobId: "JOB-101", customerId: "CUS-CHD", note: "Mirrors the QuickBooks invoice (mock)." }
];

const estimates: QSEstimate[] = [{
  id: "EST-202", quoteId: "QUO-202", qsId: "P21", version: "v0.3", status: "Awaiting measurements", basedOn: ["DOC-202B"],
  lines: [
    { item: "Strip existing slates & felt, dispose", type: "Labour", qty: 210, unit: "m²", rate: 14 },
    { item: "Skip hire & disposal", type: "Plant", qty: 3, unit: "no.", rate: 380 },
    { item: "Breathable membrane & treated battens", type: "Material", qty: 210, unit: "m²", rate: 9.5 },
    { item: "Fibre-cement slates", type: "Material", qty: 210, unit: "m²", rate: 28 },
    { item: "Slating labour", type: "Labour", qty: 210, unit: "m²", rate: 22 },
    { item: "Ridge, hips & valleys (from drawings)", type: "Labour", qty: 46, unit: "lm", rate: 48 },
    { item: "Leadwork flashings", type: "Material", qty: 1, unit: "item", rate: 1150 },
    { item: "Fascia, soffit & gutters (uPVC)", type: "Material", qty: 38, unit: "lm", rate: 39 },
    { item: "Scaffold, 4 weeks", type: "Subcontract", qty: 1, unit: "item", rate: 1450 },
    { item: "Overheads & margin", type: "Overheads", qty: 1, unit: "item", rate: 1935 }
  ],
  caveats: [
    "Measured from Rev B drawings only. Hip and valley lengths on the rear elevation need a site check.",
    "Assumes rafters are sound. Timber repairs at day rate.",
    "Excludes chimney rebuild and any asbestos survey.",
    "VAT excluded."
  ],
  notes: "Indicative only. Not issued to the customer.",
  history: [
    { at: "2026-11-16T10:20", actor: "Colm Curran", text: "Handed Rev A drawings to Eoin McCarthy (QS)" },
    { at: "2026-11-17T09:20", actor: "Quotation Agent", text: "Rev B received and logged. Rev A marked superseded." },
    { at: "2026-11-18T06:48", actor: "Eoin McCarthy", text: "Draft v0.3 at €24,800 indicative. Needs site measurements before it is firmed up." }
  ]
}];

const quotes: Quote[] = [
  { id: "QUO-201", title: "Killorglin Housing Roof Package", customerId: "CUS-KHL", value: 76500, indicative: false, stage: "Follow-up", enquiryId: "ENQ-501",
    sentDate: "2026-11-09", followUpDue: "2026-11-18", drawingIds: ["DOC-201C", "DOC-EST-201"],
    lines: [
      { item: "Truss installation & bracing, 8 units", amount: 18400 },
      { item: "Membrane, battens & fibre-cement slate, 8 units", amount: 34800 },
      { item: "Ridge, hips & leadwork", amount: 8200 },
      { item: "Fascia, soffit & rainwater goods", amount: 9600 },
      { item: "Rooflights, 16 no.", amount: 3200 },
      { item: "Preliminaries & site set-up", amount: 2300 }
    ], note: "Valid 30 days. No response since it was sent." },
  { id: "QUO-202", title: "Castleisland Roof Replacement", customerId: "CUS-CPG", value: 24800, indicative: true, stage: "With QS", enquiryId: "ENQ-502",
    drawingIds: ["DOC-202A", "DOC-202B", "DOC-EST-202"], estimateId: "EST-202", lines: [],
    note: "Indicative QS estimate. Not a formal quote and not issued." },
  { id: "QUO-203", title: "Limerick Maintenance Contract", customerId: "CUS-SPM", value: 42000, indicative: false, stage: "Sent", enquiryId: "ENQ-503",
    sentDate: "2026-11-14", followUpDue: "2026-11-18", drawingIds: ["DOC-203S"],
    lines: [
      { item: "Annual roof inspections, 34 properties", amount: 8840 },
      { item: "Gutter clean & minor repairs, 34 properties", amount: 10540 },
      { item: "Reactive repairs allowance", amount: 18000 },
      { item: "Emergency call-out retainer", amount: 4620 }
    ], note: "12-month term. Follow-up due today." },
  { id: "QUO-188", title: "Killarney Re-roofing Programme", customerId: "CUS-KRM", value: 38000, indicative: false, stage: "Won", sentDate: "2026-09-15", drawingIds: [], jobId: "JOB-103",
    lines: [{ item: "Strip & re-slate 6 houses", amount: 38000 }], note: "Won 22 Sep. Became JOB-103." },
  { id: "QUO-183", title: "Tralee Commercial Roofing", customerId: "CUS-TCP", value: 92000, indicative: false, stage: "Won", sentDate: "2026-09-01", drawingIds: [], jobId: "JOB-102",
    lines: [{ item: "Membrane, re-slate and rooflights", amount: 92000 }], note: "Won 18 Sep. Became JOB-102." },
  { id: "QUO-171", title: "Cappamore Housing Roof Package", customerId: "CUS-CHD", value: 168000, indicative: false, stage: "Won", sentDate: "2026-07-20", drawingIds: [], jobId: "JOB-101",
    lines: [{ item: "Roof package, Blocks A–C", amount: 168000 }], note: "Won 4 Aug. Became JOB-101." },
  { id: "QUO-195", title: "Dingle holiday homes re-roof", customerId: "CUS-KRM", value: 51200, indicative: false, stage: "Lost", sentDate: "2026-10-02", drawingIds: [],
    lines: [{ item: "Re-roof 4 holiday homes", amount: 51200 }], note: "Lost 21 Oct.", lostReason: "Client deferred the work to 2027" }
];

const invoices: Invoice[] = [
  { id: "INV-301", customerId: "CUS-CHD", jobId: "JOB-101", amount: 24600, ref: "Payment application 3", issued: "2026-10-17", due: "2026-10-31" },
  { id: "INV-302", customerId: "CUS-TCP", jobId: "JOB-102", amount: 13200, ref: "Payment application 1", issued: "2026-10-28", due: "2026-11-25" },
  { id: "INV-303", customerId: "CUS-KRM", jobId: "JOB-103", amount: 8750, ref: "Stage payment, houses 3–4", issued: "2026-10-23", due: "2026-11-20", paidDate: "2026-11-13" }
];
const payments: Payment[] = [{ id: "PAY-901", invoiceId: "INV-303", amount: 8750, date: "2026-11-13", method: "Bank transfer (remittance matched)" }];

const L = (kind: any, id: string) => ({ kind, id });

const messages: Message[] = [
  { id: "MSG-01", channel: "Text", from: "Liam Walsh", fromRole: "Lead roofer, Cappamore", to: "Colm Curran", subject: "John not here yet",
    body: "No sign of John yet, not answering his phone. Rest of the crew are on Block C.", at: "2026-11-18T07:16", category: "Attendance",
    priority: true, needsColm: true, rank: 1, why: "John Murphy was scheduled 07:00 at Cappamore and has no clock-in.", linked: [L("person", "P01"), L("job", "JOB-101")],
    customerId: "CUS-CHD", awaiting: "Supervisor", read: false },
  { id: "MSG-02", channel: "Email", from: "Gerard Ryan", fromRole: "Site manager, Cappamore Housing Developments", to: "Colm Curran", subject: "Week 47 register: please confirm Monday hours",
    body: "Our register has Patrick O'Sullivan on site 07:00 to 17:00 on Monday, 10 hours. Your sheet shows 8. Can you confirm before we process the dayworks?",
    at: "2026-11-17T16:42", category: "Timesheet", priority: true, needsColm: true, rank: 2, why: "Same line as open exception EXC-401 (+2.0h).",
    linked: [L("exception", "EXC-401"), L("person", "P04"), L("job", "JOB-101")], customerId: "CUS-CHD", awaiting: "Customer", read: false },
  { id: "MSG-03", channel: "Email", from: "Aoife O'Shea", fromRole: "Office administrator", to: "Colm Curran", subject: "Cappamore payment application 3 still unpaid",
    body: "INV-301 (€24,600) was due 31 October. Nothing in the bank as of last night's QuickBooks export. There's a reminder drafted if you want it to go.",
    at: "2026-11-18T07:05", category: "Payment", priority: true, needsColm: true, rank: 3, why: "INV-301 is 18 days overdue. Largest balance owed.",
    linked: [L("invoice", "INV-301"), L("job", "JOB-101"), L("customer", "CUS-CHD"), L("draft", "DRF-01")], customerId: "CUS-CHD", awaiting: "Payment", read: false },
  { id: "MSG-04", channel: "Email", from: "Colm Curran (sent)", fromRole: "To Pádraig Sheehan, Killorglin Homes", to: "Pádraig Sheehan", subject: "Quotation QUO-201: Killorglin Housing Roof Package",
    body: "Pádraig, please find attached our quotation for the 8-house roof package, €76,500 ex VAT. Happy to walk the site with you. Colm",
    at: "2026-11-09T17:30", category: "Quote", priority: true, needsColm: true, rank: 4, why: "No reply in 9 days on a €76,500 quote. Follow-up due today.",
    linked: [L("quote", "QUO-201"), L("customer", "CUS-KHL"), L("draft", "DRF-02")], customerId: "CUS-KHL", awaiting: "Customer", read: true },
  { id: "MSG-05", channel: "Email", from: "Eoin McCarthy", fromRole: "Quantity surveyor", to: "Colm Curran", subject: "Castleisland: Rev B drawings, need site measures",
    body: "Got Rev B. The hip and valley lengths on the rear elevation don't scale reliably. I can hold the draft at €24,800 indicative but need measurements before I firm it up. Can someone get up there this week?",
    at: "2026-11-18T06:48", category: "Drawings", priority: true, needsColm: true, rank: 5, why: "QS is blocked on QUO-202 until someone measures on site.",
    linked: [L("quote", "QUO-202"), L("estimate", "EST-202"), L("document", "DOC-202B"), L("draft", "DRF-03")], customerId: "CUS-CPG", awaiting: "QS", read: false },
  { id: "MSG-06", channel: "Email", from: "Maura Brosnan", fromRole: "Castleisland Property Group", to: "Colm Curran", subject: "Revised roof drawings (Rev B)",
    body: "The architect updated the rear elevation. Rev B attached, it supersedes Monday's set.", at: "2026-11-17T09:14", category: "Drawings", priority: false, needsColm: false, rank: 30,
    why: "Logged against QUO-202. Rev A marked superseded.", linked: [L("quote", "QUO-202"), L("document", "DOC-202B")], customerId: "CUS-CPG", awaiting: "QS", read: true },
  { id: "MSG-07", channel: "Email", from: "Maura Brosnan", fromRole: "Castleisland Property Group", to: "Colm Curran", subject: "Castleisland roof replacement: drawings",
    body: "Following my call with Colm on Friday, drawings attached.", at: "2026-11-16T10:02", category: "Drawings", priority: false, needsColm: false, rank: 40,
    why: "Drawings filed and handed to the QS.", linked: [L("enquiry", "ENQ-502"), L("document", "DOC-202A")], customerId: "CUS-CPG", awaiting: null, read: true },
  { id: "MSG-08", channel: "Call note", from: "Colm Curran (logged call)", fromRole: "Call with Maura Brosnan", to: "Pulse", subject: "Castleisland roof replacement enquiry",
    body: "Two-storey commercial building, about 210 m², full strip and re-slate. Referred by Killarney Residential. Drawings Monday.", at: "2026-11-13T18:20", category: "Enquiry",
    priority: false, needsColm: false, rank: 45, why: "Manually logged call note.", linked: [L("enquiry", "ENQ-502")], customerId: "CUS-CPG", awaiting: null, read: true },
  { id: "MSG-09", channel: "Email", from: "Colm Curran (sent)", fromRole: "To Ciarán Doyle, Shannon PM", to: "Ciarán Doyle", subject: "Quotation QUO-203: Limerick maintenance contract",
    body: "Ciarán, quotation attached for the 12-month maintenance contract across the 34 properties, €42,000 ex VAT.", at: "2026-11-14T09:40", category: "Quote",
    priority: false, needsColm: false, rank: 12, why: "Follow-up due today (4 days).", linked: [L("quote", "QUO-203"), L("customer", "CUS-SPM")], customerId: "CUS-SPM", awaiting: "Customer", read: true },
  { id: "MSG-10", channel: "Email", from: "Siobhán Horan", fromRole: "Tralee Commercial Property", to: "Colm Curran", subject: "Unit 2 access Thursday",
    body: "The tenant in Unit 2 asks that no work starts before 08:00 on Thursday.", at: "2026-11-17T14:05", category: "Site", priority: false, needsColm: false, rank: 15,
    why: "Daniel Fitzgerald to confirm the Thursday start.", linked: [L("job", "JOB-102")], customerId: "CUS-TCP", awaiting: "Supervisor", read: false },
  { id: "MSG-11", channel: "Text", from: "Daniel Fitzgerald", fromRole: "Foreman, Tralee", to: "Colm Curran", subject: "Tralee this morning",
    body: "All on site bar Shane, he's 10 mins out. Membrane delivery moved to Friday.", at: "2026-11-18T06:59", category: "Site", priority: false, needsColm: false, rank: 10,
    why: "Explains Shane McCarthy's late arrival. Delivery slip logged as ISS-3.", linked: [L("job", "JOB-102"), L("person", "P10"), L("issue", "ISS-3")], customerId: "CUS-TCP", awaiting: null, read: false },
  { id: "MSG-12", channel: "Text", from: "Kevin O'Donoghue", fromRole: "Site supervisor, Killarney", to: "Colm Curran", subject: "House 5 done, House 6 rafters",
    body: "House 5 ridge done. House 6 rafters soft at the eaves, photos uploaded.", at: "2026-11-17T16:30", category: "Site", priority: false, needsColm: false, rank: 11,
    why: "Day-rate timber repair needs the customer's OK (ISS-5).", linked: [L("job", "JOB-103"), L("issue", "ISS-5"), L("document", "DOC-PH-103")], customerId: "CUS-KRM", awaiting: "Customer", read: true },
  { id: "MSG-13", channel: "Email", from: "Denis Cronin", fromRole: "Killarney Residential Management", to: "Aoife O'Shea", subject: "Remittance: INV-303",
    body: "€8,750 paid today by EFT.", at: "2026-11-13T11:20", category: "Payment", priority: false, needsColm: false, rank: 60,
    why: "Matched to INV-303. Paid.", linked: [L("invoice", "INV-303"), L("customer", "CUS-KRM")], customerId: "CUS-KRM", awaiting: null, read: true },
  { id: "MSG-14", channel: "Email", from: "Kerry Roofing Supplies (mock)", fromRole: "Supplier", to: "Aoife O'Shea", subject: "Delivery confirmed: slate for Cappamore Block C",
    body: "Two pallets of fibre-cement slate confirmed for Thursday 19 Nov AM, Cappamore compound.", at: "2026-11-17T15:10", category: "Supplier", priority: false, needsColm: false, rank: 50,
    why: "Matches the Block C programme.", linked: [L("job", "JOB-101")], customerId: undefined, awaiting: null, read: true },
  { id: "MSG-15", channel: "Email", from: "Scaffold hire (mock)", fromRole: "Supplier", to: "Aoife O'Shea", subject: "Tralee Unit 2 scaffold extension",
    body: "Extension to 11 December confirmed at the same weekly rate.", at: "2026-11-16T12:10", category: "Supplier", priority: false, needsColm: false, rank: 55,
    why: "Cost logged against JOB-102 subcontract.", linked: [L("job", "JOB-102")], customerId: undefined, awaiting: null, read: true },
  { id: "MSG-16", channel: "Call note", from: "Colm Curran (logged call)", fromRole: "Call with Denis Cronin", to: "Pulse", subject: "New enquiry: Muckross Road block re-roof",
    body: "Apartment block on Muckross Road, slipped slates and moss. Wants a price for a spring re-roof. Drawings to follow.", at: "2026-11-17T18:40", category: "Enquiry",
    priority: false, needsColm: false, rank: 20, why: "New enquiry from a repeat customer (ENQ-504).", linked: [L("enquiry", "ENQ-504"), L("customer", "CUS-KRM")], customerId: "CUS-KRM", awaiting: "Customer", read: true },
  { id: "MSG-17", channel: "Email", from: "Siobhán Horan", fromRole: "Tralee Commercial Property", to: "Colm Curran", subject: "Unit 4 storm damage: assessor's report + photos",
    body: "Assessor's report and photos for Unit 4 attached. Can you price the repair against it?", at: "2026-11-17T11:30", category: "Enquiry", priority: false, needsColm: false, rank: 18,
    why: "Insurance works enquiry (ENQ-505). Ready for the QS.", linked: [L("enquiry", "ENQ-505"), L("document", "DOC-505R")], customerId: "CUS-TCP", awaiting: "QS", read: true },
  { id: "MSG-18", channel: "Email", from: "Aoife O'Shea", fromRole: "Office administrator", to: "Colm Curran", subject: "Week 46 payroll submitted",
    body: "Hours for week 46 went to payroll. All lines approved, nothing held.", at: "2026-11-16T17:55", category: "Admin", priority: false, needsColm: false, rank: 70,
    why: "For information.", linked: [], awaiting: null, read: true },
  { id: "MSG-19", channel: "Email", from: "Aoife O'Shea", fromRole: "Office administrator", to: "Colm Curran", subject: "QuickBooks invoice export (simulated)",
    body: "Last night's export: INV-301 overdue, INV-302 open, INV-303 paid. No new invoices raised.", at: "2026-11-18T02:05", category: "Payment", priority: false, needsColm: false, rank: 35,
    why: "Mock nightly export. QuickBooks stays the system of record.", linked: [L("invoice", "INV-301"), L("invoice", "INV-302"), L("invoice", "INV-303")], awaiting: null, read: true },
  { id: "MSG-20", channel: "Email", from: "Training reminder (mock)", fromRole: "Compliance", to: "Aoife O'Shea", subject: "Safe Pass renewal: James Collins, 30 Nov",
    body: "James Collins' Safe Pass expires on 30 November. Book a course date.", at: "2026-11-16T09:00", category: "Admin", priority: false, needsColm: false, rank: 25,
    why: "Task created for Aoife.", linked: [L("person", "P18")], awaiting: null, read: true },
  { id: "MSG-21", channel: "Text", from: "Declan Foley", fromRole: "Apprentice, Cappamore", to: "Liam Walsh", subject: "Running late",
    body: "Bus delayed, I'll be there by quarter past.", at: "2026-11-18T07:02", category: "Attendance", priority: false, needsColm: false, rank: 14,
    why: "Explains the 07:14 clock-in.", linked: [L("person", "P05"), L("job", "JOB-101")], customerId: "CUS-CHD", awaiting: null, read: true },
  { id: "MSG-22", channel: "Email", from: "Gerard Ryan", fromRole: "Site manager, Cappamore Housing Developments", to: "Colm Curran", subject: "Rev C eaves detail: Block C",
    body: "Architect to issue Rev C by Thursday. Hold the fascia on Block C until then.", at: "2026-11-16T13:15", category: "Site", priority: false, needsColm: false, rank: 16,
    why: "Blocks the fascia milestone (ISS-2).", linked: [L("job", "JOB-101"), L("issue", "ISS-2")], customerId: "CUS-CHD", awaiting: "Customer", read: true },
  { id: "MSG-23", channel: "Email", from: "Builders merchant newsletter (mock)", fromRole: "Marketing", to: "Colm Curran", subject: "November offers on membranes",
    body: "Seasonal pricing on breathable membranes and battens.", at: "2026-11-17T07:30", category: "Admin", priority: false, needsColm: false, rank: 90,
    why: "Low priority. Filed.", linked: [], awaiting: null, read: true },
  { id: "MSG-24", channel: "Email", from: "Eoin McCarthy", fromRole: "Quantity surveyor", to: "Colm Curran", subject: "Killorglin takeoff final",
    body: "Final takeoff attached, €76,500 including prelims. Same rates as Cappamore.", at: "2026-11-05T15:40", category: "Quote", priority: false, needsColm: false, rank: 65,
    why: "Approved by Colm 6 Nov, issued as QUO-201.", linked: [L("quote", "QUO-201"), L("document", "DOC-EST-201")], customerId: "CUS-KHL", awaiting: null, read: true }
];

const drafts: Draft[] = [
  { id: "DRF-01", kind: "Payment reminder", replyTo: "MSG-03", to: "accounts@cappamorehousing.example", subject: "INV-301 payment application 3: €24,600 now 18 days overdue",
    body: "Hi Gerard,\n\nA reminder that INV-301 (payment application 3, €24,600) for the Cappamore roof package fell due on 31 October and is now 18 days overdue. Could you let me know when it's scheduled for payment?\n\nThe Block C works are on programme and we'd like to keep them that way.\n\nThanks,\nColm Curran",
    status: "Awaiting approval", agentId: "finance", linked: [L("invoice", "INV-301"), L("customer", "CUS-CHD"), L("job", "JOB-101")], createdAt: "2026-11-18T06:30", edited: false },
  { id: "DRF-02", kind: "Quote follow-up", replyTo: "MSG-04", to: "p.sheehan@killorglinhomes.example", subject: "Re: Quotation QUO-201, Killorglin Housing Roof Package",
    body: "Hi Pádraig,\n\nJust following up on the roof package quote I sent on 9 November (€76,500 ex VAT). Happy to answer any questions or walk the site with you this week. We can hold the start window we discussed until the end of the month.\n\nRegards,\nColm",
    status: "Awaiting approval", agentId: "quotation", linked: [L("quote", "QUO-201"), L("customer", "CUS-KHL")], createdAt: "2026-11-18T07:00", edited: false },
  { id: "DRF-03", kind: "Email reply", replyTo: "MSG-05", to: "qs@example.com", subject: "Re: Castleisland: Rev B drawings, need site measures",
    body: "Thanks Eoin. I'll get the rear elevation measured this week and send the hip and valley lengths over. Hold v0.3 at €24,800 indicative until then.\n\nColm",
    status: "Awaiting approval", agentId: "comms", linked: [L("quote", "QUO-202"), L("estimate", "EST-202")], createdAt: "2026-11-18T07:08", edited: false }
];

const tasks: Task[] = [
  { id: "T-01", title: "Confirm John Murphy's attendance at Cappamore", priority: "High", ownerId: "P19", due: "2026-11-18T07:45", dueLabel: "07:45 today", department: "Operations",
    related: [L("person", "P01"), L("job", "JOB-101")], status: "Open" },
  { id: "T-02", title: "Review EXC-401 (Patrick O'Sullivan, +2.0h)", priority: "High", ownerId: "P20", due: "2026-11-18T12:00", dueLabel: "12:00 today", department: "Office",
    related: [L("exception", "EXC-401")], status: "In progress" },
  { id: "T-03", title: "Approve INV-301 payment reminder", priority: "High", ownerId: "P19", due: "2026-11-18T10:00", dueLabel: "10:00 today", department: "Finance",
    related: [L("invoice", "INV-301"), L("draft", "DRF-01")], status: "Open" },
  { id: "T-04", title: "Approve QUO-201 follow-up to Killorglin Homes", priority: "High", ownerId: "P19", due: "2026-11-18T12:00", dueLabel: "Today", department: "Commercial",
    related: [L("quote", "QUO-201"), L("draft", "DRF-02")], status: "Open" },
  { id: "T-05", title: "Arrange site measurements for Castleisland", priority: "Medium", ownerId: "P19", due: "2026-11-20", dueLabel: "Fri 20 Nov", department: "Commercial",
    related: [L("quote", "QUO-202"), L("estimate", "EST-202")], status: "Open" },
  { id: "T-06", title: "Follow up QUO-203 with Shannon PM", priority: "Medium", ownerId: "P19", due: "2026-11-18", dueLabel: "Today", department: "Commercial",
    related: [L("quote", "QUO-203")], status: "Open" },
  { id: "T-07", title: "Submit week 47 hours to payroll", priority: "Medium", ownerId: "P20", due: "2026-11-20", dueLabel: "Fri 20 Nov", department: "Office",
    related: [L("exception", "EXC-401")], status: "Open" },
  { id: "T-08", title: "Get customer OK for House 6 rafter repair", priority: "High", ownerId: "P13", due: "2026-11-19", dueLabel: "Thu 19 Nov", department: "Operations",
    related: [L("issue", "ISS-5"), L("job", "JOB-103")], status: "Open" },
  { id: "T-09", title: "Confirm 08:00 start for Unit 2 on Thursday", priority: "Low", ownerId: "P08", due: "2026-11-18", dueLabel: "Today", department: "Operations",
    related: [L("job", "JOB-102")], status: "Open" },
  { id: "T-10", title: "Book Safe Pass course for James Collins", priority: "Low", ownerId: "P20", due: "2026-11-27", dueLabel: "Fri 27 Nov", department: "Office",
    related: [L("person", "P18")], status: "Open" },
  { id: "T-11", title: "Hand ENQ-505 (Unit 4 storm damage) to the QS", priority: "Medium", ownerId: "P19", due: "2026-11-19", dueLabel: "Thu 19 Nov", department: "Commercial",
    related: [L("enquiry", "ENQ-505")], status: "Open" },
  { id: "T-12", title: "Upload Killarney House 5 completion photos", priority: "Low", ownerId: "P13", due: "2026-11-17", dueLabel: "Done Tue", department: "Operations",
    related: [L("job", "JOB-103")], status: "Done" }
];

const issues: Issue[] = [
  { id: "ISS-1", siteId: "SITE-CAP", title: "No clock-in: John Murphy", detail: "Scheduled 07:00. No clock-in event and no message from John. Liam Walsh tried his phone at 07:15.",
    severity: "Medium", ownerId: "P02", due: "2026-11-18", raised: "2026-11-18T07:16", status: "Open", related: [L("person", "P01")] },
  { id: "ISS-2", siteId: "SITE-CAP", title: "Rev C eaves detail not issued (Block C)", detail: "Architect due to issue Rev C by Thursday. Fascia on Block C held until then.",
    severity: "Medium", ownerId: "P19", due: "2026-11-19", raised: "2026-11-16T13:15", status: "Open", related: [L("message", "MSG-22")] },
  { id: "ISS-3", siteId: "SITE-TRA", title: "Membrane delivery slipped to Fri 20 Nov", detail: "Unit 2 membrane milestone (25 Nov) now forecast 27 Nov.",
    severity: "Medium", ownerId: "P08", due: "2026-11-20", raised: "2026-11-18T06:59", status: "Open", related: [L("message", "MSG-11")] },
  { id: "ISS-4", siteId: "SITE-TRA", title: "Wind check before Unit 2 roof work", detail: "Working-at-height permit requires a wind check at 12:00 (mock forecast gusts).",
    severity: "Low", ownerId: "P08", due: "2026-11-18", raised: "2026-11-18T07:02", status: "Open", related: [L("document", "DOC-SC-102")] },
  { id: "ISS-5", siteId: "SITE-KIL", title: "House 6 rafters soft at eaves", detail: "Timber repair is outside the fixed price. Needs the customer's OK for day-rate work.",
    severity: "High", ownerId: "P13", due: "2026-11-19", raised: "2026-11-17T16:30", status: "Open", related: [L("document", "DOC-PH-103"), L("message", "MSG-12")] },
  { id: "ISS-6", siteId: "SITE-CAP", title: "Timesheet variance with main contractor", detail: "EXC-401: register shows 10.0h, internal 8.0h for Patrick O'Sullivan on 16 Nov.",
    severity: "Medium", ownerId: "P20", due: "2026-11-18", raised: "2026-11-17T17:02", status: "Open", related: [L("exception", "EXC-401")] }
];

const absences: Absence[] = [
  { id: "ABS-1", personId: "P17", from: "2026-11-17", to: "2026-11-19", kind: "Annual leave", note: "Booked 2 Nov.", cover: "Not needed" },
  { id: "ABS-2", personId: "P18", from: "2026-11-18", to: "2026-11-18", kind: "Rostered day off", note: "Back Thursday at Killarney.", cover: "Not needed" },
  { id: "ABS-3", personId: "P05", from: "2026-11-30", to: "2026-12-11", kind: "Training", note: "Apprentice off-the-job phase (block release).", cover: "Cover requested" },
  { id: "ABS-4", personId: "P11", from: "2026-11-27", to: "2026-11-27", kind: "Annual leave", note: "Family event.", cover: "Covered" }
];

const agents: AgentDef[] = [
  { id: "briefing", name: "Briefing", shape: "crown-pebble", tint: "#1c2a24", state: "complete", confidence: 96,
    purpose: "Reads the whole business before Colm's first call and says what needs him.",
    trigger: "Weekdays 07:18, after the roll call", inputs: ["Attendance", "Timesheet exceptions", "Overdue invoices", "Aged quotes", "Priority inbox"],
    output: "Morning briefing on Home and the mobile app", detects: ["Anything that needs Colm today", "Anything that can wait"],
    escalation: "None. It informs, it never acts.", approvalRule: "Read-only. Proposes nothing that changes a record." },
  { id: "ops", name: "Ops Watchdog", shape: "shield", tint: "#2b2318", state: "attention", confidence: 91,
    purpose: "Watches programmes, deliveries and site issues, and flags milestones at risk.",
    trigger: "Every 30 minutes on working days", inputs: ["Programmes", "Site issues", "Supplier emails", "Site photos"],
    output: "Issues raised against the site, milestone risk notes", detects: ["Slipped deliveries", "Milestones at risk", "Blockers with no owner"],
    escalation: "Site lead first, Colm if a milestone moves more than 3 days.", approvalRule: "Can raise issues. Cannot change a programme date." },
  { id: "attendance", name: "Attendance Agent", shape: "low-dome", tint: "#1b2430", state: "attention", confidence: 94,
    purpose: "Runs the 07:00 roll call against the roster and chases what's missing.",
    trigger: "Roll call at 07:15, then on every clock event", inputs: ["Roster / allocations", "Clock events (location checked at the event only)", "Absences", "Site texts"],
    output: "Roll call, late and missing exceptions, confirmation drafts", detects: ["No clock-in by 07:15", "Late arrivals", "Clock-ins outside the site boundary"],
    escalation: "Site lead at 07:15, Colm at 07:20 if still unconfirmed.", approvalRule: "Never marks anyone absent or touches pay. A person confirms every exception." },
  { id: "timesheet", name: "Timesheet Agent", shape: "control-cube", tint: "#16241f", state: "waiting", confidence: 93,
    purpose: "Builds day records from clock events and reconciles them against main-contractor sheets.",
    trigger: "Daily 17:00, and when a contractor sheet is imported", inputs: ["Clock events", "Internal day sheets", "Main-contractor registers"],
    output: "Day records, reconciliation, variance cases", detects: ["Variances over 0.5h", "Missing clock-outs", "Unapproved days before payroll"],
    escalation: "Office administrator, then Colm if not resolved before payroll.", approvalRule: "Holds the payroll line. A named reviewer resolves every variance with a reason." },
  { id: "comms", name: "Communications Agent", shape: "offset-pebble", tint: "#241b2e", state: "working", confidence: 89,
    purpose: "Sorts email, texts and call notes so Colm only sees what needs him.",
    trigger: "On every new message", inputs: ["Email (mock)", "Site texts (mock)", "Logged call notes", "Linked records"],
    output: "Priority inbox, linked records, reply drafts", detects: ["Messages that need Colm", "Replies owed", "Threads waiting on someone else"],
    escalation: "Priority flag on Home.", approvalRule: "Drafts only. Nothing is sent. Approval marks a draft ready to send." },
  { id: "quotation", name: "Quotation Agent", shape: "executive-capsule", tint: "#2a2118", state: "waiting", confidence: 90,
    purpose: "Tracks enquiries from first call to signed quote, and chases the ones going quiet.",
    trigger: "Daily 07:00, and when drawings arrive", inputs: ["Enquiries and call notes", "Drawings", "QS estimates", "Sent quotes"],
    output: "Pipeline, drawing log, follow-up drafts", detects: ["Quotes with no reply after 7 days", "New drawing revisions", "QS waiting on information"],
    escalation: "Colm for any quote over €20,000.", approvalRule: "Proposes categories and follow-ups. Does not measure or price drawings." },
  { id: "finance", name: "Finance Agent", shape: "rim-capsule", tint: "#1e2b26", state: "waiting", confidence: 92,
    purpose: "Reads the QuickBooks export (mock) and keeps debtors and job costs in view.",
    trigger: "Nightly after the QuickBooks export", inputs: ["QuickBooks invoice export (simulated)", "Remittances", "Job budgets"],
    output: "Debtors list, reminder drafts, cash forecast notes", detects: ["Overdue invoices", "Remittances to match", "Jobs over budget"],
    escalation: "Office administrator, then Colm over 14 days overdue.", approvalRule: "QuickBooks stays the system of record. Reminders need Colm's approval." }
];

const agentActions: AgentAction[] = [
  { id: "AA-01", agentId: "attendance", at: "2026-11-18T07:15", title: "Roll call: 13 on time, 2 late, 1 no clock-in", detail: "16 scheduled across Cappamore, Tralee and Killarney.", related: [L("job", "JOB-101"), L("job", "JOB-102"), L("job", "JOB-103")], status: "Simulated complete" },
  { id: "AA-02", agentId: "attendance", at: "2026-11-18T07:16", title: "Flagged John Murphy: no clock-in at Cappamore", detail: "Escalated to Liam Walsh at 07:15 and to Colm at 07:20.", related: [L("person", "P01"), L("job", "JOB-101")], status: "Detected", reviewerId: "P19" },
  { id: "AA-03", agentId: "briefing", at: "2026-11-18T07:18", title: "Posted the morning briefing", detail: "Attendance, EXC-401, INV-301 and QUO-201.", related: [], status: "Simulated complete" },
  { id: "AA-04", agentId: "timesheet", at: "2026-11-17T17:02", title: "Detected +2.0h variance (EXC-401)", detail: "Patrick O'Sullivan, Cappamore, Mon 16 Nov: 8.0h internal vs 10.0h main contractor.", related: [L("exception", "EXC-401"), L("person", "P04")], status: "Awaiting approval", reviewerId: "P20" },
  { id: "AA-05", agentId: "comms", at: "2026-11-18T07:06", title: "Sorted 24 threads, 5 need Colm", detail: "Attendance, timesheet, payment, quote and QS threads flagged.", related: [], status: "Simulated complete" },
  { id: "AA-06", agentId: "comms", at: "2026-11-18T07:08", title: "Drafted reply to Eoin McCarthy (Rev B)", detail: "Confirms site measurements this week.", related: [L("draft", "DRF-03"), L("quote", "QUO-202")], status: "Awaiting approval", reviewerId: "P19" },
  { id: "AA-07", agentId: "quotation", at: "2026-11-18T07:00", title: "Drafted QUO-201 follow-up (9 days, no reply)", detail: "€76,500 Killorglin quote.", related: [L("draft", "DRF-02"), L("quote", "QUO-201")], status: "Awaiting approval", reviewerId: "P19" },
  { id: "AA-08", agentId: "quotation", at: "2026-11-17T09:20", title: "Logged Rev B for QUO-202, superseded Rev A", detail: "Proposed category: roof plan + elevation. Confirmed by Colm.", related: [L("document", "DOC-202B"), L("quote", "QUO-202")], status: "Simulated complete" },
  { id: "AA-09", agentId: "finance", at: "2026-11-18T06:30", title: "Drafted INV-301 reminder (18 days overdue)", detail: "€24,600, Cappamore payment application 3.", related: [L("draft", "DRF-01"), L("invoice", "INV-301")], status: "Awaiting approval", reviewerId: "P19" },
  { id: "AA-10", agentId: "finance", at: "2026-11-13T11:40", title: "Matched remittance to INV-303", detail: "€8,750 from Killarney Residential Management.", related: [L("invoice", "INV-303")], status: "Simulated complete" },
  { id: "AA-11", agentId: "ops", at: "2026-11-18T07:04", title: "Unit 2 membrane milestone at risk", detail: "Delivery slipped to Fri 20 Nov. Forecast moves 25 → 27 Nov.", related: [L("issue", "ISS-3"), L("job", "JOB-102")], status: "Detected", reviewerId: "P08" },
  { id: "AA-12", agentId: "ops", at: "2026-11-17T16:45", title: "Raised House 6 rafter issue", detail: "Day-rate repair needs the customer's OK.", related: [L("issue", "ISS-5"), L("job", "JOB-103")], status: "Detected", reviewerId: "P13" },
  { id: "AA-13", agentId: "timesheet", at: "2026-11-17T17:01", title: "Matched 6 of 7 Cappamore lines for 16 Nov", detail: "One variance opened as EXC-401.", related: [L("job", "JOB-101")], status: "Simulated complete" },
  { id: "AA-14", agentId: "quotation", at: "2026-11-18T07:01", title: "QUO-203 follow-up due today", detail: "Sent 14 Nov. No draft yet, flagged for Colm.", related: [L("quote", "QUO-203")], status: "Detected", reviewerId: "P19" },
  { id: "AA-15", agentId: "attendance", at: "2026-11-17T07:15", title: "Roll call: 17 of 17 on time", detail: "Tuesday. Mark Daly on leave.", related: [], status: "Simulated complete" },
  { id: "AA-16", agentId: "briefing", at: "2026-11-17T07:18", title: "Posted the morning briefing", detail: "QUO-202 drawings received, House 5 ridge due.", related: [], status: "Simulated complete" }
];

const audit: AuditEvent[] = [
  { id: "AU-01", at: "2026-11-18T07:16", actor: "Liam Walsh", category: "staff", action: "Texted about John Murphy", detail: "No sign of John, not answering.", related: [L("person", "P01"), L("message", "MSG-01")] },
  { id: "AU-02", at: "2026-11-18T07:14", actor: "Declan Foley", category: "staff", action: "Clocked in at Cappamore (late)", detail: "07:14, mobile, inside site boundary.", related: [L("person", "P05")] },
  { id: "AU-03", at: "2026-11-18T07:11", actor: "Shane McCarthy", category: "staff", action: "Clocked in at Tralee (late)", detail: "07:11, mobile, inside site boundary.", related: [L("person", "P10")] },
  { id: "AU-04", at: "2026-11-18T07:05", actor: "Aoife O'Shea", category: "staff", action: "Flagged INV-301 to Colm", detail: "Payment application 3 still unpaid.", related: [L("invoice", "INV-301")] },
  { id: "AU-05", at: "2026-11-18T07:02", actor: "Daniel Fitzgerald", category: "staff", action: "Issued working-at-height permit", detail: "Tralee Unit 2, wind check at 12:00.", related: [L("document", "DOC-SC-102")] },
  { id: "AU-06", at: "2026-11-18T06:58", actor: "Liam Walsh", category: "staff", action: "Completed daily safety checklist", detail: "Cappamore, scaffold tagged.", related: [L("document", "DOC-SC-101")] },
  { id: "AU-07", at: "2026-11-18T06:52", actor: "Kevin O'Donoghue", category: "staff", action: "Entered arrival for Alan Brennan", detail: "Foreman entry 06:50, phone battery dead.", related: [L("person", "P16")] },
  { id: "AU-08", at: "2026-11-18T02:05", actor: "QuickBooks export (simulated)", category: "system", action: "Imported 3 open invoices", detail: "Mock nightly export. Read-only.", related: [L("invoice", "INV-301"), L("invoice", "INV-302"), L("invoice", "INV-303")] },
  { id: "AU-09", at: "2026-11-17T18:40", actor: "Colm Curran", category: "staff", action: "Logged a call note", detail: "New enquiry, Muckross Road re-roof.", related: [L("enquiry", "ENQ-504")] },
  { id: "AU-10", at: "2026-11-17T16:50", actor: "Timesheet import", category: "system", action: "Imported CHD site register wk 47", detail: "16 Nov page, 7 lines.", related: [L("document", "DOC-TS-CHD-47")] },
  { id: "AU-11", at: "2026-11-17T16:28", actor: "Kevin O'Donoghue", category: "staff", action: "Uploaded 6 site photos", detail: "House 6 rafters.", related: [L("document", "DOC-PH-103")] },
  { id: "AU-12", at: "2026-11-17T09:16", actor: "Drawing intake", category: "system", action: "Indexed Rev B drawings", detail: "Castleisland, 4 sheets.", related: [L("document", "DOC-202B")] },
  { id: "AU-13", at: "2026-11-17T09:00", actor: "Aoife O'Shea", category: "staff", action: "Uploaded internal day sheet", detail: "Cappamore, Mon 16 Nov.", related: [L("document", "DOC-TS-INT-16")] },
  { id: "AU-14", at: "2026-11-16T17:50", actor: "Aoife O'Shea", category: "staff", action: "Submitted week 46 payroll", detail: "All lines approved.", related: [] },
  { id: "AU-15", at: "2026-11-16T10:20", actor: "Colm Curran", category: "staff", action: "Handed Castleisland drawings to the QS", detail: "Rev A to Eoin McCarthy.", related: [L("quote", "QUO-202")] }
];

const policies: Policy[] = [
  { key: "autodraft", label: "Agents may draft replies", detail: "Drafts land in Communications for approval.", on: true },
  { key: "send", label: "Send without approval", detail: "Off for every agent. Approval marks a draft ready to send; this demo never sends.", on: false, locked: true },
  { key: "classify", label: "Auto-sort the inbox", detail: "Communications Agent flags what needs Colm.", on: true },
  { key: "escalate", label: "Escalate a missing clock-in to the site lead at 07:15", detail: "Then to Colm at 07:20 if still unconfirmed.", on: true },
  { key: "nopay", label: "Never adjust pay from a missing clock-in", detail: "A missing event is a question, not an absence. A person confirms every exception.", on: true, locked: true },
  { key: "location", label: "Check location only at the clock event", detail: "No continuous tracking. One check when someone taps clock in or out.", on: true, locked: true },
  { key: "qbwrite", label: "Agents may write to QuickBooks", detail: "QuickBooks stays the system of record. This demo reads a mock export only.", on: false, locked: true },
  { key: "quotechase", label: "Draft a follow-up when a quote is 7 days quiet", detail: "Quotation Agent drafts; Colm approves.", on: true }
];

export function buildFixture(): DemoData {
  // Deep copy so every reset starts from the same pristine rows.
  return JSON.parse(JSON.stringify({
    company, people, customers, sites, jobs, allocations, clockEvents, corrections: [], absences, dayRecords, contractorLines,
    exceptions, enquiries, documents, estimates, quotes, invoices, payments, messages, drafts, tasks, issues, agents,
    agentActions, audit, policies
  } as DemoData));
}
