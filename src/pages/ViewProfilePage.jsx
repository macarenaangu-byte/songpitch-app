import { useState, useEffect } from 'react';
import { Music, ArrowLeft, MessageCircle, ExternalLink, CheckCircle } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { friendlyError } from '../lib/utils';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { ProfileBadges } from '../components/ProfileBadges';
import { SongCard } from '../components/SongCard';
import { LoadingSongCard } from '../components/LoadingCards';
import { VerifiedRightsModal } from '../components/VerifiedRightsModal';

export function ViewProfilePage({ profileUser, currentUser, onBack, onOpenMessages, audioPlayer }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rightsModalSong, setRightsModalSong] = useState(null);

  // Compute profile completion for ring indicator
  const isComposerProfile = profileUser?.account_type === 'composer' || profileUser?.account_type === 'admin';
  const completionFields = isComposerProfile
    ? [profileUser?.bio, profileUser?.location, profileUser?.avatar_url, profileUser?.pro_name || profileUser?.pro, profileUser?.role, Array.isArray(profileUser?.genres) && profileUser?.genres.length > 0, profileUser?.instruments]
    : [profileUser?.bio, profileUser?.location, profileUser?.avatar_url, profileUser?.company, profileUser?.job_title, Array.isArray(profileUser?.genres) && profileUser?.genres.length > 0];
  const profileCompletionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  // Use shared audio player from parent
  const { playingSong, isPlaying, play: playAudio } = audioPlayer;

  useEffect(() => {
    // If they are a composer or admin, load their catalog!
    if (profileUser?.account_type === 'composer' || profileUser?.account_type === 'admin') {
      loadComposerSongs();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUser]);

  useEffect(() => {
    const trackProfileView = async () => {
      const viewedAuthUserId = profileUser?.user_id;
      const viewerAuthUserId = currentUser?.user_id || currentUser?.id;

      if (!viewedAuthUserId || !viewerAuthUserId) return;
      if (viewedAuthUserId === viewerAuthUserId) return;

      const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
      if (!isUuid(viewedAuthUserId) || !isUuid(viewerAuthUserId)) return;

      const { error } = await supabase
        .from('profile_views')
        .insert({
          viewed_profile_id: viewedAuthUserId,
          viewer_user_id: viewerAuthUserId,
        });

      if (error && error.code !== '23505') {
        console.error('Error tracking profile view:', error);
      }
    };

    trackProfileView();
  }, [profileUser?.user_id, currentUser?.user_id, currentUser?.id]);

  const loadComposerSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('composer_id', profileUser.id) // This fetches their catalog!
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSongs(data || []);
    } catch (err) {
      console.error("Error loading songs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    try {
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${profileUser.id}),and(user1_id.eq.${profileUser.id},user2_id.eq.${currentUser.id})`)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (!existingConv) {
        const { error: createError } = await supabase
          .from('conversations')
          .insert([{
            user1_id: currentUser.id,
            user2_id: profileUser.id
          }]);

        if (createError) throw createError;
      }

      onOpenMessages();
    } catch (err) {
      showToast(friendlyError(err), "error");
    }
  };

  if (!profileUser) return null;

  return (
    <div style={{ padding: "32px 36px", minHeight: "100%", overflowY: "auto" }}>
      {/* Back Button */}
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: DESIGN_SYSTEM.colors.brand.primary, cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile Header */}
      <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 20, padding: 32, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar name={`${profileUser.first_name} ${profileUser.last_name}`} color={profileUser.avatar_color} avatarUrl={profileUser.avatar_url} size={100} />
            <svg width="112" height="112" viewBox="0 0 112 112" style={{ position: 'absolute', top: -6, left: -6, pointerEvents: 'none' }}>
              <circle cx="56" cy="56" r="53" fill="none" stroke={`${DESIGN_SYSTEM.colors.border.light}`} strokeWidth="3" />
              <circle cx="56" cy="56" r="53" fill="none"
                stroke={profileCompletionPct >= 100 ? DESIGN_SYSTEM.colors.brand.primary : profileCompletionPct >= 50 ? DESIGN_SYSTEM.colors.accent.amber : DESIGN_SYSTEM.colors.text.muted}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 53}`}
                strokeDashoffset={`${2 * Math.PI * 53 * (1 - profileCompletionPct / 100)}`}
                transform="rotate(-90 56 56)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                {profileUser.first_name} {profileUser.last_name}
              </h1>
              {profileUser.is_one_stop && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${DESIGN_SYSTEM.colors.brand.primary}15`, padding: "4px 8px", borderRadius: 6 }}>
                  <CheckCircle size={14} color={DESIGN_SYSTEM.colors.brand.primary} />
                  <span style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 12, fontWeight: 700 }}>One-Stop Verified</span>
                </div>
              )}
            </div>
            
            <Badge color={DESIGN_SYSTEM.colors.brand.primary} style={{ marginBottom: 8 }}>
              {profileUser.account_type === "admin" ? "👋 Founder" : profileUser.account_type === "music_executive" ? "Music Executive" : "Composer"}
            </Badge>
            <div style={{ marginBottom: 12 }}><ProfileBadges user={profileUser} /></div>

            {profileUser.bio && (
              <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{profileUser.bio}</p>
            )}

            {/* UPGRADE: Portfolio & Social Links displayed neatly */}
            {(profileUser.website_url || profileUser.spotify_url || profileUser.instagram_url || profileUser.linkedin_url) && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                {profileUser.website_url && (
                  <a href={profileUser.website_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 13, fontWeight: 600, textDecoration: "none", background: `${DESIGN_SYSTEM.colors.brand.primary}11`, padding: "6px 12px", borderRadius: 8 }}>
                    <ExternalLink size={14} /> Website
                  </a>
                )}
                {profileUser.spotify_url && (
                  <a href={profileUser.spotify_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "#1DB954", fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#1DB95411", padding: "6px 12px", borderRadius: 8 }}>
                    <ExternalLink size={14} /> Spotify
                  </a>
                )}
                {profileUser.instagram_url && (
                  <a href={profileUser.instagram_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "#E1306C", fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#E1306C11", padding: "6px 12px", borderRadius: 8 }}>
                    <ExternalLink size={14} /> Instagram
                  </a>
                )}
                {profileUser.linkedin_url && (
                  <a href={profileUser.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "#0077B5", fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#0077B511", padding: "6px 12px", borderRadius: 8 }}>
                    <ExternalLink size={14} /> LinkedIn
                  </a>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20, padding: "16px", background: DESIGN_SYSTEM.colors.bg.primary, borderRadius: 12, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              {profileUser.location && (
                <div>
                  <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>Location</div>
                  <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.location}</div>
                </div>
              )}

              {(profileUser.account_type === 'composer' || profileUser.account_type === 'admin') && (
                <>
                  {(profileUser.pro_name || profileUser.pro) && (
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>PRO</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.pro_name || profileUser.pro}</div>
                    </div>
                  )}
                  {profileUser.cae_ipi && (
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>CAE/IPI #</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.cae_ipi}</div>
                    </div>
                  )}
                  {profileUser.publishing_status && (
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>Publishing Status</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.publishing_status}</div>
                    </div>
                  )}
                  {profileUser.role && (
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>Role</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.role}</div>
                    </div>
                  )}
                  {profileUser.instruments && (
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>Instruments</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.instruments}</div>
                    </div>
                  )}
                </>
              )}

              {(profileUser.account_type === 'music_executive' || profileUser.account_type === 'admin') && (
                <>
                  {profileUser.company && (
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>Company</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.company}</div>
                    </div>
                  )}
                  {profileUser.job_title && (
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>Job Title</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.job_title}</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {profileUser.genres && profileUser.genres.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 8 }}>
                  {profileUser.account_type === 'music_executive' ? 'Genres of Interest' : 'Genres'}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {profileUser.genres.map(g => <Badge key={g} color={DESIGN_SYSTEM.colors.accent.purple}>{g}</Badge>)}
                </div>
              </div>
            )}

            {profileUser.sync_credits && profileUser.sync_credits.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 8 }}>Sync Credits</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {profileUser.sync_credits.map((c, i) => (
                    <div key={i} style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.primary, background: DESIGN_SYSTEM.colors.bg.elevated || DESIGN_SYSTEM.colors.bg.primary, borderRadius: 6, padding: "6px 10px", border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                      <span style={{ fontWeight: 600 }}>{c.project}</span>
                      {c.platform && <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary }}> — {c.platform}</span>}
                      {c.year && <span style={{ color: DESIGN_SYSTEM.colors.text.muted }}>, {c.year}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleContact} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <MessageCircle size={16} /> Contact {profileUser.first_name}
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio (Composers + Admin) */}
      {(profileUser.account_type === 'composer' || profileUser.account_type === 'admin') && (
        <div>
          <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 16 }}>Portfolio</h2>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 3 }).map((_, i) => (<LoadingSongCard key={i} />))}
            </div>
          ) : songs.length === 0 ? (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: "center" }}>
              <Music size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14 }}>This composer hasn't uploaded any tracks yet — stay tuned!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {songs.map(song => (
                <SongCard
                  key={song.id}
                  song={{ ...song, composer_name: `${profileUser.first_name} ${profileUser.last_name}` }}
                  isPlaying={playingSong?.id === song.id && isPlaying}
                  onPlay={playAudio}
                  showActions={false}
                  onViewRights={(song) => setRightsModalSong(song)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <VerifiedRightsModal
        open={!!rightsModalSong}
        onClose={() => setRightsModalSong(null)}
        song={rightsModalSong}
      />
    </div>
  );
}