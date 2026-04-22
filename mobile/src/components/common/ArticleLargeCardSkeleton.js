import React from 'react';
import { View } from 'react-native';
import Skeleton from './Skeleton';

/**
 * Skeleton loader for ArticleLargeCard
 */
export default function ArticleLargeCardSkeleton() {
  return (
    <View className="rounded-2xl overflow-hidden bg-white mb-4 shadow-sm">
      {/* Image skeleton */}
      <Skeleton width="100%" height={200} borderRadius={0} />

      {/* Content skeleton */}
      <View className="p-4">
        {/* Category badge */}
        <Skeleton width={80} height={20} borderRadius={4} style={{ marginBottom: 12 }} />

        {/* Title - 2 lines */}
        <Skeleton width="100%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={20} borderRadius={4} style={{ marginBottom: 12 }} />

        {/* Excerpt - 2 lines */}
        <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="90%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />

        {/* Meta info */}
        <View className="flex-row items-center justify-between">
          <Skeleton width={120} height={12} borderRadius={4} />
          <Skeleton width={80} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}
