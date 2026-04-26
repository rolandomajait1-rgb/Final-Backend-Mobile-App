import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Loader } from "../../components/common";
import HomeHeader from "../homepage/HomeHeader";
import BottomNavigation from "../../components/common/BottomNavigation";
import { searchArticles } from "../../api/services/articleService";
import { getCategories } from "../../api/services/categoryService";
import { colors } from "../../styles";
import { handleAuthorPress } from "../../utils/authorNavigation";


const MIN_QUERY_LENGTH = 3;
const BRAND_BLUE = "#075985";
const BAND_BLUE = "#2f7cf6";
const BRAND_YELLOW = "#f3b11d";
const FALLBACK_IMAGE =
  "https://via.placeholder.com/320x240/e2e8f0/64748b?text=Article";
const CARD_SHADOW = {
  elevation: 2,
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
};

const formatSearchDate = (value) => {
  if (!value) {
    return "Recently";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const SummaryCard = ({
  label,
  value,
  borderColor = BRAND_BLUE,
  valueColor = BRAND_BLUE,
}) => (
  <View
    className="flex-1 rounded-[18px] bg-white px-4 py-4"
    style={[CARD_SHADOW, { borderWidth: 2, borderColor }]}
  >
    <Text className="text-[13px] font-semibold text-slate-500">{label}</Text>
    <Text className="mt-5 text-[20px] font-bold" style={{ color: valueColor }}>
      {value}
    </Text>
  </View>
);

const SectionIndicator = () => (
  <View className="items-center mb-5">
    <View className="h-2 w-12 rounded-full bg-[#d9e8f3] overflow-hidden">
      <View className="h-2 w-5 rounded-full bg-[#075985]" />
    </View>
  </View>
);

const StatePanel = ({
  icon,
  title,
  description,
  borderColor = BRAND_BLUE,
  iconColor = BRAND_BLUE,
}) => (
  <View
    className="rounded-[18px] bg-white px-5 py-8 items-center"
    style={[CARD_SHADOW, { borderWidth: 2, borderColor }]}
  >
    <Ionicons name={icon} size={40} color={iconColor} />
    <Text className="mt-4 text-center text-[20px] font-bold text-[#1f3b4d]">
      {title}
    </Text>
    <Text className="mt-2 text-center text-[14px] text-slate-500 leading-6">
      {description}
    </Text>
  </View>
);

const SearchResultCard = ({ item, onOpenArticle, onOpenAuthor, onOpenTag }) => {
  const imageSource =
    item.featured_image_url || item.featured_image || FALLBACK_IMAGE;
  const category = item.categories?.[0]?.name || "Article";
  const authorId = item.author?.id || item.author_id;
  const authorName =
    item.author?.user?.name ||
    item.author?.name ||
    item.author_name ||
    "Unknown Author";
  const quickTag = item.tags?.[0]?.name;

  return (
    <View
      className="rounded-[18px] border border-slate-200 bg-white p-3"
      style={CARD_SHADOW}
    >
      <TouchableOpacity onPress={onOpenArticle} activeOpacity={0.85}>
        <View className="flex-row">
          <View className="w-24 h-24 rounded-[14px] overflow-hidden bg-slate-100 mr-3">
            <Image
              source={{ uri: imageSource }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>

          <View className="flex-1 justify-between">
            <View>
              <View
                className="self-start rounded-full px-2.5 py-1 mb-2"
                style={{ backgroundColor: "#edf6ff" }}
              >
                <Text
                  className="text-[10px] font-bold uppercase"
                  style={{ color: BRAND_BLUE }}
                >
                  {category}
                </Text>
              </View>
              <Text
                className="text-[16px] font-bold text-[#1b3346] leading-5"
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </View>

            <View>
              <TouchableOpacity 
                onPress={onOpenAuthor}
                disabled={!authorId}
                activeOpacity={0.7}
              >
                <Text className="text-[13px] font-semibold text-[#075985] underline">
                  {authorName}
                </Text>
              </TouchableOpacity>
              <Text className="mt-1 text-[12px] text-slate-500">
                {formatSearchDate(item.created_at || item.published_at)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
        <TouchableOpacity
          onPress={onOpenAuthor}
          disabled={!authorId}
          className="rounded-full px-3 py-2 bg-[#f6f8fb]"
        >
          <Text
            className="text-[12px] font-semibold"
            style={{ color: authorId ? BRAND_BLUE : "#9ca3af" }}
          >
            View author
          </Text>
        </TouchableOpacity>

        {quickTag ? (
          <TouchableOpacity
            onPress={() => onOpenTag(quickTag)}
            className="rounded-full px-3 py-2 bg-[#fff4da]"
          >
            <Text className="text-[12px] font-semibold text-[#c48900]">
              #{quickTag}
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="rounded-full px-3 py-2 bg-[#edf6ff]">
            <Text className="text-[12px] font-semibold text-[#075985]">
              Open article
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [categories, setCategories] = useState([]);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(
    () => () => {
      clearTimeout(debounceRef.current);
      requestIdRef.current += 1;
    },
    [],
  );

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
    const normalizedQuery = text.trim().toLowerCase();
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

      // If no exact results, filter by partial matches in tags, authors, categories
      if (nextResults.length === 0) {
        // Get all articles and filter locally
        try {
          const allArticlesResponse = await searchArticles('');
          const allArticles = Array.isArray(allArticlesResponse.data?.data)
            ? allArticlesResponse.data.data
            : Array.isArray(allArticlesResponse.data)
              ? allArticlesResponse.data
              : [];

          nextResults = allArticles.filter(article => {
            const titleMatch = article.title?.toLowerCase().includes(normalizedQuery);
            const authorMatch = (article.author?.user?.name || article.author?.name || article.author_name || '')
              .toLowerCase()
              .includes(normalizedQuery);
            const categoryMatch = article.categories?.some(cat =>
              cat.name?.toLowerCase().includes(normalizedQuery)
            );
            const tagMatch = article.tags?.some(tag =>
              tag.name?.toLowerCase().includes(normalizedQuery)
            );

            return titleMatch || authorMatch || categoryMatch || tagMatch;
          });
        } catch (err) {
          console.error('Error fetching all articles for filtering:', err);
        }
      }

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
      setResults([]);
      setSearched(false);
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
  const isTypingBelowMinimum =
    trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;

  const statusValue = loading
    ? "Searching"
    : searched
      ? `${results.length} found`
      : "Ready";
  const statusColor = loading
    ? BRAND_BLUE
    : searched
      ? results.length > 0
        ? "#16a34a"
        : BRAND_YELLOW
      : BRAND_BLUE;

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

      <View
        className="px-6 py-4"
        style={{
          backgroundColor: BAND_BLUE,
          borderBottomWidth: 1,
          borderBottomColor: "#2469d0",
        }}
      >
        <Text className="text-center text-[26px] font-bold text-white tracking-tight">
          Search Articles
        </Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View className="px-5 mb-4">
            <SearchResultCard
              item={item}
              onOpenArticle={() => handleArticlePress(item)}
              onOpenAuthor={() => handleAuthorPress(item)}
              onOpenTag={(tagName) =>
                navigation.navigate("ArticleStack", { screen: "TagArticles", params: { tagName } })
              }
            />
          </View>
        )}
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View className="flex-row gap-3 px-5">
              <SummaryCard
                label="Search Status"
                value={statusValue}
                valueColor={statusColor}
              />
              <SummaryCard
                label="Current Query"
                value={trimmedQuery || "Waiting"}
                borderColor={BRAND_YELLOW}
                valueColor={trimmedQuery ? "#111827" : "#94a3b8"}
              />
            </View>

            <SectionIndicator />

            <View
              className="mx-5 mb-5 rounded-[18px] bg-white px-4 py-4"
              style={[
                CARD_SHADOW,
                {
                  borderWidth: 2,
                  borderColor: loading || searched ? BRAND_BLUE : BRAND_YELLOW,
                },
              ]}
            >
              <Text
                className="text-[18px] font-bold"
                style={{ color: loading || searched ? BRAND_BLUE : "#c48900" }}
              >
                Article Search
              </Text>
              <Text className="mt-2 text-[13px] leading-5 text-slate-500">
                {loading
                  ? `Looking for matches for "${trimmedQuery}"...`
                  : isTypingBelowMinimum
                    ? `Enter at least ${MIN_QUERY_LENGTH} characters to start searching.`
                    : searched
                      ? `${results.length} article${results.length === 1 ? "" : "s"} matched your query.`
                      : "Search titles, authors, categories, and tags from one place."}
              </Text>
            </View>

            {results.length > 0 ? (
              <View
                className="mx-5 mb-4 rounded-[18px] bg-white px-4 py-4"
                style={[
                  CARD_SHADOW,
                  { borderWidth: 2, borderColor: BRAND_BLUE },
                ]}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-[18px] font-bold text-[#1f3b4d]">
                    Results
                  </Text>
                  <Text className="text-[13px] font-semibold text-slate-500">
                    {results.length} item{results.length === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View className="px-5">
            {loading ? (
              <View
                className="rounded-[18px] bg-white px-5 py-10 items-center"
                style={[
                  CARD_SHADOW,
                  { borderWidth: 2, borderColor: BRAND_BLUE },
                ]}
              >
                <Loader />
                <Text className="mt-4 text-[14px] text-slate-500">
                  Searching articles...
                </Text>
              </View>
            ) : isTypingBelowMinimum ? (
              <StatePanel
                icon="search-outline"
                title={`Type at least ${MIN_QUERY_LENGTH} characters`}
                description="The search waits for a slightly longer keyword so the results stay useful and relevant."
                borderColor={BRAND_YELLOW}
                iconColor={BRAND_YELLOW}
              />
            ) : searched ? (
              <StatePanel
                icon="document-text-outline"
                title={`No results for "${trimmedQuery}"`}
                description="Try a different keyword, author name, category, or tag to widen the search."
              />
            ) : (
              <StatePanel
                icon="sparkles-outline"
                title="Search The Herald"
                description="Start typing to find articles, topics, categories, and authors from the archive."
              />
            )}
          </View>
        }
      />

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation navigation={navigation} activeTab="Home" />
      </View>
    </View>
  );
}
