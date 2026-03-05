import { useState, useEffect } from 'react';
import { Play, Pause, ArrowLeft, FileText, MessageCircle, Briefcase, ChevronRight, CheckCircle, XCircle, Users } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { friendlyError, insertNotification } from '../lib/utils';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { LoadingOpportunityCard } from '../components/LoadingCards';

export function ResponsesPage({ userProfile, onNavigate, onViewProfile, audioPlayer }) {
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactingId, setContactingId] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all');

  const shortlistedIds = new Set(responses.filter(r => r.review_status === 'shortlisted').map(r => r.id));
  const rejectedIds = new Set(responses.filter(r => r.review_status === 'rejected').map(r => r.id));

  const toggleShortlist = async (responseId) => {
    const current = responses.find(r => r.id === responseId);
    const newStatus = current?.review_status === 'shortlisted' ? null : 'shortlisted';

    const { error } = await supabase
      .from('responses')
      .update({ review_status: newStatus })
      .eq('id', responseId);

    if (error) { showToast('Failed to update', 'error'); return; }

    setResponses(prev => prev.map(r => r.id === responseId ? { ...r, review_status: newStatus } : r));

    if (newStatus === 'shortlisted' && current?.composer_id) {
      insertNotification(
        current.composer_id,
        'submission_shortlisted',
        'Your submission was shortlisted! 🎉',
        `Your pitch for "${selectedOpp?.title}" was shortlisted by ${userProfile.first_name} ${userProfile.last_name}`,
        { opportunity_id: selectedOpp?.id, opportunity_title: selectedOpp?.title, executive_name: `${userProfile.first_name} ${userProfile.last_name}` }
      );
    }
  };

  const toggleRejected = async (responseId) => {
    const current = responses.find(r => r.id === responseId);
    const newStatus = current?.review_status === 'rejected' ? null : 'rejected';

    const { error } = await supabase
      .from('responses')
      .update({ review_status: newStatus })
      .eq('id', responseId);

    if (error) { showToast('Failed to update', 'error'); return; }

    setResponses(prev => prev.map(r => r.id === responseId ? { ...r, review_status: newStatus } : r));

    if (newStatus === 'rejected' && current?.composer_id) {
      insertNotification(
        current.composer_id,
        'submission_rejected',
        'Submission update',
        `Your pitch for "${selectedOpp?.title}" was not selected`,
        { opportunity_id: selectedOpp?.id, opportunity_title: selectedOpp?.title, executive_name: `${userProfile.first_name} ${userProfile.last_name}` }
      );
    }
  };

  const { playingSong, isPlaying, play: playAudio, stop: stopAudio } = audioPlayer;

  useEffect(() => {
    loadOpportunities();
  }, []);

  const handleContactComposer = async (composerId) => {
    setContactingId(composerId);
    try {
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${userProfile.id},user2_id.eq.${composerId}),and(user1_id.eq.${composerId},user2_id.eq.${userProfile.id})`)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (!existingConv) {
        const { error: createError } = await supabase
          .from('conversations')
          .insert([{
            user1_id: userProfile.id,
            user2_id: composerId
          }]);

        if (createError) throw createError;
      }

      onNavigate('messages');
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setContactingId(null);
    }
  };

  const loadOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          responses (count)
        `)
        .eq('creator_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (err) {
      console.error("Error loading opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadResponses = async (oppId) => {
    setLoading(true);
    try {
      const { data, error} = await supabase
        .from('responses')
        .select(`
          *,
          composer:user_profiles!responses_composer_id_fkey (
            first_name,
            last_name,
            avatar_color,
            avatar_url,
            bio,
            location
          ),
          song:songs (
            id,
            title,
            genre,
            duration,
            bpm,
            key,
            mood,
            audio_url
          )
        `)
        .eq('opportunity_id', oppId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (err) {
      console.error("Error loading responses:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectOpportunity = (opp) => {
    setSelectedOpp(opp);
    loadResponses(opp.id);
  };

  const goBack = () => {
    setSelectedOpp(null);
    setResponses([]);
    stopAudio();
  };

  return (
    <div style={{ padding: "32px 36px", minHeight: "100%", overflowY: "auto" }}>
      {!selectedOpp ? (
        <>
          <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>Responses</h1>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginBottom: 24 }}>View composer applications organized by opportunity</p>

          {loading ? (
            <div style={{ color: DESIGN_SYSTEM.colors.text.muted, textAlign: "center", padding: 60 }}>Loading...</div>
          ) : opportunities.length === 0 ? (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: "center" }}>
              <FileText size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
              <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>Your inbox is ready</h3>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Post your first opportunity and watch applications roll in from talented composers!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {opportunities.map(opp => (
                <div
                  key={opp.id}
                  onClick={() => selectOpportunity(opp)}
                  style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 20, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ display: "flex", alignItems: "start", gap: 14, marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${DESIGN_SYSTEM.colors.brand.primary}18`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Briefcase size={22} color={DESIGN_SYSTEM.colors.brand.primary} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{opp.title}</h3>
                      <Badge color={opp.status === 'Open' ? DESIGN_SYSTEM.colors.accent.green : DESIGN_SYSTEM.colors.text.muted}>{opp.status}</Badge>
                    </div>
                  </div>

                  <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, borderRadius: 10, padding: 12, marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Applications</span>
                      <span style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 20, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                        {opp.responses?.[0]?.count || 0}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    View Applications <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button onClick={goBack} style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 24, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{selectedOpp.title}</h1>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, marginTop: 2 }}>{responses.length} {responses.length === 1 ? 'Application' : 'Applications'}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          {!loading && responses.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['all', 'shortlisted', 'rejected'].map(f => (
                <button key={f} onClick={() => setReviewFilter(f)} style={{
                  background: reviewFilter === f ? (f === 'shortlisted' ? `${DESIGN_SYSTEM.colors.brand.primary}22` : f === 'rejected' ? `${DESIGN_SYSTEM.colors.accent.red}18` : DESIGN_SYSTEM.colors.bg.card) : 'transparent',
                  border: `1px solid ${reviewFilter === f ? (f === 'shortlisted' ? DESIGN_SYSTEM.colors.brand.primary : f === 'rejected' ? DESIGN_SYSTEM.colors.accent.red : DESIGN_SYSTEM.colors.border.light) : DESIGN_SYSTEM.colors.border.light}`,
                  borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  color: reviewFilter === f ? (f === 'shortlisted' ? DESIGN_SYSTEM.colors.brand.primary : f === 'rejected' ? DESIGN_SYSTEM.colors.accent.red : DESIGN_SYSTEM.colors.text.primary) : DESIGN_SYSTEM.colors.text.muted,
                  fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
                }}>
                  {f === 'all' ? `All (${responses.length})` : f === 'shortlisted' ? `Shortlisted (${responses.filter(r => shortlistedIds.has(r.id)).length})` : `Passed (${responses.filter(r => rejectedIds.has(r.id)).length})`}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ color: DESIGN_SYSTEM.colors.text.muted, textAlign: "center", padding: 60 }}>Loading applications...</div>
          ) : responses.length === 0 ? (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: "center" }}>
              <MessageCircle size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
              <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>No applications yet</h3>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Composers haven't applied to this opportunity yet. Check back later!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {responses
                .filter(r => reviewFilter === 'all' ? true : reviewFilter === 'shortlisted' ? shortlistedIds.has(r.id) : rejectedIds.has(r.id))
                .sort((a, b) => {
                  const aScore = shortlistedIds.has(a.id) ? 0 : rejectedIds.has(a.id) ? 2 : 1;
                  const bScore = shortlistedIds.has(b.id) ? 0 : rejectedIds.has(b.id) ? 2 : 1;
                  return aScore - bScore;
                })
                .map(response => (
                <div key={response.id} style={{
                  background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 24,
                  border: `1px solid ${shortlistedIds.has(response.id) ? DESIGN_SYSTEM.colors.brand.primary + '55' : DESIGN_SYSTEM.colors.border.light}`,
                  borderLeft: shortlistedIds.has(response.id) ? `4px solid ${DESIGN_SYSTEM.colors.brand.primary}` : rejectedIds.has(response.id) ? `4px solid ${DESIGN_SYSTEM.colors.accent.red}44` : `4px solid transparent`,
                  opacity: rejectedIds.has(response.id) ? 0.55 : 1,
                  transition: 'all 0.2s ease',
                }}>
                  <div style={{ display: "flex", alignItems: "start", gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                    <Avatar name={`${response.composer.first_name} ${response.composer.last_name}`} color={response.composer.avatar_color} avatarUrl={response.composer.avatar_url} size={56} />
                    <div style={{ flex: 1 }}>
                      <h3
                        onClick={() => onViewProfile && onViewProfile(response.composer)}
                        style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 4, cursor: onViewProfile ? "pointer" : "default", display: "inline" }}
                        onMouseEnter={e => { if (onViewProfile) e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary; }}
                        onMouseLeave={e => { if (onViewProfile) e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; }}
                      >
                        {response.composer.first_name} {response.composer.last_name}
                      </h3>
                      {response.composer.location && (
                        <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, marginBottom: 6 }}>{response.composer.location}</p>
                      )}
                      {response.composer.bio && (
                        <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, lineHeight: 1.5 }}>{response.composer.bio}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button onClick={() => toggleShortlist(response.id)} title={shortlistedIds.has(response.id) ? 'Remove from shortlist' : 'Shortlist'} style={{ background: shortlistedIds.has(response.id) ? `${DESIGN_SYSTEM.colors.brand.primary}22` : 'transparent', border: `1px solid ${shortlistedIds.has(response.id) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: shortlistedIds.has(response.id) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.muted, fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s' }}>
                        <CheckCircle size={13} /> {shortlistedIds.has(response.id) ? 'Shortlisted' : 'Shortlist'}
                      </button>
                      <button onClick={() => toggleRejected(response.id)} title={rejectedIds.has(response.id) ? 'Undo pass' : 'Pass'} style={{ background: rejectedIds.has(response.id) ? `${DESIGN_SYSTEM.colors.accent.red}18` : 'transparent', border: `1px solid ${rejectedIds.has(response.id) ? DESIGN_SYSTEM.colors.accent.red + '44' : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: rejectedIds.has(response.id) ? DESIGN_SYSTEM.colors.accent.red : DESIGN_SYSTEM.colors.text.muted, fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s' }}>
                        <XCircle size={13} /> {rejectedIds.has(response.id) ? 'Passed' : 'Pass'}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pitch</h4>
                    <p style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, lineHeight: 1.6 }}>{response.message}</p>
                  </div>

                  {response.song && (
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Demo</h4>
                      <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, borderRadius: 12, padding: 16, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div
                            onClick={() => playAudio(response.song)}
                            style={{ width: 42, height: 42, borderRadius: 10, background: `${DESIGN_SYSTEM.colors.brand.primary}22`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                          >
                            {playingSong?.id === response.song.id && isPlaying ? <Pause size={16} color={DESIGN_SYSTEM.colors.brand.primary} /> : <Play size={16} color={DESIGN_SYSTEM.colors.brand.primary} fill={DESIGN_SYSTEM.colors.brand.primary} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontWeight: 600, fontSize: 15, fontFamily: "'Outfit', sans-serif", marginBottom: 2 }}>{response.song.title}</div>
                            <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12 }}>
                              {response.song.genre && `${response.song.genre}`}
                              {response.song.duration && ` • ${response.song.duration}`}
                              {response.song.bpm && ` • ${response.song.bpm} BPM`}
                              {response.song.key && ` • ${response.song.key}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    style={{ width: "100%", background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 14, cursor: contactingId === response.composer_id ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: contactingId === response.composer_id ? 0.7 : 1, transition: "opacity 0.2s" }}
                    onClick={() => handleContactComposer(response.composer_id)}
                    disabled={contactingId === response.composer_id}
                  >
                    <MessageCircle size={16} /> {contactingId === response.composer_id ? "Opening conversation..." : "Contact Composer"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
