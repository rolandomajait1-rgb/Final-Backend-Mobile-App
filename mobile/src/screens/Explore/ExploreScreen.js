import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { handleCategoryPress } from '../../utils/categoryNavigation';

export default function ExploreScreen({ navigation }) {
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topCategories, setTopCategories] = useState([]); // Top 10 categories by engagement
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null); // 'author', 'tag', 'category'
  const [selectedFilterItem, setSelectedFilterItem] = useState(null); // The selected author/tag/category object
  const [filteredArticles, setFilteredArticles] = useState([]);
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
      // Fetch articles and sort by trending score (views + likes + shares)
      const res = await getArticles({ limit: 20 });
      const data = res.data?.data ?? res.data ?? [];
      
      // Calculate trending score: views + (likes * 2) + (shares * 3)
      // Likes and shares are weighted more heavily than views
      const sorted = [...data].sort((a, b) => {
        const scoreA = (a.view_count || 0) + ((a.like_count || a.likes_count || 0) * 2) + ((a.shares_count || 0) * 3);
        const scoreB = (b.view_count || 0) + ((b.like_count || b.likes_count || 0) * 2) + ((b.shares_count || 0) * 3);
        return scoreB - scoreA;
      });
      
      setTrendingArticles(sorted);
      
      // Calculate trending score for an article
      const calculateScore = (article) => {
        return (article.view_count || 0) + 
               ((article.like_count || article.likes_count || 0) * 2) + 
               ((article.shares_count || 0) * 3);
      };
      
      // Extract authors with their total scores
      const authorScores = new Map();
      const tagScores = new Map();
      const categoryScores = new Map();
      
      sorted.forEach(article => {
        const score = calculateScore(article);
        
        // Extract author info
        let authorId = null;
        let authorName = null;
        
        if (article.author) {
          authorId = article.author.id;
          authorName = article.author.user?.name || article.author.name;
        } else if (article.author_id) {
          authorId = article.author_id;
          authorName = article.author_name || article.display_author_name;
        }
        
        // Accumulate author scores
        if (authorId && authorName) {
          if (!authorScores.has(authorId)) {
            authorScores.set(authorId, { id: authorId, name: authorName, score: 0 });
          }
          authorScores.get(authorId).score += score;
        }
        
        // Accumulate tag scores
        article.tags?.forEach(tag => {
          if (!tagScores.has(tag.id)) {
            tagScores.set(tag.id, { ...tag, score: 0 });
          }
          tagScores.get(tag.id).score += score;
        });
        
        // Accumulate category scores
        article.categories?.forEach(cat => {
          if (!categoryScores.has(cat.id)) {
            categoryScores.set(cat.id, { ...cat, score: 0 });
          }
          categoryScores.get(cat.id).score += score;
        });
      });
      
      // Sort and get top 10 for each
      const topAuthors = Array.from(authorScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(({ id, name }) => ({ id, name }));
      
      const topTags = Array.from(tagScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(({ id, name, slug }) => ({ id, name, slug }));
      
      const topCategories = Array.from(categoryScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(({ id, name, slug }) => ({ id, name, slug }));
      
      setAuthors(topAuthors);
      setTags(topTags);
      setTopCategories(topCategories);
      
      console.log('Top 10 Authors by engagement:', topAuthors);
      console.log('Top 10 Tags by engagement:', topTags);
      console.log('Top 10 Categories by engagement:', topCategories);
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

  const handleFilterItemClick = useCallback((filterType, item) => {
    setSelectedFilterItem(item);
    
    // Filter articles based on the selected filter type
    let filtered = [];
    if (filterType === 'author') {
      filtered = trendingArticles.filter(article => 
        article.author?.id === item.id || article.author_id === item.id
      );
    } else if (filterType === 'tag') {
      filtered = trendingArticles.filter(article =>
        article.tags?.some(tag => tag.name === item.name)
      );
    } else if (filterType === 'category') {
      filtered = trendingArticles.filter(article =>
        article.categories?.some(cat => cat.id === item.id)
      );
    }
    
    setFilteredArticles(filtered);
    setSelectedFilter(null); // Close the filter pills
  }, [trendingArticles]);

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

  // Reset filter when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup: Reset filter state when leaving the screen
        setSelectedFilter(null);
        setSelectedFilterItem(null);
        setFilteredArticles([]);
      };
    }, [])
  );

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
          onGridPress={() => navigation.navigate('Management', { screen: 'Admin' })}
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
                onCategoryPress={(category) => handleCategoryPress(category, navigation)}
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
                        onPress={() => handleFilterItemClick('author', author)}
                      >
                        <Text className="text-gray-700">{author.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {selectedFilter === 'tag' && tags.map((tag) => (
                      <TouchableOpacity
                        key={tag.id}
                        className="px-4 py-1 rounded-full border border-gray-300 bg-white"
                        onPress={() => handleFilterItemClick('tag', tag)}
                      >
                        <Text className="text-gray-700">#{tag.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {selectedFilter === 'category' && topCategories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        className="px-4 py-1 rounded-full border border-gray-300 bg-white"
                        onPress={() => handleFilterItemClick('category', category)}
                      >
                        <Text className="text-gray-700">{category.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Trending Articles Header or Filter Results Header */}
            {selectedFilterItem ? (
              <View className="px-4 py-4 border-b border-gray-200 bg-white">
                <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                  Search result for: {selectedFilterItem.name}
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedFilterItem(null);
                    setFilteredArticles([]);
                  }}
                  className="mt-2"
                >
                  <Text className="text-cyan-700 font-semibold">Clear filter</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="px-4 py-4 border-b border-gray-200 bg-white">
                <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                  Trending Articles
                </Text>
              </View>
            )}
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
              onCategoryPress={(category) => handleCategoryPress(category, navigation)}
            />
          </View>
        )}
        data={selectedFilterItem ? filteredArticles : trendingArticles}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={10}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-4 py-12">
            <Text className="text-center text-gray-500 text-lg">
              {selectedFilterItem 
                ? `No articles found for ${selectedFilterItem.name}`
                : 'No trending articles yet'
              }
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
