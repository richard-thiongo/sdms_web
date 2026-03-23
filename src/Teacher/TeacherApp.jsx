// Teacher/TeacherApp.jsx
import React, { useState } from 'react';
import { TeacherProvider } from './TeacherContext'; // Bug #1 fixed: removed unused useTeacher import
import TeacherDashboard from './TeacherDashboard';
import TeacherModals from './TeacherModals';
import TeacherLists from './TeacherLists';
import TeacherBottomNav from './TeacherBottomNav';
import { Key, LogOut } from 'lucide-react';

const TeacherApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    data: null
  });
  const [listType, setListType] = useState('students');

  const navigateToDashboard = () => {
    setCurrentView('dashboard');
    setModalState({ isOpen: false, type: null, data: null });
  };

  const navigateToLists = (type) => {
    setListType(type);
    setCurrentView('lists');
    setModalState({ isOpen: false, type: null, data: null });
  };

  const openModal = (type, data = null) => {
    setModalState({ isOpen: true, type, data });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
  };

  return (
    <TeacherProvider>
      <div className="teacher-app-container">
        {/* Header - Simplified */}
        <div className="teacher-main-header">
          <div className="teacher-header-inner">
            <div className="teacher-header-left">
              <div className="teacher-logo" onClick={navigateToDashboard}>
                <span className="teacher-logo-text">Teacher Portal</span>
              </div>
            </div>
            <div className="teacher-header-right">
              <button
                className="teacher-logout-btn"
                style={{ marginRight: '12px', background: 'rgba(255, 255, 255, 0.1)', color: '#f1f5f9', border: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}
                onClick={() => openModal('changePassword')}
                title="Change Password"
              >
                <Key size={16} />
                <span className="teacher-hidden-mobile">Change Password</span>
              </button>
              <button
                className="teacher-logout-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}
                title="Logout"
                onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  localStorage.removeItem('user_data');
                  window.location.href = '/teacher/login';
                }}
              >
                <LogOut size={16} />
                <span className="teacher-hidden-mobile">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="teacher-content">
          {currentView === 'dashboard' ? (
            <TeacherDashboard
              onOpenModal={openModal}
              onNavigateToLists={navigateToLists}
            />
          ) : (
            <TeacherLists
              listType={listType}
              onOpenModal={openModal}
              onNavigateToDashboard={navigateToDashboard}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <TeacherBottomNav
          currentView={currentView}
          listType={listType}
          onNavigateToDashboard={navigateToDashboard}
          onNavigateToLists={navigateToLists}
        />

        {/* Modal */}
        {modalState.isOpen && (
          <TeacherModals
            modalType={modalState.type}
            modalData={modalState.data}
            onClose={closeModal}
            onOpenModal={openModal}
          />
        )}
      </div>
    </TeacherProvider>
  );
};

export default TeacherApp;
