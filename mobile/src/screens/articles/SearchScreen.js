import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ArticleLargeCard from '../../components/articles/ArticleLargeCard';
import { Loader } from '../../components/common';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import { searchArticles } from '../../api/services/articleService';
import { colors } from '../../styles';
import axios from '../../utils/axiosConfig';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null); // 'author', 'tag', 'category'
  const [categories, setCategories] = useState([]);
  const debounceRef = useRef(null);

  React.useEffect(() => {
    fetchCategories();
  }, []);

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

  const doSearch = useCallback(async (q) => {
    console.log('doSearch called with:', q);
    if (q.trim().length < 3) {
      console.log('Query too short, clearing results');
      setResults([]);
      setSearched(false);
      return;
    }
    console.log('Starting search...');
    setLoading(true);
    setError(null);
    try {
      const res = await searchArticles(q.trim());
      console.log('Search results:', res.data);
      setResults(res.data?.data ?? []);
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (text) => {
    console.log('Search triggered with text:', text);
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      console.log('Executing search for:', text);
      doSearch(text);
    }, 500);
  };

  const handleArticlePress = (article) => {
    navigation.navigate('ArticleDetail', { slug: article.slug });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header with integrated search */}
      <View className="flex-shrink-0">
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          navigation={navigation}
          onSearch={handleSearch}
          searchQuery={query}
          isSearchScreen={true}
        />
      </View>

      {/* Search Results */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Loader />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={
            searched && query ? (
              <View className="px-4 py-4">
                <Text className="text-gray-600 text-base">
                  Search Results for : <Text className="font-bold text-gray-900">{query}</Text>
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View className="px-4">
              <ArticleLargeCard
                title={item.title}
                category={item.categories?.[0]?.name || 'Uncategorized'}
                author={item.author?.user?.name || item.author?.name || 'Unknown Author'}
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
          ListEmptyComponent={
            searched ? (
              <View className="flex-1 justify-center items-center px-4 py-12">
                <Ionicons name="search-outline" size={64} color={colors.border} />
                <Text className="text-center text-gray-500 mt-6 text-lg">
                  No results for "{query}"
                </Text>
                <Text className="text-center text-gray-400 mt-2">
                  Try different keywords or filters
                </Text>
              </View>
            ) : (
              <View className="flex-1 justify-center items-center px-4 py-12">
                <Ionicons name="search-outline" size={64} color={colors.border} />
                <Text className="text-center text-gray-400 mt-6">
                  Type at least 3 characters to search
                </Text>
              </View>
            )
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation navigation={navigation} activeTab="Home" />
      </View>
    </SafeAreaView>
  );
}
