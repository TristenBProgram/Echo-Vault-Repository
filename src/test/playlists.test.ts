import {
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
  sortPlaylistsByName,
  sortPlaylistsByCategory,
  getPlaylistTracks,
} from '../lib/playlists';

import type { PlaylistCategory, Track } from '../types';

const study = 'study' as PlaylistCategory;
const workout = 'workout' as PlaylistCategory;

describe('EchoVault Playlist Organizer Unit Tests', () => {

  // Test 1: Create a playlist
  test('creates a playlist successfully', () => {
    const playlist = createPlaylist('My Music', study);

    expect(playlist.name).toBe('My Music');
    expect(playlist.trackIds).toEqual([]);
    expect(playlist.id).toBeDefined();
  });

  // Test 2: Reject empty playlist name
  test('rejects an empty playlist name', () => {
    expect(() => createPlaylist('   ', study)).toThrow(
      'Playlist name cannot be empty'
    );
  });

  // Test 3: Add song to playlist
  test('adds a song to a playlist', () => {
    const playlist = createPlaylist('Favorites', study);

    const updated = addSongToPlaylist(playlist, 'song1');

    expect(updated.trackIds).toContain('song1');
  });

  // Test 4: Prevent duplicate songs
  test('does not add duplicate songs', () => {
    const playlist = createPlaylist('Favorites', study);

    const first = addSongToPlaylist(playlist, 'song1');
    const second = addSongToPlaylist(first, 'song1');

    expect(second.trackIds).toEqual(['song1']);
  });

  // Test 5: Remove song
  test('removes a song from a playlist', () => {
    const playlist = createPlaylist('Favorites', study);

    const added = addSongToPlaylist(playlist, 'song1');
    const removed = removeSongFromPlaylist(added, 'song1');

    expect(removed.trackIds).not.toContain('song1');
  });

  // Test 6: Rename playlist
  test('renames a playlist', () => {
    const playlist = createPlaylist('Old Name', study);

    const renamed = renamePlaylist(playlist, 'New Name');

    expect(renamed.name).toBe('New Name');
  });

  // Test 7: Reject empty rename
  test('rejects an empty new name', () => {
    const playlist = createPlaylist('Favorites', study);

    expect(() => renamePlaylist(playlist, '  ')).toThrow(
      'Playlist name cannot be empty'
    );
  });

  // Test 8: Sort playlists alphabetically
  test('sorts playlists by name', () => {
    const a = createPlaylist('Z Music', study);
    const b = createPlaylist('A Music', study);

    const sorted = sortPlaylistsByName([a, b]);

    expect(sorted.map(p => p.name)).toEqual([
      'A Music',
      'Z Music'
    ]);
  });

  // Test 9: Sort playlists by category
  test('sorts playlists by category', () => {
    const a = createPlaylist('Gym', workout);
    const b = createPlaylist('Homework', study);

    const sorted = sortPlaylistsByCategory([a, b]);

    expect(sorted.map(p => p.category)).toEqual([
      study,
      workout
    ]);
  });

  // Test 10: Get songs belonging to playlist
  test('retrieves playlist songs from library', () => {
    const playlist = createPlaylist('Favorites', study);
    const updated = addSongToPlaylist(playlist, 'song1');

    const tracks = [
      { id: 'song1', title: 'First Song' },
      { id: 'song2', title: 'Second Song' },
    ] as Track[];

    const result = getPlaylistTracks(updated, tracks);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('song1');
  });

});
