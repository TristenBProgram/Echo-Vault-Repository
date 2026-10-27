import type { Track } from '../types';
import { hashString } from './format';

export type Recommendation = { track: Track; reason: string };
export type RecommendationMode = 'personal' | 'discover' | 'liked';
export type RecommendationPreferences = { likedIds: string[]; hiddenIds: string[] };
export type RecommendationOptions = {
  mode?: RecommendationMode;
  variant?: number;
  previousFirstId?: string;
  preferences?: RecommendationPreferences;
};

/** Accept old libraries and reject malformed feedback without losing music. */
export function normalizePreferences(value: unknown): RecommendationPreferences {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const ids = (input: unknown) => Array.isArray(input)
    ? [...new Set(input.filter((id): id is string => typeof id === 'string' && id.length > 0))]
    : [];
  const hiddenIds = ids(source.hiddenIds);
  const hidden = new Set(hiddenIds);
  return { likedIds: ids(source.likedIds).filter(id => !hidden.has(id)), hiddenIds };
}

export function updateRecommendationFeedback(
  preferences: RecommendationPreferences,
  id: string,
  action: 'like' | 'hide' | 'restore',
): RecommendationPreferences {
  const likedIds = preferences.likedIds.filter(value => value !== id);
  const hiddenIds = preferences.hiddenIds.filter(value => value !== id);
  if (action === 'like' && !preferences.likedIds.includes(id)) likedIds.push(id);
  if (action === 'hide') hiddenIds.push(id);
  return { likedIds: action === 'restore' ? preferences.likedIds : likedIds, hiddenIds };
}

// Stable within a mix; an explicit refresh changes the variation, not every render.
function variation(id: string, variant: number): number {
  if (!variant) return 0;
  let hash = hashString(id) ^ Math.imul(variant, 0x9e3779b1);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return ((hash ^ (hash >>> 16)) >>> 0) / 0xffffffff * 3;
}

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
  options: RecommendationOptions = {},
): Recommendation[] {
  if (!Number.isFinite(limit) || limit < 1) return [];
  const library = [...new Map(tracks.map(track => [track.id, track])).values()];
  const byId = new Map(library.map(track => [track.id, track]));
  const history = [...new Set(recentIds)].filter(id => byId.has(id));
  const preferences = normalizePreferences(options.preferences);
  const hidden = new Set(preferences.hiddenIds);
  const liked = new Set(preferences.likedIds.filter(id => byId.has(id) && !hidden.has(id)));
  const recentPosition = new Map(history.map((id, index) => [id, index]));
  const affinity = new Map<string, number>();
  history.forEach((id, index) => {
    const key = artistKey(byId.get(id)!.artist);
    if (knownArtist(key) && !hidden.has(id)) {
      affinity.set(key, (affinity.get(key) ?? 0) + 1 / (index + 1));
    }
  });
  for (const id of liked) {
    const key = artistKey(byId.get(id)!.artist);
    if (knownArtist(key)) affinity.set(key, (affinity.get(key) ?? 0) + 2);
  }
  const maxAffinity = Math.max(0, ...affinity.values());
  const candidates = library.filter(track =>
    !hidden.has(track.id) &&
    (options.mode !== 'discover' || !recentPosition.has(track.id)) &&
    (options.mode !== 'liked' || liked.has(track.id)),
  ).map(track => {
    const key = artistKey(track.artist);
    const interest = maxAffinity ? (affinity.get(key) ?? 0) / maxAffinity : 0;
    const position = recentPosition.get(track.id);
    const score = interest * 4 + (position === undefined ? 3 : -2 / (position + 1)) +
      (liked.has(track.id) ? 3 : 0) + variation(track.id, options.variant ?? 0);
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
      reason: liked.has(track.id) ? 'A song you liked'
        : options.mode === 'discover' ? 'Outside your recent rotation'
          : !history.length && interest > 0 ? `From an artist you liked: ${track.artist.trim()}`
            : position !== undefined && !interest ? 'Revisit a recent listen' : reason,
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
      // Refresh starts elsewhere when possible; the old first song remains
      // eligible later in the mix instead of being hidden or discarded.
      if (!selected.length && candidates.length > 1 && candidate.track.id === options.previousFirstId) return;
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
