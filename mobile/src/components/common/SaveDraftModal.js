import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SaveDraftModal({
  isOpen,
  onClose,
  onPublish,
  onSave,
  onDiscard,
  isSaving,
  title = "Save Edit",
  description = "Save your changes and come back to finish your article later.",
  publishText = "Publish",
  saveText = "Save as draft",
  discardText = "Discard",
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
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={styles.buttonContainer}>
            {onPublish && (
              <TouchableOpacity
                style={[styles.publishButton, isSaving && styles.disabledButton]}
                onPress={onPublish}
                disabled={isSaving}
              >
                {isSaving && !onSave && !onDiscard ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.publishButtonText}>{publishText}</Text>
                )}
              </TouchableOpacity>
            )}

            {onSave && (
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.disabledButton]}
                onPress={onSave}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>{saveText}</Text>
              </TouchableOpacity>
            )}

            {onDiscard && (
              <TouchableOpacity
                style={[styles.discardButton, isSaving && styles.disabledButton]}
                onPress={onDiscard}
                disabled={isSaving}
              >
                <Text style={styles.discardButtonText}>{discardText}</Text>
              </TouchableOpacity>
            )}
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
  content: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#4b5563",
    textAlign: "center",
  },
  buttonContainer: {
    gap: 12,
  },
  publishButton: {
    backgroundColor: "#0ea5e9", // Light blue matching image
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  publishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "#0ea5e9", // Light blue matching image
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#0ea5e9",
    fontSize: 16,
    fontWeight: "bold",
  },
  discardButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "#ff4d4f", // Red color matching image
    alignItems: "center",
    justifyContent: "center",
  },
  discardButtonText: {
    color: "#ff4d4f",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
