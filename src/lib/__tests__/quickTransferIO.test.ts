import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import type { Track } from '../../types';
import { downloadFile, importSongsAsMp3 } from '../quickTransferIO';

const mockFiles = new Map<string, Uint8Array>();
const mockDirectories = new Set<string>();
const mockConverter = { execute: jest.fn(), getMediaInformation: jest.fn() };
const mockUri = (parts: (string | { uri: string })[]) => parts
  .map((part, index) => {
    const value = typeof part === 'string' ? part : part.uri;
    return index === 0 ? value.replace(/\/$/, '') : value.replace(/^\//, '');
  })
  .join('/');

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('expo-file-system', () => {
  class FakeDirectory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = mockUri(parts);
    }
    get exists() { return mockDirectories.has(this.uri); }
    create() { mockDirectories.add(this.uri); }
    delete() {
      for (const path of mockFiles.keys()) if (path.startsWith(`${this.uri}/`)) mockFiles.delete(path);
      mockDirectories.delete(this.uri);
    }
  }
  class FakeFile {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = mockUri(parts);
    }
    get exists() { return mockFiles.has(this.uri); }
    get size() { return mockFiles.get(this.uri)?.length ?? 0; }
    async copy(destination: FakeFile) {
      const bytes = mockFiles.get(this.uri);
      if (!bytes) throw new Error('Source missing');
      mockFiles.set(destination.uri, bytes.slice());
    }
    async digest() { return Array.from(mockFiles.get(this.uri) ?? []).join('-'); }
    delete() { mockFiles.delete(this.uri); }
  }
  return { Directory: FakeDirectory, File: FakeFile, Paths: { cache: 'file:///cache', document: 'file:///document' } };
});

const picked = (name: string, uri: string) => ({
  canceled: false as const,
  assets: [{ name, uri, mimeType: 'audio/*', size: mockFiles.get(uri)?.length ?? 0 }],
});

const track = (fileName: string, uri: string): Track => ({
  id: uri, uri, fileName, title: 'Song', artist: 'Artist', duration: 90,
  addedAt: 1, source: 'imported',
});

beforeEach(() => {
  mockFiles.clear();
  mockDirectories.clear();
  jest.clearAllMocks();
  (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
  (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);
  mockConverter.execute.mockImplementation(async (args: string[]) => {
    mockFiles.set(args[args.length - 1], new Uint8Array([73, 68, 51, 1, 2, 3]));
    return { success: true, cancelled: false };
  });
  mockConverter.getMediaInformation.mockResolvedValue({ streams: [{ codec_type: 'audio', codec_name: 'mp3' }] });
});

describe('QuickTransfer file operations', () => {
  test('imports an MP3 byte for byte without invoking conversion', async () => {
    const bytes = new Uint8Array([73, 68, 51, 4, 5, 6]);
    mockFiles.set('file:///picked/song.mp3', bytes);
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(picked('song.mp3', 'file:///picked/song.mp3'));

    const result = await importSongsAsMp3([]);

    expect(result.failures).toEqual([]);
    expect(result.imported).toHaveLength(1);
    expect(result.imported[0].fileName).toBe('song.mp3');
    expect(mockFiles.get(result.imported[0].uri)).toEqual(bytes);
    expect(mockConverter.execute).not.toHaveBeenCalled();
  });

  test('converts a FLAC input to a verified MP3 before adding the track', async () => {
    mockFiles.set('file:///picked/song.flac', new Uint8Array([1, 2, 3]));
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(picked('song.flac', 'file:///picked/song.flac'));

    const result = await importSongsAsMp3([], undefined, mockConverter);

    expect(result.imported).toHaveLength(1);
    expect(result.imported[0].fileName).toBe('song.mp3');
    expect(mockConverter.execute).toHaveBeenCalledWith(expect.arrayContaining(['-c:a', 'libmp3lame']));
    expect(mockConverter.getMediaInformation).toHaveBeenCalledWith(result.imported[0].uri);
    expect(mockFiles.has(result.imported[0].uri)).toBe(true);
  });

  test('does not add a partial file when conversion is interrupted', async () => {
    mockFiles.set('file:///picked/song.wav', new Uint8Array([1, 2, 3]));
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(picked('song.wav', 'file:///picked/song.wav'));
    mockConverter.execute.mockImplementation(async (args: string[]) => {
      mockFiles.set(args[args.length - 1], new Uint8Array([1]));
      return { success: false, cancelled: true };
    });

    const result = await importSongsAsMp3([], undefined, mockConverter);

    expect(result.imported).toEqual([]);
    expect(result.failures).toHaveLength(1);
    expect([...mockFiles.keys()].filter(path => path.startsWith('file:///document/music/'))).toEqual([]);
  });

  test('exports only a library song and opens sharing with an MP3', async () => {
    mockFiles.set('file:///music/song.wav', new Uint8Array([1, 2, 3]));

    const result = await downloadFile('song.wav', [track('song.wav', 'file:///music/song.wav')], undefined, mockConverter);

    expect(result.fileName).toBe('song.mp3');
    expect(result.bytes).toBeGreaterThan(0);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/song\.mp3$/), expect.objectContaining({ mimeType: 'audio/mpeg' }));
    expect([...mockFiles.keys()].filter(path => path.startsWith('file:///cache/quick-transfer/'))).toHaveLength(1);
  });

  test('rejects a private path before the share sheet or converter is called', async () => {
    await expect(downloadFile('../private.mp3', [track('song.mp3', 'file:///music/song.mp3')])).rejects.toMatchObject({ code: 'unsafe' });
    expect(Sharing.isAvailableAsync).not.toHaveBeenCalled();
    expect(mockConverter.execute).not.toHaveBeenCalled();
  });

  test('a deleted library song is not reported as transferred', async () => {
    await expect(downloadFile('song.mp3', [track('song.mp3', 'file:///music/deleted.mp3')]))
      .rejects.toMatchObject({ code: 'missing' });
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  test('rejects output that is not actually MP3 and removes the partial file', async () => {
    mockFiles.set('file:///picked/song.flac', new Uint8Array([1, 2, 3]));
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(picked('song.flac', 'file:///picked/song.flac'));
    mockConverter.getMediaInformation.mockResolvedValue({ streams: [{ codec_type: 'audio', codec_name: 'flac' }] });

    const result = await importSongsAsMp3([], undefined, mockConverter);

    expect(result.imported).toEqual([]);
    expect(result.failures[0]).toContain('not a valid MP3');
    expect([...mockFiles.keys()].filter(path => path.startsWith('file:///document/music/'))).toEqual([]);
  });

  test('a failed share leaves no cached MP3 and does not report success', async () => {
    mockFiles.set('file:///music/song.mp3', new Uint8Array([73, 68, 51, 1]));
    (Sharing.shareAsync as jest.Mock).mockRejectedValue(new Error('Share cancelled'));

    await expect(downloadFile('song.mp3', [track('song.mp3', 'file:///music/song.mp3')]))
      .rejects.toThrow('Share cancelled');
    expect([...mockFiles.keys()].filter(path => path.startsWith('file:///cache/quick-transfer/'))).toEqual([]);
  });
});
