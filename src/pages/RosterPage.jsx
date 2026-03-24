import { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, ChevronDown, Users, Shield, Music } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { GENRE_OPTIONS } from '../constants/genres';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { SortDropdown } from '../components/SortDropdown';
import { FilterChips } from '../components/FilterChips';

export function RosterPage({ accountType, onViewProfile, isMobile = false }) {
  const [composers, setComposers] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPro, setSelectedPro] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [filterLocation, setFilterLocation] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;
  // Admin "god mode" toggle — lets admin switch between viewing composers and executives
  const isAdmin = accountType === 'admin';
  const [adminViewMode, setAdminViewMode] = useState('composer'); // 'composer' or 'music_executive'

  // Debounce search
  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    loadComposers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountType, selectedPro, selectedGenre, adminViewMode, debouncedSearch, sortBy, filterLocation]);

  const buildQuery = (from, to) => {
    const targetType = isAdmin ? adminViewMode : (accountType === 'music_executive' ? 'composer' : 'music_executive');
    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .in('account_type', [targetType, 'admin'])
      .eq('is_deleted', false);

    if (selectedPro !== 'All') {
      query = query.eq('pro_name', selectedPro);
    }

    if (selectedGenre !== 'All') {
      query = query.contains('genres', [selectedGenre]);
    }

    if (debouncedSearch.trim()) {
      query = query.or(`first_name.ilike.%${debouncedSearch.trim()}%,last_name.ilike.%${debouncedSearch.trim()}%`);
    }

    if (filterLocation) {
      query = query.eq('location', filterLocation);
    }

    // Sort
    if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
    else if (sortBy === 'name_az') query = query.order('first_name', { ascending: true });
    else if (sortBy === 'name_za') query = query.order('first_name', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    return query.range(from, to);
  };

  const loadComposers = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await buildQuery(0, PAGE_SIZE - 1);
      if (error) throw error;
      setComposers(data || []);
      setTotalCount(count || 0);
      setHasMore((data || []).length >= PAGE_SIZE);
    } catch (err) {
      console.error("Error loading composers:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const from = composers.length;
      const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      setComposers(prev => [...prev, ...(data || [])]);
      setHasMore((data || []).length >= PAGE_SIZE);
    } catch (err) {
      console.error("Error loading more:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const rosterGenreOptions = GENRE_OPTIONS;
  const rosterProOptions = ['All', 'ASCAP', 'BMI', 'SESAC', 'PRS', 'Other'];
  const rosterLocations = [...new Set(composers.map(c => c.location).filter(Boolean))].sort();

  // All filters are now server-side
  const filtered = composers;

  return (
    <div style={{ padding: isMobile ? '16px' : `${DESIGN_SYSTEM.spacing.xl} ${DESIGN_SYSTEM.spacing.xl}`, minHeight: "100%", overflowY: "auto" }}>
      <h1 style={{
        color: DESIGN_SYSTEM.colors.text.primary,
        fontSize: isMobile ? 24 : DESIGN_SYSTEM.fontSize.xxl,
        fontWeight: DESIGN_SYSTEM.fontWeight.extrabold,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        marginBottom: DESIGN_SYSTEM.spacing.xs
      }}>
        {isAdmin ? 'Browse Users' : accountType === 'music_executive' ? 'Discover Composers' : 'Music Executives'}
      </h1>
      <p style={{
        color: DESIGN_SYSTEM.colors.text.tertiary,
        fontSize: DESIGN_SYSTEM.fontSize.md,
        marginBottom: isAdmin ? DESIGN_SYSTEM.spacing.md : DESIGN_SYSTEM.spacing.lg
      }}>Connect with talented professionals in the industry</p>

      {/* Admin god-mode toggle */}
      {isAdmin && (
        <div style={{
          display: 'inline-flex',
          background: DESIGN_SYSTEM.colors.bg.card,
          borderRadius: DESIGN_SYSTEM.radius.full,
          padding: 4,
          marginBottom: DESIGN_SYSTEM.spacing.lg,
          border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        }}>
          {[
            { key: 'composer', label: 'Composers' },
            { key: 'music_executive', label: 'Executives' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setAdminViewMode(tab.key); setLoading(true); }}
              style={{
                padding: '8px 20px',
                borderRadius: DESIGN_SYSTEM.radius.full,
                border: 'none',
                cursor: 'pointer',
                fontSize: DESIGN_SYSTEM.fontSize.sm,
                fontWeight: adminViewMode === tab.key ? DESIGN_SYSTEM.fontWeight.bold : DESIGN_SYSTEM.fontWeight.medium,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                background: adminViewMode === tab.key ? DESIGN_SYSTEM.colors.brand.primary : 'transparent',
                color: adminViewMode === tab.key ? '#fff' : DESIGN_SYSTEM.colors.text.secondary,
                transition: DESIGN_SYSTEM.transition.fast,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: DESIGN_SYSTEM.spacing.lg, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: isMobile ? '100%' : 200, width: isMobile ? '100%' : undefined }}>
          <Search size={18} color={DESIGN_SYSTEM.colors.text.muted} style={{ position: "absolute", left: DESIGN_SYSTEM.spacing.md, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            style={{
              width: "100%",
              background: DESIGN_SYSTEM.colors.bg.card,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: DESIGN_SYSTEM.radius.md,
              padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md} ${DESIGN_SYSTEM.spacing.sm} 48px`,
              color: DESIGN_SYSTEM.colors.text.primary,
              fontSize: DESIGN_SYSTEM.fontSize.md,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              transition: DESIGN_SYSTEM.transition.fast,
            }}
            onFocus={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.accent}
            onBlur={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light}
          />
        </div>
        <select value={selectedPro} onChange={e => setSelectedPro(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: DESIGN_SYSTEM.radius.md, padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`, color: selectedPro !== 'All' ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.md, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minWidth: isMobile ? '100%' : 160, width: isMobile ? '100%' : undefined }} onFocus={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.accent} onBlur={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light}>
          {rosterProOptions.map(p => <option key={p} value={p}>{p === 'All' ? 'All PRO Affiliations' : p}</option>)}
        </select>
        <select value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: DESIGN_SYSTEM.radius.md, padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`, color: selectedGenre !== 'All' ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.md, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minWidth: isMobile ? '100%' : 140, width: isMobile ? '100%' : undefined }} onFocus={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.accent} onBlur={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light}>
          <option value="All">All Genres</option>
          {rosterGenreOptions.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: DESIGN_SYSTEM.radius.md, padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`, color: filterLocation ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.md, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minWidth: isMobile ? '100%' : 140, width: isMobile ? '100%' : undefined }}>
          <option value="">All Locations</option>
          {rosterLocations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Active Filter Chips + Sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
            {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
          </span>
          <FilterChips
            filters={[
              ...(selectedPro !== 'All' ? [{ label: `PRO: ${selectedPro}`, onRemove: () => setSelectedPro('All') }] : []),
              ...(selectedGenre !== 'All' ? [{ label: selectedGenre, onRemove: () => setSelectedGenre('All') }] : []),
              ...(filterLocation ? [{ label: filterLocation, onRemove: () => setFilterLocation('') }] : []),
            ]}
            onClearAll={() => { setSelectedPro('All'); setSelectedGenre('All'); setFilterLocation(''); }}
          />
        </div>
        <SortDropdown
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: 'newest', label: 'Newest' },
            { value: 'oldest', label: 'Oldest' },
            { value: 'name_az', label: 'Name A-Z' },
            { value: 'name_za', label: 'Name Z-A' },
          ]}
        />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px,1fr))', gap: DESIGN_SYSTEM.spacing.md }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.lg, overflow: 'hidden' }}>
              <div style={{ height: 4, background: DESIGN_SYSTEM.colors.border.medium }} />
              <div style={{ padding: DESIGN_SYSTEM.spacing.lg }}>
                <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 12, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? '1fr' : "repeat(auto-fill, minmax(280px, 1fr))", gap: DESIGN_SYSTEM.spacing.md }}>
          {filtered.map(composer => {
            // Genre-based accent color
            const GENRE_COLORS = { 'Pop': '#8B5CF6', 'Rock': '#EF4444', 'Jazz': '#F59E0B', 'Classical': '#3B82F6', 'Hip-Hop': '#EC4899', 'Electronic': '#06B6D4', 'Cinematic': '#6366F1', 'Folk': '#84CC16', 'R&B': '#A855F7', 'Country': '#F97316' };
            const accentColor = GENRE_COLORS[(composer.genres || [])[0]] || DESIGN_SYSTEM.colors.brand.primary;
            const isOneStop = composer.is_one_stop;

            return (
            <div
              key={composer.id}
              className="card-hover"
              onClick={() => onViewProfile(composer)}
              style={{
                background: DESIGN_SYSTEM.colors.bg.card,
                borderRadius: DESIGN_SYSTEM.radius.lg,
                border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                cursor: "pointer",
                transition: `all ${DESIGN_SYSTEM.transition.normal}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = accentColor + '55';
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px ${accentColor}22`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Accent strip */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}66 100%)`, flexShrink: 0 }} />

              <div style={{ padding: DESIGN_SYSTEM.spacing.lg, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: DESIGN_SYSTEM.spacing.md, marginBottom: DESIGN_SYSTEM.spacing.sm }}>
                  <Avatar name={`${composer.first_name} ${composer.last_name}`} color={composer.avatar_color} avatarUrl={composer.avatar_url} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: DESIGN_SYSTEM.colors.text.primary,
                      fontWeight: DESIGN_SYSTEM.fontWeight.bold,
                      fontSize: DESIGN_SYSTEM.fontSize.lg,
                      fontFamily: DESIGN_SYSTEM.font.body,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{composer.first_name} {composer.last_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                      {composer.location && (
                        <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11 }}>
                          📍 {composer.location}
                        </span>
                      )}
                      {composer.pro_name && (
                        <span style={{ background: `${DESIGN_SYSTEM.colors.brand.primary}15`, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}30` }}>
                          {composer.pro_name}
                        </span>
                      )}
                      {isOneStop && (
                        <span style={{ background: 'rgba(6,182,212,0.12)', color: '#06B6D4', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Shield size={9} /> One-Stop
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {composer.bio && (
                  <p style={{
                    color: DESIGN_SYSTEM.colors.text.tertiary,
                    fontSize: DESIGN_SYSTEM.fontSize.sm,
                    lineHeight: 1.6,
                    marginBottom: DESIGN_SYSTEM.spacing.sm,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    flex: 1,
                  }}>{composer.bio}</p>
                )}

                {/* Genre tags */}
                {composer.genres && composer.genres.length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                    {composer.genres.slice(0, 4).map((g, i) => (
                      <span key={g} style={{
                        background: i === 0 ? `${accentColor}18` : DESIGN_SYSTEM.colors.bg.surface,
                        color: i === 0 ? accentColor : DESIGN_SYSTEM.colors.text.tertiary,
                        fontSize: 10, fontWeight: 600,
                        padding: '2px 7px', borderRadius: 5,
                        border: `1px solid ${i === 0 ? accentColor + '30' : DESIGN_SYSTEM.colors.border.light}`,
                        fontFamily: DESIGN_SYSTEM.font.body,
                      }}>{g}</span>
                    ))}
                    {composer.genres.length > 4 && (
                      <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 10, padding: '2px 4px' }}>+{composer.genres.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Footer CTA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                  <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, fontFamily: DESIGN_SYSTEM.font.body }}>
                    {composer.account_type === 'music_executive' ? 'Executive' : 'Composer'}
                  </span>
                  <span style={{ color: accentColor, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, fontFamily: DESIGN_SYSTEM.font.body }}>
                    View Profile <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
      {/* Load More */}
      {!loading && hasMore && filtered.length > 0 && (
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
            onMouseEnter={e => { if (!loadingMore) { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.color = loadingMore ? DESIGN_SYSTEM.colors.text.muted : DESIGN_SYSTEM.colors.text.secondary; }}
          >
            {loadingMore ? 'Loading...' : <><ChevronDown size={16} /> Load More ({composers.length} of {totalCount})</>}
          </button>
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: DESIGN_SYSTEM.colors.bg.card,
          borderRadius: DESIGN_SYSTEM.radius.lg,
          border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        }}>
          <Users size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: '0 auto 16px' }} />
          <h3 style={{
            color: DESIGN_SYSTEM.colors.text.primary,
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            marginBottom: 8,
          }}>No profiles found</h3>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginBottom: 16 }}>
            {composers.length === 0
              ? "No profiles are available yet. Check back soon!"
              : "Try adjusting your search or filters"}
          </p>
          {(search || selectedPro !== 'All' || selectedGenre !== 'All' || filterLocation) && (
            <button
              onClick={() => { setSearch(''); setSelectedPro('All'); setSelectedGenre('All'); setFilterLocation(''); }}
              style={{
                background: DESIGN_SYSTEM.colors.brand.primary,
                color: DESIGN_SYSTEM.colors.text.primary,
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
