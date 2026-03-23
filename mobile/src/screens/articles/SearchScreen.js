import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ArticleCard } from '../../components/articles';
import { Loader, ErrorMessage } from '../../components/common';
import HomeHeader from '../../components/home/HomeHeader';
import { searchArticles } from '../../api/services/articleService';
import { colors } from '../../styles';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 3) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await searchArticles(q.trim());
      setResults(res.data?.data ?? []);
      setSearched(true);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 500);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setError(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <HomeHeader
        onMenuPress={() => {}}
        onGridPress={() => {}}
        onSearch={() => {}}
      />
      <View className="flex-row items-center mx-4 my-3 px-4 bg-white rounded-lg border border-gray-200 h-11">
        <Ionicons name="search" size={18} color={colors.text.muted} />
        <TextInput
          className="flex-1 ml-2 text-gray-800"
          placeholder="Search articles..."
          placeholderTextColor={colors.text.muted}
          value={query}
          onChangeText={handleChange}
          returnKeyType="search"
          onSubmitEditing={() => { Keyboard.dismiss(); doSearch(query); }}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Ionicons name="close-circle" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      <ErrorMessage message={error} style={{ marginHorizontal: 16 }} />

      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <ArticleCard
              article={item}
              onPress={() => navigation.navigate('ArticleDetail', { id: item.id, slug: item.slug })}
            />
          )}
          ListEmptyComponent={
            searched ? (
              <Text className="text-center text-gray-500 mt-12">No results for "{query}"</Text>
            ) : (
              <Text className="text-center text-gray-400 mt-12 text-sm">Type at least 3 characters to search</Text>
            )
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}
