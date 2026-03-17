import { useState, useEffect } from "react";
import { Search, Plus, X, Edit, Trash2, Calendar, DollarSign, CheckCircle, XCircle, Bookmark, Users, Briefcase, Check, ChevronDown } from "lucide-react";
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { GENRE_OPTIONS } from '../constants/genres';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { friendlyError, insertNotification, insertNotificationBatch } from '../lib/utils';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingOpportunityCard } from '../components/LoadingCards';
import { FilterChips } from '../components/FilterChips';

export function OpportunitiesPage({ userProfile, onBadgeRefresh, isMobile = false }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const OPP_PAGE_SIZE = 20;
  const [showForm, setShowForm] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [search, setSearch] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [appliedOpportunities, setAppliedOpportunities] = useState(new Set());

  // Bookmarks (Supabase-backed, localStorage as migration fallback)
  const [bookmarkedOpps, setBookmarkedOpps] = useState(new Set());

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const { data, error } = await supabase
          .from('opportunity_bookmarks')
          .select('opportunity_id')
          .eq('user_id', userProfile.id);
        if (error) throw error;
        const dbIds = new Set((data || []).map(r => r.opportunity_id));
        // Migrate any localStorage bookmarks not yet in DB
        const localIds = (() => {
          try { return JSON.parse(localStorage.getItem(`sp-bookmarks-${userProfile.id}`) || '[]'); }
          catch { return []; }
        })();
        const toMigrate = localIds.filter(id => !dbIds.has(id));
        if (toMigrate.length > 0) {
          await supabase.from('opportunity_bookmarks').upsert(
            toMigrate.map(id => ({ user_id: userProfile.id, opportunity_id: id })),
            { onConflict: 'user_id,opportunity_id', ignoreDuplicates: true }
          );
          toMigrate.forEach(id => dbIds.add(id));
          localStorage.removeItem(`sp-bookmarks-${userProfile.id}`);
        }
        setBookmarkedOpps(dbIds);
      } catch {
        // Fall back to localStorage if table doesn't exist yet
        try {
          setBookmarkedOpps(new Set(JSON.parse(localStorage.getItem(`sp-bookmarks-${userProfile.id}`) || '[]')));
        } catch { /* no-op */ }
      }
    };
    if (userProfile.account_type === 'composer') loadBookmarks();
  }, [userProfile.id, userProfile.account_type]);

  const toggleBookmark = async (oppId) => {
    const isBookmarked = bookmarkedOpps.has(oppId);
    setBookmarkedOpps(prev => {
      const next = new Set(prev);
      isBookmarked ? next.delete(oppId) : next.add(oppId);
      return next;
    });
    showToast(isBookmarked ? "Removed from saved" : "Saved for later!", isBookmarked ? "info" : "success");
    try {
      if (isBookmarked) {
        await supabase.from('opportunity_bookmarks').delete()
          .eq('user_id', userProfile.id).eq('opportunity_id', oppId);
      } else {
        await supabase.from('opportunity_bookmarks').upsert(
          { user_id: userProfile.id, opportunity_id: oppId },
          { onConflict: 'user_id,opportunity_id', ignoreDuplicates: true }
        );
      }
    } catch {
      // Fallback: persist to localStorage if DB fails
      setBookmarkedOpps(prev => {
        const next = new Set(prev);
        isBookmarked ? next.add(oppId) : next.delete(oppId);
        localStorage.setItem(`sp-bookmarks-${userProfile.id}`, JSON.stringify([...next]));
        return next;
      });
    }
  };

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState(null);

  // Apply modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingTo, setApplyingTo] = useState(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [selectedSongId, setSelectedSongId] = useState("");
  const [composerSongs, setComposerSongs] = useState([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [genres, setGenres] = useState([]);
  const [projectType, setProjectType] = useState("");
  const [moods, setMoods] = useState([]);
  const [vocalPreference, setVocalPreference] = useState("");

  // AI Brief Writer state
  const [showAIBrief, setShowAIBrief] = useState(false);
  const [aiNotes, setAiNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Pitch Writing Helper state
  const [pitchSuggestion, setPitchSuggestion] = useState("");
  const [pitchMetaNote, setPitchMetaNote] = useState("");
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchTone, setPitchTone] = useState('professional'); // 'professional' | 'personal' | 'story'

  // Smart Matching sort preference
  const [sortBy, setSortBy] = useState('match'); // 'match' | 'newest'

  const availableGenres = GENRE_OPTIONS;
  const projectTypeOptions = ['Film', 'TV Series', 'Advertising', 'Trailer', 'Video Game', 'Podcast', 'Social Media', 'Other'];
  const budgetOptions = ['Under $500', '$500\u2013$2K', '$2K\u2013$5K', '$5K\u2013$15K', '$15K+', 'Work for Hire', 'TBD'];
  const oppMoodOptions = ['Uplifting', 'Melancholic', 'Energetic', 'Calm', 'Dark', 'Romantic', 'Epic', 'Playful', 'Aggressive', 'Dreamy', 'Nostalgic', 'Mysterious', 'Triumphant', 'Tense'];
  const vocalOptions = ['Instrumental Only', 'Vocal', 'Either'];

  useEffect(() => {
    loadOpportunities();
    if (userProfile.account_type === 'composer') {
      loadComposerSongs();
      loadUserApplications();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  const loadUserApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('opportunity_id')
        .eq('composer_id', userProfile.id);

      if (error) throw error;

      const appliedIds = new Set(data.map(r => r.opportunity_id));
      setAppliedOpportunities(appliedIds);
    } catch (err) {
      console.error("Error loading applications:", err);
    }
  };

  const loadComposerSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('composer_id', userProfile.id);

      if (error) throw error;
      setComposerSongs(data || []);
    } catch (err) {
      console.error("Error loading songs:", err);
    }
  };

  const buildOppQuery = (from, to) => {
    let query = supabase
      .from('opportunities')
      .select(`
        *,
        creator:user_profiles!opportunities_creator_id_fkey (
          first_name,
          last_name,
          avatar_color,
          avatar_url
        ),
        responses (id)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (userProfile.account_type === 'music_executive' || userProfile.account_type === 'admin') {
      query = query.eq('creator_id', userProfile.id);
    } else {
      query = query.eq('status', 'Open');
    }

    return query.range(from, to);
  };

  const formatOpps = (data) => (data || []).map(opp => ({
    ...opp,
    response_count: opp.responses ? opp.responses.length : 0,
  }));

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await buildOppQuery(0, OPP_PAGE_SIZE - 1);
      if (error) throw error;

      const withCounts = formatOpps(data);
      setOpportunities(withCounts);
      setTotalCount(count || 0);
      setHasMore(withCounts.length >= OPP_PAGE_SIZE);

      // Mark open opportunities as viewed for composers
      if (userProfile.account_type === 'composer' && withCounts.length > 0) {
        const viewedRows = withCounts.map(opp => ({
          user_id: userProfile.id,
          opportunity_id: opp.id,
        }));

        const { error: viewedError } = await supabase
          .from('viewed_opportunities')
          .upsert(viewedRows, { onConflict: 'user_id,opportunity_id', ignoreDuplicates: true });

        if (viewedError) throw viewedError;
        if (onBadgeRefresh) onBadgeRefresh();
      }
    } catch (err) {
      console.error("Error loading opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreOpps = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const from = opportunities.length;
      const { data, error } = await buildOppQuery(from, from + OPP_PAGE_SIZE - 1);
      if (error) throw error;
      const withCounts = formatOpps(data);
      setOpportunities(prev => [...prev, ...withCounts]);
      setHasMore(withCounts.length >= OPP_PAGE_SIZE);
    } catch (err) {
      console.error("Error loading more opportunities:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const oppData = {
        creator_id: userProfile.id,
        title,
        description,
        budget: budget || null,
        deadline: deadline || null,
        genres: genres.length > 0 ? genres : null,
        status: editingOpp ? editingOpp.status : 'Open',
        metadata: {
          project_type: projectType || null,
          moods: moods.length > 0 ? moods : null,
          vocal_preference: vocalPreference || null,
        }
      };

      if (editingOpp) {
        const { error } = await supabase
          .from('opportunities')
          .update(oppData)
          .eq('id', editingOpp.id);
        if (error) throw error;
      } else {
        const { data: newOpp, error } = await supabase
          .from('opportunities')
          .insert([oppData])
          .select()
          .single();
        if (error) throw error;

        // Notify composers with matching genres
        if (oppData.genres && oppData.genres.length > 0) {
          const { data: matchingComposers } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('account_type', 'composer')
            .overlaps('genres', oppData.genres);
          if (matchingComposers && matchingComposers.length > 0) {
            insertNotificationBatch(
              matchingComposers.map(c => c.id),
              'new_opportunity',
              'New opportunity matches your style',
              `"${title}" is looking for ${oppData.genres.join(', ')} composers`,
              { opportunity_id: newOpp.id, opportunity_title: title, genres: oppData.genres }
            );
          }
        }
      }

      resetForm();
      loadOpportunities();
      showToast(editingOpp ? "Opportunity updated!" : "Opportunity posted!", "success");
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (opp) => {
    setConfirmModal({
      open: true,
      title: 'Delete Opportunity',
      message: `Are you sure you want to delete "${opp.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const { error } = await supabase
            .from('opportunities')
            .delete()
            .eq('id', opp.id);

          if (error) throw error;
          loadOpportunities();
          showToast("Opportunity deleted!", "success");
        } catch (err) {
          showToast(friendlyError(err), "error");
        }
      },
    });
  };

  const handleEdit = (opp) => {
    setEditingOpp(opp);
    setTitle(opp.title);
    setDescription(opp.description);
    setBudget(opp.budget || "");
    setDeadline(opp.deadline || "");
    setGenres(opp.genres || []);
    setProjectType(opp.metadata?.project_type || "");
    setMoods(opp.metadata?.moods || []);
    setVocalPreference(opp.metadata?.vocal_preference || "");
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingOpp(null);
    setTitle("");
    setDescription("");
    setBudget("");
    setDeadline("");
    setGenres([]);
    setProjectType("");
    setMoods([]);
    setVocalPreference("");
    setShowForm(false);
  };

  const toggleGenre = (genre) => {
    setGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  const toggleMood = (mood) => {
    setMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]);
  };

  // Smart Matching Engine
  const computeMatchScore = (opp) => {
    if (!composerSongs.length) return 0;
    let score = 0;

    // Genre match (50pts)
    const myGenres = new Set(composerSongs.map(s => s.genre).filter(Boolean));
    const oppGenres = opp.genres || [];
    const genreOverlap = oppGenres.filter(g => myGenres.has(g)).length;
    if (genreOverlap > 0) score += Math.min(50, 25 + (genreOverlap * 12.5));

    // Mood match (30pts)
    const myMoods = new Set(composerSongs.map(s => s.mood).filter(Boolean));
    const oppMoods = opp.metadata?.moods || [];
    const moodOverlap = oppMoods.filter(m => myMoods.has(m)).length;
    if (moodOverlap > 0) score += Math.min(30, 15 + (moodOverlap * 10));

    // Freshness bonus (10pts)
    const daysOld = (Date.now() - new Date(opp.created_at).getTime()) / 86400000;
    if (daysOld <= 7) score += 10;
    else if (daysOld <= 14) score += 5;

    // Budget signal (10pts)
    if (opp.budget && opp.budget !== 'TBD') score += 10;

    return Math.round(score);
  };

  // AI Brief Writer
  const generateAIBrief = async () => {
    if (!aiNotes.trim() || aiNotes.trim().length < 10) {
      showToast("Please describe your project in at least a couple of sentences", "error");
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const apiUrl = process.env.REACT_APP_AI_API_URL;
      if (!apiUrl) {
        showToast("AI server not configured", "error");
        setAiLoading(false);
        return;
      }
      const response = await fetch(`${apiUrl}/generate-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: aiNotes,
          title: title || undefined,
          project_type: projectType || undefined,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 'success') {
        setAiResult(data);
      } else {
        throw new Error("Unexpected response from AI server");
      }
    } catch (err) {
      console.error('AI Brief error:', err);
      showToast(err.message || "Failed to generate brief \u2014 is the AI server running?", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIBrief = () => {
    if (!aiResult) return;
    setDescription(aiResult.description || "");
    if (aiResult.genres?.length) setGenres(aiResult.genres);
    if (aiResult.moods?.length) setMoods(aiResult.moods);
    if (aiResult.project_type) setProjectType(aiResult.project_type);
    setShowAIBrief(false);
    setAiResult(null);
    setAiNotes("");
    showToast("Brief applied! Review and edit as needed.", "success");
  };

  // Pitch Writing Helper — reads existing text + returns metadata suggestions
  const generatePitch = async () => {
    setPitchLoading(true);
    setPitchSuggestion("");
    setPitchMetaNote("");
    const selectedSong = composerSongs.find(s => s.id === selectedSongId);
    const isPolishMode = applyMessage && applyMessage.trim().length > 10;
    try {
      const { data, error } = await supabase.functions.invoke('pitch-helper', {
        body: {
          existingPitch: isPolishMode ? applyMessage : null,
          song: selectedSong || null,
          opportunity: {
            title: applyingTo?.title,
            description: applyingTo?.description,
            genres: applyingTo?.genres,
            moods: applyingTo?.metadata?.moods,
          },
          tone: pitchTone,
          composerName: `${userProfile.first_name} ${userProfile.last_name}`,
        },
      });
      if (error) throw error;
      if (data?.pitch) {
        setPitchSuggestion(data.pitch);
        if (data.metadata_note) setPitchMetaNote(data.metadata_note);
        return;
      }
      throw new Error('AI unavailable');
    } catch (err) {
      console.warn('Pitch helper AI unavailable, using fallback:', err);
      // Fallback: quality templates based on real A&R pitch patterns
      const name = `${userProfile.first_name} ${userProfile.last_name}`;
      const selectedSong = composerSongs.find(s => s.id === selectedSongId);
      const songTitle = selectedSong?.title || 'my track';
      const genre = selectedSong?.genre || '';
      const mood = selectedSong?.mood ? selectedSong.mood.toLowerCase() : '';
      const bpm = selectedSong?.bpm ? `${selectedSong.bpm} BPM` : '';
      const licensing = selectedSong?.is_one_stop
        ? 'One-Stop cleared (master + publishing)'
        : selectedSong?.licensing_status || 'rights available for licensing';
      const oppTitle = applyingTo?.title || 'your brief';
      let suggestion;
      if (pitchTone === 'professional') {
        suggestion = `"${songTitle}"${genre ? ` — ${genre}` : ''}${bpm ? `, ${bpm}` : ''}${mood ? `, ${mood}` : ''}. Written for "${oppTitle}" specifically: the energy and production match what you've described. ${licensing}. Stems available on request.\n\n— ${name}`;
      } else if (pitchTone === 'personal') {
        suggestion = `Hi — I'm ${name}. The moment I read "${oppTitle}" I thought of "${songTitle}". It's ${[mood, genre, bpm].filter(Boolean).join(', ')} — but more than the tags, it has the specific feeling your brief is chasing. ${licensing}.`;
      } else {
        suggestion = `"${songTitle}" opens in a ${mood || 'specific'} space${genre ? ` — ${genre}` : ''}${bpm ? `, ${bpm}` : ''}. The production was built to feel like ${mood || "that moment you can't describe but immediately recognize"}. When I read "${oppTitle}", this was the only track I considered. ${licensing}.\n\n— ${name}`;
      }
      setPitchSuggestion(suggestion);
    } finally {
      setPitchLoading(false);
    }
  };

  const handleStatusChange = async (opp, newStatus) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ status: newStatus })
        .eq('id', opp.id);
      if (error) throw error;
      loadOpportunities();
      showToast(`Opportunity marked as "${newStatus}"`, "success");
    } catch (err) {
      showToast(friendlyError(err), "error");
    }
  };

  const handleWithdraw = (opp) => {
    setConfirmModal({
      open: true,
      title: 'Withdraw Application',
      message: `Withdraw your application from "${opp.title}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const { error } = await supabase
            .from('responses')
            .delete()
            .eq('opportunity_id', opp.id)
            .eq('composer_id', userProfile.id);

          if (error) throw error;

          setAppliedOpportunities(prev => {
            const next = new Set(prev);
            next.delete(opp.id);
            return next;
          });
          loadOpportunities();
          showToast("Application withdrawn successfully", "success");
        } catch (err) {
          showToast(friendlyError(err), "error");
        }
      },
    });
  };

  const openApplyModal = async (opp) => {
    setApplyingTo(opp);

    // Check if user has already applied and load their application
    if (appliedOpportunities.has(opp.id)) {
      try {
        const { data, error } = await supabase
          .from('responses')
          .select('message, song_id')
          .eq('opportunity_id', opp.id)
          .eq('composer_id', userProfile.id)
          .single();

        if (error) throw error;

        if (data) {
          setApplyMessage(data.message);
          setSelectedSongId(data.song_id);
        }
      } catch (err) {
        console.error("Error loading application:", err);
      }
    } else {
      setApplyMessage("");
      setSelectedSongId("");
    }

    setShowApplyModal(true);
  };

  const resetApplyModal = () => {
    setApplyingTo(null);
    setApplyMessage("");
    setSelectedSongId("");
    setPitchSuggestion("");
    setPitchTone('professional');
    setShowApplyModal(false);
  };

  const handleApply = async (e) => {
    e.preventDefault();

    if (!selectedSongId) {
      showToast("Please select a demo song", "error");
      return;
    }

    setLoading(true);
    try {
      const isEditing = appliedOpportunities.has(applyingTo.id);

      if (isEditing) {
        // Update existing application
        const { error } = await supabase
          .from('responses')
          .update({
            message: applyMessage,
            song_id: selectedSongId
          })
          .eq('opportunity_id', applyingTo.id)
          .eq('composer_id', userProfile.id);

        if (error) throw error;
        showToast("Application updated successfully!", "success");
      } else {
        // Create new application
        const { error } = await supabase
          .from('responses')
          .insert([{
            opportunity_id: applyingTo.id,
            composer_id: userProfile.id,
            message: applyMessage,
            song_id: selectedSongId,
            status: 'Responded'
          }]);

        if (error) {
          if (error.code === '23505') {
            showToast("You've already applied to this opportunity!", "error");
          } else {
            throw error;
          }
        } else {
          setAppliedOpportunities(prev => new Set([...prev, applyingTo.id]));
          showToast("Application submitted successfully!", "success");

          // Notify the opportunity creator
          if (applyingTo.creator_id) {
            insertNotification(
              applyingTo.creator_id,
              'submission_received',
              'New submission received',
              `${userProfile.first_name} ${userProfile.last_name} submitted to "${applyingTo.title}"`,
              { opportunity_id: applyingTo.id, opportunity_title: applyingTo.title, composer_name: `${userProfile.first_name} ${userProfile.last_name}` }
            );
          }
        }
      }

      resetApplyModal();
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const isComposer = userProfile.account_type === 'composer';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = opportunities
    .filter(opp => {
      const matchesSearch = (opp.title || '').toLowerCase().includes(search.toLowerCase()) ||
                           (opp.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesGenre = !filterGenre || opp.genres?.includes(filterGenre);
      return matchesSearch && matchesGenre;
    })
    .map(opp => ({
      ...opp,
      matchScore: isComposer ? computeMatchScore(opp) : 0,
      isExpired: opp.deadline ? new Date(opp.deadline) < today : false,
    }))
    .sort((a, b) => {
      if (isComposer && sortBy === 'match') {
        return b.matchScore - a.matchScore || new Date(b.created_at) - new Date(a.created_at);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div style={{ padding: isMobile ? '16px' : "32px 36px", minHeight: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? 'column' : 'row', justifyContent: "space-between", alignItems: isMobile ? 'flex-start' : "center", marginBottom: 24, gap: isMobile ? 12 : 0 }}>
        <div>
          <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: isMobile ? 24 : 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
            {(userProfile.account_type === 'music_executive' || userProfile.account_type === 'admin') ? 'My Opportunities' : 'Browse Opportunities'}
          </h1>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginTop: 4 }}>
            {(userProfile.account_type === 'music_executive' || userProfile.account_type === 'admin') ? 'Manage your posted projects' : 'Find projects that match your skills'}
          </p>
        </div>
        {(userProfile.account_type === 'music_executive' || userProfile.account_type === 'admin') && (
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', sans-serif" }}>
            <Plus size={15} /> Post Opportunity
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div style={{ display: "flex", flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} color={DESIGN_SYSTEM.colors.text.muted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunities..." style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "10px 16px 10px 40px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />
        </div>
        <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "10px 16px", color: filterGenre ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", minWidth: 150 }}>
          <option value="">All Genres</option>
          {availableGenres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        {isComposer && composerSongs.length > 0 && (
          <div style={{ display: 'flex', background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, overflow: 'hidden' }}>
            <button
              onClick={() => setSortBy('match')}
              style={{
                background: sortBy === 'match' ? DESIGN_SYSTEM.colors.brand.primary : 'transparent',
                color: sortBy === 'match' ? '#fff' : DESIGN_SYSTEM.colors.text.muted,
                border: 'none', padding: '10px 14px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              Best Match
            </button>
            <button
              onClick={() => setSortBy('newest')}
              style={{
                background: sortBy === 'newest' ? DESIGN_SYSTEM.colors.brand.primary : 'transparent',
                color: sortBy === 'newest' ? '#fff' : DESIGN_SYSTEM.colors.text.muted,
                border: 'none', padding: '10px 14px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              Newest
            </button>
          </div>
        )}
      </div>

      {/* Active Filter Chips */}
      {filterGenre && (
        <div style={{ marginBottom: 14 }}>
          <FilterChips
            filters={[{ label: filterGenre, onRemove: () => setFilterGenre('') }]}
          />
        </div>
      )}

      {/* Opportunity Form (Executives only) */}
      {showForm && (userProfile.account_type === 'music_executive' || userProfile.account_type === 'admin') && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 22, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{editingOpp ? "Edit Opportunity" : "Post New Opportunity"}</h3>
            <button
              onClick={resetForm}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Close form"
              title="Close"
            >
              <X size={18} color={DESIGN_SYSTEM.colors.text.muted} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", marginBottom: 12, boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />
            <div style={{ position: "relative", marginBottom: 12 }}>
              <textarea placeholder="Description * (What are you looking for? Include style references, tempo, instrumentation needs...)" value={description} onChange={e => setDescription(e.target.value)} required rows={4} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", paddingRight: 110, color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />
              <button
                type="button"
                onClick={() => { setShowAIBrief(true); setAiResult(null); }}
                style={{
                  position: "absolute", top: 8, right: 8,
                  background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.brand.purple}, #6366f1)`,
                  color: "#fff", border: "none", borderRadius: 20,
                  padding: "5px 12px", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                  boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.5)'; }}
                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)'; }}
                title="Use AI to help write your brief"
              >
                AI Assist
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <select value={projectType} onChange={e => setProjectType(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: projectType ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Project Type</option>
                {projectTypeOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={budget} onChange={e => setBudget(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: budget ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Budget Range</option>
                {budgetOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <input type="date" placeholder="Deadline" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 12 }}>
              <select value={vocalPreference} onChange={e => setVocalPreference(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: vocalPreference ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Vocal Preference</option>
                {vocalOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Genres</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {availableGenres.map(g => (
                  <button key={g} type="button" onClick={() => toggleGenre(g)} style={{ background: genres.includes(g) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.bg.primary, color: genres.includes(g) ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${genres.includes(g) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Mood / Vibe</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {oppMoodOptions.map(m => (
                  <button key={m} type="button" onClick={() => toggleMood(m)} style={{ background: moods.includes(m) ? DESIGN_SYSTEM.colors.brand.purple : DESIGN_SYSTEM.colors.bg.primary, color: moods.includes(m) ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${moods.includes(m) ? DESIGN_SYSTEM.colors.brand.purple : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={loading} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Saving..." : editingOpp ? "Update Opportunity" : "Post Opportunity"}
              </button>
              <button type="button" onClick={resetForm} style={{ background: "transparent", color: DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Opportunities List */}
      {loading && opportunities.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (<LoadingOpportunityCard key={i} />))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', padding: 24 }}>
          <div style={{ flex: '0 0 320px', background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 24, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: 'left' }}>
            <Briefcase size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ marginBottom: 12 }} />
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
              {(userProfile.account_type === 'music_executive' || userProfile.account_type === 'admin') ? 'Ready to find your sound?' : 'New opportunities are on the way!'}
            </h3>
            <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, marginBottom: 16 }}>
              {(userProfile.account_type === 'music_executive' || userProfile.account_type === 'admin') ? "Post your first brief and let talented composers come to you." : "Great things take time \u2014 check back soon or hit refresh to see the latest."}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {(userProfile.account_type === 'music_executive' || userProfile.account_type === 'admin') ? (
                <button onClick={() => { resetForm(); setShowForm(true); }} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>Post Opportunity</button>
              ) : (
                <button onClick={() => loadOpportunities()} style={{ background: 'transparent', color: DESIGN_SYSTEM.colors.brand.light, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>Refresh</button>
              )}
              <button onClick={() => showToast('Try adjusting filters or clearing the search', 'info')} style={{ background: 'transparent', color: DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>Help</button>
            </div>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingOpportunityCard key={i} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map(opp => (
            <div key={opp.id} style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 20, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.card; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", margin: 0 }}>{opp.title}</h3>
                    {isComposer && opp.matchScore >= 75 && (
                      <span style={{
                        background: `${DESIGN_SYSTEM.colors.accent.green}20`,
                        color: DESIGN_SYSTEM.colors.accent.green,
                        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap',
                        border: `1px solid ${DESIGN_SYSTEM.colors.accent.green}33`,
                      }}>
                        Great Match
                      </span>
                    )}
                    {isComposer && opp.matchScore >= 40 && opp.matchScore < 75 && (
                      <span style={{
                        background: `${DESIGN_SYSTEM.colors.accent.amber}20`,
                        color: DESIGN_SYSTEM.colors.accent.amber,
                        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap',
                        border: `1px solid ${DESIGN_SYSTEM.colors.accent.amber}33`,
                      }}>
                        Good Match
                      </span>
                    )}
                  </div>
                  {userProfile.account_type === 'composer' && opp.creator && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Avatar name={`${opp.creator.first_name} ${opp.creator.last_name}`} color={opp.creator.avatar_color} avatarUrl={opp.creator.avatar_url} size={24} />
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>{opp.creator.first_name} {opp.creator.last_name}</span>
                    </div>
                  )}
                </div>
                {userProfile.account_type === 'composer' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(opp.id); }}
                    style={{ background: bookmarkedOpps.has(opp.id) ? `${DESIGN_SYSTEM.colors.accent.amber}18` : 'transparent', border: `1px solid ${bookmarkedOpps.has(opp.id) ? DESIGN_SYSTEM.colors.accent.amber + '44' : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                    aria-label={bookmarkedOpps.has(opp.id) ? 'Remove bookmark' : 'Save for later'}
                    title={bookmarkedOpps.has(opp.id) ? 'Remove bookmark' : 'Save for later'}
                  >
                    <Bookmark size={14} color={bookmarkedOpps.has(opp.id) ? DESIGN_SYSTEM.colors.accent.amber : DESIGN_SYSTEM.colors.text.muted} fill={bookmarkedOpps.has(opp.id) ? DESIGN_SYSTEM.colors.accent.amber : 'none'} />
                  </button>
                )}
                {(userProfile.account_type === 'music_executive' || userProfile.account_type === 'admin') && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select
                      value={opp.status}
                      onChange={(e) => handleStatusChange(opp, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: '4px 8px', color: opp.status === 'Open' ? DESIGN_SYSTEM.colors.accent.green : opp.status === 'Filled' ? DESIGN_SYSTEM.colors.brand.blue : DESIGN_SYSTEM.colors.text.muted, fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif", outline: 'none', cursor: 'pointer' }}
                      aria-label="Change status"
                    >
                      <option value="Open">Open</option>
                      <option value="Paused">Paused</option>
                      <option value="Filled">Filled</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <button
                      onClick={() => handleEdit(opp)}
                      style={{ background: `${DESIGN_SYSTEM.colors.brand.primary}18`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      aria-label="Edit opportunity"
                      title="Edit"
                    >
                      <Edit size={14} color={DESIGN_SYSTEM.colors.brand.primary} />
                    </button>
                    <button
                      onClick={() => handleDelete(opp)}
                      style={{ background: `${DESIGN_SYSTEM.colors.accent.red}18`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}33`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      aria-label="Delete opportunity"
                      title="Delete"
                    >
                      <Trash2 size={14} color={DESIGN_SYSTEM.colors.accent.red} />
                    </button>
                  </div>
                )}
              </div>
              <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>{opp.description}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                {opp.budget && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${DESIGN_SYSTEM.colors.accent.green}18`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.green}33`, borderRadius: 8, padding: "6px 12px" }}>
                    <DollarSign size={14} color={DESIGN_SYSTEM.colors.accent.green} />
                    <span style={{ color: DESIGN_SYSTEM.colors.accent.green, fontSize: 12, fontWeight: 600 }}>{opp.budget}</span>
                  </div>
                )}
                {opp.deadline && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${DESIGN_SYSTEM.colors.accent.amber}18`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.amber}33`, borderRadius: 8, padding: "6px 12px" }}>
                    <Calendar size={14} color={DESIGN_SYSTEM.colors.accent.amber} />
                    <span style={{ color: DESIGN_SYSTEM.colors.accent.amber, fontSize: 12, fontWeight: 600 }}>{new Date(opp.deadline).toLocaleDateString()}</span>
                  </div>
                )}
                {opp.isExpired
                  ? <Badge color={DESIGN_SYSTEM.colors.text.muted}>Expired</Badge>
                  : <Badge color={opp.status === 'Open' ? DESIGN_SYSTEM.colors.accent.green : DESIGN_SYSTEM.colors.text.muted}>{opp.status}</Badge>
                }
                {opp.response_count > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: `${DESIGN_SYSTEM.colors.brand.blue}18`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.blue}33`, borderRadius: 8, padding: "6px 12px" }}>
                    <Users size={13} color={DESIGN_SYSTEM.colors.brand.blue} />
                    <span style={{ color: DESIGN_SYSTEM.colors.brand.blue, fontSize: 12, fontWeight: 600 }}>
                      {opp.response_count} {opp.response_count === 1 ? 'application' : 'applications'}
                    </span>
                  </div>
                )}
                {userProfile.account_type === 'composer' && opp.response_count === 0 && (
                  new Date() - new Date(opp.created_at) < 3 * 24 * 60 * 60 * 1000 ? (
                    <Badge color={DESIGN_SYSTEM.colors.brand.accent}>New</Badge>
                  ) : null
                )}
              </div>
              {opp.genres && opp.genres.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {opp.genres.map(g => <Badge key={g} color={DESIGN_SYSTEM.colors.accent.purple}>{g}</Badge>)}
                </div>
              )}
              {(opp.metadata?.project_type || opp.metadata?.vocal_preference || (opp.metadata?.moods && opp.metadata.moods.length > 0)) && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {opp.metadata?.project_type && <Badge color={DESIGN_SYSTEM.colors.brand.blue}>{opp.metadata.project_type}</Badge>}
                  {opp.metadata?.vocal_preference && <Badge color={DESIGN_SYSTEM.colors.text.secondary}>{opp.metadata.vocal_preference}</Badge>}
                  {opp.metadata?.moods?.map(m => <Badge key={m} color={DESIGN_SYSTEM.colors.brand.purple}>{m}</Badge>)}
                </div>
              )}
              {userProfile.account_type === 'composer' && (
                appliedOpportunities.has(opp.id) ? (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <div style={{ flex: 1, background: `${DESIGN_SYSTEM.colors.accent.green}22`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.green}33`, borderRadius: 10, padding: "10px", color: DESIGN_SYSTEM.colors.accent.green, fontWeight: 600, fontSize: 14, fontFamily: "'Outfit', sans-serif", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <CheckCircle size={16} /> Applied!
                    </div>
                    <button onClick={() => openApplyModal(opp)} style={{ background: `${DESIGN_SYSTEM.colors.brand.primary}22`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, borderRadius: 10, padding: "10px 16px", color: DESIGN_SYSTEM.colors.brand.primary, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                      <Edit size={13} /> Edit
                    </button>
                    <button onClick={() => handleWithdraw(opp)} style={{ background: `${DESIGN_SYSTEM.colors.accent.red}15`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}33`, borderRadius: 10, padding: "10px 14px", color: DESIGN_SYSTEM.colors.accent.red, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 5 }}
                      title="Withdraw application"
                    >
                      <XCircle size={14} /> Withdraw
                    </button>
                  </div>
                ) : (
                  <button onClick={() => openApplyModal(opp)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "10px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", marginTop: 12 }}>
                    Apply to Opportunity
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {!loading && hasMore && filtered.length > 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <button
            onClick={loadMoreOpps}
            disabled={loadingMore}
            style={{
              background: DESIGN_SYSTEM.colors.bg.card,
              color: loadingMore ? DESIGN_SYSTEM.colors.text.muted : DESIGN_SYSTEM.colors.text.secondary,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: DESIGN_SYSTEM.radius.md,
              padding: '12px 32px',
              fontSize: 14,
              fontWeight: 600,
              cursor: loadingMore ? 'default' : 'pointer',
              fontFamily: "'Outfit', sans-serif",
              transition: `all ${DESIGN_SYSTEM.transition.fast}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={e => { if (!loadingMore) { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.color = loadingMore ? DESIGN_SYSTEM.colors.text.muted : DESIGN_SYSTEM.colors.text.secondary; }}
          >
            {loadingMore ? 'Loading...' : <><ChevronDown size={16} /> Load More ({opportunities.length} of {totalCount})</>}
          </button>
        </div>
      )}

      {/* Apply Modal (Composers only) */}
      {showApplyModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 20, padding: 28, maxWidth: 540, width: "100%", border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                {appliedOpportunities.has(applyingTo?.id) ? "Edit Application" : "Apply to Opportunity"}
              </h2>
              <button
                onClick={resetApplyModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label="Close application modal"
                title="Close"
              >
                <X size={24} color={DESIGN_SYSTEM.colors.text.muted} />
              </button>
            </div>

            <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, borderRadius: 12, padding: 16, marginBottom: 20, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>{applyingTo?.title}</h3>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, lineHeight: 1.5 }}>{applyingTo?.description}</p>
            </div>

            <form onSubmit={handleApply}>
              {/* Pitch Tone Selector */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Pitch Tone</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { key: 'professional', label: '🎯 Professional', desc: 'Concise & direct' },
                    { key: 'personal', label: '💬 Personal', desc: 'Warm & authentic' },
                    { key: 'story', label: '📖 Story', desc: "Lead with the track's feel" },
                  ].map(({ key, label, desc }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setPitchTone(key); setPitchSuggestion(""); }}
                      style={{
                        flex: 1, background: pitchTone === key ? `${DESIGN_SYSTEM.colors.brand.purple}22` : DESIGN_SYSTEM.colors.bg.primary,
                        border: `1px solid ${pitchTone === key ? DESIGN_SYSTEM.colors.brand.purple : DESIGN_SYSTEM.colors.border.light}`,
                        borderRadius: 8, padding: '8px 6px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: pitchTone === key ? DESIGN_SYSTEM.colors.brand.purple : DESIGN_SYSTEM.colors.text.primary, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 10, color: DESIGN_SYSTEM.colors.text.muted }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600 }}>Your Pitch *</label>
                  <button
                    type="button"
                    onClick={generatePitch}
                    disabled={pitchLoading}
                    style={{ background: `${DESIGN_SYSTEM.colors.brand.purple}20`, color: DESIGN_SYSTEM.colors.brand.purple || '#a855f7', border: `1px solid ${DESIGN_SYSTEM.colors.brand.purple || '#a855f7'}44`, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: pitchLoading ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 4, opacity: pitchLoading ? 0.6 : 1 }}
                  >
                    ✨ {pitchLoading ? (applyMessage?.trim().length > 10 ? 'Polishing...' : 'Generating...') : (applyMessage?.trim().length > 10 ? 'Polish My Pitch' : 'AI Help')}
                  </button>
                </div>
                <textarea
                  value={applyMessage}
                  onChange={e => setApplyMessage(e.target.value)}
                  required
                  placeholder="Tell them why you're perfect for this project..."
                  rows={4}
                  style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "12px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }}
                />
                {pitchSuggestion && (
                  <div style={{ marginTop: 10, background: `${DESIGN_SYSTEM.colors.brand.primary}10`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}30`, borderRadius: 8, padding: 12 }}>
                    <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      ✨ {applyMessage?.trim().length > 10 ? 'Polished Version' : 'AI Suggestion'}
                    </p>
                    <p style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, lineHeight: 1.6, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{pitchSuggestion}</p>
                    {pitchMetaNote && (
                      <div style={{ background: `${DESIGN_SYSTEM.colors.brand.purple}12`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.purple}30`, borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
                        <p style={{ color: DESIGN_SYSTEM.colors.brand.purple || '#a855f7', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>💡 Metadata Tip</p>
                        <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, lineHeight: 1.5, margin: 0 }}>{pitchMetaNote}</p>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => { setApplyMessage(pitchSuggestion); setPitchSuggestion(""); setPitchMetaNote(""); }}
                        style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
                      >
                        Use This
                      </button>
                      <button
                        type="button"
                        onClick={generatePitch}
                        disabled={pitchLoading}
                        style={{ background: 'transparent', color: DESIGN_SYSTEM.colors.text.muted, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Select Demo Song *</label>
                {composerSongs.length === 0 ? (
                  <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: 16, textAlign: "center" }}>
                    <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>You haven't uploaded any songs yet. Go to your Portfolio to add songs first.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {composerSongs.map(song => (
                      <div
                        key={song.id}
                        onClick={() => setSelectedSongId(song.id)}
                        style={{
                          background: selectedSongId === song.id ? `${DESIGN_SYSTEM.colors.brand.primary}18` : DESIGN_SYSTEM.colors.bg.primary,
                          border: `1px solid ${selectedSongId === song.id ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`,
                          borderRadius: 8,
                          padding: "12px 14px",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { if (selectedSongId !== song.id) e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover; }}
                        onMouseLeave={e => { if (selectedSongId !== song.id) e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.primary; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selectedSongId === song.id ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`, background: selectedSongId === song.id ? DESIGN_SYSTEM.colors.brand.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {selectedSongId === song.id && <Check size={12} color={DESIGN_SYSTEM.colors.text.primary} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{song.title}</div>
                            <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginTop: 2 }}>
                              {song.genre && `${song.genre} \u2022 `}
                              {song.duration || "Unknown duration"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="submit"
                  disabled={loading || composerSongs.length === 0}
                  style={{ flex: 1, background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 15, cursor: (loading || composerSongs.length === 0) ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: (loading || composerSongs.length === 0) ? 0.6 : 1 }}
                >
                  {loading ? (appliedOpportunities.has(applyingTo?.id) ? "Updating..." : "Submitting...") : (appliedOpportunities.has(applyingTo?.id) ? "Update Application" : "Submit Application")}
                </button>
                <button
                  type="button"
                  onClick={resetApplyModal}
                  style={{ background: "transparent", color: DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 20px", fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI Brief Writer Modal */}
      {showAIBrief && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20,
        }}
          onClick={e => { if (e.target === e.currentTarget && !aiLoading) { setShowAIBrief(false); } }}
        >
          <div style={{
            background: DESIGN_SYSTEM.colors.bg.card,
            borderRadius: 20, padding: 28, maxWidth: 540, width: '100%',
            border: `1px solid ${DESIGN_SYSTEM.colors.brand.purple}44`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.brand.purple}, #6366f1)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>AI</div>
              <div>
                <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 17, fontWeight: 700, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                  AI Brief Writer
                </h3>
                <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                  Describe your project and let AI craft the perfect brief
                </p>
              </div>
            </div>

            {/* Input Section */}
            {!aiResult && (
              <>
                <textarea
                  placeholder={"Describe your project in your own words...\n\nExample: Need an upbeat Latin track for a tequila brand commercial, 30 seconds, should feel energetic and festive, maybe with acoustic guitar and percussion"}
                  value={aiNotes}
                  onChange={e => setAiNotes(e.target.value)}
                  rows={5}
                  style={{
                    width: '100%', background: DESIGN_SYSTEM.colors.bg.primary,
                    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                    borderRadius: 12, padding: '14px 16px',
                    color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14,
                    outline: 'none', resize: 'none', boxSizing: 'border-box',
                    fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
                  }}
                  autoFocus
                  disabled={aiLoading}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button
                    onClick={generateAIBrief}
                    disabled={aiLoading || aiNotes.trim().length < 10}
                    style={{
                      flex: 1,
                      background: aiLoading || aiNotes.trim().length < 10
                        ? DESIGN_SYSTEM.colors.border.light
                        : `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.brand.purple}, #6366f1)`,
                      color: '#fff', border: 'none', borderRadius: 10,
                      padding: '12px', fontWeight: 600, fontSize: 15,
                      cursor: aiLoading || aiNotes.trim().length < 10 ? 'not-allowed' : 'pointer',
                      fontFamily: "'Outfit', sans-serif",
                      opacity: aiLoading || aiNotes.trim().length < 10 ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {aiLoading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Generating...
                      </span>
                    ) : 'Generate Brief'}
                  </button>
                  <button
                    onClick={() => { setShowAIBrief(false); setAiNotes(""); }}
                    disabled={aiLoading}
                    style={{
                      background: 'transparent', color: DESIGN_SYSTEM.colors.text.tertiary,
                      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                      borderRadius: 10, padding: '12px 20px', fontWeight: 600, fontSize: 15,
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Result Preview */}
            {aiResult && (
              <>
                {/* Generated Description */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Generated Description
                  </label>
                  <div style={{
                    background: DESIGN_SYSTEM.colors.bg.primary,
                    border: `1px solid ${DESIGN_SYSTEM.colors.brand.purple}33`,
                    borderRadius: 10, padding: '12px 14px',
                    color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14,
                    lineHeight: 1.6, fontFamily: "'Outfit', sans-serif",
                  }}>
                    {aiResult.description}
                  </div>
                </div>

                {/* Suggested Genres */}
                {aiResult.genres?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Suggested Genres
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {aiResult.genres.map(g => (
                        <span key={g} style={{
                          background: DESIGN_SYSTEM.colors.brand.primary,
                          color: '#fff', borderRadius: 20, padding: '4px 12px',
                          fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                        }}>{g}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Moods */}
                {aiResult.moods?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Suggested Moods
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {aiResult.moods.map(m => (
                        <span key={m} style={{
                          background: DESIGN_SYSTEM.colors.brand.purple,
                          color: '#fff', borderRadius: 20, padding: '4px 12px',
                          fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                        }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Project Type */}
                {aiResult.project_type && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Suggested Project Type
                    </label>
                    <span style={{
                      background: DESIGN_SYSTEM.colors.brand.blue || '#2D7FF9',
                      color: '#fff', borderRadius: 20, padding: '4px 12px',
                      fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                    }}>{aiResult.project_type}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button
                    onClick={applyAIBrief}
                    style={{
                      flex: 1,
                      background: DESIGN_SYSTEM.colors.brand.primary,
                      color: '#fff', border: 'none', borderRadius: 10,
                      padding: '12px', fontWeight: 600, fontSize: 15,
                      cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Apply to Form
                  </button>
                  <button
                    onClick={() => { setAiResult(null); }}
                    style={{
                      background: 'transparent', color: DESIGN_SYSTEM.colors.text.tertiary,
                      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                      borderRadius: 10, padding: '12px 20px', fontWeight: 600, fontSize: 15,
                      cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => { setShowAIBrief(false); setAiResult(null); setAiNotes(""); }}
                    style={{
                      background: 'transparent', color: DESIGN_SYSTEM.colors.text.tertiary,
                      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                      borderRadius: 10, padding: '12px 16px', fontWeight: 600, fontSize: 15,
                      cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmModal?.open}
        title={confirmModal?.title}
        message={confirmModal?.message}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  );
}
