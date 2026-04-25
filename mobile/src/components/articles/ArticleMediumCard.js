import React, { memo, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
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
  onTagPress,
  onCategoryPress,
  navigation
}) {
  const { width } = useWindowDimensions();
  const badgeColor = getCategoryColor(category);
  const menuBtnRef = useRef(null);

  const handleCategoryPress = () => {
    if (onCategoryPress) {
      onCategoryPress(category);
    }
  };

  return (
    <TouchableOpacity 
      className={`flex-row bg-white items-center mb-3 ${width < 375 ? 'p-2' : 'p-3'} rounded-lg shadow-md`}
      onPress={onPress} 
      activeOpacity={0.8}
    >
      {/* Image - Left Side */}
      <View className="rounded-xl overflow-hidden bg-gray-100">
        <Image
          source={{ uri: getImageUri(image) }}
          className={`${width < 375 ? 'w-20 h-24' : 'w-28 h-28'}`}
          resizeMode="cover"
        />
      </View>

      {/* Content - Right Side */}
      <View className={`flex-1 ${width < 375 ? 'ml-2' : 'ml-3'} justify-center`}>
        <View className="flex-row justify-between items-start gap-2">
          <View className="flex-1 pr-2">
            <Text 
              className={`${width < 375 ? 'text-s' : 'text-base'} text-gray-900 font-bold leading-5 mb-1`}
              numberOfLines={2}
            >
              {title}
            </Text>
            
            {/* Category Badge */}
            {category && (
              <View className="mb-1">
                <TouchableOpacity
                  onPress={handleCategoryPress}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View 
                    className={` ${width < 375 ? 'px-1.5 py-0.5' : 'px-2 py-1'} self-start`}
                    style={{ backgroundColor: badgeColor + '15' }}
                  >
                    <Text 
                      className={`${width < 375 ? 'text-[8px]' : 'text-[9px]'} font-bold uppercase tracking-widest`}
                      style={{ color: badgeColor }}
                    >
                      {category}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
 
            {/* Meta Info */}
            <View className="flex-row items-center mt-0.5 flex-wrap">
              <TouchableOpacity 
                onPress={() => {
                  if (onAuthorPress) {
                    onAuthorPress();
                  }
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className={`${width < 375 ? 'text-xs' : 'text-xs'} text-gray-800 font-bold underline`}>{author}</Text>
              </TouchableOpacity>
              {date ? <Text className={`${width < 375 ? 'text-xs' : 'text-xs'} text-gray-500 ml-1`}> • {date}</Text> : null}
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
              className="p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-vertical" size={width < 375 ? 18 : 20} color="#0369a1" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Bug #22 Fix: Export memoized component
export default memo(ArticleMediumCard);
