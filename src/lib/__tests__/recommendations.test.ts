import { recommendTracks } from '../recommendations';
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
