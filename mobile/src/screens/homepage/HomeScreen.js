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
  
  // Pagination state for recent articles
  const [recentArticles, setRecentArticles] = useState([]);
  const [recentPage, setRecentPage] = useState(1);
  const [recentHasMore, setRecentHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const pendingDeletionRef = useRef(null);
  const [deletedArticleIds, setDeletedArticleIds] = useState([]);

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
      // Fetch published articles sorted by published_at descending (latest first)
      const res = await getArticles({ 
        page, 
        per_page: 10,
        status: 'published'  // Only fetch published articles
      });
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
      
      // Prevent multiple calls while deleting
      setPendingDeletion(prev => ({ ...prev, timeLeft: -1 }));
      
      // Optimistically hide the article from all lists permanently on this screen
      setDeletedArticleIds(prev => [...prev, articleId]);

      // Time is up, i-execute na ang actual API deletion
      (async () => {
        try {
          await deleteArticle(articleId);
          showAuditToast("success", "Article deleted successfully");
        } catch (error) {
          // Ignore if already deleted (404)
          if (error.response?.status !== 404) {
            console.error("Error executing delayed delete:", error);
            showAuditToast("error", "Failed to delete article. Please try again.");
            setDeletedArticleIds(prev => prev.filter(id => id !== articleId));
          }
        } finally {
          setRecentArticles(prev => prev.filter(a => a.id !== articleId));
          try { await forceRefreshArticles?.(); } catch(e) {}
          setPendingDeletion(null);
        }
      })();
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
          const articleId = pendingDeletionRef.current.article.id;
          setDeletedArticleIds(prev => [...prev, articleId]);
          
          // Immediately delete the article in the background.
          deleteArticle(articleId)
            .then(() => {
              forceRefreshArticles();
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
            latestArticles={latestArticles.filter(a => a.id !== pendingDeletion?.article?.id && !deletedArticleIds.includes(a.id))}
            recentArticles={recentArticles.filter(a => a.id !== pendingDeletion?.article?.id && !deletedArticleIds.includes(a.id))}
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
            <TouchableOpacity 
              onPress={() => {
                if (pendingDeletion.timeLeft === -1) return; // Prevent double tap
                // Skip timer and execute delete immediately
                const articleId = pendingDeletion.article.id;
                setPendingDeletion(prev => ({ ...prev, timeLeft: -1 }));
                
                // Optimistically hide the article from all lists permanently
                setDeletedArticleIds(prev => [...prev, articleId]);

                (async () => {
                  try {
                    await deleteArticle(articleId);
                    showAuditToast("success", "Article deleted successfully");
                  } catch (error) {
                    if (error.response?.status !== 404) {
                      showAuditToast("error", "Failed to delete article.");
                      setDeletedArticleIds(prev => prev.filter(id => id !== articleId));
                    }
                  } finally {
                    setRecentArticles(prev => prev.filter(a => a.id !== articleId));
                    try { await forceRefreshArticles?.(); } catch(e) {}
                    setPendingDeletion(null);
                  }
                })();
              }}
              style={{ paddingRight: 10 }}
            >
              <Ionicons name="close" size={22} color="#9ca3af" />
            </TouchableOpacity>
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
