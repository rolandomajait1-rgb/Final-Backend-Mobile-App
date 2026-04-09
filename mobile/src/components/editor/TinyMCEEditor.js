import React, { useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const TinyMCEEditor = ({ value, onChange, height = 300 }) => {
  const webViewRef = useRef(null);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
      <style>
        body {
          margin: 0;
          padding: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        .tox-tinymce {
          border: none !important;
        }
      </style>
    </head>
    <body>
      <textarea id="editor">${value || ''}</textarea>
      <script>
        tinymce.init({
          selector: '#editor',
          height: ${height - 50},
          menubar: false,
          plugins: [
            'lists', 'link', 'code', 'table'
          ],
          toolbar: 'undo redo | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist | link | code',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; font-size: 14px; }',
          setup: function(editor) {
            editor.on('init', function() {
              editor.setContent(\`${value || ''}\`);
            });
            
            editor.on('change keyup', function() {
              const content = editor.getContent();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'content-change',
                content: content
              }));
            });
          }
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'content-change') {
        onChange(data.content);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff' }}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        onMessage={handleMessage}
        style={{ backgroundColor: 'transparent' }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#215878" />
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={true}
      />
    </View>
  );
};

export default TinyMCEEditor;
