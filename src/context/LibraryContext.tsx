
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { deleteImportedFile, importFromFiles, scanDevice } from '../lib/scanner';
import { loadSavedState, saveState } from '../lib/storage';
import { recommendTracks, type Recommendation } from '../lib/recommendations';
import {
  addRecent,
  groupArtists,
  mergeScan,
  recentlyAdded,
  resolveRecent,
  type Artist,
} from '../lib/tracks';
import type { Playlist, PlaylistCategory, Track } from '../types';

// Playlist Organizer imports
import {
  addSongToPlaylist,
  getPlaylistTracks,
  createPlaylist as makePlaylist,
  removeSongFromPlaylist,
  renamePlaylist,
} from '../lib/playlists';

export type { Artist };

type LibraryContextValue = {
  tracks: Track[];
  artists: Artist[];
  recentlyAdded: Track[];
  recentlyPlayed: Track[];
  recommendations: Recommendation[];
  ready: boolean;
  scanning: boolean;
  /** Human-readable message from the last scan, if something went wrong. */
  notice: string | null;
  canScan: boolean;
  scan: () => Promise<void>;
  importFiles: () => Promise<void>;
  removeTrack: (id: string) => void;
  markPlayed: (id: string) => void;
  setDuration: (id: string, seconds: number) => void;

  // Playlist Organizer
  playlists: Playlist[];
  createNewPlaylist: (
    name: string,
    category: PlaylistCategory
  ) => void;
  deletePlaylist: (id: string) => void;
  renameExistingPlaylist: (
    id: string,
    name: string
  ) => void;
  addTrackToPlaylist: (
    playlistId: string,
    trackId: string
  ) => void;
  removeTrackFromPlaylist: (
    playlistId: string,
    trackId: string
  ) => void;
  getTracksForPlaylist: (playlistId: string) => Track[];
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const loaded = useRef(false);

  // Playlist Organizer state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Load what we saved last time, then quietly rescan on Android so new
  // downloads show up without the person having to do anything.
  useEffect(() => {
    (async () => {
      const saved = await loadSavedState();
      if (saved) {
        setTracks(saved.tracks);
        setRecentIds(saved.recentIds);
        setPlaylists(saved.playlists);
      }
      loaded.current = true;
      setReady(true);
      if (Platform.OS === 'android' && saved?.tracks.some(t => t.source === 'device')) {
        runScan(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save whenever the library or playlists change.
  useEffect(() => {
    if (loaded.current) saveState({ tracks, recentIds, playlists });
  }, [tracks, recentIds, playlists]);

  const runScan = useCallback(async (showNotice: boolean) => {
    setScanning(true);
    if (showNotice) setNotice(null);
    const result = await scanDevice();
    setScanning(false);

    if (!result.ok) {
      if (!showNotice) return;
      if (result.reason === 'permission') {
        setNotice('Allow access to music and audio in Settings so I can find your songs.');
      } else if (result.reason === 'unsupported') {
        setNotice('iPhone doesn’t let apps scan for files. Tap “Add from Files” to pick your music.');
      } else {
        setNotice(`Scan failed: ${result.message ?? 'unknown error'}`);
      }
      return;
    }

    setTracks(prev => mergeScan(prev, result.tracks));
    if (showNotice && result.tracks.length === 0) {
      setNotice('No audio files found on this phone yet.');
    }
  }, []);

  const scan = useCallback(() => runScan(true), [runScan]);

  const importFiles = useCallback(async () => {
    setNotice(null);
    const added = await importFromFiles();
    if (added.length) setTracks(prev => [...prev, ...added]);
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks(prev => {
      const t = prev.find(x => x.id === id);
      if (t) deleteImportedFile(t);
      return prev.filter(x => x.id !== id);
    });
    setRecentIds(prev => prev.filter(x => x !== id));
  }, []);

  const markPlayed = useCallback((id: string) => {
    setRecentIds(prev => addRecent(prev, id));
  }, []);

  const setDuration = useCallback((id: string, seconds: number) => {
    setTracks(prev =>
      prev.map(t => (t.id === id && Math.abs(t.duration - seconds) > 1 ? { ...t, duration: seconds } : t)),
    );
  }, []);

  const recommendations = useMemo(() => recommendTracks(tracks, recentIds), [tracks, recentIds]);

  // Create a new playlist
  const createNewPlaylist = useCallback((
    name: string,
    category: PlaylistCategory
  ) => {
    const playlist = makePlaylist(name, category);
    setPlaylists(prev => [...prev, playlist]);
  }, []);

  // Delete a playlist without deleting songs from the library
  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  // Rename an existing playlist
  const renameExistingPlaylist = useCallback((
    id: string,
    name: string
  ) => {
    setPlaylists(prev =>
      prev.map(p =>
        p.id === id ? renamePlaylist(p, name) : p
      )
    );
  }, []);

  // Add a song from the existing EchoVault library
  const addTrackToPlaylist = useCallback((
    playlistId: string,
    trackId: string
  ) => {
    if (!tracks.some(t => t.id === trackId)) return;

    setPlaylists(prev =>
      prev.map(p =>
        p.id === playlistId
          ? addSongToPlaylist(p, trackId)
          : p
      )
    );
  }, [tracks]);

  // Remove a song from a playlist, but keep the audio file
  const removeTrackFromPlaylist = useCallback((
    playlistId: string,
    trackId: string
  ) => {
    setPlaylists(prev =>
      prev.map(p =>
        p.id === playlistId
          ? removeSongFromPlaylist(p, trackId)
          : p
      )
    );
  }, []);

  // Get the actual songs belonging to a playlist
  const getTracksForPlaylist = useCallback((
    playlistId: string
  ): Track[] => {
    const playlist = playlists.find(
      p => p.id === playlistId
    );

    if (!playlist) return [];

    return getPlaylistTracks(playlist, tracks);
  }, [playlists, tracks]);

  const value = useMemo<LibraryContextValue>(() => {
    return {
      tracks,
      artists: groupArtists(tracks),
      recentlyAdded: recentlyAdded(tracks),
      recentlyPlayed: resolveRecent(recentIds, tracks),
      recommendations,
      ready,
      scanning,
      notice,
      canScan: Platform.OS === 'android',
      scan,
      importFiles,
      removeTrack,
      markPlayed,
      setDuration,

      // Playlist Organizer
      playlists,
      createNewPlaylist,
      deletePlaylist,
      renameExistingPlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      getTracksForPlaylist,
    };
  }, [
    tracks,
    recentIds,
    recommendations,
    ready,
    scanning,
    notice,
    scan,
    importFiles,
    removeTrack,
    markPlayed,
    setDuration,
    playlists,
    createNewPlaylist,
    deletePlaylist,
    renameExistingPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    getTracksForPlaylist,
  ]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider');
  return ctx;
}
