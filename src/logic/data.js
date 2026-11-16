/* Demo data and pure helpers for Pulse: Colm Curran Roofing & Building Contractor.
   Operational rows live in src/demo (one source of truth); this file shapes the
   Pulse shell. ALL OPERATIONAL DATA IS ILLUSTRATIVE DEMO DATA. */
import { getState } from "../demo/store";
import { kpiDefs, aspects, workTasks } from "../demo/pulseAdapters";
import { answer } from "../demo/answers";

const INK="var(--ink)", BODY="var(--body)", DIM="var(--dim)", FAINT="var(--faint)";
const LIME="var(--accent)", GREEN="var(--ok)", AMBER="var(--warn)", RED="var(--bad)", NEUTRAL="var(--neutral)";
const MONO="var(--mono)";

const ICONS = {
  navHome:"M12 3.2 3.6 9.1v10a1.5 1.5 0 0 0 1.5 1.5h13.8a1.5 1.5 0 0 0 1.5-1.5v-10L12 3.2Z M8.9 13.1h2l1-2.6 1.5 5 1.1-2.4h1.6",
  navAgents:"M12 2.4v2.3 M12 2.4a.9.9 0 1 0 0-.02 M8.2 6.5h7.6A2.2 2.2 0 0 1 18 8.7v5.1a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 13.8V8.7a2.2 2.2 0 0 1 2.2-2.2Z M9.9 10.6v1.4 M14.1 10.6v1.4 M6 10h-1.9 M18 10h1.9 M9.2 18.6h5.6 M9.2 21.2h5.6",
  navDash:"M4 5.6h7.2v5.1H4V5.6Z M13.6 5.6H20v8.6h-6.4V5.6Z M4 13.1h7.2v5.3H4v-5.3Z M13.6 16.6H20v1.8h-6.4v-1.8Z",
  navWork:"M9.4 4.4h5.2a1.4 1.4 0 0 1 1.4 1.4v1.1h2.4A1.6 1.6 0 0 1 20 8.5v9.1a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.6V8.5a1.6 1.6 0 0 1 1.6-1.6H8V5.8a1.4 1.4 0 0 1 1.4-1.4Z M8 6.9h8 M9.6 13.3l1.8 1.8 3.4-3.6",
  navRecords:"M12 3.6c3.9 0 7 1.1 7 2.5S15.9 8.6 12 8.6 5 7.5 5 6.1 8.1 3.6 12 3.6Z M5 6.1v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6.1 M5 11.8v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5.7",
  navActivity:"M4.6 4.6h14.8A1.6 1.6 0 0 1 21 6.2v11.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.8V6.2a1.6 1.6 0 0 1 1.6-1.6Z M6 12.4h2.2l1.5-4.1 2.3 8 1.9-5.4 1.2 1.5H18",
  navAdmin:"M12 2.9 5 5.6v5.9c0 4 2.8 7.1 7 8.6 4.2-1.5 7-4.6 7-8.6V5.6L12 2.9Z M12 8.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z M8.8 16.3a3.6 3.6 0 0 1 6.4 0",
  helios:"M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.9A8.3 8.3 0 0 1 4 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z M8 12h1.6l1.2-2.6 1.6 5 1.4-2.4H16",
  inbox:"M3 13h4l1.5 3h7l1.5-3h4 M3 13l2.4-7A2 2 0 0 1 7.3 4.6h9.4a2 2 0 0 1 1.9 1.4L21 13v4.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13Z",
  work:"M6 4.6h12a1.6 1.6 0 0 1 1.6 1.6v12.2A1.6 1.6 0 0 1 18 20H6a1.6 1.6 0 0 1-1.6-1.6V6.2A1.6 1.6 0 0 1 6 4.6Z M8.4 10.4l1.9 1.9 3.9-3.9 M8.4 15.6h7.2",
  approvals:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  insights:"M4.5 19.5V13 M9.7 19.5V7.5 M14.9 19.5v-8 M20 19.5V5",
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  orgs:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5 M7.5 15.5h2.5",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  locations:"M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  visits:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z M9 13.5l1.6 1.6 3.4-3.4",
  autos:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  agents:"M8.5 3.6h7A2.4 2.4 0 0 1 17.9 6v5.6a2.4 2.4 0 0 1-2.4 2.4h-7A2.4 2.4 0 0 1 6.1 11.6V6a2.4 2.4 0 0 1 2.4-2.4Z M9.6 8.2h.01 M14.4 8.2h.01 M12 14v2.6 M7.6 20.4h8.8 M12 16.6c-2.4 0-4.4 1.7-4.4 3.8h8.8c0-2.1-2-3.8-4.4-3.8Z",
  dash:"M4.4 4.4h6v6h-6v-6Z M13.6 4.4h6v3.6h-6V4.4Z M13.6 11.6h6v8h-6v-8Z M4.4 14h6v5.6h-6V14Z",
  files:"M5 7.2a1.8 1.8 0 0 1 1.8-1.8h3l1.8 2.2h5.6A1.8 1.8 0 0 1 19 9.4v7.4a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 16.8V7.2Z",
  pulseLine:"M2.5 12.5h3.6l2.1-6.4 3.2 12.2 2.6-8.4 1.8 2.6h5.7",
  records:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 12.4h6 M9 16h4",
  tree:"M4.5 6h5 M4.5 12h5 M4.5 18h5 M12.5 6h7 M12.5 12h7 M12.5 18h7",
  graph:"M7 7.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M17.6 10.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M9.4 21.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M8.6 6.4l7.6 2.6 M15.8 11.4l-5.6 5.2",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  navSites:"M3 11.6 12 4.2l9 7.4 M5.4 9.8V20h13.2V9.8 M10 20v-5.2h4V20 M15.8 6.6V4.4h2.2v4",
  navWorkforce:"M4.6 16.4h14.8 M6 16.4v-1.6a6 6 0 0 1 12 0v1.6 M10.4 9.2V7.4h3.2v1.8 M3.4 19.6h17.2 M12 8.8v3.4",
  navTimesheets:"M12 20.6a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8Z M12 7.8v4.6l3 1.8 M17.6 3.6l2.2 2.2",
  navComms:"M4 6.6h16v10.8H4z M4.4 7.2 12 12.8l7.6-5.6 M8 17.4l-3 3",
  navQuotes:"M7 3.6h7.2l4 4V20.4H7z M14 3.8v4h4 M9.6 12.2h5.2 M9.6 15.6h3.4 M9.6 8.8h2.2",
  navFinance:"M17.4 7.2A6.4 6.4 0 1 0 17.4 16.8 M5 10.6h8.2 M5 13.4h8.2"
};

/* Ontology stays first and is never removed (PulseLogic enforces this too). */
const REC_SECTIONS = [
  {id:"ontology", label:"Ontology", blurb:"How every record connects: customer, enquiry, drawings, QS estimate, quote, job, site, workforce, timesheets, invoices."},
  {id:"files", label:"Files", blurb:"Drawings, QS estimates, timesheets, safety checklists and invoices, indexed where Pulse can read them."},
  {id:"contacts", label:"Contacts", blurb:"Crew, office, QS, customers and suppliers in one directory."},
  {id:"explorer", label:"Explorer", blurb:"Search any record by name, job ID or customer and follow the chain."}
];

const CONTACTS = [
  ["Colm Curran","Owner / Managing Director","colm@example.com","Colm Curran Roofing","staff","var(--accent)"],
  ["Aoife O'Shea","Office administrator","office@example.com","Colm Curran Roofing","staff","#9fd6f0"],
  ["Liam Walsh","Lead roofer, Cappamore","liam.walsh@example.com","Colm Curran Roofing","staff","#e6c78a"],
  ["Daniel Fitzgerald","Foreman, Tralee","daniel.fitzgerald@example.com","Colm Curran Roofing","staff","#c8b4f0"],
  ["Kevin O'Donoghue","Site supervisor, Killarney","kevin.odonoghue@example.com","Colm Curran Roofing","staff","#a8e0c0"],
  ["Eoin McCarthy","Quantity surveyor (external)","qs@example.com","External QS","supplier","#9fd6f0"],
  ["Gerard Ryan","Site manager","g.ryan@cappamorehousing.example","Cappamore Housing Developments","watch","#e2a08c"],
  ["Siobhán Horan","Property manager","s.horan@traleecommercial.example","Tralee Commercial Property Ltd","customer","#e6c78a"],
  ["Denis Cronin","Estate manager","d.cronin@killarneyresidential.example","Killarney Residential Management","customer","#a8e0c0"],
  ["Pádraig Sheehan","Director","p.sheehan@killorglinhomes.example","Killorglin Homes Ltd","customer","#c8b4f0"],
  ["Maura Brosnan","Development manager","m.brosnan@castleislandproperty.example","Castleisland Property Group","customer","#9fd6f0"],
  ["Ciarán Doyle","Contracts manager","c.doyle@shannonpm.example","Shannon Property Maintenance Ltd","customer","#e6c78a"],
  ["Kerry Roofing Supplies (mock)","Supplier","orders@example.com","Kerry Roofing Supplies","supplier","#c8b4f0"]
];

