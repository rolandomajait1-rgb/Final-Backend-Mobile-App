import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  ImageBackground, Image, StatusBar, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const bg = require('../../../assets/bg.jpg');
const logo = require('../../../assets/logo.png');
const textlogo = require('../../../assets/la verdad herald.png');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required';
    else if (!email.endsWith('@student.laverdad.edu.ph'))
      e.email = 'Only @student.laverdad.edu.ph emails are allowed';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  };

  const handleLogin = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const response = await axios.post('/api/login', { email, password });
      const { token, user } = response.data;
      await AsyncStorage.multiSet([
        ['auth_token', token],
        ['user_email', email],
        ['user_name', user.name],
        ['user_role', user?.role || 'user'],
      ]);
      setSuccessMessage('Welcome back to La Verdad Herald!');
      setTimeout(() => navigation.replace('Main'), 1200);
    } catch (error) {
      const msg = error.response?.data?.errors?.email?.[0] || error.response?.data?.message || '';
      const needsVerification = msg.toLowerCase().includes('verify');
      if (needsVerification || (error.response?.status === 403 && error.response?.data?.requires_verification)) {
        setErrors({ general: msg || 'Please verify your email before logging in.' });
        setShowResend(true);
      } else if (error.response?.status === 401) {
        setErrors({ general: 'Invalid email or password. Please try again.' });
      } else if (error.response?.data?.errors) {
        const flat = {};
        Object.entries(error.response.data.errors).forEach(([k, v]) => { flat[k] = v[0]; });
        setErrors(flat);
      } else {
        setErrors({ general: error.response?.data?.message || 'An error occurred. Please try again later.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await axios.post('/api/email/resend-verification', { email });
      setSuccessMessage('Verification email sent! Please check your inbox.');
      setShowResend(false);
      setErrors({});
    } catch {
      setErrors({ general: 'Failed to resend verification email. Please try again.' });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View className="flex-1">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground source={bg} className="flex-1" resizeMode="cover" blurRadius={4} style={{ opacity: 0.9 }}>
        {/* Dark overlay */}
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

              {/* Logo block — hidden when keyboard is open */}
              {!keyboardVisible && (
                <View className="items-center mb-6 mt-4">
                  <Image
                    source={logo}
                    style={{ width: 260, height: 150, marginBottom: 14 }}
                    resizeMode="contain"
                  />
                  <Image
                    source={textlogo}
                    style={{ width: 360, height: 54 }}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* Card */}
              <View className="rounded-3xl bg-white p-10">

                {/* X close button */}
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className="absolute top-4 right-4 z-10"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>

                <Text className="text-center font-bold text-4xl text-black mb-12">Login</Text>

                {/* Email */}
                <View className="mb-6">
                  <Text className="mb-1 text-lg font-medium text-black gap-">Email Address</Text>
                  <TextInput
                    className={`w-full rounded-md border px-4 py-2 mb-2 bg-white/80 text-black ${errors.email ? 'border-red-400' : 'border-white/40'}`}
                    value={email}
                    onChangeText={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: null })); }}
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {errors.email && <Text className="mt-1 text-xs text-red-400">{errors.email}</Text>}
                </View>

                {/* Password */}
                <View className="mb-6">
                  <Text className="mb-1 text-lg font-medium text-black">Password</Text>
                  <View className={`flex-row items-center rounded-md border bg-white/80 ${errors.password ? 'border-red-400' : 'border-white/40'}`}>
                    <TextInput
                      className="flex-1 px-4 py-2 text-black"
                      value={password}
                      onChangeText={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: null })); }}
                      placeholder="Enter your password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pr-3">
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text className="mt-1 text-xs text-red-400">{errors.password}</Text>}
                </View>

                {/* Remember me + Forgot password */}
                <View className="flex-row items-center justify-between mb-20">
                  <TouchableOpacity onPress={() => setRemember(!remember)} className="flex-row items-center gap-2">
                    <View className={`h-4 w-4 rounded border ${remember ? 'bg-blue-500 border-blue-500' : 'border-black/60 bg-white/10'}`}>
                      {remember && <Ionicons name="checkmark" size={14} color="white" />}
                    </View>
                    <Text className="text-lg text-black">Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text className="text-lg text-blue-500">Forgot your password?</Text>
                  </TouchableOpacity>
                </View>

                {/* General error */}
                {errors.general && (
                  <View className="mb-4 rounded-md border border-red-400 bg-red-900/40 p-3">
                    <Text className="text-center text-sm text-red-300">{errors.general}</Text>
                  </View>
                )}

                {/* Resend verification */}
                {showResend && (
                  <View className="mb-4 rounded-md border border-yellow-400 bg-yellow-900/40 p-3">
                    <Text className="mb-2 text-center text-sm text-yellow-300">Need a new verification link?</Text>
                    <TouchableOpacity onPress={handleResend} disabled={isResending} className="rounded-md bg-yellow-600 py-2">
                      {isResending
                        ? <ActivityIndicator color="white" size="small" />
                        : <Text className="text-center text-sm text-white">Resend Verification Email</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}

                {/* Success message */}
                {successMessage !== '' && (
                  <View className="mb-4 rounded-md border border-green-400 bg-green-900/40 p-3">
                    <Text className="text-center text-sm text-green-300">{successMessage}</Text>
                  </View>
                )}

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                  className="rounded-full py-4 items-center"
                  style={{ backgroundColor: '#f8b200' }}
                >
                  {isLoading
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text className="text-center font-bold text-white text-lg">Log in</Text>
                  }
                </TouchableOpacity>

                {/* Sign up link */}
                <View className="mt-6 flex-row justify-center">
                  <Text className="text-lg text-black mb-1">Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text className="text-lg text-blue-500">Sign up</Text>
                  </TouchableOpacity>
                </View>

                {/* Skip */}
                <TouchableOpacity onPress={() => navigation.replace('Main')} className="mt-4 items-center">
                  <Text className="text-sm text-gray-400 underline">Continue without signing in</Text>
                </TouchableOpacity>

              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
