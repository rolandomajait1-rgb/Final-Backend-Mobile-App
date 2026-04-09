import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import client from '../../api/client';

export default function ManageModeratorsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [newModEmail, setNewModEmail] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchModerators();
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

  const fetchModerators = async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/admin/moderators');
      setModerators(res.data || []);
    } catch (err) {
      console.error('Error fetching moderators:', err);
      Alert.alert('Error', 'Failed to load moderators');
    } finally {
      setLoading(false);
    }
  };

  const handleAddModerator = async () => {
    if (!newModEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    
    try {
      setAddLoading(true);
      const res = await client.post('/api/admin/moderators', { email: newModEmail.trim() });
      Alert.alert('Success', res.data.message || 'Moderator added successfully');
      setNewModEmail('');
      fetchModerators();
    } catch (err) {
      console.error('Error adding moderator:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to add moderator';
      Alert.alert('Error', errorMsg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveModerator = (id, name) => {
    Alert.alert(
      'Remove Moderator',
      `Are you sure you want to remove ${name} from moderators?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/api/admin/moderators/${id}`);
              Alert.alert('Success', 'Moderator removed successfully');
              fetchModerators();
            } catch (err) {
              console.error('Error removing moderator:', err);
              Alert.alert('Error', 'Failed to remove moderator');
            }
          }
        }
      ]
    );
  };

  const filteredModerators = moderators.filter((mod) =>
    (mod.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (mod.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

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
          <Text className="text-2xl font-bold text-gray-900">Manage Moderators</Text>
        </View>

        {/* Add Moderator Form */}
        <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
          <Text className="text-sm font-semibold text-gray-800 mb-2">Add New Moderator</Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center bg-gray-50 rounded-lg px-4 py-3 border border-gray-300">
              <MaterialCommunityIcons name="email-outline" size={20} color="#999" />
              <TextInput
                className="flex-1 ml-2 text-gray-800"
                placeholder="Moderator Email"
                value={newModEmail}
                onChangeText={setNewModEmail}
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity 
              onPress={handleAddModerator} 
              disabled={addLoading}
              className={`rounded-lg px-6 py-3 flex-row items-center justify-center ${addLoading ? 'bg-blue-300' : 'bg-blue-500'}`}
            >
              {addLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center mb-4 bg-white rounded-full px-4 py-3 border border-gray-300">
          <MaterialCommunityIcons name="magnify" size={20} color="#999" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder="Search current moderators..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Moderators List */}
        {loading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : filteredModerators.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="text-gray-500">No moderators found</Text>
          </View>
        ) : (
          <View className="gap-3">
            {filteredModerators.map((moderator) => (
              <View
                key={moderator.id}
                className="bg-white rounded-lg p-4 flex-row items-center justify-between border border-gray-200"
              >
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-base mb-1">
                    {moderator.name}
                  </Text>
                  <Text className="text-gray-500 text-sm">{moderator.email}</Text>
                </View>

                {/* Remove Icon */}
                <TouchableOpacity 
                  className="ml-4 bg-red-50 p-2 rounded-full"
                  onPress={() => handleRemoveModerator(moderator.id, moderator.name)}
                >
                  <MaterialCommunityIcons name="delete-outline" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
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
