import { useState } from "react";
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { friendlyError } from '../lib/utils';

const GENRE_LIST = [
  'Classical', 'Jazz', 'Electronic', 'Hip-Hop', 'Pop',
  'Film Score', 'Ambient', 'R&B', 'Afrobeats', 'World Music'
];

export function AuthPage({ onAuthComplete, onBackToLanding, onGoogleSignIn, initialError = "" }) {
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [signupStep, setSignupStep] = useState(1);   // 1 = credentials, 2 = profile info

  // Step 1 fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 fields
  const [role, setRole] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [genres, setGenres] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const switchView = (view) => {
    setAuthView(view);
    setSignupStep(1);
    setError("");
  };

  // Step 1 → Step 2
  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSignupStep(2);
  };

  // Final submit
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (authView === 'signup') {
        if (!role) { setError("Please select your role."); setLoading(false); return; }
        if (!firstName.trim() || !lastName.trim()) { setError("First and last name are required."); setLoading(false); return; }

        // 1. Create auth account
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        // 2. If email confirmation is required, no session/JWT exists yet — skip profile insert
        //    (RLS would block it). A flag is stored so App.jsx routes to AccountSetupPage on first login.
        if (!data.session) {
          localStorage.setItem('sp_pending_signup_email', email.toLowerCase().trim());
          showToast('Account created! Please verify your email then log in.', 'success');
          switchView('login');
          return;
        }

        // 3. Session available — create profile record immediately
        const accountType = role === 'executive' ? 'music_executive' : 'composer';
        const profileRow = {
          user_id: data.user.id,
          role,
          account_type: accountType,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          bio: bio.trim() || null,
          location: location.trim() || null,
          avatar_color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        };

        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .insert([profileRow])
          .select('*, composers(*)')
          .single();
        if (profileError) throw profileError;

        // 4. Composer genres (optional)
        if (role === 'composer' && genres.length > 0) {
          await supabase.from('composers').insert([{
            user_profile_id: profileData.id,
            genres,
          }]);
        }

        showToast('Account created! Welcome to SongPitch.', 'success');
        onAuthComplete(data.user, profileData);

      } else if (authView === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        showToast("Password reset link sent! Check your email inbox.", "success");
        switchView('login');

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthComplete(data.user);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Shared styles ────────────────────────────────────────────────────────
  const inputStyle = {
    width: "100%",
    background: DESIGN_SYSTEM.colors.bg.primary,
    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
    borderRadius: 10,
    padding: "12px 16px",
    color: DESIGN_SYSTEM.colors.text.primary,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Outfit', sans-serif",
    transition: "all 0.2s ease",
  };

  const labelStyle = {
    color: DESIGN_SYSTEM.colors.text.secondary,
    fontSize: 13,
    fontWeight: 600,
    display: 'block',
    marginBottom: 6,
  };

  const focusInput = (e) => {
    e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary;
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(29,185,84,0.1)";
  };
  const blurInput = (e) => {
    e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light;
    e.currentTarget.style.boxShadow = "none";
  };

  const primaryBtnStyle = {
    width: "100%",
    background: DESIGN_SYSTEM.colors.brand.primary,
    color: DESIGN_SYSTEM.colors.text.primary,
    border: "none",
    borderRadius: 10,
    padding: "13px",
    fontWeight: 600,
    fontSize: 15,
    cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "'Outfit', sans-serif",
    opacity: loading ? 0.6 : 1,
    transition: "all 0.2s ease",
    boxShadow: '0 4px 16px rgba(29,185,84,0.25)',
  };

  const StepBar = ({ step }) => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
      <div style={{ flex: 1, height: 3, borderRadius: 2, background: DESIGN_SYSTEM.colors.brand.primary }} />
      <div style={{ flex: 1, height: 3, borderRadius: 2, background: step === 2 ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light }} />
    </div>
  );

  // ── SIGNUP STEP 2 — Profile info ─────────────────────────────────────────
  if (authView === 'signup' && signupStep === 2) {
    return (
      <div className="hero-animated-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit', sans-serif", overflowY: 'auto' }}>
        <div style={{ width: "100%", maxWidth: 480, background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 24, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, boxShadow: '0 16px 48px rgba(0,0,0,0.4)', margin: '20px 0' }}>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img src="/songpitch-logo.png" alt="SongPitch" style={{ width: 48, height: 48, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Complete Your Profile</h1>
            <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14 }}>Step 2 of 2 — Tell us about yourself</p>
          </div>

          <StepBar step={2} />

          <form onSubmit={handleAuth}>

            {/* Role picker */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>I am a *</label>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { type: 'composer', label: 'Composer', desc: 'I create music', icon: '🎵' },
                  { type: 'executive', label: 'Music Executive', desc: 'I discover talent', icon: '🎯' },
                ].map(({ type, label, desc, icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRole(type)}
                    style={{
                      flex: 1, padding: "14px 12px", borderRadius: 12, textAlign: 'center',
                      border: role === type ? `2px solid ${DESIGN_SYSTEM.colors.brand.primary}` : `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                      background: role === type ? `${DESIGN_SYSTEM.colors.brand.primary}15` : DESIGN_SYSTEM.colors.bg.primary,
                      color: role === type ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.tertiary,
                      cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 11, color: DESIGN_SYSTEM.colors.text.muted }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>First Name *</label>
                <input type="text" placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Last Name *</label>
                <input type="text" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} required style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                Location <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontWeight: 400 }}>(optional)</span>
              </label>
              <input type="text" placeholder="New York, NY" value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                Bio <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            {/* Genres — composers only */}
            {role === 'composer' && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>
                  Genres <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontWeight: 400 }}>(optional)</span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {GENRE_LIST.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                      style={{
                        background: genres.includes(g) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.bg.primary,
                        color: genres.includes(g) ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.tertiary,
                        border: `1px solid ${genres.includes(g) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`,
                        borderRadius: 20, padding: "5px 13px", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={{ color: DESIGN_SYSTEM.colors.accent.red, fontSize: 13, marginBottom: 14, textAlign: "center", padding: 12, background: `${DESIGN_SYSTEM.colors.accent.red}15`, borderRadius: 8, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}33` }} role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={primaryBtnStyle}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.light; e.currentTarget.style.boxShadow = '0 6px 24px rgba(29,185,84,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,185,84,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <button
              type="button"
              onClick={() => { setSignupStep(1); setError(""); }}
              style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", padding: '8px', transition: 'color 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary}
              onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.muted}
            >
              ← Back
            </button>

          </form>
        </div>
      </div>
    );
  }

  // ── LOGIN / SIGNUP STEP 1 / FORGOT PASSWORD ──────────────────────────────
  const headings = {
    login:  { title: 'Welcome Back',   subtitle: 'Sign in to SongPitch' },
    signup: { title: 'Create Account', subtitle: 'Step 1 of 2 — Enter your credentials' },
    forgot: { title: 'Reset Password', subtitle: "Enter your email and we'll send a reset link" },
  };

  return (
    <div className="hero-animated-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 24, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/songpitch-logo.png" alt="SongPitch" style={{ width: 56, height: 56, objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            {headings[authView].title}
          </h1>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14 }}>
            {headings[authView].subtitle}
          </p>
        </div>

        {authView === 'signup' && <StepBar step={1} />}

        <form onSubmit={authView === 'signup' ? handleNextStep : handleAuth}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              aria-label="Email address"
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {authView !== 'forgot' && (
            <div style={{ marginBottom: authView === 'login' ? 8 : 20 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                placeholder={authView === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                aria-label="Password"
                style={inputStyle}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
          )}

          {authView === 'login' && (
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => switchView('forgot')}
                style={{ background: 'none', border: 'none', color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'color 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary}
                onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.muted}
              >
                Forgot password?
              </button>
            </div>
          )}

          {authView === 'forgot' && <div style={{ height: 12 }} />}

          {error && (
            <div style={{ color: DESIGN_SYSTEM.colors.accent.red, fontSize: 13, marginBottom: 16, textAlign: "center", padding: 12, background: `${DESIGN_SYSTEM.colors.accent.red}15`, borderRadius: 8, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}33` }} role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={primaryBtnStyle}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.light; e.currentTarget.style.boxShadow = '0 6px 24px rgba(29,185,84,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,185,84,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? "Loading..." : authView === 'signup' ? "Next →" : authView === 'forgot' ? "Send Reset Link" : "Sign In"}
          </button>

          {onGoogleSignIn && authView !== 'forgot' && (
            <button
              type="button"
              onClick={onGoogleSignIn}
              style={{ width: '100%', marginTop: 10, background: DESIGN_SYSTEM.colors.bg.primary, color: DESIGN_SYSTEM.colors.text.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: '12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
            >
              Continue with Google
            </button>
          )}
        </form>

        <div style={{ textAlign: "center", marginTop: 24, paddingTop: 20, borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
          {authView === 'forgot' ? (
            <button
              onClick={() => switchView('login')}
              style={{ background: "none", border: "none", color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}
              onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.light}
              onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary}
            >
              ← Back to Sign In
            </button>
          ) : (
            <>
              <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 14 }}>
                {authView === 'signup' ? 'Already have an account?' : "Don't have an account?"}
              </span>
              {' '}
              <button
                onClick={() => switchView(authView === 'signup' ? 'login' : 'signup')}
                style={{ background: "none", border: "none", color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.light}
                onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary}
              >
                {authView === 'signup' ? 'Sign In' : 'Create Account'}
              </button>
            </>
          )}
          {onBackToLanding && (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={onBackToLanding}
                style={{ background: "none", border: "none", color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary}
                onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.muted}
              >
                ← Back to Landing
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
