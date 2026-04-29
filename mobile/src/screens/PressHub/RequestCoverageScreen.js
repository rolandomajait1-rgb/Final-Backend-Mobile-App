import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Ionicons, Feather } from '@expo/vector-icons';
import client from '../../api/client';
import HomeHeader from '../homepage/HomeHeader';
import { ErrorMessage } from '../../components/common';
import BottomNavigation from '../../components/common/BottomNavigation';
import { useToast } from '../../context/ToastContext';

const RequestCoverageScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    eventName: '',
    purpose: '',
    location: '',
    dateTime: '',
    highlights: '',
    requesterName: '',
    designation: '',
    coordinator: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const isMountedRef = useRef(true);
  const { showToast } = useToast();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateDateTimeString = (currentDate) => {
    const formattedDate = currentDate.toLocaleDateString();
    const formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    handleChange('dateTime', `${formattedDate} ${formattedTime}`);
  };

  const onDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      setPickerMode('date');
      return;
    }
    
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios');
    setDate(currentDate);

    if (pickerMode === 'date') {
      if (Platform.OS === 'android') {
        setPickerMode('time');
        setShowPicker(true);
      } else {
        updateDateTimeString(currentDate);
      }
    } else {
      updateDateTimeString(currentDate);
      setPickerMode('date');
    }
  };

  const showDateTimePicker = () => {
    setPickerMode('date');
    setShowPicker(true);
  };

  const handleSubmit = async () => {
    const requiredFields = ['eventName', 'purpose', 'location', 'dateTime', 'requesterName', 'designation', 'email'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());

    if (missingFields.length > 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await client.post('/api/contact/request-coverage', {
        ...formData,
        contactEmail: formData.email, // Map email to contactEmail for backend
      });
      if (isMountedRef.current) {
        showToast('Request submitted successfully!', 'success');
        setTimeout(() => {
          if (isMountedRef.current) {
            navigation.goBack();
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Error requesting coverage:', err);
      const msg = err.response?.data?.message || 'Failed to submit request. Please try again.';
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
          onCategorySelect={() => {}}
          navigation={navigation}
          onSearch={() => {}}
          searchQuery=""
          isSearchScreen={true}
          enableSearch={false}
          onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
        />
      </View>

      {/* Header */}
      <View className="flex-row items-center px-5 py-4 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={26} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-center" style={{ fontSize: 20, fontWeight: 'bold', color: '#000', marginRight: 26 }}>
          Request Coverage
        </Text>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 100 }} showsVerticalScrollIndicator={false} enableOnAndroid={true} extraScrollHeight={20}>
          <>
            {/* NOTE Section */}
            <View className="mb-4">
              <Text style={{ fontSize: 11, color: "#374151", lineHeight: 16, textAlign: 'justify' }}>
                <Text style={{ fontWeight: "bold", color: "#000" }}>NOTE : </Text>
                Kindly complete and submit this form at least two weeks prior to the event.
              </Text>
            </View>

            {/* Form Fields */}
            {[
              { label: 'Name of the Event', field: 'eventName', placeholder: 'Enter event name...', multiline: false },
              { label: 'Purpose / Significance', field: 'purpose', placeholder: 'Enter purpose/significance here...', multiline: true },
              { label: 'Location', field: 'location', placeholder: 'Enter event location...', multiline: false },
              { label: 'Date and Time *', field: 'dateTime', placeholder: 'Select date and time', multiline: false, icon: 'calendar', isDate: true },
              { label: 'Event Highlights', field: 'highlights', placeholder: 'Enter the main highlights of the event...', multiline: false },
              { label: 'Full Name of Requestor', field: 'requesterName', placeholder: 'Enter your name here', multiline: false },
              { label: 'Designation', field: 'designation', placeholder: 'Enter your designation here', multiline: false },
              { label: 'Email Address', field: 'email', placeholder: 'Enter your email here', multiline: false, keyboardType: 'email-address' },
              { label: 'Organizer / Office Coordinator', field: 'coordinator', placeholder: "Enter Organizer's / Office Coordinator's name here.", multiline: false },
            ].map(({ label, field, placeholder, multiline, icon, isDate }) => (
              <View key={field} className="mb-5">
                <Text style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>
                  {label}
                </Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  {icon && (
                    <Feather
                      name={icon}
                      size={16}
                      color="#6B7280"
                      style={{ position: 'absolute', left: 14, zIndex: 1 }}
                    />
                  )}
                  {isDate ? (
                    <TouchableOpacity
                      onPress={showDateTimePicker}
                      disabled={isLoading}
                      style={{
                        borderColor: '#D1D5DB',
                        borderWidth: 1,
                        borderRadius: 6,
                        paddingHorizontal: icon ? 38 : 14,
                        paddingVertical: 14,
                        backgroundColor: '#fff',
                        justifyContent: 'center',
                        minHeight: 42,
                      }}
                    >
                      <Text style={{ color: formData[field] ? '#000' : '#9CA3AF', fontSize: 13 }}>
                        {formData[field] || placeholder}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TextInput
                      style={{
                        borderColor: '#D1D5DB',
                        borderWidth: 1,
                        borderRadius: 6,
                        paddingHorizontal: icon ? 38 : 14,
                        paddingVertical: multiline ? 10 : 10,
                        fontSize: 13,
                        color: '#000',
                        backgroundColor: '#fff',
                        minHeight: multiline ? 100 : 42,
                        textAlignVertical: multiline ? 'top' : 'center',
                      }}
                      placeholder={placeholder}
                      placeholderTextColor="#9CA3AF"
                      value={formData[field]}
                      onChangeText={(value) => handleChange(field, value)}
                      editable={!isLoading}
                      multiline={multiline}
                      keyboardType={field === 'email' ? 'email-address' : 'default'}
                      autoCapitalize={field === 'email' ? 'none' : 'sentences'}
                    />
                  )}
                </View>
              </View>
            ))}

            {showPicker && (
              <DateTimePicker
                value={date}
                mode={pickerMode}
                is24Hour={false}
                display="default"
                onChange={onDateChange}
              />
            )}

            {/* Error Message */}
            {error && (
              <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                {error}
              </Text>
            )}

            {/* Submit Button */}
            <View className="items-center mb-8">
              <TouchableOpacity
                style={{
                  backgroundColor: '#0ea5e9',
                  borderRadius: 24,
                  paddingVertical: 12,
                  paddingHorizontal: 40,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                  <Text style={{ color: 'white', fontWeight: '500', fontSize: 15 }}>
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
      </KeyboardAwareScrollView>
      <View className="flex-shrink-0">
        <BottomNavigation navigation={navigation} activeTab="PressHub" />
      </View>
    </View>
  );
};

export default RequestCoverageScreen;
