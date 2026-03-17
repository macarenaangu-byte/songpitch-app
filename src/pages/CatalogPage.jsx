import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Music, X, ChevronDown } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';
import { SongCard } from '../components/SongCard';
import { VerifiedRightsModal } from '../components/VerifiedRightsModal';
import { SortDropdown } from '../components/SortDropdown';
import { FilterChips } from '../components/FilterChips';

const PAGE_SIZE = 20;

export function CatalogPage({ audioPlayer, isMobile = false }) {
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
    <div style={{ padding: isMobile ? '16px' : "32px 36px", minHeight: "100%", overflowY: "auto" }}>
      <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: isMobile ? 24 : 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>Search Catalog</h1>
      <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginBottom: 22 }}>Browse and discover music from talented composers</p>

      {/* Search Bar */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} color={DESIGN_SYSTEM.colors.text.muted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or genre..."
          style={{
            width: "100%",
            background: DESIGN_SYSTEM.colors.bg.card,
            border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
            borderRadius: 10,
            padding: "11px 16px 11px 40px",
            color: DESIGN_SYSTEM.colors.text.primary,
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "'Outfit', sans-serif"
          }}
        />
      </div>

      {/* Filter Dropdowns */}
      <div style={{ display: "flex", flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Genre Filter */}
        <div style={{ flex: 1, minWidth: isMobile ? '100%' : 200 }}>
          <label style={{
            display: "block",
            color: DESIGN_SYSTEM.colors.text.tertiary,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>Genre</label>
          <select
            value={selectedGenre}
            onChange={e => setSelectedGenre(e.target.value)}
            style={{
              width: "100%",
              background: DESIGN_SYSTEM.colors.bg.card,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 8,
              padding: "10px 12px",
              color: DESIGN_SYSTEM.colors.text.primary,
              fontSize: 14,
              outline: "none",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            <option value="all">All Genres</option>
            {allGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* Mood Filter */}
        <div style={{ flex: 1, minWidth: isMobile ? '100%' : 200 }}>
          <label style={{
            display: "block",
            color: DESIGN_SYSTEM.colors.text.tertiary,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>Mood</label>
          <select
            value={selectedMood}
            onChange={e => setSelectedMood(e.target.value)}
            style={{
              width: "100%",
              background: DESIGN_SYSTEM.colors.bg.card,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 8,
              padding: "10px 12px",
              color: DESIGN_SYSTEM.colors.text.primary,
              fontSize: 14,
              outline: "none",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            <option value="all">All Moods</option>
            {allMoods.map(mood => (
              <option key={mood} value={mood}>{mood}</option>
            ))}
          </select>
        </div>

        {/* Verification Filter */}
        <div style={{ flex: 1, minWidth: isMobile ? '100%' : 200 }}>
          <label style={{
            display: "block",
            color: DESIGN_SYSTEM.colors.text.tertiary,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>Verification</label>
          <select
            value={selectedVerification}
            onChange={e => setSelectedVerification(e.target.value)}
            style={{
              width: "100%",
              background: DESIGN_SYSTEM.colors.bg.card,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 8,
              padding: "10px 12px",
              color: DESIGN_SYSTEM.colors.text.primary,
              fontSize: 14,
              outline: "none",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            <option value="all">All Songs</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={clearFilters}
              style={{
                background: DESIGN_SYSTEM.colors.bg.surface,
                color: DESIGN_SYSTEM.colors.text.tertiary,
                border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`,
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "'Outfit', sans-serif",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = DESIGN_SYSTEM.colors.border.medium;
                e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.surface;
                e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.tertiary;
              }}
            >
              <X size={14} /> Clear Filters
            </button>
          </div>
        )}
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

      {loading ? (
        <div style={{ color: DESIGN_SYSTEM.colors.text.muted, textAlign: "center", padding: 60 }}>Loading songs...</div>
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
            fontFamily: "'Outfit', sans-serif"
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
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {songs.map(song => (
              <SongCard key={song.id} song={song} isPlaying={playingSong?.id === song.id && isPlaying} onPlay={playAudio} onViewRights={(song) => setRightsModalSong(song)} isMobile={isMobile} />
            ))}
          </div>

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
                  fontFamily: "'Outfit', sans-serif",
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
