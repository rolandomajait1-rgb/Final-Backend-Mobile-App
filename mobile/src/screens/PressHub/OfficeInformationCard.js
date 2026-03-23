import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles';

const OfficeInformationCard = () => {
  return (
    <View
      className="p-4 rounded-lg"
      style={{ borderColor: colors.primary, backgroundColor: colors.inverse }}
    >
      <Text className="text-3xl font-bold text-gray-800 mb-4">Office Information</Text>

      <View className="flex-row items-start">
        <Ionicons name="location-outline" size={90} color={colors.location} />
        <View className="flex-1 ml-3">
          <Text className="text-2xl font-semibold text-gray-800">Office Location</Text>
          <Text className="text-xl text-gray-600 mt-2">
            DSR Building, 2nd floor,
          </Text>
          <Text className="text-xl text-gray-600 mt-2">
            near College Library and Comfort
          </Text>
          <Text className="text-xl text-gray-600 mt-2">
            room.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default OfficeInformationCard;
