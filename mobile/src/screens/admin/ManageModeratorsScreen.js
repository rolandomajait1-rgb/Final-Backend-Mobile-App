import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import RemoveModeratorModal from '../../components/common/RemoveModeratorModal';
import { showAuditToast, showModeratorSuccessToast, showModeratorErrorToast } from '../../utils/toastNotification';
import client from '../../api/client';
import { ALLOWED_CATEGORIES } from '../../constants/categories';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce } from '../../utils/debounce';
import { searchArticles } from '../../api/services/articleService';
import ArticleMediumCard from '../../components/articles/ArticleMediumCard';
import { handleAuthorPress } from '../../utils/authorNavigation';
import { handleCategoryPress } from '../../utils/categoryNavigation';
import { isAdminOrModerator } from '../../utils/authUtils';
import { ArticleActionMenu } from '../../components/common';
import { formatArticleDate } from '../../utils/dateUtils';
import { colors } from '../../styles';

export default function ManageModeratorsScreen({ navigation }) {
  const [headerSearchQuery, setHeaderSearchQuery] = useState(''); // For HomeHeader article search
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [moderatorSearchQuery, setModeratorSearchQuery] = useState(''); // For moderator filtering
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [newModEmail, setNewModEmail] = useState('');
  const [categories, setCategories] = useState([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedModerator, setSelectedModerator] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [moderatorToRemove, setModeratorToRemove] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [menuArticle, setMenuArticle] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuX, setMenuX] = useState(0);
  const [menuY, setMenuY] = useState(0);

  useEffect(() => {
    const checkRole = async () => {
      const userJson = await AsyncStorage.getItem('user_data');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user.role !== 'admin') {
          navigation.replace('Admin');
          return;
        }
      } else {
        navigation.replace('Login');
        return;
      }
      fetchCategories();
      fetchModerators();
      checkAdminStatus();
    };
    checkRole();
  }, [navigation]);

  const checkAdminStatus = async () => {
    const adminStatus = await isAdminOrModerator();
    setIsAdminUser(adminStatus);
  };

  const handleSearch = useCallback(async (query) => {
    setHeaderSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await searchArticles(query.trim());
      setSearchResults(res.data?.data ?? []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const debouncedSearch = useMemo(() => debounce(handleSearch, 500), [handleSearch]);

  const fetchCategories = async () => {
    try {
      const response = await client.get('/api/categories');
      const filteredCategories = (response.data ?? []).filter(cat => ALLOWED_CATEGORIES.includes(cat.name));
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
      await client.post('/api/admin/moderators', { email: newModEmail.trim() });
      showModeratorSuccessToast('added');
      setNewModEmail('');
      setShowAddForm(false);
      fetchModerators();
    } catch (err) {
      console.error('Error adding moderator:', err);
      showModeratorErrorToast('added');
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to add moderator';
      showAuditToast('error', errorMsg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveModerator = async (moderator) => {
    setModeratorToRemove(moderator);
    setSelectedModerator(null); // Close the dropdown
    setShowRemoveModal(true);
  };

  const confirmRemoveModerator = async () => {
    if (!moderatorToRemove) return;
    
    setRemoveLoading(true);
    try {
      await client.delete(`/api/admin/moderators/${moderatorToRemove.id}`);
      showModeratorSuccessToast('removed');
      setShowRemoveModal(false);
      setModeratorToRemove(null);
      fetchModerators();
    } catch (err) {
      console.error('Error removing moderator:', err);
      showModeratorErrorToast('removed');
      setShowRemoveModal(false);
      setModeratorToRemove(null);
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleMenuPress = (article, pos) => {
    setMenuArticle(article);
    setMenuX(pos.px);
    setMenuY(pos.py);
    setShowMenu(true);
  };

  const handleEditArticle = () => {
    setShowMenu(false);
    navigation.navigate("Management", { screen: "EditArticle", params: { articleId: menuArticle.id } });
  };

  const handleDeleteArticle = async () => {
    setShowMenu(false);
    try {
      const { deleteArticle } = await import("../../api/services/articleService");
      await deleteArticle(menuArticle.id);
      setSearchResults(prev => prev.filter(a => a.id !== menuArticle.id));
      showAuditToast("success", "Article deleted successfully");
    } catch (err) {
      console.error("Error deleting article:", err);
      showAuditToast("error", "Failed to delete article");
    }
  };

  const filteredModerators = moderators.filter((mod) =>
    (mod.name?.toLowerCase() || '').includes(moderatorSearchQuery.toLowerCase()) ||
    (mod.email?.toLowerCase() || '').includes(moderatorSearchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-shrink-0 bg-white">
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          onMenuPress={() => {}}
          onGridPress={() => {
            // Don't navigate if already in Management stack
            // Just go back to Admin dashboard
            navigation.navigate('Management', { screen: 'Admin' });
          }}
          onSearch={debouncedSearch}
          navigation={navigation}
          enableSearch={true}
          searchQuery={headerSearchQuery}
        />
      </View>

      <View className="flex-row items-center px-4 py-4 border-b border-gray-200 bg-white">
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
        {headerSearchQuery.trim() !== '' ? (
          <View className="px-5 py-4">
            {searching ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-gray-500 mt-4">Searching...</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Ionicons name="search-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-500 mt-4 text-center">No articles found for "{headerSearchQuery}"</Text>
              </View>
            ) : (
              <View className="gap-3">
                {searchResults.map((article) => (
                  <ArticleMediumCard
                    key={article.id}
                    title={article.title}
                    category={article.categories?.[0]?.name || 'Uncategorized'}
                    author={article.author_name || article.author?.name || 'Unknown Author'}
                    date={formatArticleDate(article.created_at || article.published_at)}
                    image={article.featured_image_url || article.featured_image}
                    hashtags={article.tags?.map((t) => t.name) || []}
                    onPress={() => navigation.navigate('ArticleStack', { screen: 'ArticleDetail', params: { slug: article.slug, article } })}
                    onMenuPress={isAdminUser ? (pos) => handleMenuPress(article, pos) : undefined}
                    onTagPress={(tagName) => navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName } })}
                    onAuthorPress={() => handleAuthorPress(article, navigation)}
                    onCategoryPress={(category) => handleCategoryPress(category, navigation)}
                    navigation={navigation}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
        {/* Search Box */}
        <View className="px-5 py-4">
          <View className="flex-row items-center border border-gray-300 rounded-full bg-white px-3 py-2">
            <Ionicons name="search-outline" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-2 text-gray-900"
              placeholder="Search by name or email"
              placeholderTextColor="#9ca3af"
              value={moderatorSearchQuery}
              onChangeText={setModeratorSearchQuery}
              style={{ fontSize: 14 }}
            />
            {moderatorSearchQuery ? (
              <TouchableOpacity onPress={() => setModeratorSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
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

        {/* Add Moderator Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showAddForm}
          onRequestClose={() => setShowAddForm(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ 
              flex: 1, 
              backgroundColor: 'rgba(0,0,0,0.5)', 
              justifyContent: 'center', 
              alignItems: 'center',
              padding: 20
            }}
          >
            <View 
              style={{ 
                backgroundColor: 'white', 
                width: '100%', 
                maxWidth: 400, 
                borderRadius: 24, 
                padding: 24,
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <TouchableOpacity 
                onPress={() => setShowAddForm(false)}
                style={{ position: 'absolute', right: 20, top: 20, zIndex: 1 }}
              >
                <Ionicons name="close" size={28} color="#94a3b8" />
              </TouchableOpacity>

              {/* Title & Description */}
              <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 24 }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#000', marginBottom: 8 }}>
                  Add Moderator
                </Text>
                <Text style={{ fontSize: 16, color: '#475569', textAlign: 'center' }}>
                  Add another account as moderator?
                </Text>
              </View>

              {/* Input Field */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>
                  Email Address *
                </Text>
                <View 
                  style={{ 
                    borderWidth: 1, 
                    borderColor: '#cbd5e1', 
                    borderRadius: 12, 
                    paddingHorizontal: 16, 
                    height: 52,
                    justifyContent: 'center'
                  }}
                >
                  <TextInput
                    placeholder="Enter email address"
                    value={newModEmail}
                    onChangeText={setNewModEmail}
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ fontSize: 16, color: '#0f172a' }}
                  />
                </View>
              </View>

              {/* Add Button */}
              <TouchableOpacity
                onPress={handleAddModerator}
                disabled={addLoading}
                style={{
                  backgroundColor: '#0ea5e9',
                  width: '50%',
                  alignSelf: 'center',
                  borderRadius: 50,
                  height: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#0ea5e9',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4
                }}
              >
                {addLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Action Menu Modal (for Remove) - Removed, using inline dropdown instead */}

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

                  <View>
                    <TouchableOpacity 
                      className="p-2"
                      onPress={() => setSelectedModerator(moderator)}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
                    </TouchableOpacity>

                    {/* Dropdown Menu */}
                    {selectedModerator?.id === moderator.id && (
                      <>
                        {/* Backdrop to close menu */}
                        <Pressable
                          style={{
                            position: 'absolute',
                            top: -1000,
                            left: -1000,
                            right: -1000,
                            bottom: -1000,
                            zIndex: 999,
                          }}
                          onPress={() => setSelectedModerator(null)}
                        />
                        
                        {/* Menu */}
                        <View 
                          style={{ 
                            position: 'absolute',
                            top: 35,
                            right: 0,
                            backgroundColor: 'white',
                            borderRadius: 12,
                            padding: 8,
                            width: 180,
                            elevation: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 5 },
                            shadowOpacity: 0.3,
                            shadowRadius: 10,
                            zIndex: 1000,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              handleRemoveModerator(selectedModerator);
                            }}
                            style={{ 
                              flexDirection: 'row', 
                              alignItems: 'center', 
                              padding: 12,
                              borderRadius: 8,
                            }}
                          >
                            <Ionicons name="person-remove-outline" size={20} color="#ff4d4d" />
                            <Text style={{ color: '#ff4d4d', fontSize: 16, fontWeight: '600', marginLeft: 12 }}>
                              Remove Mod
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
          </>
        )}
      </ScrollView>

      <View className="flex-shrink-0">
        <BottomNavigation navigation={navigation} activeTab="Home" />
      </View>

      {/* Remove Moderator Modal */}
      <RemoveModeratorModal
        visible={showRemoveModal}
        moderatorName={moderatorToRemove?.name || 'Moderator'}
        onConfirm={confirmRemoveModerator}
        onCancel={() => {
          setShowRemoveModal(false);
          setModeratorToRemove(null);
        }}
        loading={removeLoading}
      />

      {/* Article Action Menu */}
      <ArticleActionMenu
        visible={showMenu}
        x={menuX}
        y={menuY}
        onClose={() => setShowMenu(false)}
        actions={[
          {
            label: "Edit",
            icon: "create-outline",
            color: "#0284c7",
            onPress: handleEditArticle,
          },
          {
            label: "Delete",
            icon: "trash-outline",
            color: "#ef4444",
            onPress: handleDeleteArticle,
          },
        ]}
      />
    </View>
  );
}
