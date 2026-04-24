import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Share,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { searchArticles } from '../../api/services/articleService';
import { useSearch } from '../../context/SearchContext';
import { colors } from '../../styles';
import ResultItem from './ResultItem';
import CopyFeedback from './CopyFeedback';

const SEARCH_CONFIG = {
  DEBOUNCE_MS: 300,        // debounce for full search
  SUGGEST_DEBOUNCE_MS: 100, // faster debounce for suggestions
  MIN_QUERY_LENGTH: 3,
  MAX_RESULTS: 20,
  MAX_SUGGESTIONS: 6,
};

// ── Suggestion Row ──────────────────────────────────────────────────────────
const SuggestionRow = React.memo(({ item, query, onPress }) => {
  const title = item.title || '';
  const category = item.categories?.[0]?.name || 'Article';

  // Bold the matching portion of the title
  const lowerTitle = title.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIdx = lowerTitle.indexOf(lowerQuery);

  let titleNode;
  if (matchIdx !== -1 && query.length > 0) {
    titleNode = (
      <Text className="text-gray-800 text-[14px] flex-1" numberOfLines={1}>
        {title.slice(0, matchIdx)}
        <Text style={{ fontWeight: '700', color: colors.primary }}>
          {title.slice(matchIdx, matchIdx + query.length)}
        </Text>
        {title.slice(matchIdx + query.length)}
      </Text>
    );
  } else {
    titleNode = (
      <Text className="text-gray-800 text-[14px] flex-1" numberOfLines={1}>
        {title}
      </Text>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
    >
      <Ionicons name="search-outline" size={15} color={colors.textSecondary} style={{ marginRight: 10 }} />
      {titleNode}
      <View
        className="ml-2 px-2 py-0.5 rounded-full"
        style={{ backgroundColor: colors.primary + '20' }}
      >
        <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '600' }}>
          {category}
        </Text>
      </View>
      <Ionicons name="arrow-forward-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
});
SuggestionRow.displayName = 'SuggestionRow';

