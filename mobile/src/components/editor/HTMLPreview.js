import React from 'react';
import { View, Text, ScrollView } from 'react-native';

const HTMLPreview = ({ html }) => {
  // Simple HTML to React Native component converter
  const renderHTML = (htmlString) => {
    if (!htmlString) return null;

    // Split by HTML tags and render accordingly
    const parts = [];
    let currentIndex = 0;
    const tagRegex = /<(\/?)(h[1-6]|p|strong|em|u|s|a|code|blockquote|ul|ol|li)([^>]*)>/gi;
    
    let match;
    const elements = [];
    let textBuffer = '';
    
    while ((match = tagRegex.exec(htmlString)) !== null) {
      // Add text before tag
      if (match.index > currentIndex) {
        textBuffer += htmlString.substring(currentIndex, match.index);
      }
      
      currentIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (currentIndex < htmlString.length) {
      textBuffer += htmlString.substring(currentIndex);
    }

    // For now, just display the raw HTML with basic formatting
    return (
      <Text className="text-gray-800 text-base leading-6">
        {htmlString.replace(/<[^>]+>/g, '')}
      </Text>
    );
  };

  return (
    <View className="border border-gray-300 rounded-2xl bg-white p-4">
      <View className="mb-2 pb-2 border-b border-gray-200">
        <Text className="text-sm font-semibold text-gray-600">Preview</Text>
      </View>
      <ScrollView style={{ maxHeight: 11000, overflow: 'scroll'}}>
        {renderHTML(html)}
      </ScrollView>
    </View>
  );
};

export default HTMLPreview;
