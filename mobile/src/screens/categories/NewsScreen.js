import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList,
  RefreshControl, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ArticleCard } from '../../components/articles';
import { Loader, ErrorMessage } from '../../components/common';
import { getArticles } from '../../api/services/articleService';
import { getCategories } from '../../api/services/categoryService';
import { colors } from '../../styles';

export default function NewsScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('news');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const defaultCategories = [
    { id: 'news', name: 'News' },
    { id: 'features', name: 'Features' },
    { id: 'sports', name: 'Sports' },
    { id: 'literary', name: 'Literary' },
    { id: 'specials', name: 'Specials' },
    { id: 'opinion', name: 'Opinion' },
    { id: 'art', name: 'Art' },
  ];

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      const categoryList = res.data ?? [];
      setCategories(categoryList);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchArticles = useCallback(async (pageNum = 1, categoryId = selectedCategory, replace = true) => {
    try {
      const params = { limit: 10, page: pageNum, category: categoryId };
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
    await fetchArticles(1, selectedCategory, true);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchArticles(page + 1, selectedCategory, false);
    setLoadingMore(false);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowCategoryModal(false);
  };

  const renderHeader = () => (
    <View>
      <View className="bg-blue-900 py-6 px-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
          <Ionicons name="reorder-three" size={32} color="white" />
        </TouchableOpacity>
        <Text className="text-4xl font-bold text-white">NEWS</Text>
        <View style={{ width: 32 }} />
      </View>
    </View>
  );

  if (loading) return <Loader />;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <FlatList
        data={articles}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            onPress={() => navigation.navigate('ArticleDetail', { id: item.id, slug: item.slug })}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-center text-gray-500 text-lg">No articles found.</Text>
          </View>
        }
        ListFooterComponent={loadingMore ? <Loader style={{ flex: 0, paddingVertical: 12 }} /> : null}
        contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
      />
      {error && <ErrorMessage message={error} style={{ marginHorizontal: 12, marginBottom: 12 }} />}

      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="flex-1 bg-white rounded-t-3xl mt-auto">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories.length > 0 ? categories : defaultCategories}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="p-4 border-b border-gray-100 flex-row justify-between items-center"
                  onPress={() => handleCategorySelect(item.id)}
                >
                  <Text className="text-lg" style={{ color: selectedCategory === item.id ? colors.primary : colors.text.primary }}>
                    {item.name}
                  </Text>
                  {selectedCategory === item.id && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
