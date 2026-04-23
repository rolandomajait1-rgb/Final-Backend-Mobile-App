import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../../api/client';
import { ArticleContext } from '../../context/ArticleContext';

/**
 * PublishArticleScreen — confirmation modal for new article creation.
 *
 * Expected route.params:
 *   title            string
 *   content          string
 *   category_id      number   – category ID
 *   author_name      string
 *   tags             string[] – array of tag names
 *   featuredImageUrl string|null – Cloudinary URL if image was picked
 */
export default function PublishArticleScreen({ route, navigation }) {
  const {
    title,
    content,
    category_id,
    author_name,
    tags = [],
    featuredImageUrl,
  } = route.params ?? {};

  const { forceRefreshArticles } = useContext(ArticleContext);
  const [loading, setLoading] = useState(false);

  const submitArticle = async (status) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Not Logged In', 'Please log in to create articles.');
        navigation.navigate('Login');
        return;
      }

      const payload = {
        title:       title?.trim(),
        content:     content?.trim(),
        category_id: category_id,
        author_name: author_name?.trim(),
        status:      status,
        tags:        Array.isArray(tags) ? tags : [],
      };

      if (featuredImageUrl) {
        payload.featured_image_url = featuredImageUrl;
      }

      await client.post('/api/articles', payload);

      try { await forceRefreshArticles(); } catch { /* non-critical */ }

      Alert.alert(
        'Success',
        status === 'published' ? 'Article published!' : 'Article saved as draft.',
        [{ text: 'OK', onPress: () => navigation.navigate('Admin') }]
      );
    } catch (error) {
      console.error('Error creating article:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to create article. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = () => submitArticle('published');
  const handleSaveDraft = () => submitArticle('draft');

  const handleDiscard = () => {
    Alert.alert(
      'Discard Article',
      'Are you sure you want to discard this article?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', onPress: () => navigation.navigate('Admin'), style: 'destructive' },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-500 mt-4">Submitting article...</Text>
        </>
      ) : (
        <>
          <MaterialCommunityIcons name="file-check-outline" size={80} color="#0ea5e9" style={{ marginBottom: 24 }} />

          <Text className="text-3xl font-bold text-gray-900 text-center mb-3">
            Ready to Post?
          </Text>

          <Text className="text-gray-600 text-center text-base mb-12 leading-relaxed">
            Publish now or save as a draft to finish later.
          </Text>

          {/* Publish */}
          <TouchableOpacity
            onPress={handlePublish}
            className="w-full bg-blue-500 rounded-full py-4 items-center mb-4"
          >
            <Text className="text-white font-bold text-lg">Publish</Text>
          </TouchableOpacity>

          {/* Save as Draft */}
          <TouchableOpacity
            onPress={handleSaveDraft}
            className="w-full border-2 border-blue-500 rounded-full py-4 items-center mb-4"
          >
            <Text className="text-blue-500 font-bold text-lg">Save as Draft</Text>
          </TouchableOpacity>

          {/* Discard */}
          <TouchableOpacity
            onPress={handleDiscard}
            className="w-full border-2 border-red-500 rounded-full py-4 items-center"
          >
            <Text className="text-red-500 font-bold text-lg">Discard</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
