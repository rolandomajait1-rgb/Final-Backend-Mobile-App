import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

export default function Button({ title, onPress, className, textClassName, disabled = false, loading = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`bg-[#215878ff] py-3 px-6 rounded-md items-center justify-center ${(disabled || loading) ? 'opacity-50' : ''} ${className || ''}`}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color="#ffffff" size="small" />
        : <Text className={`text-white text-base font-semibold ${textClassName || ''}`}>{title}</Text>
      }
    </TouchableOpacity>
  );
}
