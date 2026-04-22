import React from 'react';
import { View, Text } from 'react-native';

export default function ErrorMessage({ message, className }) {
  if (!message) return null;
  return (
    <View className={`bg-[#fdecea] border-l-4 border-[#e74c3c] rounded p-2 my-2 ${className || ''}`}>
      <Text className="text-[#e74c3c] text-[13px]">{message}</Text>
    </View>
  );
}
