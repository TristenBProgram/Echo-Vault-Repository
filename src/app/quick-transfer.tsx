import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLibrary } from '../context/LibraryContext';
import { getTransferableTracks } from '../lib/quickTransfer';
import { downloadFile, importSongsAsMp3 } from '../lib/quickTransferIO';
import { colors, spacing } from '../theme';

type Feedback = { message: string; error: boolean };

export default function QuickTransferScreen() {
  const router = useRouter();
  const library = useLibrary();
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [stage, setStage] = useState('');
  const available = useMemo(() => getTransferableTracks(library.tracks), [library.tracks]);
  const visible = useMemo(() => {
    const query = fileName.trim().toLowerCase();
    return available.filter(item => !query || item.fileName.toLowerCase().includes(query)).slice(0, 20);
  }, [available, fileName]);

  async function handleImport() {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    setStage('Choose audio files from your phone.');
    try {
      const result = await importSongsAsMp3(library.tracks, setStage);
      library.addImportedTracks(result.imported);
      if (result.cancelled) {
        setFeedback({ message: 'No files were selected.', error: false });
      } else if (result.failures.length) {
        const imported = result.imported.length;
        setFeedback({
          message: `${imported} ${imported === 1 ? 'song' : 'songs'} added. ${result.failures.join(' ')}`,
          error: true,
        });
      } else {
        const imported = result.imported.length;
        setFeedback({
          message: `${imported} ${imported === 1 ? 'song' : 'songs'} added as MP3. You can play them in your library.`,
          error: false,
        });
      }
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Could not import audio.', error: true });
    } finally {
      setBusy(false);
      setStage('');
    }
  }

  async function handleExport() {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await downloadFile(fileName, library.tracks, setStage);
      setFeedback({
        message: `${result.fileName} was prepared. If you chose a destination in the share sheet, the MP3 was sent there.`,
        error: false,
      });
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Could not transfer this song.', error: true });
    } finally {
      setBusy(false);
      setStage('');
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel="Back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.eyebrow}>YOUR MUSIC, YOUR FILES</Text>
        <Text style={styles.title}>QuickTransfer</Text>
        <Text style={styles.intro}>
          Bring audio from your phone into Echo Vault as MP3, or save a library song to Files or another app.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeading}>
            <Ionicons name="download-outline" size={24} color={colors.accent} />
            <Text style={styles.cardTitle}>Into Echo Vault</Text>
          </View>
          <Text style={styles.description}>Choose MP3, WAV, FLAC, M4A, AAC, or OGG audio. Other formats are converted to MP3 on your phone.</Text>
          <Pressable
            onPress={handleImport}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Choose audio files to import and convert to MP3"
            style={({ pressed }) => [styles.primary, (pressed || busy) && styles.dimmed]}
          >
            <Ionicons name="folder-open-outline" size={20} color={colors.onAccent} />
            <Text style={styles.primaryText}>Choose audio files</Text>
          </Pressable>
          {library.canScan && (
            <Pressable onPress={library.scan} disabled={busy || library.scanning} style={styles.scanButton}>
              <Text style={styles.scanText}>{library.scanning ? 'Scanning phone…' : 'Refresh songs already on my phone'}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeading}>
            <Ionicons name="share-outline" size={24} color={colors.accent} />
            <Text style={styles.cardTitle}>Out of Echo Vault</Text>
          </View>
          <Text style={styles.description}>Enter an exact filename or tap a song below. Your phone will ask where to send the MP3.</Text>
          <TextInput
            value={fileName}
            onChangeText={setFileName}
            placeholder="song.mp3"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Song filename"
            style={styles.input}
          />
          <Pressable
            onPress={handleExport}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Transfer song as MP3"
            style={({ pressed }) => [styles.primary, (pressed || busy) && styles.dimmed]}
          >
            <Ionicons name="share-outline" size={20} color={colors.onAccent} />
            <Text style={styles.primaryText}>Transfer as MP3</Text>
          </Pressable>
          <Text style={styles.availableTitle}>Available from your library</Text>
          {available.length === 0 ? (
            <Text style={styles.empty}>Add songs or scan your phone to see transferable files.</Text>
          ) : visible.length === 0 ? (
            <Text style={styles.empty}>No library filename matches that search.</Text>
          ) : visible.map(({ track, fileName: name }) => (
            <Pressable
              key={track.id}
              onPress={() => setFileName(name)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${name}`}
              style={({ pressed }) => [styles.fileRow, pressed && styles.rowPressed]}
            >
              <Ionicons name="musical-note-outline" size={19} color={colors.textDim} />
              <View style={styles.fileText}>
                <Text style={styles.fileName} numberOfLines={1}>{name}</Text>
                <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          ))}
        </View>

        {busy && <View style={styles.progress}><ActivityIndicator color={colors.accent} /><Text style={styles.progressText}>{stage}</Text></View>}
        {feedback && <Text style={[styles.feedback, feedback.error && styles.error]}>{feedback.message}</Text>}
        {library.notice && <Text style={styles.note}>{library.notice}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  back: { width: 44, height: 44, justifyContent: 'center', marginTop: spacing.sm },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginTop: spacing.md },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: spacing.xs },
  intro: { color: colors.textDim, fontSize: 15, lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: spacing.lg, marginBottom: spacing.lg },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { color: colors.text, fontSize: 19, fontWeight: '700' },
  description: { color: colors.textDim, fontSize: 14, lineHeight: 20, marginTop: spacing.md, marginBottom: spacing.lg },
  primary: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  primaryText: { color: colors.onAccent, fontSize: 15, fontWeight: '800' },
  dimmed: { opacity: 0.6 },
  scanButton: { alignItems: 'center', paddingTop: spacing.lg },
  scanText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  input: { color: colors.text, backgroundColor: colors.surfaceHigh, borderColor: colors.border, borderWidth: 1, borderRadius: 12, fontSize: 16, paddingHorizontal: 14, paddingVertical: 13, marginBottom: spacing.md },
  availableTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm },
  empty: { color: colors.textDim, fontSize: 13, lineHeight: 19, paddingVertical: spacing.sm },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowPressed: { opacity: 0.7 },
  fileText: { flex: 1 },
  fileName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  artist: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  progress: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
  progressText: { color: colors.textDim, fontSize: 13, flex: 1 },
  feedback: { color: colors.text, backgroundColor: colors.surfaceHigh, borderRadius: 10, padding: spacing.md, fontSize: 14, lineHeight: 20 },
  error: { color: '#FFB4A4' },
  note: { color: colors.textDim, fontSize: 13, marginTop: spacing.md },
});
