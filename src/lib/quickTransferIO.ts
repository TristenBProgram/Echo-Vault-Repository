import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Track } from '../types';
import { parseFilename } from './format';
import {
  getTransferableTracks,
  mp3FileName,
  resolveSongFile,
  safePickedFileName,
  TransferError,
  uniqueMp3FileName,
} from './quickTransfer';

export type ImportResult = {
  cancelled: boolean;
  imported: Track[];
  failures: string[];
};

export type AudioConverter = {
  execute: (args: string[]) => Promise<{ success: boolean; cancelled: boolean }>;
  getMediaInformation: (path: string) => Promise<{ streams?: { codec_type?: string; codec_name?: string }[] }>;
};

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function removeFile(file: File) {
  try {
    if (file.exists) file.delete();
  } catch {
    // Keep the original transfer error if cleanup itself fails.
  }
}

function removeDirectory(directory: Directory) {
  try {
    if (directory.exists) directory.delete();
  } catch {
    // Cache cleanup is best effort.
  }
}

/** Makes a complete MP3 before callers add it to the library or open sharing. */
async function prepareMp3(
  sourceUri: string,
  sourceName: string,
  destination: File,
  converter?: AudioConverter,
): Promise<void> {
  const source = new File(sourceUri);
  if (!source.exists) {
    throw new TransferError('missing', 'This song is no longer available on the phone.');
  }

  if (sourceName.toLowerCase().endsWith('.mp3')) {
    try {
      await source.copy(destination);
      if (!destination.exists || destination.size <= 0 ||
        (source.size > 0 && source.size !== destination.size)) {
        throw new TransferError('failed', 'The copied MP3 did not match the source file.');
      }
      if (sourceUri.startsWith('file://') &&
        await source.digest('SHA-256') !== await destination.digest('SHA-256')) {
        throw new TransferError('failed', 'The copied MP3 failed its integrity check.');
      }
      return;
    } catch (error) {
      removeFile(destination);
      throw error;
    }
  }

  const work = new Directory(Paths.cache, 'quick-transfer', id());
  work.create({ intermediates: true });
  const staged = new File(work, sourceName);
  try {
    await source.copy(staged);
    if (!staged.exists || staged.size <= 0 ||
      (source.size > 0 && source.size !== staged.size)) {
      throw new TransferError('failed', 'Could not read the complete source audio file.');
    }

    let ffmpeg = converter;
    if (!ffmpeg) {
      try {
        ffmpeg = await import('munim-ffmpeg');
      } catch {
        throw new TransferError('unavailable', 'MP3 conversion requires an Echo Vault development build.');
      }
    }
    const result = await ffmpeg.execute([
      '-hide_banner', '-loglevel', 'error', '-y', '-i', staged.uri,
      '-map', '0:a:0', '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', destination.uri,
    ]);
    if (!result.success || result.cancelled || !destination.exists || destination.size <= 0) {
      throw new TransferError('failed', 'MP3 conversion failed. Check that the file contains playable audio.');
    }
    const info = await ffmpeg.getMediaInformation(destination.uri);
    if (!info.streams?.some(stream => stream.codec_type === 'audio' && stream.codec_name === 'mp3')) {
      throw new TransferError('failed', 'The converted file is not a valid MP3.');
    }
  } catch (error) {
    removeFile(destination);
    throw error;
  } finally {
    removeDirectory(work);
  }
}

/** Picks audio from the phone, converts it when needed, and returns library tracks. */
export async function importSongsAsMp3(
  existingTracks: Track[],
  onStatus?: (message: string) => void,
  converter?: AudioConverter,
): Promise<ImportResult> {
  const selection = await DocumentPicker.getDocumentAsync({
    type: 'audio/*', multiple: true, copyToCacheDirectory: true,
  });
  if (selection.canceled) return { cancelled: true, imported: [], failures: [] };

  const music = new Directory(Paths.document, 'music');
  if (!music.exists) music.create({ intermediates: true });
  const names = getTransferableTracks(existingTracks).map(item => item.fileName);
  const imported: Track[] = [];
  const failures: string[] = [];

  for (const asset of selection.assets) {
    try {
      const pickedName = safePickedFileName(asset.name);
      const fileName = uniqueMp3FileName(pickedName, names);
      onStatus?.(`Preparing ${asset.name}…`);
      const destination = new File(music, `${id()}-${fileName}`);
      await prepareMp3(asset.uri, pickedName, destination, converter);
      const { title, artist } = parseFilename(asset.name);
      imported.push({
        id: destination.uri,
        uri: destination.uri,
        fileName,
        title,
        artist,
        duration: 0,
        addedAt: Date.now(),
        source: 'imported',
      });
      names.push(fileName);
    } catch (error) {
      failures.push(`${asset.name}: ${error instanceof Error ? error.message : 'Import failed.'}`);
    }
  }
  return { cancelled: false, imported, failures };
}

/** Finds a library song by filename and presents an MP3 to the phone's share sheet. */
export async function downloadFile(
  requestedName: string,
  tracks: Track[],
  onStatus?: (message: string) => void,
  converter?: AudioConverter,
): Promise<{ fileName: string; bytes: number }> {
  const { track, fileName } = resolveSongFile(tracks, requestedName);
  if (!(await Sharing.isAvailableAsync())) {
    throw new TransferError('unavailable', 'File sharing is not available on this device.');
  }

  const outputName = mp3FileName(fileName);
  const work = new Directory(Paths.cache, 'quick-transfer', id());
  work.create({ intermediates: true });
  const output = new File(work, outputName);
  let sheetOpened = false;
  try {
    onStatus?.(`Preparing ${outputName}…`);
    await prepareMp3(track.uri, fileName, output, converter);
    const bytes = output.size;
    onStatus?.('Choose Save to Files, Downloads, or another destination in the share sheet.');
    await Sharing.shareAsync(output.uri, { dialogTitle: `Save ${outputName}`, mimeType: 'audio/mpeg' });
    sheetOpened = true;
    return { fileName: outputName, bytes };
  } finally {
    // Keep a successfully shared file available in case the receiving app reads it after the sheet closes.
    // The system owns cache eviction; failed attempts are removed immediately.
    if (!sheetOpened) removeDirectory(work);
  }
}
