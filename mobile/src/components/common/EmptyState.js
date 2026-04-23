import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EmptyState({ 
  icon = "document-text-outline", 
  title = "Nothing to see here", 
  message = "Check back later for new updates.",
  color = "#9CA3AF" 
}) {
  return (
    <View className="flex-1 items-center justify-center py-12 px-6">
      <View className="bg-gray-100 p-6 rounded-full mb-4">
        <Ionicons name={icon} size={48} color={color} />
      </View>
      <Text className="text-xl font-bold text-gray-800 text-center mb-2">
        {title}
      </Text>
      <Text className="text-base text-gray-500 text-center">
        {message}
      </Text>
    </View>
  );
}