// ── Main Modal ───────────────────────────────────────────────────────────────
export default function SearchModal() {
  const navigation = useNavigation();
  const { isSearchModalVisible, closeSearchModal } = useSearch();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);  // fast, title-only list
  const [results, setResults] = useState([]);           // full cards
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true); // true = suggestion mode
  const [error, setError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState({ visible: false, message: '', type: 'success' });

  const suggestTimer = useRef(null);
  const searchTimer = useRef(null);
  const inputRef = useRef(null);
  const feedbackTimer = useRef(null);
  const suggestionAnim = useRef(new Animated.Value(0)).current;

  // Focus input when modal opens
  useEffect(() => {
    if (isSearchModalVisible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset on close
      setQuery('');
      setSuggestions([]);
      setResults([]);
      setShowSuggestions(true);
      setError(null);
    }
  }, [isSearchModalVisible]);

  // Animate suggestion list in/out
  useEffect(() => {
    Animated.timing(suggestionAnim, {
      toValue: showSuggestions && suggestions.length > 0 ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [showSuggestions, suggestions.length, suggestionAnim]);

  // ── Fetch suggestions (fast, lightweight) ──────────────────────────────────
  const fetchSuggestions = useCallback(async (q) => {
    if (q.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const response = await searchArticles(q.trim(), { per_page: SEARCH_CONFIG.MAX_SUGGESTIONS });
      const data = response.data?.data ?? response.data ?? [];
      setSuggestions(data.slice(0, SEARCH_CONFIG.MAX_SUGGESTIONS));
    } catch (_err) {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // ── Fetch full results (slower, full cards) ────────────────────────────────
  const fetchResults = useCallback(async (q) => {
    if (q.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }
    setLoadingResults(true);
    setError(null);
    try {
      const response = await searchArticles(q.trim());
      setResults(response.data?.data ?? response.data ?? []);
    } catch (_err) {
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoadingResults(false);
    }
  }, []);

  // ── Handle text changes — dual debounce ───────────────────────────────────
  const handleTextChange = (text) => {
    setQuery(text);
    setShowSuggestions(true); // back to suggestion mode on new input

    // Fast: suggestions
    clearTimeout(suggestTimer.current);
    if (text.trim().length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      suggestTimer.current = setTimeout(() => fetchSuggestions(text), SEARCH_CONFIG.SUGGEST_DEBOUNCE_MS);
    } else {
      setSuggestions([]);
      setResults([]);
    }

    // Slow: full results
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchResults(text), SEARCH_CONFIG.DEBOUNCE_MS);
  };

  // ── Commit a suggestion → jump straight to results view ──────────────────
  const handleSuggestionPress = (article) => {
    Keyboard.dismiss();
    handleClose();
    navigation.navigate('ArticleStack', { screen: 'ArticleDetail', params: { slug: article.slug } });
  };

  // ── "See all results" or explicit submission ──────────────────────────────
  const handleCommitSearch = () => {
    if (!query.trim()) return;
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleClose = () => {
    setQuery('');
    setSuggestions([]);
    setResults([]);
    setError(null);
    setShowSuggestions(true);
    setCopyFeedback({ visible: false, message: '', type: 'success' });
    Keyboard.dismiss();
    closeSearchModal();
  };

  const handleCopy = async (article) => {
    try {
      const url = `${process.env.EXPO_PUBLIC_APP_URL || 'https://ambersian.com'}/articles/${article.slug}`;
      const content = `${article.title}\n${url}`;
      await Share.share({ message: content, title: article.title });
      showCopyFeedback('Shared successfully', 'success');
    } catch (err) {
      if (err.message !== 'User did not share') {
        showCopyFeedback('Failed to share', 'error');
      }
    }
  };

  const showCopyFeedback = (message, type) => {
    setCopyFeedback({ visible: true, message, type });
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setCopyFeedback({ visible: false, message: '', type: 'success' });
    }, 2000);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const renderResultItem = ({ item }) => (
    <ResultItem
      article={item}
      onCopy={() => handleCopy(item)}
      onArticlePress={() => {
        handleClose();
        navigation.navigate('ArticleStack', { screen: 'ArticleDetail', params: { slug: item.slug } });
      }}
      onTagPress={(tagName) => {
        handleClose();
        navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName } });
      }}
      onAuthorPress={() => {
        if (item.author?.id || item.author_id) {
          handleClose();
          navigation.navigate('ArticleStack', {
            screen: 'AuthorProfile',
            params: {
              authorId: item.author?.id || item.author_id,
              authorName: item.display_author_name || item.author_name || item.author?.name,
            }
          });
        }
      }}
    />
  );

  const hasQuery = query.trim().length >= SEARCH_CONFIG.MIN_QUERY_LENGTH;
  const hasSuggestions = suggestions.length > 0;

  return (
    <Modal
      visible={isSearchModalVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View className="flex-1" style={{ backgroundColor: colors.background }}>

        {/* ── Search Header ─────────────────────────────────────────────── */}
        <View
          className="px-4 pt-12 pb-3 border-b bg-white"
          style={{ borderBottomColor: colors.border }}
        >
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={handleClose} className="p-1">
              <Ionicons name="close" size={26} color={colors.text} />
            </TouchableOpacity>

            <View
              className="flex-1 flex-row items-center px-3 rounded-full gap-2"
              style={{ backgroundColor: colors.surface || '#f3f4f6', height: 44 }}
            >
              <Ionicons name="search" size={18} color={colors.primary} />
              <TextInput
                ref={inputRef}
                className="flex-1 text-base py-0"
                style={{ color: colors.text }}
                placeholder="Search articles..."
                placeholderTextColor={colors.textSecondary}
                value={query}
                onChangeText={handleTextChange}
                onSubmitEditing={handleCommitSearch}
                returnKeyType="search"
                accessibilityLabel="Search articles"
              />
              {loadingSuggestions && hasQuery && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
              {query.length > 0 && !loadingSuggestions && (
                <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); setResults([]); }}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* ── Suggestions Overlay ───────────────────────────────────────── */}
        {showSuggestions && hasSuggestions && (
          <Animated.View
            style={{
              opacity: suggestionAnim,
              backgroundColor: '#fff',
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
            }}
          >
            {/* Suggestions header row */}
            <View className="flex-row items-center justify-between px-4 pt-3 pb-1">
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.8 }}>
                SUGGESTIONS
              </Text>
              <TouchableOpacity onPress={handleCommitSearch}>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                  See all results →
                </Text>
              </TouchableOpacity>
            </View>

            {suggestions.map((item) => (
              <SuggestionRow
                key={String(item.id)}
                item={item}
                query={query}
                onPress={() => handleSuggestionPress(item)}
              />
            ))}
          </Animated.View>
        )}

        {/* ── Full Results Area ─────────────────────────────────────────── */}
        {loadingResults && !hasSuggestions ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-4 text-gray-500">Searching articles...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center px-6">
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text className="mt-4 text-lg font-semibold text-gray-800 text-center">{error}</Text>
            <TouchableOpacity
              className="mt-6 px-6 py-3 rounded-full"
              style={{ backgroundColor: colors.primary }}
              onPress={() => fetchResults(query)}
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results.slice(0, SEARCH_CONFIG.MAX_RESULTS)}
            renderItem={renderResultItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 12, paddingBottom: 40, gap: 12 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              hasQuery ? (
                <View className="pb-2 pt-1">
                  <Text className="text-gray-500 text-sm">
                    {results.length} result{results.length !== 1 ? 's' : ''} for{' '}
                    <Text className="font-bold text-gray-800">&quot;{query}&quot;</Text>
                  </Text>
                </View>
              ) : null
            }
          />
        ) : (
          /* Empty / Idle state */
          <View className="flex-1 justify-center items-center px-6">
            <Ionicons
              name={hasQuery ? 'search' : 'search-outline'}
              size={56}
              color={colors.border}
            />
            <Text className="mt-6 text-xl font-semibold text-gray-700 text-center">
              {hasQuery ? `No results for "${query}"` : 'Search The Herald'}
            </Text>
            <Text className="mt-2 text-gray-400 text-center">
              {hasQuery
                ? 'Try different keywords'
                : 'Start typing to find articles, authors, or topics'}
            </Text>
          </View>
        )}

        {/* ── Copy / Share Feedback Toast ───────────────────────────────── */}
        <CopyFeedback
          visible={copyFeedback.visible}
          message={copyFeedback.message}
          type={copyFeedback.type}
        />
      </View>
    </Modal>
  );
}
