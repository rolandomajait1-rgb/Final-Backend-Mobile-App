import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import client from "../../api/client";
import { colors } from "../../styles";
import ArticleLargeCard from "../../components/articles/ArticleLargeCard";
import HomeHeader from "../homepage/HomeHeader";
import BottomNavigation from "../../components/common/BottomNavigation";
import { getCategoryColor } from "../../utils/categoryColors";
import { LinearGradient } from "expo-linear-gradient";

const logo = require("../../../assets/logo.png");

const getAuthorName = (article) =>
  article.author_name ||
  article.author?.name ||
  article.author?.user?.name ||
  "Unknown Author";

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CategoryScreen({
  navigation,
  categoryName,
  categorySlug,
}) {
  const CATEGORY_SCREEN_MAP = {
    News: "NewsScreen",
    Literary: "LiteraryScreen",
    Opinion: "OpinionScreen",
    Sports: "SportsScreen",
    Features: "FeaturesScreen",
    Specials: "SpecialsScreen",
    Art: "ArtScreen",
  };

  const handleCategorySelect = (cat) => {
    if (!cat?.name) return;
    const screen = CATEGORY_SCREEN_MAP[cat.name];
    if (screen) navigation.navigate(screen);
  };
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await client.get("/api/categories");
      const allowed = ["News", "Literary", "Opinion", "Sports", "Features", "Specials", "Art"];
      setCategories((res.data ?? []).filter((c) => allowed.includes(c.name)));
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  const fetchArticles = useCallback(async (pageNum = 1, replace = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const res = await client.get("/api/articles/public", {
        params: {
          category: categorySlug || categoryName,
          page: pageNum,
          per_page: 10,
        },
      });
      const data = res.data?.data ?? [];
      const lastPage = res.data?.last_page ?? 1;

      setArticles((prev) => (replace ? data : [...prev, ...data]));
      setHasMore(pageNum < lastPage);
      setPage(pageNum);
    } catch (err) {
      console.error(`Error fetching ${categoryName} articles:`, err);
      setError(`Failed to load ${categoryName} articles. Please try again.`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [categoryName, categorySlug]);

  useEffect(() => {
    fetchCategories();
    fetchArticles(1, true);
  }, [categoryName, fetchCategories, fetchArticles]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchArticles(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) fetchArticles(page + 1, false);
  };

  const handleArticlePress = (article) => {
    navigation.navigate("ArticleDetail", { slug: article.slug });
  };

  const handleTagPress = (tag) => {
    navigation.navigate("TagArticles", { tagName: tag });
  };

  const handleAuthorPress = (article) => {
    if (article.author?.id) {
      navigation.navigate("AuthorProfile", {
        authorId: article.author.id,
        authorName: getAuthorName(article),
      });
    }
  };

  // ─── Empty State ──────────────────────────────────────────────────────────
  const EmptyState = () => (
    <View className="flex-1 justify-center items-center px-6 py-20">
      <Image
        source={logo}
        style={{ width: 60, height: 60 }}
        resizeMode="contain"
      />
      <Text
        className="text-2xl font-bold mt-6 text-center"
        style={{ color: colors.text }}
      >
        Nothing Published Yet
      </Text>
      <Text
        className="text-center mt-2"
        style={{ color: colors.textSecondary }}
      >
        Stay tuned, new stories will be up soon.
      </Text>
    </View>
  );

  // ─── Footer (Load More / Spinner) ────────────────────────────────────────
  const Footer = () => {
    if (loadingMore) {
      return (
        <View className="py-6 items-center">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }
    if (!hasMore && articles.length > 0) {
      return (
        <View className="py-6 items-center">
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            You{"'"}ve reached the end.
          </Text>
        </View>
      );
    }
    return <View className="h-6" />;
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header Container */}
      <View className="flex-shrink-0 bg-white">
        <HomeHeader
          categories={categories}
          onCategorySelect={handleCategorySelect}
          onMenuPress={() => {}}
          onSearchPress={() => {}}
          onGridPress={() => navigation.navigate("Admin")}
          onSearch={() => {}}
          navigation={navigation}
        />
       
      </View>

      {/* Category Banner - Gradient Color */}
      <LinearGradient 
        colors={[getCategoryColor(categoryName), '#fdf2f8']} // Purple to very light pink
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="py-5 px-5" 
        style={{ 
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.05)'
        }}
      >
        <Text 
          className="text-4xl text-white font-normal"
          style={{ letterSpacing: 0, textShadowColor: 'rgba(0, 0, 0, 0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}
        >
          {categoryName}
        </Text>
      </LinearGradient>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>
            Loading articles...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons
            name="alert-circle"
            size={48}
            color={colors.error || "#ef4444"}
          />
          <Text
            className="mt-4 text-center"
            style={{ color: colors.error || "#ef4444" }}
          >
            {error}
          </Text>
          <TouchableOpacity
            className="mt-6 px-6 py-3 rounded-lg"
            style={{ backgroundColor: colors.primary }}
            onPress={() => fetchArticles(1, true)}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            data={articles}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View className="px-4">
                <ArticleLargeCard
                  title={item.title}
                  category={item.categories?.[0]?.name || categoryName}
                  author={getAuthorName(item)}
                  date={formatDate(item.published_at || item.created_at)}
                  image={item.featured_image_url || item.featured_image}
                  hashtags={item.tags?.map((t) => t.name) ?? []}
                  onPress={() => handleArticlePress(item)}
                  onTagPress={handleTagPress}
                  onAuthorPress={() => handleAuthorPress(item)}
                />
              </View>
            )}
            ListEmptyComponent={<EmptyState />}
            ListFooterComponent={<Footer />}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          />
        </View>
      )}

      <BottomNavigation navigation={navigation} activeTab="Home" />
    </View>
  );
}
