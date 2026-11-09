export const channel = {
  name: 'Noko Mashaba',
  tagline: 'Official Comedy & Anime · Made for a good laugh',
  categories: ['All Videos', 'Comedy', 'Anime']
};

export function formatCount(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(count || 0);
}

export function timeAgo(value) {
  if (!value) return 'Just now';
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  if (days < 1) return 'Today';
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`;
  return `${Math.floor(days / 30)} month${days < 60 ? '' : 's'} ago`;
}
