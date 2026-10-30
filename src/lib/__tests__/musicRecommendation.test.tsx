/**
 * Tests the app's real LibraryProvider -> recommendTracks integration.
 * The app has no Python manager or genres: preferences are liked/hidden track
 * IDs, tracks use the production Track shape, and history is newest-first.
 * Empty/malformed preferences mean no feedback; personal mode still offers
 * downloads, while liked mode returns no songs. Only storage and device/file
 * access are mocked. The provider, preference normalization, and ranking run.
 */
import React, { act } from 'react';
import { Platform } from 'react-native';
import { createRoot } from 'test-renderer';
import { LibraryProvider, useLibrary } from '../../context/LibraryContext';
import { loadSavedState, saveState, type SavedState } from '../storage';
import { deleteImportedFile, importFromFiles } from '../scanner';
import type { RecommendationPreferences } from '../recommendations';
import { makeTrack } from '../testUtils';
import type { Track } from '../../types';

jest.mock('../storage', () => ({ loadSavedState: jest.fn(), saveState: jest.fn() }));
jest.mock('../scanner', () => ({
  scanDevice: jest.fn(), importFromFiles: jest.fn(), deleteImportedFile: jest.fn(),
}));

describe('TestMusicRecommendation', () => {
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
  let root: ReturnType<typeof createRoot>;
  let library: ReturnType<typeof useLibrary>;
  let tracks: Track[];
  const emptyPreferences = () => ({ likedIds: [], hiddenIds: [] });

  beforeAll(() => { environment.IS_REACT_ACT_ENVIRONMENT = true; });
  afterAll(() => { environment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment; });

  function Probe() {
    library = useLibrary();
    return null;
  }

  async function mount(state: Partial<SavedState> = {}) {
    jest.mocked(loadSavedState).mockResolvedValue({
      tracks, recentIds: [], playlists: [],
      recommendationPreferences: emptyPreferences(), ...state,
    });
    await act(async () => {
      root.render(<LibraryProvider><Probe /></LibraryProvider>);
    });
    expect(library.ready).toBe(true);
  }

  const suggestedSongs = (mode: 'personal' | 'discover' | 'liked' = 'personal') =>
    library.getRecommendations({ mode }).map(pick => pick.track);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.replaceProperty(Platform, 'OS', 'ios'); // deterministic; no automatic Android rescan
    root = createRoot();
    tracks = [
      makeTrack({ id: 'played', title: 'First Light', artist: 'Alpha', addedAt: 30, source: 'imported' }),
      makeTrack({ id: 'related', title: 'Afterglow', artist: 'Alpha', addedAt: 20 }),
      makeTrack({ id: 'liked', title: 'Blue Sky', artist: 'Beta', addedAt: 40 }),
      makeTrack({ id: 'unrelated', title: 'Quiet Night', artist: 'Gamma', addedAt: 10 }),
    ];
    jest.mocked(importFromFiles).mockResolvedValue([]);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    jest.restoreAllMocks();
  });

  test('test_valid_preferences: liked mode returns the exact selected songs and excludes unrelated songs', async () => {
    await mount({ recommendationPreferences: { likedIds: ['related', 'liked'], hiddenIds: [] } });
    expect(suggestedSongs('liked')).toEqual([tracks[2], tracks[1]]);
  });

  test('test_empty_preferences: liked mode is empty and personal mode falls back to downloads', async () => {
    await mount();
    expect(suggestedSongs('liked')).toEqual([]);
    expect(suggestedSongs()).toEqual([tracks[2], tracks[0], tracks[3], tracks[1]]);
  });

  test('test_none_preferences: a legacy library without preferences loads safely', async () => {
    await mount({ recommendationPreferences: undefined });
    expect(library.recommendationPreferences).toEqual(emptyPreferences());
    expect(suggestedSongs('liked')).toEqual([]);
    expect(suggestedSongs()).toEqual([tracks[2], tracks[0], tracks[3], tracks[1]]);
  });

  test.each([null, 42, 'rock', { likedIds: 123, hiddenIds: false }])(
    'test_invalid_data_type: malformed saved feedback %p loads without crashing',
    async value => {
      await mount({ recommendationPreferences: value as unknown as RecommendationPreferences });
      expect(library.recommendationPreferences).toEqual(emptyPreferences());
      expect(suggestedSongs('liked')).toEqual([]);
      expect(suggestedSongs()).toEqual([tracks[2], tracks[0], tracks[3], tracks[1]]);
    },
  );

  test('test_unknown_track_preferences: preferences for unavailable songs produce no liked matches', async () => {
    await mount({ recommendationPreferences: { likedIds: ['not-downloaded'], hiddenIds: [] } });
    expect(suggestedSongs('liked')).toEqual([]);
  });

  test('test_one_matching_song: exactly the one available liked song is returned', async () => {
    await mount({ recommendationPreferences: { likedIds: ['related'], hiddenIds: [] } });
    expect(suggestedSongs('liked')).toEqual([tracks[1]]);
  });

  test('test_empty_music_library: every mode returns an empty list', async () => {
    await mount({ tracks: [] });
    expect(suggestedSongs()).toEqual([]);
    expect(suggestedSongs('discover')).toEqual([]);
    expect(suggestedSongs('liked')).toEqual([]);
  });

  test('test_no_matching_songs: Discover returns nothing when every download is in recent history', async () => {
    await mount({ recentIds: tracks.map(track => track.id) });
    expect(suggestedSongs('discover')).toEqual([]);
  });

  test('test_multiple_matching_songs: duplicate preference IDs never duplicate matching songs', async () => {
    await mount({ recommendationPreferences: { likedIds: ['related', 'related', 'liked', 'liked'], hiddenIds: [] } });
    expect(suggestedSongs('liked')).toEqual([tracks[2], tracks[1]]);
    expect(library.recommendationPreferences.likedIds).toEqual(['related', 'liked']);
  });

  test('listening to a song promotes another download by that artist', async () => {
    await mount();
    await act(async () => library.markPlayed('played'));
    expect(library.recommendations[0]).toEqual({ track: tracks[1], reason: 'More from Alpha' });
    expect(suggestedSongs('discover')).not.toContainEqual(tracks[0]);
  });

  test('liking, unliking, hiding and restoring updates live results and saves feedback', async () => {
    await mount();
    await act(async () => library.recommendationFeedback('liked', 'like'));
    expect(suggestedSongs('liked')).toEqual([tracks[2]]);
    expect(library.recommendations[0]).toEqual({ track: tracks[2], reason: 'A song you liked' });

    await act(async () => library.recommendationFeedback('liked', 'like'));
    expect(suggestedSongs('liked')).toEqual([]);
    await act(async () => library.recommendationFeedback('liked', 'hide'));
    expect(suggestedSongs()).not.toContainEqual(tracks[2]);
    expect(suggestedSongs('discover')).not.toContainEqual(tracks[2]);
    expect(jest.mocked(saveState).mock.lastCall?.[0].recommendationPreferences)
      .toEqual({ likedIds: [], hiddenIds: ['liked'] });

    await act(async () => library.recommendationFeedback('liked', 'restore'));
    expect(suggestedSongs()).toContainEqual(tracks[2]);
    expect(deleteImportedFile).not.toHaveBeenCalled();
    expect(library.tracks).toEqual(tracks);
  });

  test('removing an imported song removes its history and feedback from recommendations', async () => {
    await mount({
      recentIds: ['played'],
      recommendationPreferences: { likedIds: ['played'], hiddenIds: [] },
    });
    await act(async () => library.removeTrack('played'));
    expect(suggestedSongs('liked')).toEqual([]);
    expect(suggestedSongs()).toEqual([tracks[2], tracks[1], tracks[3]]);
    expect(library.recentlyPlayed).toEqual([]);
    expect(library.recommendationPreferences).toEqual(emptyPreferences());
    expect(deleteImportedFile).toHaveBeenCalledWith(tracks[0]);
  });

  test('new imports become available to recommendations without restarting the provider', async () => {
    await mount({ recentIds: ['played'] });
    const imported = makeTrack({ id: 'new', title: 'Sunrise', artist: 'Alpha', addedAt: 100 });
    jest.mocked(importFromFiles).mockResolvedValue([imported]);
    await act(async () => { await library.importFiles(); });
    expect(library.recommendations[0]).toEqual({ track: imported, reason: 'More from Alpha' });
    expect(suggestedSongs('discover')).toContainEqual(imported);
  });

  test('saved preferences and listening history restore identical recommendations after reopening', async () => {
    await mount();
    await act(async () => {
      library.markPlayed('played');
      library.recommendationFeedback('liked', 'like');
      library.recommendationFeedback('unrelated', 'hide');
    });
    const expected = library.recommendations;
    const saved = jest.mocked(saveState).mock.lastCall![0];
    await act(async () => root.unmount());
    root = createRoot();
    await mount(saved);
    expect(library.recommendations).toEqual(expected);
    expect(suggestedSongs('liked')).toEqual([tracks[2]]);
    expect(suggestedSongs()).not.toContainEqual(tracks[3]);
  });
});
