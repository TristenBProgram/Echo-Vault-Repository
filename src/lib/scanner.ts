import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import {
  AssetField,
  MediaType,
  Query,
  requestPermissionsAsync,
} from 'expo-media-library';
import type { Track } from '../types';
import { parseFilename } from './format';
import { rowsToTracks } from './tracks';

export type ScanResult =
  | { ok: true; tracks: Track[] }
  | { ok: false; reason: 'unsupported' | 'permission' | 'error'; message?: string };

/**
 * Finds every audio file Android knows about.
 *
 * iPhones don't let apps browse the phone's music or files, so on iOS this
 * returns 'unsupported' and the app uses importFromFiles() instead.
 */
export async function scanDevice(): Promise<ScanResult> {
  if (Platform.OS !== 'android') return { ok: false, reason: 'unsupported' };

  try {
    const permission = await requestPermissionsAsync(false, ['audio']);
    if (!permission.granted) return { ok: false, reason: 'permission' };

    const rows = await new Query()
      .eq(AssetField.MEDIA_TYPE, MediaType.AUDIO)
      .limit(10000)
      .exeForMetadata();

    return { ok: true, tracks: rowsToTracks(rows) };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: String(e?.message ?? e) };
  }
}

/**
 * Lets the person pick audio files (from the Files app, iCloud Drive,
 * Downloads, etc.). Picked files are copied into the app so they keep working.
 */
export async function importFromFiles(): Promise<Track[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];

  const musicDir = new Directory(Paths.document, 'music');
  if (!musicDir.exists) musicDir.create();

  const tracks: Track[] = [];
  for (const picked of result.assets) {
    try {
      const safeName = picked.name.replace(/[^\w.\- ()]/g, '_');
      const dest = new File(musicDir, `${Date.now()}-${tracks.length}-${safeName}`);
      new File(picked.uri).copy(dest);

      const { title, artist } = parseFilename(picked.name);
      tracks.push({
        id: dest.uri,
        uri: dest.uri,
        title,
        artist,
        duration: 0,
        addedAt: Date.now(),
        source: 'imported',
      });
    } catch (e) {
      console.warn('Could not import', picked.name, e);
    }
  }
  return tracks;
}

/** Deletes an imported file's copy from app storage. */
export function deleteImportedFile(track: Track) {
  if (track.source !== 'imported') return;
  try {
    const f = new File(track.uri);
    if (f.exists) f.delete();
  } catch (e) {
    console.warn('Could not delete', track.uri, e);
  }
}
