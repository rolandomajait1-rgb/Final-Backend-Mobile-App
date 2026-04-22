import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SaveProfileModal({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  isSaving,
}) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-2xl px-6 pt-10 pb-8 w-[85%] max-w-[400px] shadow-lg relative">
          <TouchableOpacity 
            className="absolute top-4 right-4 p-1" 
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <View className="mb-6 items-center">
            <Text className="text-[26px] font-bold text-black mb-2">Save Profile ?</Text>
            <Text className="text-[15px] text-gray-600 text-center">
              Save your changes with your profile.
            </Text>
          </View>

          <View className="gap-3">
            <TouchableOpacity
              className={`bg-[#0ea5e9] py-3.5 rounded-full items-center justify-center ${isSaving ? 'opacity-50' : ''}`}
              onPress={onSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">Save</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className={`bg-white py-3.5 rounded-full border-[1.5px] border-[#ff4d4f] items-center justify-center ${isSaving ? 'opacity-50' : ''}`}
              onPress={onDiscard}
              disabled={isSaving}
            >
              <Text className="text-[#ff4d4f] text-base font-bold">Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
