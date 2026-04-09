import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Loader, Button } from '../../components/common';
import BottomNavigation from '../../components/common/BottomNavigation';
import { getCurrentUser, logout } from '../../api/services/authService';
import client from '../../api/client';
import { colors } from '../../styles';
import SideBar from './SideBar';

const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ProfileScreen({ navigation }) {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeTab, setActiveTab]     = useState('liked');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Per-tab article state
  const [likedArticles, setLikedArticles]   = useState([]);
  const [sharedArticles, setSharedArticles] = useState([]);
  const [tabLoading, setTabLoading]         = useState(false);
  const [tabPage, setTabPage]               = useState(1);
  const [tabHasMore, setTabHasMore]         = useState(true);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadProfile();
    return () => { mountedRef.current = false; };
  }, []);

  // Reload articles when tab changes (only after user is loaded)
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'liked') {
      setLikedArticles([]);
    } else {
      setSharedArticles([]);
    }
    setTabPage(1);
    setTabHasMore(true);
    fetchTabArticles(activeTab, 1, true);
  }, [activeTab, user]);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        if (mountedRef.current) { setLoading(false); setUser(null); }
        return;
      }
      const res = await getCurrentUser();
      if (mountedRef.current) {
        setUser(res.data);
        await AsyncStorage.setItem('user_data', JSON.stringify(res.data));
        setLoading(false);
        // Tab useEffect will fire automatically when user state is set
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      if (err.response?.status === 401) {
        await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      }
      if (mountedRef.current) { setLoading(false); setUser(null); }
    }
  };

  const fetchTabArticles = async (tab, page = 1, replace = false) => {
    if (tabLoading) return;
    setTabLoading(true);
    try {
      const endpoint = tab === 'liked'
        ? '/api/user/liked-articles'
        : '/api/user/shared-articles';
      const res = await client.get(endpoint, { params: { page, per_page: 10 } });
      const newItems = res.data?.data ?? [];
      const lastPage = res.data?.last_page ?? 1;

      if (mountedRef.current) {
        if (tab === 'liked') {
          setLikedArticles(prev => replace ? newItems : [...prev, ...newItems]);
        } else {
          setSharedArticles(prev => replace ? newItems : [...prev, ...newItems]);
        }
        setTabHasMore(page < lastPage);
        setTabPage(page);
      }
    } catch (err) {
      console.error(`Error fetching ${tab} articles:`, err);
    } finally {
      if (mountedRef.current) setTabLoading(false);
    }
  };

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
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            setUser(null);
            setLikedArticles([]);
            setSharedArticles([]);
            setSidebarVisible(false);
          } catch (err) {
            console.error('Logout error:', err);
          }
        },
      },
    ]);
  };

  if (loading) return <Loader />;

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="person-circle-outline" size={80} color={colors.border} />
          <Text className="text-2xl font-bold text-gray-900 mt-4">You're not signed in</Text>
          <Text className="text-sm text-gray-600 text-center mt-2 mb-6">
            Sign in to access your profile and saved articles.
          </Text>
          <Button title="Sign In" onPress={() => navigation.navigate('Login')} />
        </View>
      </SafeAreaView>
    );
  }

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const currentArticles = activeTab === 'liked' ? likedArticles : sharedArticles;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Profile Header */}
        <View className="px-4 py-8" style={{ backgroundColor: colors.primary }}>
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-white justify-center items-center">
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-3xl font-bold text-white">{user.name}</Text>
              <Text className="text-lg text-blue-100">Joined in {joinedDate}</Text>
              {user.role && (
                <View className="bg-white/20 self-start px-2 py-0.5 rounded-full mt-1">
                  <Text className="text-white text-xs font-semibold capitalize">{user.role}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setSidebarVisible(true)} className="p-2">
              <Ionicons name="menu" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-white border-b border-gray-200">
          {['liked', 'shared'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-4 items-center border-b-2 ${activeTab === tab ? 'border-blue-500' : 'border-transparent'}`}
            >
              <Text className={`text-sm font-semibold ${activeTab === tab ? 'text-blue-500' : 'text-gray-600'}`}>
                {tab === 'liked' ? 'Liked Articles' : 'Shared Articles'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Articles List */}
        <View className="px-4 py-4">
          {tabLoading && currentArticles.length === 0 ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-gray-400 mt-3">Loading articles...</Text>
            </View>
          ) : currentArticles.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons
                name={activeTab === 'liked' ? 'heart-outline' : 'share-social-outline'}
                size={48} color="#ccc"
              />
              <Text className="text-gray-400 mt-3 text-center">
                {activeTab === 'liked'
                  ? "You haven't liked any articles yet."
                  : "You haven't shared any articles yet."}
              </Text>
            </View>
          ) : (
            <>
              {currentArticles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  onPress={() => navigation.navigate('ArticleDetail', { articleId: article.id })}
                  className="bg-white rounded-xl mb-3 flex-row overflow-hidden border border-gray-100"
                  style={{ elevation: 1 }}
                >
                  {/* Thumbnail */}
                  {article.featured_image ? (
                    <Image
                      source={{ uri: article.featured_image }}
                      style={{ width: 80, height: 80 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: 80, height: 80, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="image-outline" size={28} color="#ccc" />
                    </View>
                  )}
                  {/* Info */}
                  <View className="flex-1 px-3 py-3 justify-center">
                    <Text className="font-bold text-gray-900 text-sm mb-1" numberOfLines={2}>
                      {article.title}
                    </Text>
                    <Text className="text-gray-500 text-xs">{article.author_name ?? 'Unknown'}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">{formatDate(article.published_at)}</Text>
                  </View>
                </TouchableOpacity>
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
                    <Text className="text-blue-500 font-semibold text-base">Load More</Text>
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
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation navigation={navigation} activeTab="Profile" />
      </View>
    </SafeAreaView>
  );
}
