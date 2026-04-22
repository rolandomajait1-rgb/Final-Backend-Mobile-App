import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from 'expo-status-bar';
import { Loader, Button, ProfileSkeleton, ArticleCardSkeleton } from "../../components/common";
import BottomNavigation from "../../components/common/BottomNavigation";
import ArticleMediumCard from "../../components/articles/ArticleMediumCard";
import { getCurrentUser, logout } from "../../api/services/authService";
import client from "../../api/client";
import { colors } from "../../styles";
import SideBar from "./SideBar";
import { showAuditEventToast } from "../../utils/toastNotification";



export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("liked");
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Per-tab article state
  const [likedArticles, setLikedArticles] = useState([]);
  const [sharedArticles, setSharedArticles] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const tabLoadingRef = useRef(false);
  const [tabPage, setTabPage] = useState(1);
  const [tabHasMore, setTabHasMore] = useState(true);

  // Bug #1 Fix: mountedRef initialized to true at declaration, not just inside useEffect.
  // This prevents ghost state updates if loadProfile completes after unmount.
  const mountedRef = useRef(true);

  useEffect(() => {
    loadProfile();
    return () => {
      mountedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        if (mountedRef.current) {
          setLoading(false);
          setUser(null);
        }
        return;
      }
      const res = await getCurrentUser();
      if (mountedRef.current) {
        setUser(res.data);
        await AsyncStorage.setItem("user_data", JSON.stringify(res.data));
        setLoading(false);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      if (err.response?.status === 401) {
        await AsyncStorage.multiRemove(["auth_token", "user_data"]);
      }
      if (mountedRef.current) {
        setLoading(false);
        setUser(null);
      }
    }
  }, []);

  // Bug #3 & #23 Fix: Improved response validation and error handling
  const fetchTabArticles = useCallback(async (tab, page = 1, replace = false) => {
    if (tabLoadingRef.current) return;
    setTabLoading(true);
    tabLoadingRef.current = true;
    try {
      const endpoint =
        tab === "liked"
          ? "/api/user/liked-articles"
          : "/api/user/shared-articles";
      const res = await client.get(endpoint, {
        params: { page, per_page: 10 },
      });
      
      // Bug #3 Fix: Validate response structure before accessing nested properties
      if (!res.data || typeof res.data !== 'object') {
        throw new Error('Invalid response structure from server');
      }
      
      // Bug #23 Fix: Distinguish between empty results and API errors
      const newItems = Array.isArray(res.data?.data) ? res.data.data : [];
      const lastPage = res.data?.last_page ?? 1;

      if (mountedRef.current) {
        if (tab === "liked") {
          setLikedArticles((prev) =>
            replace ? newItems : [...prev, ...newItems],
          );
        } else {
          setSharedArticles((prev) =>
            replace ? newItems : [...prev, ...newItems],
          );
        }
        setTabHasMore(page < lastPage);
        setTabPage(page);
        
        // Show toast notification only for successful loads with data
        if (newItems.length > 0 && page === 1) {
          showAuditEventToast({
            action: tab === 'liked' ? 'liked_articles_loaded' : 'shared_articles_loaded',
            status: 'success',
            message: `Loaded ${newItems.length} ${tab} articles`
          });
        }
      }
    } catch (err) {
      console.error(`Error fetching ${tab} articles:`, err);
      if (mountedRef.current) {
        showAuditEventToast({
          action: `${tab}_articles_load`,
          status: 'error',
          message: err.message || `Failed to load ${tab} articles`
        });
      }
    } finally {
      if (mountedRef.current) {
        setTabLoading(false);
        tabLoadingRef.current = false;
      }
    }
  }, []);

  // Bug #5 & #18 Fix: Remove fetchTabArticles from dependency array to prevent infinite loops
  useEffect(() => {
    if (!user) return;
    if (activeTab === "liked") {
      setLikedArticles([]);
    } else {
      setSharedArticles([]);
    }
    setTabPage(1);
    setTabHasMore(true);
    fetchTabArticles(activeTab, 1, true);
  }, [activeTab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    if (!tabLoading && tabHasMore) {
      const nextPage = tabPage + 1;
      fetchTabArticles(activeTab, nextPage, false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            setUser(null);
            setLikedArticles([]);
            setSharedArticles([]);
            setSidebarVisible(false);
            // Navigate to Welcome screen after logout
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          } catch (err) {
            console.error("Logout error:", err);
            showAuditEventToast({
              action: 'user_logout',
              status: 'error',
              message: 'Failed to sign out'
            });
          }
        },
      },
    ]);
  };

  if (loading) return <ProfileSkeleton />;

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons
            name="person-circle-outline"
            size={80}
            color={colors.border}
          />
          <Text className="text-2xl font-bold text-gray-900 mt-4">
            You&apos;re not signed in
          </Text>
          <Text className="text-sm text-gray-600 text-center mt-2 mb-6">
            Sign in to access your profile and saved articles.
          </Text>
          <Button
            title="Sign In"
            onPress={() => navigation.navigate("Login")}
          />
        </View>
      </SafeAreaView>
    );
  }

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  const currentArticles =
    activeTab === "liked" ? likedArticles : sharedArticles;

  return (
    <View className="flex-1 bg-white">
      <StatusBar hidden={false} />
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* White spacer for status bar */}
        <View className="h-9 bg-white" />
        
        {/* Profile Header */}
        <View className="px-5 py-6 pb-8" style={{ backgroundColor: '#075985' }}>
          <View className="flex-row items-center">
            <View className="w-[72px] h-[72px] rounded-full bg-white justify-center items-center mr-4">
              <Ionicons name="person" size={46} color="#075985" />
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-[26px] font-bold text-white tracking-tight mb-0.5">{user.name}</Text>
              <Text className="text-[15px] text-white">
                Joined in {joinedDate}
              </Text>
              {user.role && (
                <View className="bg-[#083344] self-start px-2.5 py-0.5 rounded-full mt-1.5 border border-[#083344]">
                  <Text className="text-white text-[11px] font-medium capitalize">
                    {user.role}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setSidebarVisible(true)}
              className="p-2 -mr-2"
            >
              <Ionicons name="menu" size={32} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pill Tabs */}
        <View className="flex-row px-5 py-5 pb-2">
          {["liked", "shared"].map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`py-2.5 px-6 mr-3 rounded-full border ${
                  isSelected ? "border-gray-800" : "border-gray-200"
                }`}
              >
                <Text
                  className={`text-[13px] font-medium ${
                    isSelected ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  {tab === "liked" ? "Liked Articles" : "Shared Articles"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Articles List */}
        <View className="px-5 py-4">
          {tabLoading && currentArticles.length === 0 ? (
            <>
              {[...Array(5)].map((_, index) => (
                <ArticleCardSkeleton key={index} />
              ))}
            </>
          ) : currentArticles.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons
                name={
                  activeTab === "liked"
                    ? "heart-outline"
                    : "share-social-outline"
                }
                size={48}
                color="#ccc"
              />
              <Text className="text-gray-400 mt-3 text-center">
                {activeTab === "liked"
                  ? "You haven&apos;t liked any articles yet."
                  : "You haven&apos;t shared any articles yet."}
              </Text>
            </View>
          ) : (
            <>
              {currentArticles.map((article) => (
                <View key={article.id} className="mb-2">
                  <ArticleMediumCard
                    title={article.title}
                    category={article.categories?.[0]?.name || 'Uncategorized'}
                    author={article.author_name || article.author?.user?.name || article.author?.name || 'Unknown Author'}
                    date={(article.created_at || article.published_at)
                      ? new Date(article.created_at || article.published_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric'
                        })
                      : 'Recently'}
                    image={article.featured_image_url || article.featured_image}
                    onPress={() => navigation.navigate("ArticleDetail", { slug: article.slug, article })}
                  />
                </View>
              ))}

              {/* Load More */}
              {tabHasMore && (
                <TouchableOpacity
                  onPress={handleLoadMore}
                  disabled={tabLoading}
                  className="items-center py-4"
                >
                  {tabLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text className="text-blue-500 font-semibold text-base">
                      Load More
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View className="h-24" />
      </ScrollView>

      <SideBar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onLogout={handleLogout}
        navigation={navigation}
        user={user}
      />
      <BottomNavigation navigation={navigation} activeTab="Profile" />
    </View>
  );
}
