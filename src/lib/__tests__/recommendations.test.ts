import { recommendTracks, normalizePreferences, updateRecommendationFeedback } from '../recommendations';
import { makeTrack } from '../testUtils';

const pickIds = (tracks: ReturnType<typeof recommendTracks>) => tracks.map(item => item.track.id);

describe('recommendTracks', () => {
  it('starts with recent downloads and mixes artists without listening history', () => {
    const tracks = [
      makeTrack({ id: 'a1', artist: 'Alpha', addedAt: 30 }),
      makeTrack({ id: 'a2', artist: 'Alpha', addedAt: 20 }),
      makeTrack({ id: 'b', artist: 'Beta', addedAt: 10 }),
    ];
    expect(pickIds(recommendTracks(tracks, []))).toEqual(['a1', 'b', 'a2']);
    expect(recommendTracks(tracks, [])[0].reason).toBe('Start with your downloaded music');
  });

  it('prefers another song by a recently played artist over unrelated tracks and immediate replays', () => {
    const tracks = [
      makeTrack({ id: 'played', artist: 'Alpha' }),
      makeTrack({ id: 'related', artist: ' alpha ' }),
      makeTrack({ id: 'other', artist: 'Beta', addedAt: 100 }),
    ];
    const picks = recommendTracks(tracks, ['played']);
    expect(pickIds(picks)).toEqual(['related', 'other', 'played']);
    expect(picks[0].reason).toBe('More from alpha');
    expect(picks[1].reason).toBe('Outside your recent rotation');
  });

  it('gives more weight to the most recent artist', () => {
    const tracks = [
      makeTrack({ id: 'a-played', artist: 'Alpha' }),
      makeTrack({ id: 'b-played', artist: 'Beta' }),
      makeTrack({ id: 'a-pick', artist: 'Alpha' }),
      makeTrack({ id: 'b-pick', artist: 'Beta', addedAt: 100 }),
    ];
    expect(pickIds(recommendTracks(tracks, ['a-played', 'b-played'], 1))).toEqual(['a-pick']);
    expect(pickIds(recommendTracks(tracks, ['b-played', 'a-played'], 1))).toEqual(['b-pick']);
  });

  it('does not treat unknown or blank artists as a shared preference', () => {
    for (const artist of ['Unknown Artist', '']) {
      const tracks = [
        makeTrack({ id: 'played', artist }),
        makeTrack({ id: 'unknown', artist, addedAt: 1 }),
        makeTrack({ id: 'known', artist: 'Alpha', addedAt: 2 }),
      ];
      const picks = recommendTracks(tracks, ['played']);
      expect(pickIds(picks)).toEqual(['known', 'unknown', 'played']);
      expect(picks[1].reason).toBe('Outside your recent rotation');
      expect(picks[2].reason).toBe('Revisit a recent listen');
    }
  });

  it('ignores stale history and duplicate history entries', () => {
    const tracks = [
      makeTrack({ id: 'a', artist: 'Alpha' }),
      makeTrack({ id: 'b', artist: 'Beta' }),
      makeTrack({ id: 'c', artist: 'Alpha' }),
    ];
    expect(recommendTracks(tracks, ['gone', 'a', 'a', 'b']))
      .toEqual(recommendTracks(tracks, ['a', 'b']));
    expect(recommendTracks(tracks, ['gone'])).toEqual(recommendTracks(tracks, []));
  });

  it('returns only unique tracks currently in the library, up to the limit', () => {
    const tracks = Array.from({ length: 30 }, (_, i) => makeTrack({ id: String(i) }));
    const picks = recommendTracks([...tracks, tracks[0]], ['gone']);
    expect(picks).toHaveLength(20);
    expect(new Set(pickIds(picks)).size).toBe(20);
    expect(picks.every(pick => tracks.includes(pick.track))).toBe(true);
    expect(recommendTracks(tracks, [], 3)).toHaveLength(3);
    expect(pickIds(recommendTracks(tracks.filter(t => t.id !== picks[0].track.id), [])))
      .not.toContain(picks[0].track.id);
  });

  it('supports empty and one-song libraries and invalid limits', () => {
    const track = makeTrack({ id: 'only' });
    expect(recommendTracks([], [])).toEqual([]);
    expect(pickIds(recommendTracks([track], ['only']))).toEqual(['only']);
    for (const limit of [0, -1, NaN, Infinity]) {
      expect(recommendTracks([track], [], limit)).toEqual([]);
    }
  });

  it('produces a stable ranking without mutating library or history', () => {
    const tracks = Object.freeze([
      Object.freeze(makeTrack({ id: 'b' })),
      Object.freeze(makeTrack({ id: 'a' })),
    ]);
    const history = Object.freeze(['a']);
    const first = recommendTracks(tracks, history);
    expect(recommendTracks([...tracks].reverse(), history)).toEqual(first);
    expect(tracks.map(t => t.id)).toEqual(['b', 'a']);
    expect(history).toEqual(['a']);
  });
});

