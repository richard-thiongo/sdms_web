import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sanitizeErrorMessage } from '../utils/errorUtils';
import { 
  BookOpen, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const api = process.env.REACT_APP_API_URL;

const TeacherLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('teacher_saved_email');
    const savedPassword = localStorage.getItem('teacher_saved_password');
    if (savedEmail && savedPassword) {
      setFormData({
        email: savedEmail,
        password: savedPassword
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
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
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
      const response = await fetch(`${api}/teacher/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Login successful! Redirecting to dashboard...');
        
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.data));
        sessionStorage.setItem('access_token', data.data.access_token);

        if (rememberMe) {
          localStorage.setItem('teacher_saved_email', formData.email);
          localStorage.setItem('teacher_saved_password', formData.password);
        } else {
          localStorage.removeItem('teacher_saved_email');
          localStorage.removeItem('teacher_saved_password');
        }

        setTimeout(() => {
          navigate('/teacher/dashboard');
        }, 2000);
      } else {
        setError(sanitizeErrorMessage(data.message, 'Login failed. Please check your credentials.'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Theme Colors (Amber for Teacher)
  const colors = {
    primary: '#f59e0b', // Amber 500
    primaryHover: '#d97706', // Amber 600
    primaryLight: 'rgba(245, 158, 11, 0.1)',
    background: 'linear-gradient(135deg, #0a0f1c 0%, #1a1744 50%, #0a0f1c 100%)', // Consistent Deep Blue Background
    cardBg: 'rgba(30, 41, 59, 0.4)',
    border: 'rgba(148, 163, 184, 0.08)',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    inputBg: 'rgba(15, 23, 42, 0.6)',
    inputBorder: 'rgba(148, 163, 184, 0.1)',
    shadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(245, 158, 11, 0.3)'
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
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
    zIndex: 1
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '2.5rem'
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
    border: `1px solid rgba(245, 158, 11, 0.2)`
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
    boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)'
  };

  const backButtonStyle = {
    position: 'fixed',
    top: '1.5rem',
    left: '1.5rem',
    color: '#8b5cf6',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    transition: 'color 0.3s ease',
    zIndex: 100
  };

  return (
    <div style={containerStyle}>
      <Link 
        to="/role" 
        style={backButtonStyle}
        onMouseEnter={(e) => e.target.style.color = '#a78bfa'}
        onMouseLeave={(e) => e.target.style.color = '#8b5cf6'}
      >
        <ArrowLeft size={18} />
        Back
      </Link>

      <div style={cardStyle}>

        <div style={headerStyle}>
          <div style={logoContainerStyle}>
            <BookOpen size={32} color={colors.primary} />
          </div>
          <h1 style={titleStyle}>Teacher Portal</h1>
          <p style={subtitleStyle}>Access your classroom management dashboard</p>
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
            <Mail size={20} style={inputIconStyle} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              style={inputStyle}
              required
              onFocus={(e) => e.target.style.borderColor = colors.primary}
              onBlur={(e) => e.target.style.borderColor = colors.inputBorder}
            />
          </div>

          <div style={inputGroupStyle}>
            <Lock size={20} style={inputIconStyle} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              style={inputStyle}
              required
              onFocus={(e) => e.target.style.borderColor = colors.primary}
              onBlur={(e) => e.target.style.borderColor = colors.inputBorder}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: colors.textMuted,
                cursor: 'pointer'
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
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
                e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(245, 158, 11, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(245, 158, 11, 0.2)';
            }}
          >
            {loading ? 'Logging In...' : 'Login'}
            {!loading && <BookOpen size={18} />}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          borderTop: `1px solid ${colors.border}`,
          paddingTop: '1.5rem'
        }}>
          <p style={{ color: colors.textMuted, fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link 
              to="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Please contact your school administrator to create a teacher account.');
              }}
              style={{ color: colors.primary, textDecoration: 'none', fontWeight: '500' }}
            >
              Contact Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;