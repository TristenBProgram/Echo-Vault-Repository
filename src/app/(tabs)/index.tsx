import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLibrary } from '../../context/LibraryContext';
import { usePlayer } from '../../context/PlayerContext';
import { Shelf } from '../../components/Shelf';
import { MiniPlayer } from '../../components/MiniPlayer';
import { colors, spacing } from '../../theme';
import { greeting } from '../../lib/format';

export default function HomeScreen() {
  const router = useRouter();
  const lib = useLibrary();
  const { playTracks } = usePlayer();

  if (!lib.ready) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (lib.tracks.length === 0) return <EmptyState />;

  const playFrom = (list: typeof lib.tracks, i: number) => playTracks(list, i);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.header}>
          <Text style={styles.hello}>{greeting()}</Text>
          {lib.scanning && <ActivityIndicator color={colors.textDim} />}
        </View>
        <Text style={styles.count}>
          {lib.tracks.length} {lib.tracks.length === 1 ? 'song' : 'songs'} · {lib.artists.length}{' '}
          {lib.artists.length === 1 ? 'artist' : 'artists'}
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
            onPress={() => playTracks(lib.tracks, 0, { shuffle: true })}
          >
            <Ionicons name="shuffle" size={20} color={colors.onAccent} />
            <Text style={styles.primaryText}>Shuffle all</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.7 }]}
            onPress={lib.canScan ? lib.scan : lib.importFiles}
          >
            <Ionicons name={lib.canScan ? 'refresh' : 'add'} size={20} color={colors.text} />
            <Text style={styles.secondaryText}>{lib.canScan ? 'Rescan' : 'Add music'}</Text>
          </Pressable>
        </View>

        {lib.notice && <Text style={styles.notice}>{lib.notice}</Text>}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="For you, music recommendations"
          onPress={() => router.push('/recommendations')}
          style={({ pressed }) => [styles.recommendations, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="sparkles" size={26} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.secondaryText}>For you</Text>
            <Text style={styles.recommendationsBody}>A personal mix from your downloaded music</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
        </Pressable>

        <Shelf
          title="Jump back in"
          items={lib.recentlyPlayed.slice(0, 10).map((t, i, list) => ({
            key: t.id,
            title: t.title,
            subtitle: t.artist,
            seed: t.artist,
            onPress: () => playFrom(list, i),
          }))}
        />
        <Shelf
          title="Recently added"
          items={lib.recentlyAdded.map((t, i, list) => ({
            key: t.id,
            title: t.title,
            subtitle: t.artist,
            seed: t.artist,
            onPress: () => playFrom(list, i),
          }))}
        />
        <Shelf
          title="Your artists"
          round
          items={lib.artists.slice(0, 15).map(a => ({
            key: a.name,
            title: a.name,
            subtitle: `${a.tracks.length} ${a.tracks.length === 1 ? 'song' : 'songs'}`,
            seed: a.name,
            onPress: () => router.push({ pathname: '/artist/[name]', params: { name: a.name } }),
          }))}
        />
      </ScrollView>
      <MiniPlayer />
    </SafeAreaView>
  );
}

function EmptyState() {
  const lib = useLibrary();
  return (
    <SafeAreaView style={[styles.screen, styles.center, { padding: spacing.xl }]}>
      <View style={styles.emptyIcon}>
        <Ionicons name="musical-notes" size={44} color={colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>Your music, streaming-style</Text>
      <Text style={styles.emptyBody}>
        {lib.canScan
          ? 'I’ll look through this phone for songs and turn them into your own streaming library.'
          : 'Pick songs from the Files app (iCloud Drive, Downloads, AirDrop) and I’ll turn them into your own streaming library.'}
      </Text>

      {lib.canScan && (
        <Pressable style={({ pressed }) => [styles.primary, styles.wide, pressed && { opacity: 0.85 }]} onPress={lib.scan}>
          {lib.scanning ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <>
              <Ionicons name="search" size={20} color={colors.onAccent} />
              <Text style={styles.primaryText}>Scan my phone</Text>
            </>
          )}
        </Pressable>
      )}
      <Pressable
        style={({ pressed }) => [lib.canScan ? styles.secondary : styles.primary, styles.wide, pressed && { opacity: 0.8 }]}
        onPress={lib.importFiles}
      >
        <Ionicons name="folder-open" size={20} color={lib.canScan ? colors.text : colors.onAccent} />
        <Text style={lib.canScan ? styles.secondaryText : styles.primaryText}>Add from Files</Text>
      </Pressable>

      {lib.notice && <Text style={[styles.notice, { textAlign: 'center' }]}>{lib.notice}</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  hello: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  count: { color: colors.textDim, fontSize: 14, paddingHorizontal: spacing.lg, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  primaryText: { color: colors.onAccent, fontSize: 15, fontWeight: '700' },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceHigh,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  wide: { alignSelf: 'stretch', marginTop: spacing.md },
  notice: { color: colors.textDim, fontSize: 13, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  recommendations: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surfaceHigh, borderRadius: 16,
    padding: spacing.lg, marginHorizontal: spacing.lg, marginTop: spacing.xl,
  },
  recommendationsBody: { color: colors.textDim, fontSize: 13, marginTop: spacing.xs },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  emptyBody: {
    color: colors.textDim,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
