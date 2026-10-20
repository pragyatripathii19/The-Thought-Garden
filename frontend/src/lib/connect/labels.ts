import { Connection, ConnectionKind } from '../../types';

/** How each kind of link is named on screen. */
export const CONNECTION_KIND_LABELS: Record<ConnectionKind, string> = {
  'same-subject': 'Same subject',
  'shared-theme': 'Shared theme',
  'different-feelings': 'Different feelings',
  'builds-on': 'Builds on it',
  similar: 'Similar',
  'shared-words': 'Shared words',
};

/** e.g. "Different feelings · working from home"; empty for connections made before kinds existed. */
export function describeConnection(connection: Pick<Connection, 'kind' | 'subject'>): string {
  if (!connection.kind) return '';
  const label = CONNECTION_KIND_LABELS[connection.kind];
  return connection.subject && connection.kind !== 'shared-words' ? `${label} · ${connection.subject}` : label;
}
