import React, { useRef } from 'react';
import { View, Text, Image, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
import { getImageUri } from '../../utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryColor } from '../../utils/categoryColors';


export default function ArticleLargeCard({ 
  title, 
  category, 
  author, 
  date, 
  image,
  hashtags = [], // Add hashtags prop
  onPress, 
  onMenuPress,
  onAuthorPress,
  onCategoryPress,
  onTagPress // Add onTagPress prop
}) {
  const { width } = useWindowDimensions();
  const badgeColor = getCategoryColor(category);
  const menuBtnRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressStartY = useRef(0);
  const hasScrolled = useRef(false);

  const handleCategoryPress = () => {
    if (onCategoryPress) {
      onCategoryPress(category);
    }
  };

  const handleAuthorPress = () => {
    if (onAuthorPress) {
      onAuthorPress();
    }
  };

  const handlePressIn = (event) => {
    pressStartY.current = event.nativeEvent.pageY;
    hasScrolled.current = false;
    
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (event) => {
    // Check if user scrolled
    const moveDistance = Math.abs(event.nativeEvent.pageY - pressStartY.current);
    if (moveDistance > 10) {
      hasScrolled.current = true;
    }

    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
    
    // Navigate immediately without waiting for animation
    if (onPress && !hasScrolled.current) {
      onPress();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        className="mb-6 bg-white rounded-xl overflow-hidden shadow-lg"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
      {/* Large Image - Rounded Top and Bottom */}
      <View className="relative bg-[#d1dce6] overflow-hidden rounded-lg">
        <Image
          source={{ uri: getImageUri(image) }}
          className={`w-full ${width < 375 ? 'h-60' : 'h-72'}`}
          resizeMode="cover"
        />

        {/* Menu Button Overlay - Dark Teal Circle with White Dots */}
        {onMenuPress && (
          <TouchableOpacity 
            ref={menuBtnRef}
            onPress={() => {
              menuBtnRef.current?.measure((_fx, _fy, _w, h, px, py) => {
                onMenuPress({ px, py: py + h });
              });
            }}
            className={`absolute ${width < 375 ? 'top-2 right-2' : 'top-4 right-4'} z-10 rounded-full p-2 bg-teal-700/60`}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 8 }}
          >
            <Ionicons name="ellipsis-vertical" size={width < 375 ? 20 : 24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Section */}
      <View className={`${width < 375 ? 'px-3 pt-4' : 'px-4 pt-4'}`} pointerEvents="box-none">
        {/* Title and Category Badge - Side by side vertically centered */}
        <View className="flex-row items-center justify-between mb-3">
          <Text 
            className={`${width < 375 ? 'text-lg' : 'text-2xl'} text-gray-900 font-bold flex-1 mr-4 tracking-tight`}
            numberOfLines={2}
          >
            {title}
          </Text>
          {category && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleCategoryPress();
              }}
              activeOpacity={0.6}
              style={{ alignSelf: 'flex-start' }}
            >
              <View 
                className={`rounded-md ${width < 375 ? 'px-2 py-1' : 'px-3 py-1.5'}`}
                style={{ backgroundColor: badgeColor + '15' }}
              >
                <Text 
                  className={`${width < 375 ? 'text-[10px]' : 'text-[11px]'} font-bold uppercase tracking-widest`}
                  style={{ color: badgeColor }}
                >
                  {category}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Tags - Right after title */}
        {hashtags?.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-3" pointerEvents="box-none">
            {hashtags.slice(0, 5).map((tag, index) => (
              <TouchableOpacity
                key={index}
                onPress={(e) => {
                  e.stopPropagation();
                  if (onTagPress) onTagPress(tag);
                }}
                activeOpacity={0.6}
              >
                <View className="border border-gray-300 rounded-full px-3 py-1 bg-gray-50">
                  <Text className="text-xs text-gray-600 font-medium">#{tag}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Author and Date - At the bottom */}
        <View className={`flex-row items-center gap-2 ${width < 375 ? 'pb-3' : 'pb-4'}`} pointerEvents="box-none">
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              handleAuthorPress();
            }}
            activeOpacity={0.6}
          >
            <Text className={`${width < 375 ? 'text-xs' : 'text-s'} text-gray-700 font-semibold`}>
              {author}
            </Text>
          </TouchableOpacity>
          <View className="w-1 h-1 bg-gray-300 rounded-full mx-1.5" />
          <Text className={`${width < 375 ? 'text-xs' : 'text-s'} text-gray-400 font-medium uppercase tracking-wider`}>
            {date}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}
