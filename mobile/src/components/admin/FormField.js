import React from 'react';
import { View, Text, TextInput } from 'react-native';

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
  showCounter = false,
  error,
  ...props
}) {
  const isOverLimit = maxLength && value.length > maxLength;

  return (
    <View className="mb-5">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-semibold text-gray-800">{label}</Text>
        {showCounter && maxLength && (
          <Text className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
      <TextInput
        className={`border ${error ? 'border-red-300' : 'border-gray-200'} rounded-lg px-3 py-3 text-sm text-gray-800`}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#ccc"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        maxLength={maxLength}
        {...props}
      />
      {error && (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}
