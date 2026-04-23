import React, { useRef } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { getImageUri } from '../../utils/imageUtils';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryColor } from '../../utils/categoryColors';


export default function ArticleLargeCard({ 
  title, 
  category, 
  author, 
  date, 
  image,
  hashtags = [],
  onPress, 
  onMenuPress,
  onTagPress,
  onAuthorPress
}) {
  const badgeColor = getCategoryColor(category);
  const menuBtnRef = useRef(null);

  return (
    <TouchableOpacity 
      className="mb-6 bg-white rounded-xl overflow-hidden"
      style={{
        shadowColor: "#075985",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
        marginHorizontal: 0,
        marginTop: 4,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)"
      }}
      onPress={onPress} 
      activeOpacity={0.85}
    >
      {/* Large Image - Rounded Top and Bottom */}
      <View className="relative bg-[#d1dce6] overflow-hidden  mb-4 rounded-lg">
        <Image
          source={{ uri: getImageUri(image) }}
          className="w-full h-[268px]"
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
            className="absolute top-4 right-4 z-10 rounded-full p-2"
            style={{ backgroundColor: 'rgba(14, 116, 144, 0.6)' }} 
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 8 }}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Section */}
      <View className="px-4 pb-5">
        {/* Title and Category Badge - Side by side vertically centered */}
        <View className="flex-row items-center justify-between mb-3">
          <Text 
            className="text-gray-900 text-[26px] font-bold flex-1 mr-4 tracking-tight" 
            numberOfLines={2}
          >
            {title}
          </Text>
          {category && (
            <TouchableOpacity 
              style={{ backgroundColor: badgeColor + '15' }} // 15% opacity for background
              className="rounded-md px-3 py-1.5 self-start ml-2"
              onPress={() => onTagPress && onTagPress(category)}
            >
              <Text 
                style={{ color: badgeColor }} 
                className="font-bold text-[11px] uppercase tracking-widest"
              >
                {category}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Hashtags - Pill style */}
        {hashtags && hashtags.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {hashtags.map((tag, index) => (
              <TouchableOpacity 
                key={index} 
                className="bg-gray-50 border border-gray-200 rounded-full px-4 py-1"
                onPress={() => {
                  onTagPress && onTagPress(tag);
                }}
              >
                <Text className="text-gray-500 text-xs font-semibold">
                  #{tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Author and Date */}
        <View className="flex-row items-center gap-2 mt-2">
          <TouchableOpacity 
            onPress={() => {
              onAuthorPress && onAuthorPress();
            }}
            activeOpacity={0.7}
          >
            <Text className="text-cyan-700 text-sm font-semibold">
              {author}
            </Text>
          </TouchableOpacity>
          <View className="w-1 h-1 bg-gray-300 rounded-full mx-1.5" />
          <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">
            {date}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
