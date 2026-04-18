import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  ImageBackground, Image, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from '../../api/client';

const bg = require('../../../assets/bg.jpg');
const logo = require('../../../assets/logo.png');
const textlogo = require('../../../assets/la verdad herald.png');

export default function VerifyEmailScreen({ navigation, route }) {
  const token = route.params?.token || '';
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyEmail = async () => {
    if (!token) {
      setError('Invalid verification link');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/email/verify-token', {
        params: { token },
        headers: { Accept: 'application/json' },
      });
      setMessage(response.data.message || 'Email verified successfully!');
      setVerified(true);
      setTimeout(() => navigation.replace('Login'), 2000);
    } catch (err) {
      let msg = 'Email verification failed';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
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
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground source={bg} className="flex-1" resizeMode="cover" blurRadius={4} style={{ opacity: 0.9 }}>
        <View className="absolute inset-0" style={{ backgroundColor: 'rgba(8, 30, 39, 0.63)' }} />

        <SafeAreaView className="flex-1 justify-center px-6">
          <View className="items-center mb-8">
            <Image source={logo} style={{ width: 260, height: 150, marginBottom: 14 }} resizeMode="contain" />
            <Image source={textlogo} style={{ width: 360, height: 54 }} resizeMode="contain" />
          </View>

          <View className="rounded-3xl bg-white p-8">
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
                  className="rounded-full py-3 px-8 items-center"
                  style={{ backgroundColor: '#f8b200' }}
                >
                  <Text className="font-bold text-white">Go to Login</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
