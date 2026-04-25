import React from 'react';
import { View, Text, TextInput, useWindowDimensions } from 'react-native';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  className,
  ...props
}) {
  const { width } = useWindowDimensions();
  return (
    <View className={`${width < 375 ? 'mb-3' : 'mb-4'} ${className || ''}`}>
      {label && <Text className={`${width < 375 ? 'text-xs' : 'text-sm'} font-medium text-[#555555] mb-1`}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        secureTextEntry={secureTextEntry}
        className={`border ${error ? 'border-[#e74c3c]' : 'border-[#e0e0e0]'} rounded-md ${width < 375 ? 'py-1.5 px-3' : 'py-2 px-4'} ${width < 375 ? 'text-sm' : 'text-base'} text-[#1a1a1a] bg-white`}
        {...props}
      />
      {error && <Text className={`${width < 375 ? 'text-xs' : 'text-xs'} text-[#e74c3c] mt-1`}>{error}</Text>}
    </View>
  );
}
