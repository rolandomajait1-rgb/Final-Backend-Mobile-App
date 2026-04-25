import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, useWindowDimensions } from 'react-native';

export default function Button({ title, onPress, className, textClassName, disabled = false, loading = false }) {
  const { width } = useWindowDimensions();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`bg-[#215878ff] ${width < 375 ? 'py-2 px-4' : 'py-3 px-6'} rounded-md items-center justify-center ${(disabled || loading) ? 'opacity-50' : ''} ${className || ''}`}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color="#ffffff" size="small" />
        : <Text className={`${width < 375 ? 'text-sm' : 'text-base'} text-white font-semibold ${textClassName || ''}`}>{title}</Text>
      }
    </TouchableOpacity>
  );
}
