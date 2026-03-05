import { useState, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { GENRE_OPTIONS } from '../constants/genres';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';

export function RosterPage({ accountType, onViewProfile, isMobile = false }) {
  const [composers, setComposers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPro, setSelectedPro] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [filterLocation, setFilterLocation] = useState("");
  const [loading, setLoading] = useState(true);
  // Admin "god mode" toggle — lets admin switch between viewing composers and executives
  const isAdmin = accountType === 'admin';
  const [adminViewMode, setAdminViewMode] = useState('composer'); // 'composer' or 'music_executive'

  useEffect(() => {
    loadComposers();
  }, [accountType, selectedPro, selectedGenre, adminViewMode]);

  const loadComposers = async () => {
    try {
      const targetType = isAdmin ? adminViewMode : (accountType === 'music_executive' ? 'composer' : 'music_executive');
      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          composers (
            genres,
            specialties
          )
        `)
        .in('account_type', [targetType, 'admin'])
        .eq('is_deleted', false);

      if (selectedPro !== 'All') {
        query = query.eq('pro_name', selectedPro);
      }

      if (selectedGenre !== 'All') {
        query = query.contains('genres', [selectedGenre]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setComposers(data || []);
    } catch (err) {
      console.error("Error loading composers:", err);
    } finally {
      setLoading(false);
    }
  };

  const rosterGenreOptions = GENRE_OPTIONS;
  const rosterProOptions = ['All', 'ASCAP', 'BMI', 'SESAC', 'PRS', 'Other'];
  const rosterLocations = [...new Set(composers.map(c => c.location).filter(Boolean))].sort();

  const filtered = composers.filter(c => {
    const nameMatch = `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase());
    const genreMatch = selectedGenre === 'All' || (Array.isArray(c.genres) && c.genres.includes(selectedGenre));
    const locationMatch = !filterLocation || c.location === filterLocation;
    return nameMatch && genreMatch && locationMatch;
  });

  return (
    <div style={{ padding: isMobile ? '16px' : `${DESIGN_SYSTEM.spacing.xl} ${DESIGN_SYSTEM.spacing.xl}`, minHeight: "100%", overflowY: "auto" }}>
      <h1 style={{
        color: DESIGN_SYSTEM.colors.text.primary,
        fontSize: isMobile ? 24 : DESIGN_SYSTEM.fontSize.xxl,
        fontWeight: DESIGN_SYSTEM.fontWeight.extrabold,
        fontFamily: "'Outfit', sans-serif",
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
                fontFamily: "'Outfit', sans-serif",
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
              fontFamily: "'Outfit', sans-serif",
              transition: DESIGN_SYSTEM.transition.fast,
            }}
            onFocus={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.accent}
            onBlur={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light}
          />
        </div>
        <select value={selectedPro} onChange={e => setSelectedPro(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: DESIGN_SYSTEM.radius.md, padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`, color: selectedPro !== 'All' ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.md, outline: "none", fontFamily: "'Outfit', sans-serif", minWidth: isMobile ? '100%' : 160, width: isMobile ? '100%' : undefined }} onFocus={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.accent} onBlur={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light}>
          {rosterProOptions.map(p => <option key={p} value={p}>{p === 'All' ? 'All PRO Affiliations' : p}</option>)}
        </select>
        <select value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: DESIGN_SYSTEM.radius.md, padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`, color: selectedGenre !== 'All' ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.md, outline: "none", fontFamily: "'Outfit', sans-serif", minWidth: isMobile ? '100%' : 140, width: isMobile ? '100%' : undefined }} onFocus={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.accent} onBlur={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light}>
          <option value="All">All Genres</option>
          {rosterGenreOptions.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: DESIGN_SYSTEM.radius.md, padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`, color: filterLocation ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.md, outline: "none", fontFamily: "'Outfit', sans-serif", minWidth: isMobile ? '100%' : 140, width: isMobile ? '100%' : undefined }}>
          <option value="">All Locations</option>
          {rosterLocations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px,1fr))', gap: DESIGN_SYSTEM.spacing.md }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.lg, padding: DESIGN_SYSTEM.spacing.lg }}>
              <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 12, width: '50%' }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? '1fr' : "repeat(auto-fill, minmax(300px, 1fr))", gap: DESIGN_SYSTEM.spacing.md }}>
          {filtered.map(composer => (
            <div
              key={composer.id}
              onClick={() => onViewProfile(composer)}
              style={{
                background: DESIGN_SYSTEM.colors.bg.card,
                borderRadius: DESIGN_SYSTEM.radius.lg,
                padding: DESIGN_SYSTEM.spacing.lg,
                border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                cursor: "pointer",
                transition: `all ${DESIGN_SYSTEM.transition.normal}`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.accent;
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = DESIGN_SYSTEM.shadow.hover;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: DESIGN_SYSTEM.spacing.md, marginBottom: DESIGN_SYSTEM.spacing.md }}>
                <Avatar name={`${composer.first_name} ${composer.last_name}`} color={composer.avatar_color} avatarUrl={composer.avatar_url} size={56} />
                <div>
                  <div style={{
                    color: DESIGN_SYSTEM.colors.text.primary,
                    fontWeight: DESIGN_SYSTEM.fontWeight.bold,
                    fontSize: DESIGN_SYSTEM.fontSize.lg,
                    fontFamily: "'Outfit', sans-serif"
                  }}>{composer.first_name} {composer.last_name}</div>
                  {composer.location && <div style={{
                    color: DESIGN_SYSTEM.colors.text.muted,
                    fontSize: DESIGN_SYSTEM.fontSize.sm,
                    marginTop: '2px',
                  }}>{composer.location}</div>}
                </div>
              </div>
              {composer.bio && <p style={{
                color: DESIGN_SYSTEM.colors.text.tertiary,
                fontSize: DESIGN_SYSTEM.fontSize.sm,
                lineHeight: 1.6,
                marginBottom: DESIGN_SYSTEM.spacing.md,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}>{composer.bio}</p>}
              {composer.genres && composer.genres.length > 0 && (
                <div style={{ display: "flex", gap: DESIGN_SYSTEM.spacing.xs, flexWrap: "wrap", marginBottom: DESIGN_SYSTEM.spacing.sm }}>
                  {composer.genres.slice(0, 3).map(g => <Badge key={g} color={DESIGN_SYSTEM.colors.accent.purple}>{g}</Badge>)}
                </div>
              )}
              <span style={{
                color: DESIGN_SYSTEM.colors.brand.primary,
                fontSize: DESIGN_SYSTEM.fontSize.sm,
                fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>View Profile <ChevronRight size={14} /></span>
            </div>
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && <div style={{ textAlign: "center", color: DESIGN_SYSTEM.colors.text.muted, padding: 60, fontSize: 15 }}>No profiles found.</div>}
    </div>
  );
}
