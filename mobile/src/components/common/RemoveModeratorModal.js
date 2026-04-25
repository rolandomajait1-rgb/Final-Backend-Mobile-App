import React from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

export default function RemoveModeratorModal({
  visible,
  moderatorName = "Moderator",
  onConfirm,
  onCancel,
  loading = false,
}) {
  const handleConfirm = async () => {
    if (loading) return; // Prevent multiple clicks
    
    try {
      if (onConfirm) {
        await onConfirm();
      }
    } catch (error) {
      console.error('Remove moderator confirmation error:', error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !loading && onCancel?.()}
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
            Remove Moderator
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
            Are you sure you want to remove {moderatorName} as a moderator?{"\n"}This action cannot be undone.
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
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                marginRight: 18,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ff4b4b" />
              ) : (
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#ff4b4b",
                  }}
                >
                  REMOVE
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCancel}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#6b7280",
                }}
              >
                CANCEL
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
