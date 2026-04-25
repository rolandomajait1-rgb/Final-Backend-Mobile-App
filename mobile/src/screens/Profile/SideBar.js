import { Modal, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const SideBar = ({ visible, onClose, onLogout, navigation, user }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleEditProfile = () => {
    if (!user) return;
    onClose();
    navigation.navigate('EditProfile', { user });
  };

  const handleLogoutPress = () => {
    onClose(); // Close sidebar first
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  if (!visible && !showLogoutModal) return null;

  return (
    <>
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
                  <TouchableOpacity onPress={handleLogoutPress} className="p-2">
                    <Text className="text-[20px] text-red-500 font-normal">Logout</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </RNSafeAreaView>
      </Modal>

      {/* Custom Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelLogout}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.12)",
            paddingHorizontal: 18,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 380,
              backgroundColor: "#ffffff",
              borderRadius: 22,
              paddingTop: 20,
              paddingBottom: 18,
              paddingHorizontal: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 18,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: "#111827",
                textAlign: "center",
              }}
            >
              Sign Out
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 14,
                lineHeight: 20,
                color: "#4b5563",
                textAlign: "center",
              }}
            >
              Are you sure you want to sign out?
            </Text>

            <View
              style={{
                marginTop: 16,
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={handleConfirmLogout}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginRight: 18,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#ff4b4b",
                  }}
                >
                  YES
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancelLogout}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#6b7280",
                  }}
                >
                  NO
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SideBar;
