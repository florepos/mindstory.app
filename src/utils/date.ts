export interface FormatDateOptions {
  today?: string;
  yesterday?: string;
  daysAgo?: string;
}

export function formatDate(dateString: string, options: FormatDateOptions = {}): string {
  const { today = 'Today', yesterday = 'Yesterday', daysAgo = 'days ago' } = options;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return today;
  if (diffDays === 2) return yesterday;
  if (diffDays <= 7) return `${diffDays - 1} ${daysAgo}`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
