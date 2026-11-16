/* Typed operating model for the Colm Curran Pulse demo.
   Every number on every screen is derived from rows of these types.
   ALL DATA IS ILLUSTRATIVE DEMO DATA. */

export type RecordKind =
  | "person" | "customer" | "site" | "job" | "quote" | "invoice" | "message"
  | "exception" | "document" | "estimate" | "enquiry" | "draft" | "issue" | "agent";

export interface RecordRef { kind: RecordKind; id: string }

/** The one lifecycle every proposed action moves through. */
export type ActionStatus = "Detected" | "Drafted" | "Awaiting approval" | "Approved" | "Simulated complete" | "Rejected";

export interface Company {
  tradingName: string;
  region: string;
  base: string;
  coverage: string;
  services: string[];
  md: string;
  website: string;
  demoDate: string;   // ISO date
  demoTime: string;   // HH:MM
  timezone: string;
}

export type PersonKind = "field" | "office" | "external";

export interface Person {
  id: string;
  name: string;
  role: string;
  kind: PersonKind;
  phone: string;              // placeholder only
  email: string;              // example.com only
  homeSiteId?: string;        // usual allocation
  startedWith: string;        // e.g. "2019"
  tickets: string[];          // Safe Pass, working at height...
  avgWeekHours: number;       // trailing 4-week average
}

export interface Customer {
  id: string;
  name: string;
  type: string;
  contact: string;
  contactRole: string;
  email: string;
  source: "Referral" | "Repeat customer";
  county: string;
  note: string;
}

export interface Site {
  id: string;
  name: string;
  town: string;
  county: string;
  jobId: string;
  leadId: string;
  geofenceM: number;
  access: string;
}

export interface Milestone {
  name: string;
  planned: string;      // ISO date
  forecast: string;     // ISO date
  done: boolean;
  plannedPct: number;   // planned % complete at this milestone
}

export interface Job {
  id: string;
  title: string;
  customerId: string;
  siteId: string;
  type: string;
  scope: string;
  contractValue: number;
  pctComplete: number;
  plannedPct: number;     // where the programme says it should be today
  status: "On programme" | "At risk" | "Ahead";
  start: string;
  finish: string;
  billing: string;
  quoteId: string;
  milestones: Milestone[];
  budgetCost: { labour: number; material: number; subcontract: number };
  costToDate: { labour: number; material: number; subcontract: number };
}

export interface Allocation {
  id: string;
  personId: string;
  siteId: string;
  date: string;          // ISO date
  start: string;         // HH:MM
  role: string;
}

export type ClockSource = "Mobile clock-in" | "Foreman entry" | "Supervisor correction" | "Paper sheet import";
export type LocationCheck = "Inside site boundary" | "Outside site boundary" | "Not captured";

export interface ClockEvent {
  id: string;
  personId: string;
  siteId: string;
  date: string;
  type: "in" | "out";
  time: string;          // HH:MM
  source: ClockSource;
  location: LocationCheck;
  verified: boolean;
  note?: string;
}

export interface Correction {
  id: string;
  personId: string;
  date: string;
  field: "Clock-in" | "Clock-out";
  before: string;
  after: string;
  reason: string;
  enteredBy: string;
  approvedBy?: string;
  at: string;            // ISO datetime
}

export interface Absence {
  id: string;
  personId: string;
  from: string;
  to: string;
  kind: "Annual leave" | "Rostered day off" | "Training" | "Sick leave";
  note: string;
  cover: "Not needed" | "Cover requested" | "Covered";
}

export type DayStatus = "Approved" | "Submitted" | "Exception" | "In progress" | "Exported";

export interface DayRecord {
  id: string;
  personId: string;
  jobId: string;
  date: string;
  in: string;
  out: string;
  breakMins: number;
  hours: number;
  source: "Pulse clock events" | "Internal sheet";
  status: DayStatus;
}

export interface ContractorLine {
  id: string;
  personId: string;
  jobId: string;
  date: string;
  hours: number;
  sheetRef: string;
}

export interface EvidenceItem { label: string; detail: string; docId?: string }
export interface HistoryItem { at: string; actor: string; text: string }

export interface TimesheetException {
  id: string;
  personId: string;
  jobId: string;
  date: string;
  internalHours: number;
  contractorHours: number;
  status: "Open" | "Resolved";
  lifecycle: ActionStatus;
  detectedBy: string;
  notes: string;
  evidence: EvidenceItem[];
  history: HistoryItem[];
  resolution?: { outcome: string; reviewer: string; reason: string; at: string };
}

export type PipelineStage =
  | "New Enquiry" | "Drawings Received" | "With QS" | "Colm Review" | "Sent" | "Follow-up" | "Won" | "Lost";