describe('recommendation preferences and modes', () => {
  const tracks = [
    makeTrack({ id: 'recent', artist: 'Alpha' }),
    makeTrack({ id: 'related', artist: 'Alpha' }),
    makeTrack({ id: 'liked', artist: 'Beta' }),
    makeTrack({ id: 'beta', artist: 'Beta' }),
    makeTrack({ id: 'hidden', artist: 'Gamma' }),
  ];
  const preferences = { likedIds: ['liked'], hiddenIds: ['hidden'] };

  it('excludes hidden songs from every mode and refreshed mix', () => {
    for (const mode of ['personal', 'discover', 'liked'] as const) {
      for (const variant of [0, 1, 2]) {
        const picks = recommendTracks(tracks, ['recent'], 20, { mode, variant, preferences });
        expect(pickIds(picks)).not.toContain('hidden');
      }
    }
  });

  it('limits Discover to songs outside recent history and Liked songs to explicit likes', () => {
    const discover = recommendTracks(tracks, ['recent', 'liked'], 20, { mode: 'discover', preferences });
    expect(new Set(pickIds(discover))).toEqual(new Set(['related', 'beta']));
    expect(pickIds(recommendTracks(tracks, ['liked'], 20, { mode: 'liked', preferences }))).toEqual(['liked']);
    expect(recommendTracks(tracks, [], 20, { mode: 'liked' })).toEqual([]);
    expect(recommendTracks(tracks, tracks.map(t => t.id), 20, { mode: 'discover' })).toEqual([]);
  });

  it('learns artist interest from likes even without recent listening', () => {
    const picks = recommendTracks(tracks, [], 20, { preferences });
    expect(picks[0].track.id).toBe('liked');
    expect(picks[0].reason).toBe('A song you liked');
    expect(picks.find(pick => pick.track.id === 'beta')!.reason).toBe('From an artist you liked: Beta');
  });

  it('does not infer related artists from unknown metadata in likes', () => {
    const unknown = tracks.map(track => ({ ...track, artist: 'Unknown Artist' }));
    const picks = recommendTracks(unknown, [], 20, { preferences });
    expect(picks.filter(pick => pick.reason.includes('artist you liked'))).toEqual([]);
  });

  it('creates stable but different mixes on refresh without changing the library', () => {
    const library = Array.from({ length: 40 }, (_, i) => makeTrack({ id: `song-${i}`, artist: `Artist ${i}` }));
    const first = recommendTracks(library, [], 20, { variant: 1 });
    expect(recommendTracks([...library].reverse(), [], 20, { variant: 1 })).toEqual(first);
    expect(pickIds(recommendTracks(library, [], 20, { variant: 2 }))).not.toEqual(pickIds(first));
    expect(new Set(pickIds(first)).size).toBe(20);
    expect(library[0].id).toBe('song-0');
  });

  it('lets users like, unlike, hide, and restore without conflicting feedback', () => {
    const initial = Object.freeze({ likedIds: [], hiddenIds: [] });
    const liked = updateRecommendationFeedback(initial, 'liked', 'like');
    expect(liked).toEqual({ likedIds: ['liked'], hiddenIds: [] });
    expect(updateRecommendationFeedback(liked, 'liked', 'like')).toEqual(initial);
    const hidden = updateRecommendationFeedback(liked, 'liked', 'hide');
    expect(hidden).toEqual({ likedIds: [], hiddenIds: ['liked'] });
    expect(updateRecommendationFeedback(hidden, 'liked', 'restore')).toEqual(initial);
    expect(updateRecommendationFeedback(hidden, 'liked', 'like')).toEqual(liked);
    expect(updateRecommendationFeedback(hidden, 'liked', 'hide')).toEqual(hidden);
  });

  it('starts a refreshed mix with a different song, even in a two-song library', () => {
    const library = tracks.slice(0, 2);
    const first = recommendTracks(library, ['recent']);
    const refreshed = recommendTracks(library, ['recent'], 20, {
      variant: 1, previousFirstId: first[0].track.id,
    });
    expect(refreshed[0].track.id).not.toBe(first[0].track.id);
    expect(new Set(pickIds(refreshed))).toEqual(new Set(pickIds(first)));
    expect(recommendTracks([library[0]], [], 20, { previousFirstId: library[0].id })).toHaveLength(1);
  });

  it('normalizes missing, malformed, duplicate, and conflicting persisted feedback', () => {
    expect(normalizePreferences(null)).toEqual({ likedIds: [], hiddenIds: [] });
    expect(normalizePreferences({ likedIds: ['a', 'a', 3, null, '', 'b'], hiddenIds: ['b', 'b'] }))
      .toEqual({ likedIds: ['a'], hiddenIds: ['b'] });
    expect(normalizePreferences({ likedIds: 'a', hiddenIds: {} })).toEqual({ likedIds: [], hiddenIds: [] });
  });

  it('ignores likes for deleted tracks and can recover an all-hidden library', () => {
    expect(recommendTracks(tracks, [], 20, { preferences: { likedIds: ['gone'], hiddenIds: [] } }))
      .toEqual(recommendTracks(tracks, []));
    const allHidden = { likedIds: [], hiddenIds: tracks.map(track => track.id) };
    expect(recommendTracks(tracks, [], 20, { preferences: allHidden })).toEqual([]);
    const restored = updateRecommendationFeedback(allHidden, 'recent', 'restore');
    expect(pickIds(recommendTracks(tracks, [], 20, { preferences: restored }))).toEqual(['recent']);
  });
});
