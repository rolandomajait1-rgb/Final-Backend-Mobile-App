import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreenSkeleton, ArticleLargeCardSkeleton, ArticleCardSkeleton } from "../../components/common";
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
import { isAdminOrModerator } from "../../utils/authUtils";
import { colors } from "../../styles";
import { debounce } from "../../utils/debounce";
import { showAuditToast } from "../../utils/toastNotification";

// ─── ARTICLES LIST ────────────────────────────────────────────────────────────
const ArticlesListContent = ({
  latestArticles,
  refreshing,
  onRefresh,
  loadingMore,
  hasMore,
  onLoadMore,
  onArticlePress,
  handleMenuPress,
  onTagPress,
  onAuthorPress,
  isAdminUser,
}) => (
  <ScrollView
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
            date={
              article.created_at || article.published_at
                ? new Date(
                    article.created_at || article.published_at,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""
            }
            image={article.featured_image_url || article.featured_image}
            onPress={() => onArticlePress(article)}
            onMenuPress={isAdminUser ? (e) => handleMenuPress(article, e) : undefined}
            onTagPress={onTagPress}
            onAuthorPress={() => onAuthorPress(article)}
          />
        ))
      ) : (
        <Text className="text-center text-gray-500 my-4">
          No recent articles
        </Text>
      )}
    </View>

    <View className="px-4 mb-2">
      <Text className="text-2xl font-bold text-gray-900 mb-4 mt-2">
        Recent Articles
      </Text>
      {latestArticles?.length > 1 ? (
        <View className="gap-1">
          {latestArticles.slice(1, 6).map((article) => (
            <ArticleMediumCard
              key={article.id}
              title={article.title}
              category={article.categories?.[0]?.name}
              author={
                article.author_name || article.author?.name || "Unknown Author"
              }
              date={
                article.created_at || article.published_at
                  ? new Date(
                      article.created_at || article.published_at,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""
              }
              image={article.featured_image_url || article.featured_image}
              hashtags={article.tags}
              onPress={() => onArticlePress(article)}
              onMenuPress={isAdminUser ? (e) => handleMenuPress(article, e) : undefined}
              onAuthorPress={() => onAuthorPress(article)}
              onTagPress={onTagPress}
            />
          ))}
        </View>
      ) : (
        <Text className="text-center text-gray-500 my-4">
          No recent articles
        </Text>
      )}
    </View>

    {hasMore && (
      <View className="items-center mb-4">
        <TouchableOpacity
          onPress={onLoadMore}
          disabled={loadingMore}
          className="py-2"
        >
          <Text className="text-blue-500 font-semibold text-base">
            {loadingMore ? "Loading..." : "Load More"}
          </Text>
        </TouchableOpacity>
      </View>
    )}
  </ScrollView>
);

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { latestArticles = [], refreshArticles } = useArticles();
  const hasMountedRef = useRef(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [menuArticle, setMenuArticle] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuY, setMenuY] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  // Local filtered articles for category selection
  const [filteredArticles, setFilteredArticles] = useState([]);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const adminStatus = await isAdminOrModerator();
    setIsAdminUser(adminStatus);
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data ?? []);
    } catch (_) {}
  };

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 3) {
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
    () => debounce(handleSearch, 500),
    [handleSearch]
  );

  // Bug #3 Fix: fetchArticles now actually stores its results and filters by category
  const fetchArticles = useCallback(async (pageNum = 1, categoryId = null) => {
    try {
      const params = { limit: 10, page: pageNum };
      if (categoryId) params.category = categoryId;
      const res = await getArticles(params);
      const articles = res.data?.data ?? [];
      const lastPage = res.data?.last_page ?? 1;
      setFilteredArticles(prev =>
        pageNum === 1 ? articles : [...prev, ...articles]
      );
      setHasMore(pageNum < lastPage);
      setPage(pageNum);
    } catch (e) {
      console.error("Error fetching articles:", e);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Only refresh on subsequent focuses (not on initial mount — ArticleContext handles that)
      if (hasMountedRef.current) {
        refreshArticles();
      } else {
        hasMountedRef.current = true;
      }
    }, [refreshArticles]),
  );

  useEffect(() => {
    setLoading(true);
    fetchArticles(1, selectedCategory).finally(() => setLoading(false));
  }, [selectedCategory, fetchArticles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchArticles(1, selectedCategory), refreshArticles()]);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchArticles(page + 1, selectedCategory);
    setLoadingMore(false);
  };

  const handleMenuPress = (article, event) => {
    if (isAdminUser) {
      setMenuArticle(article);
      if (event?.nativeEvent?.pageY) {
        setMenuY(event.nativeEvent.pageY + 15);
      }     
      setShowMenu(true);
    }
  };

  // Bug #10 Fix: null guard on menuArticle before accessing .id
  const handleEdit = () => {
    if (!menuArticle) return;
    setShowMenu(false);
    navigation.navigate("EditArticle", { articleId: menuArticle.id });
  };

  const handleDelete = () => {
    if (!menuArticle) return;
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!menuArticle?.id || deletingArticle) {
      return;
    }

    try {
      setDeletingArticle(true);
      await deleteArticle(menuArticle.id);
      setShowDeleteModal(false);
      // Bug #5 Fix: Use toast instead of Alert
      showAuditToast("success", "Article deleted successfully");
      await refreshArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      showAuditToast("error", "Failed to delete article. Please try again.");
    } finally {
      setDeletingArticle(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="flex-shrink-0">
          <HomeHeader
            categories={categories}
            onCategorySelect={setSelectedCategory}
            onMenuPress={() => {}}
            onSearchPress={() => {}}
            onGridPress={() => navigation.navigate("Admin")}
            onSearch={debouncedSearch}
            navigation={navigation}
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
          onCategorySelect={setSelectedCategory}
          onMenuPress={() => {}}
          onSearchPress={() => {}}
          onGridPress={() => navigation.navigate("Admin")}
          onSearch={debouncedSearch}
          navigation={navigation}
        />
      </View>

      {/* Flexible Content Area */}
      <View className="flex-1">
        {searchQuery.trim().length >= 3 ? (
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
                  date={
                    article.created_at || article.published_at
                      ? new Date(
                          article.created_at || article.published_at,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently"
                  }
                  image={article.featured_image_url || article.featured_image}
                  onPress={() =>
                    navigation.navigate("ArticleDetail", {
                      slug: article.slug,
                      article,
                    })
                  }
                  onMenuPress={isAdminUser ? (e) => handleMenuPress(article, e) : undefined}
                  onTagPress={(tag) =>
                    navigation.navigate("TagArticles", { tagName: tag })
                  }
                  onAuthorPress={() => {
                    if (article.author?.id) {
                      navigation.navigate("AuthorProfile", {
                        authorId: article.author.id,
                        authorName:
                          article.author.name || article.author.user?.name,
                      });
                    }
                  }}
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
            // Bug #3 Fix: Use filteredArticles when a category is active, else latestArticles
            latestArticles={selectedCategory ? filteredArticles : latestArticles}
            refreshing={refreshing}
            onRefresh={onRefresh}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            onArticlePress={(article) =>
              navigation.navigate("ArticleDetail", {
                slug: article.slug,
                article,
              })
            }
            handleMenuPress={(article, e) => handleMenuPress(article, e)}
            isAdminUser={isAdminUser}
            onTagPress={(tagName) =>
              navigation.navigate("TagArticles", { tagName })
            }
            onAuthorPress={(article) => {
              if (article.author?.id) {
                navigation.navigate("AuthorProfile", {
                  authorId: article.author.id,
                  authorName: article.author.name || article.author.user?.name,
                });
              }
            }}
          />
        )}
      </View>

      {/* Edit/Delete Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40"
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={{ position: 'absolute', top: menuY, right: 40 }}>
            <View
              className="bg-white rounded-xl shadow-lg border border-gray-50 py-1"
              style={{ minWidth: 140, elevation: 5 }}
            >
              <TouchableOpacity
                onPress={handleEdit}
                className="flex-row items-center px-5 py-3"
              >
                <Ionicons name="create-outline" size={20} color="#0284c7" />
                <Text className="ml-4 text-gray-700 text-[15px]">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-row items-center px-5 py-3"
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text className="ml-4 text-red-500 text-[15px]">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeTab="Home" />

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

      {/* Floating Action Button (Create Article) - Only for Admins */}
      {isAdminUser && (
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateArticle')}
          style={{
            position: 'absolute',
            bottom: 110, // Adjusted higher
            right: 20,
            backgroundColor: '#f39c12',
            width: 70,
            height: 70,
            borderRadius: 100,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
        >
          <Ionicons name="add" size={48} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
