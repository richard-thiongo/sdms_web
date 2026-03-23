import React, { useState } from 'react';
import { X, Lock, Key, CheckCircle, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleChangeField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      setError("New passwords do not match.");
      return;
    }
    if (formData.new_password.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Password updated successfully!');
        setFormData({ current_password: '', new_password: '', confirm_password: '' });
        // Auto close after 2 seconds
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'Failed to update password. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      
      <div style={{
        background: 'rgba(30, 41, 59, 0.9)',
        borderRadius: '24px',
        width: '90%',
        maxWidth: '500px',
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
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}>
              <Lock size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
              Change Password
            </h2>
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
              justifyContent: 'center',
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
        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1rem', color: '#fca5a5', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <AlertCircle size={18} /><span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '1rem', color: '#6ee7b7', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <CheckCircle size={18} /><span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Current Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '0.5rem' }}>Current Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={formData.current_password}
                  onChange={(e) => handleChangeField('current_password', e.target.value)}
                  style={{
                    width: '100%', padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                    background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px', color: '#f1f5f9', fontSize: '0.95rem', outline: 'none',
                    transition: 'border-color 0.2s ease', 
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showCurrentPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '0.5rem' }}>New Password *</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={formData.new_password}
                  onChange={(e) => handleChangeField('new_password', e.target.value)}
                  style={{
                    width: '100%', padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                    background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px', color: '#f1f5f9', fontSize: '0.95rem', outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showNewPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '0.5rem' }}>Confirm New Password *</label>
              <div style={{ position: 'relative' }}>
                <CheckCircle size={18} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Match new password"
                  value={formData.confirm_password}
                  onChange={(e) => handleChangeField('confirm_password', e.target.value)}
                  style={{
                    width: '100%', padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                    background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px', color: '#f1f5f9', fontSize: '0.95rem', outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </button>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: '0.875rem',
                  background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px', color: '#f1f5f9', fontSize: '0.95rem', fontWeight: '500',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)'; }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.current_password || !formData.new_password || !formData.confirm_password}
                style={{
                  flex: 1, padding: '0.875rem',
                  background: loading || (!formData.current_password || !formData.new_password || !formData.confirm_password) ? 'rgba(139, 92, 246, 0.5)' : '#8b5cf6',
                  border: 'none', borderRadius: '12px', color: 'white', fontSize: '0.95rem', fontWeight: '600',
                  cursor: loading || (!formData.current_password || !formData.new_password || !formData.confirm_password) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'all 0.2s ease', opacity: loading || (!formData.current_password || !formData.new_password || !formData.confirm_password) ? 0.7 : 1
                }}
                onMouseEnter={(e) => { if (!loading && formData.current_password && formData.new_password && formData.confirm_password) e.currentTarget.style.background = '#7c3aed'; }}
                onMouseLeave={(e) => { if (!loading && formData.current_password && formData.new_password && formData.confirm_password) e.currentTarget.style.background = '#8b5cf6'; }}
              >
                {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
