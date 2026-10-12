import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { hashString } from '../lib/format';

const PALETTES: [string, string][] = [
  ['#FF6B4A', '#6E1A35'],
  ['#5B8CFF', '#1B2470'],
  ['#2ED3A6', '#0C4558'],
  ['#FFC145', '#9C3018'],
  ['#C86BFA', '#371866'],
  ['#FF5FA2', '#46113D'],
  ['#4AD6FF', '#103A66'],
  ['#B8E04A', '#2A5418'],
  ['#FF8A3D', '#5A1F0E'],
  ['#8C7BFF', '#22184F'],
];

export function paletteFor(seed: string): [string, string] {
  return PALETTES[hashString(seed) % PALETTES.length];
}

type Props = {
  /** Same seed = same colors, so an artist always looks the same. */
  seed: string;
  label: string;
  size: number;
  round?: boolean;
  radius?: number;
};

/**
 * Generated cover art: a gradient picked from the seed with the first letter
 * of the label. Real embedded album art can replace this later.
 */
export function Artwork({ seed, label, size, round, radius }: Props) {
  const colors = paletteFor(seed);
  const letter = (label.trim()[0] ?? '♪').toUpperCase();
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.box,
        { width: size, height: size, borderRadius: round ? size / 2 : radius ?? Math.max(4, size * 0.08) },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.42 }]} numberOfLines={1}>
        {letter}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  letter: { color: 'rgba(255,255,255,0.92)', fontWeight: '800' },
});