const FILE_TREE = [
  {type:"folder", id:"f-dwg", name:"Drawings", depth:0},
  {type:"file", id:"fl-1", name:"Castleisland roof plan Rev B.pdf", depth:1, parent:"f-dwg", indexed:true,
   path:"Drawings / QUO-202 Castleisland", title:"Castleisland roof plan & rear elevation, Rev B",
   facts:[["TYPE","PDF · 4 sheets"],["RECEIVED","17 Nov 2026"],["SUPERSEDES","Rev A, 16 Nov"],["FROM","Maura Brosnan"]],
   body:["Rev B revises the rear elevation. The QS has taken off areas from this set but the hip and valley lengths on the rear slope don't scale reliably.",
     "Site measurements are needed before the indicative €24,800 estimate (EST-202 v0.3) can be firmed up. Rev A is kept for the record and marked superseded."],
   links:[["Maura Brosnan","person"],["Castleisland Property Group","org"],["QUO-202","quote"]]},
  {type:"file", id:"fl-2", name:"Killorglin house type A Rev C.pdf", depth:1, parent:"f-dwg", indexed:true,
   path:"Drawings / QUO-201 Killorglin", title:"Killorglin house type A roof plan, Rev C",
   facts:[["TYPE","PDF · 6 sheets"],["RECEIVED","28 Oct 2026"],["UNITS","8 semi-detached"],["FROM","Pádraig Sheehan"]],
   body:["One house type across all 8 units. Trusses by others; our package is felt up: membrane, battens, slate, ridge, leadwork, fascia, soffit and rooflights.",
     "Priced as QUO-201 at €76,500 ex VAT and sent on 9 November. No reply yet."],
   links:[["Pádraig Sheehan","person"],["QUO-201","quote"]]},
  {type:"folder", id:"f-ts", name:"Timesheets", depth:0},
  {type:"file", id:"fl-3", name:"CHD site register wk 47 (16 Nov).pdf", depth:1, parent:"f-ts", indexed:true,
   path:"Timesheets / Cappamore", title:"Main contractor register, Cappamore, Mon 16 Nov",
   facts:[["TYPE","PDF · 1 page"],["IMPORTED","17 Nov 16:50"],["LINES","7"],["VARIANCES","1 (EXC-401)"]],
   body:["Cappamore Housing Developments' site register. Six of seven lines match Pulse to the half hour.",
     "Line 4 shows Patrick O'Sullivan 07:00 to 17:00, 10.0 hours with no break deducted. Pulse shows 8.0 hours. Opened as EXC-401."],
   links:[["Gerard Ryan","person"],["EXC-401","exception"]]},
  {type:"file", id:"fl-4", name:"Internal day sheet Cappamore (16 Nov).pdf", depth:1, parent:"f-ts", indexed:true,
   path:"Timesheets / Cappamore", title:"Internal day sheet, Cappamore, Mon 16 Nov",
   facts:[["TYPE","PDF scan · 1 page"],["UPLOADED","17 Nov 09:00"],["SIGNED","Liam Walsh"],["OWNER","Aoife O'Shea"]],
   body:["Signed by the lead roofer. Patrick O'Sullivan 8.0 hours, matching his clock events (06:56 to 15:26, 30-minute break).",
     "Site diary note: crew stood down at 15:30 on Block C, wind gusting at eaves level."],
   links:[["Liam Walsh","person"],["EXC-401","exception"]]},
  {type:"folder", id:"f-safe", name:"Safety", depth:0},
  {type:"file", id:"fl-5", name:"Working at height permit Tralee Unit 2.pdf", depth:1, parent:"f-safe", indexed:true,
   path:"Safety / Tralee", title:"Working at height permit, Tralee Unit 2",
   facts:[["TYPE","Pulse form"],["ISSUED","18 Nov 07:02"],["BY","Daniel Fitzgerald"],["CHECK","Wind at 12:00"]],
   body:["Issued for the Unit 2 roof. A wind check is due at 12:00 before work continues at eaves level."],
   links:[["Daniel Fitzgerald","person"]]},
  {type:"folder", id:"f-fin", name:"Finance", depth:0},
  {type:"file", id:"fl-6", name:"INV-301 payment application 3.pdf", depth:1, parent:"f-fin", indexed:true,
   path:"Finance / Invoices", title:"INV-301, payment application 3",
   facts:[["TYPE","PDF · 2 pages"],["VALUE","€24,600"],["DUE","31 Oct 2026"],["STATUS","18 days overdue"]],
   body:["Interim payment application 3 for the Cappamore roof package. Mirrors the QuickBooks invoice; QuickBooks stays the system of record.",
     "A friendly reminder is drafted and waiting for Colm's approval. Approving marks it ready to send; nothing is emailed from the demo."],
   links:[["Cappamore Housing Developments","org"],["INV-301","invoice"]]},
  {type:"file", id:"fl-7", name:"QuickBooks export 18 Nov (simulated).csv", depth:1, parent:"f-fin", indexed:false,
   path:"Finance / Imports", title:"QuickBooks invoice export (simulated)",
   facts:[["TYPE","CSV · 3 rows"],["IMPORTED","18 Nov 02:05"],["MODE","Read only"],["INDEXED","Not indexed"]],
   body:["A simulated nightly export used for this demo. Pulse reads it to show debtors; it never writes back to QuickBooks."],
   links:[["Aoife O'Shea","person"]]}
];

const ONTO_NODES = [
  ["Job","entity",500,300,1,"The centre of the business: one job links its customer, site, crew, timesheets and invoices."],
  ["Customer","entity",300,190,1,"Main contractors, developers and property managers. Most work arrives by referral or repeat."],
  ["Site","entity",700,190,1,"Cappamore, Tralee, Killarney. Location is checked only at the clock event."],
  ["Workforce","entity",250,430,1,"Crew allocated to a site each day, with roles, tickets and hours."],
  ["Timesheet","entity",690,430,1,"Day records from clock events, reconciled against main-contractor registers."],
  ["Approval","entity",850,320,0,"Drafts, variances and estimates waiting on a named person."],
  ["Invoice","ledger",390,95,0,"Read from the QuickBooks export (simulated). QuickBooks stays the system of record."],
  ["Quote","ledger",620,95,0,"Enquiry to drawings to QS estimate to quote. Won quotes become jobs."],
  ["Clock event","module",860,470,0,"Contributed by mobile clock-in: one timestamp, one location check, no tracking."],
  ["Drawing","entity",140,300,0,"Drawings and site files against a quote or job, with revisions."],
  ["commissions","predicate",395,240,0,"Customer → Job."],
  ["located at","predicate",605,240,0,"Job → Site."],
  ["allocated to","predicate",360,370,0,"Workforce → Job."],
  ["records hours on","predicate",600,370,0,"Timesheet → Job."],
  ["attached to","predicate",140,372,0,"Drawing → Quote or Job."]
];

const ONTO_EDGES = [
  [500,300,300,190],[500,300,700,190],[500,300,250,430],[500,300,690,430],
  [500,300,850,320],[500,300,390,95],[500,300,620,95],[500,300,140,300],
  [300,190,250,430],[700,190,860,470],[690,430,850,320],[690,430,860,470],
  [300,190,140,300],[390,95,620,95]
];

const REC_TEMPLATES = [
  ["Field sheet","Records","Labelled fields in a grid — the default for a person, organisation or location.",
   "M5 5.5h14v13H5v-13Z M5 10h14 M12 10v8.5","grid"],
  ["Contact card","Records","A portrait, key fields and every linked record in one compact panel.",
   "M12 11.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z M5.5 19c.8-3 3.3-4.7 6.5-4.7s5.7 1.7 6.5 4.7","card"],
  ["Directory","Records","A sortable table of many records at once, built for lists.",
   "M4.5 6.5h15 M4.5 12h15 M4.5 17.5h15 M4.5 6.5h.01 M4.5 12h.01 M4.5 17.5h.01","rows"],
  ["Timeline","Case work","Ordered events with who did what and when. Good for a case or a claim.",
   "M12 3.5v17 M12 7.5h6 M12 13h-6 M12 18h6","timeline"],
  ["Kanban board","Case work","Cards in columns by status. For anything that moves through stages.",
   "M5 5h4.5v14H5V5Z M9.75 5h4.5v9h-4.5V5Z M14.5 5H19v6h-4.5V5Z","kanban"],
  ["Checklist","Case work","Ticked steps in order, with an owner and a due date on each.",
   "M5 6.5h2l1.4 1.4L11 5.5 M5 12.5h2l1.4 1.4 2.6-2.4 M5 18.5h2l1.4 1.4 2.6-2.4 M15 6.5h4 M15 12.5h4 M15 18.5h4","checklist"],
  ["Ledger","Finance","Rows and running totals. For anything with amounts and dates.",
   "M4 6h16 M4 12h16 M4 18h16 M9 3.5v17","ledger"],
  ["Invoice","Finance","Line items, totals and a status — built to be sent, not just stored.",
   "M7 3.5h10v17H7v-17Z M9.5 8h5 M9.5 11.5h5 M9.5 15h3","invoice"],
  ["Document","Notes","Long-form text with linked records pulled out down the side.",
   "M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4","document"],
  ["Gallery","Notes","A wall of images and files with a caption on each — for a site or a job.",
   "M4.5 6h6v6h-6V6Z M13.5 6h6v6h-6V6Z M4.5 14h6v4h-6v-4Z M13.5 14h6v4h-6v-4Z","gallery"],
  ["Map & locations","Ops","A pinboard of places, with the record's fields beside each pin.",
   "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z","map"],
  ["Schedule","Ops","A calendar of bookings against this record, with recurring rules.",
   "M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z","schedule"]
];
const REC_TEMPLATE_CATS = ["All","Records","Case work","Finance","Notes","Ops"];

/* ---- admin hub ---- */
/* ---- admin hub: 13 settings areas in five groups ---- */
const PEOPLE = [
  ["Colm Curran","Owner / Managing Director","colm@example.com","All sites","active","Owner","Now"],
  ["Aoife O'Shea","Office administrator","office@example.com","Office","active","Office admin","4 min ago"],
  ["Liam Walsh","Lead roofer","liam.walsh@example.com","Cappamore","active","Site foreman","4 min ago"],
  ["Daniel Fitzgerald","Foreman","daniel.fitzgerald@example.com","Tralee","active","Site foreman","18 min ago"],
  ["Kevin O'Donoghue","Site supervisor","kevin.odonoghue@example.com","Killarney","active","Site foreman","25 min ago"],
  ["Eoin McCarthy","Quantity surveyor (external)","qs@example.com","External","external","QS","32 min ago"],
  ["Patrick O'Sullivan","Roofer","patrick.osullivan@example.com","Cappamore","active","Employee","06:56 clock-in"],
  ["John Murphy","Roofer","john.murphy@example.com","Cappamore","active","Employee","Not today"]
];
const ROLE_LEVELS = ["Owner","Office admin","Site foreman","Employee","QS"];
const PERM_KEYS = [["view","View records"],["edit","Edit records"],["approve","Approve hours and drafts"]];
const GRANT_DEFS = [
  ["view","View records","Read anything in scope"],
  ["edit","Edit records","Create and change records"],
  ["approve","Approve decisions","Drafts, variances, estimates"],
  ["correct","Enter corrections","Supervisor attendance corrections"],
  ["export","Export payroll preview","Generate the weekly preview file"],
  ["agents","Manage agents","Create and grant agents"],
  ["settings","Change settings","Roles, integrations, AI controls"],
  ["audit","Read the audit log","Every action, everyone"]
];
const ROLE_SCOPES = ["All records","Their site","Their own records"];
const DEFAULT_PERMS = {Owner:{view:true,edit:true,approve:true}, "Office admin":{view:true,edit:true,approve:true},
  "Site foreman":{view:true,edit:true,approve:false}, Employee:{view:true,edit:false,approve:false}, QS:{view:true,edit:true,approve:false}};
