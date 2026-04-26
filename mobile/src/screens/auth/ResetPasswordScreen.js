import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Platform, ActivityIndicator,
  ImageBackground, Image, StatusBar,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';

const bg = require('../../../assets/bg.jpg');
const logo = require('../../../assets/logo.png');
const textlogo = require('../../../assets/la verdad herald.png');

export default function ResetPasswordScreen({ navigation, route }) {
  const token = route.params?.token || '';
  const email = route.params?.email || '';

  const [formData, setFormData] = useState({
    email,
    token,
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const scrollRef = useRef(null);

  // Sync params when they arrive via deep link
  useEffect(() => {
    if (route.params?.token || route.params?.email) {
      setFormData((prev) => ({
        ...prev,
        token: route.params.token || prev.token,
        email: route.params.email || prev.email,
      }));
    }
  }, [route.params?.token, route.params?.email]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.token || !formData.email) {
      e.general = 'Invalid reset link. Please request a new password reset.';
      return e;
    }
    if (formData.password.length < 8)
      e.password = ['Password must be at least 8 characters long'];
    else if (!/[a-z]/.test(formData.password) || !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password))
      e.password = ['Password must contain uppercase, lowercase, and numbers'];
    if (formData.password !== formData.password_confirmation)
      e.password_confirmation = ['Passwords do not match'];
    return e;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }
    try {
      const response = await client.post('/api/reset-password', {
        email: formData.email,
        token: formData.token,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });
      setSuccessMessage(response.data.message);
      setTimeout(() => navigation.replace('Login'), 2000);
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: error.response?.data?.message || 'Failed to reset password. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <StatusBar style="light" hidden={false} />

      {/* Background layer — same as LoginScreen */}
      <View className="flex-1">
        <ImageBackground source={bg} className="flex-1" resizeMode="cover" style={{ opacity: 0.9 }}>
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

              <Text className="text-center font-bold text-4xl text-black mb-6">Reset Password</Text>

              {successMessage !== '' && (
                <View className="mb-4 rounded-md border border-green-400 bg-green-300/40 p-3">
                  <Text className="text-center text-sm text-green-900">{successMessage}</Text>
                </View>
              )}

              {errors.general && (
                <View className="mb-4 rounded-md border border-red-400 bg-red-300/40 p-3">
                  <Text className="text-center text-sm text-red-900">{errors.general}</Text>
                </View>
              )}

              {/* Email (read-only) */}
              <View className="mb-4">
                <Text className="mb-1 text-lg font-medium text-black">Email Address</Text>
                <TextInput
                  className="w-full rounded-md border border-gray-200 px-4 py-2 bg-gray-100 text-gray-500"
                  value={formData.email}
                  editable={false}
                />
              </View>

              {/* New Password */}
              <View className="mb-4">
                <Text className="mb-1 text-lg font-medium text-black">New Password</Text>
                <View className={`flex-row items-center rounded-md border bg-white/80 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}>
                  <TextInput
                    className="flex-1 px-4 py-2 text-black"
                    value={formData.password}
                    onChangeText={(v) => handleChange('password', v)}
                    placeholder="Enter new password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pr-3">
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text className="mt-1 text-xs text-red-400">{errors.password[0]}</Text>}
              </View>

              {/* Confirm Password */}
              <View className="mb-6">
                <Text className="mb-1 text-lg font-medium text-black">Confirm New Password</Text>
                <View className={`flex-row items-center rounded-md border bg-white/80 ${errors.password_confirmation ? 'border-red-400' : 'border-gray-300'}`}>
                  <TextInput
                    className="flex-1 px-4 py-2 text-black"
                    value={formData.password_confirmation}
                    onChangeText={(v) => handleChange('password_confirmation', v)}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="pr-3">
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
                {errors.password_confirmation && <Text className="mt-1 text-xs text-red-400">{errors.password_confirmation[0]}</Text>}
              </View>

              {/* Submit */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                className="rounded-full py-4 items-center"
                style={{ backgroundColor: '#0686f6ff', width: 150, alignSelf: 'center' }}
              >
                {isLoading
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text className="text-center font-bold text-white text-base">Reset Password</Text>
                }
              </TouchableOpacity>

              {/* Back to login */}
              <View className="mt-6 flex-row justify-center">
                <Text className="text-lg text-black mb-1">Remember your password? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text className="text-lg text-blue-500">Sign in</Text>
                </TouchableOpacity>
              </View>

            </View>

          </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}
