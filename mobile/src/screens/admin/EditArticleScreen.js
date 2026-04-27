import { useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { showAuditToast } from '../../utils/toastNotification';
import { ALLOWED_CATEGORIES } from '../../constants/categories';
import { isAuthenticated } from '../../utils/authUtils';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import SaveDraftModal from '../../components/common/SaveDraftModal';
import RichTextEditor from '../../components/editor/RichEditor';
import client from '../../api/client';
import { getCategories } from '../../api/services/categoryService';
import { ArticleContext } from '../../context/ArticleContext';
import { uploadImageToCloudinary } from '../../api/services/cloudinaryService';
import { getImageUri } from '../../utils/imageUtils';

import { BASE_URL } from '../../constants/config';

const MAX_TAGS = 10;
const MAX_TITLE_LENGTH = 200;

export default function EditArticleScreen({ navigation, route }) {
  const { articleId } = route.params ?? {};
  const { forceRefreshArticles } = useContext(ArticleContext);

  // ─── Form State ────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [author, setAuthor] = useState('');
  const [isNewImage, setIsNewImage] = useState(false);

  // ─── UI State ──────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false); // Track publish button specifically
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [articleLoading, setArticleLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isOnline, setIsOnline] = useState(null);

  useEffect(() => {
    loadUserRole();
    loadCategories();
    loadArticle();
    checkConnection();
  }, [loadCategories, loadArticle, checkConnection]);

  // ─── Load User Role ────────────────────────────────────────────
  const loadUserRole = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user_data');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserRole(user.role);
      }
    } catch (error) {
      console.error('Failed to load user role:', error);
    }
  };

  // ─── Load Article Data ─────────────────────────────────────────_
  const loadArticle = useCallback(async () => {
    setArticleLoading(true);
    try {
      const res = await client.get(`/api/articles/${articleId}`);
      const article = res.data.data || res.data;
      
      setTitle(article.title || '');
      
      // Handle category - it might be in categories array or category_id
      if (article.categories && Array.isArray(article.categories) && article.categories.length > 0) {
        setCategory(article.categories[0].id);
      } else if (article.category_id) {
        setCategory(article.category_id);
      } else if (article.category?.id) {
        setCategory(article.category.id);
      }
      
      setContent(article.content || '');
      setAuthor(article.author_name || article.author?.name || article.author?.user?.name || '');
      
      // Load tags
      if (article.tags && Array.isArray(article.tags)) {
        setTags(article.tags.map(t => typeof t === 'string' ? t : t.name));
      }
      
      // Load existing image
      if (article.featured_image_url || article.featured_image) {
        setImage({ uri: article.featured_image_url || article.featured_image });
        setIsNewImage(false);
      }
    } catch (error) {
      console.error('Failed to load article:', error);
      Alert.alert('Error', 'Failed to load article data.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setArticleLoading(false);
    }
  }, [articleId, navigation]);

  // ─── Load Categories ───────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await getCategories();
      const filteredCategories = (res.data ?? []).filter(cat => ALLOWED_CATEGORIES.includes(cat.name));
      setCategories(filteredCategories);
    } catch {
      // silently fail
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // ─── Backend Connection Check ──────────────────────────────────
  const checkConnection = useCallback(async () => {
    try {
      await client.get('/api/categories');
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  // ─── Image Picker ──────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please enable media library access in settings.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
        exif: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        // Check file size before processing (10MB limit)
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        const fileSizeMB = fileInfo.size / (1024 * 1024);
        
        if (fileSizeMB > 10) {
          Alert.alert('File Too Large', `This image is ${fileSizeMB.toFixed(1)}MB. Please choose a picture smaller than 10MB.`);
          return;
        }

        const compressed = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1280 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        setImage({
          uri: compressed.uri,
          type: 'image/jpeg',
          name: `article-${Date.now()}.jpg`,
        });
        setIsNewImage(true);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // ─── Tags ──────────────────────────────────────────────────────
  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.length >= MAX_TAGS) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_TAGS} tags.`);
      return;
    }
    if (tags.includes(trimmed)) {
      Alert.alert('Duplicate Tag', 'This tag already exists.');
      return;
    }
    setTags([...tags, trimmed]);
    setTagInput('');
  };

  const removeTag = (index) => setTags(tags.filter((_, i) => i !== index));

  // ─── Validation ────────────────────────────────────────────────
  const validateForm = () => {
    if (!title.trim())   { Alert.alert('Error', 'Please enter a title.');    return false; }
    if (!category)       { Alert.alert('Error', 'Please select a category.'); return false; }
    if (!author.trim())  { Alert.alert('Error', 'Please enter the author.');  return false; }
    if (!content.trim()) { Alert.alert('Error', 'Please enter the content.'); return false; }
    return true;
  };

  const handleNext = () => {
    if (validateForm()) setShowModal(true);
  };

  // ─── Update Article ────────────────────────────────────────────
  const updateArticle = async (status, retryCount = 0) => {
    // Set loading states immediately
    setLoading(true);
    if (status === 'published') {
      setIsPublishing(true);
    }
    
    try {
      // Issue #6 Fix: Use centralized auth check instead of manual token fetch
      const hasAuth = await isAuthenticated();
      if (!hasAuth) {
        Alert.alert('Not Logged In', 'Please log in to edit articles.');
        navigation.navigate('Login');
        return;
      }

      // Ping backend
      try {
        await fetch(`${BASE_URL}/api/categories`);
      } catch {
        // Ignore
      }

      // Upload new image to Cloudinary if changed
      let cloudinaryUrl = null;
      if (isNewImage && image?.uri) {
        try {
          console.log('Uploading new image to Cloudinary...');
          cloudinaryUrl = await uploadImageToCloudinary(image.uri);
          console.log('Image uploaded successfully:', cloudinaryUrl);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          const shouldContinue = await new Promise((resolve) => {
            Alert.alert(
              'Image Upload Failed',
              `Error: ${uploadError.message}. Continue without updating image?`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Continue', onPress: () => resolve(true) }
              ]
            );
          });
          if (!shouldContinue) {
            setLoading(false);
            setIsPublishing(false);
            return;
          }
        }
      }

      // Prepare payload to match backend expectations
      const categoryName = categories.find(c => c.id === category)?.name;
      
      if (!categoryName) {
        Alert.alert('Error', 'Please select a valid category');
        setLoading(false);
        setIsPublishing(false);
        return;
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        category_id: category,
        author_name: author.trim(),
        status: status,
        tags: tags.map(t => t.trim().replace(/^#/, '')).filter(Boolean),
        _method: 'PUT',
      };

      // Handle image: either the newly uploaded Cloudinary URL or the existing image URI
      const finalImageUrl = cloudinaryUrl || (image?.uri && !isNewImage ? image.uri : null);
      if (finalImageUrl) {
        payload.featured_image_url = finalImageUrl;
        console.log('Sending featured_image_url:', finalImageUrl);
      }

      console.log('Updating article with payload:', JSON.stringify({
        ...payload,
        content: `${payload.content.substring(0, 100)}... [${payload.content.length} chars]`
      }, null, 2));

      const res = await client.post(`/api/articles/${articleId}`, payload);
      console.log('Update response:', res.data);

      // Refresh context so HomeScreen shows updated data on focus
      try { 
        await forceRefreshArticles(); 
        console.log('Articles refreshed after edit');
      } catch (err) { 
        console.error('Failed to refresh articles:', err);
      }

      setShowModal(false);

      // Navigate first, then show toast after navigation completes
      navigation.navigate('MainApp', { screen: 'Home' });
      
      // Show toast after a short delay to ensure navigation completes
      setTimeout(() => {
        showAuditToast(
          'success',
          status === 'published' ? 'Article published successfully' : 'Article saved as draft successfully'
        );
      }, 300);

    } catch (error) {
      const msg = error.message || '';

      const isNetworkError =
        msg === 'NETWORK_ERROR' ||
        msg === 'TIMEOUT' ||
        msg.includes('Network request failed') ||
        msg.includes('Could not connect') ||
        msg.includes('timeout') ||
        msg.includes('ERR_NETWORK') ||
        msg.includes('ECONNREFUSED');

      if (isNetworkError && retryCount < 2) {
        Alert.alert(
          'Server Waking Up',
          `The backend is starting from sleep.\nRetrying in 15 s… (${retryCount + 1}/3)`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => { setLoading(false); setIsPublishing(false); } },
            { text: 'Retry Now', onPress: () => updateArticle(status, retryCount + 1) },
          ]
        );
        setTimeout(() => updateArticle(status, retryCount + 1), 15000);
        return;
      }

      const isCloudinaryError = error.data?.error === 'cloudinary_upload_failed';

      const friendlyMessage =
        error.status === 401 ? 'Session expired. Please log in again.' :
        error.status === 403 ? 'You do not have permission to edit this article.' :
        isCloudinaryError ? 'Image upload to cloud storage failed. Try again or update without the image.' :
        error.status === 422 ? (error.data?.message || 'Validation failed. Check your input.') :
        error.status === 500 ? 'Server error. Please try again later.' :
        isNetworkError ? 'Cannot reach the server. Check your internet or wait for the server to wake up.' :
        `Update Failed: Status ${error.status || 'N/A'} - ${error.data ? JSON.stringify(error.data) : msg}`;

      if (error.status === 401) setTimeout(() => navigation.navigate('Login'), 1500);

      console.error("UPDATE ERROR:", error.status, error.message, error.data);

      Alert.alert('Error', friendlyMessage);
    } finally {
      setLoading(false);
      setIsPublishing(false);
    }
  };

  const handlePublish = () => updateArticle('published');
  const handleSave = () => updateArticle('draft');
  const handleDiscard = () => { 
    setShowModal(false); 
    navigation.goBack(); 
  };

  // ─── Render ────────────────────────────────────────────────────
  if (articleLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading article...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" hidden={false} />

      {/* Top Navigation Header */}
      <HomeHeader
        categories={categories}
        onCategorySelect={() => {}}
        onMenuPress={() => {}}
        onSearchPress={() => {}}
        onGridPress={() => navigation.navigate('MainApp')}
        onSearch={() => {}}
        navigation={navigation}
      />

      {/* Screen Title Bar */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-gray-900">Edit Article</Text>
          
        </View>

        <TouchableOpacity onPress={handleNext}>
          <Text className="text-xl font-bold text-yellow-500 mr-2">Next</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Form */}
      <KeyboardAwareScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false} enableOnAndroid={true} extraScrollHeight={20} keyboardShouldPersistTaps="handled">

        {/* Title */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-800 mb-2">Title</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50"
            placeholder="Enter article title"
            value={title}
            onChangeText={(text) => text.length <= MAX_TITLE_LENGTH && setTitle(text)}
            placeholderTextColor="#999"
            maxLength={MAX_TITLE_LENGTH}
          />
        </View>

        {/* Cover Image */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-800 mb-2">Cover Image</Text>
          <TouchableOpacity
            onPress={pickImage}
            className="border border-gray-300 rounded-2xl items-center justify-center bg-gray-50 overflow-hidden"
            style={{ height: 180 }}
          >
            {image ? (
              <View className="relative w-full h-full">
                <Image source={{ uri: getImageUri(image.uri) }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => setImage(null)}
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                  style={{ elevation: 5 }}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center py-8">
                <View className="border-2 border-dashed border-gray-400 rounded-xl p-4 mb-2">
                  <MaterialCommunityIcons name="image-plus" size={32} color="#999" />
                </View>
                <Text className="text-gray-500 text-sm">Tap to add cover image</Text>
                <Text className="text-gray-400 text-xs mt-1">Recommended: 16:9 ratio</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Category */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-800 mb-2">Category</Text>
          {categoriesLoading ? (
            <View className="border border-gray-300 rounded-lg px-4 py-3">
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex-row items-center justify-between border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
              >
                <Text className={`text-sm ${category ? 'text-gray-800' : 'text-gray-500'}`}>
                  {category ? categories.find((c) => c.id === category)?.name : 'Select Category'}
                </Text>
                <MaterialCommunityIcons
                  name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>

              {showCategoryDropdown && (
                <View className="border border-gray-300 rounded-lg mt-2 bg-white overflow-hidden">
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => { setCategory(cat.id); setShowCategoryDropdown(false); }}
                        className={`px-4 py-3 border-b border-gray-100 ${category === cat.id ? 'bg-blue-50' : 'bg-white'}`}
                      >
                        <Text className={`text-sm ${category === cat.id ? 'text-blue-600 font-semibold' : 'text-gray-800'}`}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>

        {/* Tags */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-800 mb-2">Tags</Text>
          <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
            <Text className="text-gray-500 text-sm mr-2">#</Text>
            <TextInput
              className="flex-1 text-sm text-gray-800"
              placeholder="Add a hashtag"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              placeholderTextColor="#999"
              editable={tags.length < MAX_TAGS}
            />
            <TouchableOpacity onPress={addTag} disabled={tags.length >= MAX_TAGS}>
              <MaterialCommunityIcons name="plus" size={24} color={tags.length >= MAX_TAGS ? '#ccc' : '#999'} />
            </TouchableOpacity>
          </View>

          {tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-3">
              {tags.map((tag, index) => (
                <View key={index} className="flex-row items-center bg-blue-100 rounded-full px-3 py-1 border border-blue-300">
                  <Text className="text-xs text-blue-700">#{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(index)} className="ml-1">
                    <MaterialCommunityIcons name="close" size={12} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Author */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-800 mb-2">Author</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50"
            placeholder="Enter author name"
            value={author}
            onChangeText={setAuthor}
            placeholderTextColor="#999"
          />
        </View>

        {/* Content */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-800 mb-2">Content</Text>
          <RichTextEditor value={content} onChange={setContent} height={300} />
        </View>

        <View className="h-6" />
      </KeyboardAwareScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavigation navigation={navigation} activeTab="Home" />

      <SaveDraftModal
        isOpen={showModal}
        onClose={() => !loading && setShowModal(false)}
        onPublish={userRole === 'admin' ? handlePublish : null}
        onSave={handleSave}
        onDiscard={handleDiscard}
        isSaving={loading && !isPublishing} // Save button loading
        isPublishing={isPublishing} // Publish button loading
        title="Save Edit"
        saveText="Save as Draft"
        description={userRole === 'moderator' 
          ? "As a moderator, you can save changes as draft. Only admins can publish."
          : "Save your changes and come back to finish your article later."
        }
      />

    </View>
  );
}
