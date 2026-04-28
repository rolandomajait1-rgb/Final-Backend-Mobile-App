import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { colors } from '../../styles';
import ArticleMediumCard from '../../components/articles/ArticleMediumCard';
import { ArticleActionMenu } from '../../components/common';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import { showAuditToast } from '../../utils/toastNotification';
import { handleAuthorPress } from '../../utils/authorNavigation';
import { handleCategoryPress } from '../../utils/categoryNavigation';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import { ALLOWED_CATEGORIES } from '../../constants/categories';
import { formatArticleDate } from '../../utils/dateUtils';
import { searchArticles } from '../../api/services/articleService';
import { debounce } from '../../utils/debounce';

export default function TagArticlesScreen({ route, navigation }) {
  const { tagName, authorId, authorName } = route.params ?? {};

  console.log('TagArticlesScreen mounted with params:', { tagName, authorId, authorName });

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
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

  const fetchCategories = useCallback(async () => {
    try {
      const response = await client.get('/api/categories');
      const filteredCategories = (response.data ?? []).filter(cat => ALLOWED_CATEGORIES.includes(cat.name));
      setCategories(filteredCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchTagArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching articles for tag:', tagName);
      console.log('Author ID filter:', authorId);

      // If authorId is provided, filter by author too
      if (authorId) {
        console.log('Filtering by author:', authorId);
        // Fetch author's articles first, then filter by tag on client side
        const response = await client.get(`/api/articles/author-public/${authorId}`);
        const allAuthorArticles = response.data.articles?.data || response.data.articles || [];

        console.log('Total author articles:', allAuthorArticles.length);

        // Filter articles that have the specific tag
        const filteredArticles = allAuthorArticles.filter(article => {
          const hasTags = article.tags?.some(tag => {
            console.log('Comparing tag:', tag.name, 'with:', tagName);
            return tag.name.toLowerCase() === tagName.toLowerCase();
          });
          return hasTags;
        });

        console.log('Filtered articles with tag:', filteredArticles.length);
        setArticles(filteredArticles);
      } else {
        console.log('Fetching all articles with tag (no author filter)');
        console.log('Tag parameter:', tagName);
        console.log('Tag type:', typeof tagName);

        const url = `/api/articles/public?tag=${encodeURIComponent(tagName)}`;
        console.log('Request URL:', url);

        const response = await client.get(url);
        console.log('Full response URL:', response.request?.responseURL || response.config.url);
        console.log('API response:', response.data);
        const articlesData = response.data.data || response.data || [];
        console.log('Articles found:', articlesData.length);

        // Log first article's tags to verify
        if (articlesData.length > 0 && articlesData[0].tags) {
          console.log('First article tags:', articlesData[0].tags.map(t => t.name));
        }

        setArticles(articlesData);
      }
    } catch (err) {
      console.error(`Error fetching articles for tag ${tagName}:`, err);
      setError(`Failed to load articles for #${tagName}`);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [tagName, authorId]);

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
    fetchTagArticles();
  }, [fetchCategories, fetchTagArticles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTagArticles();
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

      setArticles(prev => prev.filter(a => a.id !== menuArticle.id));
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

  const renderLoadingState = () => (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="mt-4" style={{ color: colors.textSecondary }}>
        Loading articles...
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-4">
      <Ionicons name="pricetag-outline" size={64} color={colors.border} />
      <Text className="text-2xl font-bold mt-6 text-center" style={{ color: colors.text }}>
        No Articles Found
      </Text>
      <Text className="text-center mt-2" style={{ color: colors.textSecondary }}>
        No articles with #{tagName} tag yet.
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Home Header with Gold Divider */}
      <View className="flex-shrink-0 bg-white">
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          onSearch={debouncedSearch}
          onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
          navigation={navigation}
        />
      </View>

      {/* Tag Header */}
      <View className="px-5 pt-1 pb-4 bg-white border-b-[3px]" style={{ borderBottomColor: '#075985' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-2 self-start p-1 -ml-1">
          <Ionicons name="arrow-back" size={24} color="#075985" />
        </TouchableOpacity>

        <View>
          <Text className="text-[26px] font-bold tracking-tight mb-0.5" style={{ color: '#075985' }}>
            #{tagName}
          </Text>
          <Text className="text-[15px] italic font-medium" style={{ color: '#0284c7' }}>
            Article count : {articles.length}
          </Text>
        </View>
      </View>

      {/* Content Area */}
      <View className="flex-1 bg-white">
        {searchQuery.trim() !== '' ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={
              <View className="px-5 pt-6 pb-4 border-b border-gray-100">
                <Text className="text-[22px] font-bold text-gray-800">
                  Search Results for &quot;{searchQuery}&quot;
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View className="px-5">
                <ArticleMediumCard
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
                  onCategoryPress={(category) => handleCategoryPress(category, navigation)}
                  navigation={navigation}
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
          <View className="flex-1 bg-white pt-4">
            {loading ? (
              renderLoadingState()
            ) : error ? (
              <View className="flex-1 justify-center items-center px-4">
                <Ionicons name="alert-circle" size={48} color={colors.error} />
                <Text className="mt-4 text-center" style={{ color: colors.error }}>
                  {error}
                </Text>
                <TouchableOpacity
                  className="mt-6 px-6 py-3 rounded-lg"
                  style={{ backgroundColor: colors.primary }}
                  onPress={fetchTagArticles}
                >
                  <Text className="text-white font-semibold">Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : articles.length === 0 ? (
              renderEmptyState()
            ) : (
              <FlatList
                data={articles}
                keyExtractor={(item) => String(item.id)}
                ListHeaderComponent={
                  <Text className="text-[22px] text-gray-700 mb-6 px-5 font-normal">
                    Latest Articles
                  </Text>
                }
                renderItem={({ item }) => (
                  <View className="px-5">
                    <ArticleMediumCard
                      title={item.title}
                      category={item.categories?.[0]?.name || 'Uncategorized'}
                      author={item.author_name || item.author?.name || item.author?.user?.name || 'Unknown Author'}
                      date={formatArticleDate(item.created_at || item.published_at)}
                      image={item.featured_image_url || item.featured_image}
                      hashtags={item.tags?.map((t) => t.name) || []}
                      onPress={() => handleArticlePress(item)}
                      onMenuPress={isAdminUser ? (pos) => handleMenuPress(item, pos) : undefined}
                      onTagPress={(tName) => {
                        if (tName !== tagName) {
                          navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName: tName } });
                        }
                      }}
                      onAuthorPress={() => handleAuthorPress(item, navigation)}
                      onCategoryPress={(category) => handleCategoryPress(category, navigation)}
                      navigation={navigation}
                    />
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
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
            )}
          </View>
        )}
      </View>

      {/* Article Action Menu */}
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

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        visible={showDeleteModal}
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeTab="Home" />
    </View>
  );
}
