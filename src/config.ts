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
