import React from 'react';
import { View, ScrollView } from 'react-native';
import Skeleton from './Skeleton';

/**
 * Skeleton loader for AuditTrailScreen
 */
export default function AuditTrailSkeleton() {
  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="px-5 py-3">
        {[...Array(8)].map((_, index) => (
          <View key={index} className="mb-3">
            <View className="flex-row bg-white rounded-[14px] border border-gray-200 h-[92px] overflow-hidden">
              {/* Color strip skeleton */}
              <Skeleton width={12} height={92} borderRadius={0} />

              <View className="flex-1 flex-row items-center pr-4">
                {/* Status skeleton */}
                <View className="w-[90px] items-start justify-center pl-3">
                  <Skeleton width={70} height={16} borderRadius={4} />
                </View>

                {/* Content skeleton */}
                <View className="flex-1 justify-center pl-1">
                  <Skeleton width="90%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
                  <Skeleton width="70%" height={13} borderRadius={4} />
                </View>

                {/* Date/time skeleton */}
                <View className="items-end justify-center pl-2">
                  <Skeleton width={60} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
                  <Skeleton width={50} height={12} borderRadius={4} />
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
