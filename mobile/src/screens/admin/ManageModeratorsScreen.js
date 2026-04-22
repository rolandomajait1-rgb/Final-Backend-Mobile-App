import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  const [showAddForm, setShowAddForm] = useState(false);

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
      setShowAddForm(false);
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
      'Manage Moderator',
      `What would you like to do with ${name}?`,
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
    <View className="flex-1 bg-gray-50">
      <View className="flex-shrink-0 bg-white">
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

      <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 rounded-full justify-center items-center mr-4" 
          style={{ backgroundColor: '#075985' }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-[22px] font-bold text-gray-900 tracking-tight">Manage Moderators</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View className="px-5 pt-5 pb-3">
          <View className="flex-row items-center border border-gray-300 rounded-full px-4 py-2.5 bg-white">
            <Ionicons name="search" size={20} color="#075985" />
            <TextInput
              className="flex-1 ml-3 text-gray-800 text-[16px]"
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Add Button Row */}
        <View className="flex-row justify-end px-5 mb-4">
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            className="flex-row items-center justify-center px-6 py-2.5 rounded-[14px] bg-[#0ea5e9]"
          >
            {addLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white text-[16px] font-medium ml-1.5">Add</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Add Moderator Interactive Form */}
        {showAddForm && (
          <View className="mx-5 bg-white border border-[#0ea5e9] rounded-xl p-4 mb-4" style={{ elevation: 2, shadowColor: '#0ea5e9', shadowOpacity: 0.2, shadowRadius: 5 }}>
            <Text className="text-sm font-semibold text-gray-800 mb-2">New Moderator Email</Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                <Ionicons name="mail-outline" size={20} color="#999" />
                <TextInput
                  className="flex-1 ml-2 text-gray-800"
                  placeholder="name@student.laverdad.edu.ph"
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
                className="bg-[#0ea5e9] rounded-lg px-5 py-3 items-center justify-center"
              >
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Moderators List */}
        <View className="px-5">
          {loading ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
          ) : filteredModerators.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Text className="text-gray-500">No moderators found</Text>
            </View>
          ) : (
            <View className="gap-4 pb-10">
              {filteredModerators.map((moderator) => (
                <View
                  key={moderator.id}
                  className="bg-white rounded-[14px] px-4 py-4 flex-row items-center justify-between border border-gray-300"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-gray-900 font-normal text-[18px] mb-0.5">
                      {moderator.name}
                    </Text>
                    <Text className="text-gray-500 italic text-[14px]">{moderator.email}</Text>
                  </View>

                  <TouchableOpacity 
                    className="p-2 -mr-2"
                    onPress={() => handleRemoveModerator(moderator.id, moderator.name)}
                  >
                    <Ionicons name="ellipsis-vertical" size={24} color="#075985" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View className="flex-shrink-0">
        <BottomNavigation navigation={navigation} activeTab="Home" />
      </View>
    </View>
  );
}
