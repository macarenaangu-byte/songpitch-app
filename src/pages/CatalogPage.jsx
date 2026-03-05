import { useState, useEffect } from 'react';
import { Search, Music, X } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';
import { SongCard } from '../components/SongCard';

export function CatalogPage({ audioPlayer }) {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedMood, setSelectedMood] = useState("all");
  const [loading, setLoading] = useState(true);

  // Use shared audio player from parent
  const { playingSong, isPlaying, play: playAudio } = audioPlayer;

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select(`
          *,
          composer:user_profiles!songs_composer_id_fkey (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(song => ({
        ...song,
        composer_name: song.composer ? `${song.composer.first_name} ${song.composer.last_name}` : "Unknown"
      }));
      setSongs(formatted);
    } catch (err) {
      console.error("Error loading songs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced filtering with genre and mood
  const filtered = songs.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.composer_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.genre && s.genre.toLowerCase().includes(search.toLowerCase()));

    const matchesGenre = selectedGenre === "all" ||
      (s.genre && s.genre.toLowerCase() === selectedGenre.toLowerCase());

    const matchesMood = selectedMood === "all" ||
      (s.mood && s.mood.toLowerCase() === selectedMood.toLowerCase());

    return matchesSearch && matchesGenre && matchesMood;
  });

  // Get unique genres and moods from songs
  const genres = ["all", ...new Set(songs.map(s => s.genre).filter(Boolean))];
  const moods = ["all", ...new Set(songs.map(s => s.mood).filter(Boolean))];

  return (
    <div style={{ padding: "32px 36px", minHeight: "100%", overflowY: "auto" }}>
      <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>Search Catalog</h1>
      <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginBottom: 22 }}>Browse and discover music from talented composers</p>

      {/* Search Bar */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} color={DESIGN_SYSTEM.colors.text.muted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, artist, or genre..."
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
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Genre Filter */}
        <div style={{ flex: 1, minWidth: 200 }}>
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
            {genres.filter(g => g !== "all").map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* Mood Filter */}
        <div style={{ flex: 1, minWidth: 200 }}>
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
            {moods.filter(m => m !== "all").map(mood => (
              <option key={mood} value={mood}>{mood}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(selectedGenre !== "all" || selectedMood !== "all" || search !== "") && (
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={() => {
                setSelectedGenre("all");
                setSelectedMood("all");
                setSearch("");
              }}
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

      {/* Results count */}
      <div style={{
        color: DESIGN_SYSTEM.colors.text.muted,
        fontSize: 13,
        marginBottom: 16,
        fontWeight: 500
      }}>
        {filtered.length === songs.length
          ? `Showing all ${songs.length} songs`
          : `Found ${filtered.length} of ${songs.length} songs`}
      </div>

      {loading ? (
        <div style={{ color: DESIGN_SYSTEM.colors.text.muted, textAlign: "center", padding: 60 }}>Loading songs...</div>
      ) : filtered.length === 0 ? (
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
            {songs.length === 0
              ? "No songs have been uploaded yet. Be the first to share your music!"
              : "Try adjusting your filters or search terms"}
          </p>
          {(selectedGenre !== "all" || selectedMood !== "all" || search !== "") && (
            <button
              onClick={() => {
                setSelectedGenre("all");
                setSelectedMood("all");
                setSearch("");
              }}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(song => (
            <SongCard key={song.id} song={song} isPlaying={playingSong?.id === song.id && isPlaying} onPlay={playAudio} />
          ))}
        </div>
      )}
    </div>
  );
}
