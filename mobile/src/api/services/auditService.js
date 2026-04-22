import client from '../client';

/**
 * Fetch audit logs with pagination and optional search
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 50)
 * @param {string} search - Optional search query
 * @param {Object} options - Optional configuration (e.g., { signal: AbortSignal })
 * @returns {Promise} Paginated audit logs
 */
export const fetchAuditLogs = (page = 1, perPage = 50, search = '', options = {}) => {
  const params = {
    page,
    per_page: perPage,
  };

  if (search) {
    params.search = search;
  }

  return client.get('/api/admin/audit-logs', { params, ...options });
};

/**
 * Get a single audit log by ID
 * @param {number} id - Audit log ID
 * @returns {Promise} Audit log details
 */
export const getAuditLogById = (id) =>
  client.get(`/api/admin/audit-logs/${id}`);
