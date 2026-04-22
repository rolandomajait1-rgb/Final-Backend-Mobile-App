import React from "react";
import { View } from "react-native";
import { useToast } from "../../context/ToastContext";
import Toast from "./Toast";

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 9999 }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </View>
  );
}
