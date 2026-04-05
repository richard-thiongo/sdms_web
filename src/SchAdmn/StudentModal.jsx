// StudentModal.jsx - Fixed version with image lightbox
import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, User, GraduationCap, AlertCircle, Calendar,  
  Shield, BookOpen, CheckCircle, Loader2,
  Edit2, Trash2, Eye, RefreshCw,
  Clock, Award, Users, Maximize2, Download, ZoomIn, ZoomOut
} from 'lucide-react';
import { studentAPI, formatDate, formatDateTime, getSeverityColor, getStatusColor, getInitials } from './utils/studentUtils';
import { sanitizeErrorMessage } from '../utils/errorUtils';

const StudentModal = ({ studentData, isOpen, onClose, onUpdate, onDelete, view = 'details' }) => {
  const [activeTab, setActiveTab] = useState(view);
  const [student, setStudent] = useState(studentData);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState({
    incidents: false,
    update: false,
    delete: false
  });
  const [error, setError] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    admission_number: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Lightbox state
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    imageUrl: '',
    imageIndex: 0,
    images: []
  });
  
  // Image zoom state
  const [zoom, setZoom] = useState(1);
  
  // Define fetchStudentIncidents with useCallback to prevent unnecessary recreations
  const fetchStudentIncidents = useCallback(async () => {
    if (!student?.student_id) return;
    
    setLoading(prev => ({ ...prev, incidents: true }));
    setError(null);
    
    try {
      const data = await studentAPI.getStudentIncidents(student.student_id);
      if (data.success) {
        setIncidents(data.data.incidents || []);
      } else {
        setError(sanitizeErrorMessage(data.message, 'Failed to load incidents'));
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  }, [student?.student_id]);
  
  // Fetch student incidents when incidents tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'incidents' && student?.student_id) {
      fetchStudentIncidents();
    }
  }, [isOpen, activeTab, student?.student_id, fetchStudentIncidents]);
  
  // Initialize edit form
  useEffect(() => {
    if (student) {
      setEditForm({
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        admission_number: student.admission_number || ''
      });
    }
  }, [student]);
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, update: true }));
    setError(null);
    
    try {
      const data = await studentAPI.updateStudent(student.student_id, editForm);
      if (data.success) {
        const updatedStudent = { ...student, ...data.data };
        setStudent(updatedStudent);
        if (onUpdate) onUpdate(updatedStudent);
        setActiveTab('details');
      } else {
        setError(sanitizeErrorMessage(data.message, 'Failed to update student'));
      }
    } catch (error) {
      console.error('Error updating student:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };
  
  const handleDelete = async () => {
    setLoading(prev => ({ ...prev, delete: true }));
    setError(null);
    
    try {
      const data = await studentAPI.deleteStudent(student.student_id);
      if (data.success) {
        if (onDelete) onDelete(student.student_id);
        onClose();
      } else {
        setError(sanitizeErrorMessage(data.message, 'Failed to delete student'));
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
      setShowDeleteConfirm(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Check if URL is an image
  const isImageUrl = (url) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.endsWith(ext));
  };
  
  // Open lightbox with specific image
  const openLightbox = (imageUrl, images, index) => {
    setLightbox({
      isOpen: true,
      imageUrl,
      imageIndex: index,
      images: images.filter(url => isImageUrl(url))
    });
    setZoom(1);
  };
  
  // Close lightbox
  const closeLightbox = () => {
    setLightbox({
      isOpen: false,
      imageUrl: '',
      imageIndex: 0,
      images: []
    });
    setZoom(1);
  };
  
  // Navigate to next/prev image
  const navigateImage = useCallback((direction) => {
    const { images, imageIndex } = lightbox;
    if (images.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (imageIndex + 1) % images.length;
    } else {
      newIndex = (imageIndex - 1 + images.length) % images.length;
    }
    
    setLightbox(prev => ({
      ...prev,
      imageUrl: images[newIndex],
      imageIndex: newIndex
    }));
    setZoom(1);
  }, [lightbox]);
  
  // Handle zoom in/out
  const handleZoom = (type) => {
    if (type === 'in') {
      setZoom(prev => Math.min(prev + 0.25, 3));
    } else if (type === 'out') {
      setZoom(prev => Math.max(prev - 0.25, 0.5));
    } else {
      setZoom(1);
    }
  };
  
  // Download image
  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = lightbox.imageUrl;
    link.download = `evidence-${lightbox.imageIndex + 1}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightbox.isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          navigateImage('prev');
          break;
        case 'ArrowRight':
          navigateImage('next');
          break;
        case '+':
        case '=':
          handleZoom('in');
          break;
        case '-':
          handleZoom('out');
          break;
        case '0':
          handleZoom('reset');
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.isOpen, navigateImage]); // Added navigateImage to dependencies
  
  if (!isOpen || !student) return null;
  
  const tabs = [
    { id: 'details', label: 'Student Details', icon: User },
    { id: 'incidents', label: 'Incidents', icon: AlertCircle },
    { id: 'edit', label: 'Edit Student', icon: Edit2 }
  ];
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.8)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.2s ease'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes imageFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes lightboxFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
      {/* Image Lightbox Modal */}
      {lightbox.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'lightboxFadeIn 0.3s ease'
        }}>
          {/* Close button */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.5rem',
              zIndex: 2001,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={24} />
          </button>
          
          {/* Navigation buttons */}
          {lightbox.images.length > 1 && (
            <>
              <button
                onClick={() => navigateImage('prev')}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  zIndex: 2001,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ←
              </button>
              
              <button
                onClick={() => navigateImage('next')}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  zIndex: 2001,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                →
              </button>
            </>
          )}
          
          {/* Image counter */}
          {lightbox.images.length > 1 && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.9rem',
              zIndex: 2001
            }}>
              {lightbox.imageIndex + 1} / {lightbox.images.length}
            </div>
          )}
          
          {/* Zoom controls */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
            padding: '0.5rem',
            display: 'flex',
            gap: '0.5rem',
            zIndex: 2001
          }}>
            <button
              onClick={() => handleZoom('out')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '4px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <ZoomOut size={20} />
            </button>
            
            <button
              onClick={() => handleZoom('reset')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '4px',
                padding: '0 1rem',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {Math.round(zoom * 100)}%
            </button>
            
            <button
              onClick={() => handleZoom('in')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '4px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <ZoomIn size={20} />
            </button>
            
            <button
              onClick={downloadImage}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '4px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                marginLeft: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <Download size={20} />
            </button>
          </div>
          
          {/* Main image */}
          <div style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={lightbox.imageUrl}
              alt={`Evidence ${lightbox.imageIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s ease'
              }}
            />
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.95)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem',
              color: '#fca5a5'
            }}>
              <AlertCircle size={24} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                Confirm Deletion
              </h3>
            </div>
            
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>{student.first_name} {student.last_name}</strong>? 
              This action will affect {student.total_incidents || 0} incident(s). 
              This action cannot be undone.
            </p>
            
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#fca5a5',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading.delete}
                style={{
                  background: 'rgba(148, 163, 184, 0.1)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  padding: '0.75rem 1.25rem',
                  color: '#cbd5e1',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                  e.currentTarget.style.color = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleDelete}
                disabled={loading.delete}
                style={{
                  background: 'rgba(239, 68, 68, 0.9)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem 1.25rem',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: loading.delete ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  opacity: loading.delete ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading.delete) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading.delete) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                  }
                }}
              >
                {loading.delete ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Modal */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.9)',
        borderRadius: '24px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        animation: 'slideUp 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(30, 41, 59, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              {getInitials(student.first_name, student.last_name)}
            </div>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#f1f5f9',
                marginBottom: '2px'
              }}>
                {student.first_name} {student.last_name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                <GraduationCap size={14} />
                {student.admission_number}
                {student.class_name && (
                  <>
                    <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>•</span>
                    <BookOpen size={14} />
                    {student.class_name}
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '0.5rem',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
              e.currentTarget.style.color = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          background: 'rgba(15, 23, 42, 0.3)'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? '#8b5cf6' : 'transparent'}`,
                  color: isActive ? '#f1f5f9' : '#94a3b8',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Student Info Card */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#f1f5f9',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <User size={18} />
                    Student Information
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>
                        Full Name
                      </div>
                      <div style={{ color: '#f1f5f9', fontSize: '1.05rem', fontWeight: '500' }}>
                        {student.first_name} {student.last_name}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>
                        Admission Number
                      </div>
                      <div style={{ color: '#f1f5f9', fontSize: '1.05rem', fontWeight: '500' }}>
                        {student.admission_number}
                      </div>
                    </div>
                    
                    {student.class_name ? (
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>
                          Class
                        </div>
                        <div style={{ 
                          color: '#f1f5f9', 
                          fontSize: '1.05rem', 
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <BookOpen size={16} />
                          {student.class_name}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ color: '#f59e0b', fontSize: '0.9rem', marginBottom: '4px' }}>
                          Class Assignment
                        </div>
                        <div style={{ color: '#f59e0b', fontStyle: 'italic' }}>
                          Not assigned to any class
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>
                        Created On
                      </div>
                      <div style={{ 
                        color: '#f1f5f9', 
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Calendar size={14} />
                        {formatDate(student.created_at)}
                      </div>
                    </div>
                    
                    {student.updated_at && (
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>
                          Last Updated
                        </div>
                        <div style={{ 
                          color: '#f1f5f9', 
                          fontSize: '0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Calendar size={14} />
                          {formatDate(student.updated_at)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Statistics Card */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#f1f5f9',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Shield size={18} />
                    Student Statistics
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                          <AlertCircle size={14} />
                          <span style={{ fontSize: '0.9rem' }}>Total Incidents</span>
                        </div>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: '700',
                          color: student.total_incidents > 0 ? '#ef4444' : '#22c55e'
                        }}>
                          {student.total_incidents || 0}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        All reported incidents for this student
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                          <Clock size={14} />
                          <span style={{ fontSize: '0.9rem' }}>Active Punishments</span>
                        </div>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: '700',
                          color: student.active_punishments > 0 ? '#f59e0b' : '#22c55e'
                        }}>
                          {student.active_punishments || 0}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Currently active punishments
                      </div>
                    </div>
                    
                    {student.teacher_first_name && (
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                            <Users size={14} />
                            <span style={{ fontSize: '0.9rem' }}>Created By Teacher</span>
                          </div>
                        </div>
                        <div style={{ 
                          color: '#f1f5f9',
                          fontSize: '0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}>
                            {getInitials(student.teacher_first_name, student.teacher_last_name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500' }}>
                              {student.teacher_first_name} {student.teacher_last_name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                              {student.teacher_email}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.1)'
              }}>
                <button
                  onClick={() => setActiveTab('incidents')}
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem 1.25rem',
                    color: '#93c5fd',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                    e.currentTarget.style.color = '#bfdbfe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    e.currentTarget.style.color = '#93c5fd';
                  }}
                >
                  <Eye size={16} />
                  View Incidents
                </button>
                
                <button
                  onClick={() => setActiveTab('edit')}
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem 1.25rem',
                    color: '#c4b5fd',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.color = '#ddd6fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.color = '#c4b5fd';
                  }}
                >
                  <Edit2 size={16} />
                  Edit Student
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem 1.25rem',
                    color: '#fca5a5',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.color = '#fecaca';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#fca5a5';
                  }}
                >
                  <Trash2 size={16} />
                  Delete Student
                </button>
              </div>
            </div>
          )}
          
          {/* Incidents Tab */}
          {activeTab === 'incidents' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={20} />
                  Student Incidents
                </h3>
                
                <button
                  onClick={fetchStudentIncidents}
                  disabled={loading.incidents}
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    cursor: loading.incidents ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading.incidents) {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                      e.currentTarget.style.color = '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading.incidents) {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                      e.currentTarget.style.color = '#cbd5e1';
                    }
                  }}
                >
                  {loading.incidents ? (
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Refresh
                </button>
              </div>
              
              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              {loading.incidents ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                  <p>Loading incidents...</p>
                </div>
              ) : incidents.length === 0 ? (
                <div style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  border: '1px dashed rgba(148, 163, 184, 0.2)',
                  color: '#94a3b8'
                }}>
                  <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <h4 style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                    No Incidents Found
                  </h4>
                  <p style={{ fontSize: '0.9rem' }}>
                    This student has no reported incidents.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {incidents.map((incident) => {
                    const evidenceUrls = incident.evidence_urls || [];
                    const imageUrls = evidenceUrls.filter(url => isImageUrl(url));
                    
                    return (
                      <div
                        key={incident.incident_id}
                        style={{
                          background: 'rgba(30, 41, 59, 0.6)',
                          borderRadius: '12px',
                          padding: '1.25rem',
                          border: '1px solid rgba(148, 163, 184, 0.1)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          marginBottom: '0.75rem'
                        }}>
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              marginBottom: '0.5rem'
                            }}>
                              <div style={{
                                background: getSeverityColor(incident.severity) + '20',
                                color: getSeverityColor(incident.severity),
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                              }}>
                                {incident.severity === 'S' ? 'SEVERE' : 
                                 incident.severity === 'A' ? 'AVERAGE' : 'BASIC'}
                              </div>
                              
                              <div style={{
                                background: getStatusColor(incident.status) + '20',
                                color: getStatusColor(incident.status),
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                              }}>
                                {incident.status?.toUpperCase()}
                              </div>
                            </div>
                            
                            <div style={{ color: '#f1f5f9', fontWeight: '500', marginBottom: '0.5rem' }}>
                              {incident.description || 'No description provided'}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} />
                                {formatDateTime(incident.created_at)}
                              </div>
                              
                              {incident.class_name && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <BookOpen size={12} />
                                  {incident.class_name}
                                </div>
                              )}
                              
                              {incident.teacher_first_name && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Users size={12} />
                                  Reported by: {incident.teacher_first_name} {incident.teacher_last_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Evidence URLs with Image Preview */}
                        {evidenceUrls.length > 0 && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <div style={{ 
                              color: '#94a3b8', 
                              fontSize: '0.85rem', 
                              marginBottom: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span>Evidence:</span>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                background: 'rgba(148, 163, 184, 0.1)', 
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px'
                              }}>
                                {imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''}, {evidenceUrls.length - imageUrls.length} file{evidenceUrls.length - imageUrls.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                              {evidenceUrls.map((url, index) => {
                                const isImage = isImageUrl(url);
                                
                                return (
                                  <div key={index} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    maxWidth: '200px'
                                  }}>
                                    {isImage ? (
                                      <div style={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: '8px',
                                        animation: 'imageFadeIn 0.3s ease',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => openLightbox(url, evidenceUrls, index)}
                                      >
                                        <img
                                          src={url}
                                          alt={`Evidence ${index + 1}`}
                                          style={{
                                            width: '100%',
                                            height: '120px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(148, 163, 184, 0.2)',
                                            transition: 'all 0.2s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.target.style.transform = 'scale(1.05)';
                                            e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.transform = 'scale(1)';
                                            e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                                          }}
                                        />
                                        <div style={{
                                          position: 'absolute',
                                          top: '0.25rem',
                                          right: '0.25rem',
                                          background: 'rgba(0, 0, 0, 0.7)',
                                          color: 'white',
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '4px',
                                          fontSize: '0.7rem',
                                          fontWeight: '500',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '2px'
                                        }}>
                                          <Maximize2 size={10} />
                                          Expand
                                        </div>
                                        <div style={{
                                          position: 'absolute',
                                          bottom: '0.25rem',
                                          left: '0.25rem',
                                          background: 'rgba(0, 0, 0, 0.7)',
                                          color: 'white',
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '4px',
                                          fontSize: '0.7rem',
                                          fontWeight: '500'
                                        }}>
                                          Image {index + 1}
                                        </div>
                                      </div>
                                    ) : (
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          background: 'rgba(59, 130, 246, 0.1)',
                                          color: '#93c5fd',
                                          padding: '0.75rem',
                                          borderRadius: '8px',
                                          fontSize: '0.8rem',
                                          textDecoration: 'none',
                                          transition: 'all 0.2s ease',
                                          textAlign: 'center',
                                          border: '1px solid rgba(59, 130, 246, 0.2)'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                          e.currentTarget.style.color = '#bfdbfe';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                          e.currentTarget.style.color = '#93c5fd';
                                        }}
                                      >
                                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                          Evidence {index + 1}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                          Click to view file
                                        </div>
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Punishment Details */}
                        {incident.punishment_name && (
                          <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(245, 158, 11, 0.2)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <Award size={14} color="#f59e0b" />
                              <div style={{ color: '#f59e0b', fontWeight: '600' }}>
                                Punishment: {incident.punishment_name}
                              </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.85rem' }}>
                              <div style={{ color: '#94a3b8' }}>
                                Assigned: {formatDate(incident.punishment_assigned_at)}
                              </div>
                              
                              {incident.punishment_start_date && (
                                <div style={{ color: '#94a3b8' }}>
                                  Start: {formatDate(incident.punishment_start_date)}
                                </div>
                              )}
                              
                              {incident.punishment_end_date && (
                                <div style={{ color: '#94a3b8' }}>
                                  End: {formatDate(incident.punishment_end_date)}
                                </div>
                              )}
                              
                              <div style={{ 
                                color: incident.punishment_completed ? '#22c55e' : '#f59e0b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {incident.punishment_completed ? (
                                  <>
                                    <CheckCircle size={12} />
                                    Completed
                                  </>
                                ) : (
                                  <>
                                    <Clock size={12} />
                                    In Progress
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {incident.assigned_by_first_name && (
                              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                Assigned by: {incident.assigned_by_first_name} {incident.assigned_by_last_name}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {incidents.length > 0 && (
                <div style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}>
                  Showing {incidents.length} incident(s) for this student
                </div>
              )}
            </div>
          )}
          
          {/* Edit Tab */}
          {activeTab === 'edit' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#f1f5f9',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Edit2 size={20} />
                Edit Student Information
              </h3>
              
              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit}>
                <div style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {/* First Name */}
                    <div>
                      <label style={{
                        display: 'block',
                        color: '#cbd5e1',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={editForm.first_name}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '0.95rem',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#8b5cf6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    {/* Last Name */}
                    <div>
                      <label style={{
                        display: 'block',
                        color: '#cbd5e1',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={editForm.last_name}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '0.95rem',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#8b5cf6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    
                    {/* Admission Number */}
                    <div>
                      <label style={{
                        display: 'block',
                        color: '#cbd5e1',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}>
                        Admission Number *
                      </label>
                      <input
                        type="text"
                        name="admission_number"
                        value={editForm.admission_number}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '0.95rem',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#8b5cf6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    style={{
                      background: 'rgba(148, 163, 184, 0.1)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '0.75rem 1.25rem',
                      color: '#cbd5e1',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                      e.currentTarget.style.color = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                      e.currentTarget.style.color = '#cbd5e1';
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading.update}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.25rem',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: loading.update ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      opacity: loading.update ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading.update) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(139, 92, 246, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading.update) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {loading.update ? (
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Update Student
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(148, 163, 184, 0.2)',
          background: 'rgba(30, 41, 59, 0.3)',
          color: '#94a3b8',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            Student ID: {student.student_id?.substring(0, 8)}...
          </div>
          <div>
            Last updated: {formatDateTime(student.updated_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentModal;