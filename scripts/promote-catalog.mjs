#!/usr/bin/env node
/**
 * Turn a promote-flagged custom or a catalog-promote issue body into a
 * CatalogExercise row to add to src/data/exercises.ts.
 *
 * Does not create, merge, or push PRs.
 *
 *   node scripts/promote-catalog.mjs --file payload.json
 *   node scripts/promote-catalog.mjs --stdin < issue.md
 *   gh issue view 12 --json body --jq .body | node scripts/promote-catalog.mjs --stdin
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MUSCLE_ID_SET, remapMuscleIds } from '../src/data/muscles.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_PATH = join(ROOT, 'src/data/exercises.ts');
const SCHEMA = 'prooverload.catalog-promote.v1';
const EQUIPMENT = new Set(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other']);

function slugify(name) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'custom-exercise'
  );
}

function asStringList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v && v !== '—');
  }
  return [];
}

function extractJsonCandidates(text) {
  const blocks = [];
  const fence = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match;
  while ((match = fence.exec(text))) blocks.push(match[1].trim());
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) blocks.push(trimmed);
  return blocks;
}

function parseGithubForm(text) {
  const sections = {};
  const parts = text.split(/^### /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    if (nl === -1) continue;
    const title = part.slice(0, nl).trim().toLowerCase();
    const body = part.slice(nl + 1).trim();
    sections[title] = body;
  }
  if (!sections['exercise name'] && !sections.name) return null;
  return {
    schema: SCHEMA,
    name: (sections['exercise name'] || sections.name || '').split('\n')[0].trim(),
    aliases: asStringList(sections.aliases || ''),
    equipment: (sections.equipment || 'other').split('\n')[0].trim(),
    primary: asStringList(sections['primary muscles'] || sections.primary || ''),
    secondary: asStringList(sections['secondary muscles'] || sections.secondary || ''),
    customId: (sections['custom id'] || sections.custom_id || '').split('\n')[0].trim(),
    note: sections['requester note'] || sections.note || '',
  };
}

function normalizePayload(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (Array.isArray(raw)) {
    const flagged = raw.filter((row) => row && (row.promoteStatus || row.promoteRequestedAt || row.schema === SCHEMA));
    return flagged.length ? flagged.map(normalizePayload).filter(Boolean) : raw.map(normalizePayload).filter(Boolean);
  }
  if (raw.customExercises) return normalizePayload(raw.customExercises);
  const name = String(raw.name || '').trim();
  if (!name) return null;
  const primary = remapMuscleIds(asStringList(raw.primary));
  if (!primary.length) return null;
  return {
    schema: raw.schema || SCHEMA,
    name,
    aliases: asStringList(raw.aliases),
    equipment: String(raw.equipment || 'other').trim() || 'other',
    primary,
    secondary: remapMuscleIds(asStringList(raw.secondary)).filter((id) => !primary.includes(id)),
    customId: String(raw.customId || raw.id || '').trim(),
    note: String(raw.note || raw.promoteNote || '').trim(),
    promoteRequestedAt: raw.promoteRequestedAt,
  };
}

function parseInput(text) {
  for (const block of extractJsonCandidates(text)) {
    try {
      const parsed = normalizePayload(JSON.parse(block));
      if (parsed) return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // try next candidate
    }
  }
  const form = parseGithubForm(text);
  const fromForm = form ? normalizePayload(form) : null;
  if (fromForm) return [fromForm];
  throw new Error('Could not parse a promote payload. Expected JSON, a json fence, or the catalog-promote issue form.');
}

function readCatalogIndex() {
  if (!existsSync(CATALOG_PATH)) return { ids: new Set(), names: new Set() };
  const src = readFileSync(CATALOG_PATH, 'utf8');
  return {
    ids: new Set([...src.matchAll(/\bid:\s*'([^']+)'/g)].map((m) => m[1])),
    names: new Set([...src.matchAll(/\bname:\s*'([^']+)'/g)].map((m) => m[1].toLowerCase())),
  };
}

function formatRow(payload, id) {
  const aliases = payload.aliases.length ? `, aliases: ${JSON.stringify(payload.aliases)}` : '';
  return `{ id: '${id}', name: ${JSON.stringify(payload.name)}${aliases}, equipment: ${JSON.stringify(payload.equipment)}, primary: ${JSON.stringify(payload.primary)}, secondary: ${JSON.stringify(payload.secondary)} },`;
}

function validate(payload) {
  const errors = [];
  if (!payload.name) errors.push('missing name');
  if (!payload.primary.length) errors.push('need at least one primary muscle');
  for (const m of [...payload.primary, ...payload.secondary]) {
    if (!MUSCLE_ID_SET.has(m)) errors.push(`unknown MuscleId: ${m}`);
  }
  if (payload.equipment && !EQUIPMENT.has(payload.equipment)) {
    errors.push(`unknown equipment: ${payload.equipment} (still printable; expected one of ${[...EQUIPMENT].join(', ')})`);
  }
  return errors;
}

function printPayloads(payloads) {
  const catalog = readCatalogIndex();
  let status = 0;
  for (const payload of payloads) {
    const errors = validate(payload);
    const id = slugify(payload.name);
    if (catalog.ids.has(id)) {
      errors.push(`catalog already has id '${id}'`);
      status = 1;
    }
    if (catalog.names.has(payload.name.toLowerCase())) {
      errors.push(`catalog already has name '${payload.name}'`);
      status = 1;
    }
    if (errors.some((e) => e.startsWith('missing') || e.startsWith('need') || e.startsWith('unknown MuscleId'))) {
      status = 1;
    }
    console.log(formatRow(payload, id));
    if (payload.customId) console.error(`# customId (do not reuse as catalog id): ${payload.customId}`);
    if (payload.note) console.error(`# note: ${payload.note}`);
    for (const err of errors) console.error(`# ${err}`);
  }
  return status;
}

function selfTest() {
  const sample = {
    schema: SCHEMA,
    name: 'Sissy Squat',
    aliases: ['sissy'],
    equipment: 'bodyweight',
    primary: ['quads'],
    secondary: [],
    customId: '00000000-0000-4000-8000-000000000001',
    note: 'missing from catalog',
  };
  const issue = ['## Catalog promotion', '', '```json', JSON.stringify(sample, null, 2), '```'].join('\n');
  const [parsed] = parseInput(issue);
  const row = formatRow(parsed, slugify(parsed.name));
  if (!row.includes("id: 'sissy-squat'") || !row.includes('"Sissy Squat"') || !row.includes('rectus_femoris')) {
    throw new Error(`self-test row mismatch: ${row}`);
  }
  if (!parsed.primary.includes('rectus_femoris') || !parsed.primary.includes('vastus_medialis')) {
    throw new Error(`self-test remap failed: ${parsed.primary}`);
  }
  const dump = parseInput(JSON.stringify({ customExercises: [{ ...sample, promoteStatus: 'requested' }] }));
  if (dump.length !== 1) throw new Error('self-test dump failed');
  const form = parseInput(
    [
      '### Exercise name',
      '',
      'Sissy Squat',
      '',
      '### Equipment',
      '',
      'bodyweight',
      '',
      '### Primary muscles',
      '',
      'quads',
      '',
      '### Secondary muscles',
      '',
      '',
      '### Custom id',
      '',
      'abc',
    ].join('\n'),
  );
  if (form[0].name !== 'Sissy Squat' || !form[0].primary.includes('rectus_femoris')) {
    throw new Error('self-test form failed');
  }
  console.log('promote-catalog self-test ok');
}

function usage() {
  console.error(`Usage:
  node scripts/promote-catalog.mjs --file payload.json
  node scripts/promote-catalog.mjs --stdin
  node scripts/promote-catalog.mjs --self-test`);
}

const args = process.argv.slice(2);
if (args.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

let text = '';
const fileFlag = args.indexOf('--file');
if (fileFlag !== -1) {
  const path = args[fileFlag + 1];
  if (!path) {
    usage();
    process.exit(2);
  }
  text = readFileSync(path, 'utf8');
} else if (args.includes('--stdin') || !process.stdin.isTTY) {
  text = readFileSync(0, 'utf8');
} else {
  usage();
  process.exit(2);
}

try {
  const payloads = parseInput(text);
  process.exit(printPayloads(payloads));
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
