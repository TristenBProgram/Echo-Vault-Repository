import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { MiniPlayer } from '../components/MiniPlayer';
import { TrackRow } from '../components/TrackRow';
import { colors, spacing } from '../theme';

export default function RecommendationsScreen() {
  const router = useRouter();
  const lib = useLibrary();
  const { playTracks } = usePlayer();
  const tracks = lib.recommendations.map(item => item.track);

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        hitSlop={12}
        style={styles.back}
      >
        <Ionicons name="chevron-back" size={28} color={colors.text} />
      </Pressable>
      {!lib.ready ? (
        <View style={styles.loading}><ActivityIndicator color={colors.accent} /></View>
      ) : (
        <FlatList
          data={lib.recommendations}
          keyExtractor={item => item.track.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          ListHeaderComponent={
            <View style={styles.header}>
              <Ionicons name="sparkles" size={40} color={colors.accent} />
              <Text style={styles.title} accessibilityRole="header">For you</Text>
              <Text style={styles.body}>
                {lib.recentlyPlayed.length
                  ? 'Inspired by your recent listening, with more to rediscover in your library.'
                  : 'Start with a mix of your downloads. Play a few songs to help shape your recommendations.'}
              </Text>
              <Text style={styles.note}>Only your downloaded music. Recommendations work offline.</Text>
              {tracks.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Play recommended mix"
                  style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
                  onPress={() => playTracks(tracks)}
                >
                  <Ionicons name="play" size={20} color={colors.onAccent} />
                  <Text style={styles.buttonText}>Play mix · {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.pick}>
              <TrackRow track={item.track} onPress={() => playTracks(tracks, index)} />
              <Text style={styles.reason}>{item.reason}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.header}>
              <Text style={styles.body}>Add music to your library to get your first recommendations.</Text>
              <Pressable
                accessibilityRole="button"
                style={styles.button}
                onPress={lib.importFiles}
              >
                <Text style={styles.buttonText}>Add from Files</Text>
              </Pressable>
              {lib.notice && <Text style={styles.body}>{lib.notice}</Text>}
            </View>
          }
        />
      )}
      <MiniPlayer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { alignSelf: 'flex-start', padding: spacing.md },
  header: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: 32, fontWeight: '800' },
  body: { color: colors.textDim, fontSize: 15, lineHeight: 22 },
  note: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
  button: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 999,
  },
  buttonText: { color: colors.onAccent, fontSize: 15, fontWeight: '700' },
  pick: { paddingBottom: spacing.md },
  reason: { color: colors.accent, fontSize: 12, marginLeft: 76, marginRight: spacing.lg },
});
