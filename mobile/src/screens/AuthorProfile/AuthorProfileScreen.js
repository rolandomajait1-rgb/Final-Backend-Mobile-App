import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Image,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { useArticles } from '../../context/ArticleContext';
import { colors } from '../../styles';
import ArticleMediumCard from '../../components/articles/ArticleMediumCard';
import { ArticleActionMenu } from '../../components/common';
import BottomNavigation from '../../components/common/BottomNavigation';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import { showAuditToast } from '../../utils/toastNotification';
import { ALLOWED_CATEGORIES } from '../../constants/categories';
import { formatArticleDate } from '../../utils/dateUtils';
import { searchArticles } from '../../api/services/articleService';
import { debounce } from '../../utils/debounce';
import { handleAuthorPress } from '../../utils/authorNavigation';
import { handleCategoryPress } from '../../utils/categoryNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeHeader from '../homepage/HomeHeader';


const LOGO = require('../../../assets/logo.png');

export default function AuthorProfileScreen({ route, navigation }) {
  const { authorId, authorName } = route.params ?? {};
  const [articles, setArticles] = useState([]);
  const [author, setAuthor] = useState(null);
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
  const { forceRefreshArticles, removeArticleLocally } = useArticles();

  const fetchCategories = useCallback(async () => {
    try {
      const response = await client.get('/api/categories');
      const filteredCategories = (response.data ?? []).filter(cat => ALLOWED_CATEGORIES.includes(cat.name));
      setCategories(filteredCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchAuthorArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching articles for author ID:', authorId);
      
      const response = await client.get(`/api/articles/author-public/${authorId}`);
      console.log('Full API response:', response.data);
      
      // The API returns { articles: {...}, article_count: X, author: {...} }
      // articles is a paginated object with 'data' property
      let articlesData = [];
      
      if (response.data.articles) {
        if (response.data.articles.data) {
          // Paginated response
          articlesData = response.data.articles.data;
        } else if (Array.isArray(response.data.articles)) {
          // Direct array
          articlesData = response.data.articles;
        }
      }
      
      console.log('Extracted articles:', articlesData);
      console.log('Number of articles:', articlesData.length);
      setArticles(articlesData);
      
      // Get author info from response
      if (response.data.author) {
        console.log('Author from API:', response.data.author);
        setAuthor(response.data.author);
      } else if (articlesData.length > 0 && articlesData[0].author) {
        console.log('Author from first article:', articlesData[0].author);
        setAuthor(articlesData[0].author);
      }
    } catch (err) {
      console.error(`Error fetching articles for author ${authorId}:`, err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.message);
      
      if (err.message === 'Network Error') {
        setError('Cannot connect to server. Please check your internet connection.');
      } else if (err.response?.status === 404) {
        setError('Author not found or has no articles.');
      } else {
        setError(`Failed to load articles: ${err.response?.data?.error || err.message}`);
      }
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [authorId]);

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

  const checkAdminStatus = async () => {
    const userJson = await AsyncStorage.getItem('user_data');
    if (userJson) {
      const user = JSON.parse(userJson);
      setUserRole(user.role);
    }
  };

  useEffect(() => {
    checkAdminStatus();
    fetchCategories();
    fetchAuthorArticles();
  }, [fetchCategories, fetchAuthorArticles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAuthorArticles();
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
      setShowDeleteModal(false);
      showAuditToast('success', 'Article deleted successfully');

      // Register deletion in context — prevents API re-fetch from bringing it back
      removeArticleLocally(menuArticle.id);
      // Emit event — HomeScreen listener handles the delayed background refresh
      DeviceEventEmitter.emit('ARTICLE_DELETED', menuArticle.id);
    } catch (err) {
      if (err.response?.status === 404) {
        setArticles(prev => prev.filter(a => a.id !== menuArticle.id));
        setShowDeleteModal(false);
        showAuditToast('info', 'Article was already deleted');
        removeArticleLocally(menuArticle.id);
        DeviceEventEmitter.emit('ARTICLE_DELETED', menuArticle.id);
      } else {
        console.error("Error deleting article:", err);
        showAuditToast('error', 'Failed to delete article');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditArticle = () => {
    setShowMenu(false);
    navigation.navigate("Management", { screen: "EditArticle", params: { articleId: menuArticle.id } });
  };

  const renderHeader = () => (
    <View className="bg-white">
      {/* Author Info Header */}
      <View className="px-5 pt-2 pb-4 bg-white border-b-[3px]" style={{ borderBottomColor: '#075985' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-2 self-start p-1 -ml-1">
          <Ionicons name="arrow-back" size={24} color="#075985" />
        </TouchableOpacity>

        <View className="flex-row items-center">
          <View className="w-[64px] h-[64px] rounded-full mr-4 overflow-hidden bg-white">
            <Image source={LOGO} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </View>
          <View className="flex-1 justify-center">
            <Text className="text-[26px] font-bold tracking-tight mb-0.5" style={{ color: '#075985' }}>
              {author?.user?.name || authorName || 'Author'}
            </Text>
            <Text className="text-[15px] italic font-medium" style={{ color: '#0284c7' }}>
              Articles: {articles.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Latest Articles Header */}
      <View className="px-5 pt-6 pb-4">
        <Text className="text-[22px] text-gray-700 font-normal">
          Latest Articles
        </Text>
      </View>
    </View>
  );

  const renderLoadingState = () => (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="mt-4" style={{ color: colors.textSecondary }}>
        Loading articles...
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-4 py-12">
      <Ionicons name="document-text-outline" size={64} color={colors.border} />
      <Text className="text-2xl font-bold mt-6 text-center" style={{ color: colors.text }}>
        No Articles Yet
      </Text>
      <Text className="text-center mt-2" style={{ color: colors.textSecondary }}>
        This author hasn't published any articles yet.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-shrink-0 bg-white">
          <HomeHeader 
            categories={categories} 
            onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
            navigation={navigation} 
          />
        </View>
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-shrink-0 bg-white">
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          onSearch={debouncedSearch}
          onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
          navigation={navigation}
        />
      </View>

      {searchQuery.trim() !== '' ? (
        <View className="flex-1 bg-white">
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
                  author={item.author?.user?.name || item.author?.name || 'Unknown Author'}
                  date={formatArticleDate(item.created_at || item.published_at)}
                  image={item.featured_image_url || item.featured_image}
                  hashtags={item.tags?.map((t) => t.name) || []}
                  onPress={() => handleArticlePress(item)}
                  onMenuPress={isAdminUser ? (pos) => handleMenuPress(item, pos) : undefined}
                  onTagPress={(tagName) => navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName } })}
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
        </View>
      ) : (
        <>
        {error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text className="mt-4 text-center" style={{ color: colors.error }}>
            {error}
          </Text>
          <TouchableOpacity
            className="mt-6 px-6 py-3 rounded-lg"
            style={{ backgroundColor: colors.primary }}
            onPress={fetchAuthorArticles}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1 bg-white">
          <FlatList
            data={articles}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={renderHeader}
            renderItem={({ item }) => (
              <View className="px-5">
                <ArticleMediumCard
                  title={item.title}
                  category={item.categories?.[0]?.name || 'Uncategorized'}
                  author={item.author?.user?.name || item.author?.name || authorName}
                  date={formatArticleDate(item.created_at || item.published_at)}
                  image={item.featured_image_url || item.featured_image}
                  hashtags={item.tags}
                  onPress={() => handleArticlePress(item)}
                  onMenuPress={isAdminUser ? (pos) => handleMenuPress(item, pos) : undefined}
                  onTagPress={(tagName) => navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName } })}
                  onAuthorPress={() => handleAuthorPress(item, navigation)}
                  onCategoryPress={(category) => handleCategoryPress(category, navigation)}
                  navigation={navigation}
                />
              </View>
            )}
            ListEmptyComponent={renderEmptyState}
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
        </View>
      )}
      </>
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

      <BottomNavigation navigation={navigation} activeTab="Home" />
    </View>
  );
}