const INTEGRATIONS = [
  {name:"QuickBooks", blurb:"Invoicing stays in QuickBooks. In this demo Pulse reads a simulated nightly export to show debtors; it never writes back.", tint:"#2ca01c", status:"simulated", statusKind:"warn",
   glyph:"M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z M9.2 8.4v7.2 M14.8 8.4v7.2 M9.2 8.4h2a2 2 0 0 1 0 4h-2 M14.8 15.6h-2a2 2 0 0 1 0-4h2",
   lastSync:"02:05 (simulated)", usage:"3 invoices read", auth:"Not connected", scopes:["Read (proposed)"]},
  {name:"Email", blurb:"Customer emails and drawings land in Communications and attach to the job or quote they mention. Simulated inbox in this demo.", tint:"#ea4335", status:"simulated", statusKind:"warn",
   glyph:"M4 7.2 12 13 20 7.2 M4 7.2v10.6h16V7.2 M4 7.2 8.5 4h7L20 7.2",
   lastSync:"07:16 (sample data)", usage:"24 sample threads", auth:"Not connected", scopes:["Read (proposed)","Draft"]},
  {name:"Timesheet import", blurb:"Upload a main contractor's register (PDF or CSV) and Pulse reconciles it against clock events line by line.", tint:"var(--accent)", status:"demo upload", statusKind:"ok",
   glyph:"M6 3.5h8l4 4v13H6z M14 3.6v4h4 M9 13h6 M12 10v6",
   lastSync:"17 Nov 16:50", usage:"1 register imported", auth:"Manual upload", scopes:["Import"]},
  {name:"Mobile clock-in", blurb:"Crew tap clock in and out on their phone. Location is checked once, at the event; no continuous tracking. Foreman entry as fallback.", tint:"#6ad0f0", status:"concept", statusKind:"warn",
   glyph:"M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3Z M11 18h2",
   lastSync:"07:14 (simulated)", usage:"15 events today", auth:"Per-employee login (proposed)", scopes:["Clock events"]},
  {name:"Call notes", blurb:"Calls are logged by hand as notes against the customer or enquiry. No phone system is connected.", tint:"#f0c04b", status:"manual", statusKind:"ok",
   glyph:"M5 4.5h4l2 5-2.5 1.5a11 11 0 0 0 4.5 4.5L14.5 13l5 2v4a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5Z",
   lastSync:"17 Nov 18:40", usage:"3 notes this week", auth:"—", scopes:["Manual entry"]},
  {name:"Phone system", blurb:"Not part of this demo. Call logging stays manual unless a provider is chosen later.", tint:"var(--dim)", status:"not connected", statusKind:"off",
   glyph:"M9 3v5 M15 3v5 M6 8h12v3.5a6 6 0 0 1-12 0V8Z M12 17.5V21",
   lastSync:"—", usage:"—", auth:"—", scopes:[]}
];

/* Background catalogue. Each entry is pure CSS so a tile is the real thing at
   thumbnail size, not a picture of it. */
const BG_DEFS = [
  {id:"bloom", name:"Bloom", cat:"Signature",
   css:"background:radial-gradient(60% 48% at 50% 34%, var(--accent-faint), transparent 72%), radial-gradient(44% 38% at 16% 84%, rgba(255,255,255,.05), transparent 70%)",
   thumb:"background:radial-gradient(62% 58% at 46% 34%, var(--accent-soft), transparent 74%), radial-gradient(50% 46% at 82% 84%, rgba(255,255,255,.08), transparent 72%), var(--surface-2)"},
  {id:"mist", name:"Mist", cat:"Signature",
   css:"background:radial-gradient(52% 44% at 24% 22%, rgba(255,255,255,.07), transparent 70%), radial-gradient(56% 46% at 80% 76%, rgba(255,255,255,.05), transparent 72%)",
   thumb:"background:radial-gradient(58% 52% at 24% 22%, rgba(255,255,255,.16), transparent 72%), radial-gradient(60% 54% at 82% 78%, rgba(255,255,255,.10), transparent 74%), var(--surface-2)"},
  {id:"grid", name:"Grid", cat:"Signature",
   css:"background-image:linear-gradient(var(--border) 1px, transparent 1px),linear-gradient(90deg, var(--border) 1px, transparent 1px);background-size:56px 56px;mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%);-webkit-mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%)",
   thumb:"background-color:var(--surface-2);background-image:linear-gradient(var(--border-strong) 1px, transparent 1px),linear-gradient(90deg, var(--border-strong) 1px, transparent 1px);background-size:14px 14px"},
  {id:"none", name:"None", cat:"Signature", css:"", thumb:"background:var(--surface-2)"},

  {id:"aurora", name:"Aurora", cat:"Gradient",
   css:"background:radial-gradient(70% 52% at 18% 8%, var(--bloom-a), transparent 66%), radial-gradient(64% 48% at 84% 22%, var(--bloom-b), transparent 68%), radial-gradient(70% 60% at 50% 104%, var(--bloom-c), transparent 70%);filter:blur(24px)",
   thumb:"background:radial-gradient(72% 60% at 16% 6%, var(--bloom-a), transparent 68%), radial-gradient(66% 54% at 86% 24%, var(--bloom-b), transparent 70%), radial-gradient(74% 66% at 50% 108%, var(--bloom-c), transparent 72%), var(--surface-2)"},
  {id:"horizon", name:"Horizon", cat:"Gradient",
   css:"background:linear-gradient(180deg, transparent 0%, var(--accent-faint) 58%, transparent 100%), radial-gradient(90% 40% at 50% 72%, var(--accent-soft), transparent 70%)",
   thumb:"background:linear-gradient(180deg, var(--surface-2) 0%, var(--accent-faint) 58%, var(--surface-2) 100%), radial-gradient(90% 44% at 50% 74%, var(--accent-soft), transparent 70%)"},
  {id:"dusk", name:"Dusk", cat:"Gradient",
   css:"background:linear-gradient(200deg, var(--bloom-c) -10%, transparent 46%), linear-gradient(20deg, var(--bloom-b) -10%, transparent 52%);opacity:.5",
   thumb:"background:linear-gradient(200deg, var(--bloom-c) -12%, transparent 48%), linear-gradient(20deg, var(--bloom-b) -12%, transparent 54%), var(--surface-2)"},
  {id:"ember", name:"Ember", cat:"Gradient",
   css:"background:radial-gradient(60% 70% at 84% 96%, var(--bloom-a), transparent 64%), radial-gradient(50% 60% at 10% 96%, var(--bloom-c), transparent 66%)",
   thumb:"background:radial-gradient(64% 76% at 84% 100%, var(--bloom-a), transparent 66%), radial-gradient(54% 66% at 8% 100%, var(--bloom-c), transparent 68%), var(--surface-2)"},

  {id:"mesh", name:"Mesh", cat:"Abstract",
   css:"background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:22px 22px;mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%);-webkit-mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%)",
   thumb:"background-color:var(--surface-2);background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:8px 8px"},
  {id:"contour", name:"Contour", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 30% 110%, transparent 0 22px, var(--border) 22px 23px);mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%);-webkit-mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%)",
   thumb:"background:repeating-radial-gradient(circle at 26% 116%, var(--surface-2) 0 9px, var(--border-strong) 9px 10px)"},
  {id:"weave", name:"Weave", cat:"Abstract",
   css:"background:repeating-linear-gradient(48deg, transparent 0 16px, var(--border) 16px 17px), repeating-linear-gradient(-48deg, transparent 0 16px, var(--border) 16px 17px);opacity:.7",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(48deg, transparent 0 7px, var(--border-strong) 7px 8px), repeating-linear-gradient(-48deg, transparent 0 7px, var(--border-strong) 7px 8px)"},
  {id:"halo", name:"Halo", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 50% 50%, transparent 0 46px, var(--accent-line) 46px 47px);mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%);-webkit-mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%)",
   thumb:"background:repeating-radial-gradient(circle at 50% 50%, var(--surface-2) 0 11px, var(--accent-line) 11px 12px)"},
  {id:"drift", name:"Drift", cat:"Abstract",
   css:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%);filter:blur(30px);opacity:.6",
   thumb:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%), var(--surface-2)"},
  {id:"scan", name:"Scanlines", cat:"Abstract",
   css:"background:repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 7px);mask-image:linear-gradient(180deg, #000, transparent 88%);-webkit-mask-image:linear-gradient(180deg, #000, transparent 88%)",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(0deg, var(--border-strong) 0 1px, transparent 1px 5px)"}
];

const THEMES = [
  {id:"dark", label:"Dark", group:"Dark", bg:"#0b0c0b", surface:"#1a1c19", ink:"#f2f3ef", accent:"#c8f04b"},
  {id:"indigo", label:"Indigo", group:"Dark", bg:"#0a0b13", surface:"#1a1b26", ink:"#f0f1fa", accent:"#8b93ff"},
  {id:"slate", label:"Slate", group:"Dark", bg:"#100e0c", surface:"#211c17", ink:"#f4f0ea", accent:"#e8a14a"},
  {id:"plum", label:"Plum", group:"Dark", bg:"#100a10", surface:"#20151f", ink:"#f6eef4", accent:"#f077b0"},
  {id:"ember", label:"Ember", group:"Dark", bg:"#0b0b0b", surface:"#1c1714", ink:"#f7f3ef", accent:"#f4561a"},
  {id:"curran", label:"Curran", group:"Dark", bg:"#0a0f0d", surface:"#121a17", ink:"#f5f5f0", accent:"#c9ad6e"},
  {id:"harbour", label:"Harbour", group:"Dark", bg:"#0b0e10", surface:"#13171a", ink:"#f3f5f4", accent:"#5ee79a"},
  {id:"cargo", label:"Cargo", group:"Dark", bg:"#0a0a0a", surface:"#1a1c1a", ink:"#f2f5f2", accent:"#4ade80"},
  {id:"ocean", label:"Ocean", group:"Dark", bg:"#080e12", surface:"#141f25", ink:"#eaf4f8", accent:"#4fd4d0"},
  {id:"graphite", label:"Graphite", group:"Dark", bg:"#111112", surface:"#212124", ink:"#f4f4f5", accent:"#f4f4f5"},
  {id:"curran-light", label:"Curran light", group:"Light", bg:"#f5f5f0", surface:"#ffffff", ink:"#16201b", accent:"#224b3c"},
  {id:"light", label:"Cream", group:"Light", bg:"#f4f2ed", surface:"#ffffff", ink:"#16181c", accent:"#0071e3"},
  {id:"warm", label:"Warm paper", group:"Light", bg:"#faf5ec", surface:"#fffdf9", ink:"#2a2016", accent:"#c9683f"},
  {id:"mist", label:"Mist", group:"Light", bg:"#eef1f4", surface:"#ffffff", ink:"#141e20", accent:"#0e9f6e"},
  {id:"sand", label:"Sand", group:"Light", bg:"#f6f1e6", surface:"#fffdf7", ink:"#221d12", accent:"#7d5fd6"}
];

