export function CustomBadge({ queued }: { queued?: boolean }) {
  return (
    <span className={`badge-custom${queued ? ' queued' : ''}`}>
      {queued ? 'Queued' : 'Custom'}
    </span>
  );
}
