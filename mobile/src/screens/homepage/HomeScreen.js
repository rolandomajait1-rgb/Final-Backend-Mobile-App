import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
  searchArticles,
  deleteArticle,
} from "../../api/services/articleService";
import { getCategories } from "../../api/services/categoryService";
import { colors } from "../../styles";
import { debounce } from "../../utils/debounce";
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
}) => (
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
      {latestArticles?.length > 0 ? (
        latestArticles.slice(0, 1).map((article) => (
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
      {/* Filter out articles already shown in Latest section */}
      {(() => {
        const latestIds = latestArticles.slice(0, 1).map(a => a.id);
        const filteredRecent = recentArticles?.filter(article => !latestIds.includes(article.id)) || [];
        return filteredRecent.length > 0 ? (
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
      ) : null;
      })()}
    </View>
    
    <View className="h-24" />
  </ScrollView>
);

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { latestArticles = [], loading: articlesLoading, refreshArticles, forceRefreshArticles } = useArticles();
  const hasMountedRef = useRef(false);
  const scrollViewRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const isAdminUser = userRole === 'admin' || userRole === 'moderator';
  const [menuArticle, setMenuArticle] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuY, setMenuY] = useState(0);
  const [menuX, setMenuX] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Pagination state for recent articles
  const [recentArticles, setRecentArticles] = useState([]);
  const [recentPage, setRecentPage] = useState(1);
  const [recentHasMore, setRecentHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const pendingDeletionRef = useRef(null);

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
    } finally {
      setCategoriesLoading(false);
    }
  };
  
  // Fetch recent articles with pagination
  const fetchRecentArticles = useCallback(async (page = 1, replace = false) => {
    if (loadingMoreRef.current) return;
    
    setLoadingMore(true);
    loadingMoreRef.current = true;
    
    try {
      const res = await getArticles({ page, per_page: 10 });
      const newArticles = res.data?.data ?? [];
      const lastPage = res.data?.last_page ?? 1;
      
      setRecentArticles(prev => replace ? newArticles : [...prev, ...newArticles]);
      setRecentHasMore(page < lastPage);
      setRecentPage(page);
      
      // Mark initial load as complete after minimum delay
      if (page === 1) {
        setTimeout(() => setInitialLoadComplete(true), 5000);
      }
    } catch (err) {
      console.error('Error fetching recent articles:', err);
      // Still mark as complete even on error after delay
      if (page === 1) {
        setTimeout(() => setInitialLoadComplete(true), 5000);
      }
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, []);
  
  const handleLoadMore = () => {
    if (!loadingMore && recentHasMore) {
      fetchRecentArticles(recentPage + 1, false);
    }
  };

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 1) {
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

  // Bug #2 Fix: Debounce created with useMemo — stable across renders
  const debouncedSearch = useMemo(
    () => debounce(handleSearch, 100),
    [handleSearch]
  );

  // Keep track of pending deletion for cleanup on unmount
  useEffect(() => {
    pendingDeletionRef.current = pendingDeletion;
  }, [pendingDeletion]);

  // Cleanup on unmount (kung isara ng user ang app, ituloy ang delete API)
  useEffect(() => {
    return () => {
      if (pendingDeletionRef.current && pendingDeletionRef.current.timeLeft > 0) {
        deleteArticle(pendingDeletionRef.current.article.id).catch(() => {});
      }
    };
  }, []);

  // Timer effect for 20s undo
  useEffect(() => {
    let timer;
    if (pendingDeletion && pendingDeletion.timeLeft > 0) {
      timer = setTimeout(() => {
        setPendingDeletion(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (pendingDeletion && pendingDeletion.timeLeft === 0) {
      const articleId = pendingDeletion.article.id;
      setPendingDeletion(null);
      
      // Time is up, i-execute na ang actual API deletion
      deleteArticle(articleId)
        .then(() => {
          showAuditToast("success", "Article deleted successfully");
          forceRefreshArticles();
          fetchRecentArticles(1, true); // Refresh recent articles list to ensure deleted article is gone
        })
        .catch(err => {
          console.error("Error executing delayed delete:", err);
          showAuditToast("error", "Failed to delete article. Please try again.");
          fetchRecentArticles(1, true); // I-refresh ang list para bumalik yung article
        });
    }     
    return () => clearTimeout(timer);
  }, [pendingDeletion, forceRefreshArticles, fetchRecentArticles]);

  useEffect(() => {
    fetchCategories();
    fetchRecentArticles(1, true); // Initial load
  }, [fetchRecentArticles]);

  useFocusEffect(
    useCallback(() => {
      // IMPORTANT: Always refresh both latest and recent articles when screen comes into focus
      // This ensures updates from other screens (Edit, Create, Draft, etc.) are immediately reflected
      // - latestArticles: managed by ArticleContext (top featured articles)
      // - recentArticles: managed locally with pagination (all published articles)
      if (hasMountedRef.current) {
        refreshArticles(); // Refresh latest articles from context
        fetchRecentArticles(1, true); // Refresh recent articles list
      } else {
        hasMountedRef.current = true;
      }

      // Return a cleanup function that runs when the screen is unfocused.
      return () => {
        // If an article deletion is pending, navigating away should confirm the deletion.
        if (pendingDeletionRef.current && pendingDeletionRef.current.timeLeft > 0) {
          // Immediately delete the article in the background.
          deleteArticle(pendingDeletionRef.current.article.id)
            .then(() => {
              forceRefreshArticles();
              fetchRecentArticles(1, true); // Also refresh recent articles
            })
            .catch(() => {}); // Suppress errors for fire-and-forget

          // Clear the pending deletion state to stop the timer and hide the undo toast.
          setPendingDeletion(null);
        }
      };
    }, [refreshArticles, fetchRecentArticles, forceRefreshArticles]),
  );

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

  const undoDelete = () => {
    if (!pendingDeletion) return;
    
    setPendingDeletion(null);
    showAuditToast("info", "Deletion undone");
    
    // Restore the visually hidden article by re-fetching
    forceRefreshArticles();
    fetchRecentArticles(1, true);
  };

  const confirmDelete = async () => {
    if (!menuArticle?.id) {
      return;
    }

    const articleToHide = menuArticle;

    // If nag-delete ulit sila pero may pending timer pa, i-execute na ang previous deletion
    if (pendingDeletion && pendingDeletion.timeLeft > 0) {
      deleteArticle(pendingDeletion.article.id).catch(() => {});
    }
    
    // Optimistically remove from UI
    setSearchResults(prev => prev.filter(a => a.id !== articleToHide.id));
    setRecentArticles(prev => prev.filter(a => a.id !== articleToHide.id));
    
    setShowDeleteModal(false);
    
    // Start 20s countdown instead of deleting immediately
    setPendingDeletion({
      article: articleToHide,
      timeLeft: 20
    });
  };

  if (articlesLoading || categoriesLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="flex-shrink-0">
          <HomeHeader
            categories={categories}
            onCategorySelect={() => {}}
            onMenuPress={() => {}}
            onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
            onSearch={debouncedSearch}
            navigation={navigation}
              searchQuery={searchQuery}
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
          onMenuPress={() => {}}
          onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
          onSearch={debouncedSearch}
          navigation={navigation}
          searchQuery={searchQuery}
        />
      </View>

      {/* Flexible Content Area */}
      <View className="flex-1">
        {searchQuery.trim().length >= 1 ? (
          // Search Results View
          <ScrollView className="flex-1 px-4">
            <Text className="text-2xl font-bold text-gray-900 my-4">
              Search Results for {`"${searchQuery}"`}
            </Text>
            {searching ? (
              <Loader />
            ) : searchResults.length > 0 ? (
              searchResults.map((article) => (
                <ArticleLargeCard
                  key={article.id}
                  title={article.title}
                  category={article.categories?.[0]?.name}
                  hashtags={article.tags?.map((t) => t.name) || []}
                  author={
                    article.author_name ||
                    article.author?.name ||
                    article.author?.user?.name ||
                    "Unknown Author"
                  }
                  date={formatArticleDate(article.created_at || article.published_at)}
                  image={article.featured_image_url || article.featured_image}
                  onPress={() =>
                    navigation.navigate("ArticleStack", {
                      screen: "ArticleDetail",
                      params: {
                        slug: article.slug,
                        article,
                      }
                    })
                  }
                  onMenuPress={isAdminUser ? (e) => handleMenuPress(article, e) : undefined}
                  onTagPress={(tag) =>
                    navigation.navigate("ArticleStack", { screen: "TagArticles", params: { tagName: tag } })
                  }
                  onAuthorPress={() => handleAuthorPress(article, navigation)}
                  onCategoryPress={(category) => handleCategoryPress(category, navigation)}
                />
              ))
            ) : (
              <Text className="text-center text-gray-500 my-8">
                No results found for {`"${searchQuery}"`}
              </Text>
            )}
          </ScrollView>
        ) : (
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
        )}
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

      {/* Undo Deletion Timer Toast */}
      {pendingDeletion && pendingDeletion.timeLeft > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 100,
            left: 16,
            right: 16,
            backgroundColor: '#374151', // Dark gray background
            padding: 16,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            zIndex: 100,
          }}
        >
          <View className="flex-row items-center">
            <Ionicons name="trash-outline" size={20} color="#f87171" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>
              Article deleted ({pendingDeletion.timeLeft}s)
            </Text>
          </View>
          <TouchableOpacity
            onPress={undoDelete}
            style={{
              backgroundColor: '#f59e0b', // Amber button
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>UNDO</Text>
          </TouchableOpacity>
        </View>
      )}

      <DeleteConfirmModal
        visible={showDeleteModal}
        loading={false}
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
