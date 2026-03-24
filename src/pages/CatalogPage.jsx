import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Music, ChevronDown, LayoutGrid, List, Play, Pause } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';
import { SongCard } from '../components/SongCard';
import { VerifiedRightsModal } from '../components/VerifiedRightsModal';
import { SortDropdown } from '../components/SortDropdown';
import { FilterChips } from '../components/FilterChips';
import { SongGridSkeleton } from '../components/Skeleton';
import { Lock } from 'lucide-react';
import { useTier } from '../hooks/useTier';
import UpgradeModal from '../components/UpgradeModal';

const PAGE_SIZE = 20;

// Color palette keyed by genre — fallback to gold
const GENRE_PALETTE = {
  'Pop': '#8B5CF6', 'Rock': '#EF4444', 'Jazz': '#F59E0B', 'Classical': '#3B82F6',
  'Hip-Hop': '#EC4899', 'R&B': '#A855F7', 'Electronic': '#06B6D4', 'Country': '#F97316',
  'Folk': '#84CC16', 'Soul': '#EF4444', 'Blues': '#3B82F6', 'Reggae': '#22C55E',
  'Punk': '#F43F5E', 'Metal': '#6B7280', 'Indie': '#8B5CF6', 'Ambient': '#06B6D4',
  'Orchestral': '#3B82F6', 'Cinematic': '#6366F1', 'Dance': '#EC4899', 'House': '#14B8A6',
};

