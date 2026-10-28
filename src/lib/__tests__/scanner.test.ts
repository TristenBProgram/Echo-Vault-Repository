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
});
