import { View, Text, Modal, ActivityIndicator } from 'react-native';

export default function ImageUploadProgress({ visible, progress = 0 }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-2xl p-6 w-[80%] max-w-[300px] items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-900 font-bold text-lg mt-4">
            Uploading Image
          </Text>
          <Text className="text-gray-600 text-sm mt-2">
            {progress > 0 ? `${Math.round(progress)}%` : 'Please wait...'}
          </Text>
          
          {/* Progress Bar */}
          <View className="w-full h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
            <View 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
