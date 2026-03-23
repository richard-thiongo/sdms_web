// SchAdmin/TeacherModal.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, User, Mail, Calendar, BookOpen, AlertCircle, 
  Edit, Trash2, CheckCircle, Loader2,
  ChevronLeft, ChevronRight,
  FileText, Users as UsersIcon,
  Maximize2, ChevronLeft as LeftIcon,
  ChevronRight as RightIcon
} from 'lucide-react';
import { teacherAPI, formatDate, getImageUrl } from './utils/teacherUtils';

const TeacherModal = ({ 
  teacher, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete,
  view = 'details' // 'details', 'edit', 'delete'
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [incidents, setIncidents] = useState([]);
  const [classIncidents, setClassIncidents] = useState([]);
  const [loading, setLoading] = useState({
    incidents: false,
    classIncidents: false,
    saving: false,
    deleting: false
  });
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [viewMode, setViewMode] = useState(view);
  
  // New states for image viewer
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // State for scrollable tabs
  const tabsRef = useRef(null);

  // Initialize edit form when teacher changes
  useEffect(() => {
    if (teacher) {
      setEditForm({
        first_name: teacher.first_name || '',
        last_name: teacher.last_name || '',
        email: teacher.email || ''
      });
    }
  }, [teacher]);

  // Fetch incidents when modal opens
  const fetchIncidents = useCallback(async () => {
    if (!teacher) return;
    
    setLoading(prev => ({ ...prev, incidents: true }));
    try {
      const data = await teacherAPI.getTeacherIncidents(teacher.user_id);
      if (data.success) {
        setIncidents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(prev => ({ ...prev, incidents: false }));
    }
  }, [teacher]);

  useEffect(() => {
    if (isOpen && teacher && activeTab === 'incidents') {
      fetchIncidents();
    }
  }, [isOpen, teacher, activeTab, fetchIncidents]);


  const fetchClassIncidents = async () => {
    if (!teacher) return;
    
    setLoading(prev => ({ ...prev, classIncidents: true }));
    try {
      const data = await teacherAPI.getTeacherClassIncidents(teacher.user_id);
      if (data.success) {
        setClassIncidents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching class incidents:', error);
    } finally {
      setLoading(prev => ({ ...prev, classIncidents: false }));
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'class-incidents' && classIncidents.length === 0) {
      fetchClassIncidents();
    }
  };

  // Image viewer functions
  const openImageFullscreen = (imageUrl, imageIndex, evidenceUrls) => {
    setFullscreenImage({
      url: getImageUrl(imageUrl),
      index: imageIndex,
      total: evidenceUrls.length,
      evidenceUrls: evidenceUrls
    });
    setCurrentImageIndex(imageIndex);
  };

  const closeImageFullscreen = () => {
    setFullscreenImage(null);
    setCurrentImageIndex(0);
  };

  const navigateImage = (direction) => {
    if (!fullscreenImage) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentImageIndex + 1) % fullscreenImage.evidenceUrls.length;
    } else {
      newIndex = (currentImageIndex - 1 + fullscreenImage.evidenceUrls.length) % fullscreenImage.evidenceUrls.length;
    }
    
    setCurrentImageIndex(newIndex);
    setFullscreenImage(prev => ({
      ...prev,
      url: getImageUrl(fullscreenImage.evidenceUrls[newIndex]),
      index: newIndex
    }));
  };

  const validateEditForm = () => {
    const newErrors = {};
    
    if (!editForm.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!editForm.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!editForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateEditForm()) return;
    
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      const data = await teacherAPI.updateTeacher(teacher.user_id, editForm);
      if (data.success) {
        onUpdate(data.data);
        setViewMode('details');
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleDelete = async () => {
    setLoading(prev => ({ ...prev, deleting: true }));
    try {
      const data = await teacherAPI.deleteTeacher(teacher.user_id);
      if (data.success) {
        onDelete(teacher.user_id);
        onClose();
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
    } finally {
      setLoading(prev => ({ ...prev, deleting: false }));
    }
  };

  // Enhanced evidence images display with fullscreen capability
  const renderEvidenceImages = (evidenceUrls, incidentIndex) => {
    if (!evidenceUrls || evidenceUrls.length === 0) {
      return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No evidence</span>;
    }
    
    return (
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '8px',
        marginTop: '8px'
      }}>
        {evidenceUrls.map((url, idx) => {
          const imageUrl = getImageUrl(url);
          return (
            <div 
              key={idx}
              style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => openImageFullscreen(url, idx, evidenceUrls)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img
                src={imageUrl}
                alt={`Evidence ${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div style="
                      width: 100%;
                      height: 100%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      background: rgba(30, 41, 59, 0.5);
                      color: #94a3b8;
                      font-size: 12px;
                    ">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                  `;
                }}
              />
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '4px',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <Maximize2 size={10} color="white" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Fullscreen Image Viewer Component
  const FullscreenImageViewer = () => {
    if (!fullscreenImage) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease'
      }}>
        <button
          onClick={closeImageFullscreen}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
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
          <X size={20} />
        </button>

        {/* Previous Image Button */}
        {fullscreenImage.total > 1 && (
          <button
            onClick={() => navigateImage('prev')}
            style={{
              position: 'absolute',
              left: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              zIndex: 2001,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <LeftIcon size={20} />
          </button>
        )}

        {/* Next Image Button */}
        {fullscreenImage.total > 1 && (
          <button
            onClick={() => navigateImage('next')}
            style={{
              position: 'absolute',
              right: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              zIndex: 2001,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <RightIcon size={20} />
          </button>
        )}

        {/* Image Counter */}
        {fullscreenImage.total > 1 && (
          <div style={{
            position: 'absolute',
            top: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            fontSize: '0.9rem',
            zIndex: 2001
          }}>
            {fullscreenImage.index + 1} / {fullscreenImage.total}
          </div>
        )}

        {/* Main Image */}
        <div style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img
            src={fullscreenImage.url}
            alt={`Evidence ${fullscreenImage.index + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              const container = e.target.parentElement;
              container.innerHTML = `
                <div style="
                  width: 400px;
                  height: 400px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  background: rgba(30, 41, 59, 0.5);
                  color: #94a3b8;
                  border-radius: 12px;
                  padding: 2rem;
                  text-align: center;
                ">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.5;">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <div style="font-size: 1.1rem; margin-bottom: 0.5rem; color: #cbd5e1;">
                    Image Not Available
                  </div>
                  <div style="font-size: 0.9rem; opacity: 0.8;">
                    The evidence image could not be loaded
                  </div>
                </div>
              `;
            }}
          />
        </div>

        {/* Download Button */}
        <a
          href={fullscreenImage.url}
          download={`evidence-${fullscreenImage.index + 1}.jpg`}
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(139, 92, 246, 0.9)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            color: 'white',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139, 92, 246, 1)';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.9)';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          }}
        >
          <Maximize2 size={16} />
          Download Image
        </a>
      </div>
    );
  };

  if (!isOpen || !teacher) return null;

  return (
    <>
      {/* Fullscreen Image Viewer */}
      <FullscreenImageViewer />
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.9)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'hidden',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(24px)'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {teacher.first_name?.[0]}{teacher.last_name?.[0]}
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#f1f5f9',
                  margin: 0
                }}>
                  {teacher.first_name} {teacher.last_name}
                </h2>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                  {teacher.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
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
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* View Mode Navigation */}
            {viewMode === 'details' && (
              <>
                {/* Scrollable Tabs Container */}
                <div style={{
                  position: 'relative',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                  background: 'rgba(15, 23, 42, 0.3)',
                  padding: '0 2rem',
                  minHeight: '60px'
                }}>

                  {/* Scrollable Tabs */}
                  <div
                    ref={tabsRef}
                    style={{
                      display: 'flex',
                      overflowX: 'auto',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      padding: '0 0.5rem',
                      scrollBehavior: 'smooth'
                    }}
                  >
                    <style>
                      {`
                        .scrollable-tabs::-webkit-scrollbar {
                          display: none;
                        }
                      `}
                    </style>
                    {['details', 'incidents', 'class-incidents'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => handleTabClick(tab)}
                        style={{
                          padding: '1rem 1.5rem',
                          background: 'none',
                          border: 'none',
                          borderBottom: activeTab === tab ? '2px solid #8b5cf6' : '2px solid transparent',
                          color: activeTab === tab ? '#8b5cf6' : '#94a3b8',
                          fontWeight: activeTab === tab ? '600' : '500',
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          if (activeTab !== tab) {
                            e.currentTarget.style.color = '#cbd5e1';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== tab) {
                            e.currentTarget.style.color = '#94a3b8';
                          }
                        }}
                      >
                        {tab === 'details' && <User size={16} />}
                        {tab === 'incidents' && <AlertCircle size={16} />}
                        {tab === 'class-incidents' && <UsersIcon size={16} />}
                        {tab.replace('-', ' ').charAt(0).toUpperCase() + tab.replace('-', ' ').slice(1)}
                        {tab === 'incidents' && incidents.length > 0 && (
                          <span style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            color: '#c4b5fd',
                            fontSize: '0.75rem',
                            padding: '2px 6px',
                            borderRadius: '999px',
                            marginLeft: '4px'
                          }}>
                            {incidents.length}
                          </span>
                        )}
                        {tab === 'class-incidents' && classIncidents.length > 0 && (
                          <span style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            color: '#c4b5fd',
                            fontSize: '0.75rem',
                            padding: '2px 6px',
                            borderRadius: '999px',
                            marginLeft: '4px'
                          }}>
                            {classIncidents.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.5rem'
                }}>
                  {activeTab === 'details' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Basic Info */}
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid rgba(148, 163, 184, 0.1)'
                      }}>
                        <h3 style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#cbd5e1',
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <User size={18} />
                          Teacher Information
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                          <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>First Name</div>
                            <div style={{ color: '#f1f5f9', fontWeight: '500' }}>{teacher.first_name}</div>
                          </div>
                          <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Last Name</div>
                            <div style={{ color: '#f1f5f9', fontWeight: '500' }}>{teacher.last_name}</div>
                          </div>
                          <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Email</div>
                            <div style={{ color: '#f1f5f9', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Mail size={14} />
                              {teacher.email}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Joined</div>
                            <div style={{ color: '#f1f5f9', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} />
                              {formatDate(teacher.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        {teacher.class_name && (
                          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Class Assignment</div>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              background: 'rgba(139, 92, 246, 0.1)',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(139, 92, 246, 0.2)'
                            }}>
                              <BookOpen size={16} color="#8b5cf6" />
                              <span style={{ color: '#c4b5fd', fontWeight: '500' }}>{teacher.class_name}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Stats */}
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '1rem' }}>
                            Incident Statistics
                          </h4>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{
                              background: 'rgba(30, 41, 59, 0.6)',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(148, 163, 184, 0.1)',
                              minWidth: '120px'
                            }}>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Individual Incidents</div>
                              <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.5rem' }}>
                                {teacher.individual_incidents_count || 0}
                              </div>
                            </div>
                            <div style={{
                              background: 'rgba(30, 41, 59, 0.6)',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(148, 163, 184, 0.1)',
                              minWidth: '120px'
                            }}>
                              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Class Incidents</div>
                              <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.5rem' }}>
                                {teacher.class_incidents_count || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'incidents' && (
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                      }}>
                        <h3 style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <AlertCircle size={18} />
                          Individual Incidents Reported
                          <span style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            color: '#c4b5fd',
                            fontSize: '0.8rem',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            marginLeft: '8px'
                          }}>
                            {incidents.length}
                          </span>
                        </h3>
                        
                        <button
                          onClick={fetchIncidents}
                          disabled={loading.incidents}
                          style={{
                            background: 'rgba(30, 41, 59, 0.8)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            color: '#cbd5e1',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                          }}
                        >
                          {loading.incidents ? (
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                          Refresh
                        </button>
                      </div>
                      
                      {loading.incidents ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                          <p>Loading incidents...</p>
                        </div>
                      ) : incidents.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '3rem',
                          color: '#94a3b8',
                          background: 'rgba(15, 23, 42, 0.3)',
                          borderRadius: '12px',
                          border: '1px dashed rgba(148, 163, 184, 0.2)'
                        }}>
                          <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                          <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No incidents found</p>
                          <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>This teacher hasn't reported any individual incidents.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {incidents.map((incident, idx) => (
                            <div key={incident.incident_id} style={{
                              background: 'rgba(15, 23, 42, 0.5)',
                              borderRadius: '12px',
                              padding: '1.25rem',
                              border: '1px solid rgba(148, 163, 184, 0.1)',
                              transition: 'all 0.2s ease'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{
                                      background: incident.severity === 'S' 
                                        ? 'rgba(239, 68, 68, 0.2)' 
                                        : incident.severity === 'A' 
                                          ? 'rgba(34, 197, 94, 0.2)' 
                                          : 'rgba(245, 158, 11, 0.2)',
                                      color: incident.severity === 'S' 
                                        ? '#fca5a5' 
                                        : incident.severity === 'A' 
                                          ? '#86efac' 
                                          : '#fcd34d',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      Severity {incident.severity}
                                    </span>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                      {formatDate(incident.created_at)}
                                    </span>
                                  </div>
                                  <h4 style={{ 
                                    color: '#f1f5f9', 
                                    fontWeight: '600',
                                    margin: '8px 0'
                                  }}>
                                    {incident.student_first_name} {incident.student_last_name}
                                  </h4>
                                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                    Admission: {incident.admission_number}
                                    {incident.class_name && ` • ${incident.class_name}`}
                                  </div>
                                </div>
                              </div>
                              
                              <div style={{ margin: '1rem 0' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Description</div>
                                <div style={{ 
                                  color: '#e2e8f0', 
                                  background: 'rgba(15, 23, 42, 0.3)',
                                  padding: '0.75rem',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(148, 163, 184, 0.1)'
                                }}>
                                  {incident.description || 'No description provided'}
                                </div>
                              </div>
                              
                              {incident.punishment_name && (
                                <div style={{ margin: '1rem 0' }}>
                                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Punishment</div>
                                  <div style={{ 
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    color: '#c4b5fd',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    border: '1px solid rgba(139, 92, 246, 0.2)'
                                  }}>
                                    <FileText size={14} />
                                    {incident.punishment_name}
                                    {incident.punishment_start && (
                                      <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                                        ({formatDate(incident.punishment_start)} - {formatDate(incident.punishment_end)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>Evidence</div>
                                {renderEvidenceImages(incident.evidence_urls, idx)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'class-incidents' && (
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                      }}>
                        <h3 style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <UsersIcon size={18} />
                          Class Incidents Reported
                          <span style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            color: '#c4b5fd',
                            fontSize: '0.8rem',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            marginLeft: '8px'
                          }}>
                            {classIncidents.length}
                          </span>
                        </h3>
                        
                        <button
                          onClick={fetchClassIncidents}
                          disabled={loading.classIncidents}
                          style={{
                            background: 'rgba(30, 41, 59, 0.8)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            color: '#cbd5e1',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                          }}
                        >
                          {loading.classIncidents ? (
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                          Refresh
                        </button>
                      </div>
                      
                      {loading.classIncidents ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                          <p>Loading class incidents...</p>
                        </div>
                      ) : classIncidents.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '3rem',
                          color: '#94a3b8',
                          background: 'rgba(15, 23, 42, 0.3)',
                          borderRadius: '12px',
                          border: '1px dashed rgba(148, 163, 184, 0.2)'
                        }}>
                          <UsersIcon size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                          <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No class incidents found</p>
                          <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>This teacher hasn't reported any class incidents.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {classIncidents.map((incident, idx) => (
                            <div key={incident.class_incident_id} style={{
                              background: 'rgba(15, 23, 42, 0.5)',
                              borderRadius: '12px',
                              padding: '1.25rem',
                              border: '1px solid rgba(148, 163, 184, 0.1)',
                              transition: 'all 0.2s ease'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{
                                      background: incident.severity === 'A' 
                                        ? 'rgba(34, 197, 94, 0.2)' 
                                        : 'rgba(245, 158, 11, 0.2)',
                                      color: incident.severity === 'A' 
                                        ? '#86efac' 
                                        : '#fcd34d',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      Severity {incident.severity}
                                    </span>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                      {formatDate(incident.created_at)}
                                    </span>
                                  </div>
                                  <h4 style={{ 
                                    color: '#f1f5f9', 
                                    fontWeight: '600',
                                    margin: '8px 0'
                                  }}>
                                    Class: {incident.class_name}
                                  </h4>
                                </div>
                              </div>
                              
                              <div style={{ margin: '1rem 0' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Description</div>
                                <div style={{ 
                                  color: '#e2e8f0', 
                                  background: 'rgba(15, 23, 42, 0.3)',
                                  padding: '0.75rem',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(148, 163, 184, 0.1)'
                                }}>
                                  {incident.description || 'No description provided'}
                                </div>
                              </div>
                              
                              {incident.punishment_name && (
                                <div style={{ margin: '1rem 0' }}>
                                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>Class Punishment</div>
                                  <div style={{ 
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    color: '#c4b5fd',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    border: '1px solid rgba(139, 92, 246, 0.2)'
                                  }}>
                                    <FileText size={14} />
                                    {incident.punishment_name}
                                    {incident.punishment_start && (
                                      <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                                        ({formatDate(incident.punishment_start)} - {formatDate(incident.punishment_end)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>Evidence</div>
                                {renderEvidenceImages(incident.evidence_urls, idx)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Edit Mode */}
            {viewMode === 'edit' && (
              <div style={{ padding: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '1.5rem',
                  cursor: 'pointer'
                }} onClick={() => setViewMode('details')}>
                  <ChevronLeft size={20} />
                  <span style={{ color: '#94a3b8' }}>Back to Details</span>
                </div>
                
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f1f5f9',
                  marginBottom: '1.5rem'
                }}>
                  Edit Teacher Information
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                      value={editForm.first_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: `1px solid ${errors.first_name ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`,
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = errors.first_name ? '#ef4444' : '#8b5cf6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.first_name ? '#ef4444' : 'rgba(148, 163, 184, 0.2)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {errors.first_name && (
                      <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {errors.first_name}
                      </div>
                    )}
                  </div>
                  
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
                      value={editForm.last_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: `1px solid ${errors.last_name ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`,
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = errors.last_name ? '#ef4444' : '#8b5cf6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.last_name ? '#ef4444' : 'rgba(148, 163, 184, 0.2)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {errors.last_name && (
                      <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {errors.last_name}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: '#cbd5e1', 
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: `1px solid ${errors.email ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`,
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = errors.email ? '#ef4444' : '#8b5cf6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.email ? '#ef4444' : 'rgba(148, 163, 184, 0.2)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {errors.email && (
                      <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {errors.email}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  marginTop: '2rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                  <button
                    onClick={handleSave}
                    disabled={loading.saving}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.875rem',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      cursor: loading.saving ? 'not-allowed' : 'pointer',
                      opacity: loading.saving ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading.saving) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(139, 92, 246, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading.saving) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {loading.saving ? (
                      <>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setViewMode('details');
                      setErrors({});
                      // Reset form to original values
                      setEditForm({
                        first_name: teacher.first_name || '',
                        last_name: teacher.last_name || '',
                        email: teacher.email || ''
                      });
                    }}
                    disabled={loading.saving}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '0.875rem 1.5rem',
                      color: '#cbd5e1',
                      fontWeight: '500',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                      e.currentTarget.style.color = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                      e.currentTarget.style.color = '#cbd5e1';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Delete Confirmation Mode */}
            {viewMode === 'delete' && (
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '1.5rem',
                  cursor: 'pointer',
                  justifyContent: 'flex-start'
                }} onClick={() => setViewMode('details')}>
                  <ChevronLeft size={20} />
                  <span style={{ color: '#94a3b8' }}>Back to Details</span>
                </div>
                
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  padding: '2rem',
                  marginBottom: '2rem'
                }}>
                  <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#fca5a5',
                    marginBottom: '0.5rem'
                  }}>
                    Delete Teacher Account
                  </h3>
                  <p style={{ color: '#cbd5e1', lineHeight: '1.5' }}>
                    Are you sure you want to delete <strong style={{ color: '#f1f5f9' }}>{teacher.first_name} {teacher.last_name}</strong>?
                    This action will:
                  </p>
                  <ul style={{ 
                    textAlign: 'left', 
                    color: '#94a3b8', 
                    margin: '1rem auto', 
                    maxWidth: '400px',
                    lineHeight: '1.6'
                  }}>
                    <li>Remove them from any assigned classes</li>
                    <li>Preserve their reported incidents</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    onClick={handleDelete}
                    disabled={loading.deleting}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.875rem 2rem',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      cursor: loading.deleting ? 'not-allowed' : 'pointer',
                      opacity: loading.deleting ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading.deleting) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(239, 68, 68, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading.deleting) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {loading.deleting ? (
                      <>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        <span>Yes, Delete Teacher</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setViewMode('details')}
                    disabled={loading.deleting}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '0.875rem 2rem',
                      color: '#cbd5e1',
                      fontWeight: '500',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                      e.currentTarget.style.color = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                      e.currentTarget.style.color = '#cbd5e1';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer (only in details view) */}
          {viewMode === 'details' && (
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid rgba(148, 163, 184, 0.1)',
              background: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Teacher ID: {teacher.user_id?.substring(0, 8)}...
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setViewMode('edit')}
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem 1.25rem',
                    color: '#cbd5e1',
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                    e.currentTarget.style.color = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                    e.currentTarget.style.color = '#cbd5e1';
                  }}
                >
                  <Edit size={16} />
                  Edit
                </button>
                
                <button
                  onClick={() => setViewMode('delete')}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem 1.25rem',
                    color: '#fca5a5',
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
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
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TeacherModal;