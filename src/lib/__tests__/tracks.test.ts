import {
  addRecent,
  groupArtists,
  MAX_RECENTS,
  mergeScan,
  recentlyAdded,
  resolveRecent,
  rowsToTracks,
  searchTracks,
  sortTracks,
} from '../tracks';
import { ids, makeTrack } from '../testUtils';

describe('rowsToTracks', () => {
  it('builds tracks from media-store rows', () => {
    const [track] = rowsToTracks([
      { id: 'content://media/1', filename: 'Artist - Title.mp3', duration: 200_000, modificationTime: 1234 },
    ]);
    expect(track).toEqual({
      id: 'content://media/1',
      uri: 'content://media/1',
      title: 'Title',
      artist: 'Artist',
      duration: 200,
      addedAt: 1234,
      source: 'device',
    });
  });

  it('reads durations in milliseconds when values are large', () => {
    const tracks = rowsToTracks([
      { id: 'a', filename: 'a.mp3', duration: 180_000 },
      { id: 'b', filename: 'b.mp3', duration: 240_000 },
    ]);
    expect(tracks.map(t => t.duration)).toEqual([180, 240]);
  });

  it('reads durations in seconds when values are small', () => {
    const tracks = rowsToTracks([
      { id: 'a', filename: 'a.mp3', duration: 180 },
      { id: 'b', filename: 'b.mp3', duration: 240 },
    ]);
    expect(tracks.map(t => t.duration)).toEqual([180, 240]);
  });

  it('skips ringtones and notification sounds', () => {
    const tracks = rowsToTracks([
      { id: 'song', filename: 'song.mp3', duration: 200_000 },
      { id: 'ding', filename: 'ding.ogg', duration: 1_500 },
      { id: 'ringtone', filename: 'ring.ogg', duration: 25_000 },
    ]);
    expect(ids(tracks)).toEqual(['song']);
  });

  it('keeps files whose length is unknown', () => {
    const tracks = rowsToTracks([{ id: 'x', filename: 'x.mp3', duration: null }]);
    expect(ids(tracks)).toEqual(['x']);
    expect(tracks[0].duration).toBe(0);
  });

  it('falls back to creation time, then 0, for addedAt', () => {
    const tracks = rowsToTracks([
      { id: 'a', filename: 'a.mp3', creationTime: 99 },
      { id: 'b', filename: 'b.mp3' },
    ]);
    expect(tracks.map(t => t.addedAt)).toEqual([99, 0]);
  });

  it('handles a missing filename', () => {
    const [track] = rowsToTracks([{ id: 'x', filename: null }]);
    expect(track.title).toBe('Unknown');
    expect(track.artist).toBe('Unknown Artist');
  });

  it('returns nothing for no rows', () => {
    expect(rowsToTracks([])).toEqual([]);
  });
});

describe('mergeScan', () => {
  it('keeps imported files and replaces device files', () => {
    const imported = makeTrack({ id: 'file:///imported.mp3', source: 'imported' });
    const oldDevice = makeTrack({ id: 'content://old' });
    const newDevice = makeTrack({ id: 'content://new' });

    expect(ids(mergeScan([oldDevice, imported], [newDevice]))).toEqual(['content://new', 'file:///imported.mp3']);
  });

  it('removes device songs that disappeared from the phone', () => {
    const deleted = makeTrack({ id: 'content://deleted' });
    expect(mergeScan([deleted], [])).toEqual([]);
  });

  it('keeps a duration learned earlier when the scan does not know it', () => {
    const before = makeTrack({ id: 'x', duration: 215 });
    const scanned = makeTrack({ id: 'x', duration: 0 });
    expect(mergeScan([before], [scanned])[0].duration).toBe(215);
  });

  it('prefers the scan duration when it has one', () => {
    const before = makeTrack({ id: 'x', duration: 215 });
    const scanned = makeTrack({ id: 'x', duration: 220 });
    expect(mergeScan([before], [scanned])[0].duration).toBe(220);
  });
});

describe('groupArtists', () => {
  const tracks = [
    makeTrack({ id: '1', artist: 'Beta', title: 'Zebra' }),
    makeTrack({ id: '2', artist: 'Unknown Artist', title: 'Voice memo' }),
    makeTrack({ id: '3', artist: 'Alpha', title: 'Only one' }),
    makeTrack({ id: '4', artist: 'Beta', title: 'Apple' }),
    makeTrack({ id: '5', artist: 'Unknown Artist', title: 'Another' }),
    makeTrack({ id: '6', artist: 'Unknown Artist', title: 'Third' }),
  ];

  it('groups songs under each artist', () => {
    const artists = groupArtists(tracks);
    expect(artists.map(a => [a.name, a.tracks.length])).toEqual([
      ['Beta', 2],
      ['Alpha', 1],
      ['Unknown Artist', 3],
    ]);
  });

  it('puts Unknown Artist last even when it has the most songs', () => {
    const artists = groupArtists(tracks);
    expect(artists[artists.length - 1].name).toBe('Unknown Artist');
  });

  it('sorts each artist’s songs by title', () => {
    const beta = groupArtists(tracks).find(a => a.name === 'Beta')!;
    expect(beta.tracks.map(t => t.title)).toEqual(['Apple', 'Zebra']);
  });

  it('breaks ties alphabetically', () => {
    const artists = groupArtists([makeTrack({ artist: 'Zed' }), makeTrack({ artist: 'Amy' })]);
    expect(artists.map(a => a.name)).toEqual(['Amy', 'Zed']);
  });

  it('returns nothing for an empty library', () => {
    expect(groupArtists([])).toEqual([]);
  });
});

describe('recentlyAdded', () => {
  it('returns newest first, capped at the limit', () => {
    const tracks = [10, 30, 20, 40].map(t => makeTrack({ id: `t${t}`, addedAt: t }));
    expect(ids(recentlyAdded(tracks, 3))).toEqual(['t40', 't30', 't20']);
  });

  it('does not reorder the original list', () => {
    const tracks = [makeTrack({ id: 'old', addedAt: 1 }), makeTrack({ id: 'new', addedAt: 2 })];
    recentlyAdded(tracks);
    expect(ids(tracks)).toEqual(['old', 'new']);
  });
});

describe('addRecent', () => {
  it('puts the song at the front', () => {
    expect(addRecent(['a', 'b'], 'c')).toEqual(['c', 'a', 'b']);
  });

  it('moves a replayed song to the front instead of duplicating it', () => {
    expect(addRecent(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it('caps the list', () => {
    const full = Array.from({ length: MAX_RECENTS }, (_, i) => `s${i}`);
    const next = addRecent(full, 'new');
    expect(next).toHaveLength(MAX_RECENTS);
    expect(next[0]).toBe('new');
    expect(next).not.toContain(`s${MAX_RECENTS - 1}`);
  });
});

describe('resolveRecent', () => {
  it('returns tracks in recently-played order and skips removed songs', () => {
    const tracks = [makeTrack({ id: 'a' }), makeTrack({ id: 'b' })];
    expect(ids(resolveRecent(['b', 'gone', 'a'], tracks))).toEqual(['b', 'a']);
  });
});

describe('searchTracks', () => {
  const tracks = [
    makeTrack({ id: '1', title: 'Blinding Lights', artist: 'The Weeknd' }),
    makeTrack({ id: '2', title: 'Levitating', artist: 'Dua Lipa' }),
  ];

  it('matches titles and artists, ignoring case', () => {
    expect(ids(searchTracks(tracks, 'LIGHTS'))).toEqual(['1']);
    expect(ids(searchTracks(tracks, 'dua'))).toEqual(['2']);
  });

  it('ignores surrounding spaces', () => {
    expect(ids(searchTracks(tracks, '  weeknd '))).toEqual(['1']);
  });

  it('returns everything for an empty search', () => {
    expect(searchTracks(tracks, '   ')).toBe(tracks);
  });

  it('returns nothing when there is no match', () => {
    expect(searchTracks(tracks, 'zzz')).toEqual([]);
  });
});

describe('sortTracks', () => {
  const tracks = [
    makeTrack({ id: 'c', title: 'Cherry', artist: 'Bravo', addedAt: 2 }),
    makeTrack({ id: 'a', title: 'Apple', artist: 'Charlie', addedAt: 3 }),
    makeTrack({ id: 'b', title: 'Banana', artist: 'Bravo', addedAt: 1 }),
  ];

  it('sorts A–Z by title', () => {
    expect(ids(sortTracks(tracks, 'title'))).toEqual(['a', 'b', 'c']);
  });

  it('sorts by artist, then title', () => {
    expect(ids(sortTracks(tracks, 'artist'))).toEqual(['b', 'c', 'a']);
  });

  it('sorts newest first', () => {
    expect(ids(sortTracks(tracks, 'recent'))).toEqual(['a', 'c', 'b']);
  });

  it('does not reorder the original list', () => {
    sortTracks(tracks, 'title');
    expect(ids(tracks)).toEqual(['c', 'a', 'b']);
  });
});
