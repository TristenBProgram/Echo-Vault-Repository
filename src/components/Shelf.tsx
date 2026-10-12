import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import { Artwork } from './Artwork';

export type ShelfItem = {
  key: string;
  title: string;
  subtitle: string;
  seed: string;
  onPress: () => void;
};

type Props = {
  title: string;
  items: ShelfItem[];
  round?: boolean;
};

/** A titled, horizontally scrolling row of cards, like the rows on a streaming home screen. */
export function Shelf({ title, items, round }: Props) {
  if (!items.length) return null;
  const size = round ? 120 : 140;
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      <FlatList
        horizontal
        data={items}
        keyExtractor={i => i.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable onPress={item.onPress} style={({ pressed }) => [{ width: size }, pressed && { opacity: 0.7 }]}>
            <Artwork seed={item.seed} label={item.title} size={size} round={round} />
            <Text style={[styles.title, round && styles.center]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.sub, round && styles.center]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  heading: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: spacing.sm },
  sub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  center: { textAlign: 'center' },
});
