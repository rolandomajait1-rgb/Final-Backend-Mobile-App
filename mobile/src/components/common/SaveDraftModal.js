import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

export default function SaveDraftModal({
  isOpen,
  onClose,
  onPublish,
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
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Save Draft</Text>
            <Text style={styles.description}>
              Save your changes and come back to finish your article later.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.publishButton, isSaving && styles.disabledButton]}
              onPress={onPublish}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.publishButtonText}>Publish</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.disabledButton]}
              onPress={onSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.discardButton, isSaving && styles.disabledButton]}
              onPress={onDiscard}
              disabled={isSaving}
            >
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
  },
  buttonContainer: {
    gap: 12,
  },
  publishButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  publishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "600",
  },
  discardButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  discardButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
