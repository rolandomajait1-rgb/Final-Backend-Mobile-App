import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName.trim() || !formData.courseYear.trim() || !formData.gender.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.post('/api/contact/join-herald', formData);
      setIsSubmitted(true);
      setFormData({
        fullName: '',
        courseYear: '',
        gender: '',
        photo: null,
        consentForm: null,
      });
      
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (err) {
      console.error('Error submitting membership form:', err);
      setError('Failed to submit form. Please try again.');
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
      <View className="flex-row items-center px-4 py-4" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-3xl font-bold flex-1 text-center" style={{ color: colors.text }}>
          Join The Herald
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        {isSubmitted ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="checkmark-circle" size={100} color="#10b981" />
            <Text className="text-green-600 font-semibold text-center mt-4 text-lg">
              Thank you for your interest!
            </Text>
          </View>
        ) : (
          <>
            {/* Privacy Notice */}
            <Text className="text-gray-600 text-base         b-6 leading-relaxed">
              NOTE: Data Privacy Notice: in compliance with data privacy laws such as, but not limited to, Republic Act No. 10173 (Data Privacy Act of 2012) and implementing rules and regulations, we within the Organization of La Verdad Christian Collegian (LVCC), collect and process your personal information in this membership form for personal information purposes only, keeping them secure and with confidentiality, using our organizational, technical, and physical security measures, and retain them in accordance with our retention policy. We don't share them to any external group without your consent, unless otherwise stated in our privacy notice. You have the right to be informed, to object, to access, to rectify, to erase or to limit the processing of your personal information, as well as your right to data portability. To file a complaint and/or request to damages for violation of your rights under this data privacy.
            </Text>

            {/* Personal Information Section */}
            <Text className="text-gray-800 font-bold text-lg mt-6    mb-4">Personal Information</Text>

            {/* Full Name */}
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">Name (Surname, Given Name, Middle Name)</Text>
              <TextInput
                className="border rounded-lg p-3 text-gray-700"
                style={{ borderColor: colors.border, borderWidth: 1 }}
                placeholder="Enter name here"
                placeholderTextColor={colors.textSecondary}
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                editable={!isLoading}
              />
            </View>

            {/* Course & Year */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Course & Year</Text>
              <TextInput
                className="border rounded-lg p-3 text-gray-700"
                style={{ borderColor: colors.border, borderWidth: 1 }}
                placeholder="Enter course & year"
                placeholderTextColor={colors.textSecondary}
                value={formData.courseYear}
                onChangeText={(value) => handleInputChange('courseYear', value)}
                editable={!isLoading}
              />
            </View>

            {/* Gender */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Gender</Text>
              <View className="flex-row gap-4">
                <TouchableOpacity
                  className="flex-1 border rounded-lg p-3 items-center"
                  style={{
                    borderColor: formData.gender === 'Male' ? colors.primary : colors.border,
                    borderWidth: 1,
                    backgroundColor: formData.gender === 'Male' ? colors.primary + '20' : 'transparent',
                  }}
                  onPress={() => handleInputChange('gender', 'Male')}
                >
                  <Text style={{ color: formData.gender === 'Male' ? colors.primary : colors.text }}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 border rounded-lg p-3 items-center"
                  style={{
                    borderColor: formData.gender === 'Female' ? colors.primary : colors.border,
                    borderWidth: 1,
                    backgroundColor: formData.gender === 'Female' ? colors.primary + '20' : 'transparent',
                  }}
                  onPress={() => handleInputChange('gender', 'Female')}
                >
                  <Text style={{ color: formData.gender === 'Female' ? colors.primary : colors.text }}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 1x1 Photo */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">1x1 Photo</Text>
              <View
                className="border-2 border-dashed rounded-lg p-8 items-center justify-center"
                style={{ borderColor: colors.border, minHeight: 120 }}
              >
                <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                <Text className="text-gray-500 text-sm mt-2">Upload image</Text>
              </View>
            </View>

            {/* Filled Consent Form */}
            <View className="mb-6">
              <View className="flex-row items-center mb-2">
                <Text className="text-gray-700 font-medium flex-1">Filled Consent Form</Text>
                <TouchableOpacity>
                  <Text style={{ color: colors.primary }} className="text-sm font-semibold">
                    Download Form ⬇
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                className="border-2 border-dashed rounded-lg p-8 items-center justify-center"
                style={{ borderColor: colors.border, minHeight: 120 }}
              >
                <Ionicons name="document-outline" size={40} color={colors.textSecondary} />
                <Text className="text-gray-500 text-sm mt-2">Upload file</Text>
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <Text className="text-red-600 text-sm mb-4">{error}</Text>
            )}

            {/* Submit Button */}
            <View className="items-center mb-6">
              <TouchableOpacity
                className="bg-blue-500 rounded-full p-4 w-2/3 flex-row items-center justify-center"
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg text-center">Submit</Text>
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
