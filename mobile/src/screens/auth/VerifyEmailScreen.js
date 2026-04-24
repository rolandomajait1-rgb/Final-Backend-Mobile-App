import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  Platform, ActivityIndicator,
  ImageBackground, Image, StatusBar,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';

const bg = require('../../../assets/bg.jpg');
const logo = require('../../../assets/logo.png');
const textlogo = require('../../../assets/la verdad herald.png');

export default function VerifyEmailScreen({ navigation, route }) {
  const token = route.params?.token || '';
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const { showToast } = useToast();
  const scrollRef = useRef(null);

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setError('Invalid verification link');
      setLoading(false);
      showToast('Invalid verification link', 'error');
      return;
    }

    try {
      const response = await client.get('/api/email/verify-token', {
        params: { token },
        headers: { Accept: 'application/json' },
      });
      const successMsg = response.data.message || 'Email verified successfully!';
      setMessage(successMsg);
      setVerified(true);
      showToast(successMsg, 'success');
      setTimeout(() => navigation.replace('Login'), 2000);
    } catch (err) {
      let msg = 'Email verification failed';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message === 'Network Error') {
        msg = 'Network error. Please check your connection.';
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, navigation, showToast]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  return (
    <View className="flex-1">
      <StatusBar hidden={false} />

      {/* Background layer - same as LoginScreen */}
      <View className="flex-1">
        <ImageBackground source={bg} className="flex-1" resizeMode="cover" style={{ opacity: 0.9 }}>
          {/* Dark blue overlay */}
          <View className="absolute inset-0" style={{ backgroundColor: '#2C5F7F' }} />

          {/* Logo block - part of background */}
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

      {/* Absolute overlay - card floats on top */}
      <SafeAreaView className="absolute inset-0">
        <KeyboardAwareScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingVertical: 24, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={20}
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

              <Text className="text-center font-bold text-4xl text-black mb-2">Verify Email</Text>
              <Text className="text-center text-sm text-gray-500 mb-6">
                Verifying your email address...
              </Text>

              {loading && (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#f8b200" />
                  <Text className="text-center text-gray-600 mt-4">Verifying your email...</Text>
                </View>
              )}

              {!loading && verified && (
                <View className="items-center">
                  <Ionicons name="checkmark-circle" size={64} color="#16a34a" style={{ marginBottom: 16 }} />
                  <Text className="text-center font-bold text-2xl text-green-700 mb-2">Email Verified!</Text>
                  <Text className="text-center text-gray-600 mb-6">{message}</Text>
                  <Text className="text-center text-sm text-gray-500">Redirecting to login...</Text>
                </View>
              )}

              {!loading && error && (
                <View className="items-center">
                  <Ionicons name="close-circle" size={64} color="#dc2626" style={{ marginBottom: 16 }} />
                  <Text className="text-center font-bold text-2xl text-red-700 mb-2">Verification Failed</Text>
                  <Text className="text-center text-gray-600 mb-6">{error}</Text>
                  <TouchableOpacity
                    onPress={() => navigation.replace('Login')}
                    className="rounded-full py-4 items-center"
                    style={{ backgroundColor: '#f8b200' }}
                  >
                    <Text className="font-bold text-white text-lg">Go to Login</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>

          </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}
