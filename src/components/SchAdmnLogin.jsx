import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle,
  UserPlus
} from 'lucide-react';



const api = process.env.REACT_APP_API_URL;

const SchoolAdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      const response = await fetch(`${api}/admin/schadmnlogin`, {
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
        setSuccess('Login successful! Redirecting...');
        
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.data));
        sessionStorage.setItem('access_token', data.data.access_token);
        
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e1b4b 0%, #2d2a6e 50%, #1e1b4b 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem'
  };

  const loginCardStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    overflow: 'hidden'
  };

  // Back button inside the form card
  const formBackButtonStyle = {
    position: 'absolute',
    top: '1.25rem',
    left: '1.25rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#c4b5fd',
    textDecoration: 'none',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.05)',
    fontSize: '0.85rem',
    fontWeight: '500',
    zIndex: 10,
    border: '1px solid rgba(139, 92, 246, 0.1)',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#faf5ff',
      transform: 'translateX(-2px)'
    }
  };

  const loginCardHeaderStyle = {
    textAlign: 'center',
    marginBottom: '2rem',
    marginTop: '0.5rem'
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '1rem'
  };

  const logoIconStyle = {
    width: '2.5rem',
    height: '2.5rem',
    color: '#8b5cf6'
  };

  const brandTextStyle = {
    fontSize: '2.25rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const titleStyle = {
    fontSize: '1.75rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#faf5ff',
    textAlign: 'center'
  };

  const subtitleStyle = {
    fontSize: '1rem',
    color: '#c4b5fd',
    textAlign: 'center',
    marginBottom: '2rem'
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  };

  const inputGroupStyle = {
    position: 'relative'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 2.75rem',
    background: 'rgba(255, 255, 255, 0.07)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#faf5ff',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    ':focus': {
      borderColor: '#8b5cf6',
      boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)'
    }
  };

  const inputIconStyle = {
    position: 'absolute',
    left: '0.875rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#c4b5fd',
    width: '1.25rem',
    height: '1.25rem'
  };

  const passwordToggleStyle = {
    position: 'absolute',
    right: '0.875rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#c4b5fd',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease',
    ':hover': {
      color: '#faf5ff'
    }
  };

  const buttonStyle = {
    width: '100%',
    padding: '0.875rem 1.25rem',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)'
    },
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none'
    }
  };

  const errorStyle = {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fecaca',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginBottom: '1rem'
  };

  const successStyle = {
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    color: '#bbf7d0',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginBottom: '1rem'
  };

  const footerStyle = {
    marginTop: '1.5rem',
    textAlign: 'center',
    color: '#c4b5fd',
    fontSize: '0.85rem'
  };
  const signupSectionStyle = {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(139, 92, 246, 0.1)',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#c4b5fd'
  };

  const signupLinkStyle = {
    color: '#8b5cf6',
    textDecoration: 'none',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    background: 'rgba(139, 92, 246, 0.1)',
    ':hover': {
      background: 'rgba(139, 92, 246, 0.2)',
      color: '#faf5ff',
      transform: 'translateY(-2px)'
    }
  };

  return (
    <div style={containerStyle}>
      <div style={loginCardStyle}>
        {/* Back button inside the form card */}
        <Link 
          to="/role"
          style={formBackButtonStyle}
          title="Go back to role selection"
        >
          <ArrowLeft size={16} />
        </Link>

        <div style={loginCardHeaderStyle}>
          <div style={logoStyle}>
            <Shield style={logoIconStyle} />
            <span style={brandTextStyle}>Wazi</span>
          </div>
          <h1 style={titleStyle}>School Admin Login</h1>
          <p style={subtitleStyle}>
            Access your school management dashboard
          </p>
        </div>

        {error && (
          <div style={errorStyle}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={successStyle}>
            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroupStyle}>
            <Mail style={inputIconStyle} />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              disabled={loading}
              required
            />
          </div>

          <div style={inputGroupStyle}>
            <Lock style={inputIconStyle} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              style={inputStyle}
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={passwordToggleStyle}
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            style={buttonStyle}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <Users size={18} />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        {/* Sign Up Section */}
        <div style={signupSectionStyle}>
          <p style={{ marginBottom: '0.5rem' }}>
            Don't have an account? 
          </p>
          <Link 
           
            style={signupLinkStyle}
            onClick={(e) => {
              e.preventDefault();
              alert('Please contact your system administrator to create a school admin account.');
            
            }}
          >
            <UserPlus size={16} />
            <span>Sign Up</span>
          </Link>
        </div>

        <div style={footerStyle}>
          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            © 2025 Wazi Education Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchoolAdminLogin;