import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Clipboard } from 'react-native';
import axios from '../../utils/axiosConfig';
import { useSearch } from '../../context/SearchContext';
import { colors } from '../../styles';
import ResultItem from './ResultItem';
import CopyFeedback from './CopyFeedback';

const SEARCH_CONFIG = {
  DEBOUNCE_MS: 300,
  MIN_QUERY_LENGTH: 3,
  MAX_RESULTS: 20,
};

export default function SearchModal() {
  const { isSearchModalVisible, closeSearchModal } = useSearch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState({ visible: false, message: '', type: 'success' });
  const debounceTimer = useRef(null);
  const inputRef = useRef(null);
  const feedbackTimer = useRef(null);

  useEffect(() => {
    if (isSearchModalVisible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSearchModalVisible]);

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

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setCopyFeedback({ visible: false, message: '', type: 'success' });
    Keyboard.dismiss();
    closeSearchModal();
  };

  const handleCopy = async (article) => {
    try {
      const url = `${process.env.REACT_APP_ARTICLE_BASE_URL || 'https://app.example.com'}/articles/${article.slug}`;
      const content = `${article.title}\n${url}`;
      
      await Clipboard.setString(content);
      showCopyFeedback('Copied to clipboard', 'success');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      showCopyFeedback('Failed to copy', 'error');
    }
  };

  const showCopyFeedback = (message, type) => {
    setCopyFeedback({ visible: true, message, type });
    
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
    }

    feedbackTimer.current = setTimeout(() => {
      setCopyFeedback({ visible: false, message: '', type: 'success' });
    }, 2000);
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
        onPress={() => setQuery(query)}
      >
        <Text className="text-white font-semibold">Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-4">
      <Ionicons
        name={query.trim().length > 0 ? 'search' : 'search'}
        size={48}
        color={colors.textSecondary}
      />
      <Text className="mt-6 text-xl font-semibold text-gray-800 text-center">
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
    <ResultItem
      article={item}
      onCopy={() => handleCopy(item)}
    />
  );

  return (
    <Modal
      visible={isSearchModalVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Search Header */}
        <View
          className="px-4 py-4 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color={colors.text} />
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
                returnKeyType="search"
                accessibilityLabel="Search articles"
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

        {/* Copy Feedback Toast */}
        <CopyFeedback
          visible={copyFeedback.visible}
          message={copyFeedback.message}
          type={copyFeedback.type}
        />
      </View>
    </Modal>
  );
}
