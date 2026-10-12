import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { formatTime } from '../lib/format';

type Props = {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
};

/** Tap or drag anywhere on the bar to scrub. */
export function ProgressBar({ position, duration, onSeek }: Props) {
  const [width, setWidth] = useState(1);
  const [scrub, setScrub] = useState<number | null>(null);

  const fraction = scrub ?? (duration > 0 ? Math.min(1, position / duration) : 0);
  const toFraction = (x: number) => Math.min(1, Math.max(0, x / width));

  return (
    <View>
      <View
        style={styles.hit}
        onLayout={e => setWidth(e.nativeEvent.layout.width || 1)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={e => setScrub(toFraction(e.nativeEvent.locationX))}
        onResponderMove={e => setScrub(toFraction(e.nativeEvent.locationX))}
        onResponderRelease={() => {
          if (scrub != null && duration > 0) onSeek(scrub * duration);
          setScrub(null);
        }}
      >
        <View style={styles.track} pointerEvents="none">
          <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
        </View>
        <View
          pointerEvents="none"
          style={[styles.thumb, scrub != null && styles.thumbActive, { left: fraction * width - (scrub != null ? 8 : 6) }]}
        />
      </View>
      <View style={styles.times} pointerEvents="none">
        <Text style={styles.time}>{formatTime(fraction * duration)}</Text>
        <Text style={styles.time}>-{formatTime(Math.max(0, duration - fraction * duration))}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 28, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.text },
  thumb: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.text },
  thumbActive: { width: 16, height: 16, borderRadius: 8 },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  time: { color: colors.textDim, fontSize: 12, fontVariant: ['tabular-nums'] },
});
