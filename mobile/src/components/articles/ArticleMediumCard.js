import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles';
import { getCategoryColor } from '../../utils/categoryColors';

const FALLBACK = 'https://via.placeholder.com/200x200/e2e8f0/64748b?text=No+Image';

export default function ArticleMediumCard({ 
  title, 
  category, 
  author, 
  date, 
  image,
  onPress, 
  onMenuPress 
}) {
  return (
    <TouchableOpacity 
      className="flex-row bg-white rounded-lg  overflow-hidden border border-gray-200 items-start" 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      {/* Image - Left Side */}
      <Image
        source={{ uri: image || FALLBACK }}
        className="w-28 h-28 rounded-lg"
        style={{ backgroundColor: colors.border }}
        resizeMode="cover"
      />

      {/* Content - Right Side */}
      <View className="flex-1 p-6 justify-between">
        <View className="flex-row justify-between items-start mb-1">
          <View className="flex-1 mr-2">
            <Text 
              className="text-sm font-bold" 
              style={{ 
                color: colors.text.primary,
                fontFamily: 'Nunito Sans',
                fontWeight: '700',
                letterSpacing: 1,
                fontSize: 16,
                lineHeight: 22

              }} 
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onMenuPress && onMenuPress();
            }}
            className="p-1 -mr-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Category */}
        {category ? (
          <Text 
            className="text-s font-bold mb-1" 
            style={{ 
              color: getCategoryColor(category),
              letterSpacing: 1 
            }}
          >
            {category.toUpperCase()}
          </Text>
        ) : null}

        {/* Meta Info */}
        <Text className="text-xs" style={{ color: colors.text.muted }}>
          {[author, date].filter(Boolean).join(' • ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
