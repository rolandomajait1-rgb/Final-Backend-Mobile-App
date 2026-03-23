import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles';

const ResultItem = React.memo(({ article, onCopy }) => {
  const categoryName =
    article.categories && article.categories.length > 0
      ? article.categories[0].name
      : 'Uncategorized';

  const authorName = article.display_author_name || article.author_name || 'Unknown';

  return (
    <View
      className="bg-white rounded-lg overflow-hidden border"
      style={{ borderColor: colors.border }}
    >
      {/* Article Image */}
      {article.featured_image_url && (
        <Image
          source={{ uri: article.featured_image_url }}
          style={{ width: '100%', height: 180 }}
          resizeMode="cover"
        />
      )}

      {/* Article Content */}
      <View className="p-3">
        {/* Category Badge */}
        <View
          className="self-start px-2 py-1 rounded-full mb-2"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white text-xs font-semibold">{categoryName}</Text>
        </View>

        {/* Title */}
        <Text
          className="text-base font-bold mb-2"
          style={{ color: colors.text }}
          numberOfLines={2}
        >
          {article.title}
        </Text>

        {/* Excerpt */}
        <Text
          className="text-sm mb-3"
          style={{ color: colors.textSecondary }}
          numberOfLines={2}
        >
          {article.excerpt}
        </Text>

        {/* Author and Date */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            By {authorName}
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {new Date(article.published_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Copy Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-2 rounded-lg"
          style={{ backgroundColor: colors.primary }}
          onPress={onCopy}
          accessibilityLabel="Copy article"
          accessibilityRole="button"
        >
          <Ionicons name="copy" size={16} color="white" />
          <Text className="text-white font-semibold ml-2">Copy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.article.id === nextProps.article.id;
});

ResultItem.displayName = 'ResultItem';

export default ResultItem;
