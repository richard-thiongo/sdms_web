// utils/incidentUtils.js
import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Incident API Functions
export const incidentAPI = {
  // Get all A/B incidents with optional filters
  getIncidents: async (params = {}) => {
    try {
      const { page = 1, per_page = 20, severity, student_id, class_id } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('per_page', per_page);
      
      if (severity) queryParams.append('severity', severity);
      if (student_id) queryParams.append('student_id', student_id);
      if (class_id) queryParams.append('class_id', class_id);
      
      const response = await apiClient.get(`/school-admin/incidents?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching incidents:', error);
      throw error;
    }
  },

  // Get specific incident details
  getIncidentDetails: async (incidentId) => {
    try {
      const response = await apiClient.get(`/school-admin/incidents/${incidentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching incident details:', error);
      throw error;
    }
  },

  // Update incident status (approve/reject only - no "approved" status)
  updateIncidentStatus: async (incidentId, status) => {
    try {
      const response = await apiClient.put(`/incidents/${incidentId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating incident status:', error);
      throw error;
    }
  }
};

// Formatting Functions
export const formatIncidentDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatPunishmentDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getSeverityBadge = (severity) => {
  const config = {
    'A': { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'A-Tier' }, // Green for A-tier
    'B': { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', label: 'B-Tier' }, // Yellow for B-tier
    'S': { color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)', label: 'S-Tier' }
  };
  
  return config[severity] || { color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.1)', label: severity };
};

export const getStatusBadge = (status) => {
  const config = {
    'pending': { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', label: 'Pending Review' },
    'rejected': { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'Rejected' }
    // Removed 'approved' status
  };
  
  return config[status] || { color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.1)', label: status };
};

export const getPunishmentStatus = (punishment) => {
  if (!punishment) return { color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.1)', label: 'No Punishment' };
  
  if (punishment.completed) {
    return { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'Completed' };
  }
  
  const today = new Date();
  const endDate = new Date(punishment.end_date);
  
  if (endDate < today) {
    return { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'Overdue' };
  }
  
  return { color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', label: 'Active' };
};

export const processEvidenceUrls = (evidenceString) => {
  if (!evidenceString) return [];
  return evidenceString.split(',').map(url => url.trim()).filter(url => url);
};

export const calculateIncidentStats = (incidents) => {
  const stats = {
    totalIncidents: incidents.length,
    aTierCount: 0,
    bTierCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    withPunishment: 0,
    withoutPunishment: 0,
    activePunishments: 0,
    completedPunishments: 0,
    overduePunishments: 0
  };

  incidents.forEach(incident => {
    // Severity counts
    if (incident.severity === 'A') stats.aTierCount++;
    if (incident.severity === 'B') stats.bTierCount++;
    
    // Status counts (only pending and rejected)
    if (incident.status === 'pending') stats.pendingCount++;
    if (incident.status === 'rejected') stats.rejectedCount++;
    
    // Punishment counts
    if (incident.punishment_id) {
      stats.withPunishment++;
      if (incident.punishment_completed) {
        stats.completedPunishments++;
      } else if (incident.punishment_end_date) {
        const endDate = new Date(incident.punishment_end_date);
        const today = new Date();
        if (endDate < today) {
          stats.overduePunishments++;
        } else {
          stats.activePunishments++;
        }
      }
    } else {
      stats.withoutPunishment++;
    }
  });

  return stats;
};

export const getStudentInitials = (firstName, lastName) => {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return `${first}${last}`.toUpperCase();
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};