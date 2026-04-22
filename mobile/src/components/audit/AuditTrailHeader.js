import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuditTrailHeader({ onBackPress, title = 'Audit Trail' }) {
  return (
    <>
      <View className="h-[1px] bg-gray-200" />
      <View className="flex-row items-center px-4 py-3.5 bg-white">
        <TouchableOpacity
          onPress={onBackPress}
          className="w-11 h-11 rounded-full bg-[#215878] items-center justify-center mr-3"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-[#1a1a1a]">{title}</Text>
      </View>
    </>
  );
}
