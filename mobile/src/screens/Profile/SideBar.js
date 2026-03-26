import { Modal, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles';

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
      animationType="slide"
      onRequestClose={onClose}
    >
      <RNSafeAreaView className="flex-1">
        <View className="flex-1 flex-row">
          {/* Overlay */}
          <TouchableOpacity
            className="flex-1 bg-black/50"
            onPress={onClose}
            activeOpacity={1}
          />

          {/* Sidebar - Right Side */}
          <View className="w-80 bg-white">
            {/* Content - Centered */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 48 }}>
              <View style={{ alignItems: 'center' }}>
                {/* Icon */}
                <View className="w-16 h-16 rounded-full bg-gray-100 justify-center items-center mb-6">
                  <Ionicons name="person" size={32} color={colors.primary} />
                </View>

                {/* Title */}
                <Text className="text-2xl font-bold text-gray-900 mb-8">Profile</Text>

                {/* Edit Profile */}
                <TouchableOpacity onPress={handleEditProfile} className="mb-6">
                  <Text className="text-lg text-gray-600 font-medium">Edit Profile</Text>
                </TouchableOpacity>

                {/* Logout */}
                <TouchableOpacity onPress={handleLogout}>
                  <Text className="text-lg text-red-500 font-medium">Logout</Text>
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
