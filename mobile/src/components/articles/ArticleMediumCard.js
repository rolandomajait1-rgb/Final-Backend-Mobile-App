import React, { memo, useRef } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { getImageUri } from '../../utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryColor } from '../../utils/categoryColors';

// Bug #22 Fix: Memoize component to prevent unnecessary re-renders
function ArticleMediumCard({ 
  title, 
  category, 
  author, 
  date, 
  image,
  hashtags = [],
  onPress, 
  onMenuPress,
  onAuthorPress,
  onTagPress 
}) {
  const badgeColor = getCategoryColor(category);
  const menuBtnRef = useRef(null);

  return (
    <TouchableOpacity 
      className="flex-row bg-white items-center mb-3 p-3 rounded-lg" 
      style={{
        shadowColor: "#075985",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        marginHorizontal: 0,
        marginTop: 4,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.03)"
      }}
      onPress={onPress} 
      activeOpacity={0.8}
    >
      {/* Image - Left Side */}
      <View className="rounded-xl overflow-hidden bg-gray-100">
        <Image
          source={{ uri: getImageUri(image) }}
          className="w-[100px] h-[100px]"
          resizeMode="cover"
        />
      </View>

      {/* Content - Right Side */}
      <View className="flex-1 ml-4 justify-center">
        <View className="flex-row justify-between items-start gap-2">
          <View className="flex-1">
            <Text 
              className="text-gray-900 text-[20px] font-bold leading-7 mb-2" 
              numberOfLines={2}
            >
              {title}
            </Text>
            
            {/* Category Badge */}
            {category && (
              <TouchableOpacity 
                style={{ backgroundColor: badgeColor + '15' }} // 15% opacity
                className="rounded-md px-2 py-0.5 self-start mb-2"
                onPress={() => onTagPress && onTagPress(category)}
              >
                <Text 
                  style={{ color: badgeColor }}
                  className="font-bold text-[9px] uppercase tracking-widest"
                >
                  {category}
                </Text>
              </TouchableOpacity>
            )}

            {/* Tags - Compact style for Medium Card */}
            {hashtags && hashtags.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mb-2">
                {hashtags.slice(0, 3).map((tag, index) => (
                  <TouchableOpacity 
                    key={index} 
                    onPress={() => {
                      // Bug #19 Fix: Add null check before calling optional callback
                      if (onTagPress) {
                        onTagPress(tag.name || tag);
                      }
                    }}
                  >
                    <Text className="text-gray-500 text-[10px] font-medium">#{tag.name || tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Meta Info */}
            <View className="flex-row items-center mt-1">
              <TouchableOpacity 
                onPress={() => {
                  // Bug #19 Fix: Add null check before calling optional callback
                  if (onAuthorPress) {
                    onAuthorPress();
                  }
                }}
              >
                <Text className="text-gray-800 text-[13px] font-bold underline">{author}</Text>
              </TouchableOpacity>
              {date ? <Text className="text-gray-500 text-[11px] ml-1"> • {date}</Text> : null}
            </View>
          </View>

          {/* Menu Dots - Far Right */}
          {onMenuPress && (
            <TouchableOpacity 
              ref={menuBtnRef}
              onPress={() => {
                menuBtnRef.current?.measure((_fx, _fy, _w, h, px, py) => {
                  onMenuPress({ px, py: py + h });
                });
              }}
              className="p-2 -mr-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#0369a1" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Bug #22 Fix: Export memoized component
export default memo(ArticleMediumCard);
