import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLibrary } from '../../context/LibraryContext';
import { usePlayer } from '../../context/PlayerContext';
import { TrackRow } from '../../components/TrackRow';
import { Artwork } from '../../components/Artwork';
import { MiniPlayer } from '../../components/MiniPlayer';
import { colors, spacing } from '../../theme';
import type { Track } from '../../types';
import { searchTracks, sortTracks, type SortMode } from '../../lib/tracks';

type Tab = 'songs' | 'artists';
type Sort = SortMode;

const SORT_LABEL: Record<Sort, string> = { title: 'A–Z', artist: 'Artist', recent: 'Recently added' };

export default function LibraryScreen() {
  const router = useRouter();
  const lib = useLibrary();
  const { playTracks } = usePlayer();
  const [tab, setTab] = useState<Tab>('songs');
  const [sort, setSort] = useState<Sort>('title');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const songs = useMemo(() => {
    return sortTracks(searchTracks(lib.tracks, q), sort);
  }, [lib.tracks, q, sort]);

  const artists = useMemo(
    () => (q ? lib.artists.filter(a => a.name.toLowerCase().includes(q)) : lib.artists),
    [lib.artists, q],
  );

  const cycleSort = () => setSort(s => (s === 'title' ? 'artist' : s === 'artist' ? 'recent' : 'title'));

  const confirmRemove = (t: Track) => {
    if (t.source !== 'imported') {
      Alert.alert(t.title, 'This song is on your phone. Delete it with your Files app if you want it gone.');
      return;
    }
    Alert.alert('Remove song?', `“${t.title}” will be removed from the app.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => lib.removeTrack(t.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Library</Text>
        <View style={styles.headerButtons}>
          {lib.canScan && (
            <Pressable onPress={lib.scan} hitSlop={8} accessibilityLabel="Rescan phone">
              <Ionicons name="refresh" size={24} color={colors.text} />
            </Pressable>
          )}
          <Pressable onPress={lib.importFiles} hitSlop={8} accessibilityLabel="Add from Files">
            <Ionicons name="add" size={28} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textDim} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search songs and artists"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.chips}>
        {(['songs', 'artists'] as Tab[]).map(t => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.chip, tab === t && styles.chipActive]}>
            <Text style={[styles.chipText, tab === t && styles.chipTextActive]}>
              {t === 'songs' ? 'Songs' : 'Artists'}
            </Text>
          </Pressable>
        ))}
        {tab === 'songs' && (
          <Pressable onPress={cycleSort} style={styles.sort} hitSlop={6}>
            <Ionicons name="swap-vertical" size={16} color={colors.textDim} />
            <Text style={styles.sortText}>{SORT_LABEL[sort]}</Text>
          </Pressable>
        )}
      </View>

      {tab === 'songs' ? (
        <FlatList
          data={songs}
          keyExtractor={t => t.id}
          renderItem={({ item, index }) => (
            <TrackRow track={item} onPress={() => playTracks(songs, index)} onLongPress={() => confirmRemove(item)} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>{q ? 'No matches.' : 'No songs yet.'}</Text>}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <FlatList
          data={artists}
          keyExtractor={a => a.name}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.artistRow, pressed && { backgroundColor: colors.surface }]}
              onPress={() => router.push({ pathname: '/artist/[name]', params: { name: item.name } })}
            >
              <Artwork seed={item.name} label={item.name} size={56} round />
              <View style={{ flex: 1 }}>
                <Text style={styles.artistName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.artistSub}>
                  {item.tracks.length} {item.tracks.length === 1 ? 'song' : 'songs'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>{q ? 'No matches.' : 'No artists yet.'}</Text>}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          keyboardShouldPersistTaps="handled"
        />
      )}
      <MiniPlayer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  heading: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceHigh,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 10 },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.surfaceHigh },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: colors.onAccent },
  sort: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { color: colors.textDim, fontSize: 13 },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: spacing.xxl },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  artistName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  artistSub: { color: colors.textDim, fontSize: 13, marginTop: 2 },
});
