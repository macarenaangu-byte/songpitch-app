import { useState, useEffect } from 'react';
import { Music, ArrowLeft, MessageCircle } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { friendlyError } from '../lib/utils';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { ProfileBadges } from '../components/ProfileBadges';
import { SongCard } from '../components/SongCard';
import { LoadingSongCard } from '../components/LoadingCards';

export function ViewProfilePage({ profileUser, currentUser, onBack, onOpenMessages, audioPlayer }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use shared audio player from parent
  const { playingSong, isPlaying, play: playAudio } = audioPlayer;

  useEffect(() => {
    if (profileUser.account_type === 'composer' || profileUser.account_type === 'admin') {
      loadComposerSongs();
    } else {
      setLoading(false);
    }
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
          viewed_user_id: viewedAuthUserId,
          viewer_user_id: viewerAuthUserId,
        });

      // Ignore duplicate view errors caused by unique constraint
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
        .eq('composer_id', profileUser.id)
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
      // Check if conversation already exists
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${profileUser.id}),and(user1_id.eq.${profileUser.id},user2_id.eq.${currentUser.id})`)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (!existingConv) {
        // Create new conversation
        const { error: createError } = await supabase
          .from('conversations')
          .insert([{
            user1_id: currentUser.id,
            user2_id: profileUser.id
          }]);

        if (createError) throw createError;
      }

      // Navigate to Messages page
      onOpenMessages();
    } catch (err) {
      showToast(friendlyError(err), "error");
    }
  };

  return (
    <div style={{ padding: "32px 36px", minHeight: "100%", overflowY: "auto" }}>
      {/* Back Button */}
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: DESIGN_SYSTEM.colors.brand.primary, cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile Header */}
      <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 20, padding: 32, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
          <Avatar name={`${profileUser.first_name} ${profileUser.last_name}`} color={profileUser.avatar_color} avatarUrl={profileUser.avatar_url} size={100} />

          <div style={{ flex: 1 }}>
            <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
              {profileUser.first_name} {profileUser.last_name}
            </h1>
            <Badge color={DESIGN_SYSTEM.colors.brand.primary} style={{ marginBottom: 8 }}>
              {profileUser.account_type === "admin" ? "👋 Founder" : profileUser.account_type === "music_executive" ? "Music Executive" : "Composer"}
            </Badge>
            <div style={{ marginBottom: 12 }}><ProfileBadges user={profileUser} /></div>

            {profileUser.bio && (
              <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{profileUser.bio}</p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
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
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 8 }}>
                  {profileUser.account_type === 'music_executive' ? 'Genres of Interest' : 'Genres'}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {profileUser.genres.map(g => <Badge key={g} color={DESIGN_SYSTEM.colors.accent.purple}>{g}</Badge>)}
                </div>
              </div>
            )}

            <button onClick={handleContact} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
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
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
