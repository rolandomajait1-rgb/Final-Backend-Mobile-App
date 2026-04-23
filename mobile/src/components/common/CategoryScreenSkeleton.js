import React from 'react';
import { View, ScrollView } from 'react-native';
import ArticleLargeCardSkeleton from './ArticleLargeCardSkeleton';

/**
 * Skeleton loader for Category screens
 */
export default function CategoryScreenSkeleton() {
  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <View className="px-4 py-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <ArticleLargeCardSkeleton key={index} />
        ))}
      </View>
    </ScrollView>
  );
}
