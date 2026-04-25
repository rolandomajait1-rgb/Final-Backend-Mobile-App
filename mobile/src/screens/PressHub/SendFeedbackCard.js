import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles';

const SendFeedbackCard = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      className="flex-row items-center p-4 rounded-lg border-2"
      style={{ borderColor: colors.border, backgroundColor: colors.surface }}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('SendFeedback')}
    >
      <Ionicons name="hand-left" size={80} color={colors.primary} />
      <View className="flex-1 ml-4">
        <Text className="text-2xl font-bold text-gray-800">Send us Feedback</Text>
        <Text className="text-lg text-gray-600 mt-1">We value your opinion on our latest issues.</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

export default SendFeedbackCard;
