import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  ImageBackground, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';

const bg = require('../../../assets/bg.jpg');
const logo = require('../../../assets/logo.png');
const textlogo = require('../../../assets/la verdad herald.png');

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await client.post('/api/forgot-password', { email: email.trim() });
      // Navigate to OTP verification screen
      navigation.navigate('VerifyOTP', { email: email.trim() });
    } catch (err) {
      let msg = 'Failed to send OTP. Please try again.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message === 'timeout of 180000ms exceeded') {
        msg = 'Request timed out. Server may be starting up. Please try again in a moment.';
      } else if (err.message === 'Network Error') {
        msg = 'Network error. Please check your connection.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <StatusBar hidden={false} />

      {/* Background layer — same as LoginScreen */}
      <View className="flex-1">
        <ImageBackground source={bg} className="flex-1" resizeMode="cover" blurRadius={8} style={{ opacity: 0.9 }}>
          {/* Dark blue overlay */}
          <View className="absolute inset-0" style={{ backgroundColor: '#2C5F7F' }} />

          {/* Logo block */}
          <View className="items-center mt-40">
            <Image
              source={logo}
              style={{ width: 260, height: 150, marginBottom: 14, opacity: 0.3 }}
              resizeMode="contain"
            />
            <Image
              source={textlogo}
              style={{ width: 360, height: 54 }}
              resizeMode="contain"
            />
            <Text className="text-gray-300 text-lg text-center px-2 mt-2">
              The Official Higher Education Student Publication of{'\n'}
              La Verdad Christian College, Inc.
            </Text>
          </View>
        </ImageBackground>

        {/* White spacer at the bottom */}
        <View className="h-28 bg-sky-800" />
      </View>

      {/* Absolute overlay — card floats on top */}
      <SafeAreaView className="absolute inset-0">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingVertical: 24 }}
            keyboardShouldPersistTaps="handled"
            className="px-6"
            keyboardDismissMode="interactive"
          >

            {/* Card */}
            <View className="rounded-3xl bg-white mt-60 p-10">

              {/* X close */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Welcome')}
                className="absolute top-4 right-4 z-10"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>

              <Text className="text-center font-bold text-4xl text-black mb-2">Forgot Password?</Text>
              <Text className="text-center text-sm text-gray-500 mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </Text>

              {error !== '' && (
                <View className="mb-4 rounded-md border border-red-400 bg-red-300/40 p-3">
                  <Text className="text-center text-sm text-red-900">{error}</Text>
                </View>
              )}

              {/* Email input */}
              <View className="mb-6">
                <Text className="mb-1 text-lg font-medium text-black">Email</Text>
                <TextInput
                  className="w-full rounded-md border border-gray-300 px-4 py-2 mb-2 bg-white/80 text-black"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)}
                />
              </View>

              {/* Send button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading || !email}
                className="rounded-full py-4 items-center mb-4"
                style={{ backgroundColor: '#0686f6ff', width: 150, alignSelf: 'center' }}
              >
                {loading
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text className="text-center font-bold text-white text-base">Send OTP</Text>
                }
              </TouchableOpacity>

              {loading && (
                <Text className="text-center text-xs text-gray-400 mt-2">
                  Sending OTP... This may take a moment on first request.
                </Text>
              )}

              {/* Back to login */}
              <View className="mt-6 flex-row justify-center">
                <Text className="text-lg text-black mb-1">Remember your password? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text className="text-lg text-blue-500">Log in</Text>
                </TouchableOpacity>
              </View>

            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
