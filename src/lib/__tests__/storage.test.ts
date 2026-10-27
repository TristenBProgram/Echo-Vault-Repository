import { loadSavedState, saveState, type SavedState } from '../storage';
import { recommendTracks } from '../recommendations';
import { getPlaylistTracks } from '../playlists';
import { makeTrack } from '../testUtils';

const mockFile = {
  exists: true,
  create: jest.fn(),
  text: jest.fn(),
  writeSync: jest.fn(),
};

jest.mock('expo-file-system', () => ({
  File: jest.fn(() => mockFile),
  Paths: { document: 'file:///documents/' },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockFile.exists = true;
  mockFile.writeSync.mockImplementation((value: string) => {
    mockFile.text.mockResolvedValue(value);
  });
});

it('loads pre-organizer libraries without losing recommendation history', async () => {
  const tracks = [makeTrack({ id: 'played' }), makeTrack({ id: 'next' })];
  mockFile.text.mockResolvedValue(JSON.stringify({ tracks, recentIds: ['played'] }));
  const saved = await loadSavedState();
  expect(saved).toEqual({ tracks, recentIds: ['played'], playlists: [] });
  expect(recommendTracks(saved!.tracks, saved!.recentIds)[0].track.id).toBe('next');
});

it('preserves playlists and recommendation history together across saving and loading', async () => {
  const state: SavedState = {
    tracks: [makeTrack({ id: 'played' }), makeTrack({ id: 'next' })],
    recentIds: ['played'],
    playlists: [{
      id: 'playlist', name: 'Favorites', category: 'Favorites',
      trackIds: ['next', 'played'], createdAt: 1, updatedAt: 2,
    }],
  };
  saveState(state);
  const saved = await loadSavedState();
  expect(saved).toEqual(state);
  expect(getPlaylistTracks(saved!.playlists[0], saved!.tracks).map(t => t.id))
    .toEqual(['next', 'played']);
  expect(recommendTracks(saved!.tracks, saved!.recentIds)[0].track.id).toBe('next');
});

it('loads removed playlist songs safely while retaining valid recommendations', async () => {
  const state: SavedState = {
    tracks: [makeTrack({ id: 'remaining' })],
    recentIds: ['removed'],
    playlists: [{
      id: 'playlist', name: 'Mix', category: 'Custom',
      trackIds: ['removed', 'remaining'], createdAt: 1, updatedAt: 2,
    }],
  };
  saveState(state);
  const saved = (await loadSavedState())!;
  expect(getPlaylistTracks(saved.playlists[0], saved.tracks).map(t => t.id)).toEqual(['remaining']);
  expect(recommendTracks(saved.tracks, saved.recentIds).map(pick => pick.track.id)).toEqual(['remaining']);
});
