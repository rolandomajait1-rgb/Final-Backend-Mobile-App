import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TagInput({ tags, onTagsChange, maxTags = 10 }) {
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    
    if (tags.length >= maxTags) {
      Alert.alert('Maximum Tags', `You can only add up to ${maxTags} tags`);
      return;
    }
    
    if (tags.includes(trimmed)) {
      Alert.alert('Duplicate Tag', 'This tag already exists');
      return;
    }
    
    onTagsChange([...tags, trimmed]);
    setTagInput('');
  };

  const removeTag = (index) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  return (
    <View className="mb-5">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-semibold text-gray-800">Tag/s</Text>
        <Text className="text-xs text-gray-400">{tags.length}/{maxTags}</Text>
      </View>
      <View className="flex-row items-center border border-gray-200 rounded-lg px-3 py-2">
        <Text className="text-gray-400 text-sm mr-1"># </Text>
        <TextInput
          className="flex-1 text-sm text-gray-800"
          placeholder="hashtag"
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={addTag}
          placeholderTextColor="#ccc"
          editable={tags.length < maxTags}
        />
        <TouchableOpacity onPress={addTag} disabled={tags.length >= maxTags}>
          <MaterialCommunityIcons 
            name="plus" 
            size={22} 
            color={tags.length >= maxTags ? '#ccc' : '#3b82f6'} 
          />
        </TouchableOpacity>
      </View>
      {tags.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {tags.map((tag, index) => (
            <View
              key={index}
              className="flex-row items-center bg-blue-50 rounded-full px-3 py-1.5 border border-blue-200"
            >
              <Text className="text-sm text-blue-700">#{tag}</Text>
              <TouchableOpacity onPress={() => removeTag(index)} className="ml-1.5">
                <MaterialCommunityIcons name="close" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
