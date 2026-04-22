import React from 'react';
import { View, ScrollView } from 'react-native';
import Skeleton from './Skeleton';
import ArticleCardSkeleton from './ArticleCardSkeleton';

/**
 * Skeleton loader for ProfileScreen
 */
export default function ProfileSkeleton() {
  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* White spacer for status bar */}
        <View className="h-9 bg-white" />
        
        {/* Profile Header Skeleton */}
        <View className="px-5 py-6 pb-8 bg-[#075985]">
          <View className="flex-row items-center">
            {/* Avatar skeleton */}
            <Skeleton width={72} height={72} borderRadius={36} style={{ marginRight: 16 }} />
            
            <View className="flex-1 justify-center">
              {/* Name skeleton */}
              <Skeleton width={150} height={24} borderRadius={4} style={{ marginBottom: 8 }} />
              {/* Joined date skeleton */}
              <Skeleton width={120} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
              {/* Role badge skeleton */}
              <Skeleton width={60} height={20} borderRadius={10} />
            </View>
          </View>
        </View>

        {/* Tabs Skeleton */}
        <View className="flex-row px-5 py-5 pb-2">
          <Skeleton width={120} height={36} borderRadius={18} style={{ marginRight: 12 }} />
          <Skeleton width={130} height={36} borderRadius={18} />
        </View>

        {/* Articles List Skeleton */}
        <View className="px-5 py-4">
          {[...Array(5)].map((_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
