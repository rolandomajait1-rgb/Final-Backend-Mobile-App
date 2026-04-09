import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminMenuCard({ icon, title, onPress, color = '#FFB800' }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl px-6 py-8 items-center border border-gray-300 shadow-sm active:opacity-70"
    >
      <MaterialCommunityIcons
        name={icon}
        size={40}
        color={color}
        style={{ marginBottom: 12 }}
      />
      <Text className="text-gray-600 font-semibold text-center text-base">
        {title}
      </Text>
    </TouchableOpacity>
  );
}
