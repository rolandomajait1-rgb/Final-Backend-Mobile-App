import { Modal, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SideBar = ({ visible, onClose, onLogout, navigation, user }) => {
  const handleEditProfile = () => {
    if (!user) return;
    onClose();
    navigation.navigate('EditProfile', { user });
  };

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <RNSafeAreaView className="flex-1">
        <View className="flex-1 flex-row">
          {/* Overlay */}
          <TouchableOpacity
            className="flex-1 bg-black/60"
            onPress={onClose}
            activeOpacity={1}
          />

          {/* Sidebar - Right Side */}
          <View className="w-80 bg-white">
            {/* Content - Centered */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 60 }}>
              <View style={{ alignItems: 'center' }}>
                {/* Title */}
                <Text className="text-[32px] font-bold text-[#075985] mb-10 tracking-tight">Profile</Text>

                {/* Icon Block */}
                <View className="w-[100px] h-[100px] rounded-full bg-[#075985] justify-center items-center mb-4">
                  <Ionicons name="person-outline" size={54} color="white" />
                </View>

                {/* Settings Label */}
                <Text className="text-[19px] font-medium text-[#075985] mb-10">Settings</Text>

                {/* Edit Profile */}
                <TouchableOpacity onPress={handleEditProfile} className="mb-4 p-2">
                  <Text className="text-[20px] text-gray-500 font-normal">Edit Profile</Text>
                </TouchableOpacity>

                {/* Logout */}
                <TouchableOpacity onPress={handleLogout} className="p-2">
                  <Text className="text-[20px] text-red-500 font-normal">Logout</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </RNSafeAreaView>
    </Modal>
  );
};

export default SideBar;
