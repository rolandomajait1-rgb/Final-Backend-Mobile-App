import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
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

export default function VerifyOTPScreen({ navigation, route }) {
  const email = route.params?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await client.post('/api/verify-otp', { email, otp });
      // Show success toast
      showToast('OTP verified successfully!', 'success');
      // If OTP is valid, navigate to ResetPasswordScreen with token
      setTimeout(() => {
        navigation.replace('ResetPassword', {
          token: response.data.token,
          email,
        });
      }, 300);
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
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      await client.post('/api/forgot-password', { email: email.trim().toLowerCase() });
      setOtp('');
      setError('');
      setTimer(60);
      setIsTimerActive(true);
      showToast('OTP resent successfully! Check your email.', 'success');
    } catch (err) {
      let msg = 'Failed to resend OTP. Please try again.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <StatusBar style="light" hidden={false} />

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
                  onPress={() => navigation.goBack()}
                  className="absolute top-4 right-4 z-10"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>

                <Text className="text-center font-bold text-4xl text-black mb-2">Verify OTP</Text>
                <Text className="text-center text-sm text-gray-500 mb-2">
                  Enter the 6-digit code sent to {email}
                </Text>
                <Text className="text-center text-xs text-orange-500 font-medium mb-6">
                  Code expires in 10 minutes
                </Text>

                {error !== '' && (
                  <View className="mb-4 rounded-md border border-red-400 bg-red-50 p-3">
                    <Text className="text-center text-sm text-red-700">{error}</Text>
                  </View>
                )}

                {/* OTP Input */}
                <View className="mb-6">
                  <Text className="mb-1 text-lg font-medium text-black">OTP Code</Text>
                  <TextInput
                    className="w-full rounded-md border px-4 py-3 bg-white/80 text-center text-2xl font-bold tracking-widest"
                    style={{ color: '#1f2937', letterSpacing: 8, borderColor: error ? '#f87171' : '#d1d5db' }}
                    value={otp}
                    onChangeText={(v) => {
                  const cleanValue = v.replace(/[^0-9]/g, '');
                  setOtp(cleanValue.slice(0, 6));
                  if (error) setError('');
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
                  style={{ backgroundColor: otp.length === 6 ? '#0686f6ff' : '#d1d5db' }}
                >
                  {loading
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text className="text-center font-bold text-white text-base">Verify OTP</Text>
                  }
                </TouchableOpacity>

                {/* Resend OTP */}
                <View className="mt-4 flex-row justify-center items-center">
                  <Text className="text-sm text-gray-600">Didn&apos;t receive the code? </Text>
                  {timer > 0 ? (
                    <Text className="text-sm text-gray-400 font-medium">Resend in {timer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                      <Text className="text-sm text-blue-600 font-medium">Resend</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Back to forgot password */}
                <View className="mt-6 flex-row justify-center">
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text className="text-sm text-blue-600">Back to Forgot Password</Text>
                  </TouchableOpacity>
                </View>

              </View>

          </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}
