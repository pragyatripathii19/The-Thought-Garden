import { OrganizeEvent } from '../../types';
import { IOrganizeEventRepository } from '../types';
import { getDatabase } from './database';

export class IndexedDBOrganizeEventRepository implements IOrganizeEventRepository {
  async add(event: OrganizeEvent): Promise<OrganizeEvent> {
    const db = await getDatabase();
    await db.put('organizeEvents', event);
    return event;
  }

  async getAll(): Promise<OrganizeEvent[]> {
    const db = await getDatabase();
    const list = await db.getAll('organizeEvents');
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, patch: Partial<Pick<OrganizeEvent, 'undoneAt'>>): Promise<OrganizeEvent> {
    const db = await getDatabase();
    const existing = await db.get('organizeEvents', id);
    if (!existing) {
      throw new Error(`Organise event not found with id: ${id}`);
    }
    const updated = { ...existing, ...patch };
    await db.put('organizeEvents', updated);
    return updated;
  }

  async clear(): Promise<void> {
    const db = await getDatabase();
    await db.clear('organizeEvents');
  }
}
