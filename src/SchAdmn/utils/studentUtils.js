// utils/studentUtils.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API functions
export const studentAPI = {
  // Get all students in school
  getStudents: async (params = {}) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');
      
      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/school-admin/students${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // Get student details
  getStudentDetails: async (studentId) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_BASE_URL}/school-admin/students/${studentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching student details:', error);
      throw error;
    }
  },

  // Get student incidents
  getStudentIncidents: async (studentId, params = {}) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');
      
      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/school-admin/students/${studentId}/incidents${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching student incidents:', error);
      throw error;
    }
  },

  // Update student
  updateStudent: async (studentId, updateData) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_BASE_URL}/school-admin/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  // Delete student
  deleteStudent: async (studentId) => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_BASE_URL}/school-admin/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }
};

// Utility functions
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
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

export const calculateStudentStats = (students) => {
  const stats = {
    totalStudents: students.length,
    studentsWithIncidents: 0,
    studentsWithActivePunishments: 0,
    studentsWithoutClass: 0
  };
  
  students.forEach(student => {
    if (student.total_incidents > 0) {
      stats.studentsWithIncidents++;
    }
    if (student.active_punishments > 0) {
      stats.studentsWithActivePunishments++;
    }
    if (!student.class_id) {
      stats.studentsWithoutClass++;
    }
  });
  
  return stats;
};

export const getSeverityColor = (severity) => {
  switch (severity) {
    case 'S': return '#ef4444'; // Severe - Red
    case 'A': return '#f59e0b'; // Average - Amber
    case 'B': return '#22c55e'; // Basic - Green
    default: return '#94a3b8';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'approved': return '#22c55e'; // Green
    case 'pending': return '#f59e0b'; // Amber
    case 'rejected': return '#ef4444'; // Red
    default: return '#94a3b8';
  }
};



// Add to utils/studentUtils.js

// Class API functions
export const classAPI = {
  // Get all classes for filter dropdown
  getClasses: async () => {
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_BASE_URL}/school-admin/classes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  }
};

// Generate initials from name
export const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

// Format full name
export const getFullName = (firstName, lastName) => {
  return `${firstName || ''} ${lastName || ''}`.trim();
};