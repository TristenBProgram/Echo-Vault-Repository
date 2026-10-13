
import type { Playlist, PlaylistCategory, Track } from '../types';

// Create a playlist
export function createPlaylist(
  name: string,
  category: PlaylistCategory
): Playlist {
  const now = Date.now();

  if (!name.trim()) {
    throw new Error('Playlist name cannot be empty');
  }

  return {
    id: `${now}-${Math.random().toString(36).slice(2)}`,
    name: name.trim(),
    category,
    trackIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

// Add a song to a playlist
export function addSongToPlaylist(
  playlist: Playlist,
  trackId: string
): Playlist {
  if (playlist.trackIds.includes(trackId)) {
    return playlist;
  }

  return {
    ...playlist,
    trackIds: [...playlist.trackIds, trackId],
    updatedAt: Date.now(),
  };
}

// Remove a song from a playlist
export function removeSongFromPlaylist(
  playlist: Playlist,
  trackId: string
): Playlist {
  return {
    ...playlist,
    trackIds: playlist.trackIds.filter(id => id !== trackId),
    updatedAt: Date.now(),
  };
}

// Rename a playlist
export function renamePlaylist(
  playlist: Playlist,
  newName: string
): Playlist {
  if (!newName.trim()) {
    throw new Error('Playlist name cannot be empty');
  }

  return {
    ...playlist,
    name: newName.trim(),
    updatedAt: Date.now(),
  };
}

// Sort playlists by name
export function sortPlaylistsByName(
  playlists: Playlist[]
): Playlist[] {
  return [...playlists].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

// Sort playlists by category
export function sortPlaylistsByCategory(
  playlists: Playlist[]
): Playlist[] {
  return [...playlists].sort((a, b) =>
    a.category.localeCompare(b.category)
  );
}

// Get songs belonging to a playlist
export function getPlaylistTracks(
  playlist: Playlist,
  libraryTracks: Track[]
): Track[] {
  const trackMap = new Map(
    libraryTracks.map(track => [track.id, track])
  );

  return playlist.trackIds
    .map(id => trackMap.get(id))
    .filter((track): track is Track => track !== undefined);
}
