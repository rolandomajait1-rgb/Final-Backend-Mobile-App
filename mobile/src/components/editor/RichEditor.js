import React, { useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { RichEditor, actions } from 'react-native-pell-rich-editor';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../styles/colors';

const RichTextEditor = ({ value, onChange, height = 300 }) => {
  const richText = useRef();
  const [activeFormat, setActiveFormat] = useState('Body');
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });

  const formats = ['Title', 'Heading', 'Subheading', 'Body', 'Monospaced'];

  const handleFormatChange = (format) => {
    setActiveFormat(format);
    // Apply heading styles based on format using commandDOM
    if (format === 'Title') {
      richText.current?.commandDOM("document.execCommand('formatBlock', false, '<h1>')");
    } else if (format === 'Heading') {
      richText.current?.commandDOM("document.execCommand('formatBlock', false, '<h2>')");
    } else if (format === 'Subheading') {
      richText.current?.commandDOM("document.execCommand('formatBlock', false, '<h3>')");
    } else if (format === 'Body') {
      richText.current?.commandDOM("document.execCommand('formatBlock', false, '<p>')");
    } else if (format === 'Monospaced') {
      richText.current?.commandDOM("document.execCommand('formatBlock', false, '<pre>')");
    }
  };

  const applyStyle = (command, styleKey) => {
    richText.current?.commandDOM(`document.execCommand('${command}', false, null)`);
    // Toggle the active state
    setActiveStyles(prev => ({
      ...prev,
      [styleKey]: !prev[styleKey]
    }));
  };

  return (
    <View>
      {/* Custom Toolbar matching TextFormatToolbar design */}
      <View style={{ backgroundColor: colors.primary }}>
        {/* Format Tabs - First Row */}
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

        {/* Style and Alignment Buttons - Second Row */}
        <View className="flex-row gap-2 px-2 py-2">
          {/* Text Styles - Left Container */}
          <View className="flex-row bg-white rounded p-1 gap-1 flex-1">
            <TouchableOpacity
              onPress={() => applyStyle('bold', 'bold')}
              className="flex-1 items-center py-1 rounded"
              style={{
                backgroundColor: activeStyles.bold ? colors.primary + '20' : '#ffffff',
              }}
            >
              <Text className="font-bold text-sm text-gray-800">B</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => applyStyle('italic', 'italic')}
              className="flex-1 items-center py-1 rounded"
              style={{
                backgroundColor: activeStyles.italic ? colors.primary + '20' : '#ffffff',
              }}
            >
              <Text className="font-bold text-sm text-gray-800">I</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => applyStyle('underline', 'underline')}
              className="flex-1 items-center py-1 rounded"
              style={{
                backgroundColor: activeStyles.underline ? colors.primary + '20' : '#ffffff',
              }}
            >
              <Text className="font-bold text-sm text-gray-800">U</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => applyStyle('strikeThrough', 'strikethrough')}
              className="flex-1 items-center py-1 rounded"
              style={{
                backgroundColor: activeStyles.strikethrough ? colors.primary + '20' : '#ffffff',
              }}
            >
              <Text className="font-bold text-sm text-gray-800">S</Text>
            </TouchableOpacity>
          </View>

          {/* Alignment Buttons - Right Container */}
          <View className="flex-row bg-white rounded p-1 gap-1 flex-1">
            <TouchableOpacity
              onPress={() => applyStyle('justifyLeft')}
              className="flex-1 items-center py-1"
            >
              <MaterialCommunityIcons
                name="format-align-left"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => applyStyle('justifyCenter')}
              className="flex-1 items-center py-1"
            >
              <MaterialCommunityIcons
                name="format-align-center"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => applyStyle('justifyRight')}
              className="flex-1 items-center py-1"
            >
              <MaterialCommunityIcons
                name="format-align-right"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => applyStyle('justifyFull')}
              className="flex-1 items-center py-1"
            >
              <MaterialCommunityIcons
                name="format-align-justify"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Rich Text Editor */}
      <View style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
        height: height,
        marginTop: 8,
      }}>
        <RichEditor
          ref={richText}
          onChange={onChange}
          placeholder="Write your article content here..."
          initialContentHTML={value}
          useContainer={false}
          style={{
            backgroundColor: '#FFFFFF',
            flex: 1,
          }}
          editorStyle={{
            backgroundColor: '#FFFFFF',
            color: '#000000',
            placeholderColor: '#9CA3AF',
            contentCSSText: `
              font-size: 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              padding: 16px;
              color: #000000;
              line-height: 1.6;
              min-height: ${height - 40}px;
            `,
          }}
        />
      </View>
    </View>
  );
};

export default RichTextEditor;
