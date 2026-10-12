import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { fractionFromX, volumeIcon } from '../lib/controls';

type Props = {
  volume: number;
  muted: boolean;
  onChange: (volume: number) => void;
  onToggleMute: () => void;
};

/**
 * App volume: tap or drag the bar, tap the speaker to mute.
 * This sets the app's own level within the phone's volume.
 */
export function VolumeSlider({ volume, muted, onChange, onToggleMute }: Props) {
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const shown = muted ? 0 : volume;

  const update = (x: number) => onChange(fractionFromX(x, width));

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onToggleMute}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={muted ? 'Unmute' : 'Mute'}
      >
        <Ionicons name={volumeIcon(volume, muted)} size={20} color={colors.textDim} />
      </Pressable>

      <View
        style={styles.hit}
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={e => {
          setDragging(true);
          update(e.nativeEvent.locationX);
        }}
        onResponderMove={e => update(e.nativeEvent.locationX)}
        onResponderRelease={() => setDragging(false)}
        onResponderTerminate={() => setDragging(false)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Volume"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(shown * 100) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={e => {
          if (e.nativeEvent.actionName === 'increment') onChange(Math.min(1, shown + 0.1));
          if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(0, shown - 0.1));
        }}
      >
        <View style={styles.track} pointerEvents="none">
          <View style={[styles.fill, { width: `${shown * 100}%` }]} />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            dragging && styles.thumbActive,
            { left: shown * width - (dragging ? 8 : 6) },
          ]}
        />
      </View>

      <Ionicons name="volume-high" size={20} color={colors.textDim} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hit: { flex: 1, height: 32, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.text },
  thumb: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.text },
  thumbActive: { width: 16, height: 16, borderRadius: 8 },
});
