import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
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

  // Hover states for interactions
  const [loginHover, setLoginHover] = useState(false);
  const [startScanHover, setStartScanHover] = useState(false);
  const [heroCtaHover, setHeroCtaHover] = useState(false);
  const [docLinkHover, setDocLinkHover] = useState(false);
  const [bottomCtaHover, setBottomCtaHover] = useState(false);
  const [hoveredFooterLink, setHoveredFooterLink] = useState(null);

  // Color Palette Tokens
  const colors = {
    bgPrimary: '#ffffff',
    bgSurface: '#f4f9f7',
    bgCard: '#edf5f1',
    accentTeal: '#00a67e',
    accentDark: '#0a2e1e',
    border: '#d0e8de',
    textPrimary: '#0a2e1e',
    textMuted: '#5a8a75',
    textLight: '#8ab8a0',
  };

  // Inline Style Objects
  const styles = {
    container: {
      backgroundColor: colors.bgPrimary,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: colors.textPrimary,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
    },
    navbar: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${colors.border}`,
      height: '56px',
      padding: isMobile ? '0 24px' : '0 48px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxSizing: 'border-box',
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
    },
    logoCircle: {
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      backgroundColor: colors.accentTeal,
      display: 'inline-block',
    },
    logoText: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 700,
      color: colors.textPrimary,
      fontSize: '15px',
      letterSpacing: '-0.02em',
    },
    navRight: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '12px' : '24px',
    },
    loginBtn: {
      color: colors.textPrimary,
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      padding: '8px 12px',
      borderRadius: '4px',
      transition: 'opacity 0.2s, color 0.2s',
      opacity: loginHover ? 0.7 : 1,
      fontFamily: "'Inter', sans-serif",
    },
    startScanBtn: {
      background: startScanHover ? '#008f6c' : colors.accentTeal,
      color: 'white',
      borderRadius: '20px',
      padding: '8px 20px',
      fontWeight: 600,
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      transition: 'background-color 0.2s, transform 0.1s',
      transform: startScanHover ? 'scale(1.02)' : 'scale(1)',
      fontFamily: "'Inter', sans-serif",
    },
    hero: {
      minHeight: '100vh',
      paddingTop: '112px', // Space for fixed navbar
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      paddingLeft: isMobile ? '12px' : '24px',
      paddingRight: isMobile ? '12px' : '24px',
      paddingBottom: isMobile ? '40px' : '80px',
      background: `${colors.bgPrimary} radial-gradient(ellipse 80% 50% at 50% 0%, #e6f5ef 0%, transparent 70%)`,
      boxSizing: 'border-box',
    },
    badge: {
      border: `1px solid ${colors.accentTeal}`,
      color: colors.accentTeal,
      background: 'transparent',
      fontFamily: 'monospace',
      fontSize: '10px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      padding: '4px 16px',
      borderRadius: '20px',
      marginBottom: '28px',
      display: 'inline-block',
      fontWeight: 'bold',
    },
    headlineContainer: {
      marginBottom: '20px',
    },
    headlineLine1: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: 'clamp(32px, 5vw, 58px)',
      fontWeight: 800,
      color: colors.textPrimary,
      margin: 0,
      lineHeight: 1.1,
      letterSpacing: '-0.03em',
    },
    headlineLine2: {
      fontSize: 'clamp(32px, 5vw, 58px)',
      fontStyle: 'italic',
      fontWeight: 400,
      color: colors.accentTeal,
      fontFamily: 'Georgia, serif',
      margin: '4px 0 0 0',
      lineHeight: 1.1,
    },
    subheadline: {
      fontSize: '16px',
      color: colors.textMuted,
      maxWidth: '500px',
      lineHeight: 1.75,
      marginBottom: '36px',
      padding: isMobile ? '0 12px' : '0',
      fontFamily: "'Inter', sans-serif",
    },
    heroCtaBtn: {
      background: heroCtaHover ? '#008f6c' : colors.accentTeal,
      color: 'white',
      padding: '13px 32px',
      borderRadius: '28px',
      fontSize: '15px',
      fontWeight: 700,
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(0, 166, 126, 0.2)',
      transition: 'background-color 0.2s, transform 0.1s',
      transform: heroCtaHover ? 'scale(1.02)' : 'scale(1)',
      fontFamily: "'Inter', sans-serif",
    },
    featuresSection: {
      background: colors.bgSurface,
      padding: isMobile ? '50px 20px' : '100px 80px',
      boxSizing: 'border-box',
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? '30px' : '60px 80px',
      maxWidth: '1100px',
      margin: '0 auto',
    },
    leftColumn: {
      display: 'flex',
      flexDirection: 'column',
    },
    rightColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    feature1Wrapper: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '24px',
      alignItems: 'stretch',
    },
    featureTextContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    featureIcon: (borderColor) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: `1px solid ${borderColor}`,
      background: 'white',
      fontSize: '18px',
      marginBottom: '16px',
      boxSizing: 'border-box',
    }),
    featureTitle: (color) => ({
      fontFamily: "'Outfit', sans-serif",
      color: color,
      fontSize: '18px',
      fontWeight: 700,
      margin: '0 0 8px 0',
      letterSpacing: '-0.01em',
    }),
    featureDescription: {
      color: colors.textMuted,
      fontSize: '13px',
      lineHeight: 1.65,
      margin: 0,
    },
    miniScanCard: {
      background: 'white',
      border: `1px solid ${colors.border}`,
      borderRadius: '10px',
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      flex: 1,
      minWidth: isMobile ? '100%' : '240px',
      boxShadow: '0 4px 12px rgba(10, 46, 30, 0.02)',
      boxSizing: 'border-box',
      justifyContent: 'center',
    },
    scanRow1: {
      fontSize: '12px',
      color: colors.textLight,
      fontWeight: 500,
    },
    scanRow2: {
      background: 'rgba(0, 166, 126, 0.08)',
      color: colors.accentTeal,
      borderRadius: '4px',
      padding: '5px 10px',
      fontSize: '12px',
      fontFamily: 'monospace',
      alignSelf: 'flex-start',
      fontWeight: 600,
    },
    scanRow3: {
      fontSize: '12px',
      color: colors.textLight,
      fontWeight: 500,
    },
    feature2Container: {
      marginTop: isMobile ? '24px' : '48px',
      display: 'flex',
      flexDirection: 'column',
    },
    miniStatusCard: {
      background: 'white',
      border: `1px solid ${colors.border}`,
      borderRadius: '10px',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginTop: '16px',
      boxShadow: '0 4px 12px rgba(10, 46, 30, 0.02)',
      boxSizing: 'border-box',
    },
    checkCircle: {
      background: 'rgba(0, 166, 126, 0.1)',
      color: colors.accentTeal,
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      flexShrink: 0,
      fontWeight: 'bold',
    },
    statusTextContainer: {
      display: 'flex',
      flexDirection: 'column',
    },
    statusTitle: {
      fontWeight: 600,
      fontSize: '12px',
      color: colors.textPrimary,
      margin: 0,
    },
    statusSubtitle: {
      fontSize: '11px',
      color: colors.textMuted,
      margin: 0,
    },
    statusTime: {
      marginLeft: 'auto',
      fontSize: '11px',
      color: colors.textLight,
      flexShrink: 0,
    },
    systemHealthCard: {
      background: 'white',
      border: `1px solid ${colors.border}`,
      borderRadius: '14px',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 16px rgba(10, 46, 30, 0.02)',
      boxSizing: 'border-box',
    },
    systemHealthHeader: {
      display: 'flex',
      flexDirection: 'column',
    },
    systemHealthTitle: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '14px',
      fontWeight: 700,
      color: colors.textPrimary,
      margin: 0,
    },
    systemHealthSubtitle: {
      fontSize: '9px',
      letterSpacing: '0.1em',
      color: colors.textLight,
      marginTop: '2px',
      margin: 0,
      fontWeight: 700,
    },
    donutChart: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      margin: '20px auto',
      background: `conic-gradient(${colors.accentTeal} 0% 99%, #e8f0ec 99% 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutInner: {
      width: '68px',
      height: '68px',
      background: 'white',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutText: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '18px',
      fontWeight: 800,
      color: colors.textPrimary,
    },
    optimalText: {
      color: colors.accentTeal,
      fontSize: '11px',
      textAlign: 'center',
      fontWeight: 600,
      margin: 0,
    },
    academicCard: {
      background: 'white',
      border: `1px solid ${colors.border}`,
      borderRadius: '14px',
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: '20px',
      alignItems: 'center',
      boxShadow: '0 4px 16px rgba(10, 46, 30, 0.02)',
      boxSizing: 'border-box',
      marginTop: '16px',
    },
    academicLeft: {
      display: 'flex',
      flexDirection: 'column',
    },
    academicIconBox: {
      background: 'rgba(245, 166, 35, 0.1)',
      borderRadius: '8px',
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '12px',
      width: '36px',
      height: '36px',
      boxSizing: 'border-box',
      fontSize: '18px',
    },
    academicTitle: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '17px',
      fontWeight: 700,
      color: colors.textPrimary,
      lineHeight: 1.3,
      margin: '0 0 8px 0',
      letterSpacing: '-0.01em',
    },
    academicDesc: {
      color: colors.textMuted,
      fontSize: '12px',
      lineHeight: 1.5,
      margin: '0 0 12px 0',
    },
    academicLink: {
      color: colors.accentTeal,
      fontSize: '12px',
      fontWeight: 600,
      textDecoration: 'none',
      cursor: 'pointer',
      opacity: docLinkHover ? 0.8 : 1,
      display: 'inline-flex',
      alignItems: 'center',
      transition: 'opacity 0.2s',
    },
    academicRight: {
      background: colors.bgSurface,
      borderRadius: '10px',
      padding: '12px',
      height: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      position: 'relative',
    },
    trustedSection: {
      background: 'white',
      borderTop: `1px solid ${colors.border}`,
      borderBottom: `1px solid ${colors.border}`,
      padding: isMobile ? '20px 10px' : '40px 80px',
      textAlign: 'center',
      boxSizing: 'border-box',
    },
    trustedTitle: {
      fontSize: '10px',
      letterSpacing: '0.15em',
      color: colors.textLight,
      fontWeight: 700,
      margin: '0 0 24px 0',
    },
    trustedRow: {
      display: 'flex',
      justifyContent: 'center',
      gap: isMobile ? '24px' : '48px',
      flexWrap: 'wrap',
    },
    trustedLogo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: colors.textLight,
      fontSize: '13px',
      fontWeight: 500,
    },
    ctaBottomSection: {
      background: colors.bgSurface,
      padding: isMobile ? '40px 12px' : '80px 24px',
      display: 'flex',
      justifyContent: 'center',
      boxSizing: 'border-box',
    },
    ctaBottomCard: {
      background: 'white',
      border: `1px solid ${colors.border}`,
      borderRadius: '24px',
      padding: isMobile ? '30px 20px' : '60px 48px',
      maxWidth: '640px',
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 8px 32px rgba(10, 46, 30, 0.02)',
      boxSizing: 'border-box',
    },
    ctaBottomTitle: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: isMobile ? '24px' : '32px',
      fontWeight: 700,
      color: colors.textPrimary,
      margin: '0 0 16px 0',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    ctaBottomSubtext: {
      color: colors.textMuted,
      fontSize: '15px',
      lineHeight: 1.6,
      margin: '0 0 32px 0',
    },
    ctaBottomBtn: {
      background: bottomCtaHover ? '#008f6c' : colors.accentTeal,
      color: 'white',
      padding: '13px 32px',
      borderRadius: '28px',
      fontSize: '15px',
      fontWeight: 700,
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(0, 166, 126, 0.2)',
      transition: 'background-color 0.2s, transform 0.1s',
      transform: bottomCtaHover ? 'scale(1.02)' : 'scale(1)',
      fontFamily: "'Inter', sans-serif",
    },
    footer: {
      background: colors.bgCard,
      borderTop: `1px solid ${colors.border}`,
      padding: isMobile ? '24px 20px' : '32px 80px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '24px',
      boxSizing: 'border-box',
    },
    footerLeft: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: isMobile ? 'center' : 'flex-start',
      width: isMobile ? '100%' : 'auto',
    },
    footerLogoRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    footerLogoCircle: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: colors.textPrimary,
    },
    footerLogoText: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 700,
      color: colors.textPrimary,
      fontSize: '14px',
      letterSpacing: '-0.02em',
    },
    footerCopyright: {
      fontSize: '12px',
      color: colors.textMuted,
      maxWidth: '260px',
      textAlign: isMobile ? 'center' : 'left',
      margin: 0,
      lineHeight: 1.5,
    },
    footerRight: {
      display: 'flex',
      gap: '32px',
      flexWrap: 'wrap',
      justifyContent: isMobile ? 'center' : 'flex-end',
      width: isMobile ? '100%' : 'auto',
    },
    footerLink: (index) => ({
      fontSize: '12px',
      color: hoveredFooterLink === index ? colors.textPrimary : colors.textMuted,
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'color 0.2s',
      fontWeight: 500,
    }),
  };

  return (
    <div style={styles.container}>
      {/* Dynamic Font Styling Injected into Head */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap');
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Subtle button action clicks */
        button:active {
          transform: scale(0.98) !important;
        }
      ` }} />

      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.logoContainer} onClick={() => navigate('/')}>
          <span style={styles.logoCircle} />
          <span style={styles.logoText}>RootLens</span>
        </div>
        <div style={styles.navRight}>
          <button
            style={styles.loginBtn}
            onClick={() => navigate('/login')}
            onMouseEnter={() => setLoginHover(true)}
            onMouseLeave={() => setLoginHover(false)}
          >
            Log In
          </button>
          <button
            style={styles.startScanBtn}
            onClick={() => navigate('/login')}
            onMouseEnter={() => setStartScanHover(true)}
            onMouseLeave={() => setStartScanHover(false)}
          >
            Start Scan &rarr;
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.badge}>NEW: MULTI-AGENT RCA WORKFLOWS</div>
        <div style={styles.headlineContainer}>
          <h1 style={styles.headlineLine1}>Decode the Complexity of</h1>
          <h2 style={styles.headlineLine2}>Synthetic Intelligence</h2>
        </div>
        <p style={styles.subheadline}>
          RootLens provides autonomous root cause analysis
          for AI-driven ecosystems. Identify failures,
          understand agent behavior, and restore system
          integrity with clinical precision.
        </p>
        <button
          style={styles.heroCtaBtn}
          onClick={() => navigate('/login')}
          onMouseEnter={() => setHeroCtaHover(true)}
          onMouseLeave={() => setHeroCtaHover(false)}
        >
          Start Free Scan
        </button>
      </section>

      {/* FEATURES SECTION */}
      <section style={styles.featuresSection}>
        <div style={styles.featuresGrid}>
          {/* LEFT COLUMN */}
          <div style={styles.leftColumn}>
            {/* Feature 1 — Autonomous Investigations */}
            <div style={styles.feature1Wrapper}>
              <div style={styles.featureTextContainer}>
                <div style={styles.featureIcon(colors.accentTeal)}>
                  <span>⚙</span>
                </div>
                <h3 style={styles.featureTitle(colors.accentTeal)}>Autonomous Investigations</h3>
                <p style={styles.featureDescription}>
                  Deploy specialized AI agents that autonomously navigate your logs, traces, and metrics to pinpoint
                  anomalies faster than humanly possible.
                </p>
              </div>

              {/* Mini scan card */}
              <div style={styles.miniScanCard}>
                <div style={styles.scanRow1}>Scan initiated...</div>
                <div style={styles.scanRow2}>Analyzing log sequence #492</div>
                <div style={styles.scanRow3}>Cross-referencing metrics...</div>
              </div>
            </div>

            {/* Feature 2 — Root Cause Attribution */}
            <div style={styles.feature2Container}>
              <div style={styles.featureIcon('#e85d75')}>
                <span>🔗</span>
              </div>
              <h3 style={styles.featureTitle(colors.textPrimary)}>Root Cause Attribution</h3>
              <p style={styles.featureDescription}>
                Move beyond symptomatic alerts. Get definitive attributions with linked evidence from code commits to runtime logs.
              </p>

              {/* Mini status card */}
              <div style={styles.miniStatusCard}>
                <div style={styles.checkCircle}>✓</div>
                <div style={styles.statusTextContainer}>
                  <p style={styles.statusTitle}>Untitled Investigation</p>
                  <p style={styles.statusSubtitle}>Unknown — insufficient evidence</p>
                </div>
                <div style={styles.statusTime}>11m ago</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={styles.rightColumn}>
            {/* Top card — System Health */}
            <div style={styles.systemHealthCard}>
              <div style={styles.systemHealthHeader}>
                <h3 style={styles.systemHealthTitle}>System Health</h3>
                <p style={styles.systemHealthSubtitle}>REAL-TIME TELEMETRY</p>
              </div>

              {/* Donut chart */}
              <div style={styles.donutChart}>
                <div style={styles.donutInner}>
                  <span style={styles.donutText}>99%</span>
                </div>
              </div>

              <p style={styles.optimalText}>● Optimal Performance</p>
            </div>

            {/* Bottom card — Academic-Grade Knowledge */}
            <div style={styles.academicCard}>
              <div style={styles.academicLeft}>
                <div style={styles.academicIconBox}>
                  <span>📋</span>
                </div>
                <h3 style={styles.academicTitle}>Academic-Grade Knowledge</h3>
                <p style={styles.academicDesc}>
                  Integrate your internal runbooks with our continuously updated LLM training set of global incident patterns.
                </p>
                <a
                  style={styles.academicLink}
                  onClick={() => {}}
                  onMouseEnter={() => setDocLinkHover(true)}
                  onMouseLeave={() => setDocLinkHover(false)}
                >
                  Explore Documentation &rarr;
                </a>
              </div>

              {/* Right: Simulate chart with 3 divs */}
              <div style={styles.academicRight}>
                {/* Div 1: Axis base line */}
                <div style={{
                  borderBottom: `1px solid ${colors.border}`,
                  width: '100%',
                  position: 'absolute',
                  bottom: '30px',
                  left: 0,
                  height: '0px'
                }} />

                {/* Div 2: One teal peak line with gradient background */}
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  left: '10%',
                  right: '10%',
                  height: '2px',
                  background: `linear-gradient(to right, transparent, ${colors.accentTeal}, transparent)`
                }} />

                {/* Div 3: Dotted alignment indicators */}
                <div style={{
                  position: 'absolute',
                  top: '35px',
                  bottom: '30px',
                  left: '50%',
                  width: '0px',
                  borderLeft: `1px dashed ${colors.border}`,
                  opacity: 0.8
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY BANNER */}
      <section style={styles.trustedSection}>
        <p style={styles.trustedTitle}>TRUSTED BY ADVANCED ENGINEERING TEAMS</p>
        <div style={styles.trustedRow}>
          <div style={styles.trustedLogo}>
            <span>🔗</span> Acme Corp
          </div>
          <div style={styles.trustedLogo}>
            <span>◯</span> Nexus AI
          </div>
          <div style={styles.trustedLogo}>
            <span>✦</span> Synthetix
          </div>
          <div style={styles.trustedLogo}>
            <span>⬡</span> StackFlow
          </div>
        </div>
      </section>

      {/* CTA BOTTOM BANNER */}
      <section style={styles.ctaBottomSection}>
        <div style={styles.ctaBottomCard}>
          <h2 style={styles.ctaBottomTitle}>Secure your AI infrastructure today.</h2>
          <p style={styles.ctaBottomSubtext}>
            Join the teams building the future of resilient synthetic intelligence.
            Start analyzing incidents with RootLens.
          </p>
          <button
            style={styles.ctaBottomBtn}
            onClick={() => navigate('/login')}
            onMouseEnter={() => setBottomCtaHover(true)}
            onMouseLeave={() => setBottomCtaHover(false)}
          >
            Start Free Scan
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerLeft}>
          <div style={styles.footerLogoRow}>
            <span style={styles.footerLogoCircle} />
            <span style={styles.footerLogoText}>RootLens</span>
          </div>
          <p style={styles.footerCopyright}>
            &copy; 2024 RootLens AI. Analytical Intelligence for the Modern Enterprise.
          </p>
        </div>

        <div style={styles.footerRight}>
          {['Privacy Policy', 'Terms of Service', 'Security', 'Status'].map((link, idx) => (
            <a
              key={link}
              style={styles.footerLink(idx)}
              onClick={() => {}}
              onMouseEnter={() => setHoveredFooterLink(idx)}
              onMouseLeave={() => setHoveredFooterLink(null)}
            >
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
