const SYNC_QUEUE_KEY = 'atlas-explorer-sync-queue';

export interface QueuedScore {
  payload: Record<string, unknown>;
  queuedAt: string;
  id: string;
}

function readQueue(): QueuedScore[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedScore[];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedScore[]): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
}

export function enqueueScore(payload: Record<string, unknown>): void {
  const queue = readQueue();
  queue.push({
    payload,
    queuedAt: new Date().toISOString(),
    id: crypto.randomUUID(),
  });
  writeQueue(queue);
}

export function getQueueLength(): number {
  return readQueue().length;
}

export async function drainQueue(appsScriptUrl?: string): Promise<void> {
  if (!appsScriptUrl || !appsScriptUrl.startsWith('https://')) return;

  const queue = readQueue();
  if (queue.length === 0) return;

  const remaining: QueuedScore[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'submit', ...item.payload }),
      });
      if (!res.ok) {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  writeQueue(remaining);
}
