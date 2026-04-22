import React from 'react';
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

  return (
    <TouchableOpacity 
      className="mb-6 bg-white"
      onPress={onPress} 
      activeOpacity={0.85}
    >
      {/* Large Image with rounded corners */}
      <View className="relative bg-[#d1dce6] rounded-xl overflow-hidden mb-4">
        <Image
          source={{ uri: getImageUri(image) }}
          className="w-full h-[280px]"
          resizeMode="cover"
        />

        {/* Menu Button Overlay - Dark Teal Circle with White Dots */}
        {onMenuPress && (
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onMenuPress(e);
            }}
            className="absolute top-4 right-4 z-10 rounded-full p-2"
            style={{ backgroundColor: 'rgba(14, 116, 144, 0.6)' }} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Section */}
      <View>
        {/* Title and Category Badge - Side by side vertically centered */}
        <View className="flex-row items-center justify-between mb-3">
          <Text 
            className="text-gray-900 text-[28px] font-bold flex-1 mr-4" 
            numberOfLines={2}
          >
            {title}
          </Text>
          {category && (
            <View 
              style={{ backgroundColor: badgeColor + '15' }} // 15% opacity for background
              className="rounded-md px-3 py-1.5 self-start ml-2"
            >
              <Text 
                style={{ color: badgeColor }} 
                className="font-bold text-[11px] uppercase tracking-widest"
              >
                {category}
              </Text>
            </View>
          )}
        </View>
        
        {/* Hashtags - Pill style */}
        {hashtags && hashtags.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {hashtags.map((tag, index) => (
              <TouchableOpacity 
                key={index} 
                className="bg-white border border-gray-300 rounded-full px-4 py-1"
                onPress={(e) => {
                  e.stopPropagation();
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
        <View className="flex-row items-center gap-2 mb-4">
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onAuthorPress && onAuthorPress();
            }}
            activeOpacity={0.7}
          >
            <Text className="text-gray-800 text-base font-semibold underline">
              {author}
            </Text>
          </TouchableOpacity>
          <View className="w-1.5 h-1.5 bg-gray-400 rounded-full mx-1.5" />
          <Text className="text-gray-500 text-sm">
            {date}
          </Text>
        </View>
      </View>
      {/* Bottom border divider */}
      <View style={{ height: 2, backgroundColor: '#E5E7EB', marginTop: 4 }} />
    </TouchableOpacity>
  );
}
