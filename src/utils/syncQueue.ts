import { WEBHOOK_URL } from '../config';
import { EosPayload } from '../types';

export const QUEUE_DB_NAME = 'eosSync';
export const QUEUE_STORE_NAME = 'queue';
export const RECENT_PROJECTS_KEY = 'eosRecentProjects';

export interface SendResult {
  success: boolean;
  duplicate?: boolean;
  itemId?: string | number;
  message?: string;
  error?: string;
}

type QueueListener = (count: number) => void;
const queueListeners: Set<QueueListener> = new Set();

export function subscribeQueueCount(listener: QueueListener): () => void {
  queueListeners.add(listener);
  getQueueCount().then(listener).catch(() => listener(0));
  return () => {
    queueListeners.delete(listener);
  };
}

function notifyQueueListeners(count: number) {
  queueListeners.forEach((fn) => {
    try {
      fn(count);
    } catch (err) {
      console.error('Error notifying queue listener:', err);
    }
  });
}

function openQueueDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(QUEUE_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        db.createObjectStore(QUEUE_STORE_NAME, { keyPath: 'submissionId' });
      }
    };
  });
}

export async function enqueueReport(payload: EosPayload): Promise<void> {
  const item = {
    ...payload,
    queuedAt: new Date().toISOString()
  };

  try {
    const db = await openQueueDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for queue item', err);
    try {
      const existing = JSON.parse(localStorage.getItem('eos_fallback_queue') || '[]');
      const filtered = existing.filter((x: any) => x.submissionId !== payload.submissionId);
      filtered.push(item);
      localStorage.setItem('eos_fallback_queue', JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to store queue item in fallback storage', e);
    }
  }

  const count = await getQueueCount();
  notifyQueueListeners(count);
}

export async function removeQueuedReport(submissionId: string): Promise<void> {
  try {
    const db = await openQueueDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE_NAME);
      const req = store.delete(submissionId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Removing from localStorage fallback queue', err);
    try {
      const existing = JSON.parse(localStorage.getItem('eos_fallback_queue') || '[]');
      const filtered = existing.filter((x: any) => x.submissionId !== submissionId);
      localStorage.setItem('eos_fallback_queue', JSON.stringify(filtered));
    } catch (e) {
      console.error(e);
    }
  }

  const count = await getQueueCount();
  notifyQueueListeners(count);
}

export async function getQueuedReports(): Promise<EosPayload[]> {
  try {
    const db = await openQueueDB();
    const items = await new Promise<any[]>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE_NAME, 'readonly');
      const store = tx.objectStore(QUEUE_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    items.sort((a, b) => {
      const ta = a.queuedAt || a.reportDate || '';
      const tb = b.queuedAt || b.reportDate || '';
      return ta.localeCompare(tb);
    });

    return items;
  } catch (err) {
    try {
      const existing = JSON.parse(localStorage.getItem('eos_fallback_queue') || '[]');
      return existing;
    } catch {
      return [];
    }
  }
}

export async function getQueueCount(): Promise<number> {
  const items = await getQueuedReports();
  return items.length;
}

/**
 * Sends a single payload to the webhook endpoint with a 120-second timeout.
 * Returns SendResult.
 */
export async function sendPayloadToWebhook(payload: EosPayload): Promise<SendResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, error: 'Device is offline' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.status !== 200) {
      const errorText = await res.text().catch(() => '');
      return {
        success: false,
        error: `Server returned HTTP ${res.status}: ${errorText || res.statusText}`
      };
    }

    const json = await res.json().catch(() => ({}));
    const rawStatus = (json.status || '').toLowerCase();

    if (rawStatus === 'success' || rawStatus === 'duplicate') {
      const itemId = json.itemId || json.item_id || json.sharePointId || json.id || '';
      return {
        success: true,
        duplicate: rawStatus === 'duplicate',
        itemId: itemId ? String(itemId) : undefined,
        message: json.message
      };
    }

    return {
      success: false,
      error: json.message || json.error || 'Server did not return a success status'
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { success: false, error: 'Request timed out after 120 seconds' };
    }
    return { success: false, error: err.message || 'Network request failed' };
  }
}

let isProcessingQueue = false;

/**
 * Retries queued reports one at a time, oldest first.
 * Removes from queue only upon success/duplicate.
 */
export async function processQueue(): Promise<{ processed: number; succeeded: number }> {
  if (isProcessingQueue) return { processed: 0, succeeded: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, succeeded: 0 };
  }

  isProcessingQueue = true;
  let processed = 0;
  let succeeded = 0;

  try {
    const queue = await getQueuedReports();
    for (const report of queue) {
      processed++;
      const result = await sendPayloadToWebhook(report);
      if (result.success) {
        await removeQueuedReport(report.submissionId);
        succeeded++;
      } else {
        // Stop processing subsequent items on error to preserve strict FIFO order
        break;
      }
    }
  } finally {
    isProcessingQueue = false;
    const remaining = await getQueueCount();
    notifyQueueListeners(remaining);
  }

  return { processed, succeeded };
}

/**
 * Initializes the background queue retry engine:
 * 1. Process on app start
 * 2. Process on "online" event
 * 3. Process every 5 minutes while app is open
 */
export function initQueueEngine(): () => void {
  // 1. App start
  processQueue().catch((err) => console.warn('Initial queue process error:', err));

  // 2. Online event listener
  const handleOnline = () => {
    processQueue().catch((err) => console.warn('Online queue process error:', err));
  };
  window.addEventListener('online', handleOnline);

  // 3. Every 5 minutes (300,000 ms)
  const intervalId = setInterval(() => {
    processQueue().catch((err) => console.warn('Interval queue process error:', err));
  }, 300000);

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(intervalId);
  };
}

/**
 * Saves a cleaned Project ID to the recent suggestions list for a specific market.
 * Keeps up to 20 Project IDs per market in localStorage under "eosRecentProjects".
 */
export function recordRecentProjectId(market: string, projectId: string): void {
  if (!market || !projectId) return;
  try {
    const raw = localStorage.getItem(RECENT_PROJECTS_KEY);
    const store: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    const list = store[market] || [];
    const filtered = list.filter((id) => id !== projectId);
    filtered.unshift(projectId);
    store[market] = filtered.slice(0, 20);
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to record recent project ID:', err);
  }
}

/**
 * Retrieves the recent Project IDs for a specific market.
 */
export function getRecentProjectIds(market: string): string[] {
  if (!market) return [];
  try {
    const raw = localStorage.getItem(RECENT_PROJECTS_KEY);
    if (!raw) return [];
    const store: Record<string, string[]> = JSON.parse(raw);
    return store[market] || [];
  } catch {
    return [];
  }
}

/**
 * Clean project ID:
 * Trim spaces at both ends, convert letters to uppercase, remove any spaces inside it.
 */
export function cleanProjectId(raw: string): string {
  if (!raw) return '';
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Validates cleaned project ID:
 * 3 to 30 characters, contains at least one letter and at least one number.
 */
export function isValidProjectId(cleaned: string): boolean {
  if (!cleaned) return false;
  if (cleaned.length < 3 || cleaned.length > 30) return false;
  const hasLetter = /[A-Z]/.test(cleaned);
  const hasNumber = /[0-9]/.test(cleaned);
  return hasLetter && hasNumber;
}

/**
 * Generates a standard UUID for submission tracking
 */
export function generateSubmissionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}
