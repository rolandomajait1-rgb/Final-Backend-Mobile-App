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

const SendFeedbackScreen = ({ navigation }) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      setError('Please enter your feedback');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await axios.post('/contact/feedback', { feedback });
      setIsSubmitted(true);
      setFeedback('');
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (err) {
      console.error('Error sending feedback:', err);
      setError('Failed to send feedback. Please try again.');
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
          Send us Feedback
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        {isSubmitted ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="checkmark-circle" size={100} color="#10b981" />
            <Text className="text-green-600 font-semibold text-center mt-4 text-lg">
              Thank you for your feedback!
            </Text>
          </View>
        ) : (
          <>
            {/* Subtitle */}
            <Text className="text-gray-600 text-xl mb-6 text-center">
              Got suggestions? We'd love to hear them!
            </Text>
            {/* Feedback Input */}
            <View className="mb-6">
              <TextInput
                className="border rounded-lg p-4 text-gray-700"
                style={{
                  borderColor: colors.border,
                  borderWidth: 1,
                  minHeight: 150,
                  textAlignVertical: 'top',
                }}
                placeholder="Enter suggestions / comments here..."
                placeholderTextColor={colors.textSecondary}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                editable={!isLoading}
              />
            </View>
            {/* Error Message */}
            {error && <Text className="text-red-600 text-sm mb-4">{error}</Text>}
            {/* Submit Button */}
            <View className="items-center">
              <TouchableOpacity
                className="bg-blue-500 rounded-full p-4 w-1/2 flex-row items-center justify-center"
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

export default SendFeedbackScreen;
