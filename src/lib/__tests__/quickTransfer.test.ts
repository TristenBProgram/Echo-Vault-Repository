import type { Track } from '../../types';
import {
  getTrackFileName,
  getTransferableTracks,
  mp3FileName,
  resolveSongFile,
  safePickedFileName,
  TransferError,
  uniqueMp3FileName,
} from '../quickTransfer';

const song = (overrides: Partial<Track> = {}): Track => ({
  id: 'file:///music/song.mp3',
  uri: 'file:///music/song.mp3',
  fileName: 'song.mp3',
  title: 'Song',
  artist: 'Artist',
  duration: 120,
  addedAt: 1,
  source: 'imported',
  ...overrides,
});

describe('QuickTransfer filename lookup', () => {
  test('finds an existing library song by its filename, regardless of case', () => {
    expect(resolveSongFile([song()], ' SONG.MP3 ')).toEqual({ track: song(), fileName: 'song.mp3' });
  });

  test.each(['', '   '])('rejects an empty filename before accessing files', name => {
    expect(() => resolveSongFile([song()], name)).toThrow(new TransferError('empty', 'Enter a song filename first.'));
  });

  test.each(['../private.mp3', '..\\private.mp3', '/private.mp3', 'C:private.mp3', '.hidden.mp3'])
  ('rejects unsafe input %s', name => {
    expect(() => resolveSongFile([song()], name)).toThrow(TransferError);
    try { resolveSongFile([song()], name); } catch (error) {
      expect((error as TransferError).code).toBe('unsafe');
    }
  });

  test('cannot reach a file that is not in the music library', () => {
    expect(() => resolveSongFile([song()], 'private.mp3')).toThrow(TransferError);
    try { resolveSongFile([song()], 'private.mp3'); } catch (error) {
      expect((error as TransferError).code).toBe('missing');
    }
  });

  test('rejects unsupported filenames and ambiguous duplicates', () => {
    expect(() => resolveSongFile([song()], 'notes.pdf')).toThrow(TransferError);
    expect(() => resolveSongFile([song(), song({ id: 'file:///other/song.mp3' })], 'song.mp3'))
      .toThrow(new TransferError('ambiguous', 'More than one song is named “song.mp3”. Rename or remove a duplicate first.'));
  });

  test('recovers filenames from previously imported tracks', () => {
    const old = song({ fileName: undefined, uri: 'file:///music/12345-0-Artist%20-%20Song.flac' });
    expect(getTrackFileName(old)).toBe('Artist - Song.flac');
    expect(getTransferableTracks([old])).toEqual([{ track: old, fileName: 'Artist - Song.flac' }]);
  });

  test('keeps supported source formats while choosing safe, unique MP3 output names', () => {
    expect(mp3FileName('song.FLAC')).toBe('song.mp3');
    expect(uniqueMp3FileName('song.wav', ['song.mp3', 'song (2).mp3'])).toBe('song (3).mp3');
    expect(safePickedFileName('A:B.wav')).toBe('A_B.wav');
  });
});
