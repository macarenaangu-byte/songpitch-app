import { useState } from "react";
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { GENRE_OPTIONS } from '../constants/genres';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { friendlyError } from '../lib/utils';

export function AccountSetupPage({ user, onComplete }) {
  const [accountType, setAccountType] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: user.id,
          account_type: accountType,
          first_name: firstName,
          last_name: lastName,
          bio: bio || null,
          location: location || null,
          avatar_color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      if (accountType === 'composer' && genres.length > 0) {
        const { error: composerError } = await supabase
          .from('composers')
          .insert([{
            user_profile_id: profileData.id,
            genres: genres
          }]);
        if (composerError) throw composerError;
      }

      onComplete();
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-animated-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 520, background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 24, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
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
                  cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s ease',
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
            <input type="text" placeholder="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ flex: 1, background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
            <input type="text" placeholder="Last Name *" value={lastName} onChange={e => setLastName(e.target.value)} required style={{ flex: 1, background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
          </div>

          <textarea placeholder="Bio (optional)" value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", resize: "none", marginBottom: 16, boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />

          <input type="text" placeholder="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", marginBottom: 16, boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />

          {accountType === 'composer' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Genres (select all that apply)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {['Classical', 'Jazz', 'Electronic', 'Hip-Hop', 'Pop', 'Film Score', 'Ambient', 'R&B', 'Afrobeats', 'World Music'].map(g => (
                  <button key={g} type="button" onClick={() => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])} style={{ background: genres.includes(g) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.bg.primary, color: genres.includes(g) ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${genres.includes(g) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={!accountType || loading} style={{ width: "100%", background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "13px", fontWeight: 600, fontSize: 15, cursor: (!accountType || loading) ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: (!accountType || loading) ? 0.6 : 1, transition: 'all 0.2s ease', boxShadow: '0 4px 16px rgba(29,185,84,0.25)' }}
            onMouseEnter={e => { if (accountType && !loading) { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.light; e.currentTarget.style.boxShadow = '0 6px 24px rgba(29,185,84,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,185,84,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? "Creating Profile..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
