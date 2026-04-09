import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../styles/colors';

export default function TextFormatToolbar({ onFormatApply }) {
  const [activeFormat, setActiveFormat] = useState('Body');
  const [selectedStyles, setSelectedStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });

  const formats = ['Title', 'Heading', 'Subheading', 'Body', 'Monospaced'];
  
  const styles = [
    { key: 'bold', icon: 'format-bold', label: 'B' },
    { key: 'italic', icon: 'format-italic', label: 'I' },
    { key: 'underline', icon: 'format-underline', label: 'U' },
    { key: 'strikethrough', icon: 'format-strikethrough', label: 'S' },
  ];

  const alignments = [
    { key: 'left', icon: 'format-align-left' },
    { key: 'center', icon: 'format-align-center' },
    { key: 'right', icon: 'format-align-right' },
    { key: 'justify', icon: 'format-align-justify' },
  ];

  const handleFormatChange = (format) => {
    setActiveFormat(format);
    onFormatApply({ type: 'format', value: format });
  };

  const handleStyleToggle = (styleKey) => {
    const newStyles = {
      ...selectedStyles,
      [styleKey]: !selectedStyles[styleKey],
    };
    setSelectedStyles(newStyles);
    onFormatApply({ type: 'style', key: styleKey, value: newStyles[styleKey] });
  };

  const handleAlignment = (alignment) => {
    onFormatApply({ type: 'alignment', value: alignment });
  };

  return (
    <View style={{ backgroundColor: colors.primary }}>
      {/* Format Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2 py-2">
        <View className="flex-row gap-2">
          {formats.map((format) => (
            <TouchableOpacity
              key={format}
              onPress={() => handleFormatChange(format)}
              className="px-3 py-1 rounded"
              style={{
                backgroundColor: activeFormat === format ? '#ffffff' : 'rgba(255,255,255,0.2)',
              }}
            >
              <Text
                className={`font-semibold text-xs ${
                  activeFormat === format ? 'text-gray-800' : 'text-white'
                }`}
              >
                {format}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Style and Alignment Buttons */}
      <View className="flex-row gap-2 px-2 py-2">
        {/* Text Styles */}
        <View className="flex-row bg-white rounded p-1 gap-1 flex-1">
          {styles.map((style) => (
            <TouchableOpacity
              key={style.key}
              onPress={() => handleStyleToggle(style.key)}
              className="flex-1 items-center py-1 rounded"
              style={{
                backgroundColor: selectedStyles[style.key] ? colors.primary + '20' : '#ffffff',
              }}
            >
              <Text
                className="font-bold text-sm text-gray-800"
              >
                {style.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alignment Buttons */}
        <View className="flex-row bg-white rounded p-1 gap-1 flex-1">
          {alignments.map((align) => (
            <TouchableOpacity
              key={align.key}
              onPress={() => handleAlignment(align.key)}
              className="flex-1 items-center py-1"
            >
              <MaterialCommunityIcons
                name={align.icon}
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
