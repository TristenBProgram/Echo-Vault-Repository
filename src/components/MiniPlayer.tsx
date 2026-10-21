import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../theme';
import { usePlayer } from '../context/PlayerContext';
import { Artwork } from './Artwork';

/** The "now playing" bar that sits above the tabs. Tap it to open the full player. */
export function MiniPlayer() {
  const router = useRouter();
  const { current, isPlaying, position, duration, togglePlay, next } = usePlayer();
  if (!current) return null;

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.card} onPress={() => router.push('/player')}>
        <Artwork seed={current.artist} label={current.title} size={40} radius={6} />
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {current.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {current.artist}
          </Text>
        </View>
        <Pressable onPress={togglePlay} hitSlop={10} style={styles.btn} accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color={colors.text} />
        </Pressable>
        <Pressable onPress={next} hitSlop={10} style={styles.btn} accessibilityLabel="Next song">
          <Ionicons name="play-skip-forward" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xs, backgroundColor: colors.bg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 10,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  text: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 14, fontWeight: '600' },
  artist: { color: colors.textDim, fontSize: 12, marginTop: 1 },
  btn: { padding: 4 },
  track: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  fill: { height: 2, backgroundColor: colors.text },
});
