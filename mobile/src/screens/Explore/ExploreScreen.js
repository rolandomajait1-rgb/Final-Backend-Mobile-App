import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ArticleCard } from '../../components/articles';
import { Loader, ErrorMessage } from '../../components/common';
import HomeHeader from '../../components/home/HomeHeader';
import { getArticles } from '../../api/services/articleService';
import { getCategories } from '../../api/services/categoryService';
import { colors, typography, spacing } from '../../styles';

export default function ExploreScreen({ navigation }) {
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data ?? []);
    } catch (_) {}
  };

  const fetchTrendingArticles = useCallback(async (pageNum = 1, categoryId = selectedCategory, replace = true) => {
    try {
      const params = { limit: 10, page: pageNum, sort: 'trending' };
      if (categoryId) params.category = categoryId;
      const res = await getArticles(params);
      const data = res.data?.data ?? res.data ?? [];
      const lastPage = res.data?.last_page ?? 1;
      setTrendingArticles(prev => replace ? data : [...prev, ...data]);
      setHasMore(pageNum < lastPage);
      setPage(pageNum);
    } catch (e) {
      setError('Failed to load trending articles. Pull down to retry.');
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTrendingArticles(1, selectedCategory, true).finally(() => setLoading(false));
  }, [selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await fetchTrendingArticles(1, selectedCategory, true);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchTrendingArticles(page + 1, selectedCategory, false);
    setLoadingMore(false);
  };

  const renderHeader = () => (
    <View>
      {/* Trending Header */}
      <View style={styles.trendingHeader}>
        <Ionicons name="flame" size={28} color={colors.primary} />
        <Text style={styles.trendingTitle}>Trending Now</Text>
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={[{ id: null, name: 'All' }, ...categories]}
        keyExtractor={(item) => String(item.id ?? 'all')}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === item.id && styles.categoryChipTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      <ErrorMessage message={error} style={styles.errorBox} />
    </View>
  );

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        error={error}
        ErrorMessage={ErrorMessage}
        showCategories={false}
      />
      <FlatList
        data={trendingArticles}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            onPress={() => navigation.navigate('ArticleDetail', { id: item.id, slug: item.slug })}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={styles.empty}>No trending articles found.</Text>}
        ListFooterComponent={loadingMore ? <Loader style={styles.footerLoader} /> : null}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    marginBottom: spacing.md,
  },
  trendingTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  categoryList: { paddingBottom: spacing.md, gap: spacing.sm },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
  categoryChipTextActive: { color: colors.text.inverse, fontWeight: typography.fontWeight.semibold },
  empty: { textAlign: 'center', color: colors.text.muted, marginTop: spacing.xl },
  footerLoader: { flex: 0, paddingVertical: spacing.md },
  errorBox: { marginBottom: spacing.sm },
});
