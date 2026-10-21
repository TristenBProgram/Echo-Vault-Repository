import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLibrary } from '../../context/LibraryContext';
import { usePlayer } from '../../context/PlayerContext';
import { Artwork, paletteFor } from '../../components/Artwork';
import { TrackRow } from '../../components/TrackRow';
import { MiniPlayer } from '../../components/MiniPlayer';
import { colors, spacing } from '../../theme';

export default function ArtistScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const lib = useLibrary();
  const { playTracks } = usePlayer();

  const artist = lib.artists.find(a => a.name === name);
  const tracks = artist?.tracks ?? [];
  const [top] = paletteFor(name ?? '');

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[top + '99', colors.bg]} style={StyleSheet.absoluteFill} locations={[0, 0.45]} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>

        <FlatList
          data={tracks}
          keyExtractor={t => t.id}
          ListHeaderComponent={
            <View style={styles.hero}>
              <Artwork seed={name ?? ''} label={name ?? '?'} size={180} round />
              <Text style={styles.name} numberOfLines={2}>
                {name}
              </Text>
              <Text style={styles.sub}>
                {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
              </Text>
              <View style={styles.buttons}>
                <Pressable
                  style={({ pressed }) => [styles.play, pressed && { opacity: 0.85 }]}
                  onPress={() => playTracks(tracks, 0)}
                  accessibilityLabel={`Play ${name}`}
                >
                  <Ionicons name="play" size={26} color={colors.onAccent} style={{ marginLeft: 3 }} />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.round, pressed && { opacity: 0.7 }]}
                  onPress={() => playTracks(tracks, 0, { shuffle: true })}
                  accessibilityLabel={`Shuffle ${name}`}
                >
                  <Ionicons name="shuffle" size={22} color={colors.text} />
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <TrackRow track={item} number={index + 1} onPress={() => playTracks(tracks, index)} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No songs for this artist.</Text>}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        />
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.bg }}>
        <MiniPlayer />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignSelf: 'flex-start' },
  hero: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  name: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.lg,
    letterSpacing: -0.5,
  },
  sub: { color: colors.textDim, fontSize: 14, marginTop: spacing.xs },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.lg },
  play: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: spacing.xl },
});
