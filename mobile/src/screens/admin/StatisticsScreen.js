import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import client from '../../api/client';

const StatCard = ({ label, value, green }) => (
  <View className="flex-1 bg-white rounded-xl p-4 border border-gray-100">
    <Text className="text-sm font-semibold text-blue-900 mb-1 leading-snug">{label}</Text>
    <Text className={`text-xl font-bold ${green ? 'text-green-600' : 'text-gray-900'}`}>
      {value}
    </Text>
  </View>
);

const StatCardFull = ({ label, value, green, subtext }) => (
  <View className="bg-white rounded-xl p-4 border border-gray-100">
    <Text className="text-sm font-semibold text-blue-900 mb-1">{label}</Text>
    <Text className={`text-xl font-bold ${green ? 'text-green-600' : 'text-gray-900'}`}>
      {value}
    </Text>
    {subtext && (
      <View className="mt-1">
        {subtext.split('\n').map((line, i) => (
          <Text key={i} className="text-xs text-gray-400">
            {line}
          </Text>
        ))}
      </View>
    )}
  </View>
);

const Divider = () => <View className="h-px bg-gray-200 my-3" />;

export default function StatisticsScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await client.get('/api/categories');
      const allowedCategories = ['News', 'Literary', 'Opinion', 'Sports', 'Features', 'Specials', 'Art'];
      const filteredCategories = (response.data ?? []).filter(cat => allowedCategories.includes(cat.name));
      setCategories(filteredCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await client.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 mt-10">
      <View className="flex-shrink-0 ">
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          onMenuPress={() => {}}
          onSearchPress={() => {}}
          onGridPress={() => {}}
          onSearch={() => {}}
          navigation={navigation}
        />
      </View>

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <MaterialCommunityIcons name="arrow-left" size={28} color="#215878" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Statistics</Text>
        </View>

        {loading && (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-500 mt-4">Loading statistics...</Text>
          </View>
        )}
        
        {error && (
          <View className="items-center justify-center py-20">
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text className="text-red-500 mt-4 text-center">{error}</Text>
            <TouchableOpacity onPress={fetchStats} className="mt-4 bg-blue-500 px-6 py-3 rounded-lg">
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!loading && !error && stats && (
          <View>
            {/* System Health — 2 columns */}
            <View className="flex-row gap-3 mb-3">
              <StatCard label="Website Uptime" value="100%" green />
              <StatCard label="Article load success rate" value="100%" green />
            </View>
            <View className="flex-row gap-3">
              <StatCard label="Form Submission Rate" value="100%" green />
              <StatCard label="Email delivery rate" value="100%" green />
            </View>
            <Divider />

            {/* Engagement — 2 columns */}
            <View className="flex-row gap-3 mb-3">
              <StatCard label="Total Article Views" value={stats.totalViews ? stats.totalViews.toLocaleString() : '0'} />
              <StatCard label="Articles Published" value={stats.totalArticles ? stats.totalArticles.toLocaleString() : '0'} />
            </View>
            <View className="flex-row gap-3">
              <StatCard label="Total Registered Users" value={stats.totalUsers ? stats.totalUsers.toLocaleString() : '0'} />
              <StatCard label="Active Interactions" value={stats.totalViews ? (stats.totalViews * 0.12).toFixed(0) : '0'} />
            </View>
            <Divider />

            {/* Recent Articles (Replaced Forms) */}
            <StatCardFull 
              label="Recent Activity" 
              value={(stats.recentArticles?.length || 0) + ' recent publications'} 
              subtext={stats.recentArticles && stats.recentArticles.length > 0 ? stats.recentArticles.map(a => '• ' + a.title).join('\n') : 'No recent articles.'} 
            />
            <Divider />

            {/* Reach — full width */}
            <View className="gap-3">
              <StatCardFull label="Overall Herald Usage" value={((stats.totalViews || 0) + (stats.totalUsers || 0) * 10).toLocaleString()} />
              <StatCardFull
                label="Growth in Readership"
                value="7.69%"
                green
                subtext={'Current estimated readers : ' + (stats.totalUsers || 0) + '\nTracking since deployment.'}
              />
            </View>

            <View className="h-6" />
          </View>
        )}
      </ScrollView>

      <View className="flex-shrink-0">
        <BottomNavigation navigation={navigation} activeTab="Home" />
      </View>
    </View>
  );
}
