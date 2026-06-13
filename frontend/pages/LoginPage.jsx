import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/shared/AuthProvider';
import loginIllustration from './login_illustration.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword, signUp, signInWithGoogle } = useAuth();

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
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Interactive styling states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [googleBtnHovered, setGoogleBtnHovered] = useState(false);
  const [signupLinkHovered, setSignupLinkHovered] = useState(false);
  const [forgotHovered, setForgotHovered] = useState(false);

  // Authentication submission
  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password);
      } else {
        result = await signInWithPassword(email, password);
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) setError(error.message);
    } catch (err) {
      setError('Google Sign In failed');
    }
  };

  // Color theme — aligned with project's Material 3 tokens
  const colors = {
    bgLeft: '#edf5f1',
    accentMint: '#006b54',
    accentMintHover: '#00513e',
    accentDark: '#141d1a',
    accentTeal: '#006b54',
    textPrimary: '#141d1a',
    textMuted: '#6a7b73',
    border: '#b9cbc2',
    error: '#ba1a1a',
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
      background: 'linear-gradient(135deg, #c4e0cc, #a8d0b4)',
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
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
      zIndex: 10,
    },
    logoImg: {
      width: '24px',
      height: '24px',
      objectFit: 'contain',
    },
    logoText: {
      fontFamily: "'EB Garamond', Georgia, serif",
      fontWeight: 700,
      color: colors.textPrimary,
      fontSize: '20px',
      letterSpacing: '-0.02em',
    },
    card: {
      background: 'white',
      border: `1px solid ${colors.border}`,
      borderRadius: '24px',
      padding: isMobile ? '36px 28px' : '44px 48px',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
      boxSizing: 'border-box',
    },
    title: {
      fontFamily: "'EB Garamond', Georgia, serif",
      fontSize: '34px',
      fontWeight: 700,
      color: colors.textPrimary,
      margin: '0 0 8px 0',
      letterSpacing: '-0.02em',
    },
    subtitle: {
      fontSize: '15px',
      color: colors.textMuted,
      margin: '0 0 32px 0',
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
      transition: 'text-decoration 0.2s',
    },
    inputContainer: {
      position: 'relative',
      width: '100%',
    },
    icon: {
      position: 'absolute',
      left: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '14px',
      color: colors.textMuted,
      pointerEvents: 'none',
    },
    input: (isFocused) => ({
      border: `1.5px solid ${isFocused ? colors.accentTeal : colors.border}`,
      borderRadius: '12px',
      padding: '13px 16px 13px 40px',
      fontSize: '14px',
      width: '100%',
      boxSizing: 'border-box',
      color: colors.textPrimary,
      outline: 'none',
      backgroundColor: '#ffffff',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: isFocused ? `0 0 0 3px rgba(0, 107, 84, 0.1)` : 'none',
    }),
    errorMsg: {
      color: colors.error,
      fontSize: '13px',
      marginTop: '10px',
      fontWeight: 500,
      background: 'rgba(186, 26, 26, 0.06)',
      padding: '8px 12px',
      borderRadius: '8px',
    },
    submitBtn: {
      background: btnHovered ? colors.accentMintHover : colors.accentMint,
      color: 'white',
      width: '100%',
      padding: '14px',
      borderRadius: '28px',
      border: 'none',
      fontSize: '15px',
      fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      marginTop: '28px',
      transition: 'background-color 0.2s, transform 0.15s',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: loading ? 0.7 : 1,
      boxShadow: '0 4px 16px rgba(0, 107, 84, 0.15)',
    },
    bottomText: {
      marginTop: '24px',
      textAlign: 'center',
      fontSize: '13px',
      color: colors.textMuted,
    },
    signupLink: {
      color: colors.accentTeal,
      fontWeight: 600,
      cursor: 'pointer',
      textDecoration: signupLinkHovered ? 'underline' : 'none',
      transition: 'text-decoration 0.2s',
    },
    rightCornerText: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      alignItems: 'flex-end',
      textAlign: 'right',
    },
    analogMemories: {
      fontFamily: "'EB Garamond', Georgia, serif",
      fontWeight: 700,
      color: colors.accentDark,
      fontSize: '18px',
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
          <img src="/logo.png" alt="Rootlens" style={styles.logoImg} />
          <span style={styles.logoText}>Rootlens</span>
        </div>

        <div style={styles.card}>
          <h1 style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p style={styles.subtitle}>{isSignUp ? 'Sign up to start investigating.' : 'Access your incident analysis dashboard.'}</p>

          <form onSubmit={handleAuth}>
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
                {!isSignUp && (
                  <span
                    style={styles.forgotLink}
                    onClick={() => {}}
                    onMouseEnter={() => setForgotHovered(true)}
                    onMouseLeave={() => setForgotHovered(false)}
                  >
                    Forgot Password?
                  </span>
                )}
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
              {loading ? (isSignUp ? 'Creating...' : 'Signing In...') : (isSignUp ? 'Sign Up →' : 'Sign In →')}
            </button>
            
            {/* Google OAuth Button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogle}
              style={{
                ...styles.submitBtn,
                marginTop: '12px',
                background: googleBtnHovered ? '#f8f9fa' : 'white',
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                boxShadow: 'none',
              }}
              onMouseEnter={() => setGoogleBtnHovered(true)}
              onMouseLeave={() => setGoogleBtnHovered(false)}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: 18, height: 18, marginRight: 8}} />
              Continue with Google
            </button>
          </form>

          {/* Bottom Link */}
          <p style={styles.bottomText}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <span
              style={styles.signupLink}
              onClick={() => setIsSignUp(!isSignUp)}
              onMouseEnter={() => setSignupLinkHovered(true)}
              onMouseLeave={() => setSignupLinkHovered(false)}
            >
              {isSignUp ? 'Sign in' : 'Create an account'}
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
