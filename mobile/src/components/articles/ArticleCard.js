import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { getImageUri } from '../../utils/imageUtils';
import { typography } from '../../styles';
import { getCategoryColor } from '../../utils/categoryColors';


export default function ArticleCard({ article, onPress, onAuthorPress, onTagPress }) {
  const category = article.categories?.[0]?.name ?? '';
  const author = article.author?.user?.name || article.author?.name || article.author_name || 'Unknown Author';
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const hashtags = article.tags || [];

  return (
    <TouchableOpacity 
      className="bg-white rounded-lg mb-4 overflow-hidden border border-gray-200" 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: getImageUri(article.featured_image_url || article.featured_image) }}
        className="w-full h-44 bg-gray-200"
        resizeMode="cover"
      />
      
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-1">
          {category ? (
            <Text 
              className="text-xs font-bold tracking-wider" 
              style={{ color: getCategoryColor(category) }}
            >
              {category.toUpperCase()}
            </Text>
          ) : <View />}
        </View>
        
        <Text 
          className="text-base font-bold text-gray-900 mb-2" 
          style={{ 
            fontFamily: typography.fontFamily.serif,
            lineHeight: typography.fontSize.md * typography.lineHeight.normal 
          }} 
          numberOfLines={3}
        >
          {article.title}
        </Text>

        {/* Tags */}
        {hashtags.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mb-3">
            {hashtags.map((tag, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={(e) => {
                  e.stopPropagation();
                  onTagPress && onTagPress(tag.name || tag);
                }}
                className="bg-gray-100 rounded-full px-2 py-0.5"
              >
                <Text className="text-[10px] text-gray-600 font-medium">#{tag.name || tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onAuthorPress && onAuthorPress();
            }}
          >
            <Text className="text-xs font-bold text-gray-700 underline">{author}</Text>
          </TouchableOpacity>
          {date ? <Text className="text-xs text-gray-500"> · {date}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
