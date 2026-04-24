import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import HomeHeader from '../homepage/HomeHeader';
import { ErrorMessage } from '../../components/common';
import BottomNavigation from '../../components/common/BottomNavigation';
import { useToast } from '../../context/ToastContext';

const SendFeedbackScreen = ({ navigation }) => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      setError('Please enter your feedback');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await client.post('/api/contact/feedback', { feedback, email });
      if (isMountedRef.current) {
        showToast('Feedback sent successfully!', 'success');
        setFeedback('');
        setEmail('');
        setTimeout(() => {
          if (isMountedRef.current) {
            navigation.goBack();
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Error sending feedback:', err);
      const msg = err.response?.data?.message || 'Failed to send feedback. Please try again.';
      if (isMountedRef.current) {
        setError(msg);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#ffffff' }}>
      <View className="flex-shrink-0">
        <HomeHeader
          categories={[]}
          selectedCategory={null}
          onCategorySelect={() => {}}
          error={null}
          ErrorMessage={ErrorMessage}
          showCategories={false}
          navigation={navigation}
        />
      </View>

      {/* Header */}
      <View className="flex-row items-center px-5 py-4 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={26} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-center" style={{ fontSize: 20, fontWeight: 'bold', color: '#000', marginRight: 26 }}>
          Send us Feedback
        </Text>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 100 }} showsVerticalScrollIndicator={false} enableOnAndroid={true} extraScrollHeight={20}>
          <>
            {/* Subtitle */}
            <Text style={{ fontSize: 15, color: '#374151', marginBottom: 8 }}>
              Got suggestions? We&apos;d love to hear them!
            </Text>

            {/* Email Input */}
            <View className="mb-4">
              <Text style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>
                Email Address (Optional)
              </Text>
              <TextInput
                style={{
                  borderColor: '#D1D5DB',
                  borderWidth: 1,
                  borderRadius: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 13,
                  color: '#000',
                  backgroundColor: '#fff',
                }}
                placeholder="your.email@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Feedback Input */}
            <View className="mb-6">
              <Text style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>
                Feedback / Suggestions
              </Text>
              <TextInput
                style={{
                  borderColor: '#D1D5DB',
                  borderWidth: 1,
                  borderRadius: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  fontSize: 13,
                  color: '#000',
                  backgroundColor: '#fff',
                  minHeight: 180,
                  textAlignVertical: 'top',
                }}
                placeholder="Enter suggestions / comments here."
                placeholderTextColor="#9CA3AF"
                value={feedback}
                onChangeText={setFeedback}
                multiline
                editable={!isLoading}
              />
            </View>

            {/* Error Message */}
            {error && (
              <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                {error}
              </Text>
            )}

            {/* Submit Button */}
            <View className="items-center mb-8 mt-2">
              <TouchableOpacity
                style={{
                  backgroundColor: '#0ea5e9',
                  borderRadius: 24,
                  paddingVertical: 12,
                  paddingHorizontal: 40,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isLoading ? 0.7 : 1,
                  minWidth: 140,
                }}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '500', fontSize: 15 }}>
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
      </KeyboardAwareScrollView>
      <View className="flex-shrink-0">
        <BottomNavigation navigation={navigation} activeTab="PressHub" />
      </View>
    </View>
  );
};

export default SendFeedbackScreen;
