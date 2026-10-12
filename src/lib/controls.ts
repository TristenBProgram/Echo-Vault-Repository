/**
 * Pure playback-control math: volume, seeking and slider positions.
 * No audio or React imports, so it can be unit tested.
 */

/** How far the skip back / skip forward buttons jump. */
export const SKIP_SECONDS = 15;

/** Keeps a volume between 0 (silent) and 1 (full). Bad input becomes full volume. */
export function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 1;
  return Math.min(1, Math.max(0, volume));
}

/**
 * Where to land after jumping `delta` seconds (negative = back).
 * Never goes before the start, and stops just short of the end so a skip
 * forward doesn't instantly finish the song. Unknown duration = no upper limit.
 */
export function seekBy(position: number, delta: number, duration: number): number {
  const target = (Number.isFinite(position) ? position : 0) + delta;
  const max = duration > 0 ? Math.max(0, duration - 0.5) : Number.POSITIVE_INFINITY;
  return Math.min(max, Math.max(0, target));
}

/** Converts a finger position on a slider into a 0–1 fraction. */
export function fractionFromX(x: number, width: number): number {
  if (!(width > 0) || !Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x / width));
}

export type VolumeIconName = 'volume-mute' | 'volume-low' | 'volume-medium' | 'volume-high';

/** Speaker icon that matches the current volume. */
export function volumeIcon(volume: number, muted: boolean): VolumeIconName {
  if (muted || volume <= 0) return 'volume-mute';
  if (volume < 0.34) return 'volume-low';
  if (volume < 0.67) return 'volume-medium';
  return 'volume-high';
}
