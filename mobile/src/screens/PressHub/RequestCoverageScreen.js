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
import client from '../../api/client';
import { colors } from '../../styles';
import HomeHeader from '../homepage/HomeHeader';
import { ErrorMessage } from '../../components/common';
import BottomNavigation from '../../components/common/BottomNavigation';

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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const requiredFields = ['eventName', 'purpose', 'location', 'dateTime', 'requesterName', 'designation'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());

    if (missingFields.length > 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await client.post('/contact/request-coverage', formData);
      setIsSubmitted(true);
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (err) {
      console.error('Error requesting coverage:', err);
      const msg = err.response?.data?.message || 'Failed to submit request. Please try again.';
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
      {/* Custom Header with Title and Back Arrow */}
      <View className="flex-row items-center px-4 py-4 border-b" style={{ borderColor: colors.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="flex-1 text-center" style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
          Request Coverage
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 100 }}>
        {isSubmitted ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="checkmark-circle" size={100} color="#10b981" />
            <Text className="text-green-600 font-semibold text-center mt-4 text-lg">
              Thank you for your request!
            </Text>
          </View>
        ) : (
          <>
            {/* NOTE Section */}
            <View className="mb-6 p-3 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
                NOTE :
              </Text>
              <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 20 }}>
                Kindly complete and submit this form at least two weeks prior to the event.
              </Text>
            </View>

            {/* Form Fields */}
            {[
              { label: 'Name of the Event', field: 'eventName', placeholder: 'Enter event name...', multiline: false },
              { label: 'Purpose / Significance', field: 'purpose', placeholder: 'Enter purpose/significance here...', multiline: true },
              { label: 'Location', field: 'location', placeholder: 'Enter event location...', multiline: false },
              { label: 'Date and Time *', field: 'dateTime', placeholder: 'Enter date and time', multiline: false, icon: 'calendar' },
              { label: 'Event Highlights', field: 'highlights', placeholder: 'Enter the main highlights of the event...', multiline: true },
              { label: 'Full Name of Requestor', field: 'requesterName', placeholder: 'Enter your name here', multiline: false },
              { label: 'Designation', field: 'designation', placeholder: 'Enter your name here', multiline: false },
              { label: 'Organizer / Office Coordinator', field: 'coordinator', placeholder: "Enter Organizer's / Office Coordinator's name here.", multiline: false },
            ].map(({ label, field, placeholder, multiline, icon }) => (
              <View key={field} className="mb-5">
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937', marginBottom: 8 }}>
                  {label}
                </Text>
                <View style={{ position: 'relative' }}>
                  {icon && (
                    <Ionicons
                      name={icon}
                      size={18}
                      color={colors.textSecondary}
                      style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
                    />
                  )}
                  <TextInput
                    style={{
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingHorizontal: icon ? 40 : 12,
                      paddingVertical: multiline ? 12 : 12,
                      fontSize: 14,
                      color: colors.text,
                      minHeight: multiline ? 100 : 44,
                      textAlignVertical: multiline ? 'top' : 'center',
                    }}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    value={formData[field]}
                    onChangeText={(value) => handleChange(field, value)}
                    editable={!isLoading}
                    multiline={multiline}
                  />
                </View>
              </View>
            ))}

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
      <BottomNavigation navigation={navigation} activeTab="PressHub" />
    </SafeAreaView>
  );
};

export default RequestCoverageScreen;
