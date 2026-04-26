import React, { useState, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

const HTMLRenderer = ({ html, className }) => {
  const [height, setHeight] = useState(500);

  // Reset height when html content changes so shorter content doesn't retain old, larger heights
  useEffect(() => {
    setHeight(500);
  }, [html]);

  const htmlContent = useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 15px;
            line-height: 1.6;
            color: #374151;
            padding: 16px;
            margin: 0;
            background: white;
            width: 100%;
            overflow-x: hidden;
          }
          p {
            margin-bottom: 1em;
            word-wrap: break-word;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 700;
            line-height: 1.3;
            color: #111827;
          }
          h1 { font-size: 1.75em; }
          h2 { font-size: 1.4em; }
          h3 { font-size: 1.2em; }
          h4 { font-size: 1.05em; }
          h5 { font-size: 0.95em; }
          h6 { font-size: 0.85em; }
          ul, ol {
            margin-bottom: 1em;
            padding-left: 1.5em;
          }
          li {
            margin-bottom: 0.5em;
          }
          a {
            color: #3b82f6;
            text-decoration: none;
          }
          img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1em 0;
            border-radius: 8px;
          }
          blockquote {
            border-left: 4px solid #e5e7eb;
            padding-left: 1em;
            margin: 1em 0;
            color: #6b7280;
            font-style: italic;
          }
          code {
            background-color: #f3f4f6;
            padding: 0.2em 0.4em;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
          }
          pre {
            background-color: #f3f4f6;
            padding: 1em;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1em 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 0.5em;
            text-align: left;
          }
          th {
            background-color: #f9fafb;
            font-weight: 600;
          }
          strong, b { font-weight: 700; }
          em, i { font-style: italic; }
          u { text-decoration: underline; }
          s, strike, del { text-decoration: line-through; }
          hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 2em 0;
          }
        </style>
      </head>
      <body>
        ${html || '<p>No content available</p>'}
        <script>
          function sendHeight() {
            var height = Math.max(
              document.body.scrollHeight,
              document.body.offsetHeight,
              document.documentElement.scrollHeight,
              document.documentElement.offsetHeight
            );
            if (window.ReactNativeWebView && height > 0) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'HEIGHT', value: height }));
            }
          }

          function waitForImages() {
            var images = document.querySelectorAll('img');
            var total = images.length;
            if (total === 0) {
              sendHeight();
              return;
            }
            var loaded = 0;
            images.forEach(function(img) {
              if (img.complete) {
                loaded++;
                if (loaded === total) sendHeight();
              } else {
                img.addEventListener('load', function() {
                  loaded++;
                  if (loaded === total) sendHeight();
                });
                img.addEventListener('error', function() {
                  loaded++;
                  if (loaded === total) sendHeight();
                });
              }
            });
          }

          document.addEventListener('DOMContentLoaded', function() {
            sendHeight();
            waitForImages();
          });

          window.addEventListener('load', function() {
            sendHeight();
            waitForImages();
          });

          setTimeout(sendHeight, 300);
          setTimeout(sendHeight, 800);
          setTimeout(sendHeight, 1500);
          setTimeout(sendHeight, 3000);
        </script>
      </body>
    </html>
  `, [html]);

  const onWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'HEIGHT' && data.value > 0) {
        setHeight(prev => Math.max(prev, data.value + 32));
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
      const newHeight = parseInt(event.nativeEvent.data, 10);
      if (!isNaN(newHeight) && newHeight > 0) {
        setHeight(prev => Math.max(prev, newHeight + 32));
      } else {
        console.error('Malformed message received from WebView:', event.nativeEvent.data);
      }
    }
  };

  const onWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
  };

  return (
    <View className={`w-full ${className || ''}`} style={{ height }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={onWebViewMessage}
        onError={onWebViewError}
        javaScriptEnabled={true}
        bounces={false}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        className="bg-transparent"
      />
    </View>
  );
};

export default HTMLRenderer;
