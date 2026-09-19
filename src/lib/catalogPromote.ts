import type { CatalogExercise, MuscleId } from '../types';

export const CATALOG_PROMOTE_REPO = 'Evicencio-05/prooverload';
export const CATALOG_PROMOTE_LABEL = 'catalog-promote';
export const PROMOTE_SCHEMA = 'prooverload.catalog-promote.v1';

export type PromotePayload = {
  schema: typeof PROMOTE_SCHEMA;
  name: string;
  aliases: string[];
  equipment: string;
  primary: MuscleId[];
  secondary: MuscleId[];
  customId: string;
  note: string;
  promoteRequestedAt?: number;
};

export function buildPromotePayload(ex: CatalogExercise, note = ''): PromotePayload {
  return {
    schema: PROMOTE_SCHEMA,
    name: ex.name,
    aliases: ex.aliases ?? [],
    equipment: ex.equipment,
    primary: ex.primary,
    secondary: ex.secondary,
    customId: ex.id,
    note: (note || ex.promoteNote || '').trim(),
    promoteRequestedAt: ex.promoteRequestedAt,
  };
}

export function formatPromoteIssueBody(payload: PromotePayload): string {
  const aliases = payload.aliases.join(', ') || '—';
  const secondary = payload.secondary.join(', ') || '—';
  const note = payload.note || '—';
  return [
    '## Catalog promotion',
    '',
    'A custom exercise was flagged for the shared static catalog. Review, then open a PR that adds a row to `src/data/exercises.ts`. **Do not auto-merge.**',
    '',
    '### Fields',
    '',
    `- **Name:** ${payload.name}`,
    `- **Aliases:** ${aliases}`,
    `- **Equipment:** ${payload.equipment}`,
    `- **Primary:** ${payload.primary.join(', ')}`,
    `- **Secondary:** ${secondary}`,
    `- **Custom id:** ${payload.customId}`,
    `- **Note:** ${note}`,
    '',
    '### Promote payload',
    '',
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
    '',
    'Bot: `node scripts/promote-catalog.mjs --stdin` on this issue body, or `--file payload.json`.',
  ].join('\n');
}

export function catalogPromoteIssueUrl(payload: PromotePayload): string {
  const title = `Promote: ${payload.name}`;
  const params = new URLSearchParams({
    labels: CATALOG_PROMOTE_LABEL,
    title,
    body: formatPromoteIssueBody(payload),
  });
  return `https://github.com/${CATALOG_PROMOTE_REPO}/issues/new?${params.toString()}`;
}

export function formatCatalogRow(payload: PromotePayload, id: string): string {
  const aliases =
    payload.aliases.length > 0 ? `, aliases: ${JSON.stringify(payload.aliases)}` : '';
  return `{ id: '${id}', name: ${JSON.stringify(payload.name)}${aliases}, equipment: ${JSON.stringify(payload.equipment)}, primary: ${JSON.stringify(payload.primary)}, secondary: ${JSON.stringify(payload.secondary)} },`;
}
