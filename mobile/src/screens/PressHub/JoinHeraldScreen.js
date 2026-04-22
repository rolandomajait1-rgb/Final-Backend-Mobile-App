import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert,
  Image,
} from 'react-native';

import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import client from '../../api/client';
import HomeHeader from '../homepage/HomeHeader';
import { ErrorMessage } from '../../components/common';
import BottomNavigation from '../../components/common/BottomNavigation';

const JoinHeraldScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    courseYear: '',
    gender: '',
  });
  const [photo, setPhoto] = useState(null);           
  const [consentForm, setConsentForm] = useState(null); 
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
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
        setConsentForm({
          uri:      asset.uri,
          name:     asset.name,
          mimeType: asset.mimeType ?? 'application/pdf',
        });
      }
    } catch (_err) {
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.fullName.trim() || !formData.courseYear.trim() || !formData.gender.trim()) {
      setError('Please fill in all required fields (Name, Course & Year, Gender).');
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

      body.append('photo', {
        uri:  photo.uri,
        name: photo.name,
        type: photo.type,
      });

      body.append('consentForm', {
        uri:  consentForm.uri,
        name: consentForm.name,
        type: consentForm.mimeType,
      });

      await client.post('/api/contact/join-herald', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsSubmitted(true);
      setTimeout(() => navigation.goBack(), 2500);
    } catch (err) {
      console.error('Error joining Herald:', err);
      const msg = err.response?.data?.message || 'Failed to submit application. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
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
          <Ionicons name="arrow-back-outline" size={26} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-center" style={{ fontSize: 20, fontWeight: 'bold', color: '#000', marginRight: 26 }}>
          Join The Herald
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {isSubmitted ? (
          <View className="flex-1 items-center justify-center py-16">
            <Ionicons name="checkmark-circle" size={100} color="#0ea5e9" />
            <Text className="text-[#0ea5e9] font-semibold text-center mt-4 text-lg">
              Application Submitted!{"\n"}We&apos;ll be in touch soon.
            </Text>
          </View>
        ) : (
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
                onPress={() => Linking.openURL("https://laverdadherald.com/consent-form")}
                className="flex-row items-center mb-4"
              >
                <Text style={{ fontSize: 13, color: "#0ea5e9", fontWeight: "500", marginRight: 4 }}>
                  Download Consent Form
                </Text>
                <Feather name="download" size={16} color="#0ea5e9" />
              </TouchableOpacity>

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
                    <Feather name="file-text" size={32} color="#0ea5e9" style={{ marginBottom: 6 }} />
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
                  backgroundColor: "#0ea5e9", borderRadius: 24,
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
        )}
      </ScrollView>
      <BottomNavigation navigation={navigation} activeTab="PressHub" />
    </View>
  );
};

export default JoinHeraldScreen;
