import { useState, useEffect, useRef } from "react";
import { Music, Plus, Upload, X, Users, Shield } from "lucide-react";
import { parseBlob } from 'music-metadata';
import { analyzeAudioFile } from '../audioAnalyzer';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { GENRE_OPTIONS } from '../constants/genres';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { friendlyError } from '../lib/utils';
import { SongCard } from '../components/SongCard';
import { LoadingSongCard } from '../components/LoadingCards';
import { ConfirmModal } from '../components/ConfirmModal';

export function PortfolioPage({ userProfile, audioPlayer }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkStep, setBulkStep] = useState(null); // null | 'definition' | 'metadata'
  const [editingSong, setEditingSong] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(""); // e.g. "Analyzing song 2 of 5..."
  const [confirmModal, setConfirmModal] = useState(null);
  const dragCounter = useRef(0);

  // Use shared audio player from parent
  const { playingSong, isPlaying, play: playAudio } = audioPlayer;

  const songGenreOptions = GENRE_OPTIONS;
  const moodOptions = ['Uplifting', 'Melancholic', 'Energetic', 'Calm', 'Dark', 'Romantic', 'Epic', 'Playful', 'Aggressive', 'Dreamy', 'Nostalgic', 'Mysterious', 'Triumphant', 'Tense'];

  // Form state
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [duration, setDuration] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [mood, setMood] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [audioFile, setAudioFile] = useState(null);
  const [secondaryGenre, setSecondaryGenre] = useState("");
  const [instrumentType, setInstrumentType] = useState("");
  const [licensingStatus, setLicensingStatus] = useState("");
  const [ownershipPercentage, setOwnershipPercentage] = useState("");

  const ONE_STOP_LABEL = 'One-Stop (100% Master & Publishing)';
  const ADMIN_CO_OWNED_LABEL = 'Admin/Co-Owned';
  const PENDING_NEGOTIATION_LABEL = 'Pending/Negotiation';

  const handleLicensingStatusChange = (value) => {
    if (value === ONE_STOP_LABEL) {
      setConfirmModal({
        open: true,
        title: 'Legal Confirmation',
        message: 'By selecting One-Stop, you confirm you control 100% of both master and publishing rights for this track and can clear it quickly for sync. Proceed?',
        onConfirm: () => {
          setLicensingStatus(ONE_STOP_LABEL);
          setOwnershipPercentage('');
          setConfirmModal(null);
          showToast('One-Stop track confirmed. One-Stop tracks are prioritized in executive sync searches.', 'success');
        },
        onCancel: () => setConfirmModal(null),
      });
      return;
    }

    setLicensingStatus(value);
    if (value !== ADMIN_CO_OWNED_LABEL) setOwnershipPercentage('');
  };

  const handleBulkLicensingStatusChange = (index, value) => {
    if (value === ONE_STOP_LABEL) {
      setConfirmModal({
        open: true,
        title: 'Legal Confirmation',
        message: 'By selecting One-Stop, you confirm you control 100% of both master and publishing rights for this track and can clear it quickly for sync. Proceed?',
        onConfirm: () => {
          updateBulkField(index, 'licensing_status', ONE_STOP_LABEL);
          updateBulkField(index, 'is_one_stop', true);
          updateBulkField(index, 'ownership_percentage', '');
          setConfirmModal(null);
        },
        onCancel: () => setConfirmModal(null),
      });
      return;
    }

    updateBulkField(index, 'licensing_status', value);
    updateBulkField(index, 'is_one_stop', false);
    if (value !== ADMIN_CO_OWNED_LABEL) updateBulkField(index, 'ownership_percentage', '');
  };

  // Bulk upload state
  const [, setBulkFiles] = useState([]);
  const [bulkData, setBulkData] = useState([]);

  // Auto-analyze and fill fields when a file is selected
  const handleAudioFileChange = async (file) => {
    setAudioFile(file);
    if (!file) return;

    // Auto-fill title from filename (strip extension), only if title is empty
    if (!title || title.trim() === '') {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }

    setAnalyzing(true);
    try {
      const analysis = await analyzeAudioFile(file);
      if (analysis.duration) {
        // Format as M:SS (e.g., 3:42)
        const totalSec = Math.round(analysis.duration);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
      if (analysis.bpm) setBpm(Math.round(analysis.bpm));
      if (analysis.key) setKey(analysis.key);
      if (analysis.genre !== undefined && analysis.genre !== null) setGenre(analysis.genre);
      if (analysis.mood !== undefined && analysis.mood !== null) setMood(analysis.mood);
      if (analysis.secondaryGenre) setSecondaryGenre(analysis.secondaryGenre);
      if (analysis.lyrics) setDescription(analysis.lyrics);
    } catch (err) {
      console.error("Audio analysis failed:", err);
      showToast("Couldn't auto-analyze audio. You can fill in details manually.", "info");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('composer_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSongs(data || []);
    } catch (err) {
      console.error("Error loading songs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!genre || !String(genre).trim()) {
      showToast("Primary Genre is required.", "error");
      return;
    }
    if (!bpm || Number.isNaN(parseInt(bpm, 10))) {
      showToast("BPM is required.", "error");
      return;
    }
    if (!licensingStatus || !String(licensingStatus).trim()) {
      showToast("Licensing Status is required.", "error");
      return;
    }
    if (licensingStatus === ADMIN_CO_OWNED_LABEL && (!ownershipPercentage || Number.isNaN(parseInt(ownershipPercentage, 10)))) {
      showToast("Ownership Percentage is required for Admin/Co-Owned.", "error");
      return;
    }

    setLoading(true);

    try {
      let audioUrl = null;

      // Upload audio file if provided
      if (audioFile) {
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${userProfile.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('song-files')
          .upload(fileName, audioFile);
        if (uploadError) {
          throw uploadError;
        }
        // Get the Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('song-files')
          .getPublicUrl(fileName);
        audioUrl = publicUrl;
      }

      // Use manual title if provided, otherwise fallback to file name (without extension)
      const songTitle = title && title.trim() !== '' ? title : (audioFile ? audioFile.name.replace(/\.[^/.]+$/, '') : 'Untitled');
      const normalizedLicensingStatus = licensingStatus === ADMIN_CO_OWNED_LABEL
        ? `${ADMIN_CO_OWNED_LABEL} (${parseInt(ownershipPercentage, 10)}%)`
        : licensingStatus;

      const songData = {
        composer_id: userProfile.id,
        title: songTitle,
        primary_genre: genre || null,
        secondary_genre: secondaryGenre || null,
        genre: genre || null,
        duration: duration || null,
        bpm: bpm ? parseInt(bpm) : null,
        key: key || null,
        mood: mood || null,
        mood_tags: mood ? [mood] : null,
        instrument_type: instrumentType || null,
        licensing_status: normalizedLicensingStatus || null,
        is_one_stop: licensingStatus === ONE_STOP_LABEL,
        description: description || null,
        year: year || null,
        audio_url: audioUrl || (editingSong ? editingSong.audio_url : null)
      };

      if (editingSong) {
        const { error } = await supabase
          .from('songs')
          .update(songData)
          .eq('id', editingSong.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('songs')
          .insert([songData]);
        if (error) throw error;
      }

      resetForm();
      loadSongs();
      showToast(editingSong ? "Song updated!" : "Song added!", "success");
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (song) => {
    setConfirmModal({
      open: true,
      title: 'Delete Song',
      message: `Are you sure you want to delete "${song.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const { error } = await supabase
            .from('songs')
            .delete()
            .eq('id', song.id);

          if (error) throw error;
          loadSongs();
          showToast("Song deleted!", "success");
        } catch (err) {
          showToast(friendlyError(err), "error");
        }
      },
    });
  };

  const handleEdit = (song) => {
    const rawLicensingStatus = song.licensing_status || "";
    const ownershipMatch = rawLicensingStatus.match(/Admin\/Co-Owned\s*\((\d{1,3})%\)/i);

    setEditingSong(song);
    setTitle(song.title);
    setGenre(song.primary_genre || song.genre || "");
    setSecondaryGenre(song.secondary_genre || "");
    setDuration(song.duration || "");
    setBpm(song.bpm || "");
    setInstrumentType(song.instrument_type || "");
    if (rawLicensingStatus.startsWith('One-Stop')) {
      setLicensingStatus(ONE_STOP_LABEL);
    } else if (rawLicensingStatus.startsWith('Admin/Co-Owned')) {
      setLicensingStatus(ADMIN_CO_OWNED_LABEL);
    } else if (rawLicensingStatus.startsWith('Pending/Negotiation')) {
      setLicensingStatus(PENDING_NEGOTIATION_LABEL);
    } else {
      setLicensingStatus(rawLicensingStatus || "");
    }
    setOwnershipPercentage(ownershipMatch ? ownershipMatch[1] : "");
    setKey(song.key || "");
    setMood(song.mood || "");
    setDescription(song.description || "");
    setYear(song.year || new Date().getFullYear());
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingSong(null);
    setTitle("");
    setGenre("");
    setSecondaryGenre("");
    setDuration("");
    setBpm("");
    setInstrumentType("");
    setLicensingStatus("");
    setOwnershipPercentage("");
    setKey("");
    setMood("");
    setDescription("");
    setYear(new Date().getFullYear());
    setAudioFile(null);
    setShowForm(false);
  };

  const handleBulkFiles = async (e) => {
    const files = Array.from(e.target.files);
    setBulkFiles(files);
    setShowBulk(true);

    // Read ID3 metadata + duration quickly — AI analysis runs at upload time
    const processed = [];
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const duration = await getAudioDuration(file);
      let id3Title = file.name.replace(/\.(mp3|wav|m4a|flac|ogg)$/i, '');
      let id3Artist = '', id3Album = '', id3Year = new Date().getFullYear();
      let id3Genre = '', id3Bpm = '', id3Key = '';
      try {
        const metadata = await parseBlob(file);
        id3Title = metadata.common.title || id3Title;
        id3Artist = metadata.common.artist || '';
        id3Album = metadata.common.album || '';
        id3Year = metadata.common.year || new Date().getFullYear();
        id3Genre = metadata.common.genre?.[0] || '';
        id3Bpm = metadata.common.bpm ? Math.round(metadata.common.bpm).toString() : '';
        id3Key = metadata.common.key || '';
      } catch (err) {
        console.warn(`ID3 read failed for ${file.name}:`, err);
      }
      processed.push({
        file,
        title: id3Title,
        artist: id3Artist,
        album: id3Album,
        duration: formatDuration(duration),
        genre: id3Genre,
        secondary_genre: '',
        bpm: id3Bpm,
        instrument_type: '',
        licensing_status: '',
        ownership_percentage: '',
        is_one_stop: false,
        key: id3Key,
        mood: '',
        description: '',
        year: id3Year,
        aiAnalyzed: false,
      });
    }
    setBulkData(processed);
    setBulkStep('definition');
  };

  const getAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
        URL.revokeObjectURL(objectUrl);
      });
      audio.src = objectUrl;
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateBulkField = (index, field, value) => {
    setBulkData(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const saveBulkSongs = async () => {
    const invalidRows = bulkData
      .map((item, idx) => {
        const missing = [];
        if (!item.licensing_status || !String(item.licensing_status).trim()) missing.push('Licensing Status');
        if (item.licensing_status === ADMIN_CO_OWNED_LABEL && (!item.ownership_percentage || Number.isNaN(parseInt(item.ownership_percentage, 10)))) missing.push('Ownership %');
        return missing.length ? { row: idx + 1, missing } : null;
      })
      .filter(Boolean);

    if (invalidRows.length > 0) {
      const first = invalidRows[0];
      showToast(`Row ${first.row} is missing: ${first.missing.join(', ')}`, 'error');
      return;
    }

    // Phase 1: AI analysis — run sequentially so Essentia WASM doesn't crash
    const analyzedData = bulkData.map(item => ({ ...item }));
    for (let idx = 0; idx < bulkData.length; idx++) {
      const item = bulkData[idx];
      setBulkAnalyzing(`Analyzing "${item.title}" (${idx + 1} of ${bulkData.length})...`);
      try {
        const analysis = await analyzeAudioFile(item.file);
        analyzedData[idx].genre = analysis.genre || item.genre;
        analyzedData[idx].bpm = analysis.bpm ? Math.round(analysis.bpm).toString() : item.bpm;
        analyzedData[idx].key = analysis.key || item.key;
        analyzedData[idx].mood = analysis.mood || item.mood;
        analyzedData[idx].secondary_genre = analysis.secondaryGenre || item.secondary_genre;
        if (analysis.duration) {
          analyzedData[idx].duration = formatDuration(Math.round(analysis.duration));
        }
        analyzedData[idx].aiAnalyzed = true;
      } catch (err) {
        console.warn(`AI analysis failed for ${item.title}:`, err);
      }
    }
    setBulkAnalyzing('');

    // Phase 2: Upload to Supabase
    setLoading(true);
    try {
      for (let index = 0; index < analyzedData.length; index++) {
        const item = analyzedData[index];
        if (!item.file) continue;

        const fileExt = item.file.name.split('.').pop();
        const fileName = `${userProfile.id}/${Date.now()}_${index}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('song-files')
          .upload(fileName, item.file);

        if (uploadError) {
          console.error(`Error uploading ${item.file.name}:`, uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('song-files')
          .getPublicUrl(fileName);
        const audioUrl = urlData.publicUrl;

        const { error: insertError } = await supabase
          .from('songs')
          .insert([{
            composer_id: userProfile.id,
            title: item.title,
            primary_genre: item.genre || null,
            secondary_genre: item.secondary_genre || null,
            genre: item.genre || null,
            duration: item.duration || null,
            bpm: item.bpm ? parseInt(item.bpm) : null,
            instrument_type: item.instrument_type || null,
            licensing_status: item.licensing_status === ADMIN_CO_OWNED_LABEL
              ? `${ADMIN_CO_OWNED_LABEL} (${parseInt(item.ownership_percentage, 10)}%)`
              : (item.licensing_status || null),
            is_one_stop: item.licensing_status === ONE_STOP_LABEL,
            key: item.key || null,
            mood: item.mood || null,
            mood_tags: item.mood ? [item.mood] : null,
            description: item.description || null,
            year: item.year || null,
            audio_url: audioUrl,
          }]);

        if (insertError) {
          console.error(`Error inserting song row for ${item.title}:`, insertError);
        }
      }

      showToast(`${analyzedData.length} songs uploaded successfully!`, "success");
      setBulkData([]);
      setBulkFiles([]);
      setShowBulk(false);
      setBulkStep(null);
      loadSongs();
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setLoading(false);
      setBulkAnalyzing('');
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
    if (files.length === 0) {
      showToast("Please drop audio files only", "error");
      return;
    }

    if (files.length === 1) {
      // Single file — open the form with the file pre-loaded
      setAudioFile(files[0]);
      setTitle(files[0].name.replace(/\.[^/.]+$/, ''));
      setShowForm(true);
      try {
        const metadata = await parseBlob(files[0]);
        if (metadata.common.title) setTitle(metadata.common.title);
        if (metadata.common.genre?.[0]) setGenre(metadata.common.genre[0]);
        if (metadata.format.duration) {
          const mins = Math.floor(metadata.format.duration / 60);
          const secs = Math.floor(metadata.format.duration % 60);
          setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
        if (metadata.format.bitsPerSample) setBpm('');
      } catch (err) {
        // Metadata extraction failed, that's fine
      }
      showToast("File loaded \u2014 fill in the details and save!", "info");
    } else {
      // Multiple files — trigger bulk upload flow
      handleBulkFiles({ target: { files } });
    }
  };

  return (
    <div
      style={{ padding: "32px 36px", minHeight: "100%", overflowY: "auto", position: "relative" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(29,185,84,0.08)",
          border: `3px dashed ${DESIGN_SYSTEM.colors.brand.primary}`,
          borderRadius: 20,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
          pointerEvents: "none",
        }}>
          <Upload size={48} color={DESIGN_SYSTEM.colors.brand.primary} />
          <div style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
            Drop audio files here
          </div>
          <div style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14 }}>
            Drop one file for single upload, or multiple for bulk
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>My Portfolio</h1>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginTop: 4 }}>Manage your music catalog</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ background: DESIGN_SYSTEM.colors.accent.purple, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', sans-serif" }}>
            <Upload size={15} /> Bulk Upload
            <input type="file" multiple accept="audio/*" onChange={handleBulkFiles} style={{ display: "none" }} />
          </label>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', sans-serif" }}>
            <Plus size={15} /> Add Song
          </button>
        </div>
      </div>

      {/* Single Song Form */}
      {showForm && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 22, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{editingSong ? "Edit Song" : "Add New Song"}</h3>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input type="text" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              <select value={genre} onChange={e => setGenre(e.target.value)} required style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: genre ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Primary Genre (required)...</option>
                {songGenreOptions.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input type="text" placeholder="Secondary Genre (optional)" value={secondaryGenre} onChange={e => setSecondaryGenre(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              <select value={instrumentType} onChange={e => setInstrumentType(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: instrumentType ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Instrument Type...</option>
                <option value="Vocal">Vocal</option>
                <option value="Instrumental">Instrumental</option>
              </select>
              <input type="text" placeholder="Duration (e.g., 3:45)" value={duration} onChange={e => setDuration(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              <input type="number" placeholder="BPM (required)" min={20} max={300} required value={bpm} onChange={e => setBpm(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              <select value={key} onChange={e => setKey(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: key ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Select Key...</option>
                {['C Major', 'C Minor', 'C# Major', 'C# Minor', 'D Major', 'D Minor', 'Eb Major', 'Eb Minor', 'E Major', 'E Minor', 'F Major', 'F Minor', 'F# Major', 'F# Minor', 'G Major', 'G Minor', 'Ab Major', 'Ab Minor', 'A Major', 'A Minor', 'Bb Major', 'Bb Minor', 'B Major', 'B Minor'].map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <select value={mood} onChange={e => setMood(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: mood ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Select Mood...</option>
                {moodOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={licensingStatus} onChange={e => handleLicensingStatusChange(e.target.value)} required style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: licensingStatus ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Licensing Status (required)...</option>
                <option value={ONE_STOP_LABEL}>{ONE_STOP_LABEL}</option>
                <option value={ADMIN_CO_OWNED_LABEL}>{ADMIN_CO_OWNED_LABEL}</option>
                <option value={PENDING_NEGOTIATION_LABEL}>{PENDING_NEGOTIATION_LABEL}</option>
              </select>
              {licensingStatus === ADMIN_CO_OWNED_LABEL ? (
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="Ownership Percentage (e.g., 50)"
                  value={ownershipPercentage}
                  onChange={e => setOwnershipPercentage(e.target.value)}
                  required
                  style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}
                />
              ) : (
                <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px dashed ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
                  {licensingStatus === ONE_STOP_LABEL ? '\u2713 One-Stop confirmed for this track.' : 'Ownership % required only for Admin/Co-Owned.'}
                </div>
              )}
            </div>
            <div style={{ marginTop: -2, marginBottom: 12, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
              One-Stop tracks are prioritized in executive searches for sync opportunities.
            </div>
            <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", resize: "none", marginBottom: 12, boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Audio File {editingSong && !audioFile && "(Optional - leave blank to keep existing)"}</label>
              <input
                type="file"
                accept="audio/*"
                onChange={e => handleAudioFileChange(e.target.files[0])}
                style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}
              />
              {audioFile && !analyzing && (
                <div style={{ color: DESIGN_SYSTEM.colors.accent.green, fontSize: 12, marginTop: 6 }}>
                  \u2713 {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
              {analyzing && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "12px 16px", background: `${DESIGN_SYSTEM.colors.brand.primary}15`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40`, borderRadius: 10 }}>
                  <div style={{ width: 20, height: 20, border: `2.5px solid ${DESIGN_SYSTEM.colors.brand.primary}40`, borderTopColor: DESIGN_SYSTEM.colors.brand.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>AI is analyzing your song...</span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={loading || analyzing} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Saving..." : editingSong ? "Update Song" : "Add Song"}
              </button>
              <button type="button" onClick={resetForm} style={{ background: "transparent", color: DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Batch Definition Step */}
      {showBulk && bulkData.length > 0 && bulkStep === 'definition' && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 28, border: `1px solid ${DESIGN_SYSTEM.colors.accent.purple}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>Batch Ownership &mdash; {bulkData.length} songs</h3>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, margin: 0 }}>Before we review metadata, let's establish ownership for this batch.</p>
            </div>
            <button
              onClick={() => { setShowBulk(false); setBulkData([]); setBulkStep(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Close"
            >
              <X size={18} color={DESIGN_SYSTEM.colors.text.muted} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Option A: Same Ownership */}
            <div
              onClick={() => {
                setConfirmModal({
                  open: true,
                  title: 'Legal Confirmation',
                  message: `By confirming One-Stop for all ${bulkData.length} tracks, you certify that you control 100% of both the Master recording and 100% of the Publishing rights for every song in this batch. Misrepresenting ownership may result in account suspension.`,
                  onConfirm: () => {
                    setConfirmModal(null);
                    setBulkData(prev => prev.map(item => ({ ...item, licensing_status: ONE_STOP_LABEL, is_one_stop: true })));
                    setBulkStep('metadata');
                    showToast(`One-Stop confirmed for all ${bulkData.length} tracks`, "success");
                  },
                  onCancel: () => setConfirmModal(null),
                });
              }}
              style={{
                background: DESIGN_SYSTEM.colors.bg.primary,
                border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                borderRadius: 14,
                padding: 24,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.background = `${DESIGN_SYSTEM.colors.brand.primary}08`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.primary; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${DESIGN_SYSTEM.colors.brand.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} color={DESIGN_SYSTEM.colors.brand.primary} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.brand.primary, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'Outfit', sans-serif" }}>One-Stop Ready</span>
              </div>
              <h4 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 15, fontWeight: 700, margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>All songs have the same ownership</h4>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, margin: 0, lineHeight: 1.4 }}>I am the sole creator of all {bulkData.length} tracks and own 100% of master & publishing rights.</p>
              <div style={{ marginTop: 14, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                Prioritized in executive sync searches
              </div>
            </div>
            {/* Option B: Mixed Ownership */}
            <div
              onClick={() => {
                setBulkData(prev => prev.map(item => ({ ...item, licensing_status: PENDING_NEGOTIATION_LABEL, is_one_stop: false })));
                setBulkStep('metadata');
                showToast("Songs set to Pending \u2014 update licensing individually in the table or later from your portfolio", "info");
              }}
              style={{
                background: DESIGN_SYSTEM.colors.bg.primary,
                border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                borderRadius: 14,
                padding: 24,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.accent.amber; e.currentTarget.style.background = `${DESIGN_SYSTEM.colors.accent.amber}08`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.primary; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${DESIGN_SYSTEM.colors.accent.amber}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} color={DESIGN_SYSTEM.colors.accent.amber} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.accent.amber, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'Outfit', sans-serif" }}>Mixed / Pending</span>
              </div>
              <h4 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 15, fontWeight: 700, margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>These songs have different owners/splits</h4>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, margin: 0, lineHeight: 1.4 }}>I'll specify licensing details individually per track, either now or later.</p>
              <div style={{ marginTop: 14, color: DESIGN_SYSTEM.colors.accent.amber, fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                Tracks won't appear in One-Stop searches until updated
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Table */}
      {showBulk && bulkData.length > 0 && bulkStep === 'metadata' && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 22, border: `1px solid ${DESIGN_SYSTEM.colors.accent.purple}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Review & Complete ({bulkData.length} songs)</h3>
            <button
              onClick={() => { setShowBulk(false); setBulkData([]); setBulkFiles([]); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Close bulk upload"
              title="Close"
            >
              <X size={18} color={DESIGN_SYSTEM.colors.text.muted} />
            </button>
          </div>
          {bulkAnalyzing ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, border: `3px solid ${DESIGN_SYSTEM.colors.brand.primary}30`, borderTopColor: DESIGN_SYSTEM.colors.brand.primary, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 24px' }} />
              <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 10 }}>
                AI is analyzing your songs...
              </div>
              <div style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
                {bulkAnalyzing}
              </div>
              <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
                This might take a little bit — please don't close this window
              </div>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Title</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Duration</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Primary Genre</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Secondary Genre</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>BPM</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Instrument Type</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Licensing Status*</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Ownership %</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Key</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Mood</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkData.map((item, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                        <td style={{ padding: "10px" }}><input value={item.title} onChange={e => updateBulkField(i, 'title', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }} /></td>
                        <td style={{ padding: "10px", color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>{item.duration}</td>
                        <td style={{ padding: "10px" }}><select value={item.genre} onChange={e => updateBulkField(i, 'genre', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.genre ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Genre...</option>{songGenreOptions.map(g => <option key={g} value={g}>{g}</option>)}</select></td>
                        <td style={{ padding: "10px" }}><input value={item.secondary_genre || ''} onChange={e => updateBulkField(i, 'secondary_genre', e.target.value)} placeholder="Optional" style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }} /></td>
                        <td style={{ padding: "10px" }}><input value={item.bpm} onChange={e => updateBulkField(i, 'bpm', e.target.value)} type="number" style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }} /></td>
                        <td style={{ padding: "10px" }}><select value={item.instrument_type || ''} onChange={e => updateBulkField(i, 'instrument_type', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.instrument_type ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Type...</option><option value="Vocal">Vocal</option><option value="Instrumental">Instrumental</option></select></td>
                        <td style={{ padding: "10px" }}><select value={item.licensing_status || ''} onChange={e => handleBulkLicensingStatusChange(i, e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.licensing_status ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Required...</option><option value={ONE_STOP_LABEL}>{ONE_STOP_LABEL}</option><option value={ADMIN_CO_OWNED_LABEL}>{ADMIN_CO_OWNED_LABEL}</option><option value={PENDING_NEGOTIATION_LABEL}>{PENDING_NEGOTIATION_LABEL}</option></select></td>
                        <td style={{ padding: "10px" }}><input value={item.ownership_percentage || ''} onChange={e => updateBulkField(i, 'ownership_percentage', e.target.value)} type="number" min={1} max={100} placeholder={item.licensing_status === ADMIN_CO_OWNED_LABEL ? 'Required' : 'N/A'} disabled={item.licensing_status !== ADMIN_CO_OWNED_LABEL} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif", opacity: item.licensing_status !== ADMIN_CO_OWNED_LABEL ? 0.5 : 1 }} /></td>
                        <td style={{ padding: "10px" }}><input value={item.key} onChange={e => updateBulkField(i, 'key', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }} /></td>
                        <td style={{ padding: "10px" }}><select value={item.mood} onChange={e => updateBulkField(i, 'mood', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.mood ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Mood...</option>{moodOptions.map(m => <option key={m} value={m}>{m}</option>)}</select></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                One-Stop tracks are prioritized in executive searches for sync opportunities.
              </div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={saveBulkSongs} disabled={loading} style={{ background: DESIGN_SYSTEM.colors.accent.purple, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Uploading..." : `Upload All ${bulkData.length} Songs`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Songs List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && songs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (<LoadingSongCard key={i} />))}
            </div>
          ) : songs.length === 0 ? (
          <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: "center" }}>
            <Music size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>Your portfolio is waiting</h3>
            <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Upload your first track and let the world hear your sound!</p>
          </div>
        ) : (
          songs.map(song => (
            <SongCard
              key={song.id}
              song={song}
              isPlaying={playingSong?.id === song.id && isPlaying}
              onPlay={playAudio}
              showActions={true}
              onEdit={handleEdit}
              onDelete={handleDelete}
              hideComposerName
            />
          ))
        )}
      </div>
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
