import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import HomeHeader from '../homepage/HomeHeader';
import ArticleMediumCard from '../../components/articles/ArticleMediumCard';
import { BottomNavigation, ArticleActionMenu } from '../../components/common';
import SaveDraftModal from '../../components/common/SaveDraftModal';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import { ALLOWED_CATEGORIES } from '../../constants/categories';
import { formatTimeAgo } from '../../utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../../api/client';
import { deleteArticle } from '../../api/services/articleService';
import { showAuditToast } from '../../utils/toastNotification';
import { handleAuthorPress } from '../../utils/authorNavigation';

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
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingDraft, setPublishingDraft] = useState(false);
  const [menuX, setMenuX] = useState(0);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkUserRole();
    fetchCategories();
    fetchDrafts();
  }, []);

  const checkUserRole = async () => {
    const userJson = await AsyncStorage.getItem('user_data');
    if (userJson) {
      const user = JSON.parse(userJson);
      setUserRole(user.role);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await client.get('/api/categories');
      const filteredCategories = (response.data ?? []).filter(cat => ALLOWED_CATEGORIES.includes(cat.name));
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

// formatTime removed in favor of formatTimeAgo from dateUtils

  const handleMenuPress = (article, pos) => {
    setMenuArticle(article);
    setMenuY(pos.py);
    setMenuX(pos.px);
    setShowMenu(true);
  };

  const handleEdit = () => {
    setShowMenu(false);
    navigation.navigate('EditArticle', { articleId: menuArticle.id });
  };

  const handlePublish = () => {
    setShowMenu(false);
    setShowPublishModal(true);
  };

  const confirmPublish = async () => {
    if (!menuArticle?.id || publishingDraft) return;
    try {
      setPublishingDraft(true);
      // Fetch full article to ensure we pass all required fields back to the server
      const res = await client.get(`/api/articles/id/${menuArticle.id}`);
      const fullArticle = res.data;
      
      const payload = {
        title: fullArticle.title,
        content: fullArticle.content,
        category: fullArticle.categories?.[0]?.name,
        author: fullArticle.author_name || fullArticle.author?.name || fullArticle.author?.user?.name,
        status: 'published',
        tags: fullArticle.tags?.map(t => t.name).join(','),
        _method: 'PUT'
      };
      
      await client.post(`/api/articles/${menuArticle.id}`, payload);
      setShowPublishModal(false);
      showAuditToast('success', 'Article published successfully!');
      fetchDrafts();
    } catch (error) {
      console.error('Error publishing draft:', error);
      showAuditToast('error', 'Failed to publish draft. Please try again.');
    } finally {
      setPublishingDraft(false);
    }
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
      
      // Remove from local state immediately
      setDraftArticles(prev => prev.filter(d => d.id !== menuArticle.id));
      
      setShowDeleteModal(false);
      showAuditToast('success', 'Draft deleted successfully');
      
      // Refresh latest articles context
      try {
        const { forceRefreshArticles } = require('../../context/ArticleContext');
        // Note: DraftArticlesScreen doesn't use ArticleContext, so we skip this
      } catch (err) {
        // Non-critical
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      
      // Check if it's a 404 error (draft already deleted)
      if (error.response?.status === 404) {
        // Remove from local state since it doesn't exist anymore
        setDraftArticles(prev => prev.filter(d => d.id !== menuArticle.id));
        setShowDeleteModal(false);
        showAuditToast('info', 'Draft was already deleted');
      } else {
        showAuditToast('error', 'Failed to delete draft. Please try again.');
      }
    } finally {
      setDeletingDraft(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar hidden={false} />
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
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="w-11 h-11 rounded-full bg-[#215878] items-center justify-center mr-3"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
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
              <ArticleMediumCard
                key={article.id}
                title={article.title}
                category={article.categories?.[0]?.name || 'DRAFT'}
                author={article.author_name || 'Unknown Author'}
                date={formatTimeAgo(article.updated_at)}
                image={article.featured_image_url || article.featured_image}
                hashtags={article.tags}
                onPress={() => navigation.navigate('EditArticle', { articleId: article.id })}
                onMenuPress={(e) => handleMenuPress(article, e)}
                onAuthorPress={() => handleAuthorPress(article, navigation)}
                isDraft={true}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit/Delete Menu Modal */}
      <ArticleActionMenu
        visible={showMenu}
        y={menuY}
        x={menuX}
        onClose={() => setShowMenu(false)}
        actions={[
          // Only Admin can Publish
          ...(userRole === 'admin' ? [{
            label: "Publish",
            icon: "cloud-upload-outline",
            color: "#10b981",
            onPress: handlePublish,
          }] : []),
          {
            label: "Edit",
            icon: "create-outline",
            color: "#0284c7",
            onPress: handleEdit,
          },
          // Only Admin can Delete
          ...(userRole === 'admin' ? [{
            label: "Delete",
            icon: "trash-outline",
            color: "#ef4444",
            onPress: handleDelete,
          }] : []),
        ]}
      />

      {/* Bug #8 Fix: Use DeleteConfirmModal for consistent delete UX */}
      <DeleteConfirmModal
        visible={showDeleteModal}
        loading={deletingDraft}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deletingDraft) setShowDeleteModal(false);
        }}
      />

      {/* Publish Confirm Modal styled like SaveDraftModal */}
      <SaveDraftModal
        isOpen={showPublishModal}
        onClose={() => {
          if (!publishingDraft) setShowPublishModal(false);
        }}
        title="Publish Article"
        description="Are you sure you want to publish this draft to the public?"
        publishText="Publish"
        discardText="Cancel"
        onPublish={confirmPublish}
        onDiscard={() => {
          if (!publishingDraft) setShowPublishModal(false);
        }}
        isSaving={publishingDraft}
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
          right: 18,
          bottom: 112,
          width: 72,
          height: 72,
          borderRadius: 999,
          backgroundColor: '#f39c12',
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
        }}
      >
        <Ionicons name="add" size={40} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
