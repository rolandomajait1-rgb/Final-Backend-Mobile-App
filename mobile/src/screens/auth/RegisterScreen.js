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

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.name) e.name = ['Full name is required'];
    if (!formData.email) e.email = ['Email is required'];
    else if (!formData.email.endsWith('@student.laverdad.edu.ph'))
      e.email = ['Only @student.laverdad.edu.ph emails are allowed'];
    if (!formData.password) e.password = ['Password is required'];
    else if (formData.password.length < 8) e.password = ['Password must be at least 8 characters'];
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
      try { await axios.get('/api/health', { timeout: 5000 }); } catch { /* cold start */ }
      // Register with extended timeout for slow servers
      await axios.post('/api/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      }, { timeout: 180000 });
      // Navigate to OTP verification screen for registration
      navigation.replace('VerifyRegistrationOTP', { email: formData.email });
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        setErrors({ general: 'Server is starting up. Please wait a moment and try again.' });
      } else if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
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
    <View className="flex-1 ">
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

              {/* Logo block — hidden when keyboard is open */}
              {!keyboardVisible && (
                <View className="items-center mb-6 mt-4">
                  <Image source={logo} style={{ width: 260, height: 150, marginBottom: 14 }} resizeMode="contain" />
                  <Image source={textlogo} style={{ width: 360, height: 54 }} resizeMode="contain" />
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

                <Text className="text-center font-extrabold text-3xl text-black mb-8">Register</Text>

                {/* Success */}
                {successMessage !== '' && (
                  <View className="mb-4 rounded-md border border-green-400 bg-green-50 p-3">
                    <Text className="text-center text-sm text-green-700">{successMessage}</Text>
                  </View>
                )}

                {/* General error */}
                {errors.general && (
                  <View className="mb-4 rounded-md border border-red-400 bg-red-50 p-3">
                    <Text className="text-center text-sm text-red-700">{errors.general}</Text>
                  </View>
                )}

                {/* Full Name */}
                <View className="mb-6">
                  <Text className="mb-1 text-lg font-medium text-gray-700">Full Name</Text>
                  <TextInput
                    className={`w-full rounded-md border px-4 py-2 bg-white text-gray-800 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                    value={formData.name}
                    onChangeText={(v) => handleChange('name', v)}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  {errors.name && <Text className="mt-1 text-xs text-red-500">{errors.name[0]}</Text>}
                </View>

                {/* Email */}
                <View className="mb-6">
                  <Text className="mb-1 text-lg font-medium text-gray-700">Email Address</Text>
                  <TextInput
                    className={`w-full rounded-md border px-4 py-2 bg-white text-gray-800 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                    value={formData.email}
                    onChangeText={(v) => handleChange('email', v)}
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {errors.email && <Text className="mt-1 text-xs text-red-500">{errors.email[0]}</Text>}
                </View>

                {/* Password */}
                <View className="mb-6">
                  <Text className="mb-1 text-lg font-medium text-gray-700">Password</Text>
                  <View className={`flex-row items-center rounded-md border bg-white ${errors.password ? 'border-red-400' : 'border-gray-300'}`}>
                    <TextInput
                      className="flex-1 px-4 py-2 text-gray-800"
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
                  {errors.password && <Text className="mt-1 text-xs text-red-500">{errors.password[0]}</Text>}
                </View>

                {/* Confirm Password */}
                <View className="mb-6">
                  <Text className="mb-1 text-lg font-medium text-gray-700">Confirm Password</Text>
                  <View className={`flex-row items-center rounded-md mb-4 border bg-white ${errors.password_confirmation ? 'border-red-400' : 'border-gray-300'}`}>
                    <TextInput
                      className="flex-1 px-4 py-2 text-gray-800"
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
                  {errors.password_confirmation && <Text className="mt-1 text-xs text-red-500">{errors.password_confirmation[0]}</Text>}
                </View>

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-full py-4 items-center"
                  style={{ backgroundColor: '#f8b200' }}
                >
                  {isSubmitting
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text className="text-center font-bold text-white text-lg ">Sign Up</Text>
                  }
                </TouchableOpacity>

                {/* Login link */}
                <View className="mt-6 flex-row justify-center">
                  <Text className="text-lg text-gray-600">Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text className="text-lg text-blue-600">Log in</Text>
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
