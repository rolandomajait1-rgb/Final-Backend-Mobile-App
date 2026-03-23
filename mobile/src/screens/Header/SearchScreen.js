import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet,
  TouchableOpacity, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ArticleCard } from '../../components/articles';
import { Loader, ErrorMessage } from '../../components/common';
import { searchArticles } from '../../api/services/articleService';
import { colors, typography, spacing } from '../../styles';

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
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
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
            <Ionicons name="text-bubble-outlinefill" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      <ErrorMessage message={error} style={{ marginHorizontal: spacing.md }} />

      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ArticleCard
              article={item}
              onPress={() => navigation.navigate('ArticleDetail', { id: item.id, slug: item.slug })}
            />
          )}
          ListEmptyComponent={
            searched ? (
              <Text style={styles.empty}>No results for "{query}"</Text>
            ) : (
              <Text style={styles.hint}>Type at least 3 characters to search</Text>
            )
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: spacing.md, paddingHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, height: 44 },
  searchIcon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: typography.fontSize.base, color: colors.text.primary },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  empty: { textAlign: 'center', color: colors.text.muted, marginTop: spacing.xl, fontSize: typography.fontSize.base },
  hint: { textAlign: 'center', color: colors.text.muted, marginTop: spacing.xl, fontSize: typography.fontSize.sm },
});
