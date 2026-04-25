import React, { useEffect, useState } from 'react';
import { useTeacher } from './TeacherContext';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import './Teacher.css';

const TeacherToasts = () => {
  const { error, success, clearMessages } = useTeacher();
  const [leavingError, setLeavingError] = useState(false);
  const [leavingSuccess, setLeavingSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setLeavingSuccess(true);
        setTimeout(() => {
          clearMessages();
          setLeavingSuccess(false);
        }, 400); // Wait for animation
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, clearMessages]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setLeavingError(true);
        setTimeout(() => {
          clearMessages();
          setLeavingError(false);
        }, 400); // Wait for animation
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, clearMessages]);

  return (
    <>
      {success && (
        <div className={`teacher-toast teacher-toast-success ${leavingSuccess ? 'teacher-toast-leaving' : ''}`}>
          <div className="teacher-toast-icon success">
            <CheckCircle size={14} />
          </div>
          <span className="teacher-toast-msg">{success}</span>
          <button className="teacher-toast-close" onClick={() => { setLeavingSuccess(true); setTimeout(() => { clearMessages(); setLeavingSuccess(false); }, 400); }}>
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className={`teacher-toast teacher-toast-error ${leavingError ? 'teacher-toast-leaving' : ''}`}>
          <div className="teacher-toast-icon error">
            <AlertTriangle size={14} />
          </div>
          <span className="teacher-toast-msg">{error}</span>
          <button className="teacher-toast-close" onClick={() => { setLeavingError(true); setTimeout(() => { clearMessages(); setLeavingError(false); }, 400); }}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
};

export default TeacherToasts;
