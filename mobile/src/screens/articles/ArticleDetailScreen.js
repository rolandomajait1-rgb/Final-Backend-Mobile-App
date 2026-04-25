import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Animated,
} from "react-native";
import { getImageUri } from "../../utils/imageUtils";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import client from "../../api/client";
import BottomNavigation from "../../components/common/BottomNavigation";
import HTMLRenderer from "../../components/common/HTMLRenderer";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import { ArticleDetailSkeleton } from "../../components/common";
import ArticleActionMenu from "../../components/common/ArticleActionMenu";
import HomeHeader from "../homepage/HomeHeader";
import { isAdminOrModerator } from "../../utils/authUtils";
import { useArticles } from "../../context/ArticleContext";
import { deleteArticle } from "../../api/services/articleService";
import { showArticleSuccessToast, showArticleErrorToast, showAuditToast } from "../../utils/toastNotification";
import { handleAuthorPress } from "../../utils/authorNavigation";
import { handleCategoryPress } from "../../utils/categoryNavigation";
import { getCategoryColor } from "../../utils/categoryColors";
import { handleArticleShare, getArticleUrl, extractGist } from "../../utils/shareUtils";

// ─── Sub-components ──────────────────────────────────────────────────────────
function ArticleHero({
  article,
  navigation,
  isAdminUser,
  isAdmin,
  onEdit,
  onDelete,
}) {
  const menuBtnRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const formattedDate =
    article.created_at || article.published_at
      ? new Date(article.created_at || article.published_at)
          .toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
          .replace(",", " at")
      : "";

  return (
    <View style={{ height: 320, backgroundColor: "#e2e8f0" }}>
      <Image
        source={{
          uri: getImageUri(
            article.featured_image_url || article.featured_image,
          ),
        }}
        style={{ width: "100%", height: "100%", position: "absolute" }}
        resizeMode="cover"
      />

      <View
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      />

      <SafeAreaView style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <View className="flex-row justify-between items-center px-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="rounded-full p-2"
            style={{
              backgroundColor: "rgba(14, 116, 144, 0.6)",
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          {/* 3-dots admin menu button */}
          {isAdminUser && (
            <TouchableOpacity
              ref={menuBtnRef}
              onPress={() => {
                menuBtnRef.current?.measure((_fx, _fy, _w, h, px, py) => {
                  setMenuPos({ x: px, y: py + h });
                  setMenuVisible(true);
                });
              }}
              className="rounded-full p-2"
              style={{
                backgroundColor: "rgba(14, 116, 144, 0.6)",
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <ArticleActionMenu
        visible={menuVisible}
        x={menuPos.x}
        y={menuPos.y}
        onClose={() => setMenuVisible(false)}
        actions={[
          {
            label: "Edit Article",
            icon: "create-outline",
            color: "#0284c7",
            onPress: onEdit,
          },
          // Only show delete for admin, not moderator
          ...(isAdmin ? [{
            label: "Delete Article",
            icon: "trash-outline",
            color: "#ef4444",
            labelColor: "#ef4444",
            onPress: onDelete,
          }] : []),
        ]}
      />

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingBottom: 24,
          zIndex: 10,
        }}
      >
        {article.categories?.length > 0 && (
          <View className="mb-2 flex-row flex-wrap gap-2">
            {article.categories.map((cat, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleCategoryPress(cat.name, navigation)}
                activeOpacity={0.7}
              >
                <View 
                  className="rounded-md px-4 py-2"
                  style={{ backgroundColor: getCategoryColor(cat.name) + 'CC' }} // CC = 80% opacity
                >
                  <Text className="text-white font-bold text-xs uppercase tracking-widest">
                    {cat.name || 'Uncategorized'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 32,
            marginBottom: 8,
            lineHeight: 38,
          }}
        >
          {article.title}
        </Text>
        <View>
          <TouchableOpacity
            onPress={() => handleAuthorPress(article, navigation)}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "500",
                fontSize: 16,
                marginBottom: 4,
              }}
            >
              by{" "}
              <Text
                style={{
                  color: "#FFB800",
                  fontStyle: "italic",
                  textDecorationLine: "underline",
                }}
              >
                {article.author_name ||
                  article.author?.name ||
                  "Unknown Author"}
              </Text>
            </Text>
          </TouchableOpacity>
          {formattedDate && (
            <Text style={{ color: "#d1d5db", fontSize: 14 }}>
              {formattedDate}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function ArticleActions({ likes, liked, shares, onLike, onShare }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLikePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      })
    ]).start();
    onLike();
  };

  return (
    <View className="flex-row items-center justify-end gap-4 py-4 border-b px-4 border-gray-200">
      <TouchableOpacity
        className="flex-row items-center gap-2"
        onPress={handleLikePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={liked ? "thumbs-up" : "thumbs-up-outline"}
            size={22}
            color={liked ? "#3b82f6" : "#666"}
          />
        </Animated.View>
        <Text className="font-medium text-sm" style={{ color: liked ? "#3b82f6" : "#666" }}>{likes}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center gap-2"
        onPress={onShare}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-redo-outline" size={20} color="#666" />
        <Text className="text-gray-600 font-medium text-sm">
          {shares > 0 ? shares : "Share"}
        </Text>
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
          onPress={() => navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName: tag.name } })}
          activeOpacity={0.7}
        >
          <View className="border border-gray-300 rounded-full px-3 py-1">
            <Text className="text-gray-600 text-xs font-medium">#{tag.name}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ArticleDetailScreen({ navigation, route }) {
  const { id, slug, article: passedArticle } = route.params ?? {};
  const [article, setArticle] = useState(passedArticle || null);
  const [loading, setLoading] = useState(!passedArticle);
  const [likes, setLikes] = useState(passedArticle?.likes_count || 0);
  const [liked, setLiked] = useState(passedArticle?.user_liked || false);
  const [shares, setShares] = useState(passedArticle?.shares_count || 0);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Only admin, not moderator
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState(false);
  const userInteractedRef = useRef(false); // Track if user has liked/unliked
  const [categories, setCategories] = useState([]);
  
  // Bug #6 Fix: Add mounted ref to prevent state updates after unmount
  const mountedRef = useRef(true);
  
  const { updateArticleLocally } = useArticles();

  const checkAdminStatus = useCallback(async () => {
    const adminStatus = await isAdminOrModerator();
    setIsAdminUser(adminStatus);
    
    // Check if user is specifically admin (not moderator)
    try {
      const userJson = await AsyncStorage.getItem('user_data');
      if (userJson) {
        const user = JSON.parse(userJson);
        setIsAdmin(user.role === 'admin');
      }
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await client.get("/api/categories");
      const allowed = [
        "News",
        "Literary",
        "Opinion",
        "Sports",
        "Features",
        "Specials",
        "Art",
      ];
      setCategories((res.data ?? []).filter((c) => allowed.includes(c.name)));
    } catch (_) {}
  }, []);

  const fetchArticle = useCallback(async () => {
    // Bug #7 Fix: Validate parameters before fetching
    if (!slug && !id) {
      Alert.alert("Error", "No article identifier provided.");
      navigation.goBack();
      return;
    }

    try {
      // Bug #17 Fix: Show loading state even when passedArticle exists
      if (mountedRef.current) {
        setLoading(true);
      }
      
      let res;
      if (slug) {
        res = await client.get(`/api/articles/by-slug/${slug}`);
      } else if (id) {
        res = await client.get(`/api/articles/id/${id}`);
      }
      
      if (res?.data && mountedRef.current) {
        setArticle(res.data);
        
        // Check if user has liked this article before (from AsyncStorage)
        try {
          const likedArticlesKey = 'liked_articles';
          const stored = await AsyncStorage.getItem(likedArticlesKey);
          const likedArticles = stored ? JSON.parse(stored) : {};
          
          if (likedArticles[res.data.id]) {
            // User has liked this article before, use stored state
            setLikes(likedArticles[res.data.id].count);
            setLiked(true);
            userInteractedRef.current = true;
          } else if (!userInteractedRef.current) {
            // No stored like, use backend data
            setLikes(res.data.likes_count || 0);
            setLiked(res.data.user_liked || false);
          }
        } catch (err) {
          console.error('Error loading liked state:', err);
          // Fallback to backend data
          if (!userInteractedRef.current) {
            setLikes(res.data.likes_count || 0);
            setLiked(res.data.user_liked || false);
          }
        }
        
        setShares(res.data.shares_count || 0);
      }
    } catch (err) {
      console.error("Error fetching article:", err);
      if (mountedRef.current) {
        Alert.alert("Error", "Failed to load article.");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [id, slug, navigation]);

  // Fetch article data and admin status on mount
  useEffect(() => {
    fetchArticle();
    checkAdminStatus();
    fetchCategories();
    
    // Bug #6 Fix: Cleanup on unmount
    return () => {
      mountedRef.current = false;
    };
  }, [fetchArticle, checkAdminStatus, fetchCategories]);

  const handleLike = async () => {
    if (!article?.id) return;
    const newLiked = !liked;
    const newCount = newLiked ? likes + 1 : Math.max(0, likes - 1);
    
    userInteractedRef.current = true; // Mark that user has interacted
    setLiked(newLiked);
    setLikes(newCount);
    
    // Persist liked state to AsyncStorage
    try {
      const likedArticlesKey = 'liked_articles';
      const stored = await AsyncStorage.getItem(likedArticlesKey);
      const likedArticles = stored ? JSON.parse(stored) : {};
      
      if (newLiked) {
        likedArticles[article.id] = { liked: true, count: newCount };
      } else {
        delete likedArticles[article.id];
      }
      
      await AsyncStorage.setItem(likedArticlesKey, JSON.stringify(likedArticles));
    } catch (err) {
      console.error('Error persisting like state:', err);
    }
    
    if (updateArticleLocally) {
      updateArticleLocally(article.id, { user_liked: newLiked, likes_count: newCount });
    }

    try {
      await client.post(`/api/articles/${article.id}/like`);
      showAuditToast("success", newLiked ? "Article liked!" : "Like removed");
    } catch (err) {
      console.error("Error liking article:", err);
      // Rollback on error
      setLiked(!newLiked);
      setLikes(newLiked ? likes - 1 : likes + 1);
      
      if (updateArticleLocally) {
        updateArticleLocally(article.id, { user_liked: !newLiked, likes_count: newLiked ? likes - 1 : likes + 1 });
      }
      
      showAuditToast("error", "Failed to like article. Please log in.");
    }
  };

  const handleShare = async () => {
    const success = await handleArticleShare(article, async () => {
      // Increment share count locally for immediate UI feedback
      const newShares = shares + 1;
      setShares(newShares);
      if (updateArticleLocally) {
        updateArticleLocally(article.id, { shares_count: newShares });
      }

      // Record share in backend
      try {
        const { shareArticle } = await import("../../api/services/articleService");
        await shareArticle(article.id);
      } catch (shareErr) {
        console.error("Error recording share:", shareErr);
        // Rollback share count on error
        setShares(shares);
        if (updateArticleLocally) {
          updateArticleLocally(article.id, { shares_count: shares });
        }
        showAuditToast("error", "Share recorded locally but failed to sync.");
      }
    });
  };

  const handleEdit = () => {
    navigation.navigate("Management", { screen: "EditArticle", params: { articleId: article.id } });
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!article?.id || deletingArticle) {
      console.log('Cannot delete: article.id =', article?.id, 'deletingArticle =', deletingArticle);
      return;
    }

    try {
      setDeletingArticle(true);
      console.log('Attempting to delete article:');
      console.log('  - Article ID:', article.id);
      console.log('  - Article slug:', article.slug);
      console.log('  - Full article object:', JSON.stringify(article, null, 2));
      
      await deleteArticle(article.id);
      
      // Refresh articles list
      try { 
        await articleContext?.forceRefreshArticles?.(); 
      } catch { /* non-critical */ }
      
      setShowDeleteModal(false);
      
      // Navigate first, then show toast after navigation completes
      navigation.goBack();
      
      // Show toast after a short delay to ensure navigation completes
      setTimeout(() => {
        showArticleSuccessToast('deleted');
      }, 300);
    } catch (error) {
      console.error("Error deleting article:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Request URL:", error.config?.url);
      
      // Check if it's a 404 error (article already deleted or doesn't exist)
      if (error.response?.status === 404) {
        // Article doesn't exist anymore, navigate back anyway
        setShowDeleteModal(false);
        navigation.goBack();
        
        setTimeout(() => {
          showAuditToast("info", "Article was already deleted");
        }, 300);
      } else {
        showArticleErrorToast('deleted');
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete article. Please try again.';
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setDeletingArticle(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-shrink-0 bg-white">
          <HomeHeader
            categories={categories}
            onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
            navigation={navigation}
          />
          <View style={{ height: 2, backgroundColor: "#f39c12" }} />
        </View>
        <ArticleDetailSkeleton />
        <BottomNavigation navigation={navigation} activeTab="Home" />
      </View>
    );
  }

  if (!article) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text>Article not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-shrink-0 bg-white">
        <HomeHeader
          categories={categories}
          onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
          navigation={navigation}
        />
        
      </View>

      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <ArticleHero
            article={article}
            navigation={navigation}
            isAdminUser={isAdminUser}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <ArticleTags tags={article.tags} navigation={navigation} />
          <ArticleActions
            likes={likes}
            liked={liked}
            shares={shares}
            onLike={handleLike}
            onShare={handleShare}
          />
          <View className="px-2 py-4">
            <HTMLRenderer html={article.content} />
          </View>
        </ScrollView>
      </View>

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

      <BottomNavigation navigation={navigation} activeTab="Home" />
    </View>
  );
}
