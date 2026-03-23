import { useState } from "react";
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { GENRE_OPTIONS } from '../constants/genres';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { friendlyError } from '../lib/utils';

const AVATAR_COLORS = [
  '#C9A84C', // gold
  '#8B5CF6', // purple
  '#3B82F6', // blue
  '#10B981', // teal
  '#F59E0B', // amber
  '#EC4899', // pink
];

export function AccountSetupPage({ user, onComplete }) {
  // Pre-populate name from Google OAuth metadata when available
  const googleName = user?.user_metadata?.full_name || '';
  const [accountType, setAccountType] = useState("");
  
  // Generic fields
  const [firstName, setFirstName] = useState(() => googleName.split(' ')[0] || '');
  const [lastName, setLastName] = useState(() => {
    const parts = googleName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  });
  // eslint-disable-next-line no-unused-vars
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");

  // Composer specific
  const [genres, setGenres] = useState([]);
  const [role, setRole] = useState("");

  // Executive specific
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const [loading, setLoading] = useState(false);

  const composerRoles = ['Producer', 'Film Composer', 'Songwriter', 'Multi-Instrumentalist', 'Beatmaker', 'Session Musician', 'Other'];
  const executiveRoles = ['A&R Manager', 'Sync A&R', 'Music Supervisor', 'Creative Director', 'Music Publisher', 'Label Executive', 'Sync Agent', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build the unified profile payload
      const profilePayload = {
        user_id: user.id,
        account_type: accountType,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
        linkedin_url: linkedInUrl.trim() || null,
        // Only set a color if they don't have one yet (upsert handles this nicely)
        avatar_color: AVATAR_COLORS[(firstName.trim().length + lastName.trim().length) % AVATAR_COLORS.length],
      };

      // Add specific fields based on account type
      if (accountType === 'composer') {
        profilePayload.role = role || null;
        profilePayload.genres = genres.length > 0 ? genres : null;
      } else if (accountType === 'music_executive') {
        profilePayload.company = company.trim() || null;
        profilePayload.job_title = jobTitle || null;
      }

      // UPSERT is crucial here: it updates the row if Supabase Auth already created a blank one, 
      // or inserts it if it doesn't exist. This prevents hidden database errors.
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profilePayload, { onConflict: 'user_id' })
        .select()
        .single();

      if (profileError) throw profileError;

      onComplete();
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-animated-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 520, background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 24, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, boxShadow: '0 16px 48px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/songpitch-logo.png" alt="SongPitch" style={{ width: 48, height: 48, objectFit: 'contain', margin: '0 auto 14px', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Complete Your Profile</h1>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14 }}>Tell us a bit about yourself to get started</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 10 }}>I am a *</label>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { type: 'composer', label: 'Composer', desc: 'I create music', icon: '\uD83C\uDFB5' },
                { type: 'music_executive', label: 'Music Executive', desc: 'I discover talent', icon: '\uD83C\uDFAF' }
              ].map(({ type, label, desc, icon }) => (
                <button key={type} type="button" onClick={() => setAccountType(type)} style={{
                  flex: 1, padding: "16px 14px", borderRadius: 12, textAlign: 'center',
                  border: accountType === type ? `2px solid ${DESIGN_SYSTEM.colors.brand.primary}` : `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                  background: accountType === type ? `${DESIGN_SYSTEM.colors.brand.primary}15` : DESIGN_SYSTEM.colors.bg.primary,
                  color: accountType === type ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.tertiary,
                  cursor: "pointer", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => { if (accountType !== type) e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.medium; }}
                  onMouseLeave={e => { if (accountType !== type) e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.muted }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <input type="text" placeholder="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ flex: 1, background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} />
            <input type="text" placeholder="Last Name *" value={lastName} onChange={e => setLastName(e.target.value)} required style={{ flex: 1, background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} />
          </div>

          <input type="text" placeholder="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", marginBottom: 16, boxSizing: "border-box", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} />
          <input type="text" placeholder="LinkedIn URL (optional)" value={linkedInUrl} onChange={e => setLinkedInUrl(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", marginBottom: 16, boxSizing: "border-box", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} />

          {/* COMPOSER ONBOARDING */}
          {accountType === 'composer' && (
            <div style={{ background: `${DESIGN_SYSTEM.colors.bg.primary}80`, padding: 16, borderRadius: 12, marginBottom: 20, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <select value={role} onChange={e => setRole(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", marginBottom: 16, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                <option value="">Select Primary Role...</option>
                {composerRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Primary Genres</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {/* Dynamically pull from your real GENRE_OPTIONS instead of hardcoded list */}
                {GENRE_OPTIONS.slice(0, 12).map(g => (
                  <button key={g} type="button" onClick={() => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])} style={{ background: genres.includes(g) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.bg.primary, color: genres.includes(g) ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${genres.includes(g) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EXECUTIVE ONBOARDING */}
          {accountType === 'music_executive' && (
            <div style={{ background: `${DESIGN_SYSTEM.colors.bg.primary}80`, padding: 16, borderRadius: 12, marginBottom: 20, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <input type="text" placeholder="Company / Agency" value={company} onChange={e => setCompany(e.target.value)} required style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", marginBottom: 16, boxSizing: "border-box", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} />
              
              <select value={jobTitle} onChange={e => setJobTitle(e.target.value)} required style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                <option value="">Select Job Title...</option>
                {executiveRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          <button type="submit" disabled={!accountType || loading} style={{ width: "100%", background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "13px", fontWeight: 600, fontSize: 15, cursor: (!accountType || loading) ? "not-allowed" : "pointer", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", opacity: (!accountType || loading) ? 0.6 : 1, transition: 'all 0.2s ease', boxShadow: '0 4px 16px rgba(201,168,76,0.25)' }}
            onMouseEnter={e => { if (accountType && !loading) { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.light; e.currentTarget.style.boxShadow = '0 6px 24px rgba(201,168,76,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,168,76,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? "Creating Profile..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}