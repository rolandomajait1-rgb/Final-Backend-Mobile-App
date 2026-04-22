import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Reusable action menu for articles (Edit, Delete, Publish, etc.)
 * 
 * @param {boolean} visible - Whether the menu is visible
 * @param {number} y - Vertical position of the menu
 * @param {function} onClose - Callback when the menu is closed
 * @param {Array} actions - List of actions to display
 *   each action: { label, icon, color, onPress }
 */
const ArticleActionMenu = ({ visible, y, onClose, actions = [] }) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/40"
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{ position: 'absolute', top: y, right: 40 }}>
          <View
            className="bg-white rounded-xl shadow-lg border border-gray-50 py-1"
            style={{ minWidth: 140, elevation: 5 }}
          >
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
                className="flex-row items-center px-5 py-3"
              >
                <Ionicons name={action.icon} size={20} color={action.color} />
                <Text 
                  className="ml-4 text-[15px]" 
                  style={{ color: action.labelColor || '#374151' }}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ArticleActionMenu;
