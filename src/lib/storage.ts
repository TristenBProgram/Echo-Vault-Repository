
import { File, Paths } from 'expo-file-system';
import type { Playlist, Track } from '../types';
import { normalizePreferences, type RecommendationPreferences } from './recommendations';

// Data saved locally on the user's phone
export type SavedState = {
  tracks: Track[];
  recentIds: string[];
  playlists: Playlist[];
  recommendationPreferences?: RecommendationPreferences;
};

// Location of the saved music library
function libraryFile() {
  return new File(Paths.document, 'library.json');
}

// Load saved songs and playlists when EchoVault opens
export async function loadSavedState(): Promise<SavedState | null> {
  try {
    const file = libraryFile();

    if (!file.exists) return null;

    const parsed = JSON.parse(await file.text());

    return {
      recommendationPreferences: normalizePreferences(parsed.recommendationPreferences),
      tracks: Array.isArray(parsed.tracks)
        ? parsed.tracks
        : [],

      recentIds: Array.isArray(parsed.recentIds)
        ? parsed.recentIds
        : [],

      playlists: Array.isArray(parsed.playlists)
        ? parsed.playlists
        : [],
    };
  } catch (e) {
    console.warn('Could not load saved library', e);
    return null;
  }
}

// Save the music library and playlists locally
export function saveState(state: SavedState) {
  try {
    const file = libraryFile();
    if (!file.exists) file.create();
    file.writeSync(JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save library', e);
  }
}
