/**
 * Pure playback-queue logic: decides what plays next. No audio or React
 * imports, so it can be unit tested.
 */
import type { RepeatMode, Track } from '../types';
import { shuffleArray } from './format';

export type Queue = { queue: Track[]; index: number };

/**
 * Builds the queue for "play these tracks starting at startIndex".
 * With shuffle on, the chosen song plays first and the rest are shuffled.
 * Shuffle with startIndex 0 (the "Shuffle" buttons) picks a random first song.
 */
export function buildQueue(
  tracks: Track[],
  startIndex: number,
  shuffle: boolean,
  random: () => number = Math.random,
): Queue {
  if (!tracks.length) return { queue: [], index: -1 };
  let start = shuffle && startIndex === 0 ? Math.floor(random() * tracks.length) : startIndex;
  start = Math.min(Math.max(start, 0), tracks.length - 1);

  if (!shuffle) return { queue: tracks, index: start };
  const rest = tracks.filter((_, i) => i !== start);
  return { queue: [tracks[start], ...shuffleArray(rest)], index: 0 };
}

export type NextAction =
  | { type: 'play'; index: number }
  | { type: 'restart' } // replay the current song (repeat one)
  | { type: 'stop'; index: number } // end of queue: load this song paused
  | { type: 'none' };

/**
 * What happens on "next". `fromFinish` is true when a song ended on its own,
 * false when the person tapped the next button.
 */
export function nextAction(index: number, length: number, repeat: RepeatMode, fromFinish: boolean): NextAction {
  if (length === 0) return { type: 'none' };
  if (fromFinish && repeat === 'one') return { type: 'restart' };
  if (index + 1 < length) return { type: 'play', index: index + 1 };
  if (repeat === 'all') return { type: 'play', index: 0 };
  if (fromFinish) return { type: 'stop', index: 0 };
  return { type: 'none' };
}

/**
 * What happens on "previous": past 3 seconds (or on the first song) it
 * restarts the current song, otherwise it goes back one.
 */
export function previousAction(index: number, positionSeconds: number): NextAction {
  if (positionSeconds > 3 || index <= 0) return { type: 'restart' };
  return { type: 'play', index: index - 1 };
}

/**
 * Turning shuffle on keeps the current song playing and shuffles the rest
 * after it. Turning it off restores the original order at the current song.
 * `shuffleOn` is whether shuffle is on *before* the toggle.
 */
export function toggleShuffleQueue(original: Track[], current: Track, shuffleOn: boolean): Queue {
  if (!shuffleOn) {
    const rest = original.filter(t => t.id !== current.id);
    return { queue: [current, ...shuffleArray(rest)], index: 0 };
  }
  const i = original.findIndex(t => t.id === current.id);
  return { queue: original, index: i >= 0 ? i : 0 };
}

export function nextRepeatMode(mode: RepeatMode): RepeatMode {
  return mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off';
}
