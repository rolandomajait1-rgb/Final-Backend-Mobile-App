import React from 'react';
import { View, ScrollView } from 'react-native';
import ArticleLargeCardSkeleton from './ArticleLargeCardSkeleton';
import ArticleCardSkeleton from './ArticleCardSkeleton';

/**
 * Skeleton loader for HomeScreen
 */
export default function HomeScreenSkeleton() {
  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="px-4 py-4">
        {/* Featured article skeleton */}
        <ArticleLargeCardSkeleton />

        {/* Article list skeletons */}
        {[...Array(6)].map((_, index) => (
          <ArticleCardSkeleton key={index} />
        ))}
      </View>
    </ScrollView>
  );
}
