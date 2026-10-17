import { OrganizeEvent } from '../../types';
import { apiFetch } from '../../lib/api';
import { IOrganizeEventRepository } from '../types';

/** The organiser's activity log, stored on the server so Undo history follows the user. */
export class ApiOrganizeEventRepository implements IOrganizeEventRepository {
  private cache = new Map<string, OrganizeEvent>();

  async add(event: OrganizeEvent): Promise<OrganizeEvent> {
    return this.put(event);
  }

  async getAll(): Promise<OrganizeEvent[]> {
    const { events } = await apiFetch<{ events: OrganizeEvent[] }>('/organize-events');
    this.cache = new Map(events.map((e) => [e.id, e]));
    return events.map((e) => ({ ...e }));
  }

  async update(id: string, patch: Partial<Pick<OrganizeEvent, 'undoneAt'>>): Promise<OrganizeEvent> {
    if (!this.cache.has(id)) await this.getAll();
    const existing = this.cache.get(id);
    if (!existing) {
      throw new Error(`Organise event not found with id: ${id}`);
    }
    return this.put({ ...existing, ...patch });
  }

  async clear(): Promise<void> {
    await apiFetch('/organize-events', { method: 'DELETE' });
    this.cache.clear();
  }

  private async put(event: OrganizeEvent): Promise<OrganizeEvent> {
    const { event: saved } = await apiFetch<{ event: OrganizeEvent }>(
      `/organize-events/${encodeURIComponent(event.id)}`,
      { method: 'PUT', body: event }
    );
    this.cache.set(saved.id, saved);
    return { ...saved };
  }
}
