import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePlayer } from '../context/PlayerContext';
import { Artwork, paletteFor } from '../components/Artwork';
import { ProgressBar } from '../components/ProgressBar';
import { VolumeSlider } from '../components/VolumeSlider';
import { SKIP_SECONDS } from '../lib/controls';
import { colors, spacing } from '../theme';

export default function NowPlayingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const p = usePlayer();
  const track = p.current;

  if (!track) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <Text style={styles.dim}>Nothing playing</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>Close</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const [top] = paletteFor(track.artist);
  const artSize = Math.min(width - spacing.xl * 2, 420);
  const upNext = p.queue.slice(p.index + 1, p.index + 6);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[top + 'CC', colors.bg]} locations={[0, 0.7]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close player">
            <Ionicons name="chevron-down" size={30} color={colors.text} />
          </Pressable>
          <Text style={styles.topLabel}>Now playing</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.artShadow}>
            <Artwork seed={track.artist} label={track.title} size={artSize} radius={12} />
          </View>

          <View style={[styles.meta, { width: artSize }]}>
            <Text style={styles.title} numberOfLines={2}>
              {track.title}
            </Text>
            <Pressable
              onPress={() => router.replace({ pathname: '/artist/[name]', params: { name: track.artist } })}
            >
              <Text style={styles.artist} numberOfLines={1}>
                {track.artist}
              </Text>
            </Pressable>
          </View>

          <View style={{ width: artSize, marginTop: spacing.lg }}>
            <ProgressBar position={p.position} duration={p.duration} onSeek={p.seek} />
          </View>

          <View style={[styles.controls, { width: artSize }]}>
            <Pressable onPress={p.toggleShuffle} hitSlop={10} accessibilityLabel="Shuffle">
              <Ionicons name="shuffle" size={24} color={p.shuffle ? colors.accent : colors.textDim} />
            </Pressable>
            <Pressable onPress={p.previous} hitSlop={10} accessibilityLabel="Previous">
              <Ionicons name="play-skip-back" size={34} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={p.togglePlay}
              style={({ pressed }) => [styles.playBtn, pressed && { transform: [{ scale: 0.95 }] }]}
              accessibilityLabel={p.isPlaying ? 'Pause' : 'Play'}
            >
              <Ionicons
                name={p.isPlaying ? 'pause' : 'play'}
                size={36}
                color={colors.bg}
                style={p.isPlaying ? undefined : { marginLeft: 4 }}
              />
            </Pressable>
            <Pressable onPress={p.next} hitSlop={10} accessibilityLabel="Next">
              <Ionicons name="play-skip-forward" size={34} color={colors.text} />
            </Pressable>
            <Pressable onPress={p.cycleRepeat} hitSlop={10} accessibilityLabel={`Repeat ${p.repeat}`}>
              <View>
                <Ionicons name="repeat" size={24} color={p.repeat === 'off' ? colors.textDim : colors.accent} />
                {p.repeat === 'one' && <Text style={styles.repeatOne}>1</Text>}
              </View>
            </Pressable>
          </View>

          <View style={[styles.skipRow, { width: artSize }]}>
            <SkipButton direction="back" onPress={() => p.skipBy(-SKIP_SECONDS)} />
            <SkipButton direction="forward" onPress={() => p.skipBy(SKIP_SECONDS)} />
          </View>

          <View style={{ width: artSize, marginTop: spacing.md }}>
            <VolumeSlider
              volume={p.volume}
              muted={p.muted}
              onChange={p.setVolume}
              onToggleMute={p.toggleMute}
            />
          </View>

          {p.error && <Text style={styles.error}>{p.error}</Text>}

          {upNext.length > 0 && (
            <View style={[styles.upNext, { width: artSize }]}>
              <Text style={styles.upNextHeading}>Up next</Text>
              {upNext.map((t, i) => (
                <Pressable
                  key={t.id + i}
                  onPress={() => p.jumpTo(p.index + 1 + i)}
                  style={({ pressed }) => [styles.upNextRow, pressed && { opacity: 0.6 }]}
                >
                  <Artwork seed={t.artist} label={t.title} size={40} radius={6} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.upNextTitle} numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text style={styles.upNextArtist} numberOfLines={1}>
                      {t.artist}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SkipButton({ direction, onPress }: { direction: 'back' | 'forward'; onPress: () => void }) {
  const back = direction === 'back';
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.skip, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={`${back ? 'Back' : 'Forward'} ${SKIP_SECONDS} seconds`}
    >
      {back && <Ionicons name="play-back" size={16} color={colors.text} />}
      <Text style={styles.skipText}>{SKIP_SECONDS}s</Text>
      {!back && <Ionicons name="play-forward" size={16} color={colors.text} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  dim: { color: colors.textDim },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  body: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  artShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
    borderRadius: 12,
  },
  meta: { marginTop: spacing.xl },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  artist: { color: colors.textDim, fontSize: 17, marginTop: spacing.xs },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOne: {
    position: 'absolute',
    right: -6,
    top: -6,
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  skipRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  skip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skipText: { color: colors.text, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  error: { color: '#FF8A8A', marginTop: spacing.lg, paddingHorizontal: spacing.xl, textAlign: 'center' },
  upNext: { marginTop: spacing.xxl },
  upNextHeading: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  upNextRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  upNextTitle: { color: colors.text, fontSize: 15, fontWeight: '500' },
  upNextArtist: { color: colors.textDim, fontSize: 13, marginTop: 1 },
});
