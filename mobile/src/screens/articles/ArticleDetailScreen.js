import { useState, useEffect, useCallback, useContext, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import { getImageUri } from "../../utils/imageUtils";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import client from "../../api/client";
import BottomNavigation from "../../components/common/BottomNavigation";
import HTMLRenderer from "../../components/common/HTMLRenderer";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal";
import { ArticleDetailSkeleton } from "../../components/common";
import HomeHeader from "../homepage/HomeHeader";
import { isAdminOrModerator } from "../../utils/authUtils";
import { ArticleContext } from "../../context/ArticleContext";
import { deleteArticle } from "../../api/services/articleService";
import { showArticleSuccessToast, showArticleErrorToast, showAuditToast } from "../../utils/toastNotification";

// ─── Sub-components ──────────────────────────────────────────────────────────
function ArticleHero({
  article,
  navigation,
  isAdminUser,
  showMenu,
  setShowMenu,
  onEdit,
  onDelete,
}) {
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
              backgroundColor: "#215878",
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          {/* Bug #9 Fix: Only render the admin menu button for admin users */}
          {isAdminUser && (
            <TouchableOpacity
              onPress={() => setShowMenu(!showMenu)}
              className="rounded-full p-2"
              style={{
                backgroundColor: "#215878",
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

      {showMenu && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          >
            <SafeAreaView
              style={{ position: "absolute", top: 50, right: 16, zIndex: 40 }}
            >
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
                      <Ionicons
                        name="create-outline"
                        size={22}
                        color="#3b82f6"
                      />
                      <Text className="ml-3 text-gray-800 font-medium text-base">
                        Edit Article
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="flex-row items-center px-5 py-4"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={22}
                        color="#ef4444"
                      />
                      <Text className="ml-3 text-red-600 font-medium text-base">
                        Delete Article
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="px-5 py-4">
                    <Text className="text-gray-600 text-sm">
                      Admin access required
                    </Text>
                  </View>
                )}
              </View>
            </SafeAreaView>
          </TouchableOpacity>
        </View>
      )}

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
          <View className="mb-2">
            <View className="bg-indigo-700/80 rounded-md px-4 py-2 self-start">
              {/* Bug #24 Fix: Add fallback for undefined category name */}
              <Text className="text-white font-bold text-xs uppercase tracking-widest">
                {article.categories[0].name || 'Uncategorized'}
              </Text>
            </View>
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
            onPress={() => {
              // Bug #20 Fix: Validate author data before navigation
              const authorId = article.author?.id || article.author_id;
              const authorName = article.author_name || article.author?.name;
              
              if (authorId) {
                navigation.navigate("AuthorProfile", {
                  authorId,
                  authorName: authorName || "Unknown Author",
                });
              } else {
                Alert.alert("Info", "Author information is not available.");
              }
            }}
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
  return (
    <View className="flex-row items-center justify-end gap-4 py-4 border-b px-4 border-gray-200">
      <TouchableOpacity
        className="flex-row items-center gap-2"
        onPress={onLike}
      >
        <Ionicons
          name={liked ? "thumbs-up" : "thumbs-up-outline"}
          size={20}
          color={liked ? "#3b82f6" : "#666"}
        />
        <Text className="text-gray-600 font-medium text-sm">{likes}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center gap-2"
        onPress={onShare}
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
          className="border border-gray-300 rounded-full px-3 py-1"
          onPress={() =>
            navigation?.navigate("TagArticles", { tagName: tag.name })
          }
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
  const [shares, setShares] = useState(passedArticle?.shares_count || 0);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Bug #6 Fix: Add mounted ref to prevent state updates after unmount
  const mountedRef = useRef(true);
  
  const articleContext = useContext(ArticleContext);
  const updateArticleLocally = articleContext?.updateArticleLocally;

  const checkAdminStatus = useCallback(async () => {
    const adminStatus = await isAdminOrModerator();
    setIsAdminUser(adminStatus);
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
        setLikes(res.data.likes_count || 0);
        setLiked(res.data.user_liked || false);
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
    
    setLiked(newLiked);
    setLikes(newCount);
    
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

  const extractGist = (htmlContent) => {
    if (!htmlContent) return '';
    
    // Remove HTML tags and normalize whitespace (removes newlines)
    const plainText = htmlContent
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Get first 80 characters as gist
    return plainText.length > 80 
      ? plainText.substring(0, 80).trim() + '...' 
      : plainText;
  };

  const handleShare = async () => {
    if (!article) return;
    try {
      const gist = extractGist(article.content);
      const url = `https://laverdadherald.com/articles/${article.slug || article.id}`;
      const shareMessage = gist 
        ? `Check out: ${article.title}\n\n"${gist}"\n\n${url}`
        : `Check out: ${article.title}\n\n${url}`;
      
      const result = await Share.share({
        title: article.title,
        message: shareMessage,
      });

      if (result.action === Share.sharedAction) {
        // Increment share count locally for immediate UI feedback
        const newShares = shares + 1;
        setShares(newShares);
        if (updateArticleLocally) {
          updateArticleLocally(article.id, { shares_count: newShares });
        }

        // Bug #14 Fix: Add error handling for share API call
        try {
          await client.post(`/api/articles/${article.id}/share`);
          showAuditToast("success", "Article shared successfully!");
        } catch (shareErr) {
          console.error("Error recording share:", shareErr);
          // Rollback share count on error
          setShares(shares);
          if (updateArticleLocally) {
            updateArticleLocally(article.id, { shares_count: shares });
          }
          showAuditToast("error", "Share recorded locally but failed to sync.");
        }
      }
    } catch (err) {
      console.error("Error sharing article:", err);
      showAuditToast("error", "Failed to share article.");
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    showArticleSuccessToast('edited');
    navigation.navigate("EditArticle", { articleId: article.id });
  };

  const handleDelete = () => {
    setShowMenu(false);
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
      showArticleSuccessToast('deleted');
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (error) {
      console.error("Error deleting article:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Request URL:", error.config?.url);
      showArticleErrorToast('deleted');
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete article. Please try again.';
      Alert.alert("Error", errorMessage);
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
            onGridPress={() => navigation.navigate("Admin")}
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
          onGridPress={() => navigation.navigate("Admin")}
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
            showMenu={showMenu}
            setShowMenu={setShowMenu}
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
