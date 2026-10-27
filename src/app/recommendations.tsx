import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { MiniPlayer } from '../components/MiniPlayer';
import { TrackRow } from '../components/TrackRow';
import { colors, spacing } from '../theme';
import type { RecommendationMode } from '../lib/recommendations';

const modes: { key: RecommendationMode; label: string; description: string }[] = [
  { key: 'personal', label: 'For you', description: 'A mix shaped by your recent listening and the songs you like.' },
  { key: 'discover', label: 'Discover', description: 'Rediscover downloads outside your last 20 distinct listens.' },
  { key: 'liked', label: 'Liked songs', description: 'Your liked songs, mixed across artists. Tap a heart below any recommendation to add one.' },
];

export default function RecommendationsScreen() {
  const router = useRouter();
  const lib = useLibrary();
  const { playTracks } = usePlayer();
  const [mode, setMode] = useState<RecommendationMode>('personal');
  const [variant, setVariant] = useState(0);
  const [previousFirstId, setPreviousFirstId] = useState<string>();
  const [showHidden, setShowHidden] = useState(false);
  const { getRecommendations, recommendationPreferences: preferences } = lib;
  const recommendations = useMemo(
    () => getRecommendations({ mode, variant, previousFirstId }),
    [getRecommendations, mode, variant, previousFirstId],
  );
  const hidden = useMemo(() => {
    const hiddenIds = new Set(preferences.hiddenIds);
    return lib.tracks.filter(track => hiddenIds.has(track.id)).map(track => ({ track, reason: 'Hidden from recommendations' }));
  }, [lib.tracks, preferences.hiddenIds]);
  const items = showHidden ? hidden : recommendations;
  const tracks = recommendations.map(item => item.track);
  const liked = new Set(preferences.likedIds);
  const emptyMessage = !lib.tracks.length
    ? 'Add music to your library to get your first recommendations.'
    : showHidden ? 'No hidden songs. You can hide a recommendation with the eye icon.'
      : mode === 'liked' ? 'No liked songs yet. Choose For you or Discover and tap a heart to add songs.'
        : mode === 'discover' ? 'No songs outside your recent rotation right now. Add music or try For you.'
          : 'All your available songs are hidden. Open Hidden songs to restore some.';

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
          data={items}
          keyExtractor={item => item.track.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          ListHeaderComponent={
            <View style={styles.header}>
              <Ionicons name="sparkles" size={40} color={colors.accent} />
              <Text style={styles.title} accessibilityRole="header">{showHidden ? 'Hidden songs' : 'For you'}</Text>
              <Text style={styles.body}>
                {showHidden
                  ? 'Restore songs here to include them in future recommendations. Hiding never deletes files or changes a mix already playing.'
                  : modes.find(item => item.key === mode)!.description}
              </Text>
              <Text style={styles.note}>Only your downloaded music. Recommendations work offline.</Text>
              <View style={styles.controls}>
                {modes.map(item => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: !showHidden && mode === item.key }}
                    onPress={() => { setMode(item.key); setShowHidden(false); setPreviousFirstId(undefined); }}
                    style={[styles.chip, !showHidden && mode === item.key && styles.chipActive]}
                  >
                    <Text style={!showHidden && mode === item.key ? styles.buttonText : styles.chipText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.controls}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showHidden }}
                  style={styles.chip}
                  onPress={() => setShowHidden(value => !value)}
                >
                  <Text style={styles.chipText}>{showHidden ? 'Back to mix' : `Hidden songs (${hidden.length})`}</Text>
                </Pressable>
                {!showHidden && tracks.length > 1 && (
                  <Pressable
                    accessibilityRole="button"
                    style={styles.chip}
                    onPress={() => {
                      setPreviousFirstId(recommendations[0]?.track.id);
                      setVariant(value => value + 1);
                    }}
                  >
                    <Ionicons name="refresh" size={18} color={colors.text} />
                    <Text style={styles.chipText}>New mix</Text>
                  </Pressable>
                )}
              </View>
              {!showHidden && tracks.length > 0 && (
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
              <TrackRow track={item.track} onPress={() => showHidden ? playTracks([item.track]) : playTracks(tracks, index)} />
              <View style={styles.feedback}>
                <Text style={styles.reason}>{item.reason}</Text>
                {showHidden ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Restore ${item.track.title} to recommendations`}
                    style={styles.feedbackButton}
                    onPress={() => lib.recommendationFeedback(item.track.id, 'restore')}
                  >
                    <Text style={styles.chipText}>Restore</Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${liked.has(item.track.id) ? 'Unlike' : 'Like'} ${item.track.title}`}
                      accessibilityState={{ selected: liked.has(item.track.id) }}
                      style={styles.feedbackButton}
                      onPress={() => lib.recommendationFeedback(item.track.id, 'like')}
                    >
                      <Ionicons name={liked.has(item.track.id) ? 'heart' : 'heart-outline'} size={22} color={colors.accent} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Hide ${item.track.title} from recommendations`}
                      style={styles.feedbackButton}
                      onPress={() => lib.recommendationFeedback(item.track.id, 'hide')}
                    >
                      <Ionicons name="eye-off-outline" size={22} color={colors.textDim} />
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.header}>
              <Text style={styles.body}>{emptyMessage}</Text>
              {!lib.tracks.length && (
                <Pressable
                  accessibilityRole="button"
                  style={styles.button}
                  onPress={lib.importFiles}
                >
                  <Text style={styles.buttonText}>Add from Files</Text>
                </Pressable>
              )}
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
  reason: { flex: 1, color: colors.accent, fontSize: 12 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: 12, borderRadius: 24, backgroundColor: colors.surfaceHigh,
  },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginLeft: 76, marginRight: spacing.lg },
  feedbackButton: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
});
