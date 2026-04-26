import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import colors from '../../styles/colors';

const RichTextEditor = ({ value, onChange, height = 300 }) => {
  const richText = useRef();

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={[styles.toolbarContainer, { backgroundColor: colors.primary }]}>
        {/* Format Tabs - FIRST ROW (TAAS) */}
        <RichToolbar
          editor={richText}
          actions={[
            actions.heading1,
            actions.heading2,
            actions.heading3,
            actions.setParagraph,
            actions.code,
          ]}
          iconTint="#ffffff"
          selectedIconTint="#0e7490"
          selectedButtonStyle={{ backgroundColor: '#fbbf24' }}
          style={styles.richToolbar}
          iconMap={{
            [actions.heading1]: ({ tintColor }) => <Text style={{ color: tintColor, fontWeight: 'bold', fontSize: 16 }}>H1</Text>,
            [actions.heading2]: ({ tintColor }) => <Text style={{ color: tintColor, fontWeight: 'bold', fontSize: 16 }}>H2</Text>,
            [actions.heading3]: ({ tintColor }) => <Text style={{ color: tintColor, fontWeight: 'bold', fontSize: 16 }}>H3</Text>,
            [actions.setParagraph]: ({ tintColor }) => <Text style={{ color: tintColor, fontWeight: 'bold', fontSize: 14 }}>Body</Text>,
            [actions.code]: ({ tintColor }) => <Text style={{ color: tintColor, fontWeight: 'bold', fontSize: 14 }}>Mono</Text>,
          }}
        />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />

        {/* Main Formatting - SECOND ROW (BABA) */}
        <RichToolbar
          editor={richText}
          actions={[
            actions.setBold,
            actions.setItalic,
            actions.setUnderline,
            actions.setStrikethrough,
            'separator',
            actions.alignLeft,
            actions.alignCenter,
            actions.alignRight,
            'separator',
            actions.insertBulletsList,
            actions.insertOrderedList,
          ]}
          iconTint="#ffffff"
          selectedIconTint="#0e7490"
          selectedButtonStyle={{ backgroundColor: '#fbbf24' }}
          style={styles.richToolbarBottom}
        />
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
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  richToolbar: {
    backgroundColor: colors.primary,
    borderTopWidth: 0,
    paddingVertical: 4,
    paddingHorizontal: 20, // Increased from 16 to 24 for gap-4 effect
    minHeight: 40,
  },
  richToolbarBottom: {
    backgroundColor: colors.primary,
    borderTopWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 4, // Minimal side padding for bottom row
    minHeight: 40,
  },
  editorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  editor: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
});

export default RichTextEditor;
