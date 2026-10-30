import type { Track } from '../types';

const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg']);

export type TransferErrorCode = 'empty' | 'unsafe' | 'unsupported' | 'missing' | 'ambiguous' | 'unavailable' | 'failed';

export class TransferError extends Error {
  constructor(public code: TransferErrorCode, message: string) {
    super(message);
    this.name = 'TransferError';
  }
}

export function isSupportedAudioFile(fileName: string): boolean {
  const extension = fileName.match(/\.([^.]+)$/)?.[1].toLowerCase();
  return extension !== undefined && AUDIO_EXTENSIONS.has(extension);
}

export function validateFileName(value: string): string {
  const fileName = value.trim();
  if (!fileName) throw new TransferError('empty', 'Enter a song filename first.');
  if (fileName.startsWith('.') || /[\\/:\x00-\x1f\x7f]/.test(fileName)) {
    throw new TransferError('unsafe', 'Use a filename only, without a path or special control characters.');
  }
  if (!isSupportedAudioFile(fileName)) {
    throw new TransferError('unsupported', 'Choose an MP3, WAV, FLAC, M4A, AAC, or OGG audio file.');
  }
  return fileName;
}

/** Files imported before QuickTransfer did not store the original name. */
export function getTrackFileName(track: Track): string | null {
  if (track.fileName) return track.fileName;
  if (track.source !== 'imported') return null;
  const lastSegment = track.uri.split('/').pop();
  if (!lastSegment) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(lastSegment);
  } catch {
    return null;
  }
  return decoded.replace(/^\d+-\d+-/, '');
}

export function getTransferableTracks(tracks: Track[]): { track: Track; fileName: string }[] {
  return tracks.flatMap(track => {
    const fileName = getTrackFileName(track);
    if (!fileName) return [];
    try {
      return [{ track, fileName: validateFileName(fileName) }];
    } catch {
      return [];
    }
  });
}

/** Only a track already in this user's library can be exported. */
export function resolveSongFile(tracks: Track[], requestedName: string): { track: Track; fileName: string } {
  const fileName = validateFileName(requestedName);
  const matches = getTransferableTracks(tracks).filter(
    item => item.fileName.toLowerCase() === fileName.toLowerCase(),
  );
  if (!matches.length) throw new TransferError('missing', `“${fileName}” is not in your music library.`);
  if (matches.length > 1) {
    throw new TransferError('ambiguous', `More than one song is named “${fileName}”. Rename or remove a duplicate first.`);
  }
  return matches[0];
}

export function mp3FileName(fileName: string): string {
  return validateFileName(fileName).replace(/\.[^.]+$/, '.mp3');
}

export function uniqueMp3FileName(fileName: string, existingNames: string[]): string {
  const proposed = mp3FileName(fileName);
  const occupied = new Set(existingNames.map(name => name.toLowerCase()));
  if (!occupied.has(proposed.toLowerCase())) return proposed;
  const stem = proposed.slice(0, -4);
  let index = 2;
  while (occupied.has(`${stem} (${index}).mp3`.toLowerCase())) index++;
  return `${stem} (${index}).mp3`;
}

/** A picked filename is never used as a path component without sanitizing it. */
export function safePickedFileName(name: string): string {
  const sanitized = name.replace(/[\\/:\x00-\x1f\x7f]/g, '_').replace(/[^\w. ()-]/g, '_').trim();
  return validateFileName(sanitized);
}
