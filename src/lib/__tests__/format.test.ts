import { formatTime, greeting, hashString, parseFilename, shuffleArray } from '../format';

describe('formatTime', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(185.9)).toBe('3:05');
  });

  it('keeps counting minutes past an hour', () => {
    expect(formatTime(3725)).toBe('62:05');
  });

  it('treats bad input as zero', () => {
    expect(formatTime(-10)).toBe('0:00');
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
  });
});

describe('parseFilename', () => {
  it('splits "Artist - Title"', () => {
    expect(parseFilename('Daft Punk - One More Time.mp3')).toEqual({
      artist: 'Daft Punk',
      title: 'One More Time',
    });
  });

  it('keeps extra dashes in the title', () => {
    expect(parseFilename('Artist - Song - Live Version.m4a')).toEqual({
      artist: 'Artist',
      title: 'Song - Live Version',
    });
  });

  it('turns underscores into spaces', () => {
    expect(parseFilename('some_artist_-_some_song.mp3')).toEqual({
      artist: 'some artist',
      title: 'some song',
    });
  });

  it('strips leading track numbers', () => {
    expect(parseFilename('01. Intro.mp3')).toEqual({ artist: 'Unknown Artist', title: 'Intro' });
    expect(parseFilename('07 - Artist - Title.flac')).toEqual({ artist: 'Artist', title: 'Title' });
  });

  it('does not strip numbers that are part of a name', () => {
    expect(parseFilename('50 Cent - In Da Club.mp3')).toEqual({ artist: '50 Cent', title: 'In Da Club' });
    expect(parseFilename('1999.mp3')).toEqual({ artist: 'Unknown Artist', title: '1999' });
  });

  it('falls back to Unknown Artist when there is no dash', () => {
    expect(parseFilename('voice memo.m4a')).toEqual({ artist: 'Unknown Artist', title: 'voice memo' });
  });

  it('does not split on hyphens inside words', () => {
    expect(parseFilename('Jay-Z.mp3')).toEqual({ artist: 'Unknown Artist', title: 'Jay-Z' });
  });

  it('collapses repeated spaces', () => {
    expect(parseFilename('Artist   -   Title.mp3')).toEqual({ artist: 'Artist', title: 'Title' });
  });
});

describe('hashString', () => {
  it('is stable for the same input', () => {
    expect(hashString('Radiohead')).toBe(hashString('Radiohead'));
  });

  it('is never negative', () => {
    for (const s of ['', 'a', 'Radiohead', 'x'.repeat(500), '🎵 emoji']) {
      expect(hashString(s)).toBeGreaterThanOrEqual(0);
    }
  });

  it('usually differs for different input', () => {
    expect(hashString('Artist A')).not.toBe(hashString('Artist B'));
  });
});

describe('shuffleArray', () => {
  it('keeps every item exactly once', () => {
    const input = Array.from({ length: 50 }, (_, i) => i);
    const out = shuffleArray(input);
    expect(out).toHaveLength(50);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('does not change the original array', () => {
    const input = [1, 2, 3, 4, 5];
    shuffleArray(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles empty and single-item arrays', () => {
    expect(shuffleArray([])).toEqual([]);
    expect(shuffleArray(['only'])).toEqual(['only']);
  });
});

describe('greeting', () => {
  const at = (hour: number) => greeting(new Date(2026, 0, 1, hour));

  it('matches the time of day', () => {
    expect(at(3)).toBe('Up late');
    expect(at(8)).toBe('Good morning');
    expect(at(14)).toBe('G-ood Afternoon');
    expect(at(20)).toBe('Good evening');
  });

  it('switches at the boundaries', () => {
    expect(at(5)).toBe('Good morning');
    expect(at(12)).toBe('G-ood Afternoon');
    expect(at(18)).toBe('Good evening');
  });
});
