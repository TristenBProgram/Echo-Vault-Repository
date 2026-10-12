import { clampVolume, fractionFromX, seekBy, SKIP_SECONDS, volumeIcon } from '../controls';

describe('clampVolume', () => {
  it('keeps values between 0 and 1 unchanged', () => {
    expect(clampVolume(0)).toBe(0);
    expect(clampVolume(0.42)).toBe(0.42);
    expect(clampVolume(1)).toBe(1);
  });

  it('limits values outside the range', () => {
    expect(clampVolume(-0.5)).toBe(0);
    expect(clampVolume(1.7)).toBe(1);
  });

  it('treats bad input as full volume', () => {
    expect(clampVolume(NaN)).toBe(1);
    expect(clampVolume(Infinity)).toBe(1);
  });
});

describe('seekBy', () => {
  it('skips forward and back', () => {
    expect(seekBy(60, SKIP_SECONDS, 200)).toBe(75);
    expect(seekBy(60, -SKIP_SECONDS, 200)).toBe(45);
  });

  it('never goes before the start', () => {
    expect(seekBy(5, -SKIP_SECONDS, 200)).toBe(0);
  });

  it('stops just short of the end instead of finishing the song', () => {
    expect(seekBy(195, SKIP_SECONDS, 200)).toBe(199.5);
  });

  it('has no upper limit when the length is unknown', () => {
    expect(seekBy(500, SKIP_SECONDS, 0)).toBe(515);
  });

  it('treats a bad position as the start', () => {
    expect(seekBy(NaN, SKIP_SECONDS, 200)).toBe(15);
  });

  it('handles very short songs', () => {
    expect(seekBy(0, SKIP_SECONDS, 0.3)).toBe(0);
  });
});

describe('fractionFromX', () => {
  it('converts a finger position into a fraction of the width', () => {
    expect(fractionFromX(0, 200)).toBe(0);
    expect(fractionFromX(50, 200)).toBe(0.25);
    expect(fractionFromX(200, 200)).toBe(1);
  });

  it('clamps drags past either end', () => {
    expect(fractionFromX(-30, 200)).toBe(0);
    expect(fractionFromX(260, 200)).toBe(1);
  });

  it('returns 0 before the slider has been measured', () => {
    expect(fractionFromX(50, 0)).toBe(0);
    expect(fractionFromX(50, NaN)).toBe(0);
  });
});

describe('volumeIcon', () => {
  it('shows mute when muted or silent', () => {
    expect(volumeIcon(0.8, true)).toBe('volume-mute');
    expect(volumeIcon(0, false)).toBe('volume-mute');
  });

  it('matches the level', () => {
    expect(volumeIcon(0.2, false)).toBe('volume-low');
    expect(volumeIcon(0.5, false)).toBe('volume-medium');
    expect(volumeIcon(0.9, false)).toBe('volume-high');
  });
});
