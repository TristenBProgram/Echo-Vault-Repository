import type { Track } from '../types';

export type Recommendation = { track: Track; reason: string };

const artistKey = (artist: string) => artist.trim().toLowerCase();
const knownArtist = (key: string) => key !== '' && key !== 'unknown artist';

/**
 * Offline recommendations using the existing, newest-first recent history.
 * History contains distinct tracks, so this measures recent artist interest,
 * not play counts. Unknown metadata never implies artist similarity.
 */
export function recommendTracks(
  tracks: readonly Track[],
  recentIds: readonly string[],
  limit = 20,
): Recommendation[] {
  if (!Number.isFinite(limit) || limit < 1) return [];
  const library = [...new Map(tracks.map(track => [track.id, track])).values()];
  const byId = new Map(library.map(track => [track.id, track]));
  const history = [...new Set(recentIds)].filter(id => byId.has(id));
  const recentPosition = new Map(history.map((id, index) => [id, index]));
  const affinity = new Map<string, number>();
  history.forEach((id, index) => {
    const key = artistKey(byId.get(id)!.artist);
    if (knownArtist(key)) {
      affinity.set(key, (affinity.get(key) ?? 0) + 1 / (index + 1));
    }
  });
  const maxAffinity = Math.max(0, ...affinity.values());
  const candidates = library.map(track => {
    const key = artistKey(track.artist);
    const interest = maxAffinity ? (affinity.get(key) ?? 0) / maxAffinity : 0;
    const position = recentPosition.get(track.id);
    const score = interest * 4 + (position === undefined ? 3 : -2 / (position + 1));
    const reason = !history.length
      ? 'Start with your downloaded music'
      : interest > 0 && position === undefined
        ? `More from ${track.artist.trim()}`
        : position === undefined
          ? 'Outside your recent rotation'
          : 'An artist in your recent listening';
    return {
      track,
      key,
      score,
      reason: position !== undefined && !interest ? 'Revisit a recent listen' : reason,
    };
  });
  // A stable tie-break gives new listeners recent additions first and avoids
  // changing the mix on every render. Never reorder the library itself.
  candidates.sort((a, b) =>
    b.track.addedAt - a.track.addedAt ||
    a.track.title.localeCompare(b.track.title) ||
    a.track.id.localeCompare(b.track.id),
  );

  const selected: Recommendation[] = [];
  const artistCounts = new Map<string, number>();
  while (candidates.length && selected.length < Math.floor(limit)) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    candidates.forEach((candidate, index) => {
      const count = knownArtist(candidate.key) ? artistCounts.get(candidate.key) ?? 0 : 0;
      const score = candidate.score - count * 4;
      if (score > bestScore) {
        bestIndex = index;
        bestScore = score;
      }
    });
    const [pick] = candidates.splice(bestIndex, 1);
    selected.push({ track: pick.track, reason: pick.reason });
    artistCounts.set(pick.key, (artistCounts.get(pick.key) ?? 0) + 1);
  }
  return selected;
}
