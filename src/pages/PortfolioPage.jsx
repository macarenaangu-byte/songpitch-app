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
import { UploadProgressBar } from '../components/UploadProgressBar';
import { AILoadingGame } from '../components/AILoadingGame'; 

const MAX_FILE_SIZE = 50 * 1024 * 1024; 
const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/x-m4a', 'audio/x-wav', 'audio/webm'];

const uploadWithProgress = (file, storagePath, onProgress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return reject(new Error('Not authenticated'));

      const xhr = new XMLHttpRequest();
      const url = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/song-files/${storagePath}`;

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve({ error: null });
        else reject(new Error(`Upload failed with status ${xhr.status}`));
      });
      xhr.addEventListener('error', () => reject(new Error('Upload network error')));

      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', process.env.REACT_APP_SUPABASE_ANON_KEY);
      xhr.send(file);
    } catch (err) {
      reject(err);
    }
  });
};

export function PortfolioPage({ userProfile, audioPlayer, isMobile = false }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkStep, setBulkStep] = useState(null); 
  const [editingSong, setEditingSong] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null); 
  const [isDragging, setIsDragging] = useState(false);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(""); 
  
  const [confirmModal, setConfirmModal] = useState(null);
  const dragCounter = useRef(0);

  const { playingSong, isPlaying, play: playAudio } = audioPlayer;

  const songGenreOptions = GENRE_OPTIONS;
  const moodOptions = ['Uplifting', 'Melancholic', 'Energetic', 'Calm', 'Dark', 'Romantic', 'Epic', 'Playful', 'Aggressive', 'Dreamy', 'Nostalgic', 'Mysterious', 'Triumphant', 'Tense'];

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
  const ONE_STOP_LABEL = 'One-Stop (100% Master & Publishing)';
  const ADMIN_CO_OWNED_LABEL = 'Co-Owned (Multiple Rights Holders)';

  const handleLicensingStatusChange = (value) => {
    if (value === ONE_STOP_LABEL) {
      setConfirmModal({
        open: true,
        title: 'Legal Confirmation',
        message: 'By selecting One-Stop, you confirm you control 100% of both master and publishing rights for this track and can clear it quickly for sync. Proceed?',
        onConfirm: () => {
          setLicensingStatus(ONE_STOP_LABEL);
          setConfirmModal(null);
          showToast('One-Stop track confirmed. One-Stop tracks are prioritized in executive sync searches.', 'success');
        },
        onCancel: () => setConfirmModal(null),
      });
      return;
    }
    setLicensingStatus(value);
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
          setConfirmModal(null);
        },
        onCancel: () => setConfirmModal(null),
      });
      return;
    }
    updateBulkField(index, 'licensing_status', value);
    updateBulkField(index, 'is_one_stop', false);
  };

  const [, setBulkFiles] = useState([]);
  const [bulkData, setBulkData] = useState([]);

  const handleAudioFileChange = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !ACCEPTED_AUDIO_TYPES.includes(file.type)) {
      showToast('Invalid file type. Please upload an audio file.', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`, 'error');
      return;
    }
    setAudioFile(file);

    if (!title || title.trim() === '') {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }

    // 1. Show the game/loading screen instantly
    setAnalyzing(true);
    
    // 2. Pause for 100ms so the browser can paint the UI before the AI freezes it!
    setTimeout(async () => {
      try {
        const analysis = await analyzeAudioFile(file);
        if (analysis.duration) {
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
        // Hide the game when done
        setAnalyzing(false);
      }
    }, 100); 
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

    if (!genre || !String(genre).trim()) { showToast("Primary Genre is required.", "error"); return; }
    if (!bpm || Number.isNaN(parseInt(bpm, 10))) { showToast("BPM is required.", "error"); return; }
    if (!licensingStatus || !String(licensingStatus).trim()) { showToast("Licensing Status is required. Choose One-Stop or Co-Owned.", "error"); return; }

    setLoading(true);

    try {
      let audioUrl = null;

      if (audioFile) {
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${userProfile.id}/${Date.now()}.${fileExt}`;
        setUploadProgress({ progress: 0, fileName: audioFile.name });
        try {
          await uploadWithProgress(audioFile, fileName, (pct) => {
            setUploadProgress(prev => prev ? { ...prev, progress: pct } : null);
          });
        } catch (uploadErr) {
          throw uploadErr;
        }
        setUploadProgress(null);
        const { data: { publicUrl } } = supabase.storage.from('song-files').getPublicUrl(fileName);
        audioUrl = publicUrl;
      }

      const songTitle = title && title.trim() !== '' ? title : (audioFile ? audioFile.name.replace(/\.[^/.]+$/, '') : 'Untitled');
      const isOneStop = licensingStatus === ONE_STOP_LABEL;

      const songData = {
        composer_id: userProfile.id, title: songTitle, primary_genre: genre || null,
        secondary_genre: secondaryGenre || null, genre: genre || null, duration: duration || null,
        bpm: bpm ? parseInt(bpm) : null, key: key || null, mood: mood || null,
        mood_tags: mood ? [mood] : null, instrument_type: instrumentType || null,
        licensing_status: licensingStatus || null, is_one_stop: isOneStop,
        verification_status: isOneStop ? 'verified' : 'pending_splits', description: description || null,
        year: year || null, audio_url: audioUrl || (editingSong ? editingSong.audio_url : null)
      };

      if (editingSong) {
        const { error } = await supabase.from('songs').update(songData).eq('id', editingSong.id);
        if (error) throw error;
      } else {
        const { data: insertedSong, error } = await supabase.from('songs').insert([songData]).select('id').single();
        if (error) throw error;

        if (isOneStop && insertedSong?.id) {
          const composerName = `${userProfile.first_name} ${userProfile.last_name}`;
          await supabase.from('split_sheets').insert([{
            user_id: userProfile.id, song_id: insertedSong.id, song_title: songTitle,
            splits: { composition: [{ name: composerName, role: 'Songwriter/Composer', percentage: 100 }], master: [{ name: composerName, role: 'Owner', percentage: 100 }] },
            signature: composerName, attested: true, input_method: 'auto_one_stop'
          }]);
        }
      }

      resetForm();
      loadSongs();
      showToast(editingSong ? "Song updated!" : "Song added!", "success");
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setUploadProgress(null);
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
          const { error } = await supabase.from('songs').delete().eq('id', song.id);
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
    setEditingSong(song); setTitle(song.title); setGenre(song.primary_genre || song.genre || "");
    setSecondaryGenre(song.secondary_genre || ""); setDuration(song.duration || ""); setBpm(song.bpm || "");
    setInstrumentType(song.instrument_type || "");
    if (rawLicensingStatus.startsWith('One-Stop')) setLicensingStatus(ONE_STOP_LABEL);
    else if (rawLicensingStatus.startsWith('Admin/Co-Owned') || rawLicensingStatus.startsWith('Co-Owned')) setLicensingStatus(ADMIN_CO_OWNED_LABEL);
    else setLicensingStatus(rawLicensingStatus || "");
    setKey(song.key || ""); setMood(song.mood || ""); setDescription(song.description || ""); setYear(song.year || new Date().getFullYear());
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingSong(null); setTitle(""); setGenre(""); setSecondaryGenre(""); setDuration(""); setBpm("");
    setInstrumentType(""); setLicensingStatus(""); setKey(""); setMood(""); setDescription("");
    setYear(new Date().getFullYear()); setAudioFile(null); setShowForm(false);
  };

  const handleBulkFiles = async (e) => {
    const allFiles = Array.from(e.target.files);
    const files = allFiles.filter(f => f.type.startsWith('audio/') || ACCEPTED_AUDIO_TYPES.includes(f.type));
    const rejected = allFiles.length - files.length;
    if (rejected > 0) showToast(`${rejected} non-audio file${rejected > 1 ? 's' : ''} skipped.`, 'info');
    if (files.length === 0) { showToast('No valid audio files found.', 'error'); return; }
    setBulkFiles(files); setShowBulk(true);

    const processed = [];
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const duration = await getAudioDuration(file);
      let id3Title = file.name.replace(/\.(mp3|wav|m4a|flac|ogg)$/i, '');
      let id3Artist = '', id3Album = '', id3Year = new Date().getFullYear(), id3Genre = '', id3Bpm = '', id3Key = '';
      try {
        const metadata = await parseBlob(file);
        id3Title = metadata.common.title || id3Title; id3Artist = metadata.common.artist || ''; id3Album = metadata.common.album || '';
        id3Year = metadata.common.year || new Date().getFullYear(); id3Genre = metadata.common.genre?.[0] || '';
        id3Bpm = metadata.common.bpm ? Math.round(metadata.common.bpm).toString() : ''; id3Key = metadata.common.key || '';
      } catch (err) { console.warn(`ID3 read failed:`, err); }
      processed.push({ file, title: id3Title, artist: id3Artist, album: id3Album, duration: formatDuration(duration), genre: id3Genre, secondary_genre: '', bpm: id3Bpm, instrument_type: '', licensing_status: '', is_one_stop: false, key: id3Key, mood: '', description: '', year: id3Year, aiAnalyzed: false });
    }
    setBulkData(processed); setBulkStep('definition');
  };

  const getAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.addEventListener('loadedmetadata', () => { resolve(audio.duration); URL.revokeObjectURL(objectUrl); });
      audio.src = objectUrl;
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateBulkField = (index, field, value) => {
    setBulkData(prev => { const updated = [...prev]; updated[index][field] = value; return updated; });
  };

  const saveBulkSongs = async () => {
    const invalidRows = bulkData.map((item, idx) => {
        const missing = [];
        if (!item.licensing_status || !String(item.licensing_status).trim()) missing.push('Licensing Status');
        return missing.length ? { row: idx + 1, missing } : null;
      }).filter(Boolean);

    if (invalidRows.length > 0) {
      showToast(`Row ${invalidRows[0].row} is missing: ${invalidRows[0].missing.join(', ')}`, 'error'); return;
    }

    const analyzedData = bulkData.map(item => ({ ...item }));
    for (let idx = 0; idx < bulkData.length; idx++) {
      const item = bulkData[idx];
      setBulkAnalyzing(`Analyzing "${item.title}" (${idx + 1} of ${bulkData.length})...`);
      await new Promise(resolve => setTimeout(resolve, 100));
      try {
        const analysis = await analyzeAudioFile(item.file);
        analyzedData[idx].genre = analysis.genre || item.genre; analyzedData[idx].bpm = analysis.bpm ? Math.round(analysis.bpm).toString() : item.bpm;
        analyzedData[idx].key = analysis.key || item.key; analyzedData[idx].mood = analysis.mood || item.mood;
        analyzedData[idx].secondary_genre = analysis.secondaryGenre || item.secondary_genre;
        if (analysis.duration) analyzedData[idx].duration = formatDuration(Math.round(analysis.duration));
        analyzedData[idx].aiAnalyzed = true;
      } catch (err) { console.warn(`AI analysis failed:`, err); }
    }
    setBulkAnalyzing(''); setLoading(true);
    const totalFiles = analyzedData.length; setUploadProgress({ progress: 0, fileName: '', totalFiles, currentFile: 0 });
    try {
      for (let index = 0; index < analyzedData.length; index++) {
        const item = analyzedData[index];
        if (!item.file) continue;
        setUploadProgress({ progress: Math.round((index / totalFiles) * 100), fileName: item.file.name, totalFiles, currentFile: index + 1 });
        const fileExt = item.file.name.split('.').pop(); const fileName = `${userProfile.id}/${Date.now()}_${index}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('song-files').upload(fileName, item.file);
        if (uploadError) continue;
        const { data: urlData } = supabase.storage.from('song-files').getPublicUrl(fileName);
        const isOneStop = item.licensing_status === ONE_STOP_LABEL;
        const { data: insertedSong } = await supabase.from('songs').insert([{ composer_id: userProfile.id, title: item.title, primary_genre: item.genre || null, secondary_genre: item.secondary_genre || null, genre: item.genre || null, duration: item.duration || null, bpm: item.bpm ? parseInt(item.bpm) : null, instrument_type: item.instrument_type || null, licensing_status: item.licensing_status || null, is_one_stop: isOneStop, verification_status: isOneStop ? 'verified' : 'pending_splits', key: item.key || null, mood: item.mood || null, mood_tags: item.mood ? [item.mood] : null, description: item.description || null, year: item.year || null, audio_url: urlData.publicUrl }]).select('id').single();
        if (isOneStop && insertedSong?.id) {
          const composerName = `${userProfile.first_name} ${userProfile.last_name}`;
          await supabase.from('split_sheets').insert([{ user_id: userProfile.id, song_id: insertedSong.id, song_title: item.title, splits: { composition: [{ name: composerName, role: 'Songwriter/Composer', percentage: 100 }], master: [{ name: composerName, role: 'Owner', percentage: 100 }] }, signature: composerName, attested: true, input_method: 'auto_one_stop' }]);
        }
      }
      showToast(`${analyzedData.length} songs uploaded successfully!`, "success");
      setBulkData([]); setBulkFiles([]); setShowBulk(false); setBulkStep(null); loadSongs();
    } catch (err) { showToast(friendlyError(err), "error"); } finally { setUploadProgress(null); setLoading(false); setBulkAnalyzing(''); }
  };

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false); dragCounter.current = 0;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
    if (files.length === 0) { showToast("Please drop audio files only", "error"); return; }
    if (files.length === 1) {
      setAudioFile(files[0]); setTitle(files[0].name.replace(/\.[^/.]+$/, '')); setShowForm(true); handleAudioFileChange(files[0]); showToast("File loaded \u2014 fill in the details and save!", "info");
    } else { handleBulkFiles({ target: { files } }); }
  };

  return (
    <div style={{ padding: isMobile ? '16px' : "32px 36px", minHeight: "100%", overflowY: "auto", position: "relative" }} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
      {/* 🎮 THE MINIGAME RENDERS IMMEDIATELY 🎮 */}
      {(analyzing || bulkAnalyzing) && <AILoadingGame />}

      {isDragging && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(29,185,84,0.08)", border: `3px dashed ${DESIGN_SYSTEM.colors.brand.primary}`, borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, pointerEvents: "none" }}>
          <Upload size={48} color={DESIGN_SYSTEM.colors.brand.primary} />
          <div style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Drop audio files here</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: isMobile ? 'column' : 'row', justifyContent: "space-between", alignItems: isMobile ? 'flex-start' : "center", marginBottom: 24, gap: isMobile ? 12 : 0 }}>
        <div><h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: isMobile ? 24 : 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>My Portfolio</h1><p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginTop: 4 }}>Manage your music catalog</p></div>
        <div style={{ display: "flex", gap: 10, width: isMobile ? '100%' : 'auto' }}>
          <label style={{ background: DESIGN_SYSTEM.colors.accent.purple, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', sans-serif" }}>
            <Upload size={15} /> Bulk Upload<input type="file" multiple accept="audio/*" onChange={handleBulkFiles} style={{ display: "none" }} />
          </label>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', sans-serif" }}><Plus size={15} /> Add Song</button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 22, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{editingSong ? "Edit Song" : "Add New Song"}</h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={DESIGN_SYSTEM.colors.text.muted} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input type="text" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              <select value={genre} onChange={e => setGenre(e.target.value)} required style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: genre ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Primary Genre (required)...</option>{songGenreOptions.map(g => <option key={g} value={g}>{g}</option>)}</select>
              <input type="text" placeholder="Secondary Genre (optional)" value={secondaryGenre} onChange={e => setSecondaryGenre(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              <select value={instrumentType} onChange={e => setInstrumentType(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: instrumentType ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Instrument Type...</option><option value="Vocal">Vocal</option><option value="Instrumental">Instrumental</option></select>
              <input type="text" placeholder="Duration (e.g., 3:45)" value={duration} onChange={e => setDuration(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              <input type="number" placeholder="BPM (required)" min={20} max={300} required value={bpm} onChange={e => setBpm(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              <select value={key} onChange={e => setKey(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: key ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Select Key...</option>{['C Major', 'C Minor', 'C# Major', 'C# Minor', 'D Major', 'D Minor', 'Eb Major', 'Eb Minor', 'E Major', 'E Minor', 'F Major', 'F Minor', 'F# Major', 'F# Minor', 'G Major', 'G Minor', 'Ab Major', 'Ab Minor', 'A Major', 'A Minor', 'Bb Major', 'Bb Minor', 'B Major', 'B Minor'].map(k => <option key={k} value={k}>{k}</option>)}</select>
              <select value={mood} onChange={e => setMood(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: mood ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Select Mood...</option>{moodOptions.map(m => <option key={m} value={m}>{m}</option>)}</select>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Ownership Type (required)</label>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <button type="button" onClick={() => handleLicensingStatusChange(ONE_STOP_LABEL)} style={{ background: licensingStatus === ONE_STOP_LABEL ? `${DESIGN_SYSTEM.colors.brand.primary}18` : DESIGN_SYSTEM.colors.bg.primary, border: `2px solid ${licensingStatus === ONE_STOP_LABEL ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><Shield size={16} color={licensingStatus === ONE_STOP_LABEL ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.muted} /><span style={{ fontSize: 14, fontWeight: 700, color: licensingStatus === ONE_STOP_LABEL ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.primary, fontFamily: "'Outfit', sans-serif" }}>One-Stop (I Own 100%)</span></div>
                  <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.tertiary, fontFamily: "'Outfit', sans-serif" }}>Full master & publishing rights</div>
                </button>
                <button type="button" onClick={() => handleLicensingStatusChange(ADMIN_CO_OWNED_LABEL)} style={{ background: licensingStatus === ADMIN_CO_OWNED_LABEL ? `${DESIGN_SYSTEM.colors.accent.amber}18` : DESIGN_SYSTEM.colors.bg.primary, border: `2px solid ${licensingStatus === ADMIN_CO_OWNED_LABEL ? DESIGN_SYSTEM.colors.accent.amber : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><Users size={16} color={licensingStatus === ADMIN_CO_OWNED_LABEL ? DESIGN_SYSTEM.colors.accent.amber : DESIGN_SYSTEM.colors.text.muted} /><span style={{ fontSize: 14, fontWeight: 700, color: licensingStatus === ADMIN_CO_OWNED_LABEL ? DESIGN_SYSTEM.colors.accent.amber : DESIGN_SYSTEM.colors.text.primary, fontFamily: "'Outfit', sans-serif" }}>Co-Owned</span></div>
                  <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.tertiary, fontFamily: "'Outfit', sans-serif" }}>Multiple rights holders — verify splits later</div>
                </button>
              </div>
            </div>
            <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", resize: "none", marginBottom: 12, boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Audio File {editingSong && !audioFile && "(Optional - leave blank to keep existing)"}</label>
              <input type="file" accept="audio/*" onChange={e => handleAudioFileChange(e.target.files[0])} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              
              {audioFile && !analyzing && (
                <div style={{ color: DESIGN_SYSTEM.colors.accent.green, fontSize: 12, marginTop: 6 }}>\u2713 {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)</div>
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

      {showBulk && bulkData.length > 0 && bulkStep === 'definition' && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 28, border: `1px solid ${DESIGN_SYSTEM.colors.accent.purple}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div><h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>Batch Ownership &mdash; {bulkData.length} songs</h3><p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, margin: 0 }}>Before we review metadata, let's establish ownership for this batch.</p></div>
            <button onClick={() => { setShowBulk(false); setBulkData([]); setBulkStep(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={DESIGN_SYSTEM.colors.text.muted} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div onClick={() => { setConfirmModal({ open: true, title: 'Legal Confirmation', message: `By confirming One-Stop for all ${bulkData.length} tracks, you certify that you control 100% of both the Master recording and 100% of the Publishing rights for every song in this batch.`, onConfirm: () => { setConfirmModal(null); setBulkData(prev => prev.map(item => ({ ...item, licensing_status: ONE_STOP_LABEL, is_one_stop: true }))); setBulkStep('metadata'); showToast(`One-Stop confirmed for all ${bulkData.length} tracks`, "success"); }, onCancel: () => setConfirmModal(null), }); }} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 14, padding: 24, cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}><div style={{ width: 40, height: 40, borderRadius: 10, background: `${DESIGN_SYSTEM.colors.brand.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={20} color={DESIGN_SYSTEM.colors.brand.primary} /></div><span style={{ fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.brand.primary, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'Outfit', sans-serif" }}>One-Stop Ready</span></div>
              <h4 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 15, fontWeight: 700, margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>All songs have the same ownership</h4>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, margin: 0, lineHeight: 1.4 }}>I am the sole creator of all {bulkData.length} tracks and own 100% of master & publishing rights.</p>
            </div>
            <div onClick={() => { setBulkData(prev => prev.map(item => ({ ...item, licensing_status: ADMIN_CO_OWNED_LABEL, is_one_stop: false }))); setBulkStep('metadata'); showToast("Songs set to Co-Owned", "info"); }} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 14, padding: 24, cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}><div style={{ width: 40, height: 40, borderRadius: 10, background: `${DESIGN_SYSTEM.colors.accent.amber}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} color={DESIGN_SYSTEM.colors.accent.amber} /></div><span style={{ fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.accent.amber, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'Outfit', sans-serif" }}>Co-Owned</span></div>
              <h4 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 15, fontWeight: 700, margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>These songs have multiple rights holders</h4>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, margin: 0, lineHeight: 1.4 }}>Verify ownership splits in the Rights Verification Dashboard after upload.</p>
            </div>
          </div>
        </div>
      )}

      {showBulk && bulkData.length > 0 && bulkStep === 'metadata' && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 22, border: `1px solid ${DESIGN_SYSTEM.colors.accent.purple}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Review & Complete ({bulkData.length} songs)</h3>
            <button onClick={() => { setShowBulk(false); setBulkData([]); setBulkFiles([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={DESIGN_SYSTEM.colors.text.muted} /></button>
          </div>
          
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
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Ownership Type*</th>
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
                    <td style={{ padding: "10px" }}><select value={item.licensing_status || ''} onChange={e => handleBulkLicensingStatusChange(i, e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.licensing_status ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Required...</option><option value={ONE_STOP_LABEL}>One-Stop (100%)</option><option value={ADMIN_CO_OWNED_LABEL}>Co-Owned</option></select></td>
                    <td style={{ padding: "10px" }}><input value={item.key} onChange={e => updateBulkField(i, 'key', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }} /></td>
                    <td style={{ padding: "10px" }}><select value={item.mood} onChange={e => updateBulkField(i, 'mood', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.mood ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Mood...</option>{moodOptions.map(m => <option key={m} value={m}>{m}</option>)}</select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>One-Stop tracks are prioritized in executive searches for sync opportunities.</div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={saveBulkSongs} disabled={loading} style={{ background: DESIGN_SYSTEM.colors.accent.purple, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Uploading..." : `Upload All ${bulkData.length} Songs`}
            </button>
          </div>
        </div>
      )}

      {uploadProgress && <UploadProgressBar progress={uploadProgress.progress} fileName={uploadProgress.fileName} totalFiles={uploadProgress.totalFiles} currentFile={uploadProgress.currentFile} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && songs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{Array.from({ length: 4 }).map((_, i) => (<LoadingSongCard key={i} />))}</div>
        ) : songs.length === 0 ? (
          <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: "center" }}>
            <Music size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>Your portfolio is waiting</h3>
            <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Upload your first track and let the world hear your sound!</p>
          </div>
        ) : (
          songs.map(song => ( <SongCard key={song.id} song={song} isPlaying={playingSong?.id === song.id && isPlaying} onPlay={playAudio} showActions={true} onEdit={handleEdit} onDelete={handleDelete} hideComposerName isMobile={isMobile} /> ))
        )}
      </div>
      <ConfirmModal open={confirmModal?.open} title={confirmModal?.title} message={confirmModal?.message} onConfirm={confirmModal?.onConfirm} onCancel={() => setConfirmModal(null)} />
    </div>
  );
}