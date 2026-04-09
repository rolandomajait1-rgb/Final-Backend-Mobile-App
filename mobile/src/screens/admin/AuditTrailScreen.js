import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import client from '../../api/client';

export default function AuditTrailScreen({ navigation }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchLogs();
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

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await client.get('/api/admin/audit-logs');
      // res.data is expected to be a paginated response: { data: [...] }
      setAuditLogs(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const getColorForAction = (action) => {
    const lowerAction = action?.toLowerCase() || '';
    if (lowerAction.includes('published') || lowerAction.includes('created')) return '#10b981'; // Green
    if (lowerAction.includes('edited') || lowerAction.includes('updated')) return '#3b82f6'; // Blue
    if (lowerAction.includes('deleted')) return '#ef4444'; // Red
    return '#6b7280'; // Gray
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: 'Unknown', time: '' };
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <View className="flex-1 bg-gray-50 mt-10">
      <View className="flex-shrink-0">
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
            <MaterialCommunityIcons name="arrow-left" size={28} color="#215878ff" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Audit Trail</Text>
        </View>

        {loading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-500 mt-4">Loading audit logs...</Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center py-20">
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text className="text-red-500 mt-4 text-center">{error}</Text>
            <TouchableOpacity onPress={fetchLogs} className="mt-4 bg-blue-500 px-6 py-3 rounded-lg">
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : auditLogs.length === 0 ? (
          <View className="items-center justify-center py-20">
            <MaterialCommunityIcons name="clipboard-list-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 mt-4 text-center">No audit logs found</Text>
          </View>
        ) : (
          <View className="gap-3">
            {auditLogs.map((log) => {
              const { date, time } = formatDateTime(log.created_at);
              const color = getColorForAction(log.action);
              
              return (
                <View
                  key={log.id}
                  className="bg-white rounded-lg p-4 flex-row items-start border border-gray-200"
                >
                  <View
                    className="w-1 h-20 rounded-full mr-4"
                    style={{ backgroundColor: color }}
                  />

                  <View className="flex-1">
                    <Text className="font-semibold text-sm mb-1 capitalize" style={{ color }}>
                      {log.action}
                    </Text>
                    <Text className="text-gray-900 font-semibold text-base mb-1" numberOfLines={2}>
                      {log.article_title || 'Unknown Item'}
                    </Text>
                    <Text className="text-gray-500 text-xs mb-2">{log.user_email}</Text>
                    <Text className="text-gray-400 text-xs">
                      {date} {time}
                    </Text>
                  </View>
                </View>
              );
            })}
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
