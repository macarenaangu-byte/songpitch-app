import { useState } from 'react';
import { Edit, LogOut, Upload, Trash2, Bell, BellOff } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { GENRE_OPTIONS } from '../constants/genres';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { friendlyError } from '../lib/utils';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { ProfileBadges } from '../components/ProfileBadges';

export function ProfilePage({ user, onSignOut, onProfileUpdate, onDeleteAccount }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [location, setLocation] = useState(user.location || "");
  const [customLocation, setCustomLocation] = useState("");
  const [proName, setProName] = useState(user.pro_name || user.pro || "");
  const [proUrl, setProUrl] = useState(user.pro_url || "");
  const [role, setRole] = useState(user.role || "");
  const [company, setCompany] = useState(user.company || "");
  const [jobTitle, setJobTitle] = useState(user.job_title || "");
  const [genres, setGenres] = useState(user.genres || []);
  const [instruments, setInstruments] = useState(user.instruments || "");
  const [websiteUrl, setWebsiteUrl] = useState(user.website_url || "");
  const [spotifyUrl, setSpotifyUrl] = useState(user.spotify_url || "");
  const [instagramUrl, setInstagramUrl] = useState(user.instagram_url || "");

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || null);

  // Email notification preferences
  const defaultEmailPrefs = { new_message: true, new_opportunity: true, submission_received: true, submission_shortlisted: true, submission_rejected: true };
  const [emailPrefs, setEmailPrefs] = useState(user.email_preferences || defaultEmailPrefs);
  const [savingEmailPrefs, setSavingEmailPrefs] = useState(false);

  const emailPrefLabels = {
    new_message: { label: 'New messages', desc: 'When someone sends you a message' },
    new_opportunity: { label: 'New opportunities', desc: 'When an opportunity matches your genres' },
    submission_received: { label: 'Submissions received', desc: 'When a composer applies to your opportunity' },
    submission_shortlisted: { label: 'Submission shortlisted', desc: 'When your submission is shortlisted' },
    submission_rejected: { label: 'Submission updates', desc: 'When your submission status changes' },
  };

  const toggleEmailPref = async (key) => {
    const updated = { ...emailPrefs, [key]: !emailPrefs[key] };
    setEmailPrefs(updated);
    setSavingEmailPrefs(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ email_preferences: updated })
        .eq('id', user.id);
      if (error) throw error;
      if (onProfileUpdate) await onProfileUpdate();
    } catch (err) {
      setEmailPrefs(emailPrefs); // revert on error
      showToast(friendlyError(err), 'error');
    } finally {
      setSavingEmailPrefs(false);
    }
  };

  const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      showToast("Please upload a JPG, PNG, or WebP image.", "error");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      showToast("Image must be under 2MB.", "error");
      return;
    }
    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const proOptions = ['ASCAP', 'BMI', 'SESAC', 'GMR', 'SOCAN', 'PRS', 'Other'];
  const composerRoles = ['Singer-Songwriter', 'Producer', 'Film Composer', 'Songwriter', 'Multi-Instrumentalist', 'Beatmaker', 'Session Musician', 'Other'];
  const executiveRoles = ['A&R Manager', 'Sync A&R', 'Music Supervisor', 'Creative Director', 'Music Publisher', 'Label Executive', 'Sync Agent', 'Other'];
  const genreOptions = GENRE_OPTIONS;
  const locationOptions = [
    'New York, NY',
    'Los Angeles, CA',
    'Nashville, TN',
    'London, UK',
    'Austin, TX',
    'Atlanta, GA',
    'Chicago, IL',
    'Miami, FL',
    'Toronto, Canada',
    'Paris, France',
    'Berlin, Germany',
    'Tokyo, Japan',
    'Sydney, Australia',
    'Custom...'
  ];

  const toggleGenre = (genre) => {
    setGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatarUrl = avatarPreview || null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()?.toLowerCase() || 'png';
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: avatarPublic } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = avatarPublic?.publicUrl || null;
      }

      const resolvedLocation = location === 'Custom...' ? customLocation : location;
      const updateData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim() || null,
        location: (resolvedLocation || '').trim() || null,
        genres: Array.isArray(genres) && genres.length > 0 ? genres : null,
        avatar_url: avatarUrl,
        website_url: websiteUrl.trim() || null,
        spotify_url: spotifyUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        pro_name: proName.trim() || null,
        pro_url: proUrl.trim() || null,
      };

      if (user.account_type === 'composer' || user.account_type === 'admin') {
        updateData.pro = proName.trim() || null;
        updateData.role = role || null;
        updateData.instruments = instruments || null;
      }

      if (user.account_type === 'music_executive' || user.account_type === 'admin') {
        updateData.company = company || null;
        updateData.job_title = jobTitle || null;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      showToast("Profile updated successfully!", "success");
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(avatarUrl);
      if (onProfileUpdate) await onProfileUpdate();
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "32px 36px", minHeight: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>My Profile</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <Edit size={15} /> Edit Profile
          </button>
        )}
      </div>

      <div style={{ maxWidth: 600, background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 20, padding: 28, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
        {!editing ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <Avatar name={`${user.first_name} ${user.last_name}`} color={user.avatar_color} avatarUrl={user.avatar_url} size={80} />
              <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginTop: 14 }}>{user.first_name} {user.last_name}</h2>
              <Badge color={DESIGN_SYSTEM.colors.brand.primary} style={{ marginTop: 8 }}>
                {user.account_type === "admin" ? "👋 Founder" : user.account_type === "music_executive" ? "Music Executive" : "Composer"}
              </Badge>
              <div style={{ marginTop: 10 }}><ProfileBadges user={user} /></div>
              {user.bio && <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>{user.bio}</p>}
            </div>

            <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Email</span>
                <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.email}</span>
              </div>

              {user.location && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Location</span>
                  <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.location}</span>
                </div>
              )}

              {(user.account_type === 'composer' || user.account_type === 'admin') && (
                <>
                  {(user.pro_name || user.pro) && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>PRO</span>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.pro_name || user.pro}</span>
                    </div>
                  )}
                  {user.role && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Role</span>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.role}</span>
                    </div>
                  )}
                  {user.instruments && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Instruments</span>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.instruments}</span>
                    </div>
                  )}
                  {user.genres && user.genres.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, display: "block", marginBottom: 8 }}>Genres</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {user.genres.map(g => <Badge key={g} color={DESIGN_SYSTEM.colors.accent.purple}>{g}</Badge>)}
                      </div>
                    </div>
                  )}
                </>
              )}

              {(user.account_type === 'music_executive' || user.account_type === 'admin') && (
                <>
                  {user.company && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Company</span>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.company}</span>
                    </div>
                  )}
                  {user.job_title && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Job Title</span>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.job_title}</span>
                    </div>
                  )}
                  {user.genres && user.genres.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, display: "block", marginBottom: 8 }}>Genres of Interest</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {user.genres.map(g => <Badge key={g} color={DESIGN_SYSTEM.colors.accent.purple}>{g}</Badge>)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Email Notification Preferences */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Bell size={16} color={DESIGN_SYSTEM.colors.text.secondary} />
                <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", margin: 0 }}>Email Notifications</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(emailPrefLabels)
                  .filter(([key]) => {
                    // Only show relevant prefs per account type
                    if (user.account_type === 'composer') return !['submission_received'].includes(key);
                    if (user.account_type === 'music_executive') return !['new_opportunity', 'submission_shortlisted', 'submission_rejected'].includes(key);
                    return true; // admin sees all
                  })
                  .map(([key, { label, desc }]) => (
                  <button
                    key={key}
                    onClick={() => toggleEmailPref(key)}
                    disabled={savingEmailPrefs}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                      borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                      fontFamily: "'Outfit', sans-serif", textAlign: 'left', width: '100%',
                      opacity: savingEmailPrefs ? 0.7 : 1, transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{label}</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12, marginTop: 2 }}>{desc}</div>
                    </div>
                    <div style={{
                      width: 40, height: 22, borderRadius: 11, position: 'relative',
                      background: emailPrefs[key] ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.medium,
                      transition: 'background 0.2s ease', flexShrink: 0, marginLeft: 12,
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 2, left: emailPrefs[key] ? 20 : 2,
                        transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={onSignOut} style={{ width: "100%", marginTop: 20, background: "transparent", color: DESIGN_SYSTEM.colors.accent.red, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}33`, borderRadius: 10, padding: "10px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <LogOut size={15} /> Sign Out
            </button>
            <button onClick={onDeleteAccount} style={{ width: "100%", marginTop: 10, background: `${DESIGN_SYSTEM.colors.accent.red}12`, color: DESIGN_SYSTEM.colors.accent.red, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}55`, borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Trash2 size={15} /> Delete Account
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 16 }}>Edit Profile</h3>

              {/* Avatar Upload */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: '2px solid rgba(255,255,255,0.1)' }} />
                  ) : (
                    <Avatar name={`${firstName} ${lastName}`} color={user.avatar_color} size={80} />
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <label style={{ background: `${DESIGN_SYSTEM.colors.brand.primary}18`, color: DESIGN_SYSTEM.colors.brand.primary, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                    <Upload size={14} /> Upload Photo
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} style={{ display: "none" }} />
                  </label>
                  {avatarPreview && (
                    <button type="button" onClick={removeAvatar} style={{ background: `${DESIGN_SYSTEM.colors.accent.red}18`, color: DESIGN_SYSTEM.colors.accent.red, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}33`, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>
                <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, marginTop: 6 }}>JPG, PNG, or WebP. Max 2MB.</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>First Name *</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Last Name *</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..." style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", resize: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Location</label>
                <select value={location} onChange={e => setLocation(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box", marginBottom: location === 'Custom...' ? 8 : 0 }}>
                  <option value="">Select Location...</option>
                  {locationOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                {location === 'Custom...' && (
                  <input
                    type="text"
                    value={customLocation}
                    onChange={e => setCustomLocation(e.target.value)}
                    placeholder="Enter your location..."
                    style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }}
                  />
                )}
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Website URL</label>
                <input type="text" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourwebsite.com" style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Spotify URL</label>
                <input type="text" value={spotifyUrl} onChange={e => setSpotifyUrl(e.target.value)} placeholder="https://open.spotify.com/..." style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Instagram URL</label>
                <input type="text" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/yourhandle" style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Performance Rights Organization (PRO)</label>
                <select value={proName} onChange={e => setProName(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }}>
                  <option value="">Select PRO...</option>
                  {proOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>PRO URL</label>
                <input type="text" value={proUrl} onChange={e => setProUrl(e.target.value)} placeholder="https://..." style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} />
              </div>

              {(user.account_type === 'composer' || user.account_type === 'admin') && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }}>
                      <option value="">Select Role...</option>
                      {composerRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Instruments (Optional)</label>
                    <input
                      type="text"
                      value={instruments}
                      onChange={e => setInstruments(e.target.value)}
                      placeholder="e.g., Piano, Guitar, Vocals"
                      style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Genres (Select all that apply)</label>
                    <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: 12, maxHeight: 200, overflowY: "auto" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                        {genreOptions.map(genre => (
                          <label key={genre} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 6, background: genres.includes(genre) ? `${DESIGN_SYSTEM.colors.brand.primary}22` : "transparent", border: genres.includes(genre) ? `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33` : "1px solid transparent" }}>
                            <input
                              type="checkbox"
                              checked={genres.includes(genre)}
                              onChange={() => toggleGenre(genre)}
                              style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                            <span style={{ color: genres.includes(genre) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: genres.includes(genre) ? 600 : 400 }}>{genre}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {genres.length > 0 && (
                      <div style={{ marginTop: 8, color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12 }}>
                        Selected: {genres.length} {genres.length === 1 ? 'genre' : 'genres'}
                      </div>
                    )}
                  </div>
                </>
              )}

              {(user.account_type === 'music_executive' || user.account_type === 'admin') && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Company</label>
                    <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g., Sony Music, Warner Chappell" style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Job Title</label>
                    <select value={jobTitle} onChange={e => setJobTitle(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }}>
                      <option value="">Select Job Title...</option>
                      {executiveRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Genres of Interest (Select all that apply)</label>
                    <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: 12, maxHeight: 200, overflowY: "auto" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                        {genreOptions.map(genre => (
                          <label key={genre} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 6, background: genres.includes(genre) ? `${DESIGN_SYSTEM.colors.brand.primary}22` : "transparent", border: genres.includes(genre) ? `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33` : "1px solid transparent" }}>
                            <input
                              type="checkbox"
                              checked={genres.includes(genre)}
                              onChange={() => toggleGenre(genre)}
                              style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                            <span style={{ color: genres.includes(genre) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: genres.includes(genre) ? 600 : 400 }}>{genre}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {genres.length > 0 && (
                      <div style={{ marginTop: 8, color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12 }}>
                        Selected: {genres.length} {genres.length === 1 ? 'genre' : 'genres'}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSave} disabled={saving || !firstName || !lastName} style={{ flex: 1, background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "10px", fontWeight: 600, fontSize: 14, cursor: (saving || !firstName || !lastName) ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: (saving || !firstName || !lastName) ? 0.6 : 1 }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)} style={{ background: "transparent", color: DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
