import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function ImageUploader({ image, onImageSelect, onImageRemove, label = 'Cover Image' }) {
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please enable media library access in settings');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    
    if (!result.canceled) {
      onImageSelect(result.assets[0]);
    }
  };

  return (
    <View className="mb-5">
      <Text className="text-sm font-semibold text-gray-800 mb-2">{label}</Text>
      <TouchableOpacity
        onPress={pickImage}
        className="border border-gray-200 rounded-xl items-center justify-center bg-white overflow-hidden"
        style={{ minHeight: 160 }}
      >
        {image ? (
          <View className="relative w-full">
            <Image
              source={{ uri: image.uri }}
              style={{ width: '100%', height: 160 }}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={onImageRemove}
              className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
            >
              <MaterialCommunityIcons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center py-10">
            <View className="border-2 border-dashed border-gray-300 rounded-xl p-5">
              <MaterialCommunityIcons name="upload-outline" size={32} color="#ccc" />
            </View>
            <Text className="text-gray-400 text-sm mt-3">Add {label.toLowerCase()}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
