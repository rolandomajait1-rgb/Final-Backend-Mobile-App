import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArticleCard } from '../../components/articles';
import { Loader, ErrorMessage } from '../../components/common';
import HomeHeader from '../../components/home/HomeHeader';
import { getArticles } from '../../api/services/articleService';
import { getCategories } from '../../api/services/categoryService';
import { colors } from '../../styles';

export default function HomeScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
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

  const fetchArticles = useCallback(async (pageNum = 1, categoryId = selectedCategory, replace = true) => {
    try {
      const params = { limit: 10, page: pageNum };
      if (categoryId) params.category = categoryId;
      const res = await getArticles(params);
      const data = res.data?.data ?? res.data ?? [];
      const lastPage = res.data?.last_page ?? 1;
      setArticles(prev => replace ? data : [...prev, ...data]);
      setHasMore(pageNum < lastPage);
      setPage(pageNum);
    } catch (e) {
      setError('Failed to load articles. Pull down to retry.');
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchArticles(1, selectedCategory, true).finally(() => setLoading(false));
  }, [selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await fetchArticles(1, selectedCategory, true);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchArticles(page + 1, selectedCategory, false);
    setLoadingMore(false);
  };

  if (loading) return <Loader />;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <HomeHeader
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        error={error}
        ErrorMessage={ErrorMessage}
      />
      <FlatList
        data={articles}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            onPress={() => navigation.navigate('ArticleDetail', { id: item.id, slug: item.slug })}
          />
        )}
        ListEmptyComponent={<Text className="text-center text-gray-500 mt-12">No articles found.</Text>}
        ListFooterComponent={loadingMore ? <Loader style={{ flex: 0, paddingVertical: 12 }} /> : null}
        contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
      />
    </SafeAreaView>
  );
}
