import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Skeleton from './Skeleton';

/**
 * Skeleton loader for ArticleDetailScreen
 */
export default function ArticleDetailSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image skeleton */}
        <Skeleton width="100%" height={320} borderRadius={0} />

        {/* Tags skeleton */}
        <View className="flex-row flex-wrap gap-2 px-4 pt-3 mb-4">
          <Skeleton width={60} height={24} borderRadius={12} />
          <Skeleton width={80} height={24} borderRadius={12} />
          <Skeleton width={70} height={24} borderRadius={12} />
        </View>

        {/* Actions skeleton */}
        <View className="flex-row items-center justify-end gap-4 py-4 border-b px-4 border-gray-200">
          <Skeleton width={60} height={20} borderRadius={4} />
          <Skeleton width={60} height={20} borderRadius={4} />
        </View>

        {/* Content skeleton */}
        <View className="px-5 py-6">
          {/* Paragraphs */}
          {[...Array(8)].map((_, index) => (
            <View key={index} className="mb-4">
              <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
              <Skeleton width="85%" height={14} borderRadius={4} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
