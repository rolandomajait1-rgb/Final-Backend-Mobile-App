import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InvalidEmailModal({ visible, onClose }) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View 
        style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 20
        }}
      >
        <View 
          style={{ 
            backgroundColor: 'white', 
            width: '100%', 
            maxWidth: 380, 
            borderRadius: 24, 
            padding: 28,
            alignItems: 'center'
          }}
        >
          {/* Error Icon */}
          <View 
            style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              backgroundColor: '#fee2e2', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 20
            }}
          >
            <Ionicons name="mail-outline" size={40} color="#ef4444" />
          </View>

          {/* Title */}
          <Text 
            style={{ 
              fontSize: 24, 
              fontWeight: '800', 
              color: '#1e293b', 
              marginBottom: 12,
              textAlign: 'center'
            }}
          >
            Invalid Email Domain
          </Text>

          {/* Message */}
          <Text 
            style={{ 
              fontSize: 16, 
              color: '#64748b', 
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 28
            }}
          >
            Only La Verdad email addresses are allowed:{'\n'}
            <Text style={{ fontWeight: '700', color: '#ef4444' }}>@laverdad.edu.ph</Text>
            {' or '}
            <Text style={{ fontWeight: '700', color: '#ef4444' }}>@student.laverdad.edu.ph</Text>
          </Text>

          {/* OK Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: '#ef4444',
              width: '60%',
              borderRadius: 50,
              height: 52,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#ef4444',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4
            }}
          >
            <Text style={{ color: 'white', fontSize: 17, fontWeight: '700' }}>
              Got it
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
