import { apiFetch } from '../../lib/api';
import { GardenBackupV1, ImportStats } from '../../lib/portability';
import { ApiThoughtRepository } from './ApiThoughtRepository';
import { ApiCollectionRepository } from './ApiCollectionRepository';
import { ApiConnectionRepository } from './ApiConnectionRepository';
import { ApiOrganizeEventRepository } from './ApiOrganizeEventRepository';

/** Imports a backup on the server in one transaction. */
export async function importGardenOnServer(
  backup: GardenBackupV1,
  strategy: 'merge' | 'replace'
): Promise<ImportStats> {
  return apiFetch<ImportStats>('/garden/import', {
    method: 'POST',
    body: { garden: backup.garden, strategy },
  });
}

/** Fresh repositories for one signed-in session. */
export function createApiRepositories() {
  return {
    thoughtRepository: new ApiThoughtRepository(),
    collectionRepository: new ApiCollectionRepository(),
    connectionRepository: new ApiConnectionRepository(),
    organizeEventRepository: new ApiOrganizeEventRepository(),
  };
}

export { ApiThoughtRepository, ApiCollectionRepository, ApiConnectionRepository, ApiOrganizeEventRepository };
