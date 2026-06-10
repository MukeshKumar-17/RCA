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

  // Color Palette — aligned with project's Material 3 tokens
  const colors = {
    bgPrimary: '#f2fcf5',
    bgSurface: '#e6f0ea',
    bgCard: '#e0ebe4',
    accentTeal: '#006b54',
    accentDark: '#141d1a',
    border: '#b9cbc2',
    textPrimary: '#141d1a',
    textMuted: '#6a7b73',
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
      background: 'rgba(242, 252, 245, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${colors.border}`,
      height: '64px',
      padding: isMobile ? '0 24px' : '0 48px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxSizing: 'border-box',
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
    },
    logoImg: {
      width: '28px',
      height: '28px',
      objectFit: 'contain',
    },
    logoText: {
      fontFamily: "'EB Garamond', Georgia, serif",
      fontWeight: 700,
      color: colors.textPrimary,
      fontSize: '22px',
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
      padding: '8px 16px',
      borderRadius: '8px',
      transition: 'opacity 0.2s, background 0.2s',
      opacity: loginHover ? 0.8 : 1,
      backgroundColor: loginHover ? 'rgba(0,107,84,0.06)' : 'transparent',
      fontFamily: "'Inter', sans-serif",
    },
    startScanBtn: {
      background: startScanHover ? '#00513e' : colors.accentTeal,
      color: 'white',
      borderRadius: '24px',
      padding: '10px 24px',
      fontWeight: 600,
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s, transform 0.15s',
      transform: startScanHover ? 'scale(1.03)' : 'scale(1)',
      fontFamily: "'Inter', sans-serif",
    },
    hero: {
      minHeight: '100vh',
      paddingTop: '120px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      paddingLeft: isMobile ? '16px' : '24px',
      paddingRight: isMobile ? '16px' : '24px',
      paddingBottom: isMobile ? '48px' : '96px',
      background: `${colors.bgPrimary} radial-gradient(ellipse 80% 50% at 50% 0%, #d4f0e4 0%, transparent 70%)`,
      boxSizing: 'border-box',
    },
    badge: {
      border: `1px solid ${colors.accentTeal}`,
      color: colors.accentTeal,
      background: 'rgba(0,107,84,0.04)',
      fontFamily: "'Inter', sans-serif",
      fontSize: '11px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      padding: '6px 20px',
      borderRadius: '24px',
      marginBottom: '32px',
      display: 'inline-block',
      fontWeight: 700,
    },
    headlineContainer: {
      marginBottom: '24px',
    },
    headlineLine1: {
      fontFamily: "'EB Garamond', Georgia, serif",
      fontSize: 'clamp(36px, 5.5vw, 64px)',
      fontWeight: 700,
      color: colors.textPrimary,
      margin: 0,
      lineHeight: 1.1,
      letterSpacing: '-0.03em',
    },
    headlineLine2: {
      fontSize: 'clamp(36px, 5.5vw, 64px)',
      fontStyle: 'italic',
      fontWeight: 400,
      color: colors.accentTeal,
      fontFamily: "'EB Garamond', Georgia, serif",
      margin: '4px 0 0 0',
      lineHeight: 1.1,
    },
    subheadline: {
      fontSize: '17px',
      color: colors.textMuted,
      maxWidth: '520px',
      lineHeight: 1.75,
      marginBottom: '40px',
      padding: isMobile ? '0 12px' : '0',
      fontFamily: "'Inter', sans-serif",
    },
    heroCtaBtn: {
      background: heroCtaHover ? '#00513e' : colors.accentTeal,
      color: 'white',
      padding: '14px 36px',
      borderRadius: '28px',
      fontSize: '16px',
      fontWeight: 700,
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 6px 20px rgba(0, 107, 84, 0.2)',
      transition: 'background-color 0.2s, transform 0.15s, box-shadow 0.2s',
      transform: heroCtaHover ? 'translateY(-1px) scale(1.02)' : 'scale(1)',
      fontFamily: "'Inter', sans-serif",
    },
    featuresSection: {
      background: colors.bgSurface,
      padding: isMobile ? '56px 20px' : '100px 80px',
      boxSizing: 'border-box',
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? '36px' : '64px 80px',
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
      gap: '20px',
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
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      border: `1.5px solid ${borderColor}`,
      background: 'white',
      fontSize: '18px',
      marginBottom: '16px',
      boxSizing: 'border-box',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }),
    featureTitle: (color) => ({
      fontFamily: "'EB Garamond', Georgia, serif",
      color: color,
      fontSize: '20px',
      fontWeight: 700,
      margin: '0 0 8px 0',
      letterSpacing: '-0.01em',
    }),
    featureDescription: {
      color: colors.textMuted,
      fontSize: '14px',
      lineHeight: 1.7,
      margin: 0,
    },
    miniScanCard: {
      background: 'white',
      border: `1px solid ${colors.border}`,
      borderRadius: '16px',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      flex: 1,
      minWidth: isMobile ? '100%' : '240px',
      boxShadow: '0 4px 16px rgba(20, 29, 26, 0.03)',
      boxSizing: 'border-box',
      justifyContent: 'center',
    },
    scanRow1: {
      fontSize: '12px',
      color: colors.textLight,
      fontWeight: 500,
    },
    scanRow2: {
      background: 'rgba(0, 107, 84, 0.08)',
      color: colors.accentTeal,
      borderRadius: '6px',
      padding: '6px 12px',
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
      borderRadius: '16px',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginTop: '16px',
      boxShadow: '0 4px 16px rgba(20, 29, 26, 0.03)',
      boxSizing: 'border-box',
    },
    checkCircle: {
      background: 'rgba(0, 107, 84, 0.1)',
      color: colors.accentTeal,
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      flexShrink: 0,
      fontWeight: 'bold',
    },
    statusTextContainer: {
      display: 'flex',
      flexDirection: 'column',
    },
    statusTitle: {
      fontWeight: 600,
      fontSize: '13px',
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
      borderRadius: '20px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 20px rgba(20, 29, 26, 0.03)',
      boxSizing: 'border-box',
    },
    systemHealthHeader: {
      display: 'flex',
      flexDirection: 'column',
    },
    systemHealthTitle: {
      fontFamily: "'EB Garamond', Georgia, serif",
      fontSize: '16px',
      fontWeight: 700,
      color: colors.textPrimary,
      margin: 0,
    },
    systemHealthSubtitle: {
      fontSize: '9px',
      letterSpacing: '0.12em',
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
      background: `conic-gradient(${colors.accentTeal} 0% 99%, #e6f0ea 99% 100%)`,
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
      fontFamily: "'EB Garamond', Georgia, serif",
      fontSize: '20px',
      fontWeight: 700,
      color: colors.textPrimary,
    },
    optimalText: {
      color: colors.accentTeal,
      fontSize: '12px',
      textAlign: 'center',
      fontWeight: 600,
      margin: 0,
    },
    academicCard: {
      background: 'white',
      border: `1px solid ${colors.border}`,
      borderRadius: '20px',
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: '20px',
      alignItems: 'center',
      boxShadow: '0 4px 20px rgba(20, 29, 26, 0.03)',
      boxSizing: 'border-box',
      marginTop: '0',
    },
    academicLeft: {
      display: 'flex',
      flexDirection: 'column',
    },
    academicIconBox: {
      background: 'rgba(245, 166, 35, 0.1)',
      borderRadius: '10px',
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '12px',
      width: '40px',
      height: '40px',
      boxSizing: 'border-box',
      fontSize: '18px',
    },
    academicTitle: {
      fontFamily: "'EB Garamond', Georgia, serif",
      fontSize: '18px',
      fontWeight: 700,
      color: colors.textPrimary,
      lineHeight: 1.3,
      margin: '0 0 8px 0',
      letterSpacing: '-0.01em',
    },
    academicDesc: {
      color: colors.textMuted,
      fontSize: '13px',
      lineHeight: 1.6,
      margin: '0 0 12px 0',
    },
    academicLink: {
      color: colors.accentTeal,
      fontSize: '13px',
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
      borderRadius: '14px',
      padding: '12px',
      height: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      position: 'relative',
    },
    trustedSection: {
      background: '#ffffff',
      borderTop: `1px solid ${colors.border}`,
      borderBottom: `1px solid ${colors.border}`,
      padding: isMobile ? '24px 10px' : '48px 80px',
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
      fontSize: '14px',
      fontWeight: 500,
    },
    ctaBottomSection: {
      background: colors.bgSurface,
      padding: isMobile ? '48px 16px' : '96px 24px',
      display: 'flex',
      justifyContent: 'center',
      boxSizing: 'border-box',
    },
    ctaBottomCard: {
      background: 'white',
      border: `1px solid ${colors.border}`,
      borderRadius: '32px',
      padding: isMobile ? '36px 24px' : '64px 56px',
      maxWidth: '640px',
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 8px 40px rgba(20, 29, 26, 0.04)',
      boxSizing: 'border-box',
    },
    ctaBottomTitle: {
      fontFamily: "'EB Garamond', Georgia, serif",
      fontSize: isMobile ? '26px' : '36px',
      fontWeight: 700,
      color: colors.textPrimary,
      margin: '0 0 16px 0',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    ctaBottomSubtext: {
      color: colors.textMuted,
      fontSize: '16px',
      lineHeight: 1.65,
      margin: '0 0 36px 0',
    },
    ctaBottomBtn: {
      background: bottomCtaHover ? '#00513e' : colors.accentTeal,
      color: 'white',
      padding: '14px 36px',
      borderRadius: '28px',
      fontSize: '16px',
      fontWeight: 700,
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 6px 20px rgba(0, 107, 84, 0.2)',
      transition: 'background-color 0.2s, transform 0.15s',
      transform: bottomCtaHover ? 'translateY(-1px) scale(1.02)' : 'scale(1)',
      fontFamily: "'Inter', sans-serif",
    },
    footer: {
      background: colors.bgCard,
      borderTop: `1px solid ${colors.border}`,
      padding: isMobile ? '28px 20px' : '36px 80px',
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
    footerLogoImg: {
      width: '20px',
      height: '20px',
      objectFit: 'contain',
    },
    footerLogoText: {
      fontFamily: "'EB Garamond', Georgia, serif",
      fontWeight: 700,
      color: colors.textPrimary,
      fontSize: '16px',
      letterSpacing: '-0.02em',
    },
    footerCopyright: {
      fontSize: '12px',
      color: colors.textMuted,
      maxWidth: '280px',
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
      fontSize: '13px',
      color: hoveredFooterLink === index ? colors.textPrimary : colors.textMuted,
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'color 0.2s',
      fontWeight: 500,
    }),
  };

  return (
    <div style={styles.container}>
      {/* Dynamic Font Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        button:active { transform: scale(0.98) !important; }
      ` }} />

      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.logoContainer} onClick={() => navigate('/')}>
          <img src="/logo.png" alt="Rootlens" style={styles.logoImg} />
          <span style={styles.logoText}>Rootlens</span>
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

              {/* Right: Simulate chart */}
              <div style={styles.academicRight}>
                <div style={{
                  borderBottom: `1px solid ${colors.border}`,
                  width: '100%',
                  position: 'absolute',
                  bottom: '30px',
                  left: 0,
                  height: '0px'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  left: '10%',
                  right: '10%',
                  height: '2px',
                  background: `linear-gradient(to right, transparent, ${colors.accentTeal}, transparent)`
                }} />
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
            <img src="/logo.png" alt="Rootlens" style={styles.footerLogoImg} />
            <span style={styles.footerLogoText}>Rootlens</span>
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
