// SchAdmin/utils/teacherUtils.js
const API_URL = process.env.REACT_APP_API_URL;

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

// Get school ID from user data
const getSchoolId = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.school_id;
    }
    return null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Format date to readable format
const formatDate = (dateString) => {
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

// Truncate text with ellipsis
const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Validate email
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Extract base URL for Cloudinary images (for display)
const getImageUrl = (url) => {
  if (!url) return null;
  // Add any transformations needed for image display
  return url;
};

// API Functions
export const teacherAPI = {
  // Get all teachers in school
  getTeachers: async () => {
    const token = getAuthToken();
    const schoolId = getSchoolId();
    
    if (!token || !schoolId) {
      throw new Error('Authentication required');
    }
    
    try {
      const response = await fetch(`${API_URL}/school-admin/teachers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },
  
  // Get teacher details
  getTeacherDetails: async (teacherId) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    try {
      const response = await fetch(`${API_URL}/school-admin/teachers/${teacherId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching teacher details:', error);
      throw error;
    }
  },
  
  // Get teacher incidents
  getTeacherIncidents: async (teacherId) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    try {
      const response = await fetch(`${API_URL}/school-admin/teachers/${teacherId}/incidents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching teacher incidents:', error);
      throw error;
    }
  },
  
  // Get teacher class incidents
  getTeacherClassIncidents: async (teacherId) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    try {
      const response = await fetch(`${API_URL}/school-admin/teachers/${teacherId}/class-incidents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching teacher class incidents:', error);
      throw error;
    }
  },
  
  // Update teacher
  updateTeacher: async (teacherId, updateData) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    try {
      const response = await fetch(`${API_URL}/school-admin/teachers/${teacherId}`, {
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
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  },
  
  // Delete teacher
  deleteTeacher: async (teacherId) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    try {
      const response = await fetch(`${API_URL}/school-admin/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  }
};

export { formatDate, truncateText, isValidEmail, getImageUrl };