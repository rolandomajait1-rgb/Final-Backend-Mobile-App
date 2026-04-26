import { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator,
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

export default function VerifyRegistrationOTPScreen({ navigation, route }) {
  const email = route.params?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timer, setTimer] = useState(60); 
  const [isTimerActive, setIsTimerActive] = useState(true);
  const scrollRef = useRef(null);
  const successTimeoutRef = useRef(null);
  const expirationTimeoutRef = useRef(null);
  const { showToast } = useToast();

  // Save pending verification email to AsyncStorage with timestamp
  useEffect(() => {
    if (email) {
      const verificationData = {
        email: email,
        timestamp: Date.now(),
      };
      AsyncStorage.setItem('pending_verification', JSON.stringify(verificationData));
    }
  }, [email]);

  // Auto-close after 10 minutes
  useEffect(() => {
    // Set timeout for 10 minutes (600 seconds)
    expirationTimeoutRef.current = setTimeout(async () => {
      // Clear pending verification
      await AsyncStorage.removeItem('pending_verification');
      // Show toast
      showToast('Verification code expired. Please request a new one.', 'error');
      // Navigate back to Welcome screen
      navigation.replace('Welcome');
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      if (expirationTimeoutRef.current) {
        clearTimeout(expirationTimeoutRef.current);
      }
    };
  }, [email, navigation, showToast]);

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

  useEffect(() => {
    return () => { 
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await client.post('/api/verify-registration-otp', { email, otp });
      // Clear pending verification
      await AsyncStorage.removeItem('pending_verification');
      // Show success toast
      showToast('Email verified successfully! You can now login.', 'success');
      // Verification successful, redirect to login after short delay
      setTimeout(() => {
        navigation.replace('Login');
      }, 500);
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
      await client.post('/api/resend-registration-otp', { email });
      setOtp('');
      setSuccessMsg('New OTP sent! Please check your email.');
      setTimer(60);
      setIsTimerActive(true);
      
      // Update pending_verification timestamp since we generated a new OTP
      const verificationData = {
        email: email,
        timestamp: Date.now(), // Reset to current time
      };
      await AsyncStorage.setItem('pending_verification', JSON.stringify(verificationData));
      
      // Reset the 10-minute expiration timer
      if (expirationTimeoutRef.current) {
        clearTimeout(expirationTimeoutRef.current);
      }
      expirationTimeoutRef.current = setTimeout(async () => {
        await AsyncStorage.removeItem('pending_verification');
        showToast('Verification code expired. Please request a new one.', 'error');
        navigation.replace('Welcome');
      }, 10 * 60 * 1000); // 10 minutes
      
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccessMsg(''), 4000);
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

  const handleClose = async () => {
    // Clear pending verification when user manually closes
    await AsyncStorage.removeItem('pending_verification');
    navigation.navigate('Welcome');
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

        {/* White view at the bottom */}
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

              {/* X close button */}
              <TouchableOpacity
                onPress={handleClose}
                className="absolute top-4 right-4 z-10"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>

              <Text className="text-center font-bold text-4xl text-black mb-2">Verify Email</Text>
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
                style={{ backgroundColor: otp.length === 6 ? '#f8b200' : '#d1d5db' }}
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

              {/* Back to register */}
              <View className="mt-6 flex-row justify-center">
                <TouchableOpacity onPress={() => navigation.replace('Register')}>
                  <Text className="text-sm text-blue-600">Back to Register</Text>
                </TouchableOpacity>
              </View>

            </View>

        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}
