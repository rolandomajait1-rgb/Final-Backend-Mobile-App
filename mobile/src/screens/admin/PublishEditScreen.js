import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../../api/client';
import { ArticleContext } from '../../context/ArticleContext';

/**
 * PublishEditScreen — confirmation modal for article edits.
 *
 * Expected route.params:
 *   articleId         number   – ID of the article to update
 *   title             string
 *   content           string
 *   category          string   – category NAME (not ID)
 *   tags              string[] – array of tag names
 *   author            string   – author name
 *   status            string   – current status
 *   featuredImageUrl  string|null – Cloudinary URL if image was changed
 */
export default function PublishEditScreen({ navigation, route }) {
  const {
    articleId,
    title,
    content,
    category,
    tags = [],
    author,
    featuredImageUrl,
  } = route.params ?? {};

  const { forceRefreshArticles } = useContext(ArticleContext);
  const [loading, setLoading] = useState(false);

  const updateArticle = async (status) => {
    if (!articleId) {
      Alert.alert('Error', 'No article ID provided.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Not Logged In', 'Please log in to edit articles.');
        navigation.navigate('Login');
        return;
      }

      const payload = {
        title:    title?.trim(),
        content:  content?.trim(),
        category: category,               // backend update() expects category NAME
        author:   author?.trim(),
        status:   status,
        tags:     Array.isArray(tags) ? tags.join(',') : tags,
        _method:  'PUT',
      };

      if (featuredImageUrl) {
        payload.featured_image_url = featuredImageUrl;
      }

      await client.post(`/api/articles/${articleId}`, payload);

      // Refresh article list so HomeScreen shows updated data
      try { await forceRefreshArticles(); } catch { /* non-critical */ }

      Alert.alert(
        'Success',
        status === 'published' ? 'Article published successfully!' : 'Article saved as draft!',
        [{ text: 'OK', onPress: () => navigation.navigate('MainApp', { screen: 'Home' }) }]
      );
    } catch (error) {
      console.error('Error updating article:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to update article. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = () => {
    Alert.alert(
      'Publish Article',
      'Are you sure you want to publish this article?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Publish', onPress: () => updateArticle('published') },
      ]
    );
  };

  const handleSave = () => updateArticle('draft');

  const handleDiscard = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', onPress: () => navigation.goBack(), style: 'destructive' },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Close */}
      <View className="absolute top-4 right-4 z-10">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-500 mt-4">Saving article...</Text>
          </>
        ) : (
          <>
            <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Save Changes
            </Text>
            <Text className="text-gray-600 text-center mb-8 text-base leading-relaxed">
              Publish now or save as a draft to finish later.
            </Text>

            {/* Publish */}
            <TouchableOpacity
              onPress={handlePublish}
              className="w-full bg-blue-500 rounded-full py-4 mb-4"
            >
              <Text className="text-white text-center font-bold text-lg">Publish</Text>
            </TouchableOpacity>

            {/* Save as Draft */}
            <TouchableOpacity
              onPress={handleSave}
              className="w-full border-2 border-blue-500 rounded-full py-4 mb-4"
            >
              <Text className="text-blue-500 text-center font-bold text-lg">Save as Draft</Text>
            </TouchableOpacity>

            {/* Discard */}
            <TouchableOpacity
              onPress={handleDiscard}
              className="w-full border-2 border-red-500 rounded-full py-4"
            >
              <Text className="text-red-500 text-center font-bold text-lg">Discard</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