const ADMIN_ICONS = {
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  structure:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5",
  shield:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  agent:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5",
  flow:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  plug:"M9 3.5v5 M15 3.5v5 M6.5 8.5h11v3a5.5 5.5 0 0 1-11 0v-3Z M12 17v3.5",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  lock:"M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5Z M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3",
  audit:"M8 3.5h8l3.5 3.5v13a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h2Z M9 12h6 M9 16h4",
  brand:"M12 3.5 14.6 9l6.4.6-4.8 4.2 1.4 6.2-5.6-3.3-5.6 3.3 1.4-6.2L3 9.6 9.4 9 12 3.5Z",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  data:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"
};

const ADMIN_CARDS = [
  {id:"org", group:"ORGANISATION", title:"Company profile", icon:"structure", tint:"var(--accent)",
   blurb:"Trading name, region, services and who runs the business.",
   tags:["Co. Kerry","9 services","EUR"],
   listLabel:"ON RECORD",
   rows:[["Trading name","Colm Curran Roofing & Building Contractor"],["Managing director","Colm Curran"],["Base","County Kerry, Ireland"],
     ["Works across","Kerry and beyond (Limerick, Cork, Clare)"],["Services","Pitched & hand-cut roofs, trusses, flat roofing"],["","Re-roofing, slating & tiling, maintenance"],
     ["","Renovations, new builds, insurance works"],["Website","colmcurran.com"],["Currency and timezone","EUR · Europe/Dublin"]]},
  {id:"sitesetup", group:"ORGANISATION", title:"Sites & working day", icon:"structure", tint:"#f0c04b",
   blurb:"Live sites, start times and site boundaries for clock-in.",
   tags:["3 live sites","07:00 start"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Cappamore, Co. Limerick","JOB-101 · 150 m boundary"],["Tralee, Co. Kerry","JOB-102 · 120 m boundary"],["Killarney, Co. Kerry","JOB-103 · 200 m boundary"],
     ["Standard start","07:00"],["Break deducted","30 minutes"],["Roll call","07:15, escalate at 07:20"]]},

  {id:"people", group:"TEAMS", title:"People & access", icon:"people", tint:"#6ad0f0",
   blurb:"Who signs in to Pulse, and who only clocks in from their phone.",
   tags:["18 field crew","2 office","1 external QS"],
   footer:"Field crew sign in to mobile clock-in only", action:"Review",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Invite or remove people",""],["Assign site leads","3 leads"],["Mobile clock-in accounts","18 crew"],["Suspend access",""]]},
  {id:"crews", group:"TEAMS", title:"Crews", icon:"teams", tint:"#9d8cf5",
   blurb:"The usual crew on each site, and who leads it.",
   tags:["3 crews","7 + 5 + 4 today"],
   listLabel:"CREWS",
   rows:[["Cappamore","Liam Walsh (lead roofer) + 6"],["Tralee","Daniel Fitzgerald (foreman) + 4"],["Killarney","Kevin O'Donoghue (site supervisor) + 3"],
     ["Not scheduled today","Mark Daly (leave), James Collins (day off)"]]},

  {id:"teams", group:"PERMISSIONS", title:"Roles & permissions", icon:"shield", tint:"var(--accent)",
   blurb:"Five roles: owner, office admin, site foreman, employee and QS.",
   tags:["5 roles","8 grants","3 scopes"],
   heroLabel:"THE QUESTION THIS ANSWERS", heroAction:"Show me what someone can access",
   heroText:"A site foreman can correct attendance on their own site, but cannot approve payroll hours or see invoices. A QS sees drawings and estimates, nothing else.",
   listLabel:"ROLES",
   rows:[["Owner","everything, approves drafts and estimates"],["Office admin","invoices, payroll preview, timesheet review"],["Site foreman","their site: attendance, corrections, issues"],
     ["Employee","their own clock events and hours"],["QS","drawings, estimates, quotes in progress"]]},
  {id:"limits", group:"PERMISSIONS", title:"Approval rules", icon:"shield", tint:"#f0994b",
   blurb:"What needs a named person before it moves.",
   tags:["All drafts","All variances"],
   listLabel:"RULES",
   rows:[["Customer emails and reminders","Colm approves", true],["Timesheet variances","Aoife or Colm, with a reason", true],["QS estimates over €20,000","Colm", true],
     ["Attendance corrections","Site lead enters, audited", true],["Payroll export","Preview only in this demo", true]]},

  {id:"integrations", group:"SYSTEMS", title:"Integrations", icon:"plug", tint:"#6ad0f0",
   blurb:"QuickBooks, email, timesheet import and the clock-in concept, and which way data flows.",
   tags:["Simulated in this demo","No live sync"], badge:"Demo mode", badgeKind:"warn",
   footer:"No live connections in this demo", action:"View",
   listLabel:"CONNECTIONS",
   rows:[["QuickBooks","simulated read-only export"],["Email","simulated inbox"],["Timesheet import","demo upload"],["Mobile clock-in","concept"],["Call notes","manual"],["Phone system","not connected"]]},
  {id:"imports", group:"SYSTEMS", title:"Imports", icon:"data", tint:"#5fe0a8",
   blurb:"What came in, from where, and what Pulse matched.",
   tags:["3 imports this week"],
   listLabel:"RECENT",
   rows:[["QuickBooks export (simulated)","18 Nov 02:05 · 3 invoices"],["CHD site register wk 47","17 Nov 16:50 · 7 lines, 1 variance"],["Castleisland drawings Rev B","17 Nov 09:16 · 4 sheets"]]},

  {id:"datahandling", group:"GOVERNANCE", title:"Data handling", icon:"lock", tint:"#8fa6ff",
   blurb:"What is collected about the crew, and what is not.",
   tags:["No tracking","Event-only location"],
   listLabel:"POLICY",
   rows:[["Location","checked once at clock in/out, never continuous", true],["Missing clock-in","a question for a person, never an automatic deduction", true],
     ["Corrections","entered by a site lead with a reason, audited", true],["Employee access to own records","on", true],["Retention","7 years for payroll records"]]},
  {id:"audit", group:"GOVERNANCE", title:"Audit log", icon:"audit", tint:"#9d8cf5",
   blurb:"A locked history of who changed what. Searchable, exportable, never editable.",
   tags:["Append-only"],
   footer:"Nobody can edit or delete entries", action:"Open Activity",
   listLabel:"WHAT IS RECORDED",
   rows:[["Clock events and corrections",""],["Timesheet decisions",""],["Draft approvals",""],["Estimate approvals",""],["Agent actions",""],["Imports",""]]},
  {id:"consent", group:"GOVERNANCE", title:"Consent & corrections", icon:"shield", tint:"#e2705c",
   blurb:"How the crew agree to mobile clock-in, and how they challenge a record.",
   tags:["Opt-in","Right to correct"],
   listLabel:"RULES",
   rows:[["Clock-in consent","signed per employee (proposed)", true],["Foreman entry fallback","when phone or permission unavailable", true],
     ["Employee can query a record","goes to the site lead", true],["Variance with a main contractor","needs a named reviewer and a reason", true]]},

  {id:"ai", group:"AI CONTROLS", title:"Agent controls", icon:"agent", tint:"var(--accent)",
   blurb:"What agents may draft on their own, and where they must stop.",
   tags:["7 agents","0 sends"],
   heroLabel:"GLOBAL RULE", heroAction:"Agents never send",
   heroText:"Every agent drafts and detects. Approving a draft marks it ready to send; in this demo nothing is ever emailed or texted.",
   listLabel:"POLICIES",
   rows:[]},
  {id:"agentperms", group:"AI CONTROLS", title:"What agents can read", icon:"agent", tint:"#6ad0f0",
   blurb:"Each agent sees only the records its job needs.",
   tags:["Scoped"],
   listLabel:"SCOPES",
   rows:[["Attendance Agent","roster, clock events, absences"],["Timesheet Agent","day records, contractor registers"],["Communications Agent","inbox, linked records"],
     ["Quotation Agent","enquiries, drawings, estimates, quotes"],["Finance Agent","QuickBooks export (simulated), job budgets"],["Briefing, Ops Watchdog","read everything, change nothing"]]},

  {id:"brand", group:"EXPERIENCE", title:"Branding", icon:"brand", tint:"var(--accent)",
   blurb:"Forest green and gold, the CC monogram, and how agents appear.",
   tags:["Forest green","Muted gold"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Mark","CC monogram"],["Primary","#224B3C forest green"],["Accent","#B69A5E muted gold"],["Light","#F5F5F0 off-white"],["Agent appearance","7 faces"]]},
  {id:"appearance", group:"EXPERIENCE", title:"Appearance & themes", icon:"brand", tint:"#6ad0f0",
   blurb:"Pick a light or dark theme for how Pulse looks to you.",
   tags:["Curran dark","Curran light"],
   listLabel:"THEMES", rows:[]},
  {id:"demo", group:"EXPERIENCE", title:"Demo controls", icon:"health", tint:"#f0c04b",
   blurb:"Reset everything to Wednesday 18 November, 07:20.",
   tags:["In-memory","Illustrative data"],
   heroLabel:"RESET", heroAction:"Reset the demo",
   heroText:"Clock-ins, corrections, approvals, imports and estimate decisions all return to the 07:20 starting point.",
   listLabel:"ABOUT THIS DEMO",
   rows:[["Data","Illustrative. Not the client's payroll, customers or ledger"],["Clock","Fixed at Wed 18 Nov 2026, 07:20"],["Live connections","None"],["Emails and texts","Never sent"]]}
];

const ADMIN_GROUPS = [
  ["ORGANISATION", "repeat(2,1fr)"],
  ["TEAMS", "repeat(2,1fr)"],
  ["PERMISSIONS", "repeat(2,1fr)"],
  ["SYSTEMS", "repeat(2,1fr)"],
  ["GOVERNANCE", "repeat(3,1fr)"],
  ["AI CONTROLS", "repeat(2,1fr)"],
  ["EXPERIENCE", "repeat(3,1fr)"]
];

/* ---- activity feeds ---- */
const SRC_TINT = {Email:"#f07a9d", Pulse:"var(--accent)", QuickBooks:"#5fe0a8", Mobile:"#6ad0f0", Import:"#f0994b", Agent:"var(--accent)"};
const SRC_ABBR = {Email:"EM", Pulse:"PL", QuickBooks:"QB", Mobile:"MB", Import:"IM", Agent:"AI"};

const DATA_EVENTS = [];

const PEOPLE_EVENTS = [];

const AI_EVENTS = [];

const STREAM_DEFS = [
  {id:"data", title:"Systems", sub:"Imports and exports (simulated)", pool:DATA_EVENTS, every:3200,
   tint:"#6ad0f0", icon:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"},
  {id:"people", title:"Staff", sub:"Clock-ins, corrections, decisions", pool:PEOPLE_EVENTS, every:6400,
   tint:"#f0c04b", icon:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9"},
  {id:"ai", title:"Agents", sub:"Detected, drafted, waiting", pool:AI_EVENTS, every:4600,
   tint:"var(--accent)", icon:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5"}
];

const NAV = [
  {group:"COMMAND"},
  {label:"Home", icon:"helios", page:"Home"},
  {label:"Agents", icon:"navAgents", page:"Agents"},
  {label:"Dashboard", icon:"navDash", page:"Dashboard"},
  {label:"Work", icon:"navWork", page:"Work", dot:true},
  {group:"OPERATIONS"},
  {label:"Sites", icon:"navSites", page:"Sites"},
  {label:"Workforce", icon:"navWorkforce", page:"Workforce", dot:true},
  {label:"Timesheets", icon:"navTimesheets", page:"Timesheets"},
  {group:"COMMERCIAL"},
  {label:"Communications", icon:"navComms", page:"Communications"},
  {label:"Quotations", icon:"navQuotes", page:"Quotations"},
  {label:"Finance", icon:"navFinance", page:"Finance"},
  {group:"INTELLIGENCE"},
  {label:"Records", icon:"navRecords", page:"Records"},
  {label:"Activity", icon:"pulseLine", page:"Activity"},
  {group:"SYSTEM"}
];

/* Inbox items follow the real InboxItem shape: what happened, why it matters, what I can do. */
const ITEMS = {};
const ORDER = [];

const ANSWERS = {};

// Turns a plain-English filter name into a full dashboard area — the "primitive
// vibe-coding" bit: no real backend, just a seeded generator so the same phrase
// always produces the same numbers, with direction and vocabulary nudged by
// keywords in the text (expansion/growth trends up, risk/issue trends down, a
// region/cost/people/ops/customer word picks which metrics show).
function synthesizeCustomArea(name){
  const trimmed = (name || "").trim();
  if (!trimmed) return null;
  let seed = 0;
  for (let i = 0; i < trimmed.length; i++) seed = (seed * 31 + trimmed.charCodeAt(i)) >>> 0;
  const rnd = (n) => (((seed >>> (n % 24)) ^ (seed << ((n * 7) % 13))) >>> 0) % 997 / 997;
  const low = trimmed.toLowerCase();
  const has = (...words) => words.some(w => low.indexOf(w) > -1);
  const growth = has("expansion","growth","launch","scale","pilot","new site","open","opening","grow");
  const risk = has("risk","issue","delay","problem","complaint","fault","incident","churn","decline");
  const dir = risk ? -1 : (growth ? 1 : (rnd(2) > 0.45 ? 1 : -1));

  let vocab = "generic";
  if (has("scotland","ireland","wales","england","region","dublin","belfast","cork","galway","london","glasgow","edinburgh"))
    vocab = "region";
  else if (has("cost","spend","budget","saving","margin")) vocab = "cost";
  else if (has("staff","hiring","team","recruit","headcount")) vocab = "people";
  else if (has("supplier","stock","inventory","warehouse","fleet")) vocab = "ops";
  else if (has("customer","client","retention","account")) vocab = "customer";

  const V = {
    region:   {labels:["New enquiries","Orders won","Revenue","Site coverage"], unit:"EUR — 30 DAYS"},
    cost:     {labels:["Spend","Cost per job","Savings found","Budget used"], unit:"EUR — 30 DAYS"},
    people:   {labels:["Headcount","Open roles","Time to hire","Retention"], unit:"PEOPLE"},
    ops:      {labels:["Stock cover","Lead time","Stockouts","Reorders raised"], unit:"DAYS"},
    customer: {labels:["Active accounts","Repeat rate","Churn","NPS"], unit:"ACCOUNTS"},
    generic:  {labels:["Volume","Rate","Cost","Coverage"], unit:"ACTIVITY — 30 DAYS"}
  }[vocab];

  const months = ["Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"];
  let v0 = 40 + Math.floor(rnd(1) * 220);
  const chart = months.map((m, i) => {
    v0 = Math.max(8, Math.round(v0 * (1 + dir * (0.03 + rnd(i + 3) * 0.07))));
    return [m, v0, String(v0)];
  });
  const metrics = V.labels.map((label, i) => {
    const val = 20 + Math.floor(rnd(i + 5) * 400);
    const pct = 2 + Math.round(rnd(i + 9) * 18);
    const up = dir > 0 ? rnd(i + 12) > 0.25 : rnd(i + 12) > 0.7;
    const bars = [0,1,2,3,4,5,6,7,8].map(k => 0.3 + rnd(i * 3 + k) * 0.7);
    return [label, i === 1 ? pct + "%" : String(val), (up ? "+" : "\u2212") + pct + (i === 1 ? "pt" : "%"), up ? "up" : "down", "vs last month", bars];
  });
  const capName = trimmed.replace(/\b\w/g, c => c.toUpperCase());
  const split = [
    [capName + " \u2014 direct", String(Math.round(v0 * 0.5)), "48%", 1],
    ["Existing pipeline", String(Math.round(v0 * 0.3)), "31%", 0],
    ["Everything else", String(Math.round(v0 * 0.2)), "21%", 0]
  ];
  const table = [1,2,3].map(w => [capName + " \u2014 week " + w, String(20 + Math.floor(rnd(20 + w) * 200)),
    (dir > 0 ? "+" : "\u2212") + (3 + Math.floor(rnd(23 + w) * 14)) + "%", "Auto-tagged from records mentioning \u201c" + low + "\u201d"]);
  table.push(["Everything else", String(20 + Math.floor(rnd(30) * 200)), "\u2014", "Baseline"]);
  return {
    id: trimmed, label: capName, color: "var(--accent)", owner: "CUSTOM FILTER",
    description: "Generated from \u201c" + trimmed + "\u201d \u2014 a plain-English filter, not a registered metric set. Refine it and Pulse will tighten this up.",
    kind: "columns", chartTitle: capName + " over time", chartUnit: V.unit,
    chart, splitTitle: "Where \u201c" + low + "\u201d shows up", split,
    tableCols: ["Item","Value","Change","Note"], table,
    metrics, legend: [capName, "Pipeline", "Other"]
  };
}

function pickAnswer(q){
  return answer(q);
}

const ORGS = [
  ["Cappamore Housing Developments","Customer","€24,600","18 days","watch"],
  ["Tralee Commercial Property Ltd","Customer","€13,200","due 25 Nov","active"],
  ["Killarney Residential Management","Customer","€0","paid","active"],
  ["Killorglin Homes Ltd","Prospect","—","QUO-201","active"],
  ["Castleisland Property Group","Prospect","—","QUO-202","active"],
  ["Shannon Property Maintenance Ltd","Customer","—","QUO-203","active"]
];
const TEAMS = [
  ["Cappamore crew","7 members","Liam Walsh","site:attendance:correct"],
  ["Tralee crew","5 members","Daniel Fitzgerald","site:attendance:correct"],
  ["Killarney crew","4 members","Kevin O'Donoghue","site:attendance:correct"],
  ["Office","2 members","Colm Curran","all permissions"]
];
const LOCATIONS = [
  ["Cappamore","Co. Limerick","7 crew","live"],
  ["Tralee","Co. Kerry","5 crew","live"],
  ["Killarney","Co. Kerry","4 crew","live"]
];

const AGENT_DEFS = [
  {id:"rollcall", name:"Morning roll call", shape:"rim-capsule", tint:"#1c2a24", state:"working", group:true,
   members:["attendance","briefing","timesheet"], role:"Attendance, Briefing and Timesheet agents working the 07:00 start together",
   when:"07:20", preview:"attendance: john murphy still has no clock-in.",
   thread:[
     {kind:"stamp", text:"Today 07:15"},
     {kind:"routine", text:"Ran routine", routine:"07:00 roll call"},
     {kind:"agent", from:"attendance", text:"16 scheduled across three sites. 13 on time, Declan Foley 07:14 and Shane McCarthy 07:11 late. John Murphy at Cappamore has no clock-in. Pinged Liam Walsh at 07:15."},
     {kind:"agent", from:"timesheet", text:"separate thing on the same job: EXC-401 is still open. Patrick O'Sullivan, Mon 16 Nov, 8.0h ours vs 10.0h on the main contractor's register. His payroll line is held."},
     {kind:"agent", from:"briefing", text:"so the briefing leads with John, then EXC-401. nothing about John changes pay until someone confirms what happened."},
     {kind:"user", text:"draft a text to john, cc liam"},
     {kind:"agent", from:"attendance", text:"drafted and parked in Communications. it's a text to a person, so it waits for your yes."}
   ]},
  {id:"briefing", name:"Briefing", shape:"crown-pebble", tint:"#1c2a24", state:"complete", role:"Reads the whole business before your first call and says what needs you",
   when:"07:18", preview:"16 scheduled, one clock-in unverified. follow-ups ready.",
   thread:[
     {kind:"stamp", text:"Today 07:18"},
     {kind:"routine", text:"Ran routine", routine:"Morning briefing"},
     {kind:"agent", text:"morning briefing:", lines:[
       {k:"Crew", v:"16 scheduled · 13 on time · 2 late · 1 unverified (John Murphy)"},
       {k:"Timesheets", v:"EXC-401 · Patrick O'Sullivan +2.0h vs main contractor"},
       {k:"Money", v:"€24,600 overdue · INV-301, 18 days"},
       {k:"Quotes", v:"QUO-201 €76,500 · no reply in 9 days"}]},
     {kind:"agent", text:"I've prepared the follow-ups for approval. nothing goes until you say so."}
   ]},
  {id:"ops", name:"Ops Watchdog", shape:"shield", tint:"#2b2318", state:"attention", role:"Watches programmes, deliveries and site issues",
   when:"07:04", preview:"tralee membrane delivery slipped to friday.",
   thread:[
     {kind:"stamp", text:"Today 07:04"},
     {kind:"agent", text:"Unit 2 membrane delivery moved to Friday 20 Nov. The 25 Nov milestone now forecasts 27 Nov. Daniel knows. Raised as ISS-3."},
     {kind:"agent", text:"Killarney House 6: rafters soft at the eaves (Kevin's photos, Tue 16:30). Timber repair is outside the fixed price, so it needs the customer's OK. ISS-5, owner Kevin."}
   ]},
  {id:"attendance", name:"Attendance Agent", shape:"low-dome", tint:"#1b2430", state:"attention", role:"Runs the 07:00 roll call and chases what's missing",
   when:"07:16", preview:"john murphy: no clock-in at cappamore.",
   thread:[
     {kind:"stamp", text:"Today 07:15"},
     {kind:"routine", text:"Ran routine", routine:"Roll call"},
     {kind:"agent", text:"roll call: 13 on time, 2 late, 1 no clock-in. John Murphy, Cappamore, scheduled 07:00. Liam texted at 07:16 that John isn't answering."},
     {kind:"agent", text:"I won't mark John absent and I don't touch pay. Options: a confirmation text (I'll draft it), or Liam adds a supervisor correction if John turns up."}
   ]},
  {id:"timesheet", name:"Timesheet Agent", shape:"control-cube", tint:"#16241f", state:"waiting", role:"Reconciles clock events against main-contractor registers",
   when:"Tue", preview:"EXC-401: +2.0h on patrick o'sullivan. held for review.",
   thread:[
     {kind:"stamp", text:"Tuesday 17:02"},
     {kind:"agent", text:"imported the CHD register for Mon 16 Nov. 6 of 7 Cappamore lines match. Patrick O'Sullivan: 8.0h on ours, 10.0h on theirs. Our clock events say 06:56 to 15:26; Liam's diary says the crew stood down at 15:30 for wind."},
     {kind:"agent", text:"opened EXC-401 and held his Monday payroll line. Aoife or Colm needs to decide, with a reason."}
   ]},
  {id:"comms", name:"Communications Agent", shape:"offset-pebble", tint:"#241b2e", state:"working", role:"Sorts email, texts and call notes so you only see what needs you",
   when:"07:08", preview:"24 threads sorted. 5 need you. 3 drafts ready.",
   thread:[
     {kind:"stamp", text:"Today 07:06"},
     {kind:"agent", text:"24 threads this week. 5 need you: John Murphy (Liam's text), Gerard Ryan on EXC-401, Aoife on INV-301, the quiet Killorglin quote, and Eoin on Castleisland Rev B."},
     {kind:"agent", text:"3 drafts waiting: the INV-301 reminder, the QUO-201 follow-up and a reply to Eoin. Approving marks them ready to send. Nothing is sent from here."}
   ]},
  {id:"quotation", name:"Quotation Agent", shape:"executive-capsule", tint:"#2a2118", state:"waiting", role:"Tracks enquiries from first call to signed quote",
   when:"07:01", preview:"QUO-201 nine days quiet. follow-up drafted.",
   thread:[
     {kind:"stamp", text:"Today 07:00"},
     {kind:"agent", text:"QUO-201, Killorglin, €76,500: sent 9 Nov, no reply. Follow-up drafted. QUO-203, Limerick maintenance, €42,000: follow-up due today."},
     {kind:"agent", text:"QUO-202, Castleisland: Rev B logged, Rev A superseded. Eoin's v0.3 is €24,800 indicative, waiting on site measurements. I proposed the drawing categories; you confirmed them. I don't measure."}
   ]},
  {id:"finance", name:"Finance Agent", shape:"rim-capsule", tint:"#1e2b26", state:"waiting", role:"Keeps debtors and job costs in view from the QuickBooks export (simulated)",
   when:"06:30", preview:"INV-301 €24,600, 18 days overdue. reminder drafted.",
   thread:[
     {kind:"stamp", text:"Today 06:30"},
     {kind:"agent", text:"QuickBooks export (simulated) read at 02:05. Unpaid €37,800: INV-301 €24,600 overdue 18 days, INV-302 €13,200 due 25 Nov. INV-303 paid 13 Nov."},
     {kind:"agent", text:"drafted a friendly reminder to Cappamore Housing Developments for INV-301. QuickBooks stays the system of record; I don't write to it."}
   ]}
];

const KPI_DEFS = kpiDefs(getState());

const ASPECT_DEFS = aspects(getState());

const FILTER_GROUPS = [
  {title:"AREA", items:["Executive","Delivery","Labour","Commercial"]},
  {title:"SITE", items:["Cappamore","Tralee","Killarney"]},
  {title:"TIME", items:["Today","This week","This month"]}
];

const OPS_DEFS = [
  {id:"o1", name:"07:00 roll call", kind:"routine", owner:"Attendance Agent", ownerKind:"agent", initials:"AT",
   trigger:"Weekdays, 07:15", triggerKind:"schedule", next:"Tomorrow 07:15", last:"1 no clock-in flagged", status:"approval", rate:99, on:true,
   what:"Compares today's roster with clock events, flags late and missing arrivals, and drafts a confirmation when someone is unaccounted for.",
   why:"Colm was ringing three site leads every morning to find out who turned up.",
   saved:"6 hours a month",
   steps:[["Trigger","Weekdays at 07:15"],["Find","Roster for today, clock events since 06:00"],["Check","Absences and site texts"],["Draft","Confirmation text for anyone missing"],["Approval","Colm or the site lead approves","gate"],["Update","Exceptions shown on Home and Workforce"]],
   runs:[["Today 07:15","4s","partial","13 on time · 2 late · 1 missing","€0.00","John Murphy: no clock-in"],["Tue 07:15","4s","ok","17 of 17 on time","€0.00"],["Mon 07:15","3s","ok","18 of 18 on time","€0.00"]]},
  {id:"o2", name:"Attendance to payroll", kind:"automation", owner:"Timesheet Agent", ownerKind:"agent", initials:"TS",
   trigger:"Daily, 17:00", triggerKind:"schedule", next:"17:00", last:"EXC-401 held", status:"approval", rate:96, on:true,
   what:"Turns clock events into day records, reconciles them against main-contractor registers and holds any line that disagrees.",
   why:"Two-hour differences with a main contractor took an afternoon of phone calls to settle.",
   saved:"10 hours a month",
   steps:[["Trigger","Daily at 17:00, and on every register import"],["Find","Clock events and day sheets"],["Check","Compare with the main contractor's register"],["Approval","Variances need a named reviewer and a reason","gate"],["Update","Release approved lines to the payroll preview"]],
   runs:[["Tue 17:02","12s","partial","6 of 7 matched","€0.01","EXC-401 opened: +2.0h"],["Mon 17:00","10s","ok","18 day records","€0.01"]]},
  {id:"o3", name:"Enquiry to quote", kind:"automation", owner:"Quotation Agent", ownerKind:"agent", initials:"QA",
   trigger:"Call note or drawings received", triggerKind:"event", next:"Event-based", last:"Rev B logged for QUO-202", status:"healthy", rate:98, on:true,
   what:"Logs the call, files the drawings against the enquiry, proposes a category, hands it to the QS and tracks the estimate to Colm's approval.",
   why:"Drawings sat in the inbox and nobody knew which ones the QS had.",
   saved:"8 hours a month",
   steps:[["Trigger","A call note or drawings arrive"],["Find","Match to the customer and enquiry"],["Draft","Propose a drawing category"],["Approval","Colm confirms and hands to the QS","gate"],["Update","Track QS estimate to Colm review"]],
   runs:[["Tue 09:20","5s","ok","Rev B logged, Rev A superseded","€0.00"],["Mon 10:20","4s","ok","Rev A handed to QS","€0.00"]]},
  {id:"o4", name:"Invoice to collection", kind:"automation", owner:"Finance Agent", ownerKind:"agent", initials:"FA",
   trigger:"Nightly, after the QuickBooks export", triggerKind:"schedule", next:"02:05", last:"INV-301 reminder drafted", status:"approval", rate:97, on:true,
   what:"Reads the QuickBooks export (simulated), ages every invoice and drafts a friendly reminder for anything past due.",
   why:"Colm only found out about overdue claims when he asked the office.",
   saved:"5 hours a month",
   steps:[["Trigger","After the nightly export"],["Find","Unpaid invoices"],["Check","Remittances and disputes"],["Draft","Reminder in Colm's tone"],["Approval","Colm approves","gate"],["Update","Mark ready to send (simulated)"]],
   runs:[["Today 06:30","6s","ok","1 reminder drafted","€0.01"],["Fri 11:40","3s","ok","INV-303 remittance matched","€0.00"]]},
  {id:"o5", name:"Morning briefing", kind:"routine", owner:"Briefing", ownerKind:"agent", initials:"BR",
   trigger:"Weekdays, 07:18", triggerKind:"schedule", next:"Tomorrow 07:18", last:"Posted 07:18", status:"healthy", rate:100, on:true,
   what:"Reads attendance, timesheets, debtors, quotes and the priority inbox, and says what needs Colm before his first call.",
   why:"Colm leaves at 05:15 and needs the day on one screen.",
   saved:"9 hours a month",
   steps:[["Trigger","Weekdays at 07:18"],["Find","Roll call, exceptions, debtors, quotes"],["Draft","Write the briefing"],["Update","Post to Home"]],
   runs:[["Today 07:18","3s","ok","1 briefing","€0.00"],["Tue 07:18","3s","ok","1 briefing","€0.00"]]},
  {id:"o6", name:"Quote follow-up", kind:"routine", owner:"Quotation Agent", ownerKind:"agent", initials:"QA",
   trigger:"Daily, 07:00", triggerKind:"schedule", next:"Tomorrow 07:00", last:"QUO-201 follow-up drafted", status:"approval", rate:95, on:true,
   what:"Finds quotes with no reply after 7 days and drafts a short follow-up.",
   why:"Priced jobs were going quiet because nobody remembered to chase.",
   saved:"4 hours a month",
   steps:[["Trigger","Daily at 07:00"],["Find","Sent quotes 7+ days without reply"],["Draft","Follow-up email"],["Approval","Colm approves","gate"],["Update","Mark ready to send (simulated)"]],
   runs:[["Today 07:00","2s","ok","1 drafted, 1 flagged","€0.00"]]},
  {id:"o7", name:"Payroll export preview", kind:"report", owner:"Aoife O'Shea", ownerKind:"person", initials:"AO",
   trigger:"Fri, 15:00", triggerKind:"schedule", next:"Fri 15:00", last:"Week 46 submitted", status:"healthy", rate:100, on:true,
   what:"Builds the weekly hours preview from approved day records. Held lines stay out until resolved. Preview only; payroll is not changed.",
   why:"Payroll was keyed from paper sheets every Friday.",
   saved:"6 hours a month",
   steps:[["Trigger","Friday at 15:00"],["Find","Approved day records"],["Check","Held lines and open variances"],["Draft","Preview file"],["Approval","Aoife submits","gate"]],
   runs:[["Fri 13 Nov 15:00","9s","ok","Week 46 · 18 people","€0.00"]]},
  {id:"o8", name:"Programme watch", kind:"task", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"Every 30 minutes", triggerKind:"schedule", next:"07:30", last:"Tralee milestone at risk", status:"healthy", rate:98, on:true,
   what:"Checks deliveries, issues and photos against each programme and raises anything that moves a milestone.",
   why:"Slips were found on site, not in advance.",
   saved:"3 hours a month",
   steps:[["Trigger","Every 30 minutes"],["Find","Supplier emails, site issues, photos"],["Check","Milestone dates"],["Update","Raise a site issue"]],
   runs:[["Today 07:04","2s","ok","ISS-3 raised","€0.00"]]}
];

const OPS_FILTERS = [
  ["all","All"], ["routine","Agent routines"], ["automation","Automations"],
  ["report","Scheduled reports"], ["task","Recurring tasks"], ["approval","Needs approval"], ["failed","Failed"]
];

const WORK_SECTIONS = [
  {id:"tasks", label:"Tasks", blurb:"Everything assigned to Colm, the office and the site leads, by department and deadline.",
   views:["All tasks","Due tasks","Review","Done"], filters:["Due date","Any status","Anyone","Any department"]},
  {id:"approvals", label:"Approvals", blurb:"Drafts, timesheet variances and QS estimates. Every decision is written as the person who made it.",
   views:["Awaiting you","Awaiting others","Decided"], filters:["Raised date","Any value","Anyone"]},
  {id:"workflows", label:"Workflows", blurb:"Enquiry to quote, attendance to payroll, invoice to collection: what runs on its own, and who owns it.",
   views:[], filters:[]},
  {id:"schedules", label:"Schedules", blurb:"Roll calls, briefings, reconciliations and follow-ups across the week.",
   views:[], filters:[]}
];

const WORK_TASKS = workTasks(getState());

const WORKFLOWS = [
  {name:"Attendance to payroll", state:"live", trigger:"schedule · daily 17:00",
   actions:[["timesheets.reconcile","write"]], lastRun:"Tue 17:02",
   result:"6 of 7 matched · 1 held", resultKind:"warn", runSummary:"2 ok · 1 partial",
   runs:["ok","ok","partial"]}
];

const SCHEDULES = [
  {id:"s1", name:"07:00 roll call", cadence:"Weekdays · 07:15", next:"Tomorrow 07:15", owner:"Attendance Agent", on:true, day:1},
  {id:"s2", name:"Morning briefing", cadence:"Weekdays · 07:18", next:"Tomorrow 07:18", owner:"Briefing", on:true, day:1},
  {id:"s3", name:"Timesheet reconciliation", cadence:"Daily · 17:00", next:"Today 17:00", owner:"Timesheet Agent", on:true, day:2},
  {id:"s4", name:"QuickBooks export read (simulated)", cadence:"Nightly · 02:05", next:"Tonight", owner:"Finance Agent", on:true, day:2},
  {id:"s5", name:"Payroll export preview", cadence:"Fridays · 15:00", next:"Fri 15:00", owner:"Aoife O'Shea", on:true, day:4}
];

const WIDGET_DEFS = [["today","Business today"],["briefing","Morning briefing"],["attention","Needs attention"],["sites","Site snapshot"],["actions","Suggested actions"],["activity","Recent activity"]];
const WORK_WIDGETS = [
  {id:"queue", label:"My queue", value:"6", hint:"assigned to Colm", icon:"work", queue:"mine"},
  {id:"late", label:"Due today", value:"5", hint:"before close of day", icon:"health", queue:"overdue"},
  {id:"unassigned", label:"Office", value:"3", hint:"with Aoife", icon:"teams", queue:"team"},
  {id:"week", label:"Next 7 days", value:"5", hint:"due this week", icon:"visits", queue:"upcoming"}
];
const PERSONALITIES = ["Straight-talking","Warm","Formal","Dry"];
const ANSWER_STYLES = ["Short answers","Show the working","Ask before acting"];
/* Every context source and every registered tool the agent could be granted —
   the builder shows the whole catalogue, grouped, rather than a sample. */
const CONTEXT_DEFS = [
  ["Customers","records","Contacts, source, history"],
  ["People","records","Crew, office and QS"],
  ["Files","records","Drawings, sheets, checklists"],
  ["Jobs","work","Sites, programmes, crews"],
  ["Attendance","work","Roster and clock events"],
  ["Approvals","work","What is waiting on a decision"],
  ["Invoices","money","QuickBooks export (simulated)"],
  ["Quotes","money","Enquiries, estimates, quotes"],
  ["Timesheets","money","Day records and variances"],
  ["Activity log","system","Every event, agent and human"],
  ["Messages","system","Email, texts, call notes"],
  ["Policies","system","AI controls and governance"]
];
const CONTEXT_SOURCES = CONTEXT_DEFS.map(c => c[0]);
const SKILL_DEFS = [
  ["Search records","read"],["Summarise activity","read"],["Read invoices","read"],
  ["Read attendance","read"],["Check permissions","read"],
  ["Draft email","write"],["Create task","write"],["Raise site issue","write"],
  ["Hold payroll line","write"],["Raise approval","write"],
  ["Send email","external"],["Send text","external"],["Write to QuickBooks","external"]
];
/* The two questions the agent asks back once it knows the job. */
const TRAIN_PHASES = [
  ["Reading the whole ontology", "jobs, crew, quotes, invoices"],
  ["Learning how this business words things", "task → job, organisation → customer"],
  ["Researching the roofing & building domain", "dayworks, payment applications"],
  ["Writing its own system prompt", "1,180 tokens"]
];
const BRIEF_QUESTIONS = [
  {title:"What should it cover?", sub:"Pick as many as you like — we can refine later.",
   options:[["Crew","Who is on site and who is missing"],["Email","Customers, QS and site texts"],
            ["Jobs","Programmes and site issues"],["Money","Overdue invoices and quotes going quiet"],
            ["Something else","Tell me in the next message"]]},
  {title:"When should it land?", sub:"One is enough to start.",
   options:[["Every morning 07:20","After the roll call"],["Weekdays 08:00","Monday to Friday only"],
            ["Only when something changes","Event-driven, no noise"],["On demand","When you ask for it"]]}
];
/* The words under a name, keyed to the same state the face lights with. */
const STATE_LABELS = {working:"working", thinking:"thinking", waiting:"waiting on you",
  complete:"up to date", attention:"needs you", idle:"idle"};

const FACE_SHAPES = [
  ["crown-pebble","Pebble"],["executive-capsule","Executive"],["shield","Shield"],
  ["glass-visor","Visor"],["control-cube","Control cube"],["low-dome","Low dome"],
  ["offset-pebble","Offset pebble"],["rim-capsule","Capsule"],["wide-eyed","Wide-eyed"],
  ["precision-brow","Precision brow"],["tall-unit","Tall unit"],["soft-asymmetric","Soft asymmetric"]
];
/* Shell colours only, deliberately desaturated so none of them reads as a
   state. Each is a pair: the deep shell for light themes and its pale partner
   for dark ones (the eyes take the other). The status light carries the state. */
const FACE_TINTS = [
  ["#191c1f","Graphite","#e3e6e8"],["#1b2430","Slate","#d3dde9"],["#241b2e","Aubergine","#ddd4ea"],
  ["#2a2118","Bronze","#eadccb"],["#16241f","Pine","#d1e4da"],["#2b1b1e","Oxblood","#eed5d7"]
];

/* ---- ontology graph: generation, Dijkstra traversal, canvas render ---- */
const CLUSTERS = [
  ["Customers",  "#c8f04b", 0.00, 0.62, 46],
  ["Quotes",     "#6ad0f0", 0.90, 0.70, 52],
  ["Drawings",   "#b06cf0", 1.75, 0.66, 58],
  ["Jobs",       "#f0c04b", 2.55, 0.72, 44],
  ["Invoices",   "#f0567f", 3.35, 0.60, 38],
  ["Workforce",  "#5fe0a8", 4.15, 0.70, 40],
  ["Sites",      "#f0803a", 4.95, 0.64, 30],
  ["Timesheets", "#5f7cf0", 5.65, 0.72, 34]
];

function mulberry(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Hub-and-spoke clusters around a dense phyllotaxis core, in unit space
   (-1..1 on both axes) so the layout is resolution independent. */
const _hexCache = {};
function hexRGB(hex){
  if (_hexCache[hex]) return _hexCache[hex];
  const h = hex.replace("#", "");
  const v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  _hexCache[hex] = v;
  return v;
}


function buildGraph(){
  const rnd = mulberry(20260902);
  const nodes = [], edges = [], adj = [];
  const add = (x, y, z, r, cluster, kind) => {
    nodes.push({x, y, z, r, cluster, kind}); adj.push([]); return nodes.length - 1;
  };
  const link = (a, b) => {
    const dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, dz = nodes[a].z - nodes[b].z;
    const w = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.004;
    const id = edges.length;
    edges.push({a, b, w});
    adj[a].push([b, w, id]); adj[b].push([a, w, id]);
  };

  // the core is a filled sphere on a Fibonacci lattice, not a disc
  const CORE = 880, coreIds = [];
  for (let i = 0; i < CORE; i++){
    const t = (i + 0.5) / CORE;
    const phi = Math.acos(1 - 2 * t);
    const theta = i * 2.39996;
    const shell = 0.16 + 0.28 * Math.pow(rnd(), 0.5);
    const grade = rnd();
    coreIds.push(add(
      Math.sin(phi) * Math.cos(theta) * shell * 1.04,
      Math.cos(phi) * shell * 0.96,
      Math.sin(phi) * Math.sin(theta) * shell,
      grade < 0.06 ? 3.4 + rnd() * 1.4 : grade < 0.3 ? 2.1 + rnd() * 0.7 : 1.0 + rnd() * 0.8, 0, "core"));
  }
  // lattice neighbours plus a mesh of chords, so the sphere reads as a volume
  for (let i = 1; i < coreIds.length; i++){
    link(coreIds[i], coreIds[i - 1]);
    if (i >= 13) link(coreIds[i], coreIds[i - 13]);
    if (i >= 21 && i % 2 === 0) link(coreIds[i], coreIds[i - 21]);
    if (i >= 34 && i % 3 === 0) link(coreIds[i], coreIds[i - 34]);
    if (i >= 55 && i % 4 === 0) link(coreIds[i], coreIds[i - 55]);
    if (i >= 89 && i % 5 === 0) link(coreIds[i], coreIds[i - 89]);
    if (i % 6 === 0) link(coreIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // a mid shell between the nucleus and the lobes: the layer that makes it
  // read as a network rather than a ball with satellites
  const MID = 560, midIds = [];
  for (let i = 0; i < MID; i++){
    const t = (i + 0.5) / MID;
    const phi = Math.acos(1 - 2 * t), theta = i * 2.39996 + 0.7;
    const d = 0.52 + 0.16 * Math.pow(rnd(), 0.6);
    const g2 = rnd();
    midIds.push(add(
      Math.sin(phi) * Math.cos(theta) * d * 1.02,
      Math.cos(phi) * d * 0.96,
      Math.sin(phi) * Math.sin(theta) * d,
      g2 < 0.05 ? 2.6 + rnd() * 1.0 : g2 < 0.3 ? 1.6 + rnd() * 0.6 : 0.8 + rnd() * 0.7, 0, "core"));
  }
  for (let i = 0; i < midIds.length; i++){
    if (i >= 1) link(midIds[i], midIds[i - 1]);
    if (i >= 17) link(midIds[i], midIds[i - 17]);
    if (i >= 29 && i % 2 === 0) link(midIds[i], midIds[i - 29]);
    // radial spokes tying the shell to the nucleus
    if (i % 2 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
    if (i % 9 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // clusters ride a sphere: each hub gets its own latitude as well as longitude
  const hubs = [], clusterLeaves = [];
  const onSphere = (lon, lat, d0) => { const d = d0 * 1.22;
    return [Math.cos(lat) * Math.cos(lon) * d * 1.02, Math.sin(lat) * d * 0.96, Math.cos(lat) * Math.sin(lon) * d]; };
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist, leaves] = c;
    const lat = (ci % 2 ? 1 : -1) * (0.26 + rnd() * 0.5);
    const wob = 1.06 + rnd() * 0.16;
    const hp = onSphere(ang, lat, dist * wob);
    const hub = add(hp[0], hp[1], hp[2], 5.4, ci, "hub");
    hubs.push(hub);
    const mine = [];
    clusterLeaves.push(mine);
    for (let k = 0; k < 3; k++) link(hub, coreIds[Math.floor(rnd() * coreIds.length)]);
    for (let k = 0; k < 5; k++) link(hub, midIds[Math.floor(rnd() * midIds.length)]);

    const subs = 5 + Math.floor(rnd() * 4);
    const subIds = [];
    for (let s = 0; s < subs; s++){
      const sa = ang + (rnd() - 0.5) * 0.52, sl = lat + (rnd() - 0.5) * 0.3;
      const sd = dist + 0.08 + rnd() * 0.18;
      const sp = onSphere(sa, sl, sd);
      const sub = add(sp[0], sp[1], sp[2], 3.2, ci, "sub");
      subIds.push(sub);
      link(sub, hub);
      if (s > 0 && rnd() < 0.7) link(sub, subIds[s - 1]);
      const fan = Math.floor((leaves * 7.4) / subs);
      const spread = 0.17 + rnd() * 0.2;
      let prev = -1;
      for (let l = 0; l < fan; l++){
        const la = sa + (rnd() - 0.5) * spread * 2 + (rnd() - 0.5) * 0.06;
        const ll = sl + (rnd() - 0.5) * spread * 1.1;
        const ld = sd + 0.03 + Math.pow(rnd(), 0.8) * 0.17;
        const lp = onSphere(la, ll, ld);
        const lg = rnd();
        const leaf = add(lp[0], lp[1], lp[2],
          lg < 0.08 ? 2.8 + rnd() * 1.2 : lg < 0.34 ? 1.8 + rnd() * 0.6 : 1.0 + rnd() * 0.7, ci, "leaf");
        link(leaf, sub);
        mine.push(leaf);
        if (rnd() < 0.14) link(leaf, hub);
        if (prev >= 0 && rnd() < 0.34) link(leaf, prev);
        if (rnd() < 0.16) link(leaf, midIds[Math.floor(rnd() * midIds.length)]);
        prev = leaf;
      }
    }
  });
  // far satellites hanging off the outer leaves
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist] = c;
    for (let s = 0; s < 7; s++){
      const sa = ang + (rnd() - 0.5) * 1.5, sl = (rnd() - 0.5) * 1.3;
      const sd = dist + 0.42 + rnd() * 0.22;
      const ap = onSphere(sa, sl, sd);
      const anchor = add(ap[0], ap[1], ap[2], 2.4, ci, "sub");
      link(anchor, hubs[ci]);
      const n = 14 + Math.floor(rnd() * 18);
      for (let l = 0; l < n; l++){
        const la = sa + (rnd() - 0.5) * 0.9, ll = sl + (rnd() - 0.5) * 0.7;
        const ld = sd + 0.02 + Math.pow(rnd(), 0.8) * 0.18;
        const p = onSphere(la, ll, ld);
        const leaf = add(p[0], p[1], p[2], 0.8 + rnd() * 0.9, ci, "leaf");
        link(leaf, anchor);
        clusterLeaves[ci].push(leaf);
      }
    }
  });

  // two hub rings and long chords across the sphere
  hubs.forEach((h, i) => {
    link(h, hubs[(i + 1) % hubs.length]);
    link(h, hubs[(i + 2) % hubs.length]);
    if (i % 3 === 0) link(h, hubs[(i + 4) % hubs.length]);
  });
  // neighbouring clusters share records, so their leaves cross-link
  for (let ci = 0; ci < clusterLeaves.length; ci++){
    const a = clusterLeaves[ci], b = clusterLeaves[(ci + 1) % clusterLeaves.length];
    const n = 26 + Math.floor(rnd() * 16);
    for (let k = 0; k < n; k++){
      link(a[Math.floor(rnd() * a.length)], b[Math.floor(rnd() * b.length)]);
    }
    // and a good number reach right across to the far side
    for (let k = 0; k < 12; k++){
      const far = clusterLeaves[(ci + 3) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
    for (let k = 0; k < 8; k++){
      const far = clusterLeaves[(ci + 4) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
  }

  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const n of nodes){
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    if (n.z < minZ) minZ = n.z; if (n.z > maxZ) maxZ = n.z;
  }
  const bounds = {minX, maxX, minY, maxY, cx:(minX + maxX) / 2, cy:(minY + maxY) / 2,
    cz:(minZ + maxZ) / 2, w:maxX - minX, h:maxY - minY, d:maxZ - minZ,
    radius: Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2,
    reach: nodes.reduce((m, n) => Math.max(m, Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z)), 0)};
  return {nodes, edges, adj, hubs, coreIds, bounds};
}

export {
  INK,
  BODY,
  DIM,
  FAINT,
  LIME,
  GREEN,
  AMBER,
  RED,
  NEUTRAL,
  MONO,
  ICONS,
  REC_SECTIONS,
  CONTACTS,
  FILE_TREE,
  ONTO_NODES,
  ONTO_EDGES,
  REC_TEMPLATES,
  REC_TEMPLATE_CATS,
  PEOPLE,
  ROLE_LEVELS,
  PERM_KEYS,
  GRANT_DEFS,
  ROLE_SCOPES,
  DEFAULT_PERMS,
  INTEGRATIONS,
  BG_DEFS,
  THEMES,
  ADMIN_ICONS,
  ADMIN_CARDS,
  ADMIN_GROUPS,
  SRC_TINT,
  SRC_ABBR,
  DATA_EVENTS,
  PEOPLE_EVENTS,
  AI_EVENTS,
  STREAM_DEFS,
  NAV,
  ITEMS,
  ORDER,
  ANSWERS,
  synthesizeCustomArea,
  pickAnswer,
  ORGS,
  TEAMS,
  LOCATIONS,
  AGENT_DEFS,
  KPI_DEFS,
  ASPECT_DEFS,
  FILTER_GROUPS,
  OPS_DEFS,
  OPS_FILTERS,
  WORK_SECTIONS,
  WORK_TASKS,
  WORKFLOWS,
  SCHEDULES,
  WIDGET_DEFS,
  WORK_WIDGETS,
  PERSONALITIES,
  ANSWER_STYLES,
  CONTEXT_DEFS,
  CONTEXT_SOURCES,
  SKILL_DEFS,
  TRAIN_PHASES,
  BRIEF_QUESTIONS,
  STATE_LABELS,
  FACE_SHAPES,
  FACE_TINTS,
  CLUSTERS,
  mulberry,
  _hexCache,
  hexRGB,
  buildGraph
};
