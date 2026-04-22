import { DeviceEventEmitter } from 'react-native';

/**
 * Show a toast notification for audit trail events
 * Emits an event to the global ToastProvider
 * @param {string} type - 'success' or 'error'
 * @param {string} message - The notification message
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export const showAuditToast = (type, message, duration = 3000) => {
  DeviceEventEmitter.emit('SHOW_TOAST', { type, message, duration });
};

/**
 * Show success toast for article operations
 */
export const showArticleSuccessToast = (action) => {
  const messages = {
    edited: 'Article Edited Successfully',
    published: 'Article Published Successfully',
    saved: 'Draft Saved Successfully',
    deleted: 'Article Deleted Successfully',
    discarded: 'Draft Discarded Successfully',
  };
  showAuditToast('success', messages[action] || 'Operation Successful');
};

/**
 * Show error toast for article operations
 */
export const showArticleErrorToast = (action) => {
  const messages = {
    edited: 'Article Edited Unsuccessfully',
    published: 'Article Published Unsuccessfully',
    deleted: 'Article Deleted Unsuccessfully',
    discarded: 'Draft Discarded Unsuccessfully',
  };
  showAuditToast('error', messages[action] || 'Operation Failed');
};

/**
 * Generic toast notification handler for audit events
 * @param {object} auditEvent - { action, status, message }
 */
export const showAuditEventToast = (auditEvent) => {
  const { action, status, message } = auditEvent;
  const isSuccess = status === 'success';
  
  showAuditToast(
    isSuccess ? 'success' : 'error',
    message || `${action} ${isSuccess ? 'Successfully' : 'Unsuccessfully'}`
  );
};
