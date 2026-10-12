import { buildQueue, nextAction, nextRepeatMode, previousAction, toggleShuffleQueue } from '../queue';
import { ids, makeTracks } from '../testUtils';

describe('buildQueue', () => {
  const tracks = makeTracks(5);

  it('plays in order from the tapped song', () => {
    const { queue, index } = buildQueue(tracks, 2, false);
    expect(queue).toBe(tracks);
    expect(index).toBe(2);
  });

  it('with shuffle, plays the tapped song first and shuffles the rest', () => {
    const { queue, index } = buildQueue(tracks, 3, true);
    expect(index).toBe(0);
    expect(queue[0].id).toBe('t3');
    expect([...ids(queue)].sort()).toEqual(['t0', 't1', 't2', 't3', 't4']);
  });

  it('the Shuffle button (start 0) picks a random first song', () => {
    const { queue } = buildQueue(tracks, 0, true, () => 0.99);
    expect(queue[0].id).toBe('t4');
    const again = buildQueue(tracks, 0, true, () => 0.5);
    expect(again.queue[0].id).toBe('t2');
  });

  it('clamps a start index that is out of range', () => {
    expect(buildQueue(tracks, 99, false).index).toBe(4);
    expect(buildQueue(tracks, -3, false).index).toBe(0);
  });

  it('returns an empty queue for no tracks', () => {
    expect(buildQueue([], 0, true)).toEqual({ queue: [], index: -1 });
  });
});

describe('nextAction', () => {
  it('moves to the next song', () => {
    expect(nextAction(1, 5, 'off', false)).toEqual({ type: 'play', index: 2 });
    expect(nextAction(1, 5, 'off', true)).toEqual({ type: 'play', index: 2 });
  });

  it('repeat one replays the song when it finishes', () => {
    expect(nextAction(2, 5, 'one', true)).toEqual({ type: 'restart' });
  });

  it('repeat one still lets the next button skip ahead', () => {
    expect(nextAction(2, 5, 'one', false)).toEqual({ type: 'play', index: 3 });
  });

  it('repeat all wraps to the first song at the end', () => {
    expect(nextAction(4, 5, 'all', true)).toEqual({ type: 'play', index: 0 });
    expect(nextAction(4, 5, 'all', false)).toEqual({ type: 'play', index: 0 });
  });

  it('stops on the first song when the queue finishes with repeat off', () => {
    expect(nextAction(4, 5, 'off', true)).toEqual({ type: 'stop', index: 0 });
  });

  it('ignores the next button on the last song with repeat off', () => {
    expect(nextAction(4, 5, 'off', false)).toEqual({ type: 'none' });
  });

  it('does nothing with an empty queue', () => {
    expect(nextAction(-1, 0, 'all', true)).toEqual({ type: 'none' });
  });
});

describe('previousAction', () => {
  it('goes back one song near the start of a song', () => {
    expect(previousAction(3, 1.5)).toEqual({ type: 'play', index: 2 });
  });

  it('restarts the current song after 3 seconds', () => {
    expect(previousAction(3, 3.1)).toEqual({ type: 'restart' });
  });

  it('restarts on the first song', () => {
    expect(previousAction(0, 0)).toEqual({ type: 'restart' });
  });
});

describe('toggleShuffleQueue', () => {
  const original = makeTracks(6);

  it('turning shuffle on keeps the current song playing first', () => {
    const { queue, index } = toggleShuffleQueue(original, original[3], false);
    expect(index).toBe(0);
    expect(queue[0].id).toBe('t3');
    expect(queue).toHaveLength(6);
    expect([...ids(queue)].sort()).toEqual(ids(original));
  });

  it('turning shuffle off restores the original order at the current song', () => {
    const { queue, index } = toggleShuffleQueue(original, original[4], true);
    expect(queue).toBe(original);
    expect(index).toBe(4);
  });

  it('falls back to the first song if the current one is not in the original list', () => {
    const stranger = makeTracks(1)[0];
    expect(toggleShuffleQueue(makeTracks(3).slice(1), stranger, true).index).toBe(0);
  });
});

describe('nextRepeatMode', () => {
  it('cycles off → all → one → off', () => {
    expect(nextRepeatMode('off')).toBe('all');
    expect(nextRepeatMode('all')).toBe('one');
    expect(nextRepeatMode('one')).toBe('off');
  });
});
