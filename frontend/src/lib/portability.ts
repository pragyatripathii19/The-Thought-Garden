import { Thought, Collection, Connection } from '../types';
import { localDateKey } from './date';

export interface GardenBackupV1 {
  version: 1;
  exportedAt: string;
  garden: {
    thoughts: Thought[];
    collections: Collection[];
    connections: Connection[];
  };
}

export function serializeGardenBackup(
  thoughts: Thought[],
  collections: Collection[],
  connections: Connection[]
): string {
  const backup: GardenBackupV1 = {
    version: 1,
    exportedAt: new Date().toISOString(),
    garden: {
      thoughts,
      collections,
      connections,
    },
  };
  return JSON.stringify(backup, null, 2);
}

export function downloadBackupFile(
  thoughts: Thought[],
  collections: Collection[],
  connections: Connection[]
): void {
  const jsonString = serializeGardenBackup(thoughts, collections, connections);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = localDateKey();

  const link = document.createElement('a');
  link.href = url;
  link.download = `thought-garden-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ValidationResult {
  valid: boolean;
  backup?: GardenBackupV1;
  error?: string;
}

export function validateGardenBackup(jsonContent: string): ValidationResult {
  if (!jsonContent || !jsonContent.trim()) {
    return { valid: false, error: 'Backup file is empty' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    return { valid: false, error: 'Invalid JSON format: file could not be parsed' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { valid: false, error: 'Invalid backup structure: root must be a JSON object' };
  }

  const candidate = parsed as Record<string, unknown>;

  // Check version
  if (candidate.version !== 1) {
    return {
      valid: false,
      error: `Unsupported backup version: expected version 1, received ${candidate.version}`,
    };
  }

  // Check garden payload
  if (!candidate.garden || typeof candidate.garden !== 'object') {
    return { valid: false, error: 'Missing "garden" data object in backup' };
  }

  const garden = candidate.garden as Record<string, unknown>;

  // Validate thoughts array
  if (!Array.isArray(garden.thoughts)) {
    return { valid: false, error: 'Backup must contain a "thoughts" array' };
  }

  for (let i = 0; i < garden.thoughts.length; i++) {
    const t = garden.thoughts[i];
    if (typeof t !== 'object' || t === null) {
      return { valid: false, error: `Invalid thought record at index ${i}` };
    }
    if (typeof t.id !== 'string' || !t.id.trim()) {
      return { valid: false, error: `Thought at index ${i} is missing a valid id` };
    }
    if (typeof t.text !== 'string' || !t.text.trim()) {
      return { valid: false, error: `Thought at index ${i} contains empty text` };
    }
    if (typeof t.createdAt !== 'string') {
      return { valid: false, error: `Thought at index ${i} is missing a valid createdAt timestamp` };
    }
  }

  // Validate collections array
  if (!Array.isArray(garden.collections)) {
    return { valid: false, error: 'Backup must contain a "collections" array' };
  }

  for (let i = 0; i < garden.collections.length; i++) {
    const c = garden.collections[i];
    if (typeof c !== 'object' || c === null || typeof c.id !== 'string' || typeof c.name !== 'string') {
      return { valid: false, error: `Invalid collection record at index ${i}` };
    }
  }

  // Validate connections array
  if (!Array.isArray(garden.connections)) {
    return { valid: false, error: 'Backup must contain a "connections" array' };
  }

  for (let i = 0; i < garden.connections.length; i++) {
    const conn = garden.connections[i];
    if (
      typeof conn !== 'object' ||
      conn === null ||
      typeof conn.id !== 'string' ||
      typeof conn.sourceThoughtId !== 'string' ||
      typeof conn.targetThoughtId !== 'string' ||
      typeof conn.status !== 'string'
    ) {
      return { valid: false, error: `Invalid connection record at index ${i}` };
    }
  }

  return {
    valid: true,
    backup: parsed as GardenBackupV1,
  };
}

export interface ImportStats {
  thoughtsAdded: number;
  collectionsAdded: number;
  connectionsAdded: number;
}

