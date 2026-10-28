import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { useMemo, useState } from 'react';

import {
  Alert,

  FlatList,

  Modal,

  Pressable,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';



import { Artwork } from '../../components/Artwork';

import { MiniPlayer } from '../../components/MiniPlayer';

import { TrackRow } from '../../components/TrackRow';

import { useLibrary } from '../../context/LibraryContext';

import { usePlayer } from '../../context/PlayerContext';

import { colors, spacing } from '../../theme';



import type {
  Playlist,

  PlaylistCategory,

  Track,
} from '../../types';



import {
  searchTracks,

  sortTracks,

  type SortMode,
} from '../../lib/tracks';



type Tab = 'songs' | 'artists' | 'playlists';

type Sort = SortMode;

type PlaylistSort = 'name' | 'category' | 'recent';



const SORT_LABEL: Record<Sort, string> = {

  title: 'A–Z',

  artist: 'Artist',

  recent: 'Recently added',

};



const CATEGORIES: PlaylistCategory[] = [

  'Workout',

  'Study',

  'Driving',

  'Chill',

  'Party',

  'Sleep',

  'Hip-Hop',

  'R&B',

  'Pop',

  'Country',

  'Rock',

  'Favorites',

  'Custom',

];



const CATEGORY_ICON: Record<PlaylistCategory, string> = {

  Workout: 'barbell',

  Study: 'book',

  Driving: 'car',

  Chill: 'moon',

  Party: 'musical-notes',

  Sleep: 'cloudy-night',

  'Hip-Hop': 'headset',

  'R&B': 'heart',

  Pop: 'star',

  Country: 'sunny',

  Rock: 'flash',

  Favorites: 'heart',

  Custom: 'list',

};



export default function LibraryScreen() {

  const router = useRouter();

  const lib = useLibrary();

  const { getTracksForPlaylist } = lib;

  const { playTracks } = usePlayer();



  const [tab, setTab] = useState<Tab>('songs');

  const [sort, setSort] = useState<Sort>('title');

  const [query, setQuery] = useState('');



  // Playlist Organizer state

  const [playlistSort, setPlaylistSort] =

    useState<PlaylistSort>('name');



  const [selectedPlaylistId, setSelectedPlaylistId] =

    useState<string | null>(null);



  const [showCreate, setShowCreate] = useState(false);

  const [showRename, setShowRename] = useState(false);

  const [showAddSongs, setShowAddSongs] = useState(false);



  const [playlistName, setPlaylistName] = useState('');

  const [category, setCategory] =

    useState<PlaylistCategory>('Custom');



  const [songQuery, setSongQuery] = useState('');



  const q = query.trim().toLowerCase();



  // Existing songs

  const songs = useMemo(() => {

    return sortTracks(searchTracks(lib.tracks, q), sort);

  }, [lib.tracks, q, sort]);



  // Existing artists

  const artists = useMemo(

    () =>

      q

        ? lib.artists.filter(a =>

            a.name.toLowerCase().includes(q)

          )

        : lib.artists,

    [lib.artists, q],

  );



  const cycleSort = () =>

    setSort(s =>

      s === 'title'

        ? 'artist'

        : s === 'artist'

          ? 'recent'

          : 'title'

    );



  // Existing remove-song functionality

  const confirmRemove = (t: Track) => {

    if (t.source !== 'imported') {

      Alert.alert(

        t.title,

        'This song is on your phone. Delete it with your Files app if you want it gone.'

      );

      return;

    }



    Alert.alert(

      'Remove song?',

      `“${t.title}” will be removed from the app.`,

      [

        { text: 'Cancel', style: 'cancel' },

        {

          text: 'Remove',

          style: 'destructive',

          onPress: () => lib.removeTrack(t.id),

        },

      ]

    );

  };



  // Sort playlists by name, category, or recently updated

  const playlists = useMemo(() => {

    const filtered = lib.playlists.filter(p =>

      p.name.toLowerCase().includes(q) ||

      p.category.toLowerCase().includes(q)

    );



    return [...filtered].sort((a, b) => {

      if (playlistSort === 'category') {

        return a.category.localeCompare(b.category) ||

          a.name.localeCompare(b.name);

      }



      if (playlistSort === 'recent') {

        return b.updatedAt - a.updatedAt;

      }



      return a.name.localeCompare(b.name);

    });

  }, [lib.playlists, q, playlistSort]);



  const selectedPlaylist = lib.playlists.find(

    p => p.id === selectedPlaylistId

  );



  const playlistTracks = useMemo(() => {

    return selectedPlaylistId

      ? getTracksForPlaylist(selectedPlaylistId)

      : [];

  }, [

    selectedPlaylistId,

    getTracksForPlaylist,

  ]);



  const filteredAddSongs = useMemo(() => {

    return searchTracks(

      lib.tracks,

      songQuery.trim().toLowerCase()

    );

  }, [lib.tracks, songQuery]);



  // Create a playlist

  const handleCreatePlaylist = () => {

    if (!playlistName.trim()) {

      Alert.alert(

        'Playlist name required',

        'Please enter a playlist name.'

      );

      return;

    }



    lib.createNewPlaylist(playlistName, category);



    setShowCreate(false);

    setPlaylistName('');

    setCategory('Custom');

    setQuery('');

  };



  // Rename a playlist

  const handleRenamePlaylist = () => {

    if (!selectedPlaylistId) return;



    if (!playlistName.trim()) {

      Alert.alert(

        'Invalid name',

        'Please enter a playlist name.'

      );

      return;

    }



    lib.renameExistingPlaylist(

      selectedPlaylistId,

      playlistName

    );



    setShowRename(false);

    setPlaylistName('');

  };



  // Delete a playlist without deleting songs

  const handleDeletePlaylist = () => {

    if (!selectedPlaylist) return;



    Alert.alert(

      'Delete playlist?',

      `Delete "${selectedPlaylist.name}"? Your songs will remain in your music library.`,

      [

        { text: 'Cancel', style: 'cancel' },

        {

          text: 'Delete',

          style: 'destructive',

          onPress: () => {

            lib.deletePlaylist(selectedPlaylist.id);

            setSelectedPlaylistId(null);

          },

        },

      ]

    );

  };



  const handlePlayPlaylist = (

    tracks: Track[],

    index = 0

  ) => {

    if (tracks.length === 0) {

      Alert.alert(

        'Empty playlist',

        'Add songs to this playlist first.'

      );

      return;

    }



    playTracks(tracks, index);

  };



  // Display one playlist

  const renderPlaylist = ({ item }: { item: Playlist }) => {

    const songCount = lib.getTracksForPlaylist(item.id).length;



    return (

      <Pressable

        style={({ pressed }) => [

          styles.artistRow,

          pressed && { backgroundColor: colors.surface },

        ]}

        onPress={() => {

          setSelectedPlaylistId(item.id);

          setQuery('');

        }}

      >

        <View style={styles.playlistArtwork}>

          <Ionicons

            name={CATEGORY_ICON[item.category] as any}

            size={25}

            color={colors.accent}

          />

        </View>



        <View style={{ flex: 1 }}>

          <Text

            style={styles.artistName}

            numberOfLines={1}

          >

            {item.name}

          </Text>



          <Text style={styles.artistSub}>

            {item.category} · {songCount}{' '}

            {songCount === 1 ? 'song' : 'songs'}

          </Text>

        </View>



        <Ionicons

          name="chevron-forward"

          size={18}

          color={colors.textFaint}

        />

      </Pressable>

    );

  };



  // Playlist detail page inside the library

  if (selectedPlaylist) {

    return (

      <SafeAreaView

        style={styles.screen}

        edges={['top']}

      >

        <View style={styles.header}>

          <Pressable

            style={styles.backButton}

            onPress={() => setSelectedPlaylistId(null)}

          >

            <Ionicons

              name="chevron-back"

              size={25}

              color={colors.text}

            />

            <Text style={styles.backText}>Playlists</Text>

          </Pressable>

        </View>



        <FlatList

          data={playlistTracks}

          keyExtractor={item => item.id}

          ListHeaderComponent={

            <View style={styles.detailHeader}>

              <View style={styles.largeArtwork}>

                <Ionicons

                  name={

                    CATEGORY_ICON[

                      selectedPlaylist.category

                    ] as any

                  }

                  size={48}

                  color={colors.accent}

                />

              </View>



              <Text style={styles.detailTitle}>

                {selectedPlaylist.name}

              </Text>



              <Text style={styles.artistSub}>

                {selectedPlaylist.category} ·{' '}

                {playlistTracks.length} songs

              </Text>



              <View style={styles.actionRow}>

                <Pressable

                  style={styles.primaryButton}

                  onPress={() =>

                    handlePlayPlaylist(playlistTracks)

                  }

                >

                  <Ionicons

                    name="play"

                    size={20}

                    color={colors.onAccent}

                  />

                  <Text style={styles.primaryText}>

                    Play

                  </Text>

                </Pressable>



                <Pressable

                  style={styles.secondaryButton}

                  onPress={() => {

                    setSongQuery('');

                    setShowAddSongs(true);

                  }}

                >

                  <Ionicons

                    name="add"

                    size={20}

                    color={colors.text}

                  />

                  <Text style={styles.secondaryText}>

                    Add Songs

                  </Text>

                </Pressable>

              </View>



              <View style={styles.manageRow}>

                <Pressable

                  onPress={() => {

                    setPlaylistName(

                      selectedPlaylist.name

                    );

                    setShowRename(true);

                  }}

                >

                  <Text style={styles.manageText}>

                    Rename

                  </Text>

                </Pressable>



                <Pressable

                  onPress={handleDeletePlaylist}

                >

                  <Text style={styles.deleteText}>

                    Delete Playlist

                  </Text>

                </Pressable>

              </View>

            </View>

          }

          renderItem={({ item, index }) => (

            <TrackRow

              track={item}

              onPress={() =>

                handlePlayPlaylist(

                  playlistTracks,

                  index

                )

              }

              onLongPress={() =>

                Alert.alert(

                  'Remove from playlist?',

                  `Remove "${item.title}" from this playlist?`,

                  [

                    {

                      text: 'Cancel',

                      style: 'cancel',

                    },

                    {

                      text: 'Remove',

                      style: 'destructive',

                      onPress: () =>

                        lib.removeTrackFromPlaylist(

                          selectedPlaylist.id,

                          item.id

                        ),

                    },

                  ]

                )

              }

            />

          )}

          ListEmptyComponent={

            <Text style={styles.empty}>

              No songs in this playlist yet.

            </Text>

          }

          contentContainerStyle={{

            paddingBottom: spacing.xl,

          }}

        />



        <MiniPlayer />



        {/* Add Songs Modal */}

        <Modal

          visible={showAddSongs}

          animationType="slide"

          presentationStyle="pageSheet"

          onRequestClose={() =>

            setShowAddSongs(false)

          }

        >

          <SafeAreaView style={styles.screen}>

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>

                Add Songs

              </Text>



              <Pressable

                onPress={() =>

                  setShowAddSongs(false)

                }

              >

                <Text style={styles.doneText}>

                  Done

                </Text>

              </Pressable>

            </View>



            <TextInput

              style={styles.modalInput}

              placeholder="Search your music"

              placeholderTextColor={colors.textFaint}

              value={songQuery}

              onChangeText={setSongQuery}

            />



            <FlatList

              data={filteredAddSongs}

              keyExtractor={item => item.id}

              renderItem={({ item }) => {

                const alreadyAdded =

                  selectedPlaylist.trackIds.includes(

                    item.id

                  );



                return (

                  <Pressable

                    style={styles.songPickerRow}

                    onPress={() => {

                      if (alreadyAdded) {

                        lib.removeTrackFromPlaylist(

                          selectedPlaylist.id,

                          item.id

                        );

                      } else {

                        lib.addTrackToPlaylist(

                          selectedPlaylist.id,

                          item.id

                        );

                      }

                    }}

                  >

                    <View style={{ flex: 1 }}>

                      <Text

                        style={styles.artistName}

                        numberOfLines={1}

                      >

                        {item.title}

                      </Text>

                      <Text

                        style={styles.artistSub}

                        numberOfLines={1}

                      >

                        {item.artist}

                      </Text>

                    </View>



                    <Ionicons

                      name={

                        alreadyAdded

                          ? 'checkmark-circle'

                          : 'add-circle-outline'

                      }

                      size={26}

                      color={

                        alreadyAdded

                          ? colors.accent

                          : colors.textDim

                      }

                    />

                  </Pressable>

                );

              }}

              ListEmptyComponent={

                <Text style={styles.empty}>

                  No songs found.

                </Text>

              }

            />

          </SafeAreaView>

        </Modal>



        {/* Rename Playlist Modal */}

        <Modal

          visible={showRename}

          transparent

          animationType="fade"

          onRequestClose={() =>

            setShowRename(false)

          }

        >

          <View style={styles.modalOverlay}>

            <View style={styles.modalCard}>

              <Text style={styles.modalTitle}>

                Rename Playlist

              </Text>



              <TextInput

                style={styles.modalInput}

                value={playlistName}

                onChangeText={setPlaylistName}

                placeholder="Playlist name"

                placeholderTextColor={

                  colors.textFaint

                }

                maxLength={60}

              />



              <View style={styles.modalActions}>

                <Pressable

                  onPress={() =>

                    setShowRename(false)

                  }

                >

                  <Text style={styles.secondaryText}>

                    Cancel

                  </Text>

                </Pressable>



                <Pressable

                  onPress={handleRenamePlaylist}

                >

                  <Text style={styles.doneText}>

                    Save

                  </Text>

                </Pressable>

              </View>

            </View>

          </View>

        </Modal>

      </SafeAreaView>

    );

  }



  // Main Library screen

  return (

    <SafeAreaView

      style={styles.screen}

      edges={['top']}

    >

      <View style={styles.header}>

        <Text style={styles.heading}>

          Library

        </Text>



        <View style={styles.headerButtons}>

          {lib.canScan && (

            <Pressable

              onPress={lib.scan}

              hitSlop={8}

              accessibilityLabel="Rescan phone"

            >

              <Ionicons

                name="refresh"

                size={24}

                color={colors.text}

              />

            </Pressable>

          )}



          <Pressable

            onPress={

              tab === 'playlists'

                ? () => setShowCreate(true)

                : lib.importFiles

            }

            hitSlop={8}

            accessibilityLabel={

              tab === 'playlists'

                ? 'Create playlist'

                : 'Add from Files'

            }

          >

            <Ionicons

              name="add"

              size={28}

              color={colors.text}

            />

          </Pressable>

        </View>

      </View>



      <View style={styles.search}>

        <Ionicons

          name="search"

          size={18}

          color={colors.textDim}

        />



        <TextInput

          value={query}

          onChangeText={setQuery}

          placeholder={

            tab === 'playlists'

              ? 'Search playlists'

              : 'Search songs and artists'

          }

          placeholderTextColor={colors.textFaint}

          style={styles.input}

          autoCorrect={false}

          returnKeyType="search"

          clearButtonMode="while-editing"

        />

      </View>



      <View style={styles.chips}>

        {(['songs', 'artists', 'playlists'] as Tab[]).map(t => (

          <Pressable

            key={t}

            onPress={() => {

              setTab(t);

              setQuery('');

            }}

            style={[

              styles.chip,

              tab === t && styles.chipActive,

            ]}

          >

            <Text

              style={[

                styles.chipText,

                tab === t && styles.chipTextActive,

              ]}

            >

              {t === 'songs'

                ? 'Songs'

                : t === 'artists'

                  ? 'Artists'

                  : 'Playlists'}

            </Text>

          </Pressable>

        ))}



        {tab === 'songs' && (

          <Pressable

            onPress={cycleSort}

            style={styles.sort}

            hitSlop={6}

          >

            <Ionicons

              name="swap-vertical"

              size={16}

              color={colors.textDim}

            />

            <Text style={styles.sortText}>

              {SORT_LABEL[sort]}

            </Text>

          </Pressable>

        )}

      </View>



      {tab === 'songs' ? (

        <FlatList

          data={songs}

          keyExtractor={t => t.id}

          renderItem={({ item, index }) => (

            <TrackRow

              track={item}

              onPress={() =>

                playTracks(songs, index)

              }

              onLongPress={() =>

                confirmRemove(item)

              }

            />

          )}

          ListEmptyComponent={

            <Text style={styles.empty}>

              {q ? 'No matches.' : 'No songs yet.'}

            </Text>

          }

          contentContainerStyle={{

            paddingBottom: spacing.xl,

          }}

          keyboardShouldPersistTaps="handled"

        />

      ) : tab === 'artists' ? (

        <FlatList

          data={artists}

          keyExtractor={a => a.name}

          renderItem={({ item }) => (

            <Pressable

              style={({ pressed }) => [

                styles.artistRow,

                pressed && {

                  backgroundColor: colors.surface,

                },

              ]}

              onPress={() =>

                router.push({

                  pathname: '/artist/[name]',

                  params: { name: item.name },

                })

              }

            >

              <Artwork

                seed={item.name}

                label={item.name}

                size={56}

                round

              />



              <View style={{ flex: 1 }}>

                <Text

                  style={styles.artistName}

                  numberOfLines={1}

                >

                  {item.name}

                </Text>



                <Text style={styles.artistSub}>

                  {item.tracks.length}{' '}

                  {item.tracks.length === 1

                    ? 'song'

                    : 'songs'}

                </Text>

              </View>



              <Ionicons

                name="chevron-forward"

                size={18}

                color={colors.textFaint}

              />

            </Pressable>

          )}

          ListEmptyComponent={

            <Text style={styles.empty}>

              {q ? 'No matches.' : 'No artists yet.'}

            </Text>

          }

          contentContainerStyle={{

            paddingBottom: spacing.xl,

          }}

          keyboardShouldPersistTaps="handled"

        />

      ) : (

        <FlatList

          data={playlists}

          keyExtractor={p => p.id}

          renderItem={renderPlaylist}

          ListHeaderComponent={

            <View style={styles.playlistHeader}>

              <Text style={styles.sectionTitle}>

                My Playlists

              </Text>



              <Pressable

                onPress={() =>

                  setPlaylistSort(s =>

                    s === 'name'

                      ? 'category'

                      : s === 'category'

                        ? 'recent'

                        : 'name'

                  )

                }

                style={styles.sort}

              >

                <Ionicons

                  name="swap-vertical"

                  size={17}

                  color={colors.textDim}

                />

                <Text style={styles.sortText}>

                  {playlistSort === 'name'

                    ? 'A–Z'

                    : playlistSort === 'category'

                      ? 'Category'

                      : 'Recent'}

                </Text>

              </Pressable>

            </View>

          }

          ListEmptyComponent={

            <View style={styles.emptyContainer}>

              <Ionicons

                name="musical-notes-outline"

                size={54}

                color={colors.textDim}

              />



              <Text style={styles.empty}>

                {q

                  ? 'No matching playlists.'

                  : 'No playlists yet.'}

              </Text>



              {!q && (

                <Pressable

                  style={styles.primaryButton}

                  onPress={() =>

                    setShowCreate(true)

                  }

                >

                  <Ionicons

                    name="add"

                    size={20}

                    color={colors.onAccent}

                  />

                  <Text style={styles.primaryText}>

                    Create Playlist

                  </Text>

                </Pressable>

              )}

            </View>

          }

          contentContainerStyle={{

            paddingBottom: spacing.xl,

          }}

        />

      )}



      <MiniPlayer />



      {/* Create Playlist Modal */}

      <Modal

        visible={showCreate}

        transparent

        animationType="slide"

        onRequestClose={() =>

          setShowCreate(false)

        }

      >

        <View style={styles.modalOverlay}>

          <View style={styles.modalCard}>

            <Text style={styles.modalTitle}>

              Create Playlist

            </Text>



            <Text style={styles.fieldLabel}>

              Playlist Name

            </Text>



            <TextInput

              style={styles.modalInput}

              value={playlistName}

              onChangeText={setPlaylistName}

              placeholder="My Workout Playlist"

              placeholderTextColor={colors.textFaint}

              maxLength={60}

            />



            <Text style={styles.fieldLabel}>

              Choose Category

            </Text>



            <ScrollView

              style={{ maxHeight: 260 }}

              keyboardShouldPersistTaps="handled"

            >

              <View style={styles.categoryGrid}>

                {CATEGORIES.map(c => (

                  <Pressable

                    key={c}

                    onPress={() =>

                      setCategory(c)

                    }

                    style={[

                      styles.categoryChip,

                      category === c &&

                        styles.categoryActive,

                    ]}

                  >

                    <Text

                      style={[

                        styles.categoryText,

                        category === c &&

                          styles.categoryTextActive,

                      ]}

                    >

                      {c}

                    </Text>

                  </Pressable>

                ))}

              </View>

            </ScrollView>



            <View style={styles.modalActions}>

              <Pressable

                onPress={() => {

                  setShowCreate(false);

                  setPlaylistName('');

                  setCategory('Custom');

                }}

              >

                <Text style={styles.secondaryText}>

                  Cancel

                </Text>

              </Pressable>



              <Pressable

                style={styles.primaryButton}

                onPress={handleCreatePlaylist}

              >

                <Text style={styles.primaryText}>

                  Create

                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

    </SafeAreaView>

  );

}



const styles = StyleSheet.create({

  screen: {

    flex: 1,

    backgroundColor: colors.bg,

  },

  header: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: spacing.lg,

    paddingTop: spacing.lg,

  },

  heading: {

    color: colors.text,

    fontSize: 30,

    fontWeight: '800',

    letterSpacing: -0.5,

  },

  headerButtons: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: spacing.lg,

  },

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

  input: {

    flex: 1,

    color: colors.text,

    fontSize: 15,

    paddingVertical: 10,

  },

  chips: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: spacing.sm,

    paddingHorizontal: spacing.lg,

    paddingVertical: spacing.md,

  },

  chip: {

    paddingVertical: 7,

    paddingHorizontal: 14,

    borderRadius: 999,

    backgroundColor: colors.surfaceHigh,

  },

  chipActive: {

    backgroundColor: colors.accent,

  },

  chipText: {

    color: colors.text,

    fontSize: 14,

    fontWeight: '600',

  },

  chipTextActive: {

    color: colors.onAccent,

  },

  sort: {

    marginLeft: 'auto',

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

  },

  sortText: {

    color: colors.textDim,

    fontSize: 13,

  },

  empty: {

    color: colors.textDim,

    textAlign: 'center',

    marginTop: spacing.xxl,

  },

  artistRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: spacing.md,

    paddingHorizontal: spacing.lg,

    paddingVertical: spacing.sm,

  },

  artistName: {

    color: colors.text,

    fontSize: 16,

    fontWeight: '600',

  },

  artistSub: {

    color: colors.textDim,

    fontSize: 13,

    marginTop: 2,

  },



  // Playlist styles

  playlistArtwork: {

    width: 56,

    height: 56,

    backgroundColor: colors.surfaceHigh,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

  },

  playlistHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: spacing.lg,

    paddingVertical: spacing.md,

  },

  sectionTitle: {

    color: colors.text,

    fontSize: 20,

    fontWeight: '700',

  },

  emptyContainer: {

    alignItems: 'center',

    padding: spacing.xl,

  },

  primaryButton: {

    backgroundColor: colors.accent,

    paddingHorizontal: 18,

    paddingVertical: 12,

    borderRadius: 25,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 6,

    marginTop: spacing.md,

  },

  primaryText: {

    color: colors.onAccent,

    fontSize: 14,

    fontWeight: '700',

  },

  secondaryButton: {

    backgroundColor: colors.surfaceHigh,

    paddingHorizontal: 18,

    paddingVertical: 12,

    borderRadius: 25,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    marginTop: spacing.md,

  },

  secondaryText: {

    color: colors.text,

    fontSize: 14,

    fontWeight: '600',

  },

  backButton: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

  },

  backText: {

    color: colors.text,

    fontSize: 16,

  },

  detailHeader: {

    padding: spacing.lg,

    alignItems: 'center',

  },

  largeArtwork: {

    width: 150,

    height: 150,

    backgroundColor: colors.surfaceHigh,

    borderRadius: 20,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: spacing.md,

  },

  detailTitle: {

    color: colors.text,

    fontSize: 25,

    fontWeight: '800',

    textAlign: 'center',

  },

  actionRow: {

    flexDirection: 'row',

    gap: spacing.md,

    alignItems: 'center',

  },

  manageRow: {

    flexDirection: 'row',

    gap: spacing.xl,

    marginTop: spacing.lg,

    marginBottom: spacing.md,

  },

  manageText: {

    color: colors.textDim,

    fontSize: 14,

  },

  deleteText: {

    color: '#F87171',

    fontSize: 14,

  },

  modalOverlay: {

    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.7)',

    justifyContent: 'center',

    padding: spacing.lg,

  },

  modalCard: {

    backgroundColor: colors.surface,

    borderRadius: 20,

    padding: spacing.lg,

  },

  modalHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    padding: spacing.lg,

  },

  modalTitle: {

    color: colors.text,

    fontSize: 22,

    fontWeight: '700',

    marginBottom: spacing.md,

  },

  modalInput: {

    backgroundColor: colors.surfaceHigh,

    color: colors.text,

    borderRadius: 10,

    padding: 14,

    fontSize: 16,

    marginBottom: spacing.md,

  },

  fieldLabel: {

    color: colors.textDim,

    fontSize: 13,

    fontWeight: '600',

    marginBottom: spacing.sm,

  },

  categoryGrid: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 8,

  },

  categoryChip: {

    paddingHorizontal: 14,

    paddingVertical: 10,

    backgroundColor: colors.surfaceHigh,

    borderRadius: 20,

  },

  categoryActive: {

    backgroundColor: colors.accent,

  },

  categoryText: {

    color: colors.text,

    fontSize: 13,

  },

  categoryTextActive: {

    color: colors.onAccent,

    fontWeight: '700',

  },

  modalActions: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginTop: spacing.lg,

  },

  doneText: {

    color: colors.accent,

    fontSize: 16,

    fontWeight: '700',

  },

  songPickerRow: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: spacing.lg,

    paddingVertical: spacing.md,

    borderBottomWidth: 0.5,

    borderBottomColor: colors.surfaceHigh,

  },

});
