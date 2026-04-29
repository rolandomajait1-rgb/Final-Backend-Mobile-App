import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  useWindowDimensions,
  DeviceEventEmitter,
} from "react-native";
import { deleteArticle, searchArticles } from "../../api/services/articleService";
import { showAuditToast } from "../../utils/toastNotification";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import { ArticleActionMenu, CategoryScreenSkeleton, EmptyState } from "../../components/common";
import { ALLOWED_CATEGORIES } from "../../constants/categories";
import { formatArticleDate } from "../../utils/dateUtils";
import { debounce } from "../../utils/debounce";
import { handleAuthorPress } from "../../utils/authorNavigation";
import { useArticles } from "../../context/ArticleContext";

import { Ionicons } from "@expo/vector-icons";
import client from "../../api/client";
import { colors } from "../../styles";
import ArticleLargeCard from "../../components/articles/ArticleLargeCard";
import HomeHeader from "../homepage/HomeHeader";
import BottomNavigation from "../../components/common/BottomNavigation";
import { getCategoryColor } from "../../utils/categoryColors";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const logo = require("../../../assets/logo.png");

const getAuthorName = (article) =>
  article.author_name ||
  article.author?.name ||
  article.author?.user?.name ||
  "Unknown Author";

// formatDate removed in favor of formatArticleDate from dateUtils

