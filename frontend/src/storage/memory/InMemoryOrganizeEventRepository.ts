import { OrganizeEvent } from '../../types';
import { IOrganizeEventRepository } from '../types';

export class InMemoryOrganizeEventRepository implements IOrganizeEventRepository {
  private events: Map<string, OrganizeEvent> = new Map();

  async add(event: OrganizeEvent): Promise<OrganizeEvent> {
    this.events.set(event.id, { ...event });
    return { ...event };
  }

  async getAll(): Promise<OrganizeEvent[]> {
    const list = Array.from(this.events.values()).map((e) => ({ ...e }));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, patch: Partial<Pick<OrganizeEvent, 'undoneAt'>>): Promise<OrganizeEvent> {
    const existing = this.events.get(id);
    if (!existing) {
      throw new Error(`Organise event not found with id: ${id}`);
    }
    const updated = { ...existing, ...patch };
    this.events.set(id, updated);
    return { ...updated };
  }

  async clear(): Promise<void> {
    this.events.clear();
  }
}
