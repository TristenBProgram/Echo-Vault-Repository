import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type UpdateInfo = {
  releaseId?: string;
  message?: string;
  publishedAt?: string;
};

const UPDATE_URL =
  'https://raw.githubusercontent.com/TristenBProgram/Echo-Vault-Repository/update-status/update-info.json';

const SEEN_RELEASE_KEY = '@echo-vault/seen-release-id';

export function UpdateAnnouncement() {
  const [release, setRelease] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkForUpdate() {
      try {
        const response = await fetch(
          `${UPDATE_URL}?t=${Date.now()}`
        );

        if (!response.ok) {
          return;
        }

        const info = (await response.json()) as UpdateInfo;

        if (!info.releaseId) {
          return;
        }

        const seenRelease = await AsyncStorage.getItem(
          SEEN_RELEASE_KEY
        );

        if (!cancelled && info.releaseId !== seenRelease) {
          setRelease(info);
        }
      } catch {
        // Keep the app working if the announcement
        // cannot be reached.
      }
    }

    void checkForUpdate();

    return () => {
      cancelled = true;
    };
  }, []);

  async function dismissAnnouncement() {
    if (release?.releaseId) {
      try {
        await AsyncStorage.setItem(
          SEEN_RELEASE_KEY,
          release.releaseId
        );
      } catch {
        // Dismissing should still work if storage fails.
      }
    }

    setRelease(null);
  }

  if (!release) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Echo Vault update available!
        </Text>

        <Text style={styles.message}>
          {release.message ??
            'A new Echo Vault release has been published.'}
        </Text>

        <Text style={styles.note}>
          Reopen the latest Expo Go development session
          to see the code changes. This announcement
          does not install the EAS Update.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss update announcement"
        onPress={() => void dismissAnnouncement()}
        style={styles.dismissButton}
      >
        <Text style={styles.dismissText}>Dismiss</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 58,
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 8,
    backgroundColor: colors.bg,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  content: {
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    color: colors.text,
    fontSize: 14,
  },
  note: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
  },
  dismissButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dismissText: {
    color: colors.accent,
    fontWeight: '600',
  },
});