export default function CategoryScreen({
  navigation,
  categoryName,
  categorySlug,
}) {
  const { width } = useWindowDimensions();
  const { forceRefreshArticles, removeArticleLocally } = useArticles();
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
    if (screen) navigation.navigate("ArticleStack", { screen });
  };
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const isAdminUser = userRole === 'admin' || userRole === 'moderator';
  const [menuArticle, setMenuArticle] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuY, setMenuY] = useState(0);
  const [menuX, setMenuX] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const loadingMoreRef = useRef(false);
  
  // Track permanently deleted/drafted article IDs (persists across refreshes)
  const deletedIdsRef = useRef(new Set());

  const fetchCategories = useCallback(async () => {
    try {
      const res = await client.get("/api/categories");
      setCategories((res.data ?? []).filter((c) => ALLOWED_CATEGORIES.includes(c.name)));
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  const fetchArticles = useCallback(async (pageNum = 1, replace = false, silent = false) => {
    if (pageNum === 1 && !silent) setLoading(true);
    else if (pageNum > 1) {
      setLoadingMore(true);
      loadingMoreRef.current = true;
    }
    setError(null);

    try {
      const res = await client.get("/api/articles/public", {
        params: {
          category: categorySlug || categoryName,
          page: pageNum,
          per_page: 10,
        },
      });
      const rawData = res.data?.data ?? [];
      const lastPage = res.data?.last_page ?? 1;
      
      // Filter out deleted/drafted articles
      const data = rawData.filter(a => !deletedIdsRef.current.has(String(a.id)));

      setArticles((prev) => (replace ? data : [...prev, ...data]));
      setHasMore(pageNum < lastPage);
      setPage(pageNum);
    } catch (err) {
      console.error(`Error fetching ${categoryName} articles:`, err);
      setError(`Failed to load ${categoryName} articles. Please try again.`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
      setRefreshing(false);
    }
  }, [categoryName, categorySlug]);

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await searchArticles(query.trim());
      setSearchResults(res.data?.data ?? []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const debouncedSearch = useMemo(() => debounce(handleSearch, 100), [handleSearch]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const userJson = await AsyncStorage.getItem('user_data');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserRole(user.role);
      }
    };

    checkAdminStatus();
    fetchCategories();
    fetchArticles(1, true);
  }, [categoryName, fetchCategories, fetchArticles]);
  
  // Listen for article events
  useEffect(() => {
    const handlePublish = (publishedId) => {
      console.log('[CategoryScreen] Article published - removing from deletion tracking...', publishedId);
      if (publishedId) {
        deletedIdsRef.current.delete(String(publishedId));
      }
      fetchArticles(1, true, false);
    };

    const handleDelete = (deletedId) => {
      console.log('[CategoryScreen] Article deleted - permanently removing...', deletedId);
      if (deletedId) {
        deletedIdsRef.current.add(String(deletedId));
        setArticles(prev => prev.filter(a => String(a.id) !== String(deletedId)));
        setSearchResults(prev => prev.filter(a => String(a.id) !== String(deletedId)));
      }
    };

    const handleDrafted = (draftedId) => {
      console.log('[CategoryScreen] Article drafted - permanently hiding...', draftedId);
      if (draftedId) {
        deletedIdsRef.current.add(String(draftedId));
        setArticles(prev => prev.filter(a => String(a.id) !== String(draftedId)));
        setSearchResults(prev => prev.filter(a => String(a.id) !== String(draftedId)));
      }
    };

    const publishListener = DeviceEventEmitter.addListener('ARTICLE_PUBLISHED', handlePublish);
    const deleteListener = DeviceEventEmitter.addListener('ARTICLE_DELETED', handleDelete);
    const draftedListener = DeviceEventEmitter.addListener('ARTICLE_DRAFTED', handleDrafted);

    return () => {
      publishListener.remove();
      deleteListener.remove();
      draftedListener.remove();
    };
  }, [categoryName, fetchArticles]);

  const handleMenuPress = (article, pos) => {
    if (isAdminUser) {
      setMenuArticle(article);
      setMenuY(pos.py);
      setMenuX(pos.px);
      setShowMenu(true);
    }
  };

  const handleEdit = () => {
    if (!menuArticle) return;
    setShowMenu(false);
    navigation.navigate("Management", { screen: "EditArticle", params: { articleId: menuArticle.id } });
  };

  const handleDelete = () => {
    if (!menuArticle) return;
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!menuArticle?.id || deletingArticle) return;
    try {
      setDeletingArticle(true);
      await deleteArticle(menuArticle.id);
      
      // Add to permanent deletion set
      deletedIdsRef.current.add(String(menuArticle.id));
      
      // Remove from local state immediately
      setArticles(prev => prev.filter(a => a.id !== menuArticle.id));
      setSearchResults(prev => prev.filter(a => a.id !== menuArticle.id));
      
      setShowDeleteModal(false);
      showAuditToast("success", "Article deleted successfully");
      
      // Emit event for other screens
      DeviceEventEmitter.emit('ARTICLE_DELETED', menuArticle.id);
    } catch (err) {
      // Check if it's a 404 error (article already deleted)
      if (err.response?.status === 404) {
        // Remove from local state since it doesn't exist anymore
        setArticles(prev => prev.filter(a => a.id !== menuArticle.id));
        setSearchResults(prev => prev.filter(a => a.id !== menuArticle.id));
        setShowDeleteModal(false);
        showAuditToast("info", "Article was already deleted");
        DeviceEventEmitter.emit('ARTICLE_DELETED', menuArticle.id);
      } else {
        console.error("Error deleting article:", err);
        showAuditToast("error", "Failed to delete article");
      }
    } finally {
      setDeletingArticle(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchArticles(1, true, true);
  };

  const loadMore = () => {
    if (!loadingMoreRef.current && hasMore) {
      console.log('Loading more articles, current page:', page);
      fetchArticles(page + 1, false);
    }
  };

  const handleArticlePress = (article) => {
    navigation.navigate("ArticleStack", { screen: "ArticleDetail", params: { slug: article.slug } });
  };

  const handleTagPress = (tag) => {
    navigation.navigate("ArticleStack", { screen: "TagArticles", params: { tagName: tag } });
  };

  const handleCategoryPress = (category) => {
    const screen = CATEGORY_SCREEN_MAP[category];
    if (screen) {
      navigation.navigate("ArticleStack", { screen });
    }
  };


  // ─── Local Empty State ──────────────────────────────────────────────────
  const renderEmptyState = useCallback(() => (
    <View className="flex-1 justify-center items-center px-6 py-20">
      <Image
        source={logo}
        style={{ width: width < 375 ? 50 : 60, height: width < 375 ? 50 : 60 }}
        resizeMode="contain"
      />
      <Text
        className={`${width < 375 ? 'text-xl' : 'text-2xl'} font-bold mt-6 text-center`}
        style={{ color: colors.text }}
      >
        Nothing Published Yet
      </Text>
      <Text
        className={`${width < 375 ? 'text-xs' : 'text-sm'} text-center mt-2`}
        style={{ color: colors.textSecondary }}
      >
        Stay tuned, new stories will be up soon.
      </Text>
    </View>
  ), [width]);

  // ─── Footer (Load More / Spinner) ────────────────────────────────────────
  const renderFooter = useCallback(() => {
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
  }, [loadingMore, hasMore, articles.length]);

  return (
    <View className="flex-1 bg-white">
      {/* Header Container */}
      <View className="flex-shrink-0 bg-white">
        <HomeHeader
          categories={categories}
          onCategorySelect={handleCategorySelect}
          onMenuPress={() => {}}
          onGridPress={() => navigation.navigate('Management', { screen: 'Admin' })}
          onSearch={debouncedSearch}
          navigation={navigation}
        />
       
      </View>

      {/* Category Banner - Gradient Color */}
      <LinearGradient 
        colors={[getCategoryColor(categoryName), '#fdf2f8']} // Purple to very light pink
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className={`${width < 375 ? 'py-3 px-3' : 'py-4 px-5'}`}
        style={{ 
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.05)'
        }}
      >
        <Text 
          className={`${width < 375 ? 'text-2xl' : 'text-4xl'} text-white font-normal`}
          style={{ letterSpacing: 0, textShadowColor: 'rgba(0, 0, 0, 0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}
        >
          {categoryName}
        </Text>
      </LinearGradient>

      {/* Content */}
      {searchQuery.trim() !== "" ? (
        <View className="flex-1">
          <FlatList
            data={searchResults}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={
              <View className={`${width < 375 ? 'px-3 py-3' : 'px-4 py-4'} border-b border-gray-200 bg-white`}>
                <Text className={`${width < 375 ? 'text-lg' : 'text-2xl'} font-bold`} style={{ color: colors.text }}>
                  Search Results for &quot;{searchQuery}&quot;
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View className={`${width < 375 ? 'px-3' : 'px-4'}`}>
                <ArticleLargeCard
                  title={item.title}
                  category={item.categories?.[0]?.name || categoryName}
                  author={getAuthorName(item)}
                  date={formatArticleDate(item.published_at || item.created_at)}
                  image={item.featured_image_url || item.featured_image}
                  hashtags={item.tags?.map((t) => t.name) ?? []}
                  onPress={() => handleArticlePress(item)}
                  onMenuPress={isAdminUser ? (e) => handleMenuPress(item, e) : undefined}
                  onTagPress={handleTagPress}
                  onAuthorPress={() => handleAuthorPress(item, navigation)}
                  onCategoryPress={handleCategoryPress}
                />
              </View>
            )}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-12">
                {searching ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <EmptyState 
                    icon="search-outline" 
                    title="No results found" 
                    message={`We couldn't find anything for "${searchQuery}"`} 
                  />
                )}
              </View>
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        </View>
      ) : (
        <>
        {loading ? (
          <CategoryScreenSkeleton />
      ) : error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons
            name="alert-circle"
            size={width < 375 ? 40 : 48}
            color={colors.error || "#ef4444"}
          />
          <Text
            className={`${width < 375 ? 'text-sm' : 'text-base'} mt-4 text-center`}
            style={{ color: colors.error || "#ef4444" }}
          >
            {error}
          </Text>
          <TouchableOpacity
            className={`${width < 375 ? 'mt-4 px-4 py-2' : 'mt-6 px-6 py-3'} rounded-lg`}
            style={{ backgroundColor: colors.primary }}
            onPress={() => fetchArticles(1, true)}
          >
            <Text className={`${width < 375 ? 'text-sm' : 'text-base'} text-white font-semibold`}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            data={articles}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View className={`${width < 375 ? 'px-3' : 'px-4'}`}>
                <ArticleLargeCard
                  title={item.title}
                  category={item.categories?.[0]?.name || categoryName}
                  author={getAuthorName(item)}
                  date={formatArticleDate(item.published_at || item.created_at)}
                  image={item.featured_image_url || item.featured_image}
                  hashtags={item.tags?.map((t) => t.name) ?? []}
                  onPress={() => handleArticlePress(item)}
                  onMenuPress={isAdminUser ? (e) => handleMenuPress(item, e) : undefined}
                  onTagPress={handleTagPress}
                  onAuthorPress={() => handleAuthorPress(item, navigation)}
                  onCategoryPress={handleCategoryPress}
                />
              </View>
            )}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
            contentContainerStyle={{ paddingTop: width < 375 ? 12 : 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={10}
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
      </>
      )}

      <BottomNavigation navigation={navigation} activeTab="Home" />

      {/* Floating Action Button (Create Article) - Only for Admins/Mods */}
      {(userRole === 'admin' || userRole === 'moderator') && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Management', { screen: 'CreateArticle' })}
          style={{
            position: 'absolute',
            right: 18,
            bottom: 130,
            width: width < 375 ? 64 : 72,
            height: width < 375 ? 64 : 72,
            borderRadius: 999,
            backgroundColor: '#f39c12',
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
          }}
        >
          <Ionicons name="add" size={width < 375 ? 36 : 40} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Edit/Delete Menu Modal */}
      <ArticleActionMenu
        visible={showMenu}
        y={menuY}
        x={menuX}
        onClose={() => setShowMenu(false)}
        actions={[
          {
            label: "Edit",
            icon: "create-outline",
            color: "#0284c7",
            onPress: handleEdit,
          },
          // Only Admin can Delete
          ...(userRole === 'admin' ? [{
            label: "Delete",
            icon: "trash-outline",
            color: "#ef4444",
            onPress: handleDelete,
          }] : []),
        ]}
      />

      <DeleteConfirmModal
        visible={showDeleteModal}
        loading={deletingArticle}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deletingArticle) {
            setShowDeleteModal(false);
          }
        }}
      />
    </View>
  );
}
