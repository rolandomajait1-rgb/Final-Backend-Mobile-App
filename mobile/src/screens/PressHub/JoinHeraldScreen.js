import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import client from '../../api/client';
import { colors } from '../../styles';
import HomeHeader from '../homepage/HomeHeader';
import { ErrorMessage } from '../../components/common';
import BottomNavigation from '../../components/common/BottomNavigation';

const JoinHeraldScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    courseYear: '',
    gender: '',
  });
  const [photo, setPhoto] = useState(null);       // { uri, name, type }
  const [consentForm, setConsentForm] = useState(null); // { name }
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ─── Real Photo Picker ─────────────────────────────────────────────────────
  const handlePhotoUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable photo library access in settings.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setPhoto({
          uri: asset.uri,
          name: asset.fileName ?? `photo-${Date.now()}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick photo. Please try again.');
    }
  };

  // ─── Real Document Picker ──────────────────────────────────────────────────
  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setConsentForm({ name: result.assets[0].name });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.fullName.trim() || !formData.courseYear.trim() || !formData.gender.trim()) {
      setError('Please fill in all required fields (Name, Course & Year, Gender).');
      return;
    }
    if (!photo) {
      setError('Please upload your 1x1 photo.');
      return;
    }
    if (!consentForm) {
      setError('Please upload your filled consent form.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await client.post('/contact/join-herald', {
        fullName:   formData.fullName.trim(),
        courseYear: formData.courseYear.trim(),
        gender:     formData.gender,
      });
      setIsSubmitted(true);
      setTimeout(() => navigation.goBack(), 2500);
    } catch (err) {
      console.error('Error joining Herald:', err);
      const msg = err.response?.data?.message || 'Failed to submit application. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <HomeHeader
        categories={[]}
        selectedCategory={null}
        onCategorySelect={() => {}}
        error={null}
        ErrorMessage={ErrorMessage}
        showCategories={false}
        navigation={navigation}
      />

      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="flex-1 text-center" style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
          Join The Herald
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 120 }}>
        {isSubmitted ? (
          <View className="flex-1 items-center justify-center py-16">
            <Ionicons name="checkmark-circle" size={100} color="#10b981" />
            <Text className="text-green-600 font-semibold text-center mt-4 text-lg">
              Thank you for your interest!{'\n'}We'll be in touch soon.
            </Text>
          </View>
        ) : (
          <>
            {/* Data Privacy Notice */}
            <View className="mb-6 p-3 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
                Data Privacy Notice
              </Text>
              <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 20 }}>
                In compliance with Republic Act No. 10173 (Data Privacy Act of 2012), we collect and
                process your personal information for membership purposes only, keeping it secure and
                confidential.
              </Text>
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 6 }}>
                For inquiries, contact our DPO: dpo@laverdad.edu.ph
              </Text>
            </View>

            {/* Personal Information */}
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
              Personal Information
            </Text>

            {/* Full Name */}
            <View className="mb-5">
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937', marginBottom: 8 }}>
                Name (Surname, Given Name, Middle Name) *
              </Text>
              <TextInput
                style={{
                  borderColor: colors.border, borderWidth: 1, borderRadius: 8,
                  paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: colors.text,
                }}
                placeholder="Enter name here"
                placeholderTextColor={colors.textSecondary}
                value={formData.fullName}
                onChangeText={(v) => handleChange('fullName', v)}
                editable={!isLoading}
              />
            </View>

            {/* Course & Year */}
            <View className="mb-5">
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937', marginBottom: 8 }}>
                Course & Year *
              </Text>
              <TextInput
                style={{
                  borderColor: colors.border, borderWidth: 1, borderRadius: 8,
                  paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: colors.text,
                }}
                placeholder="e.g. BSCS 2-A"
                placeholderTextColor={colors.textSecondary}
                value={formData.courseYear}
                onChangeText={(v) => handleChange('courseYear', v)}
                editable={!isLoading}
              />
            </View>

            {/* Gender */}
            <View className="mb-5">
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937', marginBottom: 8 }}>
                Gender *
              </Text>
              <View className="flex-row gap-6">
                {['male', 'female'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    className="flex-row items-center"
                    onPress={() => handleChange('gender', g)}
                    disabled={isLoading}
                  >
                    <View
                      style={{
                        width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                        borderColor: formData.gender === g ? '#0ea5e9' : colors.border,
                        marginRight: 8, backgroundColor: formData.gender === g ? '#0ea5e9' : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {formData.gender === g && (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }} />
                      )}
                    </View>
                    <Text style={{ fontSize: 14, color: colors.text, textTransform: 'capitalize' }}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 1x1 Photo */}
            <View className="mb-5">
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937', marginBottom: 8 }}>
                1×1 Photo *
              </Text>
              <TouchableOpacity
                style={{
                  borderColor: photo ? '#10b981' : colors.border,
                  borderWidth: 1, borderRadius: 8,
                  paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: photo ? '#f0fdf4' : '#f9fafb',
                  flexDirection: 'row', gap: 10,
                }}
                onPress={handlePhotoUpload}
                disabled={isLoading}
              >
                {photo ? (
                  <>
                    <Image source={{ uri: photo.uri }} style={{ width: 48, height: 48, borderRadius: 8 }} />
                    <Text style={{ fontSize: 13, color: '#10b981', fontWeight: '500' }}>
                      Photo selected ✓{'\n'}
                      <Text style={{ fontWeight: '400' }}>{photo.name}</Text>
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>Tap to upload 1×1 photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Consent Form */}
            <View className="mb-5">
              <View className="flex-row items-center mb-3">
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937', flex: 1 }}>
                  Filled Consent Form *
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://example.com/consent-form')}
                  className="flex-row items-center"
                >
                  <Text style={{ fontSize: 13, color: '#0ea5e9', fontWeight: '500', marginRight: 4 }}>
                    Download
                  </Text>
                  <Ionicons name="download" size={16} color="#0ea5e9" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={{
                  borderColor: consentForm ? '#10b981' : colors.border,
                  borderWidth: 1, borderRadius: 8,
                  paddingVertical: 24, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: consentForm ? '#f0fdf4' : '#f9fafb',
                  flexDirection: 'row', gap: 10,
                }}
                onPress={handleFileUpload}
                disabled={isLoading}
              >
                <Ionicons
                  name={consentForm ? 'checkmark-circle' : 'document-outline'}
                  size={32}
                  color={consentForm ? '#10b981' : colors.textSecondary}
                />
                <Text style={{ fontSize: 13, color: consentForm ? '#10b981' : colors.textSecondary, fontWeight: consentForm ? '500' : '400' }}>
                  {consentForm ? `${consentForm.name}` : 'Tap to upload consent form (PDF/image)'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error */}
            {error && (
              <Text style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</Text>
            )}

            {/* Submit */}
            <View className="items-center mt-4 mb-4">
              <TouchableOpacity
                style={{
                  backgroundColor: '#0ea5e9', borderRadius: 24,
                  paddingVertical: 14, paddingHorizontal: 56,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  opacity: isLoading ? 0.7 : 1,
                }}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
      <BottomNavigation navigation={navigation} activeTab="PressHub" />
    </SafeAreaView>
  );
};

export default JoinHeraldScreen;
