import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryBgClass } from '../../utils/categoryColors';
import typography from '../../styles/typography';

const FALLBACK = 'https://via.placeholder.com/400x300/e2e8f0/64748b?text=No+Image';

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
  return (
    <TouchableOpacity 
      className="mb-6 bg-white"
      onPress={onPress} 
      activeOpacity={0.85}
    >
      {/* Large Image with rounded corners */}
      <View className="relative bg-[#d1dce6] rounded-2xl overflow-hidden mb-4">
        <Image
          source={{ uri: image || FALLBACK }}
          className="w-full h-64"
          resizeMode="cover"
        />

        {/* Menu Button - Top Right */}
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onMenuPress && onMenuPress();
          }}
          className="absolute top-4 right-4 z-10"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#FFB800" />
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View>
        {/* Title with Category Badge */}
        <View className="flex-row items-start justify-between mb-3">
          <Text 
            className="text-gray-900 text-2xl leading-7 flex-1 mr-3" 
            style={{ fontFamily: 'Nunito Sans', fontWeight: '700' }}
            numberOfLines={2}
          >
            {title}
          </Text>
          {category && (
            <View className={`${getCategoryBgClass(category)} flex-wrap rounded-lg px-4 py-2 self-start`}>
              <Text className="text-white font-bold text-xs uppercase">
                {category}
              </Text>
            </View>
          )}
        </View>
        
        {/* Hashtags - Circular with gray border */}
        {hashtags && hashtags.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-3">
            {hashtags.map((tag, index) => (
              <TouchableOpacity 
                key={index} 
                className="bg-white border border-gray-300 rounded-full px-3 py-1"
                onPress={(e) => {
                  e.stopPropagation();
                  onTagPress && onTagPress(tag);
                }}
              >
                <Text className="text-gray-600 text-xs font-medium">
                  #{tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Author and Date */}
        <View className="flex-row items-center gap-2 pb-3 text-Nunito Sans">
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onAuthorPress && onAuthorPress();
            }}
            activeOpacity={0.7}
          >
            <Text className="text-gray-600 text-base font-medium underline">
              {author}
            </Text>
          </TouchableOpacity>
          {date && (
            <>
              <View className="w-1 h-1 bg-gray-400 rounded-full" />
              <Text className="text-gray-500 text-sm">
                {date}
              </Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
