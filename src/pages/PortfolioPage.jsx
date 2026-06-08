import { useState, useEffect, useRef } from "react";
import { Music, Plus, Upload, X, Users, Shield, LayoutGrid, List } from "lucide-react";
import { parseBlob } from 'music-metadata';
import { analyzeAudioFile } from '../audioAnalyzer';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { GENRE_OPTIONS } from '../constants/genres';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { friendlyError } from '../lib/utils';
import { SongCard } from '../components/SongCard';
import { SongGridSkeleton } from '../components/Skeleton';
import { ConfirmModal } from '../components/ConfirmModal';
import { UploadProgressBar } from '../components/UploadProgressBar';
import { AILoadingGame } from '../components/AILoadingGame';
import { useTier } from '../hooks/useTier';
import UpgradeModal from '../components/UpgradeModal';

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

export function PortfolioPage({ userProfile, audioPlayer, isMobile = false, onNavigate }) {
  const { withinLimit, upgradeMessage } = useTier(userProfile);
  const [upgradeModal, setUpgradeModal] = useState({ open: false, feature: '' });
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkStep, setBulkStep] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const isFirstUploadRef = useRef(false);
  
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [analyzing, setAnalyzing] = useState(false);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(""); 
  
  const [confirmModal, setConfirmModal] = useState(null);
  const dragCounter = useRef(0);

  const { playingSong, isPlaying, play: playAudio } = audioPlayer;

  const songGenreOptions = GENRE_OPTIONS;
  const moodOptions = ['Uplifting', 'Melancholic', 'Energetic', 'Calm', 'Dark', 'Romantic', 'Epic', 'Playful', 'Aggressive', 'Dreamy', 'Nostalgic', 'Mysterious', 'Triumphant', 'Tense'];

  // AI analysis badge helpers
  const aiBadge = (level) => ({
    fontSize: level === 'primary' ? 13 : level === 'secondary' ? 12 : 11,
    fontWeight: level === 'primary' ? 700 : 600,
    padding: level === 'primary' ? '5px 12px' : '4px 10px',
    borderRadius: 20,
    background: level === 'primary' ? `${DESIGN_SYSTEM.colors.brand.primary}18` : 'rgba(255,255,255,0.06)',
    border: `1px solid ${level === 'primary' ? DESIGN_SYSTEM.colors.brand.primary + '40' : 'rgba(255,255,255,0.12)'}`,
    color: level === 'primary' ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary,
  });
  const aiChip = {
    fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: DESIGN_SYSTEM.colors.text.secondary,
  };

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
  const [tertiaryGenre, setTertiaryGenre] = useState("");
  const [aiMoods, setAiMoods] = useState([]); // [{ mood, confidence }]
  const [aiVocals, setAiVocals] = useState(null);
  const [aiInstruments, setAiInstruments] = useState([]);
  const [aiUseCases, setAiUseCases] = useState([]);
  const [aiTempo, setAiTempo] = useState(null);
  const [aiTimeSignature, setAiTimeSignature] = useState(null);
  const [aiEnergy, setAiEnergy] = useState(null);
  const [aiLoudnessLufs, setAiLoudnessLufs] = useState(null);
  const [aiLoudnessNote, setAiLoudnessNote] = useState(null);
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
          showToast.success('One-Stop track confirmed. One-Stop tracks are prioritized in executive sync searches.');
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
      showToast.error('Invalid file type. Please upload an audio file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`);
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
      // 90-second timeout — Cloud Run may cold-start; give it time to warm up
      const timeoutId = setTimeout(() => {
        setAnalyzing(false);
        showToast.info("Analysis is taking too long. Fill in the details manually!");
      }, 90000);

      try {
        const analysis = await analyzeAudioFile(file);
        clearTimeout(timeoutId);
        if (analysis.tertiaryGenre)         setTertiaryGenre(analysis.tertiaryGenre);
        if (analysis.moods?.length)         setAiMoods(analysis.moods);
        if (analysis.vocals)                setAiVocals(analysis.vocals);
        if (analysis.instruments?.length)   setAiInstruments(analysis.instruments.slice(0, 3));
        if (analysis.useCases?.length)      setAiUseCases(analysis.useCases.slice(0, 4));
        if (analysis.tempo)                 setAiTempo(analysis.tempo);
        if (analysis.timeSignature)         setAiTimeSignature(analysis.timeSignature);
        if (analysis.energy != null)        setAiEnergy(analysis.energy);
        if (analysis.loudnessLufs != null)  setAiLoudnessLufs(analysis.loudnessLufs);
        if (analysis.loudnessNote)          setAiLoudnessNote(analysis.loudnessNote);

        if (analysis.duration) {
          const totalSec = Math.round(analysis.duration);
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
        if (analysis.bpm) setBpm(Math.round(analysis.bpm));
        if (analysis.key) setKey(analysis.key);
        if (analysis.genre && songGenreOptions.includes(analysis.genre)) setGenre(analysis.genre);
        if (analysis.mood !== undefined && analysis.mood !== null) setMood(analysis.mood);
        if (analysis.secondaryGenre) setSecondaryGenre(analysis.secondaryGenre);
        if (analysis.lyrics) setDescription(analysis.lyrics);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("Audio analysis failed:", err);
        showToast.info("Couldn't auto-analyze audio. You can fill in details manually.");
      } finally {
        setAnalyzing(false);
      }
    }, 100);
  };

  useEffect(() => {
    loadSongs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (!genre || !String(genre).trim()) { showToast.error("Primary Genre is required."); return; }
    if (!bpm || Number.isNaN(parseInt(bpm, 10))) { showToast.error("BPM is required."); return; }
    if (!licensingStatus || !String(licensingStatus).trim()) { showToast.error("Licensing Status is required. Choose One-Stop or Co-Owned."); return; }

    // ── Tier gate: upload limit ───────────────────────────────────────────────
    const uploadCheck = withinLimit('upload');
    if (!uploadCheck.allowed) {
      setUpgradeModal({ open: true, feature: upgradeMessage('upload') });
      return;
    }

    // Track if this is the first ever upload
    const onboardingKey = `cv_onboarding_${userProfile.id}`;
    if (songs.length === 0 && !localStorage.getItem(onboardingKey)) {
      isFirstUploadRef.current = true;
    }

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
        mood_tags: aiMoods.length > 0 ? aiMoods.map(m => m.mood) : (mood ? [mood] : null),
        instrument_type: instrumentType || null,
        licensing_status: licensingStatus || null, is_one_stop: isOneStop,
        verification_status: isOneStop ? 'verified' : 'pending_splits', description: description || null,
        year: year || null, audio_url: audioUrl || (editingSong ? editingSong.audio_url : null),
        // New AI metadata fields
        tertiary_genre: tertiaryGenre || null,
        vocals: aiVocals || null,
        use_cases: aiUseCases.length > 0 ? aiUseCases : null,
        instruments: aiInstruments.length > 0 ? aiInstruments.map(i => i.instrument) : null,
        tempo: aiTempo || null,
        time_signature: aiTimeSignature || null,
        energy: aiEnergy != null ? aiEnergy : null,
        loudness_lufs: aiLoudnessLufs != null ? aiLoudnessLufs : null,
        loudness_note: aiLoudnessNote || null
      };

      if (editingSong) {
        const { error } = await supabase.from('songs').update(songData).eq('id', editingSong.id);
        if (error) throw error;
      } else {
        const { data: insertedSong, error } = await supabase.from('songs').insert([songData]).select('id').single();
        if (error) throw error;

        if (isOneStop && insertedSong?.id) {
          // Only auto-create if no split sheet exists yet for this song
          const { count } = await supabase
            .from('split_sheets')
            .select('id', { count: 'exact', head: true })
            .eq('song_id', insertedSong.id);
          if (!count || count === 0) {
            const composerName = `${userProfile.first_name} ${userProfile.last_name}`;
            await supabase.from('split_sheets').insert([{
              user_id: userProfile.id, song_id: insertedSong.id, song_title: songTitle,
              splits: { composition: [{ name: composerName, role: 'Songwriter/Composer', percentage: 100 }], master: [{ name: composerName, role: 'Owner', percentage: 100 }] },
              signature: composerName, attested: true, input_method: 'auto_one_stop'
            }]);
          }
        }
      }

      resetForm();
      loadSongs();
      showToast.success(editingSong ? "Song updated!" : "Song added!");
      if (!editingSong) {
        await supabase.rpc('increment_usage', { p_user_id: userProfile.id, p_action: 'upload' });
        if (isFirstUploadRef.current) {
          isFirstUploadRef.current = false;
          localStorage.setItem(`cv_onboarding_${userProfile.id}`, '1');
          setTimeout(() => setShowOnboarding(true), 600);
        }
      }
    } catch (err) {
      showToast.error(friendlyError(err));
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
          showToast.success("Song deleted!");
        } catch (err) {
          showToast.error(friendlyError(err));
        }
      },
    });
  };

  const handleEdit = (song) => {
    const rawLicensingStatus = song.licensing_status || "";
    setEditingSong(song); setTitle(song.title); setGenre(song.primary_genre || song.genre || "");
    setSecondaryGenre(song.secondary_genre || ""); setTertiaryGenre(song.tertiary_genre || "");
    setDuration(song.duration || ""); setBpm(song.bpm || "");
    setInstrumentType(song.instrument_type || "");
    setAiVocals(song.vocals || null);
    setAiUseCases(song.use_cases || []);
    setAiInstruments((song.instruments || []).map(i => ({ instrument: i, confidence: 1 })));
    setAiTempo(song.tempo || null);
    setAiTimeSignature(song.time_signature || null);
    setAiEnergy(song.energy ?? null);
    setAiLoudnessLufs(song.loudness_lufs ?? null);
    setAiLoudnessNote(song.loudness_note || null);
    setAiMoods((song.mood_tags || []).map(m => ({ mood: m, confidence: 1 })));
    if (rawLicensingStatus.startsWith('One-Stop')) setLicensingStatus(ONE_STOP_LABEL);
    else if (rawLicensingStatus.startsWith('Admin/Co-Owned') || rawLicensingStatus.startsWith('Co-Owned')) setLicensingStatus(ADMIN_CO_OWNED_LABEL);
    else setLicensingStatus(rawLicensingStatus || "");
    setKey(song.key || ""); setMood(song.mood || ""); setDescription(song.description || ""); setYear(song.year || new Date().getFullYear());
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingSong(null); setTitle(""); setGenre(""); setSecondaryGenre(""); setTertiaryGenre(""); setDuration(""); setBpm("");
    setInstrumentType(""); setLicensingStatus(""); setKey(""); setMood(""); setDescription("");
    setAiMoods([]); setAiVocals(null); setAiInstruments([]); setAiUseCases([]);
    setAiTempo(null); setAiTimeSignature(null); setAiEnergy(null); setAiLoudnessLufs(null); setAiLoudnessNote(null);
    setYear(new Date().getFullYear()); setAudioFile(null); setShowForm(false);
  };

  const handleBulkFiles = async (e) => {
    const allFiles = Array.from(e.target.files);
    const files = allFiles.filter(f => f.type.startsWith('audio/') || ACCEPTED_AUDIO_TYPES.includes(f.type));
    const rejected = allFiles.length - files.length;
    if (rejected > 0) showToast.info(`${rejected} non-audio file${rejected > 1 ? 's' : ''} skipped.`);
    if (files.length === 0) { showToast.error('No valid audio files found.'); return; }
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
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.addEventListener('loadedmetadata', () => { resolve(audio.duration); URL.revokeObjectURL(objectUrl); });
      audio.addEventListener('error', () => { URL.revokeObjectURL(objectUrl); reject(new Error('Audio load failed')); });
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
      showToast.error(`Row ${invalidRows[0].row} is missing: ${invalidRows[0].missing.join(', ')}`); return;
    }

    const onboardingKey = `cv_onboarding_${userProfile.id}`;
    if (songs.length === 0 && !localStorage.getItem(onboardingKey)) {
      isFirstUploadRef.current = true;
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
        const { data: insertedSong, error: insertError } = await supabase.from('songs').insert([{ composer_id: userProfile.id, title: item.title, primary_genre: item.genre || null, secondary_genre: item.secondary_genre || null, genre: item.genre || null, duration: item.duration || null, bpm: item.bpm ? parseInt(item.bpm) : null, instrument_type: item.instrument_type || null, licensing_status: item.licensing_status || null, is_one_stop: isOneStop, verification_status: isOneStop ? 'verified' : 'pending_splits', key: item.key || null, mood: item.mood || null, mood_tags: item.mood ? [item.mood] : null, description: item.description || null, year: item.year || null, audio_url: urlData.publicUrl }]).select('id').single();
        if (insertError) { console.error(`Insert failed for "${item.title}":`, insertError); continue; }
        if (isOneStop && insertedSong?.id) {
          const { count: ssCount } = await supabase
            .from('split_sheets').select('id', { count: 'exact', head: true }).eq('song_id', insertedSong.id);
          if (!ssCount || ssCount === 0) {
            const composerName = `${userProfile.first_name} ${userProfile.last_name}`;
            await supabase.from('split_sheets').insert([{ user_id: userProfile.id, song_id: insertedSong.id, song_title: item.title, splits: { composition: [{ name: composerName, role: 'Songwriter/Composer', percentage: 100 }], master: [{ name: composerName, role: 'Owner', percentage: 100 }] }, signature: composerName, attested: true, input_method: 'auto_one_stop' }]);
          }
        }
      }
      showToast.success(`${analyzedData.length} songs uploaded successfully!`);
      setBulkData([]); setBulkFiles([]); setShowBulk(false); setBulkStep(null); loadSongs();
      if (isFirstUploadRef.current) {
        isFirstUploadRef.current = false;
        localStorage.setItem(`cv_onboarding_${userProfile.id}`, '1');
        setTimeout(() => setShowOnboarding(true), 600);
      }
    } catch (err) { showToast.error(friendlyError(err)); } finally { setUploadProgress(null); setLoading(false); setBulkAnalyzing(''); }
  };

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false); dragCounter.current = 0;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
    if (files.length === 0) { showToast.error("Please drop audio files only"); return; }
    if (files.length === 1) {
      setAudioFile(files[0]); setTitle(files[0].name.replace(/\.[^/.]+$/, '')); setShowForm(true); handleAudioFileChange(files[0]); showToast.info("File loaded \u2014 fill in the details and save!");
    } else { handleBulkFiles({ target: { files } }); }
  };

  return (
    <div className="page-enter" style={{ padding: isMobile ? '16px' : "32px 36px", minHeight: "100%", overflowY: "auto", position: "relative" }} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>

      {/* Upgrade modal */}
      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, feature: '' })}
        feature={upgradeModal.feature}
        userProfile={userProfile}
        defaultTier="basic"
      />

      {/* 🎮 THE MINIGAME RENDERS IMMEDIATELY 🎮 */}
      {(analyzing || bulkAnalyzing) && <AILoadingGame />}

      {isDragging && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(201,168,76,0.08)", border: `3px dashed ${DESIGN_SYSTEM.colors.brand.primary}`, borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, pointerEvents: "none" }}>
          <Upload size={48} color={DESIGN_SYSTEM.colors.brand.primary} />
          <div style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Drop audio files here</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: isMobile ? 'column' : 'row', justifyContent: "space-between", alignItems: isMobile ? 'flex-start' : "center", marginBottom: 24, gap: isMobile ? 12 : 0 }}>
        <div><h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: isMobile ? 24 : 28, fontWeight: 800, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>My Portfolio</h1><p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginTop: 4 }}>Manage your music catalog</p></div>
        <div style={{ display: "flex", gap: 10, width: isMobile ? '100%' : 'auto', alignItems: 'center' }}>
          {/* View toggle */}
          {songs.length > 0 && !isMobile && (
            <div style={{ display: 'flex', background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: 3, gap: 2 }}>
              {[{ mode: 'list', icon: <List size={15} /> }, { mode: 'grid', icon: <LayoutGrid size={15} /> }].map(({ mode, icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{ background: viewMode === mode ? DESIGN_SYSTEM.colors.brand.primary + '22' : 'transparent', border: viewMode === mode ? `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40` : '1px solid transparent', borderRadius: 5, color: viewMode === mode ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.muted, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s ease' }}>{icon}</button>
              ))}
            </div>
          )}
          <label style={{ background: DESIGN_SYSTEM.colors.accent.purple, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <Upload size={15} /> Bulk Upload<input type="file" multiple accept="audio/*" onChange={handleBulkFiles} style={{ display: "none" }} />
          </label>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}><Plus size={15} /> Add Song</button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 22, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>{editingSong ? "Edit Song" : "Add New Song"}</h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={DESIGN_SYSTEM.colors.text.muted} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input type="text" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} />
              <select value={genre} onChange={e => setGenre(e.target.value)} required style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: genre ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}><option value="">Primary Genre (required)...</option>{songGenreOptions.map(g => <option key={g} value={g}>{g}</option>)}</select>
              <input type="text" placeholder="Secondary Genre (optional)" value={secondaryGenre} onChange={e => setSecondaryGenre(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} />
              <input type="text" placeholder="Tertiary Genre (optional)" value={tertiaryGenre} onChange={e => setTertiaryGenre(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} />
              <select value={instrumentType} onChange={e => setInstrumentType(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: instrumentType ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}><option value="">Instrument Type...</option><option value="Vocal">Vocal</option><option value="Instrumental">Instrumental</option></select>
              <select value={aiVocals || ''} onChange={e => setAiVocals(e.target.value || null)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: aiVocals ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                <option value="">Vocals...</option>
                {['Instrumental', 'Vocals', 'Choir', 'Rap', 'Spoken Word'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <input type="text" placeholder="Duration (e.g., 3:45)" value={duration} onChange={e => setDuration(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} />
              <input type="number" placeholder="BPM (required)" min={20} max={300} required value={bpm} onChange={e => setBpm(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} />
              <select value={key} onChange={e => setKey(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: key ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}><option value="">Select Key...</option>{['C Major', 'C Minor', 'C# Major', 'C# Minor', 'D Major', 'D Minor', 'Eb Major', 'Eb Minor', 'E Major', 'E Minor', 'F Major', 'F Minor', 'F# Major', 'F# Minor', 'G Major', 'G Minor', 'Ab Major', 'Ab Minor', 'A Major', 'A Minor', 'Bb Major', 'Bb Minor', 'B Major', 'B Minor'].map(k => <option key={k} value={k}>{k}</option>)}</select>
              <select value={mood} onChange={e => setMood(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: mood ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}><option value="">Select Mood...</option>{moodOptions.map(m => <option key={m} value={m}>{m}</option>)}</select>
              <select value={aiTimeSignature || ''} onChange={e => setAiTimeSignature(e.target.value || null)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: aiTimeSignature ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                <option value="">Time Signature...</option>
                {['4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px" }}>
                <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, whiteSpace: 'nowrap' }}>Energy</span>
                <input type="range" min={1} max={10} value={aiEnergy ?? 5} onChange={e => setAiEnergy(parseInt(e.target.value))} style={{ flex: 1, accentColor: DESIGN_SYSTEM.colors.brand.primary }} />
                <span style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontWeight: 700, fontSize: 13, minWidth: 20 }}>{aiEnergy ?? '—'}</span>
              </div>
            </div>
            
            {/* Use Cases — editable tag chips */}
            {aiUseCases.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>Use Cases</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {aiUseCases.map((uc, i) => (
                    <button key={i} type="button" onClick={() => setAiUseCases(prev => prev.filter((_, j) => j !== i))} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${DESIGN_SYSTEM.colors.brand.primary}12`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}30`, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, cursor: 'pointer' }}>
                      {uc} <X size={10} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Instruments — editable tag chips */}
            {aiInstruments.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 }}>Detected Instruments</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {aiInstruments.map((inst, i) => (
                    <button key={i} type="button" onClick={() => setAiInstruments(prev => prev.filter((_, j) => j !== i))} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, cursor: 'pointer' }}>
                      {inst.instrument} <X size={10} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis Preview — shown after audio is analyzed */}
            {(aiMoods.length > 0 || aiVocals || aiInstruments.length > 0 || aiUseCases.length > 0 || aiTempo || aiTimeSignature || aiEnergy != null || aiLoudnessLufs != null || tertiaryGenre) && (
              <div style={{ background: `${DESIGN_SYSTEM.colors.brand.primary}08`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}25`, borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: DESIGN_SYSTEM.colors.brand.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>✨ AI Analysis</div>

                {/* Genres row */}
                {(secondaryGenre || tertiaryGenre) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {genre && <span style={aiBadge('primary')}>{genre}</span>}
                    {secondaryGenre && <span style={aiBadge('secondary')}>{secondaryGenre}</span>}
                    {tertiaryGenre && <span style={aiBadge('tertiary')}>{tertiaryGenre}</span>}
                  </div>
                )}

                {/* Moods row — sized by confidence */}
                {aiMoods.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {aiMoods.slice(0, 3).map((m, i) => (
                      <span key={i} style={{
                        background: `rgba(139,92,246,${0.18 - i * 0.04})`,
                        border: `1px solid rgba(139,92,246,${0.4 - i * 0.1})`,
                        color: `rgba(196,181,253,${1 - i * 0.2})`,
                        fontSize: 13 - i,
                        fontWeight: i === 0 ? 700 : 600,
                        padding: `${5 - i}px ${12 - i * 2}px`,
                        borderRadius: 20,
                      }}>{m.mood}</span>
                    ))}
                  </div>
                )}

                {/* Musical metadata row */}
                {(aiTempo || aiTimeSignature || aiEnergy != null) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {aiTempo && <span style={aiChip}>{aiTempo}</span>}
                    {aiTimeSignature && <span style={aiChip}>{aiTimeSignature}</span>}
                    {aiEnergy != null && <span style={aiChip}>Energy {aiEnergy}/10</span>}
                  </div>
                )}

                {/* Vocals + Loudness */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: aiInstruments.length > 0 || aiUseCases.length > 0 ? 10 : 0 }}>
                  {aiVocals && (
                    <span style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
                      {aiVocals}
                    </span>
                  )}
                  {aiLoudnessLufs != null && (
                    <span style={aiChip}>
                      {aiLoudnessLufs.toFixed(1)} LUFS{aiLoudnessNote ? ` · ${aiLoudnessNote}` : ''}
                    </span>
                  )}
                </div>

                {/* Instruments */}
                {aiInstruments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: aiUseCases.length > 0 ? 10 : 0 }}>
                    {aiInstruments.map((inst, i) => (
                      <span key={i} style={aiChip}>{inst.instrument}</span>
                    ))}
                  </div>
                )}

                {/* Use cases */}
                {aiUseCases.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {aiUseCases.map((uc, i) => (
                      <span key={i} style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>{uc}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Ownership Type (required)</label>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <button type="button" onClick={() => handleLicensingStatusChange(ONE_STOP_LABEL)} style={{ background: licensingStatus === ONE_STOP_LABEL ? `${DESIGN_SYSTEM.colors.brand.primary}18` : DESIGN_SYSTEM.colors.bg.primary, border: `2px solid ${licensingStatus === ONE_STOP_LABEL ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><Shield size={16} color={licensingStatus === ONE_STOP_LABEL ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.muted} /><span style={{ fontSize: 14, fontWeight: 700, color: licensingStatus === ONE_STOP_LABEL ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.primary, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>One-Stop (I Own 100%)</span></div>
                  <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.tertiary, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Full master & publishing rights</div>
                </button>
                <button type="button" onClick={() => handleLicensingStatusChange(ADMIN_CO_OWNED_LABEL)} style={{ background: licensingStatus === ADMIN_CO_OWNED_LABEL ? `${DESIGN_SYSTEM.colors.accent.amber}18` : DESIGN_SYSTEM.colors.bg.primary, border: `2px solid ${licensingStatus === ADMIN_CO_OWNED_LABEL ? DESIGN_SYSTEM.colors.accent.amber : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><Users size={16} color={licensingStatus === ADMIN_CO_OWNED_LABEL ? DESIGN_SYSTEM.colors.accent.amber : DESIGN_SYSTEM.colors.text.muted} /><span style={{ fontSize: 14, fontWeight: 700, color: licensingStatus === ADMIN_CO_OWNED_LABEL ? DESIGN_SYSTEM.colors.accent.amber : DESIGN_SYSTEM.colors.text.primary, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Co-Owned</span></div>
                  <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.tertiary, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Multiple rights holders — verify splits later</div>
                </button>
              </div>
            </div>
            <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", resize: "none", marginBottom: 12, boxSizing: "border-box", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} />
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Audio File {editingSong && !audioFile && "(Optional - leave blank to keep existing)"}</label>
              <input type="file" accept="audio/*" onChange={e => handleAudioFileChange(e.target.files[0])} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} />
              
              {audioFile && !analyzing && (
                <div style={{ color: DESIGN_SYSTEM.colors.accent.green, fontSize: 12, marginTop: 6 }}>\u2713 {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)</div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={loading || analyzing} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Saving..." : editingSong ? "Update Song" : "Add Song"}
              </button>
              <button type="button" onClick={resetForm} style={{ background: "transparent", color: DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showBulk && bulkData.length > 0 && bulkStep === 'definition' && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 28, border: `1px solid ${DESIGN_SYSTEM.colors.accent.purple}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div><h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", marginBottom: 4 }}>Batch Ownership &mdash; {bulkData.length} songs</h3><p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, margin: 0 }}>Before we review metadata, let's establish ownership for this batch.</p></div>
            <button onClick={() => { setShowBulk(false); setBulkData([]); setBulkStep(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={DESIGN_SYSTEM.colors.text.muted} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div onClick={() => { setConfirmModal({ open: true, title: 'Legal Confirmation', message: `By confirming One-Stop for all ${bulkData.length} tracks, you certify that you control 100% of both the Master recording and 100% of the Publishing rights for every song in this batch.`, onConfirm: () => { setConfirmModal(null); setBulkData(prev => prev.map(item => ({ ...item, licensing_status: ONE_STOP_LABEL, is_one_stop: true }))); setBulkStep('metadata'); showToast.success(`One-Stop confirmed for all ${bulkData.length} tracks`); }, onCancel: () => setConfirmModal(null), }); }} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 14, padding: 24, cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}><div style={{ width: 40, height: 40, borderRadius: 10, background: `${DESIGN_SYSTEM.colors.brand.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={20} color={DESIGN_SYSTEM.colors.brand.primary} /></div><span style={{ fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.brand.primary, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>One-Stop Ready</span></div>
              <h4 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 15, fontWeight: 700, margin: '0 0 6px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>All songs have the same ownership</h4>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, margin: 0, lineHeight: 1.4 }}>I am the sole creator of all {bulkData.length} tracks and own 100% of master & publishing rights.</p>
            </div>
            <div onClick={() => { setBulkData(prev => prev.map(item => ({ ...item, licensing_status: ADMIN_CO_OWNED_LABEL, is_one_stop: false }))); setBulkStep('metadata'); showToast.info("Songs set to Co-Owned"); }} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 14, padding: 24, cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}><div style={{ width: 40, height: 40, borderRadius: 10, background: `${DESIGN_SYSTEM.colors.accent.amber}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} color={DESIGN_SYSTEM.colors.accent.amber} /></div><span style={{ fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.accent.amber, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Co-Owned</span></div>
              <h4 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 15, fontWeight: 700, margin: '0 0 6px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>These songs have multiple rights holders</h4>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, margin: 0, lineHeight: 1.4 }}>Verify ownership splits in the Rights Verification Dashboard after upload.</p>
            </div>
          </div>
        </div>
      )}

      {showBulk && bulkData.length > 0 && bulkStep === 'metadata' && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 22, border: `1px solid ${DESIGN_SYSTEM.colors.accent.purple}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Review & Complete ({bulkData.length} songs)</h3>
            <button onClick={() => { setShowBulk(false); setBulkData([]); setBulkFiles([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color={DESIGN_SYSTEM.colors.text.muted} /></button>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Title</th>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Duration</th>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Primary Genre</th>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Secondary Genre</th>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>BPM</th>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Instrument Type</th>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Ownership Type*</th>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Key</th>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>Mood</th>
                </tr>
              </thead>
              <tbody>
                {bulkData.map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                    <td style={{ padding: "10px" }}><input value={item.title} onChange={e => updateBulkField(i, 'title', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} /></td>
                    <td style={{ padding: "10px", color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>{item.duration}</td>
                    <td style={{ padding: "10px" }}><select value={item.genre} onChange={e => updateBulkField(i, 'genre', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.genre ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}><option value="">Genre...</option>{songGenreOptions.map(g => <option key={g} value={g}>{g}</option>)}</select></td>
                    <td style={{ padding: "10px" }}><input value={item.secondary_genre || ''} onChange={e => updateBulkField(i, 'secondary_genre', e.target.value)} placeholder="Optional" style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} /></td>
                    <td style={{ padding: "10px" }}><input value={item.bpm} onChange={e => updateBulkField(i, 'bpm', e.target.value)} type="number" style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} /></td>
                    <td style={{ padding: "10px" }}><select value={item.instrument_type || ''} onChange={e => updateBulkField(i, 'instrument_type', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.instrument_type ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}><option value="">Type...</option><option value="Vocal">Vocal</option><option value="Instrumental">Instrumental</option></select></td>
                    <td style={{ padding: "10px" }}><select value={item.licensing_status || ''} onChange={e => handleBulkLicensingStatusChange(i, e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.licensing_status ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}><option value="">Required...</option><option value={ONE_STOP_LABEL}>One-Stop (100%)</option><option value={ADMIN_CO_OWNED_LABEL}>Co-Owned</option></select></td>
                    <td style={{ padding: "10px" }}><input value={item.key} onChange={e => updateBulkField(i, 'key', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} /></td>
                    <td style={{ padding: "10px" }}><select value={item.mood} onChange={e => updateBulkField(i, 'mood', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.mood ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}><option value="">Mood...</option>{moodOptions.map(m => <option key={m} value={m}>{m}</option>)}</select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 12, fontWeight: 600, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>One-Stop tracks are prioritized in executive searches for sync opportunities.</div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={saveBulkSongs} disabled={loading} style={{ background: DESIGN_SYSTEM.colors.accent.purple, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Uploading..." : `Upload All ${bulkData.length} Songs`}
            </button>
          </div>
        </div>
      )}

      {uploadProgress && <UploadProgressBar progress={uploadProgress.progress} fileName={uploadProgress.fileName} totalFiles={uploadProgress.totalFiles} currentFile={uploadProgress.currentFile} />}

      <div style={viewMode === 'grid' ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 } : { display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && songs.length === 0 ? (
          <SongGridSkeleton count={6} />
        ) : songs.length === 0 ? (
          <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: "center" }}>
            <Music size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", marginBottom: 6 }}>Your portfolio is waiting</h3>
            <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Upload your first track and let the world hear your sound!</p>
          </div>
        ) : (
          songs.map(song => ( <SongCard key={song.id} song={song} isPlaying={playingSong?.id === song.id && isPlaying} onPlay={playAudio} showActions={true} onEdit={handleEdit} onDelete={handleDelete} hideComposerName isMobile={isMobile} viewMode={viewMode} /> ))
        )}
      </div>
      <ConfirmModal open={confirmModal?.open} title={confirmModal?.title} message={confirmModal?.message} onConfirm={confirmModal?.onConfirm} onCancel={() => setConfirmModal(null)} />

      {/* ── First Upload Onboarding Modal ── */}
      {showOnboarding && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: DESIGN_SYSTEM.colors.bg.card,
            borderRadius: 20, width: '100%', maxWidth: 480,
            border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          }}>
            {/* Gold top accent */}
            <div style={{ height: 4, background: `linear-gradient(90deg, #C9A84C, #e8c96a, #C9A84C)` }} />

            <div style={{ padding: '28px 28px 24px' }}>
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>🎵</div>
                <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 20, fontWeight: 800, margin: '0 0 6px', fontFamily: DESIGN_SYSTEM.font.display, letterSpacing: '-0.02em' }}>
                  Track received.
                </h2>
                <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                  Now let's make it work for you. Three quick steps to get you in front of music supervisors.
                </p>
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  {
                    done: true,
                    label: 'Upload your first track',
                    desc: "It's in the vault.",
                    action: null,
                  },
                  {
                    done: false,
                    label: 'Complete your profile',
                    desc: 'Supervisors browse profiles before reaching out. Add your bio and photo.',
                    action: () => { setShowOnboarding(false); onNavigate?.('profile'); },
                  },
                  {
                    done: false,
                    label: 'Browse open briefs',
                    desc: "See what music supervisors are looking for right now.",
                    action: () => { setShowOnboarding(false); onNavigate?.('opportunities'); },
                  },
                  {
                    done: false,
                    label: 'Share your vault',
                    desc: 'Your catalog is live. Share your profile link with anyone.',
                    action: () => { setShowOnboarding(false); onNavigate?.('profile'); },
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    onClick={step.action || undefined}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '14px 12px', borderRadius: 12,
                      background: step.done ? `${DESIGN_SYSTEM.colors.brand.primary}0a` : 'transparent',
                      cursor: step.action ? 'pointer' : 'default',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (step.action) e.currentTarget.style.background = `${DESIGN_SYSTEM.colors.brand.primary}15`; }}
                    onMouseLeave={e => { if (step.action) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Step indicator */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: step.done ? DESIGN_SYSTEM.colors.brand.primary : 'transparent',
                      border: step.done ? 'none' : `2px solid ${DESIGN_SYSTEM.colors.border.medium}`,
                      marginTop: 1,
                    }}>
                      {step.done ? (
                        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                          <path d="M1 5L5 9L12 1" stroke="#0a0c14" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                      )}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: step.done ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.primary,
                        fontSize: 14, fontWeight: 700, marginBottom: 2,
                      }}>{step.label}</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12, lineHeight: 1.5 }}>{step.desc}</div>
                    </div>

                    {/* Arrow */}
                    {step.action && (
                      <div style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 16, flexShrink: 0, marginTop: 4 }}>→</div>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => setShowOnboarding(false)}
                style={{
                  width: '100%', marginTop: 20,
                  background: DESIGN_SYSTEM.colors.brand.primary,
                  color: '#0a0c14', border: 'none', borderRadius: 12,
                  padding: '14px', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body,
                  letterSpacing: '0.01em',
                }}
              >
                Got it, let's go →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}