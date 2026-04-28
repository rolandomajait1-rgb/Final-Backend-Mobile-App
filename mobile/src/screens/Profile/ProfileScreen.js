import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from 'expo-status-bar';
import ArticleMediumCard from "../../components/articles/ArticleMediumCard";
import { Loader, Button, ProfileSkeleton, ArticleCardSkeleton, ArticleActionMenu } from "../../components/common";
import BottomNavigation from "../../components/common/BottomNavigation";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import { getCurrentUser, logout } from "../../api/services/authService";
import { getCategories } from "../../api/services/categoryService";
import client from "../../api/client";
import { useArticles } from "../../context/ArticleContext";
import { colors } from "../../styles";
import SideBar from "./SideBar";
import { showAuditEventToast } from "../../utils/toastNotification";
import { handleAuthorPress } from "../../utils/authorNavigation";
import { handleCategoryPress } from "../../utils/categoryNavigation";
import { useResponsive, scaleSize } from "../../utils/responsiveUtils";
import { formatArticleDate } from "../../utils/dateUtils";

export default function ProfileScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("liked");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [menuArticle, setMenuArticle] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuX, setMenuX] = useState(0);
  const [menuY, setMenuY] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { forceRefreshArticles, removeArticleLocally } = useArticles();

  // Per-tab article state
  const [likedArticles, setLikedArticles] = useState([]);
  const [sharedArticles, setSharedArticles] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const tabLoadingRef = useRef(false);
  const [tabPage, setTabPage] = useState(1);
  const [tabHasMore, setTabHasMore] = useState(true);
  const [categories, setCategories] = useState([]);

  // Bug #1 Fix: mountedRef initialized to true at declaration, not just inside useEffect.
  // This prevents ghost state updates if loadProfile completes after unmount.
  const mountedRef = useRef(true);

  useEffect(() => {
    loadProfile();
    fetchCategories();
    return () => {
      mountedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        if (mountedRef.current) {
          setLoading(false);
          setUser(null);
        }
        return;
      }

      // Show cached user data instantly so the profile renders during cold start
      const cachedUserJson = await AsyncStorage.getItem("user_data");
      if (cachedUserJson && mountedRef.current) {
        const cachedUser = JSON.parse(cachedUserJson);
        setUser(cachedUser);
        setIsAdminUser(cachedUser.role === 'admin' || cachedUser.role === 'moderator');
        setLoading(false); // Show cached profile immediately
      }

      // Refresh from network in background (may be slow on Render cold start)
      const res = await getCurrentUser();
      if (mountedRef.current) {
        setUser(res.data);
        setIsAdminUser(res.data.role === 'admin' || res.data.role === 'moderator');
        await AsyncStorage.setItem("user_data", JSON.stringify(res.data));
        setLoading(false);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      if (err.response?.status === 401) {
        // Only clear cache on explicit auth failure, not network errors
        await AsyncStorage.multiRemove(["auth_token", "user_data"]);
        if (mountedRef.current) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      // Network error or timeout — keep showing cached data if available
      if (mountedRef.current) {
        setLoading(false);
        // Don't set user to null on network error — cached data is already shown
      }
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error('Error fetching categories in Profile:', err);
    }
  };

  // Bug #3 & #23 Fix: Improved response validation and error handling
  const fetchTabArticles = useCallback(async (tab, page = 1, replace = false) => {
    if (tabLoadingRef.current) return;
    setTabLoading(true);
    tabLoadingRef.current = true;
    try {
      const endpoint =
        tab === "liked"
          ? "/api/user/liked-articles"
          : "/api/user/shared-articles";
      const res = await client.get(endpoint, {
        params: { page, per_page: 10 },
      });
      
      // Bug #3 Fix: Validate response structure before accessing nested properties
      if (!res.data || typeof res.data !== 'object') {
        throw new Error('Invalid response structure from server');
      }
      
      // Bug #23 Fix: Distinguish between empty results and API errors
      const newItems = Array.isArray(res.data?.data) ? res.data.data : [];
      const lastPage = res.data?.last_page ?? 1;

      if (mountedRef.current) {
        // Handle both flat article arrays and nested pivot structures (e.g., item.article)
        const parsedItems = newItems.map(item => item.article ? item.article : item);

        if (tab === "liked") {
          setLikedArticles((prev) =>
            replace ? parsedItems : [...prev, ...parsedItems],
          );
        } else {
          setSharedArticles((prev) =>
            replace ? parsedItems : [...prev, ...parsedItems],
          );
        }
        setTabHasMore(page < lastPage);
        setTabPage(page);
        
        // Show toast notification only for successful loads with data
        if (newItems.length > 0 && page === 1) {
          showAuditEventToast({
            action: tab === 'liked' ? 'liked_articles_loaded' : 'shared_articles_loaded',
            status: 'success',
            message: `Loaded ${newItems.length} ${tab} articles`
          });
        }
      }
    } catch (err) {
      console.error(`Error fetching ${tab} articles:`, err);
      if (mountedRef.current) {
        showAuditEventToast({
          action: `${tab}_articles_load`,
          status: 'error',
          message: err.message || `Failed to load ${tab} articles`
        });
      }
    } finally {
      if (mountedRef.current) {
        setTabLoading(false);
        tabLoadingRef.current = false;
      }
    }
  }, []);

  // Bug #5 & #18 Fix: Remove fetchTabArticles from dependency array to prevent infinite loops
  useEffect(() => {
    if (!user) return;
    if (activeTab === "liked") {
      setLikedArticles([]);
    } else {
      setSharedArticles([]);
    }
    setTabPage(1);
    setTabHasMore(true);
    fetchTabArticles(activeTab, 1, true);
  }, [activeTab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    if (!tabLoading && tabHasMore) {
      const nextPage = tabPage + 1;
      fetchTabArticles(activeTab, nextPage, false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setLikedArticles([]);
      setSharedArticles([]);
      setSidebarVisible(false);
      // Also refresh articles context on logout
      forceRefreshArticles();
      // Use navigation reset to ensure we go to Welcome and stay there
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth', params: { screen: 'Welcome' } }],
      });
    } catch (err) {
      console.error("Logout error:", err);
      showAuditEventToast({
        action: 'user_logout',
        status: 'error',
        message: 'Failed to sign out'
      });
    }
  };

  const handleMenuPress = (article, pos) => {
    setMenuArticle(article);
    setMenuX(pos.px);
    setMenuY(pos.py);
    setShowMenu(true);
  };

  const handleDeleteArticle = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!menuArticle || isDeleting) return;
    try {
      setIsDeleting(true);
      const { deleteArticle } = await import("../../api/services/articleService");
      await deleteArticle(menuArticle.id);
      
      // Update local state
      if (activeTab === 'liked') {
        setLikedArticles(prev => prev.filter(a => a.id !== menuArticle.id));
      } else {
        setSharedArticles(prev => prev.filter(a => a.id !== menuArticle.id));
      }
      
      setShowDeleteModal(false);
      showAuditEventToast({
        action: 'article_delete',
        status: 'success',
        message: 'Article deleted successfully'
      });
      // Register deletion in context — prevents API re-fetch from bringing it back
      removeArticleLocally(menuArticle.id);
      // Emit event — HomeScreen listener handles the delayed background refresh
      DeviceEventEmitter.emit('ARTICLE_DELETED', menuArticle.id);
    } catch (err) {
      console.error("Error deleting article:", err);
      showAuditEventToast({
        action: 'article_delete',
        status: 'error',
        message: 'Failed to delete article'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditArticle = () => {
    setShowMenu(false);
    navigation.navigate("EditArticle", { articleId: menuArticle.id });
  };

  const handlePublishArticle = async () => {
    if (!menuArticle || loading) return;
    setShowMenu(false);
    try {
      setLoading(true);
      // Fetch full article to ensure we pass all required fields back to the server
      const res = await client.get(`/api/articles/id/${menuArticle.id}`);
      const fullArticle = res.data?.data || res.data;
      
      if (!fullArticle) {
        throw new Error('Could not retrieve article details');
      }

      const fallbackCategoryId = categories.find(c => c.name === 'News')?.id || categories[0]?.id || 1;
      const authorName = fullArticle.author_name || fullArticle.author?.name || fullArticle.author?.user?.name || fullArticle.author?.username || 'Herald Staff';
      const tagsArray = fullArticle.tags?.map(t => typeof t === 'string' ? t.trim() : (t.name ? t.name.trim() : t)).filter(Boolean) || [];

      const categoryId = fullArticle.category_id || fullArticle.categories?.[0]?.id || fullArticle.category?.id || fallbackCategoryId;
      const categoryNameFromList = categories.find(c => c.id === categoryId)?.name || 'News';

      const payload = {
        title: fullArticle.title,
        content: fullArticle.content,
        category: categoryNameFromList, // Backend now expects category name string
        category_id: categoryId,
        author: authorName,
        author_name: authorName,
        status: 'published',
        tags: tagsArray.join(','), // Backend expects string
        featured_image_url: fullArticle.featured_image_url || fullArticle.featured_image,
        _method: 'PUT'
      };

      await client.post(`/api/articles/${menuArticle.id}`, payload);
      
      showAuditEventToast({
        action: 'article_publish',
        status: 'success',
        message: 'Article published!'
      });
      
      // Global refresh
      forceRefreshArticles();
      // Refresh current screen
      onRefresh();
    } catch (err) {
      console.error("Error publishing:", err);
      const msg = err.response?.data?.message || 'Failed to publish article. Please try again.';
      showAuditEventToast({
        action: 'article_publish',
        status: 'error',
        message: msg
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
      </SafeAreaView>
    );
  }

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  const currentArticles =
    activeTab === "liked" ? likedArticles : sharedArticles;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" hidden={false} />
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* White spacer for status bar */}
        <View className="h-9 bg-white" />
        
        {/* Profile Header */}
        <View className={`${width < 375 ? 'px-4 py-4 pb-6' : 'px-5 py-6 pb-8'}`} style={{ backgroundColor: '#075985' }}>
          <View className="flex-row items-center">
            <View className={`${width < 375 ? 'w-14 h-14' : 'w-16 h-16'} rounded-full bg-white justify-center items-center mr-4`}>
              <Ionicons name="person" size={width < 375 ? 32 : 36} color="#075985" />
            </View>
            <View className="flex-1 justify-center">
              <Text className={`${width < 375 ? 'text-lg' : 'text-2xl'} font-bold text-white tracking-tight mb-0.5`}>{user.name}</Text>
              <Text className={`${width < 375 ? 'text-xs' : 'text-base'} text-white`}>
                Joined in {joinedDate}
              </Text>
              {user.role && (
                <View className="bg-[#083344] self-start px-2.5 py-0.5 rounded-full mt-1.5 border border-[#083344]">
                  <Text className={`${width < 375 ? 'text-xs' : 'text-xs'} text-white font-medium capitalize`}>
                    {user.role}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setSidebarVisible(true)}
              className="p-2 -mr-2"
            >
              <Ionicons name="menu" size={width < 375 ? 24 : 28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pill Tabs */}
        <View className={`flex-row ${width < 375 ? 'px-4 py-3 pb-1' : 'px-5 py-5 pb-2'}`}>
          {["liked", "shared"].map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`${width < 375 ? 'py-2 px-4' : 'py-2.5 px-6'} mr-3 rounded-full border ${
                  isSelected ? "border-gray-800" : "border-gray-200"
                }`}
              >
                <Text
                  className={`${width < 375 ? 'text-xs' : 'text-sm'} font-medium ${
                    isSelected ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  {tab === "liked" ? "Liked Articles" : "Shared Articles"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Articles List */}
        <View className={`${width < 375 ? 'px-4 py-3' : 'px-5 py-4'}`}>
          {tabLoading && currentArticles.length === 0 ? (
            <>
              {[...Array(5)].map((_, index) => (
                <ArticleCardSkeleton key={index} />
              ))}
            </>
          ) : currentArticles.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons
                name={
                  activeTab === "liked"
                    ? "thumbs-up-outline"
                    : "share-social-outline"
                }
                size={width < 375 ? 40 : 48}
                color="#ccc"
              />
              <Text className={`${width < 375 ? 'text-xs' : 'text-sm'} text-gray-400 mt-3 text-center`}>
                {activeTab === "liked"
                  ? "You haven't liked any articles yet."
                  : "You haven't shared any articles yet."}
              </Text>
            </View>
          ) : (
            <>
              {currentArticles.map((article) => (
                <View key={article.id} className="mb-2">
                  <ArticleMediumCard
                    title={article.title}
                    category={article.categories?.[0]?.name || 'Uncategorized'}
                    author={article.author_name || article.author?.user?.name || article.author?.name || 'Unknown Author'}
                    date={(article.created_at || article.published_at)
                      ? formatArticleDate(article.created_at || article.published_at)
                      : 'Recently'}
                    image={article.featured_image_url || article.featured_image}
                    hashtags={article.tags?.map((t) => t.name) || []}
                    onPress={() => navigation.navigate("ArticleStack", { screen: "ArticleDetail", params: { slug: article.slug, article } })}
                    onMenuPress={isAdminUser ? (pos) => handleMenuPress(article, pos) : undefined}
                    onTagPress={(tagName) => navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName } })}
                    onAuthorPress={() => handleAuthorPress(article, navigation)}
                    onCategoryPress={(category) => handleCategoryPress(category, navigation)}
                    navigation={navigation}
                  />
                </View>
              ))}

              {/* Load More */}
              {tabHasMore && (
                <TouchableOpacity
                  onPress={handleLoadMore}
                  disabled={tabLoading}
                  className={`items-center ${width < 375 ? 'py-2' : 'py-4'}`}
                >
                  {tabLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text className={`${width < 375 ? 'text-sm' : 'text-base'} text-blue-500 font-semibold`}>
                      Load More
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View className="h-24" />
      </ScrollView>

      <SideBar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onLogout={handleLogout}
        navigation={navigation}
        user={user}
      />

      <ArticleActionMenu
        visible={showMenu}
        x={menuX}
        y={menuY}
        onClose={() => setShowMenu(false)}
        actions={[
          {
            label: "Edit",
            icon: "create-outline",
            color: "#0284c7",
            onPress: handleEditArticle,
          },
          // Only Admin can Publish or Delete
          ...(user?.role === 'admin' ? [
            ...(menuArticle?.status === 'draft' ? [{
              label: "Publish",
              icon: "cloud-upload-outline",
              color: "#10b981",
              onPress: handlePublishArticle,
            }] : []),
            {
              label: "Delete",
              icon: "trash-outline",
              color: "#ef4444",
              onPress: handleDeleteArticle,
            }
          ] : []),
        ]}
      />

      <DeleteConfirmModal
        visible={showDeleteModal}
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <BottomNavigation navigation={navigation} activeTab="Profile" />
    </View>
  );
}
