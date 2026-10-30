/**
 * Unit tests for scanDevice() in src/lib/scanner.ts.
 *
 * How to run (no phone, emulator, or Expo Go needed):
 *   1. Requires Git and Node.js 22.13+ (22 LTS) or 24.3+ (24 LTS).
 *   2. git clone --branch feature/scan-device-tests https://github.com/TristenBProgram/Echo-Vault-Repository.git
 *      (once merged, a normal clone of main works)
 *   3. cd Echo-Vault-Repository && npm install
 *   4. npx jest src/lib/__tests__/scanner.test.ts --verbose
 *      (or `npm test` to run every suite)
 *
 * Expected: 16 tests pass. The Expo native modules (expo-media-library,
 * expo-file-system, expo-document-picker) are mocked below.
 */
import { Platform } from 'react-native';
import { requestPermissionsAsync } from 'expo-media-library';
import { scanDevice } from '../scanner';

const mockExeForMetadata = jest.fn();
const mockQuery = {
  eq: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exeForMetadata: (...args: unknown[]) => mockExeForMetadata(...args),
};

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({
  Directory: jest.fn(),
  File: jest.fn(),
  Paths: { document: 'file:///documents/' },
}));
jest.mock('expo-media-library', () => ({
  AssetField: { MEDIA_TYPE: 'mediaType' },
  MediaType: { AUDIO: 'audio' },
  Query: jest.fn(() => mockQuery),
  requestPermissionsAsync: jest.fn(),
}));

const mockPermission = requestPermissionsAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'android';
  mockPermission.mockResolvedValue({ granted: true });
  mockExeForMetadata.mockResolvedValue([]);
});

describe('scanDevice', () => {
  it('returns "unsupported" on iOS without asking for permission', async () => {
    Platform.OS = 'ios';
    expect(await scanDevice()).toEqual({ ok: false, reason: 'unsupported' });
    expect(mockPermission).not.toHaveBeenCalled();
  });

  it('returns "permission" and does not query when access is denied', async () => {
    mockPermission.mockResolvedValue({ granted: false });
    expect(await scanDevice()).toEqual({ ok: false, reason: 'permission' });
    expect(mockExeForMetadata).not.toHaveBeenCalled();
  });

  it('requests read-only audio permission', async () => {
    await scanDevice();
    expect(mockPermission).toHaveBeenCalledWith(false, ['audio']);
  });

  it('queries only audio files with a 10000 item limit', async () => {
    await scanDevice();
    expect(mockQuery.eq).toHaveBeenCalledWith('mediaType', 'audio');
    expect(mockQuery.limit).toHaveBeenCalledWith(10000);
  });

  it('returns an empty track list when the device has no audio', async () => {
    expect(await scanDevice()).toEqual({ ok: true, tracks: [] });
  });

  it('converts media rows into device tracks', async () => {
    mockExeForMetadata.mockResolvedValue([
      { id: '1', filename: 'Daft Punk - Around the World.mp3', duration: 240000 },
      { id: '2', filename: 'Boards of Canada - Roygbiv.mp3', duration: 150000 },
    ]);
    const result = await scanDevice();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tracks).toHaveLength(2);
    expect(result.tracks[0]).toMatchObject({
      title: 'Around the World',
      artist: 'Daft Punk',
      duration: 240,
      source: 'device',
    });
  });

  it('skips clips shorter than 30 seconds such as ringtones', async () => {
    mockExeForMetadata.mockResolvedValue([
      { id: '1', filename: 'A - Song.mp3', duration: 200000 },
      { id: '2', filename: 'ringtone.mp3', duration: 5000 },
    ]);
    const result = await scanDevice();
    expect(result.ok && result.tracks.map(t => t.title)).toEqual(['Song']);
  });

  it('returns "error" with the message when the media query fails', async () => {
    mockExeForMetadata.mockRejectedValue(new Error('media store unavailable'));
    expect(await scanDevice()).toEqual({
      ok: false,
      reason: 'error',
      message: 'media store unavailable',
    });
  });

  it('returns "error" when the permission request throws', async () => {
    mockPermission.mockRejectedValue(new Error('no activity'));
    expect(await scanDevice()).toEqual({ ok: false, reason: 'error', message: 'no activity' });
  });

  describe('boundary cases', () => {
    const scanTitles = async (rows: object[]) => {
      mockExeForMetadata.mockResolvedValue(rows);
      const result = await scanDevice();
      if (!result.ok) throw new Error('scan failed');
      return result.tracks;
    };

    it('keeps a clip of exactly 30 seconds and skips one just under it', async () => {
      const tracks = await scanTitles([
        { id: 'big', filename: 'A - Long.mp3', duration: 200000 },
        { id: 'at', filename: 'A - Exactly30.mp3', duration: 30000 },
        { id: 'under', filename: 'A - Under30.mp3', duration: 29999 },
      ]);
      expect(tracks.map(t => t.title)).toEqual(['Long', 'Exactly30']);
    });

    it('keeps rows whose duration is 0 or missing (unknown, not short)', async () => {
      const tracks = await scanTitles([
        { id: 'big', filename: 'A - Long.mp3', duration: 200000 },
        { id: 'zero', filename: 'A - Zero.mp3', duration: 0 },
        { id: 'null', filename: 'A - Null.mp3', duration: null },
        { id: 'none', filename: 'A - None.mp3' },
      ]);
      expect(tracks.map(t => t.title)).toEqual(['Long', 'Zero', 'Null', 'None']);
      expect(tracks.slice(1).every(t => t.duration === 0)).toBe(true);
    });

    it('reads durations as seconds when the median is exactly 3000', async () => {
      const [track] = await scanTitles([{ id: '1', filename: 'A - Song.mp3', duration: 3000 }]);
      expect(track.duration).toBe(3000);
    });

    it('reads durations as milliseconds when the median is just over 3000', async () => {
      // 3001 ms is only 3 seconds, so it is treated as a short clip and skipped.
      expect(await scanTitles([{ id: '1', filename: 'A - Song.mp3', duration: 3001 }])).toEqual([]);
    });

    it('supports devices that report durations in seconds', async () => {
      const tracks = await scanTitles([
        { id: '1', filename: 'A - Song.mp3', duration: 200 },
        { id: '2', filename: 'A - Ringtone.mp3', duration: 5 },
      ]);
      expect(tracks.map(t => t.duration)).toEqual([200]);
    });

    it('falls back to "Unknown" when a row has no filename', async () => {
      const [track] = await scanTitles([{ id: '1', filename: null, duration: 200000 }]);
      expect(track).toMatchObject({ title: 'Unknown', source: 'device' });
    });

    it('does not fail when the media store returns many rows', async () => {
      const rows = Array.from({ length: 10000 }, (_, i) => ({
        id: `content://media/${i}`,
        filename: `Artist - Song ${i}.mp3`,
        duration: 200000,
      }));
      expect(await scanTitles(rows)).toHaveLength(10000);
    });
  });
});
