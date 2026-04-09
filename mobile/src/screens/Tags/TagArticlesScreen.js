import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { colors } from '../../styles';
import ArticleLargeCard from '../../components/articles/ArticleLargeCard';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';

export default function TagArticlesScreen({ route, navigation }) {
  const { tagName, authorId, authorName } = route.params;
  
  console.log('TagArticlesScreen mounted with params:', { tagName, authorId, authorName });
  
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchTagArticles();
  }, [tagName]);

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

  const fetchTagArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching articles for tag:', tagName);
      console.log('Author ID filter:', authorId);
      
      const params = { tag: tagName };
      
      // If authorId is provided, filter by author too
      if (authorId) {
        console.log('Filtering by author:', authorId);
        // Fetch author's articles first, then filter by tag on client side
        const response = await client.get(`/api/articles/author-public/${authorId}`);
        const allAuthorArticles = response.data.articles?.data || response.data.articles || [];
        
        console.log('Total author articles:', allAuthorArticles.length);
        
        // Filter articles that have the specific tag
        const filteredArticles = allAuthorArticles.filter(article => {
          const hasTags = article.tags?.some(tag => {
            console.log('Comparing tag:', tag.name, 'with:', tagName);
            return tag.name.toLowerCase() === tagName.toLowerCase();
          });
          return hasTags;
        });
        
        console.log('Filtered articles with tag:', filteredArticles.length);
        setArticles(filteredArticles);
      } else {
        console.log('Fetching all articles with tag (no author filter)');
        console.log('Tag parameter:', tagName);
        console.log('Tag type:', typeof tagName);
        
        const url = `/api/articles/public?tag=${encodeURIComponent(tagName)}`;
        console.log('Request URL:', url);
        
        const response = await client.get(url);
        console.log('Full response URL:', response.request?.responseURL || response.config.url);
        console.log('API response:', response.data);
        const articlesData = response.data.data || response.data || [];
        console.log('Articles found:', articlesData.length);
        
        // Log first article's tags to verify
        if (articlesData.length > 0 && articlesData[0].tags) {
          console.log('First article tags:', articlesData[0].tags.map(t => t.name));
        }
        
        setArticles(articlesData);
      }
    } catch (err) {
      console.error(`Error fetching articles for tag ${tagName}:`, err);
      setError(`Failed to load articles for #${tagName}`);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTagArticles();
    setRefreshing(false);
  };

  const handleArticlePress = (article) => {
    navigation.navigate('ArticleDetail', { slug: article.slug });
  };

  const renderLoadingState = () => (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="mt-4" style={{ color: colors.textSecondary }}>
        Loading articles...
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-4">
      <Ionicons name="pricetag-outline" size={64} color={colors.border} />
      <Text className="text-2xl font-bold mt-6 text-center" style={{ color: colors.text }}>
        No Articles Found
      </Text>
      <Text className="text-center mt-2" style={{ color: colors.textSecondary }}>
        No articles with #{tagName} tag yet.
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-shrink-0">
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          navigation={navigation}
        />
      </View>

      {/* Tag Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              #{tagName}
            </Text>
            {authorName && (
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                by {authorName}
              </Text>
            )}
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {articles.length} {articles.length === 1 ? 'article' : 'articles'}
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        renderLoadingState()
      ) : error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text className="mt-4 text-center" style={{ color: colors.error }}>
            {error}
          </Text>
          <TouchableOpacity
            className="mt-6 px-6 py-3 rounded-lg"
            style={{ backgroundColor: colors.primary }}
            onPress={fetchTagArticles}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : articles.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View className="px-4">
              <ArticleLargeCard
                title={item.title}
                category={item.categories?.[0]?.name || 'Uncategorized'}
                author={item.author_name || item.author?.name || item.author?.user?.name || 'Unknown Author'}
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
                hashtags={item.tags?.map((t) => t.name) || []}
                onPress={() => handleArticlePress(item)}
                onMenuPress={() => {}}
                onTagPress={(tag) => {
                  // Navigate to another tag if clicked
                  navigation.push('TagArticles', { tagName: tag });
                }}
                onAuthorPress={() => {
                  if (item.author?.id) {
                    navigation.navigate('AuthorProfile', {
                      authorId: item.author.id,
                      authorName: item.author.name || item.author.user?.name
                    });
                  }
                }}
              />
            </View>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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
