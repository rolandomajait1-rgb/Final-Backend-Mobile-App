import { useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  DeviceEventEmitter,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreenSkeleton, ArticleActionMenu, Loader, EmptyState } from "../../components/common";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import ArticleMediumCard from "../../components/articles/ArticleMediumCard";
import HomeHeader from "./HomeHeader";
import BottomNavigation from "../../components/common/BottomNavigation";
import ArticleLargeCard from "../../components/articles/ArticleLargeCard";
import { useArticles } from "../../context/ArticleContext";
import {
  getArticles,
  deleteArticle,
} from "../../api/services/articleService";
import { getCategories } from "../../api/services/categoryService";
import { colors } from "../../styles";
import { showAuditToast } from "../../utils/toastNotification";
import { formatArticleDate } from "../../utils/dateUtils";
import { handleAuthorPress } from "../../utils/authorNavigation";
import { handleCategoryPress } from "../../utils/categoryNavigation";

// ─── ARTICLES LIST ────────────────────────────────────────────────────────────
const ArticlesListContent = ({
  latestArticles,
  recentArticles,
  refreshing,
  onRefresh,
  loadingMore,
  hasMore,
  onLoadMore,
  initialLoadComplete,
  onArticlePress,
  handleMenuPress,
  onTagPress,
  onAuthorPress,
  isAdminUser,
  navigation,
  scrollViewRef,
}) => {
  // If latestArticles is empty (e.g. featured article was just deleted),
  // promote the first article from recentArticles to fill the Latest slot.
  const latestIds = new Set((latestArticles || []).map(a => a.id));
  const promotedFromRecent =
    latestArticles?.length === 0 && recentArticles?.length > 0
      ? [recentArticles[0]]
      : [];
  const displayLatest = latestArticles?.length > 0 ? latestArticles : promotedFromRecent;
  const displayLatestIds = new Set(displayLatest.slice(0, 1).map(a => a.id));

  // Recent section: hide articles already shown in Latest slot
  const filteredRecent = (recentArticles || []).filter(
    a => !displayLatestIds.has(a.id)
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View className="px-4 mt-2">
        <Text className="text-3xl font-bold text-gray-900 mb-4 mt-2">
          Latest Articles
        </Text>
        {displayLatest.length > 0 ? (
          displayLatest.slice(0, 1).map((article) => (
            <ArticleLargeCard
              key={article.id}
              title={article.title}
              category={article.categories?.[0]?.name}
              hashtags={article.tags?.map((t) => t.name) || []}
              author={
                article.author_name || article.author?.name || "Unknown Author"
              }
              date={formatArticleDate(article.created_at || article.published_at)}
              image={article.featured_image_url || article.featured_image}
              onPress={() => onArticlePress(article)}
              onMenuPress={isAdminUser ? (e) => handleMenuPress(article, e) : undefined}
              onTagPress={onTagPress}
              onAuthorPress={() => onAuthorPress(article)}
              onCategoryPress={(category) => handleCategoryPress(category, navigation)}
            />
          ))
        ) : (
          <EmptyState 
            icon="newspaper-outline" 
            title="No featured articles" 
            message="Check back later for top stories." 
          />
        )}
      </View>

      <View className="px-4 mb-2">
        <Text className="text-2xl font-bold text-gray-900 mb-4 mt-2">
          Recent Articles
        </Text>
        {filteredRecent.length > 0 ? (
          <>
            <View className="gap-1">
              {filteredRecent.map((article) => (
                <ArticleMediumCard
                  key={article.id}
                  title={article.title}
                  category={article.categories?.[0]?.name}
                  author={
                    article.author_name || article.author?.name || "Unknown Author"
                  }
                  date={formatArticleDate(article.created_at || article.published_at)}
                  image={article.featured_image_url || article.featured_image}
                  hashtags={article.tags}
                  onPress={() => onArticlePress(article)}
                  onMenuPress={isAdminUser ? (e) => handleMenuPress(article, e) : undefined}
                  onAuthorPress={() => onAuthorPress(article)}
                  onTagPress={onTagPress}
                  onCategoryPress={(category) => handleCategoryPress(category, navigation)}
                  navigation={navigation}
                />
              ))}
            </View>
            
            {/* Load More Button */}
            {hasMore && (
              <TouchableOpacity
                onPress={onLoadMore}
                disabled={loadingMore}
                className="items-center justify-center py-4 mt-2"
              >
                {loadingMore ? (
                  <View className="flex-row items-center justify-center">
                    <Loader />
                  </View>
                ) : (
                  <Text className="text-base text-blue-500 font-semibold text-center">
                    Load More
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Back to Top Button - Below Load More */}
            {filteredRecent.length > 5 && (
              <TouchableOpacity
                onPress={() => {
                  if (scrollViewRef && scrollViewRef.current) {
                    scrollViewRef.current.scrollTo({ y: 0, animated: true });
                  }
                }}
                className="items-center justify-center py-4 mt-2 mb-4"
                style={{ backgroundColor: '#f0f9ff', borderRadius: 12, marginHorizontal: 4 }}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Ionicons name="arrow-up-circle" size={24} color="#0891b2" />
                  <Text className="text-base text-cyan-600 font-semibold">Back to Top</Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        ) : initialLoadComplete ? (
          <EmptyState 
            icon="document-text-outline" 
            title="No recent articles" 
            message="More news and updates coming soon." 
          />
        ) : null}
      </View>
      
      <View className="h-24" />
    </ScrollView>
  );
};

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { latestArticles = [], loading: articlesLoading, refreshArticles, forceRefreshArticles, removeArticleLocally, filterDeleted, unbanArticleLocally } = useArticles();
  const hasMountedRef = useRef(false);
  const scrollViewRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const isAdminUser = userRole === 'admin' || userRole === 'moderator';
  const [menuArticle, setMenuArticle] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuY, setMenuY] = useState(0);
  const [menuX, setMenuX] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Pagination state for recent articles
  const [recentArticles, setRecentArticles] = useState([]);
  const [recentPage, setRecentPage] = useState(1);
  const [recentHasMore, setRecentHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const userJson = await AsyncStorage.getItem('user_data');
    if (userJson) {
      const user = JSON.parse(userJson);
      setUserRole(user.role);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data ?? []);
    } catch (_) {
      // Silent fail
    }
  };
  
  // Fetch recent articles with pagination
  const fetchRecentArticles = useCallback(async (page = 1, replace = false) => {
    if (loadingMoreRef.current) return;
    
    setLoadingMore(true);
    loadingMoreRef.current = true;
    
    try {
      const res = await getArticles({ 
        page, 
        per_page: 10,
        status: 'published'
      });
      const rawArticles = res.data?.data ?? [];
      const lastPage = res.data?.last_page ?? 1;
      
      // Always filter out permanently deleted articles before setting state
      // This protects recentArticles from useFocusEffect re-fetches that
      // race against the backend delete propagation
      const newArticles = filterDeleted(rawArticles);
      
      setRecentArticles(prev => replace ? newArticles : [...filterDeleted(prev), ...newArticles]);
      setRecentHasMore(page < lastPage);
      setRecentPage(page);
      
      if (page === 1) {
        setInitialLoadComplete(true);
      }
    } catch (err) {
      console.error('Error fetching recent articles:', err);
      if (page === 1) {
        setInitialLoadComplete(true);
      }
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [filterDeleted]);
  
  const handleLoadMore = () => {
    if (!loadingMore && recentHasMore) {
      fetchRecentArticles(recentPage + 1, false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchRecentArticles(1, true); // Initial load
  }, [fetchRecentArticles]);

  useFocusEffect(
    useCallback(() => {
      if (hasMountedRef.current) {
        refreshArticles();
        fetchRecentArticles(1, true);
      } else {
        hasMountedRef.current = true;
      }
    }, [refreshArticles, fetchRecentArticles]),
  );

  // Listen for article publish/delete events for auto-refresh
  useEffect(() => {
    const handlePublish = (publishedId) => {
      console.log('[HomeScreen] Article published - auto refreshing...', publishedId);
      if (publishedId) unbanArticleLocally(publishedId);
      forceRefreshArticles();
      fetchRecentArticles(1, true);
    };
    
    const handleDelete = (deletedId) => {
      console.log('[HomeScreen] Article deleted - updating UI instantly...', deletedId);
      if (deletedId) {
        // 1. Instantly remove from both local lists — no waiting for API
        setRecentArticles(prev => prev.filter(a => a.id !== deletedId));
        removeArticleLocally(deletedId);
      }
      // 2. Delayed background refresh — gives backend time to commit delete
      //    so the re-fetch doesn't race-condition bring the article back
      setTimeout(() => {
        forceRefreshArticles();
        fetchRecentArticles(1, true);
      }, 800);
    };

    const handleDrafted = (draftedId) => {
      console.log('[HomeScreen] Article drafted - hiding from public feed instantly...', draftedId);
      if (draftedId) {
        setRecentArticles(prev => prev.filter(a => String(a.id) !== String(draftedId)));
        removeArticleLocally(draftedId);
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
  }, [forceRefreshArticles, fetchRecentArticles, removeArticleLocally]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshArticles();
    await fetchRecentArticles(1, true); // Refresh recent articles
    setRefreshing(false);
  };

  const handleMenuPress = (article, pos) => {
    if (isAdminUser) {
      setMenuArticle(article);
      setMenuY(pos.py);
      setMenuX(pos.px);
      setShowMenu(true);
    }
  };

  // Bug #10 Fix: null guard on menuArticle before accessing .id
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
    if (!menuArticle?.id || isDeleting) return;

    try {
      setIsDeleting(true);
      setShowDeleteModal(false);
      
      // Optimistically remove from UI first (instant feedback)
      const deletedArticleId = menuArticle.id;
      setRecentArticles(prev => prev.filter(a => a.id !== deletedArticleId));
      
      // Instant removal from global context (Latest Articles)
      removeArticleLocally(deletedArticleId);
      
      try {
        await deleteArticle(deletedArticleId);
        showAuditToast("success", "Article deleted successfully");
      } catch (deleteError) {
        // Silent handling of 404 - article already deleted
        if (deleteError.response?.status === 404) {
          console.log('[HomeScreen] Article already deleted (404)');
          showAuditToast("success", "Article removed");
        } else if (deleteError.response?.status === 500) {
          // Backend error - but UI already updated, so just log it
          console.log('[HomeScreen] Backend error on delete (500) - UI updated anyway');
          showAuditToast("success", "Article removed from view");
        } else {
          // Other errors - restore the article in UI
          console.log('[HomeScreen] Delete failed with unexpected error');
          showAuditToast("error", "Failed to delete article");
          // Refresh to restore correct state
          fetchRecentArticles(1, true);
          forceRefreshArticles();
          return;
        }
      }
      
      // Force refresh both latest and recent articles
      forceRefreshArticles();
      fetchRecentArticles(1, true);
      
      // Emit event for other screens to refresh
      DeviceEventEmitter.emit('ARTICLE_DELETED', deletedArticleId);

    } catch (error) {
      console.error("Unexpected error in confirmDelete:", error);
      showAuditToast("error", "An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  if (articlesLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="flex-shrink-0">
          <HomeHeader
            categories={categories}
            onCategorySelect={() => {}}
            navigation={navigation}
            onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
          />
        </View>
        <HomeScreenSkeleton />
        <BottomNavigation navigation={navigation} activeTab="Home" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Fixed Header */}
      <View className="flex-shrink-0">
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          navigation={navigation}
          onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
        />
      </View>

      {/* Flexible Content Area */}
      <View className="flex-1">
          <ArticlesListContent
            latestArticles={latestArticles}
            recentArticles={recentArticles}
            refreshing={refreshing}
            onRefresh={onRefresh}
            loadingMore={loadingMore}
            hasMore={recentHasMore}
            onLoadMore={handleLoadMore}
            initialLoadComplete={initialLoadComplete}
            onArticlePress={(article) =>
              navigation.navigate("ArticleStack", {
                screen: "ArticleDetail",
                params: {
                  slug: article.slug,
                  article,
                }
              })
            }
            handleMenuPress={(article, e) => handleMenuPress(article, e)}
            isAdminUser={userRole === 'admin' || userRole === 'moderator'}
            onTagPress={(tagName) =>
              navigation.navigate("ArticleStack", { screen: "TagArticles", params: { tagName } })
            }
            onAuthorPress={(article) => handleAuthorPress(article, navigation)}
            navigation={navigation}
            scrollViewRef={scrollViewRef}
          />
      </View>

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

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeTab="Home" />

      <DeleteConfirmModal
        visible={showDeleteModal}
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Floating Action Button (Create Article) - Only for Admins/Mods */}
      {(userRole === 'admin' || userRole === 'moderator') && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Management', { screen: 'CreateArticle' })}
          style={{
            position: 'absolute',
            right: 18,
            bottom: 130,
            width: 72,
            height: 72,
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
          <Ionicons name="add" size={40} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
