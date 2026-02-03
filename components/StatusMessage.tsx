import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';

type StatusType = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  status: StatusType;
  message: string;
  modal?: boolean;
  visible?: boolean;
  onClose?: () => void;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status, message, modal = false, visible = true, onClose }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: 'checkmark.circle.fill' as const,
          color: colors.secondary,
          backgroundColor: '#E8F5E9',
        };
      case 'error':
        return {
          icon: 'xmark.circle.fill' as const,
          color: colors.error,
          backgroundColor: colors.errorBackground,
        };
      case 'warning':
        return {
          icon: 'exclamationmark.triangle.fill' as const,
          color: colors.warning,
          backgroundColor: '#FFF3CD',
        };
      case 'info':
      default:
        return {
          icon: 'info.circle.fill' as const,
          color: colors.primary,
          backgroundColor: colors.highlight,
        };
    }
  };

  const config = getStatusConfig();

  if (modal) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalContainer, { backgroundColor: config.backgroundColor }]}>
            <IconSymbol name={config.icon} size={24} color={config.color} />
            <Text style={[styles.message, { color: config.color }]}>{message}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={16} color={config.color} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <IconSymbol name={config.icon} size={20} color={config.color} />
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    margin: 20,
    maxWidth: 300,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
});

export default StatusMessage;