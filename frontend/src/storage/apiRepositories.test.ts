import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiThoughtRepository, ApiConnectionRepository } from './api';
import { ApiError, SESSION_EXPIRED_EVENT } from '../lib/api';
import { Thought, Connection } from '../types';

/** A fake server holding one user's thoughts and connections, answering like the real API. */
function fakeServer() {
  const thoughts = new Map<string, Thought>();
  const connections = new Map<string, Connection>();
  const requests: { method: string; path: string; body?: unknown }[] = [];

  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const method = init.method || 'GET';
    const path = url.replace(/^\/api/, '');
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ method, path, body });
    const json = (status: number, data: unknown) =>
      new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

    const [, resource, rawId] = path.split('/');
    const id = rawId ? decodeURIComponent(rawId) : undefined;
    const store = resource === 'thoughts' ? thoughts : resource === 'connections' ? connections : null;
    if (!store) return json(404, { error: 'Not found' });
    if (method === 'GET') return json(200, { [resource]: [...store.values()] });
    if (method === 'PUT' && id) {
      store.set(id, body as never);
      return json(200, { [resource.slice(0, -1)]: body });
    }
    if (method === 'DELETE' && id) {
      store.delete(id);
      return json(200, { ok: true });
    }
    if (method === 'DELETE') {
      store.clear();
      return json(200, { ok: true });
    }
    return json(400, { error: 'Unsupported' });
  });

  return { thoughts, connections, requests, fetchMock };
}

describe('API repositories', () => {
  let server: ReturnType<typeof fakeServer>;

  beforeEach(() => {
    server = fakeServer();
    vi.stubGlobal('fetch', server.fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a thought with a client id and saves it with one PUT', async () => {
    const repo = new ApiThoughtRepository();
    const created = await repo.create({ text: 'A new seed', classifyState: 'pending' });

    expect(created.id).toBeTruthy();
    expect(created.stage).toBe('seed');
    expect(server.requests).toHaveLength(1);
    expect(server.requests[0]).toMatchObject({ method: 'PUT', path: `/thoughts/${created.id}` });
    expect(server.thoughts.get(created.id)?.text).toBe('A new seed');
  });

  it('sends JSON with the session cookie on every request', async () => {
    await new ApiThoughtRepository().getAll();
    const init = server.fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.credentials).toBe('same-origin');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('refuses empty thoughts without calling the server', async () => {
    await expect(new ApiThoughtRepository().create({ text: '   ' })).rejects.toThrow('cannot be empty');
    expect(server.requests).toHaveLength(0);
  });

  it('updates from the cached list with a single PUT, keeping updatedAt for bookkeeping-only changes', async () => {
    const repo = new ApiThoughtRepository();
    const created = await repo.create({ text: 'Original' });
    await repo.getAll();
    server.requests.length = 0;

    const classified = await repo.update(created.id, { classifyState: 'done' });
    expect(classified.classifyState).toBe('done');
    expect(classified.updatedAt).toBe(created.updatedAt);
    expect(server.requests.map((r) => r.method)).toEqual(['PUT']);

    const edited = await repo.update(created.id, { text: 'Edited' });
    expect(edited.text).toBe('Edited');
    expect(server.thoughts.get(created.id)?.text).toBe('Edited');
  });

  it('reports a missing thought on update', async () => {
    await expect(new ApiThoughtRepository().update('nope', { text: 'x' })).rejects.toThrow('not found');
  });

  it('updates an existing pair instead of creating a duplicate connection', async () => {
    const repo = new ApiConnectionRepository();
    const first = await repo.create({ sourceThoughtId: 'a', targetThoughtId: 'b', status: 'accepted', reason: 'r' });
    const again = await repo.create({ sourceThoughtId: 'b', targetThoughtId: 'a', status: 'dismissed', reason: 'r' });

    expect(again.id).toBe(first.id);
    expect(again.status).toBe('dismissed');
    expect(server.connections.size).toBe(1);
  });

  it('turns server errors into ApiError with the server message', async () => {
    server.fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'These two thoughts already have a connection.' }), { status: 409 })
    );
    const err = await new ApiThoughtRepository().getAll().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.message).toBe('These two thoughts already have a connection.');
  });

  it('signals an expired session on 401', async () => {
    const target = new EventTarget();
    const onExpired = vi.fn();
    target.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    vi.stubGlobal('window', target);
    server.fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Please log in again.' }), { status: 401 }));

    await expect(new ApiThoughtRepository().getAll()).rejects.toThrow('Please log in again.');
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('explains when the server cannot be reached', async () => {
    server.fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const err = await new ApiThoughtRepository().getAll().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).toContain("Can't reach the garden server");
  });
});
