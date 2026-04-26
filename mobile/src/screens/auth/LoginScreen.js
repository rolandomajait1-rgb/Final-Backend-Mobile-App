import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Platform, ActivityIndicator,
  ImageBackground, Image, StatusBar, useWindowDimensions,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '../../utils/logger';

const bg = require('../../../assets/bg.jpg');
const logo = require('../../../assets/logo.png');
const textlogo = require('../../../assets/la verdad herald.png');

export default function LoginScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const scrollRef = useRef(null);

  const validate = () => {
    const e = {};
    // Accept both @student.laverdad.edu.ph and @laverdad.edu.ph
    const emailRegex = /^[^\s@]+@(student\.)?laverdad\.edu\.ph$/;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) e.email = 'Email is required';
    else if (!emailRegex.test(trimmedEmail))
      e.email = 'Please enter a valid @laverdad.edu.ph or @student.laverdad.edu.ph email';
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
      const normalizedEmail = email.trim().toLowerCase();
      const response = await client.post('/api/login', { 
        email: normalizedEmail, 
        password 
      });
      const { token, user } = response.data;
      await AsyncStorage.multiSet([
        ['auth_token', token],
        ['user_email', normalizedEmail],
        ['user_name', user.name],
        ['user_role', user?.role || 'user'],
        ['user_data', JSON.stringify(user)],
        ['remember_me', remember ? 'true' : 'false'],
      ]);
      setSuccessMessage('Welcome back to La Verdad Herald!');
      // Redirect to admin/moderator dashboard if user is admin or moderator
      if (user?.role === 'admin' || user?.role === 'moderator') {
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Management', params: { screen: 'Admin' } }],
          });
        }, 1200);
      } else {
        setTimeout(() => navigation.replace('MainApp'), 1200);
      }
    } catch (error) {
      // Build comprehensive error message from all possible error sources
      const emailErrors = error.response?.data?.errors?.email;
      const passwordErrors = error.response?.data?.errors?.password;
      const emailError = Array.isArray(emailErrors) ? emailErrors[0] : emailErrors;
      const passwordError = Array.isArray(passwordErrors) ? passwordErrors[0] : passwordErrors;
      const generalMsg = error.response?.data?.message || '';
      const msg = String(emailError || passwordError || generalMsg || '');
      
      const needsVerification = msg.toLowerCase().includes('verify');
      if (needsVerification || (error.response?.status === 403 && error.response?.data?.requires_verification)) {
        setErrors({ general: msg || 'Please verify your email before logging in.' });
        setShowResend(true);
      } else if (error.response?.status === 401) {
        setErrors({ general: 'Invalid email or password. Please try again.' });
      } else if (error.response?.data?.errors) {
        // Flatten all field errors
        const flat = {};
        Object.entries(error.response.data.errors).forEach(([k, v]) => { 
          flat[k] = Array.isArray(v) ? v[0] : v; 
        });
        setErrors(flat);
      } else if (msg) {
        setErrors({ general: msg });
      } else {
        setErrors({ general: 'An error occurred. Please try again later.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Bug #12 Fix: Add proper error handling for resend verification
  const handleResend = async () => {
    setIsResending(true);
    try {
      await client.post('/api/email/resend-verification', { email: email.trim().toLowerCase() });
      setSuccessMessage('Verification email sent! Please check your inbox.');
      setShowResend(false);
      setErrors({});
    } catch (error) {
      // Security #1 Fix: Use sanitized logging
      logError('Resend verification error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to resend verification email. Please try again.';
      setErrors({ general: errorMsg });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View className="flex-1">
      <StatusBar style="light" hidden={false} />

      <View className="flex-1">
        <ImageBackground source={bg} className="flex-1" resizeMode="cover" style={{ opacity: 0.9 }}>
          {/* Dark overlay */}
          <View className="absolute inset-0" style={{ backgroundColor: '#2C5F7F' }} />

          {/* Logo block — part of background */}
          <View className="items-center mt-40 ">
            <Image
              source={logo}
              style={{ width: width < 375 ? 200 : 260, height: width < 375 ? 115 : 150, marginBottom: 14 , opacity: 0.3}}
              resizeMode="contain"
            />
            <Image
              source={textlogo}
              style={{ width: width < 375 ? 280 : 360, height: width < 375 ? 42 : 54 }}
              resizeMode="contain"
            />
            <Text className={`${width < 375 ? 'text-sm' : 'text-lg'} text-gray-300 text-center px-2 mt-2 `}>
              The Official Higher Education Student Publication of{'\n'}
              La Verdad Christian College, Inc.
            </Text>
          </View>
        </ImageBackground>

        {/* White view at the bottom */}
        <View className="h-28 bg-sky-800" />
      </View>

      <SafeAreaView className="absolute inset-0">
        <KeyboardAwareScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingVertical: width < 375 ? 16 : 24, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className={`flex-1 ${width < 375 ? 'px-4' : 'px-6'}`}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={20}
        >

              {/* Card */}
              <View className={`rounded-3xl bg-white mt-60 ${width < 375 ? 'p-6' : 'p-10'}`}>

                {/* X close button */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('Welcome')}
                  className="absolute top-4 right-4 z-10"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={width < 375 ? 20 : 24} color="#6b7280" />
                </TouchableOpacity>

                <Text className={`${width < 375 ? 'text-2xl' : 'text-4xl'} text-center font-bold text-black mb-6`}>Login</Text>

                {/* General error */}
                {errors.general ? (
                  <View className={`mb-4 rounded-md border border-red-400 bg-red-300/40 ${width < 375 ? 'p-2' : 'p-3'}`}>
                    <Text className={`${width < 375 ? 'text-xs' : 'text-sm'} text-center text-red-900`}>{errors.general}</Text>
                  </View>
                ) : null}

                {/* Resend verification */}
                {showResend ? (
                  <View className={`mb-4 rounded-md border border-yellow-400 bg-yellow-300/40 ${width < 375 ? 'p-2' : 'p-3'}`}>
                    <Text className={`${width < 375 ? 'text-xs' : 'text-sm'} mb-2 text-center text-yellow-900`}>Need a new verification link?</Text>
                    <TouchableOpacity onPress={handleResend} disabled={isResending} className={`rounded-md bg-yellow-600 ${width < 375 ? 'py-1' : 'py-2'}`}>
                      {isResending
                        ? <ActivityIndicator color="white" size="small" />
                        : <Text className={`${width < 375 ? 'text-xs' : 'text-sm'} text-center text-white`}>Resend Verification Email</Text>
                      }
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Success message */}
                {successMessage ? (
                  <View className={`mb-4 rounded-md border border-green-400 bg-green-300/40 ${width < 375 ? 'p-2' : 'p-3'}`}>
                    <Text className={`${width < 375 ? 'text-xs' : 'text-sm'} text-center text-green-900`}>{successMessage}</Text>
                  </View>
                ) : null}

                {/* Email */}
                <View className={`mb-${width < 375 ? '4' : '6'}`}>
                  <Text className={`${width < 375 ? 'text-base' : 'text-lg'} mb-1 font-medium text-black`}>Email Address</Text>
                  <TextInput
                    className={`w-full rounded-md border ${width < 375 ? 'px-3 py-1.5' : 'px-4 py-2'} mb-2 bg-white/80 text-black ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                    value={email}
                  onChangeText={(v) => { setEmail(v.trim()); setErrors((p) => ({ ...p, email: null, general: null })); }}
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {errors.email ? <Text className={`${width < 375 ? 'text-xs' : 'text-xs'} mt-1 text-red-400`}>{errors.email}</Text> : null}
                </View>

                {/* Password */}
                <View className={`mb-${width < 375 ? '4' : '6'}`}>
                  <Text className={`${width < 375 ? 'text-base' : 'text-lg'} mb-1 font-medium text-black`}>Password</Text>
                  <View className={`flex-row items-center rounded-md border bg-white/80 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}>
                    <TextInput
                      className={`flex-1 ${width < 375 ? 'px-3 py-1.5' : 'px-4 py-2'} text-black`}
                      value={password}
                      onChangeText={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: null, general: null })); }}
                      placeholder="Enter your password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pr-3">
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={width < 375 ? 18 : 20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text className={`${width < 375 ? 'text-xs' : 'text-xs'} mt-1 text-red-400`}>{errors.password}</Text> : null}
                </View>

                {/* Remember me + Forgot password */}
                <View className={`flex-row items-center justify-between ${width < 375 ? 'mb-4' : 'mb-6'}`}>
                  <TouchableOpacity onPress={() => setRemember(!remember)} className="flex-row items-center gap-2">
                    <View className={`h-4 w-4 rounded border ${remember ? 'bg-blue-500 border-blue-500' : 'border-black/60 bg-white/10'}`}>
                      {remember && <Ionicons name="checkmark" size={14} color="white" />}
                    </View>
                    <Text className={`${width < 375 ? 'text-sm' : 'text-lg'} text-black`}>Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text className={`${width < 375 ? 'text-sm' : 'text-lg'} text-blue-500`}>Forgot your password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                  className={`rounded-full items-center`}
                  style={{ backgroundColor: '#0686f6ff', width: width < 375 ? 120 : 150, alignSelf: 'center', paddingVertical: width < 375 ? 12 : 16 }}
                >
                  {isLoading
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text className={`${width < 375 ? 'text-base' : 'text-lg'} text-center font-bold text-white`}>Log in</Text>
                  }
                </TouchableOpacity>

                {/* Sign up link */}
                <View className={`flex-row justify-center ${width < 375 ? 'mt-4' : 'mt-6'}`}>
                  <Text className={`${width < 375 ? 'text-sm' : 'text-lg'} text-black mb-1`}>Don&apos;t have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text className={`${width < 375 ? 'text-sm' : 'text-lg'} text-blue-500`}>Sign up</Text>
                  </TouchableOpacity>
                </View>

              </View>

          </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}
