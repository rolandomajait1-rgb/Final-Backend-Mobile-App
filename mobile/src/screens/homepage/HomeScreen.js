import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Loader } from "../../components/common";
import ArticleMediumCard from "../../components/articles/ArticleMediumCard";
import HomeHeader from "./HomeHeader";
import BottomNavigation from "../../components/common/BottomNavigation";
import ArticleLargeCard from "../../components/articles/ArticleLargeCard";
import { useArticles } from "../../context/ArticleContext";
import { getArticles, searchArticles } from "../../api/services/articleService";
import { getCategories } from "../../api/services/categoryService";
import { deleteArticle } from "../../api/services/articleService";
import { isAdminOrModerator } from "../../utils/authUtils";
import { colors } from "../../styles";

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
      <Text className="text-3xl font-bold text-gray-900 mb-4 mt-2">Latest Articles</Text>
      {latestArticles?.length > 0 ? (
        latestArticles.slice(0, 1).map((article) => (
          <ArticleLargeCard
            key={article.id}
            title={article.title}
            category={article.categories?.[0]?.name}
            hashtags={article.tags?.map((t) => t.name) || []}
            author={article.author_name || article.author?.name || 'Unknown Author'}
            date={
              (article.created_at || article.published_at)
                ? new Date(article.created_at || article.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''
            }
            image={article.featured_image_url || article.featured_image}
            onPress={() => onArticlePress(article)}
            onMenuPress={() => handleMenuPress(article)}
            onTagPress={onTagPress}
            onAuthorPress={() => onAuthorPress(article)}
          />
        ))
      ) : (
        <Text className="text-center text-gray-500 my-4">No recent articles</Text>
      )}
    </View>

    <View className="px-4 mb-2">
      <View className="border-2 border-gray-200 mb-4" />
      <Text className="text-2xl font-bold text-gray-900 mb-4">Recent Articles</Text>
      {latestArticles?.length > 1 ? (
        <View className="gap-1">
          {latestArticles.slice(1, 6).map((article) => (
            <ArticleMediumCard
              key={article.id}
              title={article.title}
              category={article.categories?.[0]?.name}
              author={article.author_name || article.author?.name || 'Unknown Author'}
              date={
                (article.created_at || article.published_at)
                  ? new Date(article.created_at || article.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''
              }
              image={article.featured_image_url || article.featured_image}
              onPress={() => onArticlePress(article)}
              onMenuPress={() => handleMenuPress(article)}
            />
          ))}
        </View>
      ) : (
        <Text className="text-center text-gray-500 my-4">No recent articles</Text>
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
            {loadingMore ? 'Loading...' : 'Load More'}
          </Text>
        </TouchableOpacity>
      </View>
    )}
  </ScrollView>
);

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { latestArticles = [], refreshArticles, forceRefreshArticles } = useArticles();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

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

  const handleSearch = async (query) => {
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
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const fetchArticles = useCallback(
    async (pageNum = 1, categoryId = null) => {
      try {
        const params = { limit: 10, page: pageNum };
        if (categoryId) params.category = categoryId;
        const res = await getArticles(params);
        const lastPage = res.data?.last_page ?? 1;
        setHasMore(pageNum < lastPage);
        setPage(pageNum);
      } catch (e) {
        console.error('Error fetching articles:', e);
      }
    },
    []
  );

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
    }, [refreshArticles])
  );

  useEffect(() => {
    setLoading(true);
    fetchArticles(1, selectedCategory).finally(() => setLoading(false));
  }, [selectedCategory, fetchArticles]);


  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchArticles(1, selectedCategory),
      refreshArticles(),
    ]);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchArticles(page + 1, selectedCategory);
    setLoadingMore(false);
  };

  const handleMenuPress = (article) => {
    if (isAdminUser) {
      setMenuArticle(article);
      setShowMenu(true);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    navigation.navigate('EditArticle', { articleId: menuArticle.id });
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      'Delete Article',
      'Are you sure you want to delete this article? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteArticle(menuArticle.id);
              Alert.alert('Success', 'Article deleted successfully');
              await refreshArticles();
            } catch (error) {
              console.error('Error deleting article:', error);
              Alert.alert('Error', 'Failed to delete article. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) return <Loader />;

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: 40 }}>
      {/* Fixed Header */}
      <View className="flex-shrink-0">
        <HomeHeader
          categories={categories}
          onCategorySelect={setSelectedCategory}
          onMenuPress={() => {}}
          onSearchPress={() => {}}
          onGridPress={() => navigation.navigate('Admin')}
          onSearch={handleSearch}
          navigation={navigation}
        />
      </View>

      {/* Flexible Content Area */}
      <View className="flex-1">
        {searchQuery.trim().length >= 3 ? (
          // Search Results View
          <ScrollView className="flex-1 px-4">
            <Text className="text-2xl font-bold text-gray-900 my-4">
              Search Results for "{searchQuery}"
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
                  author={article.author_name || article.author?.name || article.author?.user?.name || 'Unknown Author'}
                  date={
                    (article.created_at || article.published_at)
                      ? new Date(article.created_at || article.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recently'
                  }
                  image={article.featured_image_url || article.featured_image}
                  onPress={() => navigation.navigate('ArticleDetail', { slug: article.slug, article })}
                  onMenuPress={() => handleMenuPress(article)}
                  onTagPress={(tag) => navigation.navigate('TagArticles', { tagName: tag })}
                  onAuthorPress={() => {
                    if (article.author?.id) {
                      navigation.navigate('AuthorProfile', {
                        authorId: article.author.id,
                        authorName: article.author.name || article.author.user?.name
                      });
                    }
                  }}
                />
              ))
            ) : (
              <Text className="text-center text-gray-500 my-8">
                No results found for "{searchQuery}"
              </Text>
            )}
          </ScrollView>
        ) : (
          <ArticlesListContent
            latestArticles={latestArticles}
            refreshing={refreshing}
            onRefresh={onRefresh}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            onArticlePress={(article) => navigation.navigate('ArticleDetail', { slug: article.slug, article })}
            handleMenuPress={handleMenuPress}
            onTagPress={(tagName) => navigation.navigate('TagArticles', { tagName })}
            onAuthorPress={(article) => {
              if (article.author?.id) {
                navigation.navigate('AuthorProfile', {
                  authorId: article.author.id,
                  authorName: article.author.name || article.author.user?.name
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
          <View className="flex-1 items-center justify-center px-6">
            <View className="bg-white rounded-lg shadow-lg" style={{ minWidth: 200 }}>
              <TouchableOpacity
                onPress={handleEdit}
                className="flex-row items-center px-6 py-4 border-b border-gray-200"
              >
                <Ionicons name="create-outline" size={24} color="#3b82f6" />
                <Text className="ml-4 text-gray-800 font-medium text-base">Edit Article</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-row items-center px-6 py-4"
              >
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
                <Text className="ml-4 text-red-600 font-medium text-base">Delete Article</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeTab="Home" />
    </View>
  );
}
