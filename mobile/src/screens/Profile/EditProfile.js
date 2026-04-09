import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { colors } from '../../styles';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';

const validatePassword = (password) => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }

  return null;
};

export default function EditProfile({ navigation, route }) {
  const userData = route?.params?.user || {};
  
  const [formData, setFormData] = useState({
    name: userData.name || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      let updated = false;

      // Update profile name
      if (formData.name.trim() && formData.name !== userData.name) {
        await client.put('/api/user/profile', { name: formData.name.trim() });
        updated = true;
      }

      // Change password if provided
      if (formData.oldPassword && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          setIsSaving(false);
          return;
        }

        const passwordError = validatePassword(formData.newPassword);
        if (passwordError) {
          Alert.alert('Error', passwordError);
          setIsSaving(false);
          return;
        }

        await client.post('/api/change-password', {
          current_password: formData.oldPassword,
          password: formData.newPassword,
          password_confirmation: formData.confirmPassword,
        });
        updated = true;
      }

      if (updated) {
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* HomeHeader */}
        <HomeHeader
          categories={[]}
          onCategorySelect={() => {}}
          navigation={navigation}
        />

        {/* Account Settings Header */}
        <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-gray-900">Account Settings</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text className="text-lg font-semibold" style={{ color: isSaving ? '#ccc' : '#FFB800' }}>
              {isSaving ? 'Saving...' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView
          className="flex-1 bg-white"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Field */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-2">Name</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              placeholder="Enter Name"
              placeholderTextColor="#D1D5DB"
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              style={{ fontSize: 16 }}
            />
          </View>

          {/* Old Password Field */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-2">Old Password</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              placeholder="Enter your password"
              placeholderTextColor="#D1D5DB"
              secureTextEntry
              value={formData.oldPassword}
              onChangeText={(value) => handleChange('oldPassword', value)}
              style={{ fontSize: 16 }}
            />
          </View>

          {/* New Password Field */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-2">New Password</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              placeholder="Enter your password"
              placeholderTextColor="#D1D5DB"
              secureTextEntry
              value={formData.newPassword}
              onChangeText={(value) => handleChange('newPassword', value)}
              style={{ fontSize: 16 }}
            />
          </View>

          {/* Confirm New Password Field */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-2">Confirm New Password</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
              placeholder="Enter your password"
              placeholderTextColor="#D1D5DB"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
              style={{ fontSize: 16 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNavigation navigation={navigation} activeTab="Profile" />
    </SafeAreaView>
  );
}
