/**
 * Simplified S-tier Incidents Utility Functions
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAuthToken = () => localStorage.getItem('access_token');

const getHeaders = (includeJson = true) => {
  const headers = {
    'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : '',
  };
  
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

// Clean API Functions - ONLY send what's needed
const API = {
  getStierIncidents: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', params.page || 1);
      queryParams.append('per_page', params.per_page || 20);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.student_id) queryParams.append('student_id', params.student_id);
      if (params.class_id) queryParams.append('class_id', params.class_id);
      
      const response = await fetch(
        `${API_BASE_URL}/school-admin/s-tier/incidents?${queryParams}`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return { 
        success: false, 
        message: 'Network error',
        data: { incidents: [], pagination: {} }
      };
    }
  },

  getStierIncidentDetails: async (incidentId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/s-tier/incidents/${incidentId}`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Update incident - only send description
  updateStierIncident: async (incidentId, description) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/s-tier/incidents/${incidentId}`,
        {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ description }),
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Review incident - NO rejection reason needed
  reviewStierIncident: async (incidentId, action) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/s-tier/incidents/${incidentId}/review`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ action }), // Only action, no rejection_reason
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  addEvidenceToStierIncident: async (incidentId, files) => {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('evidence', file));
      
      const response = await fetch(
        `${API_BASE_URL}/school-admin/s-tier/incidents/${incidentId}/evidence`,
        {
          method: 'POST',
          headers: { 'Authorization': getHeaders().Authorization },
          body: formData,
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  deleteEvidenceFromStierIncident: async (incidentId, evidenceUrl) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/s-tier/incidents/${incidentId}/evidence`,
        {
          method: 'DELETE',
          headers: getHeaders(),
          body: JSON.stringify({ evidence_url: evidenceUrl }),
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Add punishment - only required fields
  addPunishmentToStierIncident: async (incidentId, name, start_date, end_date, description = '') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/s-tier/incidents/${incidentId}/punishment`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ 
            name, 
            start_date, 
            end_date, 
            description 
          }),
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Update punishment - only fields that can be updated
  updatePunishment: async (incidentId, updates) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/s-tier/incidents/${incidentId}/punishment`,
        {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(updates),
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  softDeleteStierIncident: async (incidentId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/s-tier/incidents/${incidentId}`,
        {
          method: 'DELETE',
          headers: getHeaders(),
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return { success: false, message: 'Network error' };
    }
  },
};

// UI utilities (unchanged)
const getStierSeverityBadge = () => ({
  label: 'S-Tier',
  color: '#8b5cf6',
  bgColor: 'rgba(139, 92, 246, 0.1)',
});

const getStierStatusBadge = (status) => {
  const config = {
    pending: { label: 'Pending', color: '#f59e0b', bgColor: '#fef3c7' },
    approved: { label: 'Approved', color: '#10b981', bgColor: '#d1fae5' },
    rejected: { label: 'Rejected', color: '#ef4444', bgColor: '#fee2e2' },
  };
  return config[status] || { label: status, color: '#94a3b8', bgColor: '#f1f5f9' };
};

const getPunishmentStatusBadge = (completed, endDate) => {
  const today = new Date();
  const end = new Date(endDate);
  
  if (completed) {
    return { label: 'Completed', color: '#10b981', bgColor: '#d1fae5' };
  } else if (end < today) {
    return { label: 'Overdue', color: '#ef4444', bgColor: '#fee2e2' };
  } else {
    return { label: 'Active', color: '#3b82f6', bgColor: '#dbeafe' };
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

const formatSimpleDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

const processEvidenceUrls = (evidenceUrl) => {
  if (!evidenceUrl) return [];
  return evidenceUrl.split(',').filter(url => url.trim());
};

const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const stierUtils = {
  API,
  getStierSeverityBadge,
  getStierStatusBadge,
  getPunishmentStatusBadge,
  formatDate,
  formatSimpleDate,
  processEvidenceUrls,
  validateDateRange,
  formatFileSize,
};

export default stierUtils;