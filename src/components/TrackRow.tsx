import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Track } from '../types';
import { colors, spacing } from '../theme';
import { formatTime } from '../lib/format';
import { usePlayer } from '../context/PlayerContext';
import { Artwork } from './Artwork';

type Props = {
  track: Track;
  onPress: () => void;
  onLongPress?: () => void;
  /** Show a number instead of artwork (used on artist pages). */
  number?: number;
};

export function TrackRow({ track, onPress, onLongPress, number }: Props) {
  const { current, isPlaying } = usePlayer();
  const active = current?.id === track.id;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {number != null ? (
        <View style={styles.number}>
          {active ? (
            <Ionicons name={isPlaying ? 'volume-high' : 'pause'} size={16} color={colors.accent} />
          ) : (
            <Text style={styles.numberText}>{number}</Text>
          )}
        </View>
      ) : (
        <Artwork seed={track.artist} label={track.title} size={48} />
      )}
      <View style={styles.text}>
        <Text style={[styles.title, active && { color: colors.accent }]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {track.artist}
          {track.duration > 0 ? `  ·  ${formatTime(track.duration)}` : ''}
        </Text>
      </View>
      {active && number == null && (
        <Ionicons name={isPlaying ? 'volume-high' : 'pause'} size={18} color={colors.accent} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  pressed: { backgroundColor: colors.surface },
  number: { width: 28, alignItems: 'center' },
  numberText: { color: colors.textDim, fontSize: 15, fontVariant: ['tabular-nums'] },
  text: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 16, fontWeight: '500' },
  sub: { color: colors.textDim, fontSize: 13, marginTop: 2 },
});
