import { useState } from 'react';
import {
  buildPromotePayload,
  catalogPromoteIssueUrl,
  CATALOG_PROMOTE_LABEL,
  CATALOG_PROMOTE_REPO,
  formatPromoteIssueBody,
} from '../lib/catalogPromote';
import { useApp } from '../state/AppState';
import type { CatalogExercise } from '../types';

export function PromotePanel({
  exercise,
  onClose,
}: {
  exercise: CatalogExercise;
  onClose: () => void;
}) {
  const { requestPromote } = useApp();
  const [note, setNote] = useState(exercise.promoteNote ?? '');
  const [copied, setCopied] = useState<'payload' | 'body' | null>(null);
  const [current, setCurrent] = useState(exercise);

  const payload = buildPromotePayload(current, note);
  const issueUrl = catalogPromoteIssueUrl(payload);
  const issueBody = formatPromoteIssueBody(payload);

  async function ensureMarked() {
    const next = await requestPromote(current.id, note);
    if (next) setCurrent(next);
    return next ?? current;
  }

  async function copy(text: string, which: 'payload' | 'body') {
    await ensureMarked();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="sheet" role="dialog" aria-label="Suggest for library">
      <div className="sheet-handle">
        <strong>Suggest for library</strong>
        <button type="button" className="ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="hint">
        Marks this custom for later intake. The app cannot file a GitHub issue by itself (no token
        in the browser). Copy the payload or use the pre-filled issue link. Maintainers / bots turn
        <code>{CATALOG_PROMOTE_LABEL}</code> issues into a PR — they are never auto-merged.
      </p>
      <label className="lbl">
        Note for reviewers (optional)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Common movement, missing from catalog"
        />
      </label>
      <pre className="payload-box" tabIndex={0}>
        {JSON.stringify(payload, null, 2)}
      </pre>
      <button type="button" className="primary" onClick={() => void copy(JSON.stringify(payload, null, 2), 'payload')}>
        {copied === 'payload' ? 'Copied payload' : 'Copy promote payload'}
      </button>
      <button type="button" className="secondary" onClick={() => void copy(issueBody, 'body')}>
        {copied === 'body' ? 'Copied issue body' : 'Copy GitHub issue body'}
      </button>
      <a
        className="secondary link-btn"
        href={issueUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => void ensureMarked()}
      >
        Open GitHub issue
      </a>
      <p className="muted">
        Repo <code>{CATALOG_PROMOTE_REPO}</code>. Label <code>{CATALOG_PROMOTE_LABEL}</code>. If the
        label is missing, create it once on the repo, then paste the body into a new issue.
      </p>
    </div>
  );
}
