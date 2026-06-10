import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import loginIllustration from './login_illustration.png';


export default function LoginPage() {
  const navigate = useNavigate();

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Interactive styling states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [signupLinkHovered, setSignupLinkHovered] = useState(false);
  const [forgotHovered, setForgotHovered] = useState(false);

  // Authentication submission
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: data.user_id,
            name: data.name,
            email: data.email,
          })
        );
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Invalid email or password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Color theme
  const colors = {
    bgLeft: '#f0f7f0',
    accentMint: '#00e5b0',
    accentMintHover: '#00c896',
    accentDark: '#0a2e1e',
    accentTeal: '#00a67e',
    textPrimary: '#0a2e1e',
    textMuted: '#5a8a75',
    border: '#d0e8de',
    error: '#e85d75',
  };

  // Style objects
  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      position: 'relative',
      boxSizing: 'border-box',
    },
    leftCol: {
      width: isMobile ? '100%' : '50%',
      backgroundColor: colors.bgLeft,
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      boxSizing: 'border-box',
      padding: '24px',
    },
    rightCol: {
      width: '50%',
      background: 'linear-gradient(135deg, #d4e8d4, #b8d4b8)',
      height: '100%',
      display: isMobile ? 'none' : 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: '48px',
      boxSizing: 'border-box',
      position: 'relative',
    },
    logo: {
      position: 'absolute',
      top: 0,
      left: 0,
      padding: '24px 32px',
      fontSize: '18px',
      fontWeight: 800,
      color: colors.textPrimary,
      fontFamily: "'Outfit', sans-serif",
      letterSpacing: '-0.02em',
      cursor: 'pointer',
      zIndex: 10,
    },
    card: {
      background: 'white',
      border: '1px solid #d8ead8',
      borderRadius: '20px',
      padding: isMobile ? '32px 24px' : '40px 44px',
      width: '100%',
      maxWidth: '380px',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
      boxSizing: 'border-box',
    },
    title: {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      fontWeight: 800,
      color: colors.textPrimary,
      margin: '0 0 8px 0',
      letterSpacing: '-0.01em',
    },
    subtitle: {
      fontSize: '14px',
      color: colors.textMuted,
      margin: '0 0 28px 0',
      lineHeight: 1.5,
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '16px',
    },
    labelRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px',
    },
    label: {
      fontSize: '13px',
      fontWeight: 600,
      color: colors.textPrimary,
    },
    forgotLink: {
      color: colors.accentTeal,
      fontSize: '12px',
      cursor: 'pointer',
      fontWeight: 600,
      textDecoration: forgotHovered ? 'underline' : 'none',
    },
    inputContainer: {
      position: 'relative',
      width: '100%',
    },
    icon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '14px',
      color: colors.textMuted,
      pointerEvents: 'none',
    },
    input: (isFocused) => ({
      border: `1px solid ${isFocused ? colors.accentTeal : colors.border}`,
      borderRadius: '10px',
      padding: '11px 14px 11px 36px',
      fontSize: '14px',
      width: '100%',
      boxSizing: 'border-box',
      color: colors.textPrimary,
      outline: 'none',
      backgroundColor: '#ffffff',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: isFocused ? `0 0 0 3px rgba(0, 166, 126, 0.1)` : 'none',
    }),
    errorMsg: {
      color: colors.error,
      fontSize: '12px',
      marginTop: '8px',
      fontWeight: 500,
    },
    submitBtn: {
      background: btnHovered ? colors.accentMintHover : colors.accentMint,
      color: colors.accentDark,
      width: '100%',
      padding: '14px',
      borderRadius: '28px',
      border: 'none',
      fontSize: '15px',
      fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      marginTop: '24px',
      transition: 'background-color 0.2s, transform 0.1s',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: loading ? 0.7 : 1,
    },
    bottomText: {
      marginTop: '20px',
      textAlign: 'center',
      fontSize: '13px',
      color: colors.textMuted,
    },
    signupLink: {
      color: colors.accentTeal,
      fontWeight: 600,
      cursor: 'pointer',
      textDecoration: signupLinkHovered ? 'underline' : 'none',
    },
    rightCornerText: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      alignItems: 'flex-end',
      textAlign: 'right',
    },
    analogMemories: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 700,
      color: colors.accentDark,
      fontSize: '16px',
      margin: 0,
    },
    freqAnalysis: {
      fontFamily: 'monospace',
      color: colors.accentTeal,
      fontSize: '12px',
      margin: 0,
    },
  };

  return (
    <div style={styles.container}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800&display=swap');
      ` }} />

      {/* LEFT COLUMN */}
      <div style={styles.leftCol}>
        <div style={styles.logo} onClick={() => navigate('/')}>
          RootLens
        </div>

        <div style={styles.card}>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>Access your incident analysis dashboard.</p>

          <form onSubmit={handleLogin}>
            {/* Email field */}
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="email-input">
                Email
              </label>
              <div style={{ ...styles.inputContainer, marginTop: '6px' }}>
                <span style={styles.icon}>✉</span>
                <input
                  id="email-input"
                  type="email"
                  placeholder="analyst@domain.com"
                  style={styles.input(emailFocused)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{ ...styles.formGroup, marginTop: '16px' }}>
              <div style={styles.labelRow}>
                <label style={styles.label} htmlFor="password-input">
                  Password
                </label>
                <span
                  style={styles.forgotLink}
                  onClick={() => navigate('/forgot-password')}
                  onMouseEnter={() => setForgotHovered(true)}
                  onMouseLeave={() => setForgotHovered(false)}
                >
                  Forgot Password?
                </span>
              </div>
              <div style={styles.inputContainer}>
                <span style={styles.icon}>🔒</span>
                <input
                  id="password-input"
                  type="password"
                  placeholder="••••••••"
                  style={styles.input(passwordFocused)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && <div style={styles.errorMsg}>{error}</div>}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              style={styles.submitBtn}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
            >
              {loading ? 'Signing In...' : 'Sign In →'}
            </button>
          </form>

          {/* Bottom Link */}
          <p style={styles.bottomText}>
            Don't have an account?{' '}
            <span
              style={styles.signupLink}
              onClick={() => navigate('/signup')}
              onMouseEnter={() => setSignupLinkHovered(true)}
              onMouseLeave={() => setSignupLinkHovered(false)}
            >
              Create an account
            </span>
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div style={styles.rightCol}>
        {/* Full-bleed illustration */}
        <img 
          src={loginIllustration} 
          alt="Floral Frequency Analysis Illustration" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            zIndex: 1,
          }} 
        />

        <div style={{ ...styles.rightCornerText, zIndex: 2 }}>
          <p style={styles.analogMemories}>Analog memories.</p>
          <p style={styles.freqAnalysis}>Floral frequency analysis active.</p>
        </div>
      </div>
    </div>
  );
}
