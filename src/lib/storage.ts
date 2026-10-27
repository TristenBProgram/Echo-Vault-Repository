import { File, Paths } from 'expo-file-system';
import type { Track } from '../types';

export type SavedState = {
  tracks: Track[];
  recentIds: string[];
};

function libraryFile() {
  return new File(Paths.document, 'library.json');
}

export async function loadSavedState(): Promise<SavedState | null> {
  try {
    const file = libraryFile();
    if (!file.exists) return null;
    const parsed = JSON.parse(await file.text());
    return {
      tracks: Array.isArray(parsed.tracks) ? parsed.tracks : [],
      recentIds: Array.isArray(parsed.recentIds) ? parsed.recentIds : [],
    };
  } catch (e) {
    console.warn('Could not load saved library', e);
    return null;
  }
}

export function saveState(state: SavedState) {
  try {
    const file = libraryFile();
    if (!file.exists) file.create();
    file.writeSync(JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save library', e);
  }
}
