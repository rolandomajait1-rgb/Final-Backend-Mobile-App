import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Loader, ErrorMessage } from '../../components/common';
import HomeHeader from '../../components/home/HomeHeader';
import { useArticles } from '../../context/ArticleContext';
import { getArticles } from '../../api/services/articleService';
import { getCategories } from '../../api/services/categoryService';
import { colors } from '../../styles';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const { latestArticles, historicalArticles, loading: articlesLoading, refreshArticles } = useArticles();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [articles, setArticles] = useState([]);

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
  }, [selectedCategory, fetchArticles]);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await Promise.all([
      fetchArticles(1, selectedCategory, true),
      refreshArticles()
    ]);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchArticles(page + 1, selectedCategory, false);
    setLoadingMore(false);
  };

  const renderHeader = () => (
    <View>
      <HomeHeader
        categories={categories}
        onCategorySelect={setSelectedCategory}
        onMenuPress={() => {
          // Handle menu press
        }}
        onSearchPress={() => {
          // Handle search press
        }}
        onGridPress={() => {
          // Handle grid press
        }}
        onSearch={(query) => {
          // Handle search
        }}
      />
    </View>
  );

  if (loading) return <Loader />;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        {renderHeader()}

        {/* Recent Section */}
        <View className="px-4 mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-4 mt-4 ">Latest Articles</Text>
          {latestArticles.length > 0 ? (
            <View className="gap-4">
              {latestArticles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  onPress={() => navigation.navigate('ArticleDetail', { id: article.id, slug: article.slug })}
                  className="rounded-2xl overflow-hidden bg-blue-200 h-56 relative"
                >
                  <View className="absolute top-3 right-3 z-10">
                    <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
                  </View>
                  <View className="flex-1 justify-center items-center">
                    <Ionicons name="image" size={60} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text className="text-center text-gray-500 my-4">No recent articles</Text>
          )}
        </View>

        {/* Engraved By History Section */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-1">Engraved By History</Text>
          <Text className="text-sm text-gray-500 mb-4">#insert hashtag</Text>
          {historicalArticles.length > 0 ? (
            <View className="gap-4">
              {historicalArticles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  onPress={() => navigation.navigate('ArticleDetail', { id: article.id, slug: article.slug })}
                  className="flex-row items-start gap-3 pb-4 border-b border-gray-200"
                >
                  <View className="w-16 h-16 bg-gray-300 rounded-lg justify-center items-center flex-shrink-0">
                    <Ionicons name="image" size={30} color="#D1D5DB" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-900 mb-1">{article.title}</Text>
                    {article.category && (
                      <Text className="text-xs font-semibold text-green-600 mb-1 uppercase">{article.category.name}</Text>
                    )}
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs text-gray-600">{article.author?.name || 'Unknown Author'}</Text>
                      <Text className="text-xs text-gray-500">1hr ago</Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text className="text-center text-gray-500 my-4">No historical articles</Text>
          )}
        </View>

        {/* Load More Button */}
        {hasMore && (
          <View className="items-center mb-8">
            <TouchableOpacity
              onPress={onLoadMore}
              disabled={loadingMore}
              className="py-2"
            >
              <Text className="text-blue-500 font-semibold text-base">
                {loadingMore ? 'Loading...' : 'Load More'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
