import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { RepeatMode, Track } from '../types';
import { buildQueue, nextAction, nextRepeatMode, previousAction, toggleShuffleQueue, type NextAction } from '../lib/queue';
import { clampVolume, seekBy } from '../lib/controls';
import { useLibrary } from './LibraryContext';

type PlayerContextValue = {
  current: Track | null;
  queue: Track[];
  index: number;
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  error: string | null;
  /** App volume from 0 (silent) to 1 (full), within the phone's own volume. */
  volume: number;
  muted: boolean;
  /** Start playing a list, beginning at `startIndex` (or a random song if shuffling). */
  playTracks: (tracks: Track[], startIndex?: number, opts?: { shuffle?: boolean }) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  /** Jump forward (positive) or back (negative) by this many seconds. */
  skipBy: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  jumpTo: (queueIndex: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

/**
 * Asks the phone for a music-app audio session (keeps playing in the
 * background, pauses other apps' audio). iOS can refuse this, for example in
 * Expo Go or while another app holds the audio, and the refusal can be thrown
 * straight away rather than as a rejected promise, so everything is awaited
 * inside try/catch. On refusal we fall back to a basic session that still
 * plays. Returns true if the full session was granted.
 */
async function configureAudioSession(): Promise<boolean> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
    return true;
  } catch (e) {
    console.warn('Full audio session unavailable, using basic playback', e);
    try {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    } catch {}
    return false;
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { markPlayed, setDuration } = useLibrary();
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);

  // Refs so callbacks always see the latest values.
  const queueRef = useRef(queue);
  const indexRef = useRef(index);
  const repeatRef = useRef(repeat);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);
  queueRef.current = queue;
  volumeRef.current = volume;
  mutedRef.current = muted;
  indexRef.current = index;
  repeatRef.current = repeat;

  const current = index >= 0 ? queue[index] ?? null : null;

  /** Starts playback without letting an iOS audio-session refusal crash the app. */
  const startPlayback = useCallback(() => {
    try {
      player.play();
      setPlayError(null);
    } catch (e: any) {
      console.warn('Could not start playback', e);
      setPlayError('The phone wouldn’t let audio start. Close other apps playing sound, then tap play again.');
    }
  }, [player]);

  // Whether the full (background, lock screen) audio session is active.
  const fullSessionRef = useRef(false);

  useEffect(() => {
    configureAudioSession().then(ok => {
      fullSessionRef.current = ok;
    });
  }, []);

  const load = useCallback(
  async (track: Track, autoplay = true) => {
    const ok = await configureAudioSession();
    fullSessionRef.current = ok;

    player.replace({ uri: track.uri, name: track.title });
    player.volume = volumeRef.current;
    player.muted = mutedRef.current;

    try {
      player.setActiveForLockScreen(true, {
        title: track.title,
        artist: track.artist,
      });
    } catch (e) {
      console.warn('Lock screen controls unavailable', e);
    }

    markPlayed(track.id);

    if (autoplay) {
      startPlayback();
    }
  },
  [player, markPlayed, startPlayback],
);

  const playTracks = useCallback<PlayerContextValue['playTracks']>(
    (tracks, startIndex = 0, opts) => {
      if (!tracks.length) return;
      const wantShuffle = opts?.shuffle ?? false;
      const { queue: q, index: i } = buildQueue(tracks, startIndex, wantShuffle);
      setOriginalQueue(tracks);
      setQueue(q);
      setIndex(i);
      setShuffle(wantShuffle);
      load(q[i]);
    },
    [load],
  );

  const goTo = useCallback(
    (i: number, autoplay = true) => {
      const q = queueRef.current;
      if (i < 0 || i >= q.length) return;
      setIndex(i);
      load(q[i], autoplay);
    },
    [load],
  );

  const perform = useCallback(
    (action: NextAction) => {
      if (action.type === 'restart') {
        player.seekTo(0);
        startPlayback();
      } else if (action.type === 'play') {
        goTo(action.index);
      } else if (action.type === 'stop') {
        // End of the queue: load the first song paused, ready to play again.
        goTo(action.index, false);
      }
    },
    [goTo, player, startPlayback],
  );

  const advance = useCallback(
    (fromFinish: boolean) =>
      perform(nextAction(indexRef.current, queueRef.current.length, repeatRef.current, fromFinish)),
    [perform],
  );

  // Move to the next song when one finishes.
  useEffect(() => {
    if (status.didJustFinish) advance(true);
  }, [status.didJustFinish, advance]);

  // Remember durations we learn while playing (imported files start at 0).
  useEffect(() => {
    if (current && status.duration > 0 && Math.abs(current.duration - status.duration) > 1) {
      setDuration(current.id, status.duration);
    }
  }, [current, status.duration, setDuration]);


  const previous = useCallback(() => {
    const action = previousAction(indexRef.current, status.currentTime);
    // "Previous" restarts the song in place rather than forcing playback.
    if (action.type === 'restart') player.seekTo(0);
    else perform(action);
  }, [perform, player, status.currentTime]);

  const play = useCallback(() => {
    if (!current) return;
    if (status.duration > 0 && status.currentTime >= status.duration - 0.5) player.seekTo(0);
    startPlayback();
  }, [current, player, startPlayback, status.currentTime, status.duration]);

  const pause = useCallback(() => player.pause(), [player]);

  const seek = useCallback((seconds: number) => player.seekTo(Math.max(0, seconds)), [player]);

  const skipBy = useCallback(
    (seconds: number) => {
      if (!current) return;
      player.seekTo(seekBy(status.currentTime, seconds, status.duration));
    },
    [current, player, status.currentTime, status.duration],
  );

  const setVolume = useCallback(
    (value: number) => {
      const v = clampVolume(value);
      setVolumeState(v);
      player.volume = v;
      // Dragging the volume up un-mutes, like most music apps.
      if (v > 0 && mutedRef.current) {
        setMuted(false);
        player.muted = false;
      }
    },
    [player],
  );

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    setMuted(next);
    player.muted = next;
    // Un-muting at zero volume would still be silent, so bring it back up.
    if (!next && volumeRef.current === 0) {
      setVolumeState(0.5);
      player.volume = 0.5;
    }
  }, [player]);

  const toggleShuffle = useCallback(() => {
    const cur = queueRef.current[indexRef.current];
    if (!cur) {
      setShuffle(s => !s);
      return;
    }
    const next = toggleShuffleQueue(originalQueue, cur, shuffle);
    setQueue(next.queue);
    setIndex(next.index);
    setShuffle(!shuffle);
  }, [shuffle, originalQueue]);

  const togglePlay = useCallback(() => {
    if (status.playing) pause();
    else play();
  }, [status.playing, play, pause]);

  const cycleRepeat = useCallback(() => {
    setRepeat(nextRepeatMode);
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      current,
      queue,
      index,
      isPlaying: status.playing,
      isBuffering: status.isBuffering,
      position: status.currentTime,
      duration: status.duration || current?.duration || 0,
      shuffle,
      repeat,
      error: playError ?? (status.error ? `Couldn’t play this file: ${status.error}` : null),
      volume,
      muted,
      playTracks,
      togglePlay,
      play,
      pause,
      next: () => advance(false),
      previous,
      seek,
      skipBy,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      jumpTo: (i: number) => goTo(i),
    }),
    [current, queue, index, status, playError, shuffle, repeat, volume, muted, playTracks, togglePlay, play, pause, advance, previous, seek, skipBy, setVolume, toggleMute, toggleShuffle, cycleRepeat, goTo],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
