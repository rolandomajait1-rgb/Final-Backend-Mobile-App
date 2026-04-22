import React from 'react';
import { View, Text, TextInput } from 'react-native';

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
  return (
    <View className={`mb-4 ${className || ''}`}>
      {label && <Text className="text-[13px] font-medium text-[#555555] mb-1">{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        secureTextEntry={secureTextEntry}
        className={`border ${error ? 'border-[#e74c3c]' : 'border-[#e0e0e0]'} rounded-md py-2 px-4 text-[15px] text-[#1a1a1a] bg-white`}
        {...props}
      />
      {error && <Text className="text-[11px] text-[#e74c3c] mt-1">{error}</Text>}
    </View>
  );
}
