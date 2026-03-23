import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from '../../utils/axiosConfig';
import { colors } from '../../styles';
import HomeHeader from '../../components/home/HomeHeader';
import { ErrorMessage } from '../../components/common';

const JoinHeraldScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    courseYear: '',
    gender: '',
    photo: null,
    consentForm: null,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = () => {
    // Placeholder for photo upload logic
    setFormData(prev => ({ ...prev, photo: 'photo_selected' }));
  };

  const handleFileUpload = () => {
    // Placeholder for file upload logic
    setFormData(prev => ({ ...prev, consentForm: 'file_selected' }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName.trim() || !formData.courseYear.trim() || !formData.gender.trim() || !formData.photo || !formData.consentForm) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await axios.post('/contact/join-herald', formData);
      setIsSubmitted(true);
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (err) {
      console.error('Error joining Herald:', err);
      setError('Failed to submit application. Please try again.');
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
      />
      {/* Custom Header with Title and Back Arrow */}
      <View className="flex-row items-center px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="flex-1 text-center" style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
          Join The Herald
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 40 }}>
        {isSubmitted ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="checkmark-circle" size={100} color="#10b981" />
            <Text className="text-green-600 font-semibold text-center mt-4 text-lg">
              Thank you for your interest!
            </Text>
          </View>
        ) : (
          <>
            {/* NOTE Section */}
            <View className="mb-6 p-3 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
                NOTE :
              </Text>
              <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 18 }}>
                Data Privacy Notice: In compliance with data privacy laws such as, but not limited to, Republic Act No. 10173 [Data Privacy Act of 2012] and the implementing rules and regulations, we within the Organization of La Verdad Christian College (LVCC), collect and process your personal information in this membership form for personal information purposes only, keeping it secure and with confidentiality using our organizational, technical, and physical security measures and retain them in accordance with our retention policy. We don't share them to any external group without your consent, unless otherwise stated in our privacy notice. You have the right to be informed, to object, to access, to rectify, to erase or to block the processing of data portability, to file a complaint and be entitled to damages for violation of your rights under this data privacy.
              </Text>
              <Text style={{ fontSize: 14, color: '#4b5563', marginTop: 8 }}>
                For your data privacy inquiries, you may reach our Data Protection Officer through: dpo@laverdad.edu.ph
              </Text>
            </View>

            {/* Personal Information Section */}
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
              Personal Information
            </Text>

            {/* Full Name */}
            <View className="mb-5">
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937', marginBottom: 8 }}>
                Name (Surname, Given Name, Middle Name)
              </Text>
              <TextInput
                style={{
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: colors.text,
                }}
                placeholder="Enter name here."
                placeholderTextColor={colors.textSecondary}
                value={formData.fullName}
                onChangeText={(value) => handleChange('fullName', value)}
                editable={!isLoading}
              />
            </View>

            {/* Course & Year */}
            <View className="mb-5">
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937', marginBottom: 8 }}>
                Course & Year
              </Text>
              <TextInput
                style={{
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: colors.text,
                }}
                placeholder="Enter course & year level"
                placeholderTextColor={colors.textSecondary}
                value={formData.courseYear}
                onChangeText={(value) => handleChange('courseYear', value)}
                editable={!isLoading}
              />
            </View>

            {/* Gender */}
            <View className="mb-5">
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937', marginBottom: 8 }}>
                Gender
              </Text>
              <View className="flex-row gap-6">
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => handleChange('gender', 'male')}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: colors.border,
                      marginRight: 8,
                      backgroundColor: formData.gender === 'male' ? '#0ea5e9' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {formData.gender === 'male' && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }} />
                    )}
                  </View>
                  <Text style={{ fontSize: 14, color: colors.text }}>Male</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => handleChange('gender', 'female')}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: colors.border,
                      marginRight: 8,
                      backgroundColor: formData.gender === 'female' ? '#0ea5e9' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {formData.gender === 'female' && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }} />
                    )}
                  </View>
                  <Text style={{ fontSize: 14, color: colors.text }}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 1x1 Photo */}
            <View className="mb-5">
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937', marginBottom: 8 }}>
                1x1 Photo
              </Text>
              <TouchableOpacity
                style={{
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingVertical: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f9fafb',
                }}
                onPress={handlePhotoUpload}
                disabled={isLoading}
              >
                <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>
                  {formData.photo ? 'Photo selected' : 'upload image'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filled Consent Form */}
            <View className="mb-5">
              <View className="flex-row items-center mb-3">
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937', flex: 1 }}>
                  Filled Consent Form
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://example.com/consent-form')}
                  className="flex-row items-center"
                >
                  <Text style={{ fontSize: 13, color: '#0ea5e9', fontWeight: '500', marginRight: 4 }}>
                    Download Consent Form
                  </Text>
                  <Ionicons name="download" size={16} color="#0ea5e9" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={{
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingVertical: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f9fafb',
                }}
                onPress={handleFileUpload}
                disabled={isLoading}
              >
                <Ionicons name="document-outline" size={40} color={colors.textSecondary} />
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>
                  {formData.consentForm ? 'File selected' : 'upload file'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error && (
              <Text style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                {error}
              </Text>
            )}

            {/* Submit Button */}
            <View className="items-center mt-6 mb-4">
              <TouchableOpacity
                style={{
                  backgroundColor: '#0ea5e9',
                  borderRadius: 24,
                  paddingVertical: 12,
                  paddingHorizontal: 48,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isLoading ? 0.7 : 1,
                }}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default JoinHeraldScreen;
