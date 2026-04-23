import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import SaveProfileModal from '../../components/common/SaveProfileModal';
import { showAuditToast, showProfileSuccessToast, showProfileErrorToast } from '../../utils/toastNotification';

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
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleCopyEmail = async () => {
    if (userData.email) {
      await Clipboard.setStringAsync(userData.email);
      showAuditToast('success', 'Email copied to clipboard');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSavePress = () => {
    // Bug #12 Fix: Validate password fields BEFORE opening modal
    if (formData.oldPassword || formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        showAuditToast('error', 'Passwords do not match');
        return;
      }
      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        showAuditToast('error', passwordError);
        return;
      }
      if (!formData.oldPassword) {
        showAuditToast('error', 'Please enter your current password');
        return;
      }
    }
    setShowSaveModal(true);
  };

  const confirmSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      let updated = false;

      // Update profile name
      if (formData.name.trim() && formData.name !== userData.name) {
        await client.put('/api/user/profile', { name: formData.name.trim() });
        updated = true;
      }

      // Change password if provided (validation already passed in handleSavePress)
      if (formData.oldPassword && formData.newPassword) {
        await client.post('/api/change-password', {
          current_password: formData.oldPassword,
          password: formData.newPassword,
          password_confirmation: formData.confirmPassword,
        });
        updated = true;
      }

      if (updated) {
        setShowSaveModal(false);
        showProfileSuccessToast('updated');
        navigation.goBack();
      } else {
        setShowSaveModal(false);
        navigation.goBack();
      }
    } catch (err) {
      setShowSaveModal(false);
      showProfileErrorToast('updated');
      // Still show the specific error message if available for debugging/user info
      if (err.response?.data?.message) {
        showAuditToast('error', err.response.data.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setShowSaveModal(false);
    showProfileSuccessToast('discarded');
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-shrink-0 bg-white">
        <HomeHeader
          categories={[]}
          onCategorySelect={() => {}}
          navigation={navigation}
        />
        <View style={{ height: 2, backgroundColor: '#f39c12' }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Account Settings Header */}
        <View className="flex-row items-center px-6 py-5 bg-white relative justify-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="absolute left-6 z-10 p-2 -ml-2">
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text className="text-[26px] font-bold text-gray-900 tracking-tight">Account Settings</Text>
        </View>

        {/* Main Content */}
        <ScrollView
          className="flex-1 bg-white"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Name Field */}
          <View className="mb-6">
            <Text className="text-[14px] font-medium text-gray-800 mb-2">Name</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 bg-white"
              placeholder="Enter Name"
              placeholderTextColor="#cbd5e1"
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              style={{ fontSize: 16 }}
            />
          </View>

          {/* Email Field (Read Only) */}
          <View className="mb-6">
            <Text className="text-[14px] font-medium text-gray-800 mb-2">Email</Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5">
              <Text className="flex-1 text-gray-500" style={{ fontSize: 16 }}>
                {userData.email || 'No email provided'}
              </Text>
              {userData.email && (
                <TouchableOpacity onPress={handleCopyEmail} className="ml-2 p-1">
                  <Ionicons name="copy-outline" size={20} color="#0ea5e9" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Old Password Field */}
          <View className="mb-6">
            <Text className="text-[14px] font-medium text-gray-800 mb-2">Old Password</Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl bg-white px-4">
              <TextInput
                className="flex-1 py-3.5 text-gray-900"
                placeholder="Enter your password"
                placeholderTextColor="#cbd5e1"
                secureTextEntry={!showOldPassword}
                value={formData.oldPassword}
                onChangeText={(value) => handleChange('oldPassword', value)}
                style={{ fontSize: 16 }}
              />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} className="p-2">
                <Ionicons name={showOldPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password Field */}
          <View className="mb-6">
            <Text className="text-[14px] font-medium text-gray-800 mb-2">New Password</Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl bg-white px-4">
              <TextInput
                className="flex-1 py-3.5 text-gray-900"
                placeholder="Enter your password"
                placeholderTextColor="#cbd5e1"
                secureTextEntry={!showNewPassword}
                value={formData.newPassword}
                onChangeText={(value) => handleChange('newPassword', value)}
                style={{ fontSize: 16 }}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} className="p-2">
                <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm New Password Field */}
          <View className="mb-8">
            <Text className="text-[14px] font-medium text-gray-800 mb-2">Confirm New Password</Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl bg-white px-4">
              <TextInput
                className="flex-1 py-3.5 text-gray-900"
                placeholder="Enter your password"
                placeholderTextColor="#cbd5e1"
                secureTextEntry={!showConfirmPassword}
                value={formData.confirmPassword}
                onChangeText={(value) => handleChange('confirmPassword', value)}
                style={{ fontSize: 16 }}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-2">
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="items-center px-6 mt-4">
            <TouchableOpacity 
              onPress={handleSavePress} 
              disabled={isSaving}
              className="w-2/3   bg-[#0ea5e9] rounded-full py-4 items-center justify-center mb-4"
            >
              <Text className="text-white text-[17px] font-semibold">
                Update Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              disabled={isSaving}
              className="w-full py-2 items-center justify-center"
            >
              <Text className="text-[#0ea5e9] text-[17px] font-medium">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNavigation navigation={navigation} activeTab="Profile" />
      
      <SaveProfileModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={confirmSave}
        onDiscard={handleDiscard}
        isSaving={isSaving}
      />
    </View>
  );
}
