import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  useWindowDimensions,
  DeviceEventEmitter,
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
import { handleArticleShare } from "../../utils/shareUtils";
import { useResponsive, getResponsiveFontSize, getResponsiveSpacing, getResponsiveIconSize } from "../../utils/responsiveUtils";
import { useUserInteractions } from "../../context/UserInteractionsContext";

// ─── Sub-components ──────────────────────────────────────────────────────────
function ArticleHero({
  article,
  navigation,
  isAdminUser,
  isAdmin,
  onEdit,
  onDelete,
  width,
}) {
  const menuBtnRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const isSmallPhone = width < 380;
  const heroHeight = isSmallPhone ? 280 : 320;
  const backButtonSize = isSmallPhone ? 40 : 44;
  const iconSize = getResponsiveIconSize(24, width);
  
  // Calculate font size based on title length to avoid glitching
  const titleLength = article?.title?.length || 0;
  const baseFontSize = getResponsiveFontSize(isSmallPhone ? 24 : 28, width);
  const smallerFontSize = getResponsiveFontSize(isSmallPhone ? 20 : 22, width);
  
  // More conservative threshold to ensure consistent sizing
  // Reduce font size earlier to prevent overflow
  const charsPerLine = isSmallPhone ? 22 : 28;
  const maxCharsFor3Lines = charsPerLine * 3;
  
  // Use smaller font if title would exceed 3 lines
  const titleFontSize = titleLength > maxCharsFor3Lines ? smallerFontSize : baseFontSize;
  
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
    <View style={{ height: heroHeight, backgroundColor: "#e2e8f0" }}>
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
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingHorizontal: getResponsiveSpacing(14, width) 
        }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="rounded-full p-2"
            style={{
              backgroundColor: "rgba(14, 116, 144, 0.6)",
              width: backButtonSize,
              height: backButtonSize,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={iconSize} color="#fff" />
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
                width: backButtonSize,
                height: backButtonSize,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="ellipsis-vertical" size={iconSize} color="#fff" />
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
            label: "Edit",
            icon: "create-outline",
            color: "#0284c7",
            onPress: onEdit,
          },
          // Only show delete for admin, not moderator
          ...(isAdmin ? [{
            label: "Delete",
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
          paddingHorizontal: getResponsiveSpacing(14, width),
          paddingBottom: getResponsiveSpacing(16, width),
          zIndex: 10,
        }}
      >
        {article.categories?.length > 0 && (
          <View style={{ marginBottom: getResponsiveSpacing(5, width), flexDirection: 'row', flexWrap: 'wrap', gap: getResponsiveSpacing(8, width) }}>
            {article.categories.map((cat, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleCategoryPress(cat.name, navigation)}
                activeOpacity={0.7}
              >
                <View 
                  style={{ 
                    borderRadius: 6, 
                    paddingHorizontal: getResponsiveSpacing(12, width), 
                    paddingVertical: getResponsiveSpacing(8, width),
                    backgroundColor: getCategoryColor(cat.name) + 'CC'
                  }}
                >
                  <Text style={{ 
                    color: 'white', 
                    fontWeight: 'bold', 
                    fontSize: getResponsiveFontSize(14, width), 
                    textTransform: 'uppercase', 
                    letterSpacing: 1.5 
                  }}>
                    {cat.name || 'Uncategorized'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: titleFontSize,
            marginBottom: getResponsiveSpacing(8, width),
            lineHeight: titleFontSize * 1.2,
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
                fontSize: getResponsiveFontSize(14, width),
                marginBottom: getResponsiveSpacing(4, width),
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
            <Text style={{ color: "#d1d5db", fontSize: getResponsiveFontSize(14, width) }}>
              {formattedDate}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function ArticleActions({ likes, liked, shares, onLike, onShare, width }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconSize = 18; // Fixed smaller size
  const shareIconSize = 18; // Fixed smaller size

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
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'flex-end', 
      gap: 16, 
      paddingVertical: 8, 
      borderBottomWidth: 1,
      paddingHorizontal: 16, 
      borderBottomColor: '#e5e7eb'
    }}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        onPress={handleLikePress}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={liked ? "thumbs-up" : "thumbs-up-outline"}
            size={iconSize}
            color={liked ? "#3b82f6" : "#666"}
          />
        </Animated.View>
        <Text style={{ fontWeight: '500', fontSize: 14, color: liked ? "#3b82f6" : "#666" }}>{likes}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        onPress={onShare}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Ionicons name="arrow-redo-outline" size={shareIconSize} color="#666" />
        <Text style={{ color: '#4b5563', fontWeight: '500', fontSize: 14 }}>
          {shares > 0 ? shares : "Share"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ArticleTags({ tags, navigation, width }) {
  if (!tags?.length) return null;

  return (
    <View style={{ 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      gap: 8, 
      marginBottom: 8, 
      paddingHorizontal: 16, 
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: '#ffffff'
    }}>
      {tags.map((tag, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName: tag.name } })}
          activeOpacity={0.7}
        >
          <View style={{ 
            borderWidth: 1, 
            borderColor: '#d1d5db', 
            borderRadius: 999, 
            paddingHorizontal: 12, 
            paddingVertical: 6,
            backgroundColor: '#ffffffff'
          }}>
            <Text style={{ color: '#4b5563', fontSize: 13, fontWeight: '600' }}>#{tag.name}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ArticleDetailScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const { id, slug, article: passedArticle } = route.params ?? {};
  const [article, setArticle] = useState(passedArticle || null);
  const [loading, setLoading] = useState(!passedArticle);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [shares, setShares] = useState(passedArticle?.shares_count || 0);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Only admin, not moderator
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState(false);
  const userInteractedRef = useRef(false); // Track if user has liked/unliked
  const [categories, setCategories] = useState([]);
  const likedStateLoadedRef = useRef(false); // Track if we've loaded liked state
  
  // Bug #6 Fix: Add mounted ref to prevent state updates after unmount
  const mountedRef = useRef(true);
  
  const { updateArticleLocally, removeArticleLocally, forceRefreshArticles } = useArticles();
  const { isLiked, toggleLike, markAsShared, fetchInteractions } = useUserInteractions();

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
      // Bug #17 Fix: Only show loading if we don't have passedArticle
      if (mountedRef.current && !passedArticle) {
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
        
        // Fetch user interactions from backend
        await fetchInteractions([res.data.id]);
        
        // Use context to determine liked state
        const userLiked = isLiked(res.data.id);
        setLiked(userLiked);
        setLikes(res.data.likes_count || 0);
        likedStateLoadedRef.current = true;
        
        setShares(res.data.shares_count || 0);
      }
    } catch (err) {
      // Log error details for debugging (but don't spam console)
      if (err.response?.status !== 404 && err.response?.status !== 500) {
        console.error("Error fetching article:", err);
      } else {
        console.log(`[ArticleDetailScreen] Article fetch failed with ${err.response?.status}`);
      }
      
      if (mountedRef.current) {
        // Better error handling based on status code
        const status = err.response?.status;
        
        if (status === 404) {
          Alert.alert(
            "Article Not Found", 
            "This article may have been deleted or moved.",
            [{ text: "Go Back", onPress: () => navigation.goBack() }]
          );
        } else if (status === 500) {
          Alert.alert(
            "Server Error", 
            "The server encountered an error. Please try again later.",
            [
              { text: "Go Back", onPress: () => navigation.goBack() },
              { text: "Retry", onPress: () => fetchArticle() }
            ]
          );
        } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
          Alert.alert(
            "Network Error", 
            "Please check your internet connection and try again.",
            [
              { text: "Go Back", onPress: () => navigation.goBack() },
              { text: "Retry", onPress: () => fetchArticle() }
            ]
          );
        } else {
          Alert.alert(
            "Error", 
            "Failed to load article. Please try again.",
            [
              { text: "Go Back", onPress: () => navigation.goBack() },
              { text: "Retry", onPress: () => fetchArticle() }
            ]
          );
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [id, slug, navigation, passedArticle]);

  // Fetch article data and admin status on mount
  useEffect(() => {
    // Load liked state from context if passedArticle exists
    const loadInitialLikedState = async () => {
      const articleId = passedArticle?.id || id;
      if (articleId && !likedStateLoadedRef.current) {
        let initialLiked = false;
        let hasExplicitState = false;
        
        if (passedArticle) {
            if (typeof passedArticle.user_liked !== 'undefined') {
                initialLiked = !!passedArticle.user_liked;
                hasExplicitState = true;
            } else if (typeof passedArticle.is_liked !== 'undefined') {
                initialLiked = !!passedArticle.is_liked;
                hasExplicitState = true;
            }
        }

        if (hasExplicitState && mountedRef.current) {
            setLiked(initialLiked);
            setLikes(passedArticle.likes_count || passedArticle.like_count || 0);
            likedStateLoadedRef.current = true;
        }

        // Fetch interactions from backend
        await fetchInteractions([articleId]);
        
        if (mountedRef.current && !hasExplicitState) {
          const userLiked = isLiked(articleId);
          setLiked(userLiked);
          setLikes(passedArticle?.likes_count || 0);
          likedStateLoadedRef.current = true;
        }
      }
    };
    
    loadInitialLikedState();
    fetchArticle();
    checkAdminStatus();
    fetchCategories();
    
    // Bug #6 Fix: Cleanup on unmount
    return () => {
      mountedRef.current = false;
    };
  }, [fetchArticle, checkAdminStatus, fetchCategories, passedArticle, id, fetchInteractions, isLiked]);

  const handleLike = async () => {
    if (!article?.id) return;
    const newLiked = !liked;
    const newCount = newLiked ? likes + 1 : Math.max(0, likes - 1);
    
    userInteractedRef.current = true; // Mark that user has interacted
    setLiked(newLiked);
    setLikes(newCount);
    
    // Update context immediately
    toggleLike(article.id);
    
    // Update article in context immediately for all screens
    if (updateArticleLocally) {
      updateArticleLocally(article.id, { 
        user_liked: newLiked, 
        likes_count: newCount,
        like_count: newCount // Some screens use like_count instead of likes_count
      });
    }

    try {
      await client.post(`/api/articles/${article.id}/like`);
      // No toast - visual feedback (heart animation + color) is enough
    } catch (err) {
      console.error("Error liking article:", err);
      // Rollback on error
      setLiked(!newLiked);
      setLikes(newLiked ? likes - 1 : likes + 1);
      
      // Rollback context
      toggleLike(article.id);
      
      if (updateArticleLocally) {
        updateArticleLocally(article.id, { 
          user_liked: !newLiked, 
          likes_count: newLiked ? likes - 1 : likes + 1,
          like_count: newLiked ? likes - 1 : likes + 1
        });
      }
      
      // Only show error toast if there's an actual error
      showAuditToast("error", "Failed to update like. Please try again.");
    }
  };

  const handleShare = async () => {
    const success = await handleArticleShare(article, async () => {
      // Only increment if share was successful
      console.log('Share success callback triggered');
      
      // Mark as shared in context
      markAsShared(article.id);
      
      // Increment share count locally for immediate UI feedback
      const newShares = shares + 1;
      setShares(newShares);
      if (updateArticleLocally) {
        updateArticleLocally(article.id, { shares_count: newShares });
      }

      // Record share in backend
      try {
        const { shareArticle } = await import("../../api/services/articleService");
        const response = await shareArticle(article.id);
        console.log('Share recorded successfully:', response.data);
      } catch (shareErr) {
        console.error("Error recording share:", shareErr);
        console.error("Error response:", shareErr.response?.data);
        console.error("Error status:", shareErr.response?.status);
        
        // Rollback share count on error
        setShares(shares);
        if (updateArticleLocally) {
          updateArticleLocally(article.id, { shares_count: shares });
        }
      }
    });
    
    if (success) {
      console.log('Article shared successfully');
    } else {
      console.log('Share was cancelled or failed');
    }
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
      
      // Remove from local cache instantly for immediate UI feedback
      if (removeArticleLocally) {
        removeArticleLocally(article.id);
      }
      
      // Emit event to update HomeScreen (recentArticles + latestArticles)
      // The HomeScreen listener handles the delayed background refresh
      DeviceEventEmitter.emit('ARTICLE_DELETED', article.id);

      setShowDeleteModal(false);
      
      // Navigate first, then show toast after navigation completes
      navigation.goBack();
      
      // Show toast after a short delay to ensure navigation completes
      setTimeout(() => {
        showArticleSuccessToast('deleted');
      }, 300);
    } catch (error) {
      // Check if it's a 404 error (article already deleted or doesn't exist)
      if (error.response?.status === 404) {
        // Article doesn't exist anymore, navigate back anyway
        if (removeArticleLocally) {
          removeArticleLocally(article.id);
        }
        DeviceEventEmitter.emit('ARTICLE_DELETED', article.id);

        setShowDeleteModal(false);
        navigation.goBack();
        
        setTimeout(() => {
          showAuditToast("info", "Article was already deleted");
        }, 300);
      } else {
        console.error("Error deleting article:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        console.error("Request URL:", error.config?.url);
        
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
            onCategorySelect={() => {}}
            navigation={navigation}
            onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
            enableSearch={false}
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
          onCategorySelect={() => {}}
          navigation={navigation}
          onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
          enableSearch={false}
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
            width={width}
          />
          <ArticleTags tags={article.tags} navigation={navigation} width={width} />
          <ArticleActions
            likes={likes}
            liked={liked}
            shares={shares}
            onLike={handleLike}
            onShare={handleShare}
            width={width}
          />
          <View style={{ paddingHorizontal: getResponsiveSpacing(4, width), paddingVertical: getResponsiveSpacing(12, width) }}>
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
