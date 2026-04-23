import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  ImageBackground, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';

const bg = require('../../../assets/bg.jpg');
const logo = require('../../../assets/logo.png');
const textlogo = require('../../../assets/la verdad herald.png');

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef(null);
  const { showToast } = useToast();

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (newErrors[name]) delete newErrors[name];
      if (newErrors.general) delete newErrors.general;
      return newErrors;
    });
  };

  const validateForm = () => {
    const e = {};
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

    if (!formData.name.trim()) e.name = ['Full name is required'];
    if (!formData.email.trim()) e.email = ['Email is required'];
    else if (!formData.email.trim().endsWith('@student.laverdad.edu.ph'))
      e.email = ['Only @student.laverdad.edu.ph emails are allowed'];
    
    if (!formData.password) e.password = ['Password is required'];
    else if (formData.password.length < 8) e.password = ['Password must be at least 8 characters'];
    else if (!pwRegex.test(formData.password))
      e.password = ['Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number'];
      
    if (formData.password !== formData.password_confirmation)
      e.password_confirmation = ['Passwords do not match'];
    
    return e;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setErrors({});
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      // Quick health check with short timeout
      try { await client.get('/api/health', { timeout: 5000 }); } catch { /* cold start */ }
      // Register with extended timeout for slow servers
      await client.post('/api/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      }, { timeout: 180000 });
      // Show success toast
      showToast('Check your email for verification link!', 'success');
      // Navigate to OTP verification screen for registration
      setTimeout(() => {
        navigation.replace('VerifyRegistrationOTP', { email: formData.email });
      }, 300);
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        setErrors({ general: 'Server is starting up. Please wait a moment and try again.' });
      } else if (error.response?.data?.errors) {
        // Laravel validation returns errors as object with array values
        // Flatten them to ensure consistent format
        const backendErrors = error.response.data.errors;
        const flatErrors = {};
        Object.keys(backendErrors).forEach(key => {
          flatErrors[key] = Array.isArray(backendErrors[key]) 
            ? backendErrors[key][0] 
            : backendErrors[key];
        });
        setErrors(flatErrors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        console.log('Registration error:', error);
        setErrors({ general: error.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingVertical: 24, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            className="px-6"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
          >

            {/* Card */}
            <View className="rounded-3xl bg-white mt-60 p-10">

              {/* X close button */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Welcome')}
                className="absolute top-4 right-4 z-10"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>

              <Text className="text-center font-extrabold text-3xl text-black mb-8">Register</Text>

              {/* General error */}
              {errors.general ? (
                <View className="mb-4 rounded-md border border-red-400 bg-red-50 p-3">
                  <Text className="text-center text-sm text-red-700">{errors.general}</Text>
                </View>
              ) : null}

              {/* Full Name */}
              <View className="mb-6">
                <Text className="mb-1 text-lg font-medium text-black">Full Name</Text>
                <TextInput
                  className={`w-full rounded-md border px-4 py-2 mb-2 bg-white/80 text-black ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                  value={formData.name}
                  onChangeText={(v) => handleChange('name', v)}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {errors.name ? (
                  <Text className="mt-1 text-xs text-red-400">
                    {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                  </Text>
                ) : null}
              </View>

              {/* Email */}
              <View className="mb-6">
                <Text className="mb-1 text-lg font-medium text-black">Email Address</Text>
                <TextInput
                  className={`w-full rounded-md border px-4 py-2 mb-2 bg-white/80 text-black ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                  value={formData.email}
                  onChangeText={(v) => handleChange('email', v)}
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.email ? (
                  <Text className="mt-1 text-xs text-red-400">
                    {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                  </Text>
                ) : null}
              </View>

              {/* Password */}
              <View className="mb-6">
                <Text className="mb-1 text-lg font-medium text-black">Password</Text>
                <View className={`flex-row items-center rounded-md border bg-white/80 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}>
                  <TextInput
                    className="flex-1 px-4 py-2 text-black"
                    value={formData.password}
                    onChangeText={(v) => handleChange('password', v)}
                    placeholder="Enter your password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={scrollToEnd}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pr-3">
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text className="mt-1 text-xs text-red-400">
                    {Array.isArray(errors.password) ? errors.password[0] : errors.password}
                  </Text>
                ) : null}
              </View>

              {/* Confirm Password */}
              <View className="mb-6">
                <Text className="mb-1 text-lg font-medium text-black">Confirm Password</Text>
                <View className={`flex-row items-center rounded-md mb-4 border bg-white/80 ${errors.password_confirmation ? 'border-red-400' : 'border-gray-300'}`}>
                  <TextInput
                    className="flex-1 px-4 py-2 text-black"
                    value={formData.password_confirmation}
                    onChangeText={(v) => handleChange('password_confirmation', v)}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    onFocus={scrollToEnd}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="pr-3">
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
                {errors.password_confirmation ? (
                  <Text className="mt-1 text-xs text-red-400">
                    {Array.isArray(errors.password_confirmation) ? errors.password_confirmation[0] : errors.password_confirmation}
                  </Text>
                ) : null}
              </View>



              {/* Submit */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className="rounded-full py-4 items-center"
                style={{ backgroundColor: '#f8b200', width: 150, alignSelf: 'center' }}
              >
                {isSubmitting
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text className="text-center font-bold text-white text-lg">Sign Up</Text>
                }
              </TouchableOpacity>

              {/* Login link */}
              <View className="mt-6 flex-row justify-center">
                <Text className="text-lg text-black mb-1">Already have an account? </Text>
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
