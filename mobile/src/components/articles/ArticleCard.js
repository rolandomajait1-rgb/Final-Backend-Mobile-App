import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { typography } from '../../styles';
import { getCategoryColor } from '../../utils/categoryColors';

const FALLBACK = 'https://via.placeholder.com/400x200/e2e8f0/64748b?text=No+Image';

export default function ArticleCard({ article, onPress }) {
  const category = article.categories?.[0]?.name ?? '';
  const author = article.author?.user?.name || article.author?.name || article.author_name || 'Unknown Author';
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <TouchableOpacity 
      className="bg-white rounded-lg mb-4 overflow-hidden border border-gray-200" 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: article.featured_image_url || article.featured_image || FALLBACK }}
        className="w-full h-44 bg-gray-200"
        resizeMode="cover"
      />
      
      <View className="p-4">
        {category ? (
          <Text 
            className="text-xs font-bold mb-1 tracking-wider" 
            style={{ color: getCategoryColor(category) }}
          >
            {category.toUpperCase()}
          </Text>
        ) : null}
        
        <Text 
          className="text-base font-bold text-gray-900 mb-1" 
          style={{ 
            fontFamily: typography.fontFamily.serif,
            lineHeight: typography.fontSize.md * typography.lineHeight.normal 
          }} 
          numberOfLines={3}
        >
          {article.title}
        </Text>
        
        <Text className="text-xs text-gray-500">
          {[author, date].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
