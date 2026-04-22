import React from 'react';
import { View } from 'react-native';
import Skeleton from './Skeleton';

/**
 * Skeleton loader for ArticleMediumCard
 */
export default function ArticleCardSkeleton() {
  return (
    <View className="flex-row bg-white py-2 items-center mb-1">
      {/* Image skeleton */}
      <Skeleton width={110} height={110} borderRadius={10} />

      {/* Content skeleton */}
      <View className="flex-1 ml-4 justify-center">
        {/* Title skeleton - 2 lines */}
        <Skeleton width="90%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />

        {/* Category badge skeleton */}
        <Skeleton width={60} height={16} borderRadius={4} style={{ marginBottom: 8 }} />

        {/* Meta info skeleton */}
        <View className="flex-row items-center mt-1">
          <Skeleton width={100} height={12} borderRadius={4} />
          <Skeleton width={60} height={12} borderRadius={4} style={{ marginLeft: 8 }} />
        </View>
      </View>
    </View>
  );
}
