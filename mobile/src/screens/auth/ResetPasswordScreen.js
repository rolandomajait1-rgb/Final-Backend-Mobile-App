import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  ImageBackground, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from '../../api/client';

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
      const response = await axios.post('/api/reset-password', {
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
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground source={bg} className="flex-1" resizeMode="cover" blurRadius={4} style={{ opacity: 0.9 }}>
        <View className="absolute inset-0" style={{ backgroundColor: 'rgba(8, 30, 39, 0.63)' }} />

        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled" className="px-6 py-6">

              {/* Logo */}
              <View className="items-center mb-6">
                <Image source={logo} style={{ width: 260, height: 150, marginBottom: 14 }} resizeMode="contain" />
                <Image source={textlogo} style={{ width: 360, height: 54 }} resizeMode="contain" />
              </View>

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

                <Text className="text-center font-bold text-3xl text-black mb-6">Reset Password</Text>

                {successMessage !== '' && (
                  <View className="mb-4 rounded-md border border-green-400 bg-green-50 p-3">
                    <Text className="text-center text-sm text-green-700">{successMessage}</Text>
                  </View>
                )}

                {errors.general && (
                  <View className="mb-4 rounded-md border border-red-400 bg-red-50 p-3">
                    <Text className="text-center text-sm text-red-700">{errors.general}</Text>
                  </View>
                )}

                {/* Email (read-only) */}
                <View className="mb-4">
                  <Text className="mb-1 text-sm font-medium text-gray-700">Email Address</Text>
                  <TextInput
                    className="w-full rounded-md border border-gray-200 px-4 py-2 bg-gray-100 text-gray-500"
                    value={formData.email}
                    editable={false}
                  />
                </View>

                {/* New Password */}
                <View className="mb-4">
                  <Text className="mb-1 text-sm font-medium text-gray-700">New Password</Text>
                  <View className={`flex-row items-center rounded-md border bg-white ${errors.password ? 'border-red-400' : 'border-gray-300'}`}>
                    <TextInput
                      className="flex-1 px-4 py-2 text-gray-800"
                      value={formData.password}
                      onChangeText={(v) => handleChange('password', v)}
                      placeholder="Enter new password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pr-3">
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text className="mt-1 text-xs text-red-500">{errors.password[0]}</Text>}
                </View>

                {/* Confirm Password */}
                <View className="mb-6">
                  <Text className="mb-1 text-sm font-medium text-gray-700">Confirm New Password</Text>
                  <View className={`flex-row items-center rounded-md border bg-white ${errors.password_confirmation ? 'border-red-400' : 'border-gray-300'}`}>
                    <TextInput
                      className="flex-1 px-4 py-2 text-gray-800"
                      value={formData.password_confirmation}
                      onChangeText={(v) => handleChange('password_confirmation', v)}
                      placeholder="Confirm new password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
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
                  disabled={isLoading}
                  className="rounded-full py-4 items-center"
                  style={{ backgroundColor: '#f8b200' }}
                >
                  {isLoading
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text className="text-center font-bold text-white text-base">Reset Password</Text>
                  }
                </TouchableOpacity>

                {/* Back to login */}
                <View className="mt-6 flex-row justify-center">
                  <Text className="text-sm text-gray-600">Remember your password? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text className="text-sm text-blue-600">Sign in</Text>
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
