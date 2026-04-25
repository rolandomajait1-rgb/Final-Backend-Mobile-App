import React, { useRef, useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { RichEditor } from 'react-native-pell-rich-editor';
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
    // Toggle the state to reflect the action
    setActiveStyles(prev => ({
      ...prev,
      [styleKey]: !prev[styleKey]
    }));
  };

  const applyAlignment = (command) => {
    richText.current?.commandDOM(`document.execCommand('${command}', false, null)`);
  };

  const ToolButton = ({ onPress, isActive, children, style }) => (
    <TouchableOpacity
      onPress={onPress}
      className="items-center justify-center h-10 rounded-md"
      style={[{
        flex: 1,
        backgroundColor: isActive ? '#fef3c7' : 'transparent', // Light gold bg for active
      }, style]}
    >
      {children}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Custom Toolbar */}
      <View style={[styles.toolbarContainer, { backgroundColor: colors.primary }]}>
        {/* Format Tabs - First Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-3 py-2.5">
          <View className="flex-row gap-2 pr-6">
            {formats.map((format) => (
              <TouchableOpacity
                key={format}
                onPress={() => handleFormatChange(format)}
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: activeFormat === format ? '#ffffff' : 'rgba(255,255,255,0.15)',
                }}
              >
                <Text
                  className={`font-medium text-sm ${
                    activeFormat === format ? 'text-gray-900' : 'text-white'
                  }`}
                >
                  {format}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />

        {/* Style and Alignment Buttons - Second Row */}
        <View className="px-3 py-3">
          <View className="flex-row bg-white rounded-lg p-1 shadow-sm items-center w-full">
            
            {/* Text Styles */}
            <ToolButton onPress={() => applyStyle('bold', 'bold')} isActive={activeStyles.bold} style={{marginRight: 2}}>
              <Text className="font-bold text-base text-gray-800">B</Text>
            </ToolButton>
            <ToolButton onPress={() => applyStyle('italic', 'italic')} isActive={activeStyles.italic} style={{marginRight: 2}}>
              <Text className="italic font-bold text-base text-gray-800">I</Text>
            </ToolButton>
            <ToolButton onPress={() => applyStyle('underline', 'underline')} isActive={activeStyles.underline} style={{marginRight: 2}}>
              <Text className="underline font-bold text-base text-gray-800">U</Text>
            </ToolButton>
            <ToolButton onPress={() => applyStyle('strikeThrough', 'strikethrough')} isActive={activeStyles.strikethrough} style={{marginRight: 2}}>
              <Text className="line-through font-bold text-base text-gray-800">S</Text>
            </ToolButton>

            {/* Vertical Separator */}
            <View style={{ width: 1, height: 24, backgroundColor: '#E5E7EB', marginHorizontal: 2 }} />

            {/* Alignment Buttons */}
            <ToolButton onPress={() => applyAlignment('justifyLeft')} style={{marginLeft: 2, marginRight: 2}}>
              <MaterialCommunityIcons name="format-align-left" size={20} color={colors.primary} />
            </ToolButton>
            <ToolButton onPress={() => applyAlignment('justifyCenter')} style={{marginRight: 2}}>
              <MaterialCommunityIcons name="format-align-center" size={20} color={colors.primary} />
            </ToolButton>
            <ToolButton onPress={() => applyAlignment('justifyRight')} style={{marginRight: 2}}>
              <MaterialCommunityIcons name="format-align-right" size={20} color={colors.primary} />
            </ToolButton>
            <ToolButton onPress={() => applyAlignment('justifyFull')}>
              <MaterialCommunityIcons name="format-align-justify" size={20} color={colors.primary} />
            </ToolButton>

          </View>
        </View>
      </View>

      {/* Rich Text Editor */}
      <View style={[styles.editorContainer, { height }]}>
        <RichEditor
          ref={richText}
          onChange={onChange}
          placeholder="Write your article content here..."
          initialContentHTML={value}
          useContainer={false}
          style={styles.editor}
          editorStyle={{
            backgroundColor: '#FFFFFF',
            color: '#1a1a1a',
            placeholderColor: '#9CA3AF',
            contentCSSText: `
              font-size: 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              padding: 16px;
              color: #1a1a1a;
              line-height: 1.7;
              min-height: ${height - 40}px;
            `,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbarContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  editor: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
});

export default RichTextEditor;
