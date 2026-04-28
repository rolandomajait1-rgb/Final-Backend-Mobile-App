import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Loader } from "../../components/common";
import HomeHeader from "../homepage/HomeHeader";
import BottomNavigation from "../../components/common/BottomNavigation";
import { searchArticles } from "../../api/services/articleService";
import { getCategories } from "../../api/services/categoryService";
import { colors } from "../../styles";
import { handleAuthorPress } from "../../utils/authorNavigation";
import { handleCategoryPress } from "../../utils/categoryNavigation";
import { formatArticleDate } from "../../utils/dateUtils";
import ArticleLargeCard from "../../components/articles/ArticleLargeCard";
import { getResponsiveFontSize, getResponsiveSpacing, getResponsiveIconSize } from "../../utils/responsiveUtils";


const MIN_QUERY_LENGTH = 1;

export default function SearchScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState(route?.params?.initialQuery || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [categories, setCategories] = useState([]);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset state when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const newInitialQuery = route?.params?.initialQuery || '';
      
      if (!newInitialQuery) {
        // Reset to clean state when no initial query
        setQuery('');
        setResults([]);
        setLoading(false);
        setSearched(false);
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(
    () => () => {
      clearTimeout(debounceRef.current);
      requestIdRef.current += 1;
    },
    [],
  );

  useEffect(() => {
    const initQ = route?.params?.initialQuery;
    if (initQ) {
      setQuery(initQ);
      if (initQ.trim().length >= MIN_QUERY_LENGTH) {
        doSearch(initQ);
      }
    }
  }, [route?.params?.initialQuery, doSearch]);

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      const categoryList = Array.isArray(response.data)
        ? response.data
        : (response.data?.data ?? []);
      const allowedCategories = [
        "News",
        "Literary",
        "Opinion",
        "Sports",
        "Features",
        "Specials",
        "Art",
      ];
      const filteredCategories = categoryList.filter((cat) =>
        allowedCategories.includes(cat.name),
      );
      setCategories(filteredCategories);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const doSearch = useCallback(async (text) => {
    const normalizedQuery = text.trim().toLowerCase().replace(/^#/, '');
    const requestId = ++requestIdRef.current;

    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await searchArticles(normalizedQuery);

      if (requestId !== requestIdRef.current) {
        return;
      }

      let nextResults = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      // Note: Backend should be configured to handle searching by title, 
      // author name, category, and tags to prevent downloading the entire database.

      setResults(nextResults);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error("Search error:", err);
      setResults([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const handleSearch = (text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);

    if (text.trim().length < MIN_QUERY_LENGTH) {
      requestIdRef.current += 1;
      setLoading(false);
      // Don't clear results - keep the last search results visible
      // setResults([]);
      // setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      doSearch(text);
    }, 300);
  };

  const handleArticlePress = (article) => {
    navigation.navigate("ArticleStack", { screen: "ArticleDetail", params: { slug: article.slug, article } });
  };


  const trimmedQuery = query.trim();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style="dark" hidden={false} />

      <View className="flex-shrink-0 bg-white">
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          navigation={navigation}
          onSearch={handleSearch}
          searchQuery={query}
          isSearchScreen={true}
          onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: getResponsiveSpacing(14, width), marginBottom: getResponsiveSpacing(16, width) }}>
            <ArticleLargeCard
              title={item.title}
              category={item.categories?.[0]?.name}
              hashtags={item.tags?.map((t) => t.name) || []}
              author={
                item.author_name || item.author?.name || item.author?.user?.name || "Unknown Author"
              }
              date={formatArticleDate(item.created_at || item.published_at)}
              image={item.featured_image_url || item.featured_image}
              onPress={() => handleArticlePress(item)}
              onTagPress={(tagName) =>
                navigation.navigate("ArticleStack", { screen: "TagArticles", params: { tagName } })
              }
              onAuthorPress={() => handleAuthorPress(item, navigation)}
              onCategoryPress={(category) => handleCategoryPress(category, navigation)}
            />
          </View>
        )}
        contentContainerStyle={{
          paddingTop: getResponsiveSpacing(20, width),
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          results.length > 0 ? (
            <View style={{ paddingHorizontal: getResponsiveSpacing(14 , width), paddingBottom: getResponsiveSpacing(16, width) }}>
              <Text style={{ fontSize: getResponsiveFontSize(20, width), fontWeight: 'bold', color: '#1f3b4d' }}>
                Search Results for "{query}"
              </Text>
              <Text style={{ fontSize: getResponsiveFontSize(14, width), color: '#64748b', marginTop: getResponsiveSpacing(4, width) }}>
                Found {results.length} article{results.length !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ paddingHorizontal: getResponsiveSpacing(24, width), marginTop: getResponsiveSpacing(40, width) }}>
            {loading ? (
              <View className="items-center">
                <Loader />
                <Text style={{ marginTop: getResponsiveSpacing(16, width), fontSize: getResponsiveFontSize(14, width), color: '#64748b' }}>
                  Searching articles...
                </Text>
              </View>
            ) : searched ? (
              <View className="items-center py-8">
                <Ionicons name="document-text-outline" size={getResponsiveIconSize(48, width)} color="#9ca3af" />
                <Text style={{ 
                  marginTop: getResponsiveSpacing(16, width), 
                  textAlign: 'center', 
                  fontSize: getResponsiveFontSize(18, width), 
                  fontWeight: '600', 
                  color: '#4b5563' 
                }}>
                  No results for "{trimmedQuery}"
                </Text>
                <Text style={{ 
                  marginTop: getResponsiveSpacing(8, width), 
                  textAlign: 'center', 
                  fontSize: getResponsiveFontSize(14, width), 
                  color: '#64748b', 
                }}>
                  Try a different keyword, author name, category, or tag to widen the search.
                </Text>
              </View>
          ) : query.trim().length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="search-outline" size={getResponsiveIconSize(64, width)} color="#e2e8f0" />
              <Text style={{ 
                marginTop: getResponsiveSpacing(16, width), 
                textAlign: 'center', 
                fontSize: getResponsiveFontSize(18, width), 
                fontWeight: '600', 
                color: '#9ca3af' 
              }}>
                Search The Herald
              </Text>
              <Text style={{ 
                marginTop: getResponsiveSpacing(8, width), 
                textAlign: 'center', 
                fontSize: getResponsiveFontSize(14, width), 
                color: '#9ca3af', 
              }}>
                Find articles by title, author, category, or #tags
              </Text>
            </View>
            ) : null}
          </View>
        }
      />

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation navigation={navigation} activeTab={null} />
      </View>
    </View>
  );
}
