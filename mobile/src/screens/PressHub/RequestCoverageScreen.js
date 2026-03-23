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

const RequestCoverageScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    eventName: '',
    purpose: '',
    location: '',
    dateTime: '',
    highlights: '',
    requesterName: '',
    designation: '',
    coordinator: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.eventName.trim() || !formData.purpose.trim() || !formData.location.trim() || !formData.dateTime.trim() || !formData.highlights.trim() || !formData.requesterName.trim() || !formData.designation.trim() || !formData.coordinator.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axios.post('/api/contact/coverage-request', formData);
      setIsSubmitted(true);
      setFormData({
        eventName: '',
        purpose: '',
        location: '',
        dateTime: '',
        highlights: '',
        requesterName: '',
        designation: '',
        coordinator: '',
      });
      
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (err) {
      console.error('Error sending coverage request:', err);
      setError('Failed to send request. Please try again.');
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
          Request Coverage
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        {isSubmitted ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="checkmark-circle" size={100} color="#10b981" />
            <Text className="text-green-600 font-semibold text-center mt-4 text-lg">
              Thank you for your request!
            </Text>
          </View>
        ) : (
          <>
            {/* Note */}
            <Text className="text-gray-600 text-sm mb-6 font-medium">
              NOTE: Kindly complete and submit this form at least two weeks prior to the event.
            </Text>

            {/* Event Name */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Name of the Event</Text>
              <TextInput
                className="border rounded-lg p-3 text-gray-700"
                style={{ borderColor: colors.border, borderWidth: 1 }}
                placeholder="Enter event name..."
                placeholderTextColor={colors.textSecondary}
                value={formData.eventName}
                onChangeText={(value) => handleInputChange('eventName', value)}
                editable={!isLoading}
              />
            </View>

            {/* Purpose */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Purpose / Significance</Text>
              <TextInput
                className="border rounded-lg p-3 text-gray-700"
                style={{ borderColor: colors.border, borderWidth: 1, minHeight: 80, textAlignVertical: 'top' }}
                placeholder="Enter purpose/significance here..."
                placeholderTextColor={colors.textSecondary}
                value={formData.purpose}
                onChangeText={(value) => handleInputChange('purpose', value)}
                multiline
                editable={!isLoading}
              />
            </View>

            {/* Location */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Location</Text>
              <TextInput
                className="border rounded-lg p-3 text-gray-700"
                style={{ borderColor: colors.border, borderWidth: 1 }}
                placeholder="Enter event location..."
                placeholderTextColor={colors.textSecondary}
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                editable={!isLoading}
              />
            </View>

            {/* Date and Time */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Date and Time *</Text>
              <TextInput
                className="border rounded-lg p-3 text-gray-700"
                style={{ borderColor: colors.border, borderWidth: 1 }}
                placeholder="Enter date and time"
                placeholderTextColor={colors.textSecondary}
                value={formData.dateTime}
                onChangeText={(value) => handleInputChange('dateTime', value)}
                editable={!isLoading}
              />
            </View>

            {/* Event Highlights */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Event Highlights</Text>
              <TextInput
                className="border rounded-lg p-3 text-gray-700"
                style={{ borderColor: colors.border, borderWidth: 1, minHeight: 80, textAlignVertical: 'top' }}
                placeholder="Enter the main highlights of the event..."
                placeholderTextColor={colors.textSecondary}
                value={formData.highlights}
                onChangeText={(value) => handleInputChange('highlights', value)}
                multiline
                editable={!isLoading}
              />
            </View>

            {/* Full Name of Requestor */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Full Name of Requestor</Text>
              <TextInput
                className="border rounded-lg p-3 text-gray-700"
                style={{ borderColor: colors.border, borderWidth: 1 }}
                placeholder="Enter your name here"
                placeholderTextColor={colors.textSecondary}
                value={formData.requesterName}
                onChangeText={(value) => handleInputChange('requesterName', value)}
                editable={!isLoading}
              />
            </View>

            {/* Designation */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Designation</Text>
              <TextInput
                className="border rounded-lg p-3 text-gray-700"
                style={{ borderColor: colors.border, borderWidth: 1 }}
                placeholder="Enter your designation here"
                placeholderTextColor={colors.textSecondary}
                value={formData.designation}
                onChangeText={(value) => handleInputChange('designation', value)}
                editable={!isLoading}
              />
            </View>

            {/* Organizer / Office Coordinator */}
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">Organizer / Office Coordinator</Text>
              <TextInput
                className="border rounded-lg p-3 text-gray-700"
                style={{ borderColor: colors.border, borderWidth: 1 }}
                placeholder="Enter Organizer's / Office Coordinator's name here..."
                placeholderTextColor={colors.textSecondary}
                value={formData.coordinator}
                onChangeText={(value) => handleInputChange('coordinator', value)}
                editable={!isLoading}
              />
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

export default RequestCoverageScreen;
