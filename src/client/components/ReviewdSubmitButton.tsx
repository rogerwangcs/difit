interface ReviewdSubmitButtonProps {
  threadCount: number;
  listening: boolean;
  submitting: boolean;
  onSubmit: () => void;
}

export function ReviewdSubmitButton({
  threadCount,
  listening,
  submitting,
  onSubmit,
}: ReviewdSubmitButtonProps) {
  const disabled = !listening || threadCount < 1 || submitting;
  const label = submitting ? 'Submitting…' : `Submit feedback (${threadCount})`;

  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={disabled}
      className="text-xs px-3 py-1.5 rounded transition-all flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: 'var(--color-yellow-btn-bg)',
        color: 'var(--color-yellow-btn-text)',
        border: '1px solid var(--color-yellow-btn-border)',
      }}
      title={
        listening
          ? 'Send comments to the waiting agent'
          : 'Start review-loop listen to enable submit'
      }
    >
      {label}
    </button>
  );
}
