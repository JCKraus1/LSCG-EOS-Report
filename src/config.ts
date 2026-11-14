export const WEBHOOK_URL =
  'https://default4646f10c241749ee975a5c79c27418.6c.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/03/workflows/c1645c8b41f8427a9bbb5aed088891e1/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=5S-82CNjHXaUOGzULM1QNm7mCFFgRO5yiapx29VvGbY';

export const MARKETS = [
  'Clearwater',
  'Pinellas',
  'Manatee',
  'Fort Myers',
  'Port Charlotte',
  'Kissimmee',
  'Miami'
] as const;

export type Market = (typeof MARKETS)[number];

export interface ContractorEntry {
  name: string;
  contacts: string[];
  emails: string[];
}

export const CONTRACTORS: ContractorEntry[] = [
  {
    name: '1972 Fiber Core',
    contacts: ['Gustavo'],
    emails: ['gdv@1972fibercore.com']
  },
  {
    name: 'A1 Broadband',
    contacts: ['Junior', 'Kemael'],
    emails: ['jquiles@a1broadband.com', 'georges@a1broadband.com']
  },
  {
    name: 'AG Quatility Construction',
    contacts: ['Daniel', 'Daniel Almeida'],
    emails: ['daniel@agqualityc.com', 'sara@agqualityc.com']
  },
  {
    name: 'AGN Undergrounds',
    contacts: ['Georgetth Navarro'],
    emails: ['construction@agnundergrounds.com', 'office@agnundergrounds.com']
  },
  {
    name: 'Alpha Omega',
    contacts: ['Jerry', 'Sergio'],
    emails: ['alphaomegadrilling@gmail.com']
  },
  {
    name: 'AMB Communications',
    contacts: ['Yoandy Melero'],
    emails: ['yoandy@ambcommunications.net']
  },
  {
    name: 'APT Communications',
    contacts: ['Eliel Frias', 'Cesar Flores', 'Adrian Tamayo'],
    emails: [
      'eliel.frias@aptcomm.com',
      'cflores@aptcomm.com',
      'operations.itg@aptcomm.com',
      'billing.itg@aptcomm.com'
    ]
  },
  {
    name: 'ASM Utilities',
    contacts: ['Aaron Marden'],
    emails: ['asmutilities25@gmail.com']
  },
  {
    name: 'Bicom',
    contacts: ['Juan'],
    emails: []
  },
  {
    name: 'Brothers',
    contacts: ['Dave Jr.', 'C. Whitehead', 'Mariana A.', 'J. Cordovilla'],
    emails: [
      's.david@brotherscomm.com',
      'c.whitehead@brotherscomm.com',
      'mariana.a@brotherscomm.com',
      'j.cordovilla@brotherscomm.com',
      'brothersutilities@gmail.com'
    ]
  },
  {
    name: "Digging D's Utilities",
    contacts: ['Dylan Dufriend'],
    emails: ['ddufriend@digutility.com']
  },
  {
    name: 'DMC Boring',
    contacts: ['Michael Crijan'],
    emails: ['mike@cottonwoodinvestments.com']
  },
  {
    name: 'Empire Cable',
    contacts: ['Eddy Cuevas'],
    emails: ['ecuevas@empirecable.net']
  },
  {
    name: 'GN Systems',
    contacts: ['Brett'],
    emails: ['brett@gnsystemsinc.com']
  },
  {
    name: 'GulfStream',
    contacts: ['Alex'],
    emails: ['alexosko98@gmail.com']
  },
  {
    name: 'HAS Global',
    contacts: ['Humberto'],
    emails: ['humberto@hasglobalusa.com']
  },
  {
    name: 'HD Cable',
    contacts: ['Ray'],
    emails: ['hdcable112020@outlook.com']
  },
  {
    name: 'KattleOne Communications',
    contacts: ['Steven Cottle', 'Corbin', 'Steven Skolny', 'Craig Lewis', 'Lauren', 'Steven Goldbaum'],
    emails: [
      'kattleonellc@gmail.com',
      'corbin@k-onecommunications.com',
      'steven.skolny@k-onecommunications.com',
      'craig.lewis@k-onecommunications.com',
      'lauren@k-onecommunications.com',
      'steven.goldbaum@k-onecommunications.com'
    ]
  },
  {
    name: 'Legant Livings',
    contacts: ['Massimo'],
    emails: ['massimog@legantlvgsllc.com']
  },
  {
    name: 'Lopez Underground',
    contacts: ['Alex Tejeda', 'Luis Gonzalez', 'David Lopez', 'Ricardo Arias'],
    emails: [
      'atejadam91@gmail.com',
      'lopezugcoordinator@gmail.com',
      'lopezundergroundcablecorp@gmail.com',
      'lopezundergroundcable@gmail.com'
    ]
  },
  {
    name: 'North Path Corp',
    contacts: ['Antonio'],
    emails: ['antonio.Northpath@gmail.com']
  },
  {
    name: 'OB Telecom',
    contacts: ['Jorge L Obregon Hernandez'],
    emails: ['obtelecom22@gmail.com']
  },
  {
    name: 'Optical Fiber Solutions',
    contacts: ['Justin Clerico'],
    emails: ['opticalfibersolutions@gmail.com']
  },
  {
    name: 'Patriot Underground Contractors',
    contacts: ['Scott Mirkle'],
    emails: ['Scott@patriotugc.com']
  },
  {
    name: 'Power Connect',
    contacts: ['Lucas', 'Vitor'],
    emails: [
      'lsantos@powerconnectusa.com',
      'vitor@powerconnectusa.com',
      'dsimao@powerconnectusa.com'
    ]
  },
  {
    name: 'Quinteros',
    contacts: ['Yoanki Quintero'],
    emails: ['yonkidayli@icloud.com']
  },
  {
    name: 'R&F Underground Const.',
    contacts: ['Rudy'],
    emails: []
  },
  {
    name: 'Randy Utilities',
    contacts: ['Alejandro'],
    emails: ['alejandroreyes0211@gmail.com']
  },
  {
    name: 'RDA Solutions',
    contacts: ['Felipe Rodriguez'],
    emails: ['yendri@rda.solutions']
  },
  {
    name: 'Restoring Pro',
    contacts: ['Ronald'],
    emails: ['ronaldbporto@gmail.com']
  },
  {
    name: 'Vito Service',
    contacts: ['Valeria Vito'],
    emails: []
  },
  {
    name: 'YOSEP Aerial Star Corp',
    contacts: ['Yosep'],
    emails: []
  }
];

export function findContractorByName(name: string): ContractorEntry | undefined {
  const normalized = (name || '').trim().toLowerCase();
  if (!normalized) return undefined;
  return CONTRACTORS.find((c) => c.name.toLowerCase() === normalized);
}

export function getContractorEmails(name: string): string[] {
  const entry = findContractorByName(name);
  return entry ? entry.emails : [];
}
