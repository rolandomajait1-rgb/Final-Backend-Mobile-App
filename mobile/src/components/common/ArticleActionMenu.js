import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Reusable action menu for articles (Edit, Delete, Publish, etc.)
 * 
 * @param {boolean} visible - Whether the menu is visible
 * @param {number} x - Horizontal position of the button (pageX)
 * @param {number} y - Vertical position of the button (pageY)
 * @param {function} onClose - Callback when the menu is closed
 * @param {Array} actions - List of actions to display
 *   each action: { label, icon, color, onPress }
 */
const ArticleActionMenu = ({ visible, x, y, onClose, actions = [] }) => {
  if (!visible) return null;

  const MENU_WIDTH = 160;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1"
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={{
            position: 'absolute',
            // Pop the menu upward above the button; MENU_WIDTH*0 is just a placeholder
            // Each item is ~44px tall; show above the tap point
            top: y - (actions.length * 8) - 8,
            // Align right edge of menu with the button
            left: x != null ? x - MENU_WIDTH + 34 : undefined,
            right: x == null ? 16 : undefined,
          }}
        >
          <View
            className="bg-white rounded-xl border border-gray-100 py-1"
            style={{ width: MENU_WIDTH, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
          >
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
                className="flex-row items-center px-4 py-3"
              >
                <Ionicons name={action.icon} size={18} color={action.color} />
                <Text
                  className="ml-3 text-[14px] font-medium"
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
