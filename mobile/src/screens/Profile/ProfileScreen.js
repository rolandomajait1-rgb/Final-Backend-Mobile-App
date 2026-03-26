import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Loader, Button } from '../../components/common';
import { getCurrentUser, logout } from '../../api/services/authService';
import { colors } from '../../styles';
import SideBar from './SideBar';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('liked');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const mountedRef = useRef(true);

  // Load profile on mount only
  useEffect(() => {
    mountedRef.current = true;
    loadProfile();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
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
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      
      // Check if it's a network error
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        console.log('Network issue - backend might be down or unreachable');
      }
      
      // Check if token is invalid (401)
      if (err.response?.status === 401) {
        console.log('Token expired or invalid - clearing auth');
        await AsyncStorage.removeItem('auth_token');
      }
      
      if (mountedRef.current) {
        setLoading(false);
        setUser(null);
      }
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
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            setUser(null);
            setSidebarVisible(false);
          } catch (err) {
            console.error('Logout error:', err);
          }
        },
      },
    ]);
  };

  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
  };

  const handleOpenSidebar = () => {
    setSidebarVisible(true);
  };

  const handleCloseSidebar = () => {
    setSidebarVisible(false);
  };

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="person-circle-outline" size={80} color={colors.border} />
          <Text className="text-2xl font-bold text-gray-900 mt-4">You're not signed in</Text>
          <Text className="text-sm text-gray-600 text-center mt-2 mb-6">
            Sign in to access your profile and saved articles.
          </Text>
          <Button title="Sign In" onPress={handleNavigateToLogin} />
        </View>
      </SafeAreaView>
    );
  }

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Header */}
        <View className="bg-cyan-700 px-4 py-8">
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-white justify-center items-center">
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-3xl font-bold text-white">{user.name}</Text>
              <Text className="text-lg text-blue-100">Joined in {joinedDate}</Text>
            </View>
            <TouchableOpacity onPress={handleOpenSidebar} className="p-2">
              <Ionicons name="menu" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-white border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setActiveTab('liked')}
            className={`flex-1 py-4 items-center border-b-2 ${
              activeTab === 'liked' ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                activeTab === 'liked' ? 'text-blue-500' : 'text-gray-600'
              }`}
            >
              Liked Articles
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('shared')}
            className={`flex-1 py-4 items-center border-b-2 ${
              activeTab === 'shared' ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                activeTab === 'shared' ? 'text-blue-500' : 'text-gray-600'
              }`}
            >
              Shared Articles
            </Text>
          </TouchableOpacity>
        </View>

        {/* Articles List */}
        <View className="px-4 py-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <TouchableOpacity
              key={item}
              className="flex-row items-start gap-3 pb-4 border-b border-gray-200"
            >
              <View className="w-24 h-24 bg-gray-300 rounded-lg justify-center items-center flex-shrink-0">
                <Ionicons name="image" size={30} color="#D1D5DB" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 mb-1">Engraved By History</Text>
                <Text className="text-s font-semibold text-green-600 mb-1 uppercase">LITERARY</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-gray-600">Reanne Kate Esguerra</Text>
                  <Text className="text-xs text-gray-500">1hr ago</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Load More Button */}
        <View className="items-center py-6">
          <TouchableOpacity>
            <Text className="text-blue-500 font-semibold text-base">Load More</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sidebar Component */}
      <SideBar
        visible={sidebarVisible}
        onClose={handleCloseSidebar}
        onLogout={handleLogout}
        navigation={navigation}
        user={user}
      />
    </SafeAreaView>
  );
}
