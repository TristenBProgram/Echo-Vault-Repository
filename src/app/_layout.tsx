import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LibraryProvider } from '../context/LibraryContext';
import { PlayerProvider } from '../context/PlayerContext';
import { colors } from '../theme';
import { UpdateAnnouncement } from '../components/UpdateAnnouncement';

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    border: colors.border,
    primary: colors.accent,
    text: colors.text,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <LibraryProvider>
        <PlayerProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="artist/[name]" />
            <Stack.Screen name="recommendations" />
            <Stack.Screen name="quick-transfer" />
            <Stack.Screen name="player" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </Stack>
          <UpdateAnnouncement />
        </PlayerProvider>
      </LibraryProvider>
    </ThemeProvider>
  );
}
