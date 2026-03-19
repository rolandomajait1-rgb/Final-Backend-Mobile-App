import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet,
  TouchableOpacity, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Loader, ErrorMessage } from '../../components/common';
import { getArticleById } from '../../api/services/articleService';
import { colors, typography, spacing } from '../../styles';

const FALLBACK = 'https://via.placeholder.com/800x400/e2e8f0/64748b?text=No+Image';

// Strip HTML tags for plain text rendering (Phase 2 — WebView in Phase 3)
const stripHtml = (html) => html?.replace(/<[^>]*>/g, '') ?? '';

export default function ArticleDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getArticleById(id)
      .then(res => setArticle(res.data))
      .catch(() => setError('Failed to load article.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!article) return;
    await Share.share({ message: `${article.title}\n\nhttps://final-backend-mobile-app.onrender.com` });
  };

  if (loading) return <Loader />;
  if (error) return (
    <SafeAreaView style={styles.container}>
      <ErrorMessage message={error} style={{ margin: spacing.md }} />
    </SafeAreaView>
  );

  const category = article.categories?.[0]?.name ?? '';
  const author = article.author_name ?? article.author?.user?.name ?? '';
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: article.featured_image || FALLBACK }} style={styles.image} resizeMode="cover" />

        <View style={styles.body}>
          {category ? <Text style={styles.category}>{category.toUpperCase()}</Text> : null}
          <Text style={styles.title}>{article.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{author}</Text>
            {date ? <Text style={styles.meta}> · {date}</Text> : null}
            {article.view_count ? <Text style={styles.meta}> · {article.view_count} views</Text> : null}
          </View>

          {/* Tags */}
          {article.tags?.length > 0 && (
            <View style={styles.tags}>
              {article.tags.map(tag => (
                <View key={tag.id} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag.name}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />
          <Text style={styles.content}>{stripHtml(article.content)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: spacing.xs },
  shareBtn: { padding: spacing.xs },
  scroll: { paddingBottom: spacing.xxl },
  image: { width: '100%', height: 220, backgroundColor: colors.border },
  body: { padding: spacing.md },
  category: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.accent, letterSpacing: 1, marginBottom: spacing.sm },
  title: { fontFamily: typography.fontFamily.serif, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary, lineHeight: typography.fontSize.xl * 1.3, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  meta: { fontSize: typography.fontSize.sm, color: colors.text.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  tag: { backgroundColor: '#f0f4f8', borderRadius: 4, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tagText: { fontSize: typography.fontSize.xs, color: colors.text.secondary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  content: { fontSize: typography.fontSize.base, color: colors.text.primary, lineHeight: typography.fontSize.base * 1.7 },
});
