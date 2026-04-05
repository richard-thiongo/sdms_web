import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sanitizeErrorMessage } from '../utils/errorUtils';
import { 
  ArrowLeft, 
  User,
  BookOpen,
  Hash,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Key
} from 'lucide-react';

const api = process.env.REACT_APP_API_URL;

const StudentLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    admission_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedFirstName = localStorage.getItem('student_saved_first_name');
    const savedLastName = localStorage.getItem('student_saved_last_name');
    const savedAdmission = localStorage.getItem('student_saved_admission_number');
    if (savedFirstName && savedLastName && savedAdmission) {
      setFormData({
        first_name: savedFirstName,
        last_name: savedLastName,
        admission_number: savedAdmission
      });
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.first_name || !formData.last_name || !formData.admission_number) {
      setError('Please fill in all fields');
      return false;
    }

    const admissionNumberRegex = /^[0-9]{2,20}$/;
    if (!admissionNumberRegex.test(formData.admission_number)) {
      setError('Please enter a valid admission number (2-20 digits)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${api}/student/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          admission_number: formData.admission_number.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Welcome back, ${data.data.full_name}! Redirecting...`);
        
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        localStorage.setItem('student_data', JSON.stringify(data.data));
        sessionStorage.setItem('access_token', data.data.access_token);
        
        localStorage.setItem('student_id', data.data.student_id);
        localStorage.setItem('full_name', data.data.full_name);
        localStorage.setItem('class_name', data.data.class_name || 'Not Assigned');
        
        if (rememberMe) {
          localStorage.setItem('student_saved_first_name', formData.first_name);
          localStorage.setItem('student_saved_last_name', formData.last_name);
          localStorage.setItem('student_saved_admission_number', formData.admission_number);
        } else {
          localStorage.removeItem('student_saved_first_name');
          localStorage.removeItem('student_saved_last_name');
          localStorage.removeItem('student_saved_admission_number');
        }

        setTimeout(() => {
          navigate('/student/dashboard');
        }, 2000);
      } else {
        setError(sanitizeErrorMessage(data.message, 'Login failed. Please check your credentials.'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const capitalizeName = (name) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleNameBlur = (e) => {
    const { name, value } = e.target;
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [name]: capitalizeName(value)
      }));
    }
  };

  // Theme Colors (Emerald for Student)
  const colors = {
    primary: '#10b981', // Emerald 500
    primaryHover: '#059669', // Emerald 600
    primaryLight: 'rgba(16, 185, 129, 0.1)',
    background: 'linear-gradient(135deg, #0a0f1c 0%, #1a1744 50%, #0a0f1c 100%)',
    cardBg: 'rgba(30, 41, 59, 0.4)',
    border: 'rgba(148, 163, 184, 0.08)',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    inputBg: 'rgba(15, 23, 42, 0.6)',
    inputBorder: 'rgba(148, 163, 184, 0.1)',
    shadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(16, 185, 129, 0.3)'
  };

  const containerStyle = {
    minHeight: '100vh',
    background: colors.background,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden'
  };

  const cardStyle = {
    background: colors.cardBg,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: `1px solid ${colors.border}`,
    padding: '2.5rem',
    width: '100%',
    maxWidth: '450px',
    boxShadow: colors.shadow,
    position: 'relative',
    zIndex: 1
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '2rem'
  };

  const logoContainerStyle = {
    width: '4rem',
    height: '4rem',
    background: colors.primaryLight,
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    border: `1px solid rgba(16, 185, 129, 0.2)`
  };

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: '0.5rem'
  };

  const subtitleStyle = {
    color: colors.textSecondary,
    fontSize: '1rem',
    lineHeight: '1.5'
  };

  const inputGroupStyle = {
    position: 'relative',
    marginBottom: '1.25rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '1rem 1rem 1rem 3rem',
    background: colors.inputBg,
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: '12px',
    color: colors.textPrimary,
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box'
  };

  const inputIconStyle = {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.textMuted,
    pointerEvents: 'none'
  };

  const buttonStyle = {
    width: '100%',
    padding: '1rem',
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryHover})`,
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
  };

  const backButtonStyle = {
    position: 'absolute',
    top: '1.5rem',
    left: '1.5rem',
    color: colors.textMuted,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    transition: 'color 0.3s ease',
    zIndex: 10
  };

  return (
    <div style={containerStyle}>
      <Link 
        to="/role" 
        style={backButtonStyle}
        onMouseEnter={(e) => e.target.style.color = colors.textPrimary}
        onMouseLeave={(e) => e.target.style.color = colors.textMuted}
      >
        <ArrowLeft size={18} />
        Back
      </Link>

      <div style={cardStyle}>
        {/* Top Border Gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${colors.primary}, #34d399)`,
          borderRadius: '24px 24px 0 0',
          opacity: 0.8
        }} />

        <div style={headerStyle}>
          <div style={logoContainerStyle}>
            <GraduationCap size={32} color={colors.primary} />
          </div>
          <h1 style={titleStyle}>Student Portal</h1>
          <p style={subtitleStyle}>Enter your details to access your portal</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#fecaca'
          }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#a7f3d0'
          }}>
            <CheckCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <User size={20} style={inputIconStyle} />
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              onBlur={(e) => {
                handleNameBlur(e);
                e.target.style.borderColor = colors.inputBorder;
              }}
              placeholder="First Name"
              style={inputStyle}
              required
              onFocus={(e) => e.target.style.borderColor = colors.primary}
            />
          </div>

          <div style={inputGroupStyle}>
            <User size={20} style={inputIconStyle} />
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              onBlur={(e) => {
                handleNameBlur(e);
                e.target.style.borderColor = colors.inputBorder;
              }}
              placeholder="Last Name"
              style={inputStyle}
              required
              onFocus={(e) => e.target.style.borderColor = colors.primary}
            />
          </div>

          <div style={inputGroupStyle}>
            <Hash size={20} style={inputIconStyle} />
            <input
              type="text"
              name="admission_number"
              value={formData.admission_number}
              onChange={handleChange}
              placeholder="Admission Number"
              style={inputStyle}
              required
              onFocus={(e) => e.target.style.borderColor = colors.primary}
              onBlur={(e) => e.target.style.borderColor = colors.inputBorder}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: colors.primary, cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="remember" style={{ color: colors.textSecondary, fontSize: '0.9rem', cursor: 'pointer' }}>
                Remember me
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <input 
                type="checkbox" 
                id="terms" 
                checked={acceptedTerms} 
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{ marginTop: '0.25rem', accentColor: colors.primary, cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="terms" style={{ color: colors.textSecondary, fontSize: '0.9rem', lineHeight: '1.5', cursor: 'pointer' }}>
                I agree to the <Link to="/terms-and-conditions" style={{ color: colors.primary, textDecoration: 'none' }}>Terms & Conditions</Link> and <Link to="/privacy-policy" style={{ color: colors.primary, textDecoration: 'none' }}>Privacy Policy</Link>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            style={{
              ...buttonStyle,
              opacity: (!loading && acceptedTerms) ? 1 : 0.6,
              cursor: (!loading && acceptedTerms) ? 'pointer' : 'not-allowed'
            }}
            disabled={loading || !acceptedTerms}
            onMouseEnter={(e) => {
              if (!loading && acceptedTerms) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.2)';
            }}
          >
            {loading ? 'Logging In...' : 'Login'}
            {!loading && <Key size={18} />}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          borderTop: `1px solid ${colors.border}`,
          paddingTop: '1.5rem'
        }}>
          <p style={{ color: colors.primary, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <BookOpen size={16} />
            Need help accessing your account?
          </p>
          <p style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
            Contact your teacher regarding your admission number.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;