import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../styles';

const FALLBACK = 'https://via.placeholder.com/400x200/e2e8f0/64748b?text=No+Image';

export default function ArticleCard({ article, onPress }) {
  const category = article.categories?.[0]?.name ?? '';
  const author = article.author_name ?? article.author?.user?.name ?? '';
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: article.featured_image || FALLBACK }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.body}>
        {category ? <Text style={styles.category}>{category.toUpperCase()}</Text> : null}
        <Text style={styles.title} numberOfLines={3}>{article.title}</Text>
        <Text style={styles.meta}>{[author, date].filter(Boolean).join(' · ')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: colors.border,
  },
  body: {
    padding: spacing.md,
  },
  category: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
    marginBottom: spacing.xs,
  },
  meta: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
});
