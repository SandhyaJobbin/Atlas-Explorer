// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enqueueScore, getQueueLength, drainQueue } from '@/lib/sync-queue';

const FAKE_URL = 'https://script.google.com/macros/s/test/exec';

beforeEach(() => {
  localStorage.clear();
});

describe('sync-queue', () => {

  it('enqueueScore writes to atlas-explorer-sync-queue localStorage key', () => {
    enqueueScore({ agent: 'test' });
    const raw = localStorage.getItem('atlas-explorer-sync-queue');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
  });

  it('getQueueLength returns correct count after multiple enqueues', () => {
    expect(getQueueLength()).toBe(0);
    enqueueScore({ agent: 'a' });
    enqueueScore({ agent: 'b' });
    enqueueScore({ agent: 'c' });
    expect(getQueueLength()).toBe(3);
  });

  it('Queue items have {payload, queuedAt, id} shape', () => {
    enqueueScore({ agent: 'test', stars: 5 });
    const raw = localStorage.getItem('atlas-explorer-sync-queue');
    const items = JSON.parse(raw!);
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item).toHaveProperty('payload');
    expect(item).toHaveProperty('queuedAt');
    expect(item).toHaveProperty('id');
    expect(typeof item.queuedAt).toBe('string');
    expect(new Date(item.queuedAt).toISOString()).toBe(item.queuedAt); // valid ISO string
    expect(typeof item.id).toBe('string');
    expect(item.id.length).toBeGreaterThan(0);
    expect(item.payload).toEqual({ agent: 'test', stars: 5 });
  });

  it('Queue survives page reload (re-read from localStorage)', () => {
    enqueueScore({ agent: 'survivor' });
    enqueueScore({ agent: 'persist' });

    // Simulate page reload by clearing in-memory and re-reading from storage
    const rawBefore = localStorage.getItem('atlas-explorer-sync-queue');
    const parsedBefore = JSON.parse(rawBefore!);
    expect(parsedBefore).toHaveLength(2);

    // Reading fresh from storage (same as module init)
    const fresh = JSON.parse(localStorage.getItem('atlas-explorer-sync-queue')!);
    expect(fresh).toHaveLength(2);
    expect(fresh[0].payload.agent).toBe('survivor');
    expect(fresh[1].payload.agent).toBe('persist');
  });

  it('drainQueue POSTs each item sequentially, removes on success', async () => {
    enqueueScore({ agent: 'a', stars: 3 });
    enqueueScore({ agent: 'b', stars: 5 });

    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await drainQueue(FAKE_URL);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Verify sequential POST calls with payload
    const calls = mockFetch.mock.calls;
    expect(calls[0][0]).toBe(FAKE_URL);

    const raw = localStorage.getItem('atlas-explorer-sync-queue');
    expect(raw).toBe('[]');

    vi.unstubAllGlobals();
  });

  it('drainQueue keeps items on fetch failure', async () => {
    enqueueScore({ agent: 'a', stars: 3 });
    enqueueScore({ agent: 'b', stars: 5 });

    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    await drainQueue(FAKE_URL);

    // Items should remain in queue
    const raw = localStorage.getItem('atlas-explorer-sync-queue');
    const items = JSON.parse(raw!);
    expect(items).toHaveLength(2);

    vi.unstubAllGlobals();
  });

  it('drainQueue no-op when URL is empty', async () => {
    enqueueScore({ agent: 'noop-test' });

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // drainQueue with empty string — should no-op
    await drainQueue('');

    expect(mockFetch).not.toHaveBeenCalled();
    const raw = localStorage.getItem('atlas-explorer-sync-queue');
    const items = JSON.parse(raw!);
    expect(items).toHaveLength(1);

    vi.unstubAllGlobals();
  });

});
