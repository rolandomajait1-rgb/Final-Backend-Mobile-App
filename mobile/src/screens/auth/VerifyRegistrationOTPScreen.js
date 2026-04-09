import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  ImageBackground, Image, StatusBar, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from '../../api/client';

const bg = require('../../../assets/bg.jpg');
const logo = require('../../../assets/logo.png');
const textlogo = require('../../../assets/la verdad herald.png');

export default function VerifyRegistrationOTPScreen({ navigation, route }) {
  const email = route.params?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/verify-registration-otp', { email, otp });
      // Verification successful, redirect to login
      navigation.replace('Login');
    } catch (err) {
      let msg = 'Invalid OTP. Please try again.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.code === 'ECONNABORTED' || err.message === 'timeout of 180000ms exceeded') {
        msg = 'Request timed out. Please try again.';
      } else if (err.message === 'Network Error') {
        msg = 'Network error. Please check your connection.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await axios.post('/api/resend-registration-otp', { email });
      setOtp('');
      setSuccessMsg('New OTP sent! Please check your email.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      let msg = 'Failed to resend OTP. Please try again.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
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

        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              keyboardShouldPersistTaps="handled"
              className="px-6 py-6"
              keyboardDismissMode="interactive"
            >
              {/* Logo — hidden when keyboard is open */}
              {!keyboardVisible && (
                <View className="items-center mb-6">
                  <Image source={logo} style={{ width: 260, height: 150, marginBottom: 14 }} resizeMode="contain" />
                  <Image source={textlogo} style={{ width: 360, height: 54 }} resizeMode="contain" />
                </View>
              )}

              {/* Card */}
              <View className="rounded-3xl bg-white p-8">

                {/* X close */}
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className="absolute top-4 right-4 z-10"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>

                <Text className="text-center font-bold text-3xl text-black mb-2">Verify Email</Text>
                <Text className="text-center text-sm text-gray-500 mb-6">
                  Enter the 6-digit code sent to {email}
                </Text>

                {error !== '' && (
                  <View className="mb-4 rounded-md border border-red-400 bg-red-50 p-3">
                    <Text className="text-center text-sm text-red-700">{error}</Text>
                  </View>
                )}

                {successMsg !== '' && (
                  <View className="mb-4 rounded-md border border-green-400 bg-green-50 p-3">
                    <Text className="text-center text-sm text-green-700">{successMsg}</Text>
                  </View>
                )}

                {/* OTP Input */}
                <View className="mb-6">
                  <Text className="mb-1 text-sm font-medium text-gray-700">OTP Code</Text>
                  <TextInput
                    className="w-full rounded-md border border-gray-300 px-4 py-3 bg-white text-center text-2xl font-bold tracking-widest"
                    style={{ color: '#1f2937', letterSpacing: 8 }}
                    value={otp}
                    onChangeText={(v) => {
                      if (/^\d{0,6}$/.test(v)) {
                        setOtp(v);
                        setError('');
                      }
                    }}
                    placeholder="000000"
                    placeholderTextColor="#d1d5db"
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)}
                  />
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="rounded-full py-4 items-center mb-4"
                  style={{ backgroundColor: otp.length === 6 ? '#f8b200' : '#d1d5db' }}
                >
                  {loading
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text className="text-center font-bold text-white text-base">Verify OTP</Text>
                  }
                </TouchableOpacity>

                {/* Resend OTP */}
                <View className="mt-4 flex-row justify-center">
                  <Text className="text-sm text-gray-600">Didn't receive the code? </Text>
                  <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                    <Text className="text-sm text-blue-600 font-medium">Resend</Text>
                  </TouchableOpacity>
                </View>

                {/* Back to register */}
                <View className="mt-6 flex-row justify-center">
                  <TouchableOpacity onPress={() => navigation.replace('Register')}>
                    <Text className="text-sm text-blue-600">Back to Register</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
