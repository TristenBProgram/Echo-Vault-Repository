/**
 * Pure library logic: no Expo or React imports, so it can be unit tested
 * without a phone.
 */
import type { Track } from '../types';
import { parseFilename } from './format';

/** Clips shorter than this (ringtones, notification sounds) are skipped. */
export const MIN_SONG_SECONDS = 30;

export const MAX_RECENTS = 20;

/** One audio file as the phone's media store describes it. */
export type MediaRow = {
  id: string;
  filename?: string | null;
  duration?: number | null;
  creationTime?: number | null;
  modificationTime?: number | null;
};

export type Artist = { name: string; tracks: Track[] };

/**
 * Turns media-store rows into tracks. Durations arrive in milliseconds on
 * most devices but seconds on some, so the unit is detected from the
 * typical (median) value across all rows.
 */
export function rowsToTracks(rows: MediaRow[]): Track[] {
  const raw = rows
    .map(r => r.duration ?? 0)
    .filter(d => d > 0)
    .sort((a, b) => a - b);
  const median = raw.length ? raw[Math.floor(raw.length / 2)] : 0;
  const inMillis = median > 3000;

  const tracks: Track[] = [];
  for (const row of rows) {
    const seconds = (row.duration ?? 0) / (inMillis ? 1000 : 1);
    if (seconds > 0 && seconds < MIN_SONG_SECONDS) continue;

    const { title, artist } = parseFilename(row.filename ?? 'Unknown');
    tracks.push({
      id: row.id,
      // On Android the asset id is a content:// URI the player can open directly.
      uri: row.id,
      title,
      artist,
      duration: seconds,
      addedAt: row.modificationTime ?? row.creationTime ?? 0,
      source: 'device',
    });
  }
  return tracks;
}

/**
 * Combines a fresh scan with the existing library: imported files are kept,
 * device files are replaced by the scan (so deleted songs disappear), and
 * durations learned earlier are kept when the scan doesn't know them.
 */
export function mergeScan(previous: Track[], scanned: Track[]): Track[] {
  const known = new Map(previous.map(t => [t.id, t]));
  const device = scanned.map(t => {
    const old = known.get(t.id);
    return old && !t.duration ? { ...t, duration: old.duration } : t;
  });
  const imported = previous.filter(t => t.source === 'imported');
  return [...device, ...imported];
}

/**
 * Groups tracks by artist. Artists with more songs come first,
 * "Unknown Artist" always goes last, and songs are sorted by title.
 */
export function groupArtists(tracks: Track[]): Artist[] {
  const map = new Map<string, Track[]>();
  for (const t of tracks) {
    const list = map.get(t.artist) ?? [];
    list.push(t);
    map.set(t.artist, list);
  }
  return [...map.entries()]
    .map(([name, list]) => ({
      name,
      tracks: [...list].sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => {
      if (a.name === 'Unknown Artist') return 1;
      if (b.name === 'Unknown Artist') return -1;
      return b.tracks.length - a.tracks.length || a.name.localeCompare(b.name);
    });
}

/** Newest first, capped at `limit`. */
export function recentlyAdded(tracks: Track[], limit = 15): Track[] {
  return [...tracks].sort((a, b) => b.addedAt - a.addedAt).slice(0, limit);
}

/** Moves `id` to the front of the recently-played list without duplicates. */
export function addRecent(recentIds: string[], id: string, max = MAX_RECENTS): string[] {
  return [id, ...recentIds.filter(x => x !== id)].slice(0, max);
}

/** Looks up recently played ids, skipping songs that are no longer in the library. */
export function resolveRecent(recentIds: string[], tracks: Track[]): Track[] {
  const byId = new Map(tracks.map(t => [t.id, t]));
  return recentIds.map(id => byId.get(id)).filter((t): t is Track => !!t);
}

/** Case-insensitive search across title and artist. */
export function searchTracks(tracks: Track[], query: string): Track[] {
  const q = query.trim().toLowerCase();
  if (!q) return tracks;
  return tracks.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
}

export type SortMode = 'title' | 'artist' | 'recent';

export function sortTracks(tracks: Track[], mode: SortMode): Track[] {
  const sorted = [...tracks];
  if (mode === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
  if (mode === 'artist') sorted.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
  if (mode === 'recent') sorted.sort((a, b) => b.addedAt - a.addedAt);
  return sorted;
}
