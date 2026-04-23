import { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
  Linking,
} from 'react-native';

import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import client from '../../api/client';
import { BASE_URL } from '../../constants/config';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import { ErrorMessage } from '../../components/common';
import { colors } from '../../styles';
import { useToast } from '../../context/ToastContext';

const JoinHeraldScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    courseYear: '',
    gender: '',
    email: '',
  });
  const [photo, setPhoto] = useState(null);           
  const [consentForm, setConsentForm] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const isMountedRef = useRef(true);
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleDownloadConsentForm = async () => {
    try {
      // Google Drive link to the parental consent form
      // Replace this with your actual Google Drive link
      const googleDriveLink = 'https://drive.google.com/drive/folders/1YvBuoCi5IlB6IKOlBw9EB-lag_KPbL8g?usp=drive_link';
      
      // Check if the link is valid
      if (!googleDriveLink.includes('drive.google.com')) {
        Alert.alert(
          'Configuration Error',
          'Google Drive link is not configured. Please contact support.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Open the Google Drive link in browser
      const canOpen = await Linking.canOpenURL(googleDriveLink);
      if (canOpen) {
        await Linking.openURL(googleDriveLink);
      } else {
        Alert.alert(
          'Cannot Open Link',
          'Unable to open the consent form link. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Error opening consent form:', err);
      Alert.alert(
        'Error',
        'Unable to open consent form. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable photo library access in settings.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        
        // Check file size (5MB limit)
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Photo must be less than 5MB.');
          return;
        }
        
        setPhoto({
          uri: asset.uri,
          name: asset.fileName ?? `photo-${Date.now()}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        });
      }
    } catch (_err) {
      Alert.alert('Error', 'Failed to pick photo. Please try again.');
    }
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        
        // Check file size (10MB limit for consent form)
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Consent form must be less than 10MB.');
          return;
        }
        
        // Validate file type
        const fileType = asset.mimeType ?? 'application/pdf';
        if (!fileType.includes('pdf') && !fileType.includes('image')) {
          Alert.alert('Invalid File Type', 'Please upload a PDF or image file.');
          return;
        }
        
        setConsentForm({
          uri: asset.uri,
          name: asset.name,
          type: fileType,
        });
      }
    } catch (_err) {
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.fullName.trim() || !formData.courseYear.trim() || !formData.gender.trim() || !formData.email.trim()) {
      setError('Please fill in all required fields (Name, Course & Year, Gender, Email).');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    
    if (!photo) {
      setError('Please upload your 1x1 photo.');
      return;
    }
    if (!consentForm) {
      setError('Please upload your filled consent form.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('fullName',   formData.fullName.trim());
      body.append('courseYear', formData.courseYear.trim());
      body.append('gender',     formData.gender);
      body.append('email',      formData.email.trim());

      body.append('photo', {
        uri:  photo.uri,
        name: photo.name,
        type: photo.type,
      });

      body.append('consentForm', {
        uri:  consentForm.uri,
        name: consentForm.name,
        type: consentForm.type,
      });

      await client.post('/api/contact/join-herald', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (isMountedRef.current) {
        showToast('Application submitted successfully!', 'success');
        setTimeout(() => {
          if (isMountedRef.current) {
            navigation.goBack();
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Error joining Herald:', err);
      let msg = 'Failed to submit application. Please try again.';
      
      if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
        msg = 'Network error. Please check your connection and try again.';
      } else if (err.response?.status === 422) {
        msg = err.response?.data?.message || 'Please check your form inputs.';
      } else if (err.response?.status === 413) {
        msg = 'Files are too large. Please use smaller files.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      
      if (isMountedRef.current) {
        setError(msg);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#ffffff' }}>
      <View className="flex-shrink-0">
        <HomeHeader
          categories={[]}
          selectedCategory={null}
          onCategorySelect={() => {}}
          error={null}
          ErrorMessage={ErrorMessage}
          showCategories={false}
          navigation={navigation}
        />
      </View>

      {/* Header */}
      <View className="flex-row items-center px-5 py-4 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={26} color={colors.text.primary} />
        </TouchableOpacity>
        <Text className="flex-1 text-center" style={{ fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginRight: 26 }}>
          Join The Herald
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <>
            {/* Data Privacy Notice */}
            <View className="mb-4">
              <Text style={{ fontSize: 11, color: "#374151", lineHeight: 16, textAlign: 'justify' }}>
                <Text style={{ fontWeight: "bold", color: "#000" }}>NOTE : </Text>
                Data Privacy Notice: In compliance with data privacy laws such as, but not limited to, Republic Act No. 10173 (Data Privacy Act of 2012) and its implementing rules and regulations, we within the Organization of La Verdad Christian College (LVCC), collect and process your personal information in this membership form for personal information purposes only, keeping them securely and with confidentiality using our organizational, technical, and physical security measures, and retain them in accordance with our retention policy. We don&apos;t share them to any external group without your consent, unless otherwise stated in our privacy notice. You have the right to be informed, to object, to access, to rectify, to erase or to block the processing of your personal information, as well as your right to data portability, to file a complaint and be entitled to damages for violation of your rights under this data privacy.
              </Text>
              <Text style={{ fontSize: 11, color: "#374151", lineHeight: 16, textAlign: 'justify', marginTop: 12 }}>
                For your data privacy inquiries, you may reach our Data Protection Officer through: dpo@laverdad.edu.ph
              </Text>
            </View>

            {/* Horizontal Divider */}
            <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 14, marginHorizontal: 12 }} />

            {/* Personal Information */}
            <Text style={{ fontSize: 15, fontWeight: "bold", color: "#000", marginBottom: 16 }}>
              Personal Information
            </Text>

            {/* Full Name */}
            <View className="mb-5">
              <Text style={{ fontSize: 14, color: "#374151", marginBottom: 6 }}>
                Name (Surname, Given Name, Middle Name)
              </Text>
              <TextInput
                style={{
                  borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 6,
                  paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#000', backgroundColor: '#fff'
                }}
                placeholder="Enter name here."
                placeholderTextColor="#9CA3AF"
                value={formData.fullName}
                onChangeText={(v) => handleChange("fullName", v)}
                editable={!isLoading}
              />
            </View>

            {/* Course & Year */}
            <View className="mb-5">
              <Text style={{ fontSize: 14, color: "#374151", marginBottom: 6 }}>
                Course & Year
              </Text>
              <TextInput
                style={{
                  borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 6,
                  paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#000', backgroundColor: '#fff'
                }}
                placeholder="Enter course & year level"
                placeholderTextColor="#9CA3AF"
                value={formData.courseYear}
                onChangeText={(v) => handleChange("courseYear", v)}
                editable={!isLoading}
              />
            </View>

            {/* Email Address */}
            <View className="mb-5">
              <Text style={{ fontSize: 14, color: "#374151", marginBottom: 6 }}>
                Email Address
              </Text>
              <TextInput
                style={{
                  borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 6,
                  paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#000', backgroundColor: '#fff'
                }}
                placeholder="Enter email address"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                onChangeText={(v) => handleChange("email", v)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Gender */}
            <View className="mb-6">
              <Text style={{ fontSize: 14, color: "#374151", marginBottom: 8 }}>
                Gender
              </Text>
              <View className="flex-row gap-6">
                {["Male", "Female"].map((g) => {
                  const isSelected = formData.gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      className="flex-row items-center"
                      onPress={() => handleChange("gender", g)}
                      disabled={isLoading}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          width: 18, height: 18, borderRadius: 9, borderWidth: 1.5,
                          borderColor: isSelected ? "#000" : "#D1D5DB",
                          marginRight: 8,
                          alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {isSelected && (
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#000" }} />
                        )}
                      </View>
                      <Text style={{ fontSize: 13, color: "#374151" }}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 1x1 Photo */}
            <View className="mb-6">
              <Text style={{ fontSize: 14, color: "#374151", marginBottom: 8 }}>
                1x1 Photo
              </Text>
              <TouchableOpacity
                style={{
                  borderColor: '#D1D5DB',
                  borderWidth: 1, borderRadius: 8,
                  height: 110, alignItems: "center", justifyContent: "center",
                  backgroundColor: "#fff",
                }}
                onPress={handlePhotoUpload}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {photo ? (
                  <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                ) : (
                  <>
                    <Feather name="image" size={32} color="#6B7280" style={{ marginBottom: 6 }} />
                    <Text style={{ fontSize: 11, color: "#9CA3AF" }}>upload image</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Consent Form */}
            <View className="mb-8">
              <Text style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>
                Filled Consent Form
              </Text>
              <TouchableOpacity
                onPress={handleDownloadConsentForm}
                className="flex-row items-center mb-4"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color={colors.status.info} />
                ) : (
                  <>
                    <Text style={{ fontSize: 13, color: colors.status.info, fontWeight: "500", marginRight: 4 }}>
                      Download Consent Form
                    </Text>
                    <Feather name="download" size={16} color={colors.status.info} />
                  </>
                )}
              </TouchableOpacity>

              {/* Consent Form Details */}
              <View style={{ backgroundColor: '#FEF3C7', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FCD34D' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#92400E', marginBottom: 8 }}>
                  Parental Consent Form Requirements:
                </Text>
                <Text style={{ fontSize: 11, color: '#78350F', lineHeight: 16, marginBottom: 6 }}>
                  Upon approval, members will be required to:
                </Text>
                <View style={{ marginLeft: 8 }}>
                  <Text style={{ fontSize: 11, color: '#78350F', lineHeight: 16, marginBottom: 4 }}>
                    • Attend regular training sessions and editorial meetings
                  </Text>
                  <Text style={{ fontSize: 11, color: '#78350F', lineHeight: 16, marginBottom: 4 }}>
                    • Participate in journalistic activities (writing, editing, photography, broadcasting, competitions)
                  </Text>
                  <Text style={{ fontSize: 11, color: '#78350F', lineHeight: 16, marginBottom: 4 }}>
                    • Engage in special events (SAP Day, Journalism Summits, and other related activities)
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: '#78350F', lineHeight: 16, marginTop: 6, fontStyle: 'italic' }}>
                  Parent/Guardian must sign the downloaded form and upload it below.
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  borderColor: '#D1D5DB',
                  borderWidth: 1, borderRadius: 8,
                  height: 110, alignItems: "center", justifyContent: "center",
                  backgroundColor: "#fff",
                }}
                onPress={handleFileUpload}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {consentForm ? (
                  <>
                    <Feather name="file-text" size={32} color={colors.status.info} style={{ marginBottom: 6 }} />
                    <Text style={{ fontSize: 12, color: "#374151", textAlign: 'center', paddingHorizontal: 10 }}>{consentForm.name}</Text>
                  </>
                ) : (
                  <>
                    <View className="flex-row items-center justify-center mb-6">
                      {/* Using an upload icon to match the screenshot as closely as possible */}
                      <Feather name="upload" size={32} color="#6B7280" />
                    </View>
                    <Text style={{ fontSize: 11, color: "#9CA3AF" }}>upload file</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Error */}
            {error && (
              <Text style={{ color: "#ef4444", fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</Text>
            )}

            {/* Submit */}
            <View className="items-center mb-8">
              <TouchableOpacity
                style={{
                  backgroundColor: colors.status.info, borderRadius: 24,
                  paddingVertical: 12, paddingHorizontal: 40,
                  flexDirection: "row", alignItems: "center", justifyContent: "center",
                  opacity: isLoading ? 0.7 : 1,
                  minWidth: 140,
                }}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "500", fontSize: 15 }}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
      </ScrollView>
      <BottomNavigation navigation={navigation} activeTab="Home" />
    </View>
  );
};

export default JoinHeraldScreen;
