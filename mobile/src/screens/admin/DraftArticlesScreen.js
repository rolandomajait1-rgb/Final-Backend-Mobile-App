import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import client from '../../api/client';
import { deleteArticle } from '../../api/services/articleService';
import { showAuditToast } from '../../utils/toastNotification';

export default function DraftArticlesScreen({ navigation }) {
  const [draftArticles, setDraftArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [menuArticle, setMenuArticle] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuY, setMenuY] = useState(0);
  const [categories, setCategories] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchDrafts();
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

  const fetchDrafts = async () => {
    try {
      setError(null);
      // Drafts are stored as articles with status='draft'
      const res = await client.get('/api/articles', { params: { status: 'draft' } });
      setDraftArticles(res.data?.data ?? []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      setError('Failed to load draft articles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDrafts();
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleMenuPress = (article, event) => {
    event.stopPropagation();
    setMenuArticle(article);
    if (event?.nativeEvent?.pageY) {
      setMenuY(event.nativeEvent.pageY + 10);
    }
    setShowMenu(true);
  };

  const handleEdit = () => {
    setShowMenu(false);
    navigation.navigate('EditArticle', { articleId: menuArticle.id });
  };

  const handlePublish = () => {
    setShowMenu(false);
    navigation.navigate('PublishArticle', { articleId: menuArticle.id, isDraft: true });
  };

  // Bug #8 Fix: Use toast + DeleteConfirmModal instead of Alert.alert
  const handleDelete = () => {
    if (!menuArticle) return;
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!menuArticle?.id || deletingDraft) return;
    try {
      setDeletingDraft(true);
      await deleteArticle(menuArticle.id);
      setShowDeleteModal(false);
      showAuditToast('success', 'Draft deleted successfully');
      await fetchDrafts();
    } catch (error) {
      console.error('Error deleting draft:', error);
      showAuditToast('error', 'Failed to delete draft. Please try again.');
    } finally {
      setDeletingDraft(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar hidden={true} />
      {/* Header */}
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

      {/* Content */}
      <ScrollView 
        className="flex-1 px-4 py-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Back Button and Title */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <MaterialCommunityIcons name="arrow-left" size={28} color="#215878ff" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Draft Articles</Text>
        </View>

        {/* Loading State */}
        {loading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-500 mt-4">Loading drafts...</Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center py-20">
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text className="text-red-500 mt-4 text-center">{error}</Text>
            <TouchableOpacity onPress={fetchDrafts} className="mt-4 bg-blue-500 px-6 py-3 rounded-lg">
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : draftArticles.length === 0 ? (
          <View className="items-center justify-center py-20">
            <MaterialCommunityIcons name="file-document-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 mt-4 text-center">No draft articles yet</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('CreateArticle')} 
              className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Create Article</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-4">
            {draftArticles.map((article) => (
              <TouchableOpacity
                key={article.id}
                onPress={() => navigation.navigate('EditArticle', { articleId: article.id })}
                className="bg-white rounded-lg p-4 flex-row items-start border border-gray-200"
              >
                {/* Article Image or Placeholder */}
                {(article.featured_image_url || article.featured_image) ? (
                  <Image
                    source={{ uri: article.featured_image_url || article.featured_image }}
                    className="w-20 h-20 rounded-lg mr-4"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-20 h-20 bg-gray-300 rounded-lg mr-4 items-center justify-center">
                    <MaterialCommunityIcons name="image-outline" size={32} color="#999" />
                  </View>
                )}

                {/* Content */}
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold text-base mb-1" numberOfLines={2}>
                    {article.title}
                  </Text>
                  {article.categories?.[0]?.name && (
                    <View className="bg-yellow-100 rounded-full px-2 py-1 mb-2 self-start">
                      <Text className="text-yellow-700 text-xs font-semibold">
                        {article.categories[0].name?.toUpperCase() || 'DRAFT'}
                      </Text>
                    </View>
                  )}
                  <Text className="text-gray-600 text-sm mb-1">{article.author_name || 'Unknown Author'}</Text>
                  <Text className="text-gray-400 text-xs">{formatTime(article.updated_at)}</Text>
                </View>

                {/* Menu Icon */}
                <TouchableOpacity 
                  className="ml-2"
                  onPress={(e) => handleMenuPress(article, e)}
                >
                  <MaterialCommunityIcons name="dots-vertical" size={20} color="#999" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit/Delete Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40"
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={{ position: 'absolute', top: menuY, right: 40 }}>
            <View className="bg-white rounded-xl shadow-lg border border-gray-50 py-1" style={{ minWidth: 140, elevation: 5 }}>
              <TouchableOpacity
                onPress={handlePublish}
                className="flex-row items-center px-5 py-3"
              >
                <Ionicons name="cloud-upload-outline" size={20} color="#10b981" />
                <Text className="ml-4 text-gray-700 text-[15px]">Publish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEdit}
                className="flex-row items-center px-5 py-3"
              >
                <Ionicons name="create-outline" size={20} color="#0284c7" />
                <Text className="ml-4 text-gray-700 text-[15px]">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-row items-center px-5 py-3"
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text className="ml-4 text-red-500 text-[15px]">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bug #8 Fix: Use DeleteConfirmModal for consistent delete UX */}
      <DeleteConfirmModal
        visible={showDeleteModal}
        loading={deletingDraft}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deletingDraft) setShowDeleteModal(false);
        }}
      />

      {/* Bottom Navigation */}
      <View className="flex-shrink-0">
        <BottomNavigation navigation={navigation} activeTab="Home" />
      </View>

      {/* Floating Action Button (Create Article) */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateArticle')}
        style={{
          position: 'absolute',
          bottom: 110,
          right: 20,
          backgroundColor: '#f39c12',
          width: 70,
          height: 70,
          borderRadius: 100,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}
      >
        <Ionicons name="add" size={48} color="white" />
      </TouchableOpacity>
    </View>
  );
}
