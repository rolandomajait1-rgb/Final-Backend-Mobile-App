import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, FlatList,
  RefreshControl, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import ArticleLargeCard from '../../components/articles/ArticleLargeCard';
import { Loader, ArticleActionMenu } from '../../components/common';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import { showAuditToast } from '../../utils/toastNotification';
import BottomNavigation from '../../components/common/BottomNavigation';
import { getArticles, searchArticles } from '../../api/services/articleService';
import { debounce } from '../../utils/debounce';
import { colors } from '../../styles';
import HomeHeader from '../homepage/HomeHeader';
import client from '../../api/client';
import { ALLOWED_CATEGORIES } from '../../constants/categories';
import { formatArticleDate } from '../../utils/dateUtils';
import { handleAuthorPress } from '../../utils/authorNavigation';

export default function ExploreScreen({ navigation }) {
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null); // 'author', 'tag', 'category'
  const [authors, setAuthors] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const isAdminUser = userRole === 'admin' || userRole === 'moderator';
  const [menuArticle, setMenuArticle] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuX, setMenuX] = useState(0);
  const [menuY, setMenuY] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bug #7 Fix: Use centralized client (has auth interceptors) instead of raw axios
  const fetchCategories = async () => {
    try {
      const response = await client.get('/api/categories');
      const filteredCategories = (response.data ?? []).filter(cat => ALLOWED_CATEGORIES.includes(cat.name));
      setCategories(filteredCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTrendingArticles = useCallback(async () => {
    try {
      // Fetch articles and sort by view_count or created date
      const res = await getArticles({ limit: 20 });
      const data = res.data?.data ?? res.data ?? [];
      
      // Sort by view_count (trending) - articles with most views first
      const sorted = [...data].sort((a, b) => {
        const viewsA = a.view_count || 0;
        const viewsB = b.view_count || 0;
        return viewsB - viewsA;
      });
      
      setTrendingArticles(sorted);
      
      // Extract unique authors and tags from articles
      const uniqueAuthors = [];
      const uniqueTags = [];
      const authorIds = new Set();
      const tagNames = new Set();
      
      sorted.forEach(article => {
        if (article.author && !authorIds.has(article.author.id)) {
          authorIds.add(article.author.id);
          uniqueAuthors.push({
            id: article.author.id,
            name: article.author.user?.name || article.author.name || 'Unknown',
          });
        }
        
        article.tags?.forEach(tag => {
          if (!tagNames.has(tag.name)) {
            tagNames.add(tag.name);
            uniqueTags.push(tag);
          }
        });
      });
      
      setAuthors(uniqueAuthors);
      setTags(uniqueTags);
    } catch (e) {
      console.error('Error fetching trending articles:', e);
    }
  }, []);

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
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce search to avoid too many API calls
  const debouncedSearch = useMemo(() => debounce(handleSearch, 500), [handleSearch]);

  useEffect(() => {
    const checkAdmin = async () => {
      const userJson = await AsyncStorage.getItem('user_data');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserRole(user.role);
      }
    };
    checkAdmin();
    const loadData = async () => {
      setLoading(true);
      await fetchCategories();
      await fetchTrendingArticles();
      setLoading(false);
    };
    loadData();
  }, [fetchTrendingArticles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrendingArticles();
    setRefreshing(false);
  };

  const handleArticlePress = (article) => {
    navigation.navigate('ArticleStack', { screen: 'ArticleDetail', params: { slug: article.slug } });
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
      
      setTrendingArticles(prev => prev.filter(a => a.id !== menuArticle.id));
      setSearchResults(prev => prev.filter(a => a.id !== menuArticle.id));
      setShowDeleteModal(false);
      showAuditToast('success', 'Article deleted successfully');
    } catch (err) {
      console.error("Error deleting article:", err);
      showAuditToast('error', 'Failed to delete article');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditArticle = () => {
    setShowMenu(false);
    navigation.navigate("Management", { screen: "EditArticle", params: { articleId: menuArticle.id } });
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <HomeHeader categories={categories} navigation={navigation} />
        <View className="flex-1 justify-center items-center">
          <Loader />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-shrink-0">
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          onSearch={debouncedSearch}
          navigation={navigation}
        />
      </View>

      {searchQuery.trim() !== '' ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={
            <View className="px-4 py-4 border-b border-gray-200 bg-white">
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                Search Results for &quot;{searchQuery}&quot;
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="px-4">
              <ArticleLargeCard
                title={item.title}
                category={item.categories?.[0]?.name || 'Uncategorized'}
                author={item.author_name || item.author?.name || item.author?.user?.name || 'Unknown Author'}
                date={formatArticleDate(item.created_at || item.published_at)}
                image={item.featured_image_url || item.featured_image}
                hashtags={item.tags?.map((t) => t.name) || []}
                onPress={() => handleArticlePress(item)}
                onMenuPress={isAdminUser ? (pos) => handleMenuPress(item, pos) : undefined}
                onTagPress={(tag) => navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName: tag } })}
                onAuthorPress={() => handleAuthorPress(item, navigation)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center px-4 py-12">
              {searching ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <Text className="text-center text-gray-500 text-lg">
                  No articles found for &quot;{searchQuery}&quot;
                </Text>
              )}
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <FlatList
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
            {/* Filter Section */}
            <View className="px-4 py-4 bg-white border-b border-gray-200">
              <Text className="text-gray-500 text-xl font-bold mb-3 ml-3 tracing-widest">Filter</Text>
              <View className="flex-row gap-3 justify-center">
                <TouchableOpacity
                  className={`px-6 py-2 rounded-full border ${
                    selectedFilter === 'author' ? 'border-cyan-700 bg-gray-50' : 'border-gray-300 bg-white'
                  }`}
                  onPress={() => setSelectedFilter(selectedFilter === 'author' ? null : 'author')}
                >
                  <Text 
                    className={selectedFilter === 'author' ? 'text-cyan-700' : 'text-gray-600'}
                    style={{ letterSpacing: 1 }}
                  >
                    Author
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-10 py-2 rounded-full border ${
                    selectedFilter === 'tag' ? 'border-cyan-700 bg-gray-50' : 'border-gray-300 bg-white'
                  }`}
                  onPress={() => setSelectedFilter(selectedFilter === 'tag' ? null : 'tag')}
                >
                  <Text 
                    className={selectedFilter === 'tag' ? 'text-cyan-700' : 'text-gray-600'}
                    style={{ letterSpacing: 1 }}
                  >
                    Tag
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-6 py-2 rounded-full border ${
                    selectedFilter === 'category' ? 'border-cyan-700 bg-gray-50' : 'border-gray-300 bg-white'
                  }`}
                  onPress={() => setSelectedFilter(selectedFilter === 'category' ? null : 'category')}
                >
                  <Text 
                    className={selectedFilter === 'category' ? 'text-cyan-700' : 'text-gray-600'}
                    style={{ letterSpacing: 1 }}
                  >
                    Category
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Show selected filter items as pills */}
              {selectedFilter && (
                <View className="mt-6">
                  <View className="flex-row flex-wrap gap-2">
                     {selectedFilter === 'author' && authors.map((author) => (
                      <TouchableOpacity
                        key={author.id}
                        className="px-4 py-1 rounded-full border border-gray-300 bg-white"
                        onPress={() => {
                          navigation.navigate('ArticleStack', {
                            screen: 'AuthorProfile',
                            params: {
                              authorId: author.id,
                              authorName: author.name
                            }
                          });
                          setSelectedFilter(null);
                        }}
                      >
                        <Text className="text-gray-700">{author.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {selectedFilter === 'tag' && tags.map((tag) => (
                      <TouchableOpacity
                        key={tag.id}
                        className="px-4 py-1 rounded-full border border-gray-300 bg-white"
                        onPress={() => {
                          navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName: tag.name } });
                          setSelectedFilter(null);
                        }}
                      >
                        <Text className="text-gray-700">#{tag.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {selectedFilter === 'category' && categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        className="px-4 py-1 rounded-full border border-gray-300 bg-white"
                        onPress={() => {
                          const categoryScreenMap = {
                            'News': 'NewsScreen',
                            'Literary': 'LiteraryScreen',
                            'Opinion': 'OpinionScreen',
                            'Sports': 'SportsScreen',
                            'Features': 'FeaturesScreen',
                            'Specials': 'SpecialsScreen',
                            'Art': 'ArtScreen',
                          };
                          const screenName = categoryScreenMap[category.name];
                          if (screenName) {
                            navigation.navigate('ArticleStack', { screen: screenName });
                          }
                          setSelectedFilter(null);
                        }}
                      >
                        <Text className="text-gray-700">{category.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Trending Articles Header */}
            <View className="px-4 py-4 border-b border-gray-200 bg-white">
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                Trending Articles
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Most viewed articles
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View className="px-4">
            <ArticleLargeCard
              title={item.title}
              category={item.categories?.[0]?.name || 'Uncategorized'}
              author={item.author_name || item.author?.name || item.author?.user?.name || 'Unknown Author'}
              date={formatArticleDate(item.created_at || item.published_at)}
              image={item.featured_image_url || item.featured_image}
              hashtags={item.tags?.map((t) => t.name) || []}
              onPress={() => handleArticlePress(item)}
              onTagPress={(tag) => {
                navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName: tag } });
              }}
              onMenuPress={isAdminUser ? (pos) => handleMenuPress(item, pos) : undefined}
              onAuthorPress={() => handleAuthorPress(item, navigation)}
            />
          </View>
        )}
        data={trendingArticles}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={10}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-4 py-12">
            <Text className="text-center text-gray-500 text-lg">
              No trending articles yet
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
      )}

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
          // Only Admin can Delete
          ...(userRole === 'admin' ? [{
            label: "Delete",
            icon: "trash-outline",
            color: "#ef4444",
            onPress: handleDeleteArticle,
          }] : []),
        ]}
      />

      <DeleteConfirmModal
        visible={showDeleteModal}
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation navigation={navigation} activeTab="Explore" />
      </View>
    </View>
  );
}
