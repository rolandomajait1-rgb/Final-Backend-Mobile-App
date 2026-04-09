import { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  Alert, Share, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import BottomNavigation from '../../components/common/BottomNavigation';
import HTMLRenderer from '../../components/common/HTMLRenderer';
import HomeHeader from '../homepage/HomeHeader';
import { isAdminOrModerator } from '../../utils/authUtils';
import { deleteArticle } from '../../api/services/articleService';

const FALLBACK = 'https://via.placeholder.com/400x300/e2e8f0/64748b?text=No+Image';

// ─── Sub-components ──────────────────────────────────────────────────────────
function ArticleHero({ article, navigation, isAdminUser, showMenu, setShowMenu, onEdit, onDelete }) {
  const formattedDate = (article.created_at || article.published_at)
    ? new Date(article.created_at || article.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={{ height: 320, backgroundColor: '#e2e8f0' }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Image
        source={{ uri: article.featured_image_url || article.featured_image || FALLBACK }}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        resizeMode="cover"
      />

      {/* Dark Overlay */}
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />

      {/* Header Buttons */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View className="flex-row justify-between items-center px-4 pt-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="rounded-full p-2"
            style={{ backgroundColor: '#2C5F7F' }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            className="rounded-full p-2"
            style={{ backgroundColor: '#2C5F7F' }}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Admin Menu Dropdown */}
      {showMenu && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 30 }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          >
            <SafeAreaView style={{ position: 'absolute', top: 0, right: 16, zIndex: 40 }}>
              <View
                className="bg-white rounded-lg shadow-lg"
                style={{ minWidth: 180, elevation: 10, marginTop: 56 }}
              >
                {isAdminUser ? (
                  <>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                      className="flex-row items-center px-5 py-4 border-b border-gray-200"
                    >
                      <Ionicons name="create-outline" size={22} color="#3b82f6" />
                      <Text className="ml-3 text-gray-800 font-medium text-base">Edit Article</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="flex-row items-center px-5 py-4"
                    >
                      <Ionicons name="trash-outline" size={22} color="#ef4444" />
                      <Text className="ml-3 text-red-600 font-medium text-base">Delete Article</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="px-5 py-4">
                    <Text className="text-gray-600 text-sm">Admin access required</Text>
                  </View>
                )}
              </View>
            </SafeAreaView>
          </TouchableOpacity>
        </View>
      )}

      {/* Title / Author Overlay */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 24, zIndex: 10 }}>
        {article.categories?.length > 0 && (
          <View className="mb-2">
            <View className="bg-green-500 rounded-xl px-3 py-1 self-start">
              <Text className="text-white font-bold text-xs uppercase">
                {article.categories[0].name}
              </Text>
            </View>
          </View>
        )}
        <Text className="text-white font-bold text-2xl mb-2 leading-8">
          {article.title}
        </Text>
        <View className="flex-row items-center gap-2 flex-wrap">
          <Text className="text-white font-medium text-sm">
            by {article.author_name || article.author?.name || article.author?.user?.name || 'Unknown Author'}
          </Text>
          {formattedDate && (
            <>
              <Text className="text-gray-300 text-sm">•</Text>
              <Text className="text-gray-300 text-sm">{formattedDate}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function ArticleActions({ likes, liked, onLike, onShare }) {
  return (
    <View className="flex-row items-center justify-end gap-4 py-4 border-b px-4 border-gray-200">
      <TouchableOpacity className="flex-row items-center gap-2" onPress={onLike}>
        <Ionicons
          name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
          size={20}
          color={liked ? '#3b82f6' : '#666'}
        />
        <Text className="text-gray-600 font-medium text-sm">{likes}</Text>
      </TouchableOpacity>

      <TouchableOpacity className="flex-row items-center gap-2" onPress={onShare}>
        <Ionicons name="arrow-redo-outline" size={20} color="#666" />
        <Text className="text-gray-600 font-medium text-sm">Share</Text>
      </TouchableOpacity>
    </View>
  );
}

function ArticleTags({ tags, navigation }) {
  if (!tags?.length) return null;

  return (
    <View className="flex-row flex-wrap gap-2 mb-4 px-4 pt-3">
      {tags.map((tag, index) => (
        <TouchableOpacity
          key={index}
          className="border border-gray-300 rounded-xl px-2 py-1"
          onPress={() => navigation?.navigate('TagArticles', { tagName: tag.name })}
        >
          <Text className="text-gray-600 text-xs font-medium">#{tag.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ArticleDetailScreen({ navigation, route }) {
  const { id, slug, article: passedArticle } = route.params;
  const [article, setArticle] = useState(passedArticle || null);
  const [loading, setLoading] = useState(!passedArticle);
  const [likes, setLikes] = useState(passedArticle?.likes_count || 0);
  const [liked, setLiked] = useState(passedArticle?.user_liked || false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!passedArticle) fetchArticle();
    checkAdminStatus();
    fetchCategories();
  }, []);

  const checkAdminStatus = async () => {
    const adminStatus = await isAdminOrModerator();
    setIsAdminUser(adminStatus);
  };

  const fetchCategories = async () => {
    try {
      const res = await client.get('/api/categories');
      const allowed = ['News', 'Literary', 'Opinion', 'Sports', 'Features', 'Specials', 'Art'];
      setCategories((res.data ?? []).filter(c => allowed.includes(c.name)));
    } catch (_) {}
  };

  const fetchArticle = async () => {
    try {
      setLoading(true);
      let res;

      if (slug) {
        try {
          res = await client.get(`/api/articles/by-slug/${slug}`);
          setArticle(res.data);
          setLikes(res.data.likes_count || 0);
          setLiked(res.data.user_liked || false);
          return;
        } catch (err) {
          console.log('Slug fetch failed, trying by ID:', err.message);
        }
      }

      if (id) {
        try {
          res = await client.get(`/api/articles/id/${id}`);
          setArticle(res.data);
          setLikes(res.data.likes_count || 0);
          setLiked(res.data.user_liked || false);
          return;
        } catch (err) {
          console.log('ID fetch failed:', err.message);
        }
      }

      throw new Error('Could not fetch article');
    } catch (err) {
      console.error('Error fetching article:', err);
      Alert.alert('Error', 'Failed to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!article?.id) {
      Alert.alert('Error', 'Article not loaded properly');
      return;
    }

    const newLiked = !liked;
    const newCount = newLiked ? likes + 1 : Math.max(0, likes - 1);
    const prevLiked = liked;
    const prevCount = likes;

    // Optimistic UI update
    setLiked(newLiked);
    setLikes(newCount);

    try {
      await client.post(`/api/articles/${article.id}/like`);
    } catch (err) {
      // Revert on failure
      console.error('Like failed:', err.message);
      setLiked(prevLiked);
      setLikes(prevCount);
      Alert.alert('Error', 'Could not update like. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!article) {
      Alert.alert('Error', 'Article not loaded properly');
      return;
    }

    try {
      const shareUrl = article.slug 
        ? `https://laverdadherald.com/articles/${article.slug}`
        : `https://laverdadherald.com/articles/${article.id}`;
      
      await Share.share({
        title: article.title,
        message: `Check out this article: ${article.title}\n\n${shareUrl}`,
      });
    } catch (err) {
      console.error('Share failed:', err.message);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    navigation.navigate('EditArticle', { articleId: article.id });
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
              await deleteArticle(article.id);
              Alert.alert('Success', 'Article deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting article:', error);
              Alert.alert('Error', 'Failed to delete article. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2C5F7F" />
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Ionicons name="document-outline" size={64} color="#d1d5db" />
        <Text className="text-gray-400 text-lg mt-4">Article not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-blue-500 font-medium">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: 40 }}>
      {/* Fixed Header */}
      <View className="flex-shrink-0">
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          onMenuPress={() => {}}
          onSearchPress={() => {}}
          onGridPress={() => navigation.navigate('Admin')}
          onSearch={() => {}}
          navigation={navigation}
        />
      </View>

      {/* Flexible Content Area */}
      <View className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false}>
        <ArticleHero
          article={article}
          navigation={navigation}
          isAdminUser={isAdminUser}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <ArticleTags tags={article.tags} navigation={navigation} />

        <ArticleActions
          likes={likes}
          liked={liked}
          onLike={handleLike}
          onShare={handleShare}
        />

        <View className="px-4 py-4 mb-8">
          <HTMLRenderer html={article.content} />
        </View>

          {/* Bottom spacing for navigation */}
          <View className="h-20" />
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeTab="Home" />
    </View>
  );
}
