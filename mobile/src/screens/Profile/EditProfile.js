import { useState, useCallback, useMemo } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import SaveProfileModal from '../../components/common/SaveProfileModal';
import { showAuditToast, showProfileSuccessToast, showProfileErrorToast } from '../../utils/toastNotification';
import { debounce } from '../../utils/debounce';
import { searchArticles } from '../../api/services/articleService';
import ArticleMediumCard from '../../components/articles/ArticleMediumCard';
import { handleAuthorPress } from '../../utils/authorNavigation';
import { handleCategoryPress } from '../../utils/categoryNavigation';
import { colors } from '../../styles';
import { ArticleActionMenu } from '../../components/common';
import { formatArticleDate } from '../../utils/dateUtils';

const validatePassword = (password) => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }

  return null;
};

export default function EditProfile({ navigation, route }) {
  const userData = route?.params?.user || {};
  const isAdminUser = userData.role === 'admin' || userData.role === 'moderator';
  const [formData, setFormData] = useState({
    name: userData.name || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [menuArticle, setMenuArticle] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuX, setMenuX] = useState(0);
  const [menuY, setMenuY] = useState(0);

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
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

  const handleCopyEmail = async () => {
    if (userData.email) {
      await Clipboard.setStringAsync(userData.email);
      showAuditToast('success', 'Email copied to clipboard');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSavePress = () => {
    // Bug #12 Fix: Validate password fields BEFORE opening modal
    if (formData.oldPassword || formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        showAuditToast('error', 'Passwords do not match');
        return;
      }
      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        showAuditToast('error', passwordError);
        return;
      }
      if (!formData.oldPassword) {
        showAuditToast('error', 'Please enter your current password');
        return;
      }
    }
    setShowSaveModal(true);
  };

  const confirmSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      let updated = false;

      // Update profile name
      if (formData.name.trim() && formData.name !== userData.name) {
        await client.put('/api/user/profile', { name: formData.name.trim() });
        updated = true;
      }

      // Change password if provided (validation already passed in handleSavePress)
      if (formData.oldPassword && formData.newPassword) {
        await client.post('/api/change-password', {
          current_password: formData.oldPassword,
          password: formData.newPassword,
          password_confirmation: formData.confirmPassword,
        });
        updated = true;
      }

      if (updated) {
        setShowSaveModal(false);
        showProfileSuccessToast('updated');
        navigation.goBack();
      } else {
        setShowSaveModal(false);
        navigation.goBack();
      }
    } catch (err) {
      setShowSaveModal(false);
      showProfileErrorToast('updated');
      // Still show the specific error message if available for debugging/user info
      if (err.response?.data?.message) {
        showAuditToast('error', err.response.data.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setShowSaveModal(false);
    showProfileSuccessToast('discarded');
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-shrink-0 bg-white">
        <HomeHeader
          categories={[]}
          onCategorySelect={() => {}}
          onMenuPress={() => {}}
          onGridPress={() => navigation.navigate('Management', { screen: 'Admin' })}
          onSearch={debouncedSearch}
          navigation={navigation}
          enableSearch={false}
          searchQuery={searchQuery}
        />
      </View>

      {searchQuery.trim() !== '' ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-4 py-4">
            {searching ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-gray-500 mt-4">Searching...</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Ionicons name="search-outline" size={48} color={colors.border} />
                <Text className="text-gray-500 mt-4 text-center">No articles found for "{searchQuery}"</Text>
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
        </ScrollView>
      ) : (
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={20}
        >
          {/* Account Settings Header */}
          <View className="flex-row items-center px-6 py-5 bg-white relative justify-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="absolute left-6 z-10 p-2 -ml-2">
              <Ionicons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>
            <Text className="text-[26px] font-bold text-gray-900 tracking-tight">Account Settings</Text>
          </View>

          {/* Main Content */}
          <View
            className="flex-1 bg-white"
            style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 60 }}
          >
            {/* Name Field */}
            <View className="mb-6">
              <Text className="text-[14px] font-medium text-gray-800 mb-2">Name</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 bg-white"
                placeholder="Enter Name"
                placeholderTextColor="#cbd5e1"
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
                style={{ fontSize: 16 }}
              />
            </View>

            {/* Email Field (Read Only) */}
            <View className="mb-6">
              <Text className="text-[14px] font-medium text-gray-800 mb-2">Email</Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5">
                <Text className="flex-1 text-gray-500" style={{ fontSize: 16 }}>
                  {userData.email || 'No email provided'}
                </Text>
                {userData.email && (
                  <TouchableOpacity onPress={handleCopyEmail} className="ml-2 p-1">
                    <Ionicons name="copy-outline" size={20} color="#0ea5e9" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Old Password Field */}
            <View className="mb-6">
              <Text className="text-[14px] font-medium text-gray-800 mb-2">Old Password</Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl bg-white px-4">
                <TextInput
                  className="flex-1 py-3.5 text-gray-900"
                  placeholder="Enter your password"
                  placeholderTextColor="#cbd5e1"
                  secureTextEntry={!showOldPassword}
                  value={formData.oldPassword}
                  onChangeText={(value) => handleChange('oldPassword', value)}
                  style={{ fontSize: 16 }}
                />
                <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} className="p-2">
                  <Ionicons name={showOldPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password Field */}
            <View className="mb-6">
              <Text className="text-[14px] font-medium text-gray-800 mb-2">New Password</Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl bg-white px-4">
                <TextInput
                  className="flex-1 py-3.5 text-gray-900"
                  placeholder="Enter your password"
                  placeholderTextColor="#cbd5e1"
                  secureTextEntry={!showNewPassword}
                  value={formData.newPassword}
                  onChangeText={(value) => handleChange('newPassword', value)}
                  style={{ fontSize: 16 }}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} className="p-2">
                  <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password Field */}
            <View className="mb-8">
              <Text className="text-[14px] font-medium text-gray-800 mb-2">Confirm New Password</Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl bg-white px-4">
                <TextInput
                  className="flex-1 py-3.5 text-gray-900"
                  placeholder="Enter your password"
                  placeholderTextColor="#cbd5e1"
                  secureTextEntry={!showConfirmPassword}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleChange('confirmPassword', value)}
                  style={{ fontSize: 16 }}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-2">
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="items-center px-6 mt-4">
              <TouchableOpacity 
                onPress={handleSavePress} 
                disabled={isSaving}
                className="w-2/3   bg-[#0ea5e9] rounded-full py-4 items-center justify-center mb-4"
              >
                <Text className="text-white text-[17px] font-semibold">
                  Update Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                disabled={isSaving}
                className="w-full py-2 items-center justify-center"
              >
                <Text className="text-[#0ea5e9] text-[17px] font-medium">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      )}
      <BottomNavigation navigation={navigation} activeTab="Profile" />
      
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
      
      <SaveProfileModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={confirmSave}
        onDiscard={handleDiscard}
        isSaving={isSaving}
      />
    </View>
  );
}
