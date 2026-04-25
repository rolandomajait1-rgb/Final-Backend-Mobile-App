import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo, useEffect } from 'react';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import SendFeedbackCard from './SendFeedbackCard';
import RequestCoverageCard from './RequestCoverageCard';
import JoinHeraldCard from './JoinHeraldCard';
import OfficeInformationCard from './OfficeInformationCard';
import { colors } from '../../styles';
import { debounce } from '../../utils/debounce';
import { searchArticles } from '../../api/services/articleService';
import ArticleMediumCard from '../../components/articles/ArticleMediumCard';
import { handleAuthorPress } from '../../utils/authorNavigation';
import { handleCategoryPress } from '../../utils/categoryNavigation';
import { isAdminOrModerator } from '../../utils/authUtils';
import { showAuditToast } from '../../utils/toastNotification';
import { ArticleActionMenu } from '../../components/common';
import { formatArticleDate } from '../../utils/dateUtils';

export default function PressHubScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [menuArticle, setMenuArticle] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuX, setMenuX] = useState(0);
  const [menuY, setMenuY] = useState(0);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const adminStatus = await isAdminOrModerator();
    setIsAdminUser(adminStatus);
  };

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

  const debouncedSearch = useMemo(() => debounce(handleSearch, 500), [handleSearch]);

  const handleMenuPress = (article, pos) => {
    setMenuArticle(article);
    setMenuX(pos.px);
    setMenuY(pos.py);
    setShowMenu(true);
  };

  const handleEditArticle = () => {
    setShowMenu(false);
    navigation.navigate("Management", { screen: "EditArticle", params: { articleId: menuArticle.id } });
  };

  const handleDeleteArticle = async () => {
    setShowMenu(false);
    try {
      const { deleteArticle } = await import("../../api/services/articleService");
      await deleteArticle(menuArticle.id);
      setSearchResults(prev => prev.filter(a => a.id !== menuArticle.id));
      showAuditToast("success", "Article deleted successfully");
    } catch (err) {
      console.error("Error deleting article:", err);
      showAuditToast("error", "Failed to delete article");
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar hidden={false} />

      {/* Header */}
      <HomeHeader
        categories={[]}
        onCategorySelect={() => {}}
        onMenuPress={() => {}}
        onGridPress={() => navigation.navigate('Management', { screen: 'Admin' })}
        onSearch={debouncedSearch}
        navigation={navigation}
        enableSearch={true}
        searchQuery={searchQuery}
      />

      {/* Content */}
      <ScrollView 
        className="flex-1 px-4 py-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {searchQuery.trim() !== '' ? (
          <View>
            {searching ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-gray-500 mt-4">Searching...</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Ionicons name="search-outline" size={48} color={colors.border} />
                <Text className="text-gray-500 mt-4 text-center">No articles found for "{searchQuery}"</Text>
              </View>
            ) : (
              <View className="gap-3">
                {searchResults.map((article) => (
                  <ArticleMediumCard
                    key={article.id}
                    title={article.title}
                    category={article.categories?.[0]?.name || 'Uncategorized'}
                    author={article.author_name || article.author?.name || 'Unknown Author'}
                    date={formatArticleDate(article.created_at || article.published_at)}
                    image={article.featured_image_url || article.featured_image}
                    hashtags={article.tags?.map((t) => t.name) || []}
                    onPress={() => navigation.navigate('ArticleStack', { screen: 'ArticleDetail', params: { slug: article.slug, article } })}
                    onMenuPress={isAdminUser ? (pos) => handleMenuPress(article, pos) : undefined}
                    onTagPress={(tagName) => navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName } })}
                    onAuthorPress={() => handleAuthorPress(article, navigation)}
                    onCategoryPress={(category) => handleCategoryPress(category, navigation)}
                    navigation={navigation}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View className="gap-4">
            <SendFeedbackCard />
            <RequestCoverageCard />
            <JoinHeraldCard />
            <OfficeInformationCard />
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeTab="PressHub" />

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
          {
            label: "Delete",
            icon: "trash-outline",
            color: "#ef4444",
            onPress: handleDeleteArticle,
          },
        ]}
      />
    </View>
  );
}
