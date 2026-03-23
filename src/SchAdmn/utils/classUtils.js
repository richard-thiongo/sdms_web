// API utilities for class management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Format date function
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format date with time
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

// API functions for class management
export const classAPI = {
  // Get all classes in school
  getClasses: async (page = 1, perPage = 20) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/classes?page=${page}&per_page=${perPage}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  },

  // Get class details
  getClassDetails: async (classId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/classes/${classId}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching class details:', error);
      throw error;
    }
  },

  // Get students in a class
  getClassStudents: async (classId, page = 1, perPage = 30) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/classes/${classId}/students?page=${page}&per_page=${perPage}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching class students:', error);
      throw error;
    }
  },

  // Get class incidents
  getClassIncidents: async (classId, page = 1, perPage = 20) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/classes/${classId}/incidents?page=${page}&per_page=${perPage}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching class incidents:', error);
      throw error;
    }
  },

  // Update class name
  updateClass: async (classId, updateData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/classes/${classId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updateData)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  },

  // Delete class
  deleteClass: async (classId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-admin/classes/${classId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  }
};

// API functions for /admin/management endpoints (class_routes.py)
export const managementAPI = {
  // Create class
  createClass: async (classData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/management/classes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(classData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create class');
      return data;
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  },
  
  // Get all classes for admin management
  getClasses: async (schoolId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/management/classes?school_id=${schoolId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch classes');
      return data;
    } catch (error) {
      console.error('Error fetching management classes:', error);
      throw error;
    }
  },

  // Get all teachers for admin management
  getTeachers: async (schoolId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/management/teachers?school_id=${schoolId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch teachers');
      return data;
    } catch (error) {
      console.error('Error fetching management teachers:', error);
      throw error;
    }
  },
  
  // Create teacher
  createTeacher: async (teacherData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/management/teachers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(teacherData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create teacher');
      return data;
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  },

  // Assign teacher to class
  assignTeacherToClass: async (assignmentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/management/assign-teacher`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to assign teacher');
      return data;
    } catch (error) {
      console.error('Error assigning teacher:', error);
      throw error;
    }
  },

  // Unassign teacher from class
  unassignTeacherFromClass: async (classId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/management/classes/${classId}/unassign-teacher`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to unassign teacher');
      return data;
    } catch (error) {
      console.error('Error unassigning teacher:', error);
      throw error;
    }
  },

  // Get available teachers for assignment
  getAvailableTeachers: async (schoolId, excludeAssigned = true) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/management/teachers/available?school_id=${schoolId}&exclude_assigned=${excludeAssigned}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch available teachers');
      return data;
    } catch (error) {
      console.error('Error fetching available teachers:', error);
      throw error;
    }
  }
};


// Helper function to get incident severity label
export const getSeverityLabel = (severity) => {
  switch (severity) {
    case 'A':
      return { label: 'High Severity', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
    case 'B':
      return { label: 'Medium Severity', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' };
    default:
      return { label: 'Unknown', color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.1)' };
  }
};

// Helper function to get punishment status
export const getPunishmentStatus = (punishment) => {
  if (!punishment) return { label: 'No Punishment', color: '#94a3b8' };
  
  const now = new Date();
  const startDate = new Date(punishment.start_date);
  const endDate = new Date(punishment.end_date);
  
  if (punishment.completed) {
    return { label: 'Completed', color: '#22c55e' };
  } else if (now < startDate) {
    return { label: 'Scheduled', color: '#3b82f6' };
  } else if (now >= startDate && now <= endDate) {
    return { label: 'Active', color: '#f59e0b' };
  } else if (now > endDate) {
    return { label: 'Overdue', color: '#ef4444' };
  } else {
    return { label: 'Unknown', color: '#94a3b8' };
  }
};

// Calculate statistics from classes data
export const calculateClassStats = (classes) => {
  const totalClasses = classes.length;
  const classesWithTeacher = classes.filter(c => c.teacher_id).length;
  const classesWithoutTeacher = totalClasses - classesWithTeacher;
  
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0);
  const totalClassIncidents = classes.reduce((sum, cls) => sum + (cls.class_incidents_count || 0), 0);
  const totalIndividualIncidents = classes.reduce((sum, cls) => sum + (cls.individual_incidents_count || 0), 0);
  
  return {
    totalClasses,
    classesWithTeacher,
    classesWithoutTeacher,
    totalStudents,
    totalClassIncidents,
    totalIndividualIncidents,
    totalIncidents: totalClassIncidents + totalIndividualIncidents
  };
};