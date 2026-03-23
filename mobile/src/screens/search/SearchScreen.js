import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from '../../utils/axiosConfig';
import { colors } from '../../styles';
import ArticleCard from '../../components/ArticleCard';
import { getAuthorName } from '../../utils/auth';

const SEARCH_CONFIG = {
  DEBOUNCE_MS: 300,
  MIN_QUERY_LENGTH: 3,
  MAX_RESULTS: 20,
};

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimer = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const performSearch = async (searchQuery) => {
      if (searchQuery.trim().length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        setLoading(true);
        setError(null);

        try {
          const response = await axios.get('/api/articles/search', {
            params: { q: searchQuery },
          });
          setResults(response.data.data || []);
        } catch (err) {
          console.error('Error searching articles:', err);
          setError('Failed to search articles. Please try again.');
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setLoading(false);
        setError(null);
      }
    };

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, SEARCH_CONFIG.DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const handleSearchSubmit = async () => {
    if (query.trim().length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get('/api/articles/search', {
          params: { q: query },
        });
        setResults(response.data.data || []);
      } catch (err) {
        console.error('Error searching articles:', err);
        setError('Failed to search articles. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleArticlePress = (slug) => {
    navigation.navigate('ArticleDetail', { slug });
  };

  const renderLoadingState = () => (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="mt-4 text-gray-600">Searching articles...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View className="flex-1 justify-center items-center px-4">
      <Ionicons name="alert-circle" size={48} color={colors.error} />
      <Text className="mt-4 text-lg font-semibold text-gray-800 text-center">
        {error}
      </Text>
      <TouchableOpacity
        className="mt-6 px-6 py-3 rounded-lg"
        style={{ backgroundColor: colors.primary }}
        onPress={handleSearchSubmit}
      >
        <Text className="text-white font-semibold">Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-4">
      <Image
        source={require('../../../assets/logo.png')}
        style={{ width: 60, height: 60 }}
        resizeMode="contain"
      />
      <Text className="mt-6 text-2xl font-bold text-gray-800 text-center">
        {query.trim().length > 0
          ? `No articles found for "${query}"`
          : 'Start Searching'}
      </Text>
      <Text className="mt-2 text-gray-600 text-center">
        {query.trim().length > 0
          ? 'Try adjusting your search terms.'
          : 'Enter keywords to find articles.'}
      </Text>
    </View>
  );

  const renderResultItem = ({ item }) => (
    <ArticleCard
      articleId={item.id}
      imageUrl={item.featured_image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
      title={item.title}
      excerpt={item.excerpt}
      category={
        item.categories && item.categories.length > 0
          ? item.categories[0].name
          : 'Uncategorized'
      }
      author={getAuthorName(item)}
      date={new Date(item.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}
      slug={item.slug}
      onPress={() => handleArticlePress(item.slug)}
    />
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <View className="flex-1">
        {/* Search Header */}
        <View
          className="px-4 py-4 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View className="flex-1 flex-row items-center px-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <Ionicons name="search" size={20} color={colors.primary} />
              <TextInput
                ref={inputRef}
                className="flex-1 ml-2 py-2 text-base"
                placeholder="Search articles..."
                placeholderTextColor={colors.textSecondary}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                autoFocus
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Search Results */}
        {loading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : results.length > 0 ? (
          <FlatList
            data={results.slice(0, SEARCH_CONFIG.MAX_RESULTS)}
            renderItem={renderResultItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 12, gap: 12 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
}