function SongCardGrid({ song, isPlaying, onPlay, onViewRights, isMobile }) {
  const [hovered, setHovered] = useState(false);
  const genre = song.primary_genre || song.genre || '';
  const color = GENRE_PALETTE[genre] || '#C9A84C';

  return (
    <div
      className="card-hover"
      style={{
        background: DESIGN_SYSTEM.colors.bg.card,
        borderRadius: DESIGN_SYSTEM.radius.lg,
        border: `1px solid ${hovered ? color + '44' : DESIGN_SYSTEM.colors.border.light}`,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay && onPlay(song)}
    >
      {/* Art area */}
      <div style={{
        position: 'relative',
        height: 120,
        background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {/* Genre initial */}
        <span style={{
          fontSize: 42,
          fontWeight: 800,
          color: color + '50',
          fontFamily: DESIGN_SYSTEM.font.display,
          userSelect: 'none',
          letterSpacing: '-0.04em',
        }}>
          {genre.charAt(0) || '♪'}
        </span>

        {/* Play overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: hovered ? 'rgba(0,0,0,0.35)' : 'transparent',
          transition: 'background 0.2s ease',
        }}>
          {(hovered || isPlaying) && (
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: isPlaying ? color : 'rgba(255,255,255,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px rgba(0,0,0,0.4)`,
            }}>
              {isPlaying
                ? <Pause size={18} color="#fff" />
                : <Play size={18} color={color} fill={color} />
              }
            </div>
          )}
        </div>

        {/* BPM badge top-right */}
        {song.bpm && (
          <span style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 5,
            fontFamily: DESIGN_SYSTEM.font.body,
          }}>
            {song.bpm} BPM
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          color: DESIGN_SYSTEM.colors.text.primary,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: DESIGN_SYSTEM.font.body,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.3,
        }}>
          {song.title}
        </div>
        {song.composer_name && (
          <div style={{
            color: DESIGN_SYSTEM.colors.text.muted,
            fontSize: 11,
            fontFamily: DESIGN_SYSTEM.font.body,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {song.composer_name}
          </div>
        )}
        <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
          {genre && (
            <span style={{
              background: color + '18',
              color: color,
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 5,
              border: `1px solid ${color}30`,
              fontFamily: DESIGN_SYSTEM.font.body,
            }}>
              {genre}
            </span>
          )}
          {song.mood && (
            <span style={{
              background: DESIGN_SYSTEM.colors.bg.surface,
              color: DESIGN_SYSTEM.colors.text.tertiary,
              fontSize: 10,
              fontWeight: 500,
              padding: '2px 7px',
              borderRadius: 5,
              fontFamily: DESIGN_SYSTEM.font.body,
            }}>
              {song.mood}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CatalogPage({ audioPlayer, isMobile = false, userProfile }) {
  const { can } = useTier(userProfile);
  const canFilter = can('advancedFilters');
  const [upgradeModal, setUpgradeModal] = useState({ open: false, feature: '' });
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedMood, setSelectedMood] = useState("all");
  const [selectedVerification, setSelectedVerification] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [rightsModalSong, setRightsModalSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // For filter dropdowns — fetch all distinct values once
  const [allGenres, setAllGenres] = useState([]);
  const [allMoods, setAllMoods] = useState([]);

  const { playingSong, isPlaying, play: playAudio } = audioPlayer;

  // Debounce search input
  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Build Supabase query with server-side filters
  const buildQuery = useCallback((from, to) => {
    let query = supabase
      .from('songs')
      .select(`
        *,
        composer:user_profiles!songs_composer_id_fkey (
          first_name,
          last_name
        )
      `, { count: 'exact' });

    // Sort
    if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
    else if (sortBy === 'title_az') query = query.order('title', { ascending: true });
    else if (sortBy === 'title_za') query = query.order('title', { ascending: false });
    else query = query.order('created_at', { ascending: false }); // newest (default)

    if (selectedGenre !== 'all') query = query.ilike('genre', selectedGenre);
    if (selectedMood !== 'all') query = query.ilike('mood', selectedMood);
    if (selectedVerification === 'verified') query = query.eq('verification_status', 'verified');
    if (selectedVerification === 'pending') query = query.neq('verification_status', 'verified');
    if (debouncedSearch.trim()) {
      query = query.or(`title.ilike.%${debouncedSearch.trim()}%,genre.ilike.%${debouncedSearch.trim()}%`);
    }

    return query.range(from, to);
  }, [selectedGenre, selectedMood, selectedVerification, debouncedSearch, sortBy]);

  const formatSongs = (data) => (data || []).map(song => ({
    ...song,
    composer_name: song.composer ? `${song.composer.first_name} ${song.composer.last_name}` : "Unknown"
  }));

  // Load initial page
  const loadSongs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error, count } = await buildQuery(0, PAGE_SIZE - 1);
      if (error) throw error;
      const formatted = formatSongs(data);
      setSongs(formatted);
      setTotalCount(count || 0);
      setHasMore(formatted.length >= PAGE_SIZE);
    } catch (err) {
      console.error("Error loading songs:", err);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  // Load more
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const from = songs.length;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await buildQuery(from, to);
      if (error) throw error;
      const formatted = formatSongs(data);
      setSongs(prev => [...prev, ...formatted]);
      setHasMore(formatted.length >= PAGE_SIZE);
    } catch (err) {
      console.error("Error loading more songs:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load distinct genres and moods for filter dropdowns (once)
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const { data } = await supabase
          .from('songs')
          .select('genre, mood')
          .limit(200);
        if (data) {
          setAllGenres([...new Set(data.map(s => s.genre).filter(Boolean))].sort());
          setAllMoods([...new Set(data.map(s => s.mood).filter(Boolean))].sort());
        }
      } catch (err) {
        console.error("Error loading filter options:", err);
      }
    };
    loadFilterOptions();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const hasActiveFilters = selectedGenre !== "all" || selectedMood !== "all" || selectedVerification !== "all" || search !== "";

  const clearFilters = () => {
    setSelectedGenre("all");
    setSelectedMood("all");
    setSelectedVerification("all");
    setSearch("");
  };

  return (
    <div className="page-enter" style={{ padding: isMobile ? '16px' : "32px 36px", minHeight: "100%", overflowY: "auto" }}>

      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, feature: '' })}
        feature={upgradeModal.feature}
        userProfile={userProfile}
        defaultTier="basic"
      />

      <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: isMobile ? 24 : 28, fontWeight: 800, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", marginBottom: 8 }}>Search Catalog</h1>
      <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginBottom: 22 }}>Browse and discover music from talented composers</p>

      {/* Search Bar */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={16} color={DESIGN_SYSTEM.colors.text.muted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search songs, genres, moods..."
          style={{
            width: "100%",
            background: DESIGN_SYSTEM.colors.bg.card,
            border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
            borderRadius: 12,
            padding: "11px 16px 11px 40px",
            color: DESIGN_SYSTEM.colors.text.primary,
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />
      </div>

      {/* Pill Filter Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {/* Genre Pills */}
        {allGenres.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>Genre</div>
            <div className="pill-filter-row" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {['all', ...allGenres].map(genre => {
                const isActive = selectedGenre === genre;
                return (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    style={{
                      flexShrink: 0,
                      background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.09)',
                      borderRadius: 20,
                      padding: '5px 13px',
                      color: isActive ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.tertiary,
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(201,168,76,0.06)';
                        e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)';
                        e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                        e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.tertiary;
                      }
                    }}
                  >
                    {genre === 'all' ? 'All' : genre}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mood Pills */}
        {allMoods.length > 0 && (
          <div style={{ position: 'relative' }}>
            {!canFilter && (
              <div
                onClick={() => setUpgradeModal({ open: true, feature: 'Advanced filters (mood, status) are available on Basic and Pro plans.' })}
                style={{
                  position: 'absolute', inset: 0, zIndex: 10, borderRadius: 10,
                  background: 'rgba(9,11,28,0.65)', backdropFilter: 'blur(3px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, cursor: 'pointer',
                  border: '1px solid rgba(201,168,76,0.15)',
                }}>
                <Lock size={13} color='#C9A84C' />
                <span style={{ color: '#C9A84C', fontSize: 12, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>Basic & Pro</span>
              </div>
            )}
            <div style={{ fontSize: 10, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>Mood</div>
            <div className="pill-filter-row" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {['all', ...allMoods].map(mood => {
                const isActive = selectedMood === mood;
                return (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    style={{
                      flexShrink: 0,
                      background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.09)',
                      borderRadius: 20,
                      padding: '5px 13px',
                      color: isActive ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.tertiary,
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(201,168,76,0.06)';
                        e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)';
                        e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                        e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.tertiary;
                      }
                    }}
                  >
                    {mood === 'all' ? 'All' : mood}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Pills */}
        <div style={{ position: 'relative' }}>
          {!canFilter && (
            <div
              onClick={() => setUpgradeModal({ open: true, feature: 'Advanced filters (mood, status) are available on Basic and Pro plans.' })}
              style={{
                position: 'absolute', inset: 0, zIndex: 10, borderRadius: 10,
                background: 'rgba(9,11,28,0.65)', backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, cursor: 'pointer',
                border: '1px solid rgba(201,168,76,0.15)',
              }}>
              <Lock size={13} color='#C9A84C' />
              <span style={{ color: '#C9A84C', fontSize: 12, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>Basic & Pro</span>
            </div>
          )}
          <div style={{ fontSize: 10, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>Status</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { value: 'all', label: 'All Songs' },
              { value: 'verified', label: '✓ Verified' },
              { value: 'pending', label: 'Pending' },
            ].map(({ value, label }) => {
              const isActive = selectedVerification === value;
              return (
                <button
                  key={value}
                  onClick={() => setSelectedVerification(value)}
                  style={{
                    background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 20,
                    padding: '5px 13px',
                    color: isActive ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.tertiary,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(201,168,76,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)';
                      e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                      e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.tertiary;
                    }
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Filter Chips + Sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
            {hasActiveFilters ? `Found ${totalCount} songs` : `${totalCount} songs`}
          </span>
          <FilterChips
            filters={[
              ...(selectedGenre !== 'all' ? [{ label: selectedGenre, onRemove: () => setSelectedGenre('all') }] : []),
              ...(selectedMood !== 'all' ? [{ label: selectedMood, onRemove: () => setSelectedMood('all') }] : []),
              ...(selectedVerification !== 'all' ? [{ label: selectedVerification === 'verified' ? 'Verified' : 'Pending', onRemove: () => setSelectedVerification('all') }] : []),
            ]}
            onClearAll={clearFilters}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View toggle */}
          <div style={{
            display: 'flex',
            background: DESIGN_SYSTEM.colors.bg.card,
            border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
            borderRadius: 8,
            padding: 3,
            gap: 2,
          }}>
            {[
              { mode: 'list', icon: <List size={15} /> },
              { mode: 'grid', icon: <LayoutGrid size={15} /> },
            ].map(({ mode, icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  background: viewMode === mode ? DESIGN_SYSTEM.colors.brand.primary + '22' : 'transparent',
                  border: viewMode === mode ? `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40` : '1px solid transparent',
                  borderRadius: 5,
                  color: viewMode === mode ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.muted,
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {icon}
              </button>
            ))}
          </div>

          <SortDropdown
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
              { value: 'title_az', label: 'Title A-Z' },
              { value: 'title_za', label: 'Title Z-A' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <SongGridSkeleton count={8} />
      ) : songs.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: DESIGN_SYSTEM.colors.bg.card,
          borderRadius: 12,
          border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`
        }}>
          <Music size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
          <h3 style={{
            color: DESIGN_SYSTEM.colors.text.primary,
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 8,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
          }}>No songs found</h3>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginBottom: 16 }}>
            {hasActiveFilters
              ? "Try adjusting your filters or search terms"
              : "No songs have been uploaded yet. Be the first to share your music!"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                background: DESIGN_SYSTEM.colors.brand.primary,
                color: DESIGN_SYSTEM.colors.text.primary,
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? 'repeat(2, 1fr)'
                : 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 14,
            }}>
              {songs.map(song => (
                <SongCardGrid
                  key={song.id}
                  song={song}
                  isPlaying={playingSong?.id === song.id && isPlaying}
                  onPlay={playAudio}
                  onViewRights={(song) => setRightsModalSong(song)}
                  isMobile={isMobile}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {songs.map(song => (
                <SongCard key={song.id} song={song} isPlaying={playingSong?.id === song.id && isPlaying} onPlay={playAudio} onViewRights={(song) => setRightsModalSong(song)} isMobile={isMobile} />
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <button
                onClick={loadMore}
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
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  transition: `all ${DESIGN_SYSTEM.transition.fast}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={e => {
                  if (!loadingMore) {
                    e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary;
                    e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary;
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light;
                  e.currentTarget.style.color = loadingMore ? DESIGN_SYSTEM.colors.text.muted : DESIGN_SYSTEM.colors.text.secondary;
                }}
              >
                {loadingMore ? 'Loading...' : (
                  <>
                    <ChevronDown size={16} />
                    Load More ({songs.length} of {totalCount})
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      <VerifiedRightsModal
        open={!!rightsModalSong}
        onClose={() => setRightsModalSong(null)}
        song={rightsModalSong}
      />
    </div>
  );
}
