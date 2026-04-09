import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ArticleLargeCard from '../../components/articles/ArticleLargeCard';
import { Loader } from '../../components/common';
import BottomNavigation from '../../components/common/BottomNavigation';
import { getArticles } from '../../api/services/articleService';
import { getCategories } from '../../api/services/categoryService';
import { colors } from '../../styles';
import HomeHeader from '../homepage/HomeHeader';
import axios from '../../utils/axiosConfig';

export default function ExploreScreen({ navigation }) {
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null); // 'author', 'tag', 'category'
  const [authors, setAuthors] = useState([]);
  const [tags, setTags] = useState([]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      const allowedCategories = ['News', 'Literary', 'Opinion', 'Sports', 'Features', 'Specials', 'Art'];
      const filteredCategories = (response.data ?? []).filter(cat => allowedCategories.includes(cat.name));
      setCategories(filteredCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTrendingArticles = useCallback(async () => {
    try {
      setError(null);
      // Fetch articles and sort by view_count or created date
      const res = await getArticles({ limit: 20 });
      const data = res.data?.data ?? res.data ?? [];
      
      // Sort by view_count (trending) - articles with most views first
      const sorted = [...data].sort((a, b) => {
        const viewsA = a.view_count || 0;
        const viewsB = b.view_count || 0;
        return viewsB - viewsA;
      });
      
      setTrendingArticles(sorted);
      
      // Extract unique authors and tags from articles
      const uniqueAuthors = [];
      const uniqueTags = [];
      const authorIds = new Set();
      const tagNames = new Set();
      
      sorted.forEach(article => {
        if (article.author && !authorIds.has(article.author.id)) {
          authorIds.add(article.author.id);
          uniqueAuthors.push({
            id: article.author.id,
            name: article.author.user?.name || article.author.name || 'Unknown',
          });
        }
        
        article.tags?.forEach(tag => {
          if (!tagNames.has(tag.name)) {
            tagNames.add(tag.name);
            uniqueTags.push(tag);
          }
        });
      });
      
      setAuthors(uniqueAuthors);
      setTags(uniqueTags);
    } catch (e) {
      console.error('Error fetching trending articles:', e);
      setError('Failed to load trending articles. Pull down to retry.');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCategories();
      await fetchTrendingArticles();
      setLoading(false);
    };
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrendingArticles();
    setRefreshing(false);
  };

  const handleArticlePress = (article) => {
    navigation.navigate('ArticleDetail', { slug: article.slug });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <HomeHeader categories={categories} navigation={navigation} />
        <View className="flex-1 justify-center items-center">
          <Loader />
        </View>
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

      <FlatList
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
            {/* Filter Section */}
            <View className="px-4 py-4 bg-white border-b border-gray-200">
              <Text className="text-gray-500 text-xl font-bold mb-3 ml-3 tracing-widest">Filter</Text>
              <View className="flex-row gap-3 justify-center">
                <TouchableOpacity
                  className={`px-6 py-2 rounded-full border ${
                    selectedFilter === 'author' ? 'border-cyan-700 bg-gray-50' : 'border-gray-300 bg-white'
                  }`}
                  onPress={() => setSelectedFilter(selectedFilter === 'author' ? null : 'author')}
                >
                  <Text 
                    className={selectedFilter === 'author' ? 'text-cyan-700' : 'text-gray-600'}
                    style={{ letterSpacing: 1 }}
                  >
                    Author
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-10 py-2 rounded-full border ${
                    selectedFilter === 'tag' ? 'border-cyan-700 bg-gray-50' : 'border-gray-300 bg-white'
                  }`}
                  onPress={() => setSelectedFilter(selectedFilter === 'tag' ? null : 'tag')}
                >
                  <Text 
                    className={selectedFilter === 'tag' ? 'text-cyan-700' : 'text-gray-600'}
                    style={{ letterSpacing: 1 }}
                  >
                    Tag
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-6 py-2 rounded-full border ${
                    selectedFilter === 'category' ? 'border-cyan-700 bg-gray-50' : 'border-gray-300 bg-white'
                  }`}
                  onPress={() => setSelectedFilter(selectedFilter === 'category' ? null : 'category')}
                >
                  <Text 
                    className={selectedFilter === 'category' ? 'text-cyan-700' : 'text-gray-600'}
                    style={{ letterSpacing: 1 }}
                  >
                    Category
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Show selected filter items as pills */}
              {selectedFilter && (
                <View className="mt-6">
                  <View className="flex-row flex-wrap gap-2">
                     {selectedFilter === 'author' && authors.map((author) => (
                      <TouchableOpacity
                        key={author.id}
                        className="px-4 py-1 rounded-full border border-gray-300 bg-white"
                        onPress={() => {
                          navigation.navigate('AuthorProfile', {
                            authorId: author.id,
                            authorName: author.name
                          });
                          setSelectedFilter(null);
                        }}
                      >
                        <Text className="text-gray-700">{author.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {selectedFilter === 'tag' && tags.map((tag) => (
                      <TouchableOpacity
                        key={tag.id}
                        className="px-4 py-1 rounded-full border border-gray-300 bg-white"
                        onPress={() => {
                          navigation.navigate('TagArticles', { tagName: tag.name });
                          setSelectedFilter(null);
                        }}
                      >
                        <Text className="text-gray-700">#{tag.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {selectedFilter === 'category' && categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        className="px-4 py-1 rounded-full border border-gray-300 bg-white"
                        onPress={() => {
                          const categoryScreenMap = {
                            'News': 'NewsScreen',
                            'Literary': 'LiteraryScreen',
                            'Opinion': 'OpinionScreen',
                            'Sports': 'SportsScreen',
                            'Features': 'FeaturesScreen',
                            'Specials': 'SpecialsScreen',
                            'Art': 'ArtScreen',
                          };
                          const screenName = categoryScreenMap[category.name];
                          if (screenName) {
                            navigation.navigate(screenName);
                          }
                          setSelectedFilter(null);
                        }}
                      >
                        <Text className="text-gray-700">{category.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Trending Articles Header */}
            <View className="px-4 py-4 border-b border-gray-200 bg-white">
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                Trending Articles
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Most viewed articles
              </Text>
            </View>
          </>
        }
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
                navigation.navigate('TagArticles', { tagName: tag });
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
        data={trendingArticles}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-4 py-12">
            <Text className="text-center text-gray-500 text-lg">
              No trending articles yet
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation navigation={navigation} activeTab="Explore" />
      </View>
    </SafeAreaView>
  );
}
