export interface ActivityRow {
  id: string;
  description: string;
  start: string;
  end: string;
  material: string;
  quantity: string;
}

export interface MotRow {
  id: string;
  activity: string;
  code: string;
  hours: string;
}

export interface ShiftReportData {
  date: string;
  project: string;
  contractor: string;
  submittedBy: string;
  vendor: string;
  totalFootage: string;
  activities: ActivityRow[];
  motItems: MotRow[];
  revisions: string;
  issues: string;
  nextDay: string;
  signature: string;
  supervisor: string;
  attachedFilesList?: string[];
}

export const MATERIAL_TYPES = [
  '1.5" Conduit Bore',
  '24 Way HEX Bore',
  '12 Way HEX Bore',
  '2 Way HEX Bore',
  '2 Way HEX Hand Dig',
  'Toby Boxes',
  'DAP PITs',
  'Micro Splices',
  'Other'
] as const;