export interface Enquiry {
  id: string;
  customerId: string;
  title: string;
  channel: "Phone call" | "Email";
  source: "Referral" | "Repeat customer";
  referredBy?: string;
  receivedAt: string;     // ISO datetime
  callNote: string;
  drawingsAt?: string;
  quoteId?: string;
  stage: PipelineStage;
  checklist: { label: string; done: boolean }[];
}

export type DocKind = "Drawing" | "Site photo" | "QS estimate" | "Safety checklist" | "Programme" | "Timesheet" | "Invoice" | "Specification";

export interface Doc {
  id: string;
  title: string;
  kind: DocKind;
  version: string;
  date: string;
  by: string;
  size: string;
  jobId?: string;
  quoteId?: string;
  customerId?: string;
  note: string;
  supersededBy?: string;
}

export interface QSLine {
  item: string;
  type: "Labour" | "Material" | "Plant" | "Subcontract" | "Overheads";
  qty: number;
  unit: string;
  rate: number;
}

export interface QSEstimate {
  id: string;
  quoteId: string;
  qsId: string;
  version: string;
  status: "Awaiting measurements" | "Draft estimate" | "With Colm" | "Approved";
  basedOn: string[];    // doc ids
  lines: QSLine[];
  caveats: string[];
  notes: string;
  history: HistoryItem[];
}

export interface QuoteLine { item: string; amount: number }

export interface Quote {
  id: string;
  title: string;
  customerId: string;
  value: number;
  indicative: boolean;
  stage: PipelineStage;
  enquiryId?: string;
  sentDate?: string;
  followUpDue?: string;
  drawingIds: string[];
  estimateId?: string;
  jobId?: string;
  lines: QuoteLine[];
  note: string;
  lostReason?: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  jobId: string;
  amount: number;
  ref: string;
  issued: string;
  due: string;
  paidDate?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: string;
}

export type MsgCategory = "Payment" | "Quote" | "Drawings" | "Attendance" | "Timesheet" | "Site" | "Supplier" | "Enquiry" | "Admin";
export type Awaiting = "Customer" | "Supervisor" | "QS" | "Payment" | null;

export interface Message {
  id: string;
  channel: "Email" | "Call note" | "Text";
  from: string;
  fromRole: string;
  to: string;
  subject: string;
  body: string;
  at: string;                 // ISO datetime
  category: MsgCategory;
  priority: boolean;
  needsColm: boolean;
  rank: number;               // lower = more important
  why: string;
  linked: RecordRef[];
  customerId?: string;
  awaiting: Awaiting;
  read: boolean;
}

export type DraftKind = "Payment reminder" | "Quote follow-up" | "Email reply" | "Attendance confirmation" | "Site text";

export interface Draft {
  id: string;
  kind: DraftKind;
  replyTo?: string;          // message id
  to: string;
  subject: string;
  body: string;
  status: ActionStatus;
  agentId: string;
  linked: RecordRef[];
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  edited: boolean;
}

export interface Task {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  ownerId: string;
  due: string;               // ISO datetime or date
  dueLabel: string;
  department: "Operations" | "Office" | "Commercial" | "Finance";
  related: RecordRef[];
  status: "Open" | "In progress" | "Done";
}

export interface Issue {
  id: string;
  siteId: string;
  title: string;
  detail: string;
  severity: "High" | "Medium" | "Low";
  ownerId: string;
  due: string;
  raised: string;
  status: "Open" | "Resolved";
  related: RecordRef[];
  resolution?: string;
}

export interface AgentDef {
  id: string;
  name: string;
  shape: string;
  tint: string;
  purpose: string;
  trigger: string;
  inputs: string[];
  output: string;
  detects: string[];
  escalation: string;
  approvalRule: string;
  confidence: number;      // 0-100, illustrative
  state: "working" | "thinking" | "waiting" | "complete" | "attention" | "idle";
}

export interface AgentAction {
  id: string;
  agentId: string;
  at: string;
  title: string;
  detail: string;
  related: RecordRef[];
  status: ActionStatus;
  reviewerId?: string;
}

export type AuditCategory = "staff" | "agent" | "system";

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  category: AuditCategory;
  action: string;
  detail: string;
  related: RecordRef[];
}

export interface Policy {
  key: string;
  label: string;
  detail: string;
  on: boolean;
  locked?: boolean;
}

export interface DemoData {
  company: Company;
  people: Person[];
  customers: Customer[];
  sites: Site[];
  jobs: Job[];
  allocations: Allocation[];
  clockEvents: ClockEvent[];
  corrections: Correction[];
  absences: Absence[];
  dayRecords: DayRecord[];
  contractorLines: ContractorLine[];
  exceptions: TimesheetException[];
  enquiries: Enquiry[];
  documents: Doc[];
  estimates: QSEstimate[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  messages: Message[];
  drafts: Draft[];
  tasks: Task[];
  issues: Issue[];
  agents: AgentDef[];
  agentActions: AgentAction[];
  audit: AuditEvent[];
  policies: Policy[];
}
