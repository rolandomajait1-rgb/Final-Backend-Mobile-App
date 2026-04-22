import { useState, useEffect, useContext } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { showAuditToast } from '../../utils/toastNotification';
import { ALLOWED_CATEGORIES } from '../../constants/categories';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { isAuthenticated } from '../../utils/authUtils';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import SaveDraftModal from '../../components/common/SaveDraftModal';
import ImageUploadProgress from '../../components/common/ImageUploadProgress';
import RichTextEditor from '../../components/editor/RichEditor';
import client from '../../api/client';
import { getCategories } from '../../api/services/categoryService';
import { ArticleContext } from '../../context/ArticleContext';
import { uploadImageToCloudinary } from '../../api/services/cloudinaryService';
import { getImageUri } from '../../utils/imageUtils';

import { BASE_URL } from '../../constants/config';

const MAX_TAGS = 10;
const MAX_TITLE_LENGTH = 200;

export default function CreateArticleScreen({ navigation }) {
  const { refreshArticles } = useContext(ArticleContext);

  // ─── Form State ────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [author, setAuthor] = useState('');

  // ─── UI State ──────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  // ─── Load Categories ───────────────────────────────────────────
  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await getCategories();
      // Filter to only show allowed categories
      const filteredCategories = (res.data ?? []).filter(cat => ALLOWED_CATEGORIES.includes(cat.name));
      setCategories(filteredCategories);
    } catch {
      // silently fail — user will see empty dropdown
    } finally {
      setCategoriesLoading(false);
    }
  };


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
        // Compress to max 1280px wide, 70% quality JPEG
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

  // ─── Submit Article ────────────────────────────────────────────
  const submitArticle = async (status, retryCount = 0) => {
    setLoading(true);
    try {
      // Issue #6 Fix: Use centralized auth check instead of manual token fetch
      const hasAuth = await isAuthenticated();
      if (!hasAuth) {
        Alert.alert('Not Logged In', 'Please log in to create articles.');
        navigation.navigate('Login');
        return;
      }

      // Ping the backend first — Render free tier sleeps after 15 min inactivity.
      // A cold start takes 30–60 s and will drop the upload connection otherwise.
      try {
        await fetch(`${BASE_URL}/api/categories`);
      } catch {
        // Ignore ping errors — proceed anyway
      }

      // Upload image to Cloudinary first if exists
      let cloudinaryUrl = null;
      if (image?.uri) {
        try {
          console.log('Uploading image to Cloudinary...');
          setUploading(true);
          setUploadProgress(0);
          cloudinaryUrl = await uploadImageToCloudinary(image.uri, (percent) => {
            setUploadProgress(percent);
          });
          console.log('Image uploaded successfully:', cloudinaryUrl);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          const shouldContinue = await new Promise((resolve) => {
            Alert.alert(
              'Image Upload Failed',
              'Failed to upload image. Continue without image?',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Continue', onPress: () => resolve(true) }
              ]
            );
          });
          if (!shouldContinue) {
            setLoading(false);
            setUploading(false);
            setUploadProgress(0);
            return;
          }
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      }

      // Send article data to backend
      const payload = {
        title: title.trim(),
        content: content.trim(),
        category_id: category,
        author_name: author.trim(),
        status: status,
        tags: tags.map(t => t.trim().replace(/^#/, '')).filter(Boolean),
      };

      // Add Cloudinary URL if image was uploaded
      if (cloudinaryUrl) {
        payload.featured_image_url = cloudinaryUrl;
        console.log('Sending featured_image_url to backend:', cloudinaryUrl);
      }

      // Log content length for debugging
      console.log('Content length being sent:', content.trim().length);
      console.log('Payload being sent (content truncated for log):', JSON.stringify({
        ...payload,
        content: `${payload.content.substring(0, 100)}... [${payload.content.length} chars total]`
      }, null, 2));
      const res = await client.post('/api/articles', payload);
      const responseData = res.data;
      console.log('Backend response:', JSON.stringify(responseData, null, 2));

      // ── Success ──
      setShowModal(false);
      setTitle(''); setCategory(null); setTags([]);
      setContent(''); setImage(null); setAuthor('');

      try { await refreshArticles(); } catch { /* non-critical */ }

      showAuditToast(
        'success',
        status === 'published' ? 'Article published successfully' : 'Article saved as draft successfully'
      );
      navigation.navigate('Admin');

    } catch (error) {
      const msg = error.message || '';

      // Detect network failures from BOTH Axios and FileSystem.uploadAsync
      const isNetworkError =
        msg === 'NETWORK_ERROR' ||
        msg === 'TIMEOUT' ||
        msg.includes('Network request failed') ||
        msg.includes('Could not connect') ||
        msg.includes('timeout') ||
        msg.includes('ERR_NETWORK') ||
        msg.includes('ECONNREFUSED');

      // Network failure — auto-retry up to 3 times (handles Render cold starts)
      if (isNetworkError && retryCount < 2) {
        Alert.alert(
          'Server Waking Up',
          `The backend is starting from sleep.\nRetrying in 15 s… (${retryCount + 1}/3)`,
          [
            { text: 'Cancel',    style: 'cancel', onPress: () => setLoading(false) },
            { text: 'Retry Now', onPress: () => submitArticle(status, retryCount + 1) },
          ]
        );
        setTimeout(() => submitArticle(status, retryCount + 1), 15000);
        return;
      }

      // Handle specific Cloudinary upload failure from backend
      const isCloudinaryError = error.data?.error === 'cloudinary_upload_failed';

      const friendlyMessage =
        error.status === 401 ? 'Session expired. Please log in again.' :
        error.status === 403 ? 'You do not have permission to create articles.' :
        isCloudinaryError ? 'Image upload to cloud storage failed. Try again or publish without the image.' :
        error.status === 422 ? (error.data?.message || 'Validation failed. Check your input.') :
        error.status === 500 ? 'Server error. Please try again later.' :
        isNetworkError ? 'Cannot reach the server. Check your internet or wait for the server to wake up.' :
        `Upload Failed: Status ${error.status || 'N/A'} - ${error.data ? JSON.stringify(error.data) : msg}`;

      if (error.status === 401) setTimeout(() => navigation.navigate('Login'), 1500);

      console.error("UPLOAD ERROR:", error.status, error.message, error.data);

      Alert.alert('Error', friendlyMessage, [
        { text: 'OK' },
        {
          text: 'Retry without image',
          onPress: () => { setImage(null); setShowModal(true); },
          style: 'cancel',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = () => submitArticle('published');
  const handleSave    = () => submitArticle('draft');
  const handleDiscard = () => { 
    setShowModal(false); 
    showAuditToast('success', 'Draft discarded successfully');
    navigation.goBack(); 
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-white">
      <StatusBar hidden={true} />

      {/* Top Navigation Header */}
      <HomeHeader
        categories={categories}
        onCategorySelect={() => {}}
        onMenuPress={() => {}}
        onSearchPress={() => {}}
        onGridPress={() => navigation.navigate('Main')}
        onSearch={() => {}}
        navigation={navigation}
      />

      {/* Screen Title Bar */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <View className="flex-1 items-center">
          <Text className="text-xl font-bold text-gray-900">Create </Text>
         <Text className="text-xl font-bold text-gray-900"> New Article</Text>
         
        </View>

        <TouchableOpacity onPress={handleNext}>
          <Text className="text-xl font-bold text-yellow-500 mr-2">Next</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Form */}
      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>

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
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavigation navigation={navigation} activeTab="Home" />

      <SaveDraftModal
        isOpen={showModal}
        onClose={() => !loading && setShowModal(false)}
        onPublish={handlePublish}
        onSave={handleSave}
        onDiscard={handleDiscard}
        isSaving={loading}
        title="Save Article"
      />

      <ImageUploadProgress visible={uploading} progress={uploadProgress} />

    </View>
  );
}
