export interface ActivityRow {
  id: string;
  description: string;
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
  startAddress?: string;
  endAddress?: string;
  activityType?: 'construction' | 'fiber';
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
  '1.25" Conduit Bore',
  '24 Way HEX Bore',
  '12 Way HEX Bore',
  '2 Way HEX Bore',
  '2 Way HEX Hand Dig',
  'Toby Boxes',
  'DAP PITs',
  'Micro Splices',
  'FDH',
  'Ground Rod',
  'Vault',
  'MacLean Switch',
  'Swing Arm',
  'Other'
] as const;

export const CONSTRUCTION_MATERIAL_TYPES = MATERIAL_TYPES;

export const FIBER_MATERIAL_TYPES = [
  '48ct Fiber',
  '96ct Fiber',
  '144ct Fiber',
  'Tracer Wire',
  'Mule Tape',
  'Wreck Out',
  'MacLean Switch',
  'Stingray',
  'Strand',
  'Other'
] as const;

export const ACTIVITY_DESCRIPTIONS = [
  'Aerial',
  'Directional Bore',
  'Hand Trench',
  'Underground'
] as const;

export const MOT_ACTIVITIES = [
  'MOT Flagger (TCHR12 - 13)',
  'MOT Traffic Cones ( 10 per - TCHR68-72)',
  'MOT Work Zone Signage (TCHR65-67)',
  'MOT Vehicle (TCHR76-78)'
] as const;

export const MOT_CODES = [
  'TCHR12 - HR - Flagger - Normal Rate',
  'TCHR13 - HR - Flagger - Overtime Rate',
  'TCHR68 - HR - traffic cones - Normal Rate',
  'TCHR69 - HR - traffic cones - Over time Rate',
  'TCHR70 - Daily - traffic cones - Normal Rate',
  'TCHR71 - Daily - traffic cones - Over time Rate',
  'TCHR72 - Weekly – traffic cones - Normal Rate',
  'TCHR65 - HR - work zone sign - Normal Rate',
  'TCHR66 - Daily - work zone sign - Normal Rate',
  'TCHR67 - Weekly – work zone sign - Normal Rate',
  'TCHR76 - HR Vehicle rate - large vehicle - Normal Rate',
  'TCHR77 - HR Vehicle Rate - medium vehicle - Normal Rate',
  'TCHR78 - HR Vehicle Rate - small vehicle - Normal Rate'
] as const;


