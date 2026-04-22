import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { DeviceEventEmitter } from "react-native";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const listenerRef = useRef(null); // Bug #10 Fix: Track listener to prevent accumulation

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "success", duration = 3000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      // Duration is handled by the Toast component for smooth exit animation

      return id;
    },
    [],
  );

  useEffect(() => {
    // Bug #10 Fix: Remove existing listener before adding new one
    if (listenerRef.current) {
      listenerRef.current.remove();
    }

    listenerRef.current = DeviceEventEmitter.addListener('SHOW_TOAST', ({ type, message, duration }) => {
      showToast(message, type, duration);
    });

    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
