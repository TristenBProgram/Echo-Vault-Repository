import type { Track } from '../types';

/** Builds a test track; pass only the fields a test cares about. */
export function makeTrack(overrides: Partial<Track> = {}): Track {
  const id = overrides.id ?? `content://media/${Math.random().toString(36).slice(2)}`;
  return {
    id,
    uri: id,
    title: 'Song',
    artist: 'Artist',
    duration: 200,
    addedAt: 0,
    source: 'device',
    ...overrides,
  };
}

/** Five tracks with ids "t0".."t4", titles "Song 0".."Song 4". */
export function makeTracks(count = 5): Track[] {
  return Array.from({ length: count }, (_, i) => makeTrack({ id: `t${i}`, title: `Song ${i}` }));
}

export const ids = (tracks: Track[]) => tracks.map(t => t.id);
