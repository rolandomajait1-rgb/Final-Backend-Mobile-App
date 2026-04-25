import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Loader } from '../../components/common';
import HomeHeader from '../homepage/HomeHeader';
import { useArticles } from '../../context/ArticleContext';
import { getArticles } from '../../api/services/articleService';
import { getCategories } from '../../api/services/categoryService';
import { colors } from '../../styles';
import { Ionicons } from '@expo/vector-icons';
import { handleAuthorPress } from '../../utils/authorNavigation';

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { latestArticles, historicalArticles, refreshArticles } = useArticles();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // eslint-disable-next-line no-unused-vars
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
    } catch (_e) {
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
        <View className={`${width < 375 ? 'px-3' : 'px-4'} mb-6`}>
          <Text className={`${width < 375 ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mb-4 mt-4 `}>Latest Articles</Text>
          {latestArticles.length > 0 ? (
            <View className="gap-4">
              {latestArticles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  onPress={() => navigation.navigate('ArticleStack', { screen: 'ArticleDetail', params: { id: article.id, slug: article.slug } })}
                  className={`rounded-xl overflow-hidden bg-blue-200 ${width < 375 ? 'h-40' : 'h-56'} relative`}
                >
                  <View className={`absolute top-${width < 375 ? '2' : '3'} right-${width < 375 ? '2' : '3'} z-10`}>
                    <Ionicons name="ellipsis-vertical" size={width < 375 ? 16 : 20} color="#9CA3AF" />
                  </View>
                  <View className="flex-1 justify-center items-center">
                    <Ionicons name="image" size={width < 375 ? 48 : 60} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text className={`${width < 375 ? 'text-xs' : 'text-sm'} text-center text-gray-500 my-4`}>No recent articles</Text>
          )}
        </View>

        {/* Engraved By History Section */}
        <View className={`${width < 375 ? 'px-3' : 'px-4'} mb-6`}>
          <Text className={`${width < 375 ? 'text-base' : 'text-lg'} font-bold text-gray-900 mb-1`}>Engraved By History</Text>
          <Text className={`${width < 375 ? 'text-xs' : 'text-sm'} text-gray-500 mb-4`}>#insert hashtag</Text>
          {historicalArticles.length > 0 ? (
            <View className="gap-4">
              {historicalArticles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  onPress={() => navigation.navigate('ArticleStack', { screen: 'ArticleDetail', params: { id: article.id, slug: article.slug } })}
                  className="flex-row items-start gap-3 pb-4 border-b border-gray-200"
                >
                  <View className={`${width < 375 ? 'w-12 h-12' : 'w-16 h-16'} bg-gray-300 rounded-lg justify-center items-center flex-shrink-0`}>
                    <Ionicons name="image" size={width < 375 ? 24 : 30} color="#D1D5DB" />
                  </View>
                  <View className="flex-1">
                    <Text className={`${width < 375 ? 'text-sm' : 'text-base'} font-bold text-gray-900 mb-1`}>{article.title}</Text>
                    {article.category && (
                      <Text className={`${width < 375 ? 'text-xs' : 'text-xs'} font-semibold text-green-600 mb-1 uppercase`}>{article.category.name}</Text>
                    )}
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity onPress={() => handleAuthorPress(article, navigation)}>
                        <Text className={`${width < 375 ? 'text-xs' : 'text-xs'} text-gray-600 underline`}>{article.author?.name || 'Unknown Author'}</Text>
                      </TouchableOpacity>
                      <Text className={`${width < 375 ? 'text-xs' : 'text-xs'} text-gray-500`}>1hr ago</Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="ellipsis-vertical" size={width < 375 ? 16 : 18} color="#9CA3AF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text className={`${width < 375 ? 'text-xs' : 'text-sm'} text-center text-gray-500 my-4`}>No historical articles</Text>
          )}
        </View>

        {/* Load More Button */}
        {hasMore && (
          <View className="items-center mb-8">
            <TouchableOpacity
              onPress={onLoadMore}
              disabled={loadingMore}
              className={`${width < 375 ? 'py-1' : 'py-2'}`}
            >
              <Text className={`${width < 375 ? 'text-sm' : 'text-base'} text-blue-500 font-semibold`}>
                {loadingMore ? 'Loading...' : 'Load More'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
