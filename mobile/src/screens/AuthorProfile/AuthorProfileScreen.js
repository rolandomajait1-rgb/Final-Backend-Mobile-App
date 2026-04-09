import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { colors } from '../../styles';
import ArticleMediumCard from '../../components/articles/ArticleMediumCard';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';

const LOGO = require('../../../assets/logo.png');

export default function AuthorProfileScreen({ route, navigation }) {
  const { authorId, authorName } = route.params;
  const [articles, setArticles] = useState([]);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchAuthorArticles();
  }, [authorId]);

  const fetchCategories = async () => {
    try {
      const response = await client.get('/api/categories');
      const allowedCategories = ['News', 'Literary', 'Opinion', 'Sports', 'Features', 'Specials', 'Art'];
      const filteredCategories = (response.data ?? []).filter(cat => allowedCategories.includes(cat.name));
      setCategories(filteredCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchAuthorArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching articles for author ID:', authorId);
      
      const response = await client.get(`/api/articles/author-public/${authorId}`);
      console.log('Full API response:', response.data);
      
      // The API returns { articles: {...}, article_count: X, author: {...} }
      // articles is a paginated object with 'data' property
      let articlesData = [];
      
      if (response.data.articles) {
        if (response.data.articles.data) {
          // Paginated response
          articlesData = response.data.articles.data;
        } else if (Array.isArray(response.data.articles)) {
          // Direct array
          articlesData = response.data.articles;
        }
      }
      
      console.log('Extracted articles:', articlesData);
      console.log('Number of articles:', articlesData.length);
      setArticles(articlesData);
      
      // Get author info from response
      if (response.data.author) {
        console.log('Author from API:', response.data.author);
        setAuthor(response.data.author);
      } else if (articlesData.length > 0 && articlesData[0].author) {
        console.log('Author from first article:', articlesData[0].author);
        setAuthor(articlesData[0].author);
      }
    } catch (err) {
      console.error(`Error fetching articles for author ${authorId}:`, err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.message);
      
      if (err.message === 'Network Error') {
        setError('Cannot connect to server. Please check your internet connection.');
      } else if (err.response?.status === 404) {
        setError('Author not found or has no articles.');
      } else {
        setError(`Failed to load articles: ${err.response?.data?.error || err.message}`);
      }
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAuthorArticles();
    setRefreshing(false);
  };

  const handleArticlePress = (article) => {
    navigation.navigate('ArticleDetail', { slug: article.slug });
  };

  const renderHeader = () => (
    <View>
      {/* Author Info Header */}
      <View className="px-4 py-6" style={{ backgroundColor: colors.primary }}>
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="w-20 h-20 rounded-full bg-white items-center justify-center mr-4 border-4" style={{ borderColor: '#d4af37' }}>
            <Image source={LOGO} style={{ width: 60, height: 60 }} resizeMode="contain" />
          </View>
          <View className="flex-1">
            <Text className="text-3xl font-bold text-white">
              {author?.user?.name || authorName || 'Author'}
            </Text>
            <Text className="text-sm text-white opacity-80 mt-1">
              Articles Found: {articles.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Latest Articles Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-300">
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>
          Latest Articles
        </Text>
      </View>
    </View>
  );

  const renderLoadingState = () => (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="mt-4" style={{ color: colors.textSecondary }}>
        Loading articles...
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-4 py-12">
      <Ionicons name="document-text-outline" size={64} color={colors.border} />
      <Text className="text-2xl font-bold mt-6 text-center" style={{ color: colors.text }}>
        No Articles Yet
      </Text>
      <Text className="text-center mt-2" style={{ color: colors.textSecondary }}>
        This author hasn't published any articles yet.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <HomeHeader categories={categories} navigation={navigation} />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-shrink-0">
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          navigation={navigation}
        />
      </View>

      {error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text className="mt-4 text-center" style={{ color: colors.error }}>
            {error}
          </Text>
          <TouchableOpacity
            className="mt-6 px-6 py-3 rounded-lg"
            style={{ backgroundColor: colors.primary }}
            onPress={fetchAuthorArticles}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View className="px-4">
              <ArticleMediumCard
                title={item.title}
                category={item.categories?.[0]?.name || 'Uncategorized'}
                author={item.author?.user?.name || item.author?.name || authorName}
                date={(item.created_at || item.published_at)
                  ? new Date(item.created_at || item.published_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recently'}
                image={item.featured_image_url || item.featured_image}
                onPress={() => handleArticlePress(item)}
                onMenuPress={() => {}}
              />
            </View>
          )}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation navigation={navigation} activeTab="Home" />
      </View>
    </SafeAreaView>
  );
}
