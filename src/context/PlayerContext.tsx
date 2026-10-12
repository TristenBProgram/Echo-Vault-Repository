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
  /** Start playing a list, beginning at `startIndex` (or a random song if shuffling). */
  playTracks: (tracks: Track[], startIndex?: number, opts?: { shuffle?: boolean }) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  jumpTo: (queueIndex: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { markPlayed, setDuration } = useLibrary();
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');

  // Refs so callbacks always see the latest values.
  const queueRef = useRef(queue);
  const indexRef = useRef(index);
  const repeatRef = useRef(repeat);
  queueRef.current = queue;
  indexRef.current = index;
  repeatRef.current = repeat;

  const current = index >= 0 ? queue[index] ?? null : null;

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

  const load = useCallback(
    (track: Track, autoplay = true) => {
      player.replace({ uri: track.uri, name: track.title });
      if (autoplay) player.play();
      try {
        // Lock screen / notification controls. Needs a development build
        // to show up; harmless in Expo Go.
        player.setActiveForLockScreen(true, { title: track.title, artist: track.artist });
      } catch {}
      markPlayed(track.id);
    },
    [player, markPlayed],
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
        player.play();
      } else if (action.type === 'play') {
        goTo(action.index);
      } else if (action.type === 'stop') {
        // End of the queue: load the first song paused, ready to play again.
        goTo(action.index, false);
      }
    },
    [goTo, player],
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

  const togglePlay = useCallback(() => {
    if (!current) return;
    if (status.playing) {
      player.pause();
    } else {
      if (status.duration > 0 && status.currentTime >= status.duration - 0.5) player.seekTo(0);
      player.play();
    }
  }, [current, player, status.playing, status.currentTime, status.duration]);

  const previous = useCallback(() => {
    const action = previousAction(indexRef.current, status.currentTime);
    // "Previous" restarts the song in place rather than forcing playback.
    if (action.type === 'restart') player.seekTo(0);
    else perform(action);
  }, [perform, player, status.currentTime]);

  const seek = useCallback((seconds: number) => player.seekTo(Math.max(0, seconds)), [player]);

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
      error: status.error ?? null,
      playTracks,
      togglePlay,
      next: () => advance(false),
      previous,
      seek,
      toggleShuffle,
      cycleRepeat,
      jumpTo: (i: number) => goTo(i),
    }),
    [current, queue, index, status, shuffle, repeat, playTracks, togglePlay, advance, previous, seek, toggleShuffle, cycleRepeat, goTo],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
