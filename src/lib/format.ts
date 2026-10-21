/** 185 -> "3:05" */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Most phones don't give us song tags cheaply, so we read what we can from
 * the filename. Handles common patterns like:
 *   "Artist - Title.mp3"
 *   "01. Title.mp3" / "01 - Artist - Title.m4a"
 *   "artist_-_title.mp3"
 */
export function parseFilename(filename: string): { title: string; artist: string } {
  let base = filename
    .replace(/\.[^/.]+$/, '') // drop extension
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip a leading track number such as "01. " or "7 - "
  base = base.replace(/^\d{1,3}\s*[.\-]\s+/, '');

  const parts = base.split(/\s+-\s+/);
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim() || 'Unknown Artist',
      title: parts.slice(1).join(' - ').trim() || base,
    };
  }
  return { artist: 'Unknown Artist', title: base || filename };
}

/** Small, stable string hash used to pick artwork colors. */
export function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function shuffleArray<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'G- ood afternoon?';
  return 'Good evening';
}
