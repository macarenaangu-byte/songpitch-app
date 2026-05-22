import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, ChevronDown, ChevronUp, Clock, X, Music, Disc, Search, CheckCircle, AlertTriangle, Equal, Upload, Download, Flag, ShieldCheck } from 'lucide-react';
import { DESIGN_SYSTEM } from '../../constants/designSystem';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { enrichSplits, analyzeSplitSheet, generateSplitSheetPdf } from '../../services/legalsplits';
import { useTier } from '../../hooks/useTier';
import UpgradeModal from '../../components/UpgradeModal';

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  page: {
    maxWidth: 860,
    margin: '0 auto',
    padding: DESIGN_SYSTEM.spacing.xl,
  },
  header: {
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
  title: {
    fontSize: DESIGN_SYSTEM.fontSize.xxl,
    fontWeight: DESIGN_SYSTEM.fontWeight.bold,
    color: DESIGN_SYSTEM.colors.text.primary,
    margin: 0,
  },
  subtitle: {
    fontSize: DESIGN_SYSTEM.fontSize.md,
    color: DESIGN_SYSTEM.colors.text.secondary,
    marginTop: 6,
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    background: DESIGN_SYSTEM.colors.bg.card,
    borderRadius: DESIGN_SYSTEM.radius.md,
    padding: 4,
  },
  tab: (active) => ({
    flex: 1,
    padding: '10px 16px',
    borderRadius: DESIGN_SYSTEM.radius.sm,
    border: 'none',
    cursor: 'pointer',
    fontSize: DESIGN_SYSTEM.fontSize.md,
    fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
    background: active ? DESIGN_SYSTEM.colors.brand.primary : 'transparent',
    color: active ? '#fff' : DESIGN_SYSTEM.colors.text.secondary,
    transition: DESIGN_SYSTEM.transition.fast,
  }),
  inputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
  inputCard: (active, color) => ({
    padding: DESIGN_SYSTEM.spacing.lg,
    border: `2px dashed ${active ? color : DESIGN_SYSTEM.colors.border.medium}`,
    borderRadius: DESIGN_SYSTEM.radius.lg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    background: active ? `${color}15` : DESIGN_SYSTEM.colors.bg.card,
    transition: DESIGN_SYSTEM.transition.fast,
  }),
  inputIcon: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
    fontSize: DESIGN_SYSTEM.fontSize.md,
    color: DESIGN_SYSTEM.colors.text.primary,
  },
  inputHint: {
    fontSize: DESIGN_SYSTEM.fontSize.xs,
    color: DESIGN_SYSTEM.colors.text.tertiary,
    textAlign: 'center',
  },
  card: {
    background: DESIGN_SYSTEM.colors.bg.card,
    borderRadius: DESIGN_SYSTEM.radius.lg,
    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
    padding: DESIGN_SYSTEM.spacing.lg,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  sectionTitle: {
    fontSize: DESIGN_SYSTEM.fontSize.lg,
    fontWeight: DESIGN_SYSTEM.fontWeight.bold,
    color: DESIGN_SYSTEM.colors.text.primary,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  splitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: DESIGN_SYSTEM.spacing.sm,
    padding: '10px 12px',
    background: DESIGN_SYSTEM.colors.bg.elevated,
    borderRadius: DESIGN_SYSTEM.radius.sm,
    marginBottom: 6,
  },
  splitInput: {
    flex: 1,
    background: DESIGN_SYSTEM.colors.bg.surface,
    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
    borderRadius: DESIGN_SYSTEM.radius.sm,
    padding: '6px 10px',
    color: DESIGN_SYSTEM.colors.text.primary,
    fontSize: DESIGN_SYSTEM.fontSize.md,
    outline: 'none',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  pctInput: (accentColor) => ({
    width: 64,
    textAlign: 'center',
    background: DESIGN_SYSTEM.colors.bg.surface,
    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
    borderRadius: DESIGN_SYSTEM.radius.sm,
    padding: '6px 8px',
    color: accentColor,
    fontSize: DESIGN_SYSTEM.fontSize.md,
    fontWeight: DESIGN_SYSTEM.fontWeight.bold,
    outline: 'none',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  }),
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: DESIGN_SYSTEM.colors.text.muted,
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  },
  textInput: {
    width: '100%',
    background: DESIGN_SYSTEM.colors.bg.elevated,
    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
    borderRadius: DESIGN_SYSTEM.radius.sm,
    padding: '10px 14px',
    color: DESIGN_SYSTEM.colors.text.primary,
    fontSize: DESIGN_SYSTEM.fontSize.md,
    outline: 'none',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: 'border-box',
  },
  primaryBtn: (disabled) => ({
    width: '100%',
    padding: '12px 20px',
    borderRadius: DESIGN_SYSTEM.radius.sm,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: DESIGN_SYSTEM.fontSize.md,
    fontWeight: DESIGN_SYSTEM.fontWeight.bold,
    background: disabled ? DESIGN_SYSTEM.colors.bg.surface : DESIGN_SYSTEM.colors.brand.primary,
    color: disabled ? DESIGN_SYSTEM.colors.text.muted : '#fff',
    transition: DESIGN_SYSTEM.transition.fast,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  }),
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: DESIGN_SYSTEM.radius.sm,
    border: `1px dashed ${DESIGN_SYSTEM.colors.border.medium}`,
    background: 'transparent',
    color: DESIGN_SYSTEM.colors.text.secondary,
    cursor: 'pointer',
    fontSize: DESIGN_SYSTEM.fontSize.sm,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  totalBar: (valid) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: DESIGN_SYSTEM.radius.sm,
    background: valid ? `${DESIGN_SYSTEM.colors.brand.primary}18` : `${DESIGN_SYSTEM.colors.accent.red}18`,
    border: `1px solid ${valid ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.accent.red}`,
    marginTop: DESIGN_SYSTEM.spacing.sm,
  }),
  historyCard: {
    background: DESIGN_SYSTEM.colors.bg.elevated,
    borderRadius: DESIGN_SYSTEM.radius.md,
    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    cursor: 'pointer',
    transition: DESIGN_SYSTEM.transition.fast,
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
    fontSize: DESIGN_SYSTEM.fontSize.md,
    color: DESIGN_SYSTEM.colors.text.primary,
  },
  historyMeta: {
    fontSize: DESIGN_SYSTEM.fontSize.xs,
    color: DESIGN_SYSTEM.colors.text.tertiary,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: DESIGN_SYSTEM.colors.text.muted,
    fontSize: DESIGN_SYSTEM.fontSize.md,
  },
  loadingSpinner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '40px 0',
  },
  spinner: {
    width: 32,
    height: 32,
    border: `3px solid ${DESIGN_SYSTEM.colors.border.light}`,
    borderTopColor: DESIGN_SYSTEM.colors.brand.primary,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  categoryLabel: (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: DESIGN_SYSTEM.fontSize.xs,
    fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
    color,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 8,
  }),
};

// ─── Constants ───────────────────────────────────────────────────────────────
const COMP_COLOR = DESIGN_SYSTEM.colors.accent.purple;
const MASTER_COLOR = DESIGN_SYSTEM.colors.brand.blue;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const calcTotal = (arr) => {
  const sum = (arr || []).reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);
  return Math.round(sum * 100) / 100; // Avoid floating-point drift
};
const isValidTotal = (total) => Math.abs(total - 100) < 0.05; // Tolerance for display rounding

/** Distribute percentages evenly, ensuring exact 100% total (remainder goes to first contributor) */
const distributeEvenly = (splits) => {
  if (!splits || splits.length === 0) return splits;
  const n = splits.length;
  const base = Math.floor(10000 / n) / 100; // e.g., 3 people → 33.33
  const remainder = Math.round((100 - base * n) * 100) / 100;
  return splits.map((s, i) => ({
    ...s,
    percentage: i === 0 ? Math.round((base + remainder) * 100) / 100 : base,
  }));
};


const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Backward compat: detect old flat-array format
const isLegacyFormat = (splits) => Array.isArray(splits);

// ─── Reusable SplitSection Component ─────────────────────────────────────────
function SplitSection({ label, icon, accentColor, splits, onUpdate, onRemove, onAdd, onDistributeEvenly }) {
  const total = calcTotal(splits);
  const valid = isValidTotal(total);

  return (
    <div style={{ ...styles.card, borderTop: `3px solid ${accentColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: DESIGN_SYSTEM.spacing.md }}>
        <div>
          <div style={styles.categoryLabel(accentColor)}>
            {icon} {label}
          </div>
          <div style={{ fontSize: DESIGN_SYSTEM.fontSize.xs, color: DESIGN_SYSTEM.colors.text.muted }}>
            {label === 'Composition / Publishing' ? 'Melody, lyrics, arrangement — songwriters & composers' : 'The sound recording — producers, engineers & artists'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(splits || []).length >= 2 && (
            <button onClick={onDistributeEvenly} style={{ ...styles.addBtn, background: 'transparent', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, color: DESIGN_SYSTEM.colors.text.secondary }} title="Split equally among all contributors">
              <Equal size={14} /> Even Split
            </button>
          )}
          <button onClick={onAdd} style={styles.addBtn}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Column labels */}
      <div style={{ display: 'flex', gap: DESIGN_SYSTEM.spacing.sm, padding: '0 12px', marginBottom: 4 }}>
        <span style={{ flex: 1, fontSize: DESIGN_SYSTEM.fontSize.xs, color: DESIGN_SYSTEM.colors.text.muted, fontWeight: DESIGN_SYSTEM.fontWeight.medium }}>NAME</span>
        <span style={{ flex: 1, fontSize: DESIGN_SYSTEM.fontSize.xs, color: DESIGN_SYSTEM.colors.text.muted, fontWeight: DESIGN_SYSTEM.fontWeight.medium }}>ROLE</span>
        <span style={{ width: 64, fontSize: DESIGN_SYSTEM.fontSize.xs, color: DESIGN_SYSTEM.colors.text.muted, fontWeight: DESIGN_SYSTEM.fontWeight.medium, textAlign: 'center' }}>%</span>
        <span style={{ width: 28 }} />
      </div>

      {/* Rows */}
      {(splits || []).map((split, i) => (
        <div key={i} style={styles.splitRow}>
          <input style={styles.splitInput} value={split.name} onChange={(e) => onUpdate(i, 'name', e.target.value)} placeholder="Name" />
          <input style={styles.splitInput} value={split.role} onChange={(e) => onUpdate(i, 'role', e.target.value)} placeholder="Role" />
          <input style={styles.pctInput(accentColor)} type="number" min="0" max="100" step="0.1" value={split.percentage} onChange={(e) => onUpdate(i, 'percentage', e.target.value)} />
          <button style={styles.removeBtn} onClick={() => onRemove(i)} title="Remove"><X size={16} /></button>
        </div>
      ))}

      {(splits || []).length === 0 && (
        <div style={{ padding: '16px 12px', textAlign: 'center', color: DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.sm }}>
          No contributors yet. Click "Add" to add one.
        </div>
      )}

      {/* Total bar */}
      {(splits || []).length > 0 && (
        <div style={styles.totalBar(valid)}>
          <span style={{ fontSize: DESIGN_SYSTEM.fontSize.sm, fontWeight: DESIGN_SYSTEM.fontWeight.medium, color: DESIGN_SYSTEM.colors.text.secondary }}>Total</span>
          <span style={{ fontSize: DESIGN_SYSTEM.fontSize.md, fontWeight: DESIGN_SYSTEM.fontWeight.bold, color: valid ? accentColor : DESIGN_SYSTEM.colors.accent.red }}>
            {total.toFixed(2)}%
            {!valid && <span style={{ fontSize: DESIGN_SYSTEM.fontSize.xs, fontWeight: DESIGN_SYSTEM.fontWeight.normal, marginLeft: 8 }}>Must equal 100%</span>}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SplitGenerator({ userProfile }) {
  // Tier gates
  const { can, upgradeMessage } = useTier(userProfile);
  const [upgradeModal, setUpgradeModal] = useState({ open: false, feature: '' });

  // Tab state
  const [activeTab, setActiveTab] = useState('new');

  // --- New Split State ---
  const [compositionSplits, setCompositionSplits] = useState([]);
  const [masterSplits, setMasterSplits] = useState([]);
  const [songTitle, setSongTitle] = useState('');
  const [isAttested, setIsAttested] = useState(false);
  const [signature, setSignature] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // PRO / IPI enrichment (via LegalSplits AI)
  const [proEnriching, setProEnriching] = useState(false);
  const [proEnrichedData, setProEnrichedData] = useState(null);
  const [proEnrichError, setProEnrichError] = useState(null);

  // --- Analyze PDF state ---
  const analyzeInputRef = useRef(null);
  const [analyzeFile, setAnalyzeFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [analyzeDragOver, setAnalyzeDragOver] = useState(false);

  // --- Generate PDF state ---
  const ROLES = ['Songwriter', 'Composer', 'Lyricist', 'Producer', 'Beatmaker', 'Arranger', 'Other'];
  const PROS  = ['ASCAP', 'BMI', 'SESAC', 'SOCAN', 'PRS', 'APRA', 'Other', 'None'];

  const blankWriter = () => ({
    legal_name: '', stage_name: '', email: '', role: 'Songwriter',
    composition_percentage: 0, master_percentage: 0,
    pro: 'ASCAP', ipi: '',
    publisher: { name: '', ipi: '', pro: 'ASCAP', is_self_published: true },
    contribution_notes: '', _expanded: true, _showPublisher: false,
  });

  const [genSongTitle, setGenSongTitle]     = useState('');
  const [genDate, setGenDate]               = useState(new Date().toISOString().slice(0, 10));
  const [genIsrc, setGenIsrc]               = useState('');
  const [genUpc, setGenUpc]                 = useState('');
  const [genLabel, setGenLabel]             = useState('');
  const [genNotes, setGenNotes]             = useState('');
  const [genSplitType, setGenSplitType]     = useState('composition');
  const [genHasSamples, setGenHasSamples]   = useState(false);
  const [genSampleInfo, setGenSampleInfo]   = useState('');
  const [genWriters, setGenWriters]         = useState([blankWriter()]);
  const [generating, setGenerating]         = useState(false);
  const [genError, setGenError]             = useState(null);
  const [genSaving, setGenSaving]           = useState(false);

  // --- Song Selector State ---
  const [coOwnedSongs, setCoOwnedSongs] = useState([]);
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [showSongDropdown, setShowSongDropdown] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const songDropdownRef = useRef(null);

  // --- History State ---
  const [savedSheets, setSavedSheets] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedSheet, setExpandedSheet] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('split_sheets')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSavedSheets(data || []);
    } catch (err) {
      console.error('Failed to load split sheets:', err);
      showToast.error('Failed to load split sheet history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'history' || activeTab === 'generate') && userProfile?.id) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userProfile?.id]);

  // Load co-owned songs for the song selector
  const loadCoOwnedSongs = async () => {
    setLoadingSongs(true);
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, verification_status')
        .eq('composer_id', userProfile.id)
        .eq('is_one_stop', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCoOwnedSongs(data || []);
    } catch (err) {
      console.error('Failed to load co-owned songs:', err);
    } finally {
      setLoadingSongs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'new' && userProfile?.id) {
      loadCoOwnedSongs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userProfile?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (songDropdownRef.current && !songDropdownRef.current.contains(e.target)) {
        setShowSongDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSongs = coOwnedSongs.filter(s =>
    s.title.toLowerCase().includes(songSearchQuery.toLowerCase())
  );

  const selectedSong = coOwnedSongs.find(s => s.id === selectedSongId);

  // ─── Inline Edit Helpers ─────────────────────────────────────────────────
  const makeUpdater = (setter) => (index, field, value) => {
    setter(prev => {
      const updated = [...prev];
      if (field === 'percentage') {
        const num = parseFloat(value);
        updated[index] = { ...updated[index], percentage: isNaN(num) ? 0 : Math.round(num * 100) / 100 };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const makeRemover = (setter) => (index) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const makeAdder = (setter) => () => {
    setter(prev => [...(prev || []), { name: '', role: '', percentage: 0 }]);
  };

  // Totals
  const compTotal = calcTotal(compositionSplits);
  const masterTotal = calcTotal(masterSplits);
  const compValid = (compositionSplits || []).length === 0 || isValidTotal(compTotal);
  const masterValid = (masterSplits || []).length === 0 || isValidTotal(masterTotal);
  const bothHaveContributors = (compositionSplits || []).length > 0 || (masterSplits || []).length > 0;
  const bothValid = compValid && masterValid && bothHaveContributors;

  // ─── Save to Database ─────────────────────────────────────────────────────
  const handleSaveToDatabase = async () => {
    if (!bothValid) {
      showToast.error('Each split category with contributors must total exactly 100%.');
      return;
    }
    if (!selectedSongId) {
      showToast.error('Please select a song to verify rights for.');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('split_sheets').insert([{
        user_id: userProfile.id,
        song_id: selectedSongId,
        song_title: songTitle.trim() || null,
        splits: { composition: compositionSplits || [], master: masterSplits || [] },
        signature,
        attested: isAttested,
        input_method: 'manual',
      }]);

      if (error) throw error;

      // Update the song's verification_status to 'verified'
      await supabase.from('songs')
        .update({ verification_status: 'verified' })
        .eq('id', selectedSongId);

      showToast.success(`Rights verified for "${songTitle || 'song'}"!`);

      // Update local state so song shows as verified in selector
      setCoOwnedSongs(prev => prev.map(s =>
        s.id === selectedSongId ? { ...s, verification_status: 'verified' } : s
      ));

      // Reset form
      setCompositionSplits([]);
      setMasterSplits([]);
      setSongTitle('');
      setSelectedSongId(null);
      setSongSearchQuery('');
      setSignature('');
      setIsAttested(false);
      setProEnrichedData(null);
      setProEnrichError(null);
    } catch (err) {
      console.error('Failed to save:', err);
      showToast.error('Failed to save split sheet. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── 6b. Download PDF from history ───────────────────────────────────────
  const handleDownloadHistoryPdf = async (e, sheet) => {
    e.stopPropagation();
    try {
      const legacy     = isLegacyFormat(sheet.splits);
      const compSplits = legacy ? sheet.splits : (sheet.splits?.composition || []);
      const mastSplits = legacy ? [] : (sheet.splits?.master || []);

      // Reconstruct writers array from stored composition/master splits
      const writerMap = {};
      compSplits.forEach(s => {
        const key = s.name;
        if (!writerMap[key]) writerMap[key] = { legal_name: s.name, role: s.role || '', pro: s.pro || 'None', ipi: s.ipi || '', composition_percentage: 0, master_percentage: 0 };
        writerMap[key].composition_percentage = s.percentage;
      });
      mastSplits.forEach(s => {
        const key = s.name;
        if (!writerMap[key]) writerMap[key] = { legal_name: s.name, role: s.role || '', pro: s.pro || 'None', ipi: s.ipi || '', composition_percentage: 0, master_percentage: 0 };
        writerMap[key].master_percentage = s.percentage;
      });

      const payload = {
        song_title:  sheet.song_title || 'Untitled',
        date:        sheet.created_at ? new Date(sheet.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        split_type:  legacy ? 'composition' : (compSplits.length > 0 && mastSplits.length > 0 ? 'both' : mastSplits.length > 0 ? 'master' : 'composition'),
        has_samples: false,
        writers:     Object.values(writerMap),
      };

      const blob = await generateSplitSheetPdf(payload);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `split-sheet-${(sheet.song_title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast.success('PDF downloaded!');
    } catch (err) {
      showToast.error(err.message || 'PDF generation failed.');
    }
  };

  // ─── 6. Delete ─────────────────────────────────────────────────────────────
  const handleDeleteSheet = async (id) => {
    try {
      const sheet = savedSheets.find(s => s.id === id);
      const { error } = await supabase.from('split_sheets').delete().eq('id', id);
      if (error) throw error;
      // Revert song verification status so it no longer appears verified in the catalog
      if (sheet?.song_id) {
        await supabase.from('songs').update({ verification_status: 'pending_splits' }).eq('id', sheet.song_id);
        setCoOwnedSongs(prev => prev.map(s => s.id === sheet.song_id ? { ...s, verification_status: 'pending_splits' } : s));
      }
      setSavedSheets(prev => prev.filter(s => s.id !== id));
      setExpandedSheet(null);
      showToast.success('Split sheet deleted.');
    } catch (err) {
      console.error('Failed to delete:', err);
      showToast.error('Failed to delete split sheet.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const canSave = isAttested && signature.trim().length >= 3 && bothValid && selectedSongId && !isSaving;

  const handleEnrichPRO = async () => {
    if (!can('proIpiEnrichment')) {
      setUpgradeModal({ open: true, feature: upgradeMessage('proIpiEnrichment') });
      return;
    }
    setProEnriching(true);
    setProEnrichedData(null);
    setProEnrichError(null);
    try {
      const result = await enrichSplits({
        song_title: songTitle.trim() || 'Untitled',
        composition_splits: (compositionSplits || []).map(s => ({ name: s.name, percentage: s.percentage, role: s.role })),
        master_splits: (masterSplits || []).map(s => ({ name: s.name, percentage: s.percentage, role: s.role })),
      });
      setProEnrichedData(result);
    } catch (err) {
      console.error('PRO enrichment failed:', err);
      setProEnrichError('Could not reach LegalSplits AI. Please try again.');
    } finally {
      setProEnriching(false);
    }
  };

  // ─── Analyze PDF handler ─────────────────────────────────────────────────
  const handleAnalyzeFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setAnalyzeError('Only PDF files are supported.'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAnalyzeError('File too large. Maximum 10MB.'); return;
    }
    setAnalyzeFile(file);
    setAnalyzeError(null);
    setAnalyzeResult(null);
    setAnalyzing(true);
    try {
      const result = await analyzeSplitSheet(file);
      setAnalyzeResult(result);
    } catch (err) {
      setAnalyzeError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Populate Generate tab from Analyze result
  const applyAnalyzeResult = (result) => {
    setGenSongTitle(result.song_title || '');
    setGenDate(result.date || new Date().toISOString().slice(0, 10));
    setGenIsrc(result.isrc || '');
    setGenUpc(result.upc || '');
    setGenLabel(result.record_label || '');
    setGenSplitType(result.split_type || 'composition');
    setGenHasSamples(result.has_samples || false);
    setGenSampleInfo(result.sample_info || '');
    if (result.writers?.length > 0) {
      setGenWriters(result.writers.map(w => ({
        legal_name: w.legal_name || '',
        stage_name: w.stage_name || '',
        email: w.email || '',
        role: w.role || 'Songwriter',
        composition_percentage: w.composition_percentage ?? 0,
        master_percentage: w.master_percentage ?? 0,
        pro: w.pro || 'None',
        ipi: w.ipi || '',
        publisher: w.publisher ? {
          name: w.publisher.name || '',
          ipi: w.publisher.ipi || '',
          pro: w.publisher.pro || 'None',
          is_self_published: w.publisher.is_self_published ?? false,
        } : { name: '', ipi: '', pro: 'None', is_self_published: true },
        contribution_notes: w.contribution_notes || '',
        _expanded: true,
        _showPublisher: !!w.publisher,
      })));
    }
    setActiveTab('generate');
    showToast.success('Splits imported — review and download your PDF.');
  };

  // ─── Generate PDF handler ─────────────────────────────────────────────────
  const handleGeneratePdf = async () => {
    if (!genSongTitle.trim()) { setGenError('Song title is required.'); return; }
    if (!genDate) { setGenError('Date is required.'); return; }
    if (genWriters.length === 0) { setGenError('At least one writer is required.'); return; }
    if (genHasSamples && !genSampleInfo.trim()) { setGenError('Sample info is required when has_samples is true.'); return; }

    setGenerating(true);
    setGenError(null);
    try {
      const payload = {
        song_title: genSongTitle.trim(),
        date: genDate,
        ...(genIsrc  && { isrc: genIsrc }),
        ...(genUpc   && { upc: genUpc }),
        ...(genLabel && { record_label: genLabel }),
        ...(genNotes && { notes: genNotes }),
        split_type: genSplitType,
        has_samples: genHasSamples,
        ...(genHasSamples && { sample_info: genSampleInfo }),
        writers: genWriters.map(({ _expanded, _showPublisher, ...w }) => ({
          ...w,
          composition_percentage: parseFloat(w.composition_percentage) || 0,
          master_percentage: parseFloat(w.master_percentage) || 0,
          ...(w.ipi ? { ipi: w.ipi } : {}),
          ...((_showPublisher && w.publisher?.name) ? { publisher: {
            name: w.publisher.name,
            ...(w.publisher.ipi ? { ipi: w.publisher.ipi } : {}),
            ...(w.publisher.pro ? { pro: w.publisher.pro } : {}),
            is_self_published: w.publisher.is_self_published,
          }} : {}),
        })),
      };

      const blob = await generateSplitSheetPdf(payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `split-sheet-${genSongTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast.success('Split sheet PDF downloaded!');
    } catch (err) {
      setGenError(err.message || 'PDF generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ─── Save generate form to dashboard ────────────────────────────────────────
  const handleSaveToDashboard = async () => {
    if (!genSongTitle.trim()) { setGenError('Add a song title to save.'); return; }
    setGenSaving(true);
    setGenError(null);
    try {
      const compSplits = genWriters.map(w => ({ name: w.legal_name || w.stage_name || 'Unknown', role: w.role, percentage: parseFloat(w.composition_percentage) || 0, pro: w.pro !== 'None' ? w.pro : null, ipi: w.ipi || null }));
      const mastSplits = genWriters.map(w => ({ name: w.legal_name || w.stage_name || 'Unknown', role: w.role, percentage: parseFloat(w.master_percentage) || 0, pro: w.pro !== 'None' ? w.pro : null, ipi: w.ipi || null }));
      const { error } = await supabase.from('split_sheets').insert([{
        user_id: userProfile.id,
        song_title: genSongTitle.trim(),
        splits: { composition: compSplits, master: mastSplits },
        input_method: 'pdf_generated',
        signature: genWriters[0]?.legal_name || genWriters[0]?.stage_name || userProfile.first_name + ' ' + userProfile.last_name,
      }]);
      if (error) throw error;
      showToast.success('Split sheet saved to dashboard!');
      loadHistory();
    } catch (err) {
      setGenError(err.message || 'Failed to save.');
    } finally {
      setGenSaving(false);
    }
  };

  // ─── Reset generate form ─────────────────────────────────────────────────
  const handleNewSplitSheet = () => {
    setGenSongTitle('');
    setGenDate(new Date().toISOString().slice(0, 10));
    setGenIsrc(''); setGenUpc(''); setGenLabel(''); setGenNotes('');
    setGenSplitType('composition');
    setGenHasSamples(false); setGenSampleInfo('');
    setGenWriters([blankWriter()]);
    setGenError(null);
  };

  const updateGenWriter = (i, field, value) => {
    setGenWriters(prev => prev.map((w, idx) => idx === i ? { ...w, [field]: value } : w));
  };
  const updateGenWriterPublisher = (i, field, value) => {
    setGenWriters(prev => prev.map((w, idx) => idx === i ? { ...w, publisher: { ...w.publisher, [field]: value } } : w));
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, feature: '' })}
        feature={upgradeModal.feature}
        userProfile={userProfile}
        defaultTier="basic"
      />

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Rights Verification Dashboard</h1>
        <p style={styles.subtitle}>Enter composition and master splits for your co-owned songs. PRO &amp; IPI verification powered by LegalSplits ML.</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'new')} onClick={() => setActiveTab('new')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Plus size={15} /> New Split
          </span>
        </button>
        <button style={styles.tab(activeTab === 'analyze')} onClick={() => setActiveTab('analyze')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Search size={15} /> Analyze PDF
          </span>
        </button>
        <button style={styles.tab(activeTab === 'generate')} onClick={() => setActiveTab('generate')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Download size={15} /> Generate PDF
          </span>
        </button>
        <button style={styles.tab(activeTab === 'history')} onClick={() => setActiveTab('history')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Clock size={15} /> My Split Sheets
          </span>
        </button>
      </div>

      {/* ═══ NEW SPLIT TAB ═══ */}
      {activeTab === 'new' && (
        <>
          {/* Song Selector */}
          <div style={{ ...styles.card, marginBottom: DESIGN_SYSTEM.spacing.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: DESIGN_SYSTEM.spacing.md }}>
              <Search size={16} color={DESIGN_SYSTEM.colors.text.muted} />
              <span style={{ fontSize: DESIGN_SYSTEM.fontSize.md, fontWeight: DESIGN_SYSTEM.fontWeight.bold, color: DESIGN_SYSTEM.colors.text.primary }}>
                Select a Co-Owned Song to Verify
              </span>
            </div>

            {loadingSongs ? (
              <div style={{ textAlign: 'center', padding: 16, color: DESIGN_SYSTEM.colors.text.muted }}>Loading songs...</div>
            ) : coOwnedSongs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 16px', color: DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.sm }}>
                <AlertTriangle size={20} color={DESIGN_SYSTEM.colors.accent.amber} style={{ marginBottom: 6, display: 'block', margin: '0 auto 8px' }} />
                No co-owned songs found. Upload a co-owned song first in your Portfolio.
              </div>
            ) : (
              <div ref={songDropdownRef} style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={selectedSong ? selectedSong.title : songSearchQuery}
                  onChange={(e) => {
                    setSongSearchQuery(e.target.value);
                    setSelectedSongId(null);
                    setSongTitle('');
                    setShowSongDropdown(true);
                  }}
                  onFocus={() => setShowSongDropdown(true)}
                  placeholder="Search your co-owned songs..."
                  style={{
                    ...styles.textInput,
                    paddingLeft: 14,
                    paddingRight: selectedSong ? 36 : 14,
                    borderColor: selectedSong
                      ? (selectedSong.verification_status === 'verified' ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.accent.amber)
                      : DESIGN_SYSTEM.colors.border.light,
                  }}
                />
                {selectedSong && (
                  <button onClick={() => { setSelectedSongId(null); setSongTitle(''); setSongSearchQuery(''); }}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <X size={16} color={DESIGN_SYSTEM.colors.text.muted} />
                  </button>
                )}
                {showSongDropdown && !selectedSong && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: DESIGN_SYSTEM.colors.bg.elevated,
                    border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`,
                    borderRadius: DESIGN_SYSTEM.radius.sm,
                    marginTop: 4, maxHeight: 240, overflowY: 'auto',
                    boxShadow: DESIGN_SYSTEM.shadow.lg,
                  }}>
                    {filteredSongs.length === 0 ? (
                      <div style={{ padding: '12px 14px', color: DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.sm }}>No matching songs</div>
                    ) : filteredSongs.map(song => (
                      <div key={song.id}
                        onClick={() => {
                          setSelectedSongId(song.id);
                          setSongTitle(song.title);
                          setSongSearchQuery('');
                          setShowSongDropdown(false);
                        }}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                          transition: DESIGN_SYSTEM.transition.fast,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: DESIGN_SYSTEM.fontSize.md }}>{song.title}</span>
                        {song.verification_status === 'verified' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.brand.primary }}>
                            <CheckCircle size={12} /> Verified
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.accent.amber }}>
                            <AlertTriangle size={12} /> Needs Verification
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedSong && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: DESIGN_SYSTEM.fontSize.sm }}>
                {selectedSong.verification_status === 'verified' ? (
                  <>
                    <CheckCircle size={14} color={DESIGN_SYSTEM.colors.brand.primary} />
                    <span style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontWeight: DESIGN_SYSTEM.fontWeight.semibold }}>Already verified — you can re-verify with updated splits</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} color={DESIGN_SYSTEM.colors.accent.amber} />
                    <span style={{ color: DESIGN_SYSTEM.colors.accent.amber, fontWeight: DESIGN_SYSTEM.fontWeight.semibold }}>Pending verification — complete splits below</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Gate: show split form only when song is selected */}
          {!selectedSongId ? (
            <div style={{ ...styles.card, textAlign: 'center', padding: '40px 20px' }}>
              <Search size={32} color={DESIGN_SYSTEM.colors.text.muted} style={{ marginBottom: 12 }} />
              <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.md, margin: 0 }}>
                Select a song above to begin rights verification
              </p>
            </div>
          ) : (
          <>
              {/* Composition splits */}
              <SplitSection
                label="Composition / Publishing"
                icon={<Music size={14} />}
                accentColor={COMP_COLOR}
                splits={compositionSplits}
                onUpdate={makeUpdater(setCompositionSplits)}
                onRemove={makeRemover(setCompositionSplits)}
                onAdd={makeAdder(setCompositionSplits)}
                onDistributeEvenly={() => setCompositionSplits(prev => distributeEvenly(prev))}
              />

              {/* Master splits */}
              <SplitSection
                label="Master Recording"
                icon={<Disc size={14} />}
                accentColor={MASTER_COLOR}
                splits={masterSplits}
                onUpdate={makeUpdater(setMasterSplits)}
                onRemove={makeRemover(setMasterSplits)}
                onAdd={makeAdder(setMasterSplits)}
                onDistributeEvenly={() => setMasterSplits(prev => distributeEvenly(prev))}
              />

              {/* Legal Data Gap Warnings */}
              {(compositionSplits || []).length > 0 && !isValidTotal(compTotal) && (
                <div style={{ padding: '12px 16px', background: `${DESIGN_SYSTEM.colors.accent.red}12`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}50`, borderRadius: DESIGN_SYSTEM.radius.sm, marginBottom: DESIGN_SYSTEM.spacing.md, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={18} color={DESIGN_SYSTEM.colors.accent.red} />
                  <span style={{ color: DESIGN_SYSTEM.colors.accent.red, fontSize: DESIGN_SYSTEM.fontSize.sm, fontWeight: DESIGN_SYSTEM.fontWeight.semibold }}>
                    Legal Data Gap: Composition splits total {compTotal.toFixed(1)}%, not 100%. All rights must be accounted for.
                  </span>
                </div>
              )}
              {(masterSplits || []).length > 0 && !isValidTotal(masterTotal) && (
                <div style={{ padding: '12px 16px', background: `${DESIGN_SYSTEM.colors.accent.red}12`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}50`, borderRadius: DESIGN_SYSTEM.radius.sm, marginBottom: DESIGN_SYSTEM.spacing.md, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={18} color={DESIGN_SYSTEM.colors.accent.red} />
                  <span style={{ color: DESIGN_SYSTEM.colors.accent.red, fontSize: DESIGN_SYSTEM.fontSize.sm, fontWeight: DESIGN_SYSTEM.fontWeight.semibold }}>
                    Legal Data Gap: Master splits total {masterTotal.toFixed(1)}%, not 100%. All rights must be accounted for.
                  </span>
                </div>
              )}

              {/* PRO & IPI Enrichment — only show when there are contributors */}
              {((compositionSplits || []).length > 0 || (masterSplits || []).length > 0) && (
                <div style={{ ...styles.card, marginBottom: DESIGN_SYSTEM.spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: DESIGN_SYSTEM.spacing.sm }}>
                    <div>
                      <h3 style={{ fontSize: DESIGN_SYSTEM.fontSize.md, fontWeight: DESIGN_SYSTEM.fontWeight.bold, color: DESIGN_SYSTEM.colors.text.primary, margin: 0 }}>
                        PRO &amp; IPI Verification
                      </h3>
                      <p style={{ fontSize: DESIGN_SYSTEM.fontSize.sm, color: DESIGN_SYSTEM.colors.text.secondary, marginTop: 4, marginBottom: 0 }}>
                        Look up performing rights affiliations and IPI numbers for your writers via LegalSplits AI.
                      </p>
                    </div>
                    <button
                      onClick={handleEnrichPRO}
                      disabled={proEnriching}
                      style={{
                        flexShrink: 0,
                        padding: '8px 16px',
                        borderRadius: DESIGN_SYSTEM.radius.sm,
                        border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}`,
                        background: proEnriching ? 'transparent' : `${DESIGN_SYSTEM.colors.brand.primary}15`,
                        color: DESIGN_SYSTEM.colors.brand.primary,
                        fontSize: DESIGN_SYSTEM.fontSize.sm,
                        fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
                        cursor: proEnriching ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        opacity: proEnriching ? 0.6 : 1,
                      }}
                    >
                      {proEnriching ? 'Looking up…' : '🔍 Verify PRO & IPI'}
                    </button>
                  </div>

                  {proEnrichError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: `${DESIGN_SYSTEM.colors.accent.red}12`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}40`, borderRadius: DESIGN_SYSTEM.radius.sm, marginTop: DESIGN_SYSTEM.spacing.sm }}>
                      <AlertTriangle size={16} color={DESIGN_SYSTEM.colors.accent.red} />
                      <span style={{ fontSize: DESIGN_SYSTEM.fontSize.sm, color: DESIGN_SYSTEM.colors.accent.red }}>{proEnrichError}</span>
                    </div>
                  )}

                  {proEnrichedData && (() => {
                    const allWriters = [
                      ...(proEnrichedData.composition_splits || []).map(s => ({ ...s, type: 'Composition' })),
                      ...(proEnrichedData.master_splits || []).filter(s =>
                        !(proEnrichedData.composition_splits || []).some(c => c.name.toLowerCase() === s.name.toLowerCase())
                      ).map(s => ({ ...s, type: 'Master' })),
                    ];
                    return (
                      <div style={{ marginTop: DESIGN_SYSTEM.spacing.md }}>
                        <div style={{ overflowX: 'auto', borderRadius: DESIGN_SYSTEM.radius.sm, border: `1px solid ${DESIGN_SYSTEM.colors.bg.card}` }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: DESIGN_SYSTEM.fontSize.sm }}>
                            <thead>
                              <tr style={{ background: DESIGN_SYSTEM.colors.bg.card }}>
                                {['Writer', 'PRO', 'IPI Number', '%'].map(h => (
                                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: DESIGN_SYSTEM.fontWeight.semibold, color: DESIGN_SYSTEM.colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {allWriters.map((writer, i) => {
                                const hasPro = writer.pro && writer.pro !== 'Unknown';
                                const hasIpi = writer.ipi && writer.ipi !== 'Unknown';
                                return (
                                  <tr key={i} style={{ borderBottom: i < allWriters.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none' }}>
                                    <td style={{ padding: '10px 12px', color: DESIGN_SYSTEM.colors.text.primary, fontWeight: DESIGN_SYSTEM.fontWeight.medium }}>
                                      {writer.name}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                      {hasPro ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#4ade80', fontWeight: DESIGN_SYSTEM.fontWeight.semibold }}>
                                          <CheckCircle size={13} /> {writer.pro}
                                        </span>
                                      ) : (
                                        <span style={{ color: DESIGN_SYSTEM.colors.text.secondary }}>—</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: hasIpi ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.secondary }}>
                                      {hasIpi ? writer.ipi : '—'}
                                    </td>
                                    <td style={{ padding: '10px 12px', color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12 }}>
                                      {writer.percentage}%
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <p style={{ fontSize: 11, color: DESIGN_SYSTEM.colors.text.secondary, marginTop: 8, marginBottom: 0 }}>
                          ⚗️ AI-compiled from public sources. Verify IPI numbers on{' '}
                          <a href="https://www.ascap.com/repertory" target="_blank" rel="noreferrer" style={{ color: DESIGN_SYSTEM.colors.brand.primary }}>ASCAP</a>,{' '}
                          <a href="https://repertoire.bmi.com" target="_blank" rel="noreferrer" style={{ color: DESIGN_SYSTEM.colors.brand.primary }}>BMI</a>, or{' '}
                          <a href="https://www.sesac.com" target="_blank" rel="noreferrer" style={{ color: DESIGN_SYSTEM.colors.brand.primary }}>SESAC</a> before use.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Legal attestation */}
              <div style={styles.card}>
                <h3 style={{ fontSize: DESIGN_SYSTEM.fontSize.md, fontWeight: DESIGN_SYSTEM.fontWeight.bold, color: DESIGN_SYSTEM.colors.accent.red, marginBottom: DESIGN_SYSTEM.spacing.sm }}>
                  Legal Attestation & Signature
                </h3>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: DESIGN_SYSTEM.spacing.md }}>
                  <input type="checkbox" id="attest" checked={isAttested} onChange={(e) => setIsAttested(e.target.checked)}
                    style={{ marginTop: 3, width: 18, height: 18, accentColor: DESIGN_SYSTEM.colors.brand.primary, cursor: 'pointer' }} />
                  <label htmlFor="attest" style={{ fontSize: DESIGN_SYSTEM.fontSize.sm, color: DESIGN_SYSTEM.colors.text.secondary, cursor: 'pointer', lineHeight: 1.5 }}>
                    I attest under penalty of perjury that the composition and master recording ownership splits provided are truthful, accurate, and agreed upon by all listed parties. I represent and warrant that I have the legal authority to claim and assign these copyrights and master rights respectively.
                  </label>
                </div>

                <div style={{ marginBottom: DESIGN_SYSTEM.spacing.md }}>
                  <label style={{ display: 'block', fontSize: DESIGN_SYSTEM.fontSize.sm, fontWeight: DESIGN_SYSTEM.fontWeight.medium, color: DESIGN_SYSTEM.colors.text.secondary, marginBottom: 6 }}>
                    Type your full legal name to electronically sign:
                  </label>
                  <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="e.g., Johnathan Doe" style={styles.textInput} />
                </div>

                <button onClick={handleSaveToDatabase} disabled={!canSave} style={styles.primaryBtn(!canSave)}>
                  {isSaving ? 'Saving...' : 'Confirm & Save to Database'}
                </button>
              </div>
          </>
          )}
        </>
      )}

      {/* ═══ ANALYZE PDF TAB ═══ */}
      {activeTab === 'analyze' && (
        <>
          {/* Upload zone */}
          {!analyzeResult && (
            <div
              onDragOver={e => { e.preventDefault(); setAnalyzeDragOver(true); }}
              onDragLeave={() => setAnalyzeDragOver(false)}
              onDrop={e => { e.preventDefault(); setAnalyzeDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleAnalyzeFile(f); }}
              onClick={() => analyzeInputRef.current?.click()}
              style={{ ...styles.card, border: `2px dashed ${analyzeDragOver ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.medium}`, background: analyzeDragOver ? `${DESIGN_SYSTEM.colors.brand.primary}08` : DESIGN_SYSTEM.colors.bg.card, textAlign: 'center', padding: '48px 32px', cursor: 'pointer', transition: DESIGN_SYSTEM.transition.fast }}
            >
              <Upload size={36} color={DESIGN_SYSTEM.colors.brand.primary} style={{ marginBottom: 14 }} />
              <p style={{ color: DESIGN_SYSTEM.colors.text.primary, fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>
                {analyzeFile ? analyzeFile.name : 'Drop your split sheet PDF here'}
              </p>
              <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, margin: 0 }}>
                {analyzeFile ? `${(analyzeFile.size / 1024).toFixed(0)} KB · Click to change` : 'or click to browse · PDF only · Max 10MB'}
              </p>
              <input ref={analyzeInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) handleAnalyzeFile(f); e.target.value = null; }} />
            </div>
          )}

          {analyzeFile && !analyzing && !analyzeResult && (
            <button onClick={() => handleAnalyzeFile(analyzeFile)} style={{ ...styles.primaryBtn(false), marginTop: -8 }}>
              Analyze Split Sheet
            </button>
          )}

          {/* Loading */}
          {analyzing && (
            <div style={styles.loadingSpinner}>
              <div style={styles.spinner} />
              <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontWeight: 600 }}>LegalSplits AI is reading your PDF…</p>
            </div>
          )}

          {/* Error */}
          {analyzeError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: `${DESIGN_SYSTEM.colors.accent.red}12`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}40`, borderRadius: DESIGN_SYSTEM.radius.sm, marginTop: 12 }}>
              <AlertTriangle size={16} color={DESIGN_SYSTEM.colors.accent.red} />
              <span style={{ color: DESIGN_SYSTEM.colors.accent.red, fontSize: DESIGN_SYSTEM.fontSize.sm }}>{analyzeError}</span>
            </div>
          )}

          {/* Results */}
          {analyzeResult && !analyzing && (
            <>
              {/* Song info */}
              <div style={{ ...styles.card, borderTop: `3px solid ${DESIGN_SYSTEM.colors.brand.primary}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>{analyzeResult.song_title || 'Untitled'}</h2>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {analyzeResult.date && <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.muted }}>{analyzeResult.date}</span>}
                      {analyzeResult.isrc && <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.muted }}>ISRC: {analyzeResult.isrc}</span>}
                      {analyzeResult.record_label && <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.muted }}>{analyzeResult.record_label}</span>}
                      {analyzeResult.split_type && <span style={{ fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.brand.primary, background: `${DESIGN_SYSTEM.colors.brand.primary}15`, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{analyzeResult.split_type}</span>}
                      <span style={{ fontSize: 11, fontWeight: 700, color: analyzeResult.overall_confidence === 'high' ? '#4ade80' : analyzeResult.overall_confidence === 'medium' ? DESIGN_SYSTEM.colors.accent.amber : DESIGN_SYSTEM.colors.accent.red, background: analyzeResult.overall_confidence === 'high' ? 'rgba(74,222,128,0.12)' : analyzeResult.overall_confidence === 'medium' ? `${DESIGN_SYSTEM.colors.accent.amber}15` : `${DESIGN_SYSTEM.colors.accent.red}15`, padding: '2px 8px', borderRadius: 20 }}>
                        {analyzeResult.overall_confidence} confidence
                      </span>
                    </div>
                  </div>
                  <button onClick={() => applyAnalyzeResult(analyzeResult)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: DESIGN_SYSTEM.colors.brand.primary, color: '#fff', border: 'none', borderRadius: DESIGN_SYSTEM.radius.sm, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                    <Download size={14} /> Use for PDF Generation →
                  </button>
                </div>
                {analyzeResult.summary && (
                  <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, lineHeight: 1.6, margin: '14px 0 0' }}>{analyzeResult.summary}</p>
                )}
              </div>

              {/* Flags */}
              {(analyzeResult.red_flags?.length > 0 || analyzeResult.green_flags?.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: DESIGN_SYSTEM.spacing.lg }}>
                  {analyzeResult.red_flags?.length > 0 && (
                    <div style={{ ...styles.card, borderTop: `3px solid ${DESIGN_SYSTEM.colors.accent.red}`, padding: DESIGN_SYSTEM.spacing.md }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12, fontWeight: 700, color: DESIGN_SYSTEM.colors.accent.red, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Flag size={12} /> Red Flags
                      </div>
                      {analyzeResult.red_flags.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                          <AlertTriangle size={13} color={DESIGN_SYSTEM.colors.accent.red} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.5 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {analyzeResult.green_flags?.length > 0 && (
                    <div style={{ ...styles.card, borderTop: '3px solid #4ade80', padding: DESIGN_SYSTEM.spacing.md }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <ShieldCheck size={12} /> Green Flags
                      </div>
                      {analyzeResult.green_flags.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                          <CheckCircle size={13} color="#4ade80" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.5 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Totals */}
              {analyzeResult.totals && (
                <div style={{ ...styles.card, display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: DESIGN_SYSTEM.spacing.lg }}>
                  {analyzeResult.totals.composition_total != null && (
                    <div>
                      <div style={{ fontSize: 11, color: DESIGN_SYSTEM.colors.text.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Composition</div>
                      <span style={{ fontSize: 20, fontWeight: 800, color: analyzeResult.totals.composition_sums_to_100 ? '#4ade80' : DESIGN_SYSTEM.colors.accent.red }}>{analyzeResult.totals.composition_total}%</span>
                      {analyzeResult.totals.composition_unassigned != null && <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.accent.amber, marginLeft: 8 }}>{analyzeResult.totals.composition_unassigned}% unassigned</span>}
                    </div>
                  )}
                  {analyzeResult.totals.master_total != null && (
                    <div>
                      <div style={{ fontSize: 11, color: DESIGN_SYSTEM.colors.text.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Master</div>
                      <span style={{ fontSize: 20, fontWeight: 800, color: analyzeResult.totals.master_sums_to_100 ? '#4ade80' : DESIGN_SYSTEM.colors.accent.red }}>{analyzeResult.totals.master_total}%</span>
                      {analyzeResult.totals.master_unassigned != null && <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.accent.amber, marginLeft: 8 }}>{analyzeResult.totals.master_unassigned}% unassigned</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Writers */}
              <div style={{ ...styles.card, marginBottom: DESIGN_SYSTEM.spacing.lg }}>
                <div style={styles.categoryLabel(DESIGN_SYSTEM.colors.text.secondary)}><Music size={13} /> Writers ({analyzeResult.writers?.length || 0})</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: DESIGN_SYSTEM.colors.bg.elevated }}>
                        {['Name', 'Role', 'Comp %', 'Master %', 'PRO', 'IPI', 'Confidence'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(analyzeResult.writers || []).map((w, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                          <td style={{ padding: '10px 10px' }}>
                            <div style={{ fontWeight: 600, color: DESIGN_SYSTEM.colors.text.primary }}>{w.legal_name}</div>
                            {w.stage_name && <div style={{ fontSize: 11, color: DESIGN_SYSTEM.colors.text.muted }}>"{w.stage_name}"</div>}
                          </td>
                          <td style={{ padding: '10px 10px', color: DESIGN_SYSTEM.colors.text.secondary }}>{w.role || '—'}</td>
                          <td style={{ padding: '10px 10px', color: COMP_COLOR, fontWeight: 700 }}>{w.composition_percentage != null ? `${w.composition_percentage}%` : '—'}</td>
                          <td style={{ padding: '10px 10px', color: MASTER_COLOR, fontWeight: 700 }}>{w.master_percentage != null ? `${w.master_percentage}%` : '—'}</td>
                          <td style={{ padding: '10px 10px', color: DESIGN_SYSTEM.colors.text.secondary }}>{w.pro || '—'}</td>
                          <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontSize: 12, color: w.ipi_format_valid === false ? DESIGN_SYSTEM.colors.accent.red : DESIGN_SYSTEM.colors.text.secondary }}>
                            {w.ipi || '—'}
                            {w.ipi_format_valid === false && <span style={{ marginLeft: 4, fontSize: 10, color: DESIGN_SYSTEM.colors.accent.red }}>invalid</span>}
                          </td>
                          <td style={{ padding: '10px 10px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: w.confidence === 'high' ? '#4ade80' : w.confidence === 'medium' ? DESIGN_SYSTEM.colors.accent.amber : DESIGN_SYSTEM.colors.accent.red }}>{w.confidence}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Analyze another */}
              <button onClick={() => { setAnalyzeFile(null); setAnalyzeResult(null); setAnalyzeError(null); }} style={{ ...styles.addBtn, width: '100%', justifyContent: 'center', marginBottom: 8 }}>
                <Upload size={14} /> Analyze another PDF
              </button>
            </>
          )}
        </>
      )}

      {/* ═══ GENERATE PDF TAB ═══ */}
      {activeTab === 'generate' && (() => {
        const doc = {
          bg: '#f9f8f5',
          card: '#ffffff',
          border: '#d8d4cc',
          borderLight: '#e8e4dc',
          labelColor: '#8a8278',
          textDark: '#1a1814',
          textMid: '#4a4640',
          inputBorder: '#c8c4bc',
          infoBg: '#f0ede8',
          pillSelected: { background: '#1a1814', color: '#fff', border: '1px solid #1a1814' },
          pillUnselected: { background: 'transparent', color: '#4a4640', border: '1px solid #c8c4bc' },
          serif: "Georgia, 'Times New Roman', serif",
          sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        };
        const docLabel = { fontFamily: doc.sans, fontSize: 10, fontWeight: 600, color: doc.labelColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' };
        const docInput = { fontFamily: doc.sans, fontSize: 13, color: doc.textDark, background: 'transparent', border: 'none', borderBottom: `1px solid ${doc.inputBorder}`, borderRadius: 0, padding: '5px 0', width: '100%', outline: 'none' };

        return (
          <>
            {genError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff3f3', border: '1px solid #f5c6c6', borderRadius: 6, marginBottom: 16, fontFamily: doc.sans, fontSize: 13, color: '#c0392b' }}>
                <AlertTriangle size={15} /> {genError}
              </div>
            )}

            {/* Document card */}
            <div style={{ background: doc.card, borderRadius: 10, border: `1px solid ${doc.border}`, overflow: 'hidden', fontFamily: doc.sans }}>

              {/* ── Document header ── */}
              <div style={{ padding: '28px 32px 20px', borderBottom: `2px solid ${doc.textDark}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h1 style={{ fontFamily: doc.serif, fontSize: 28, fontWeight: 700, color: doc.textDark, letterSpacing: '0.15em', margin: 0, textTransform: 'uppercase' }}>Split Sheet</h1>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: doc.labelColor, fontWeight: 600 }}>LegalSplits AI</div>
                    <div style={{ fontSize: 10, color: doc.labelColor }}>legalsplits.ai</div>
                  </div>
                </div>

                {/* Split type pills */}
                <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
                  {[['composition', 'Composition (Publishing)'], ['master', 'Master (Recording)'], ['both', 'Both']].map(([val, label]) => (
                    <button key={val} onClick={() => setGenSplitType(val)} style={{ ...(genSplitType === val ? doc.pillSelected : doc.pillUnselected), borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: doc.sans, transition: 'all 0.15s' }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* ── Song title ── */}
              <div style={{ padding: '20px 32px', borderBottom: `1px solid ${doc.borderLight}` }}>
                <label style={docLabel}>Song Title</label>
                <input
                  style={{ ...docInput, fontFamily: doc.serif, fontSize: 24, fontWeight: 700, letterSpacing: '0.01em', borderBottomColor: genSongTitle ? 'transparent' : doc.inputBorder }}
                  value={genSongTitle}
                  onChange={e => setGenSongTitle(e.target.value)}
                  placeholder="Untitled"
                />
              </div>

              {/* ── Date / ISRC / UPC ── */}
              <div style={{ padding: '20px 32px', borderBottom: `1px solid ${doc.borderLight}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                  <div>
                    <label style={docLabel}>Agreement Date *</label>
                    <input style={docInput} type="date" value={genDate} onChange={e => setGenDate(e.target.value)} />
                  </div>
                  <div>
                    <label style={docLabel}>ISRC</label>
                    <input style={docInput} value={genIsrc} onChange={e => setGenIsrc(e.target.value)} placeholder="CC-XXX-YY-NNNNN" />
                  </div>
                  <div>
                    <label style={docLabel}>UPC</label>
                    <input style={docInput} value={genUpc} onChange={e => setGenUpc(e.target.value)} placeholder="Universal Product Code" />
                  </div>
                </div>
              </div>

              {/* ── Label / Notes ── */}
              <div style={{ padding: '20px 32px', borderBottom: `1px solid ${doc.borderLight}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>
                    <label style={docLabel}>Record Label</label>
                    <input style={docInput} value={genLabel} onChange={e => setGenLabel(e.target.value)} placeholder="Unsigned" />
                  </div>
                  <div>
                    <label style={docLabel}>Notes</label>
                    <input style={docInput} value={genNotes} onChange={e => setGenNotes(e.target.value)} placeholder="Additional notes or special terms" />
                  </div>
                </div>
              </div>

              {/* ── Samples checkbox ── */}
              <div style={{ padding: '16px 32px', borderBottom: `1px solid ${doc.borderLight}` }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: doc.textMid, fontFamily: doc.sans }}>
                  <input type="checkbox" checked={genHasSamples} onChange={e => setGenHasSamples(e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer', accentColor: doc.textDark }} />
                  This song contains a sample from another recording
                </label>
                {genHasSamples && (
                  <textarea style={{ ...docInput, marginTop: 12, borderBottom: `1px solid ${doc.inputBorder}`, resize: 'vertical', minHeight: 52, fontSize: 13 }} value={genSampleInfo} onChange={e => setGenSampleInfo(e.target.value)} placeholder="Describe the sample(s) used…" />
                )}
              </div>

              {/* ── Legal boilerplate ── */}
              <div style={{ padding: '16px 32px', borderBottom: `1px solid ${doc.borderLight}` }}>
                <p style={{ fontFamily: doc.serif, fontStyle: 'italic', fontSize: 12, color: doc.labelColor, lineHeight: 1.6, margin: 0 }}>
                  This Split Sheet Agreement is entered into by the parties listed below regarding the musical composition and/or sound recording identified herein. All parties agree that the ownership percentages set forth below are accurate and legally binding upon execution by all parties.
                </p>
              </div>

              {/* ── Writer's share info box ── */}
              <div style={{ padding: '14px 32px', borderBottom: `1px solid ${doc.borderLight}` }}>
                <div style={{ background: doc.infoBg, borderRadius: 6, padding: '12px 16px' }}>
                  <p style={{ fontFamily: doc.sans, fontSize: 12, color: doc.textMid, lineHeight: 1.6, margin: 0 }}>
                    <strong>Writer's Share vs. Publisher's Share:</strong> Per industry standard (ASCAP/BMI/SESAC), each writer's ownership percentage is divided equally at the PRO level — 50% is paid as the Writer's Share (directly to the writer) and 50% as the Publisher's Share (to their publisher). Both shares are listed per writer below.
                  </p>
                </div>
              </div>

              {/* ── Contributors & Publishers ── */}
              <div style={{ padding: '24px 32px' }}>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ fontFamily: doc.sans, fontSize: 11, fontWeight: 700, color: doc.textDark, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Contributors &amp; Publishers</h2>
                </div>

                {genWriters.map((w, i) => (
                  <div key={i} style={{ border: `1px solid ${doc.border}`, borderRadius: 6, marginBottom: 12, overflow: 'hidden' }}>
                    {/* Writer card header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: doc.infoBg, borderBottom: w._expanded ? `1px solid ${doc.border}` : 'none' }}>
                      <button onClick={() => updateGenWriter(i, '_expanded', !w._expanded)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <span style={{ fontFamily: doc.sans, fontWeight: 600, fontSize: 13, color: doc.textDark }}>
                          Writer {i + 1}{w.legal_name ? ` — ${w.legal_name}` : ''}
                        </span>
                        {w._expanded ? <ChevronUp size={14} color={doc.labelColor} /> : <ChevronDown size={14} color={doc.labelColor} />}
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: doc.sans, fontSize: 12, color: doc.textMid }}>
                          Comp: <strong>{w.composition_percentage || 0}%</strong>
                        </span>
                        {genWriters.length > 1 && (
                          <button onClick={() => setGenWriters(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: doc.labelColor, padding: 2, display: 'flex', alignItems: 'center' }}>
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Writer card body */}
                    {w._expanded && (
                      <div style={{ padding: '18px 16px' }}>
                        {/* Row 1: Legal name / Stage name / Email */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 18 }}>
                          <div>
                            <label style={docLabel}>Legal Name *</label>
                            <input style={docInput} value={w.legal_name} onChange={e => updateGenWriter(i, 'legal_name', e.target.value)} placeholder="Full legal name" />
                          </div>
                          <div>
                            <label style={docLabel}>Stage / Artist Name</label>
                            <input style={docInput} value={w.stage_name} onChange={e => updateGenWriter(i, 'stage_name', e.target.value)} placeholder="Optional" />
                          </div>
                          <div>
                            <label style={docLabel}>Email Address</label>
                            <input style={docInput} type="email" value={w.email} onChange={e => updateGenWriter(i, 'email', e.target.value)} placeholder="writer@email.com" />
                          </div>
                        </div>

                        {/* Row 2: Role / PRO / IPI */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 18 }}>
                          <div>
                            <label style={docLabel}>Role / Contribution *</label>
                            <select style={{ ...docInput, cursor: 'pointer' }} value={w.role} onChange={e => updateGenWriter(i, 'role', e.target.value)}>
                              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={docLabel}>PRO Affiliation *</label>
                            <select style={{ ...docInput, cursor: 'pointer' }} value={w.pro} onChange={e => updateGenWriter(i, 'pro', e.target.value)}>
                              {PROS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={docLabel}>IPI / CAE Number</label>
                            <input style={docInput} value={w.ipi} onChange={e => updateGenWriter(i, 'ipi', e.target.value)} placeholder="9–11 digit number" />
                          </div>
                        </div>

                        {/* Row 3: Comp % / Master % / Contribution notes */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 14 }}>
                          <div>
                            <label style={{ ...docLabel, color: COMP_COLOR }}>Composition % *</label>
                            <input style={{ ...docInput, borderBottomColor: COMP_COLOR + '80' }} type="number" min="0" max="100" step="0.1" value={w.composition_percentage} onChange={e => updateGenWriter(i, 'composition_percentage', e.target.value)} placeholder="0" />
                          </div>
                          <div>
                            <label style={{ ...docLabel, color: MASTER_COLOR }}>Master %</label>
                            <input style={{ ...docInput, borderBottomColor: MASTER_COLOR + '80' }} type="number" min="0" max="100" step="0.1" value={w.master_percentage} onChange={e => updateGenWriter(i, 'master_percentage', e.target.value)} placeholder="0" />
                          </div>
                          <div>
                            <label style={docLabel}>Specific Contribution (Optional)</label>
                            <input style={docInput} value={w.contribution_notes} onChange={e => updateGenWriter(i, 'contribution_notes', e.target.value)} placeholder="e.g. wrote chorus melody" />
                          </div>
                        </div>

                        {/* Publisher toggle */}
                        <button onClick={() => updateGenWriter(i, '_showPublisher', !w._showPublisher)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: doc.labelColor, fontFamily: doc.sans, padding: 0, marginBottom: w._showPublisher ? 14 : 0 }}>
                          {w._showPublisher ? <ChevronUp size={13} /> : <Plus size={13} />}
                          {w._showPublisher ? 'Hide Publisher Details' : '+ Add Publisher Details'}
                        </button>

                        {w._showPublisher && (
                          <div style={{ background: doc.infoBg, borderRadius: 6, padding: '14px 16px' }}>
                            <div style={{ fontFamily: doc.sans, fontSize: 10, fontWeight: 700, color: doc.labelColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Publisher</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 20, alignItems: 'end' }}>
                              <div>
                                <label style={docLabel}>Publisher Name</label>
                                <input style={docInput} value={w.publisher.name} onChange={e => updateGenWriterPublisher(i, 'name', e.target.value)} placeholder="Publisher LLC" />
                              </div>
                              <div>
                                <label style={docLabel}>PRO</label>
                                <select style={{ ...docInput, cursor: 'pointer' }} value={w.publisher.pro} onChange={e => updateGenWriterPublisher(i, 'pro', e.target.value)}>
                                  {PROS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={docLabel}>Publisher IPI</label>
                                <input style={docInput} value={w.publisher.ipi} onChange={e => updateGenWriterPublisher(i, 'ipi', e.target.value)} placeholder="Optional" />
                              </div>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: doc.textMid, fontFamily: doc.sans, paddingBottom: 6, whiteSpace: 'nowrap' }}>
                                <input type="checkbox" checked={w.publisher.is_self_published} onChange={e => updateGenWriterPublisher(i, 'is_self_published', e.target.checked)} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                                Self-published
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ── + Add Writer / Contributor link ── */}
              <div style={{ padding: '0 32px 20px', borderBottom: `1px solid ${doc.borderLight}` }}>
                <button onClick={() => setGenWriters(prev => [...prev, blankWriter()])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 13, fontFamily: doc.sans, padding: 0, textDecoration: 'underline' }}>
                  + Add Writer / Contributor
                </button>
              </div>

              {/* ── Composition % tracker ── */}
              <div style={{ padding: '12px 32px', borderBottom: `1px solid ${doc.borderLight}`, display: 'flex', justifyContent: 'flex-end' }}>
                {(() => {
                  const assigned = genWriters.reduce((sum, w) => sum + (parseFloat(w.composition_percentage) || 0), 0);
                  const unassigned = Math.max(0, 100 - assigned);
                  const over = assigned > 100;
                  return (
                    <span style={{ fontFamily: doc.sans, fontSize: 12, color: over ? '#c0392b' : doc.labelColor }}>
                      ○ Composition: {assigned}%{unassigned > 0 ? ` — ${unassigned}% unassigned` : over ? ' — over 100%' : ' — ✓ complete'}
                    </span>
                  );
                })()}
              </div>

              {/* ── Signatures ── */}
              <div style={{ padding: '28px 32px', borderBottom: `1px solid ${doc.borderLight}` }}>
                <h2 style={{ fontFamily: doc.sans, fontSize: 11, fontWeight: 700, color: doc.textDark, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Signatures</h2>
                <p style={{ fontFamily: doc.serif, fontStyle: 'italic', fontSize: 12, color: doc.labelColor, lineHeight: 1.6, marginBottom: 24 }}>
                  By signing below, each party confirms that the information is accurate and agrees to the ownership splits stated herein.
                </p>
                {genWriters.map((w, i) => (
                  <div key={i} style={{ marginBottom: 28 }}>
                    <div style={{ borderBottom: `1px solid ${doc.textDark}`, width: '55%', marginBottom: 6 }} />
                    <div style={{ fontFamily: doc.serif, fontWeight: 700, fontSize: 14, color: doc.textDark, marginBottom: 4 }}>{w.legal_name || `Writer ${i + 1}`}</div>
                    <div style={{ fontFamily: doc.sans, fontSize: 12, color: doc.labelColor }}>Date: <span style={{ display: 'inline-block', borderBottom: `1px solid ${doc.inputBorder}`, minWidth: 140, marginLeft: 4 }} /></div>
                  </div>
                ))}
              </div>

              {/* ── Document footer ── */}
              <div style={{ padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: doc.sans, fontSize: 11, color: doc.labelColor }}>Generated by LegalSplits AI · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span style={{ fontFamily: doc.sans, fontSize: 11, color: doc.labelColor }}>This document does not constitute legal advice.</span>
              </div>
            </div>

            {/* ── Action bar ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button onClick={handleSaveToDashboard} disabled={genSaving} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: 7, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 13, cursor: genSaving ? 'not-allowed' : 'pointer', opacity: genSaving ? 0.7 : 1 }}>
                {genSaving ? <><div style={styles.spinner} /> Saving…</> : <><FileText size={14} /> Save to Dashboard</>}
              </button>
              <button onClick={handleGeneratePdf} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: 7, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 13, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}>
                {generating ? <><div style={styles.spinner} /> Generating…</> : <><Download size={14} /> Generate PDF</>}
              </button>
              <button onClick={handleNewSplitSheet} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'transparent', color: DESIGN_SYSTEM.colors.text.primary, border: `2px solid ${DESIGN_SYSTEM.colors.text.primary}`, borderRadius: 7, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                <Plus size={14} /> + New Split Sheet
              </button>
              {!genSongTitle.trim() && (
                <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, color: DESIGN_SYSTEM.colors.text.muted }}>Add a song title to continue</span>
              )}
            </div>

            {/* ── Saved Split Sheets ── */}
            {(savedSheets.length > 0 || loadingHistory) && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.secondary, marginBottom: 12 }}>Saved Split Sheets</h3>
                {loadingHistory ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13 }}><div style={styles.spinner} /> Loading…</div>
                ) : (
                  savedSheets.map(sheet => (
                    <div key={sheet.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: DESIGN_SYSTEM.colors.text.primary, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>{sheet.song_title || 'Untitled'}</div>
                        <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.muted, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", marginTop: 2 }}>
                          {sheet.created_at ? new Date(sheet.created_at).toLocaleDateString() : ''} · {((sheet.splits?.composition || []).length + (sheet.splits?.master || []).length)} writers · saved {sheet.created_at ? new Date(sheet.created_at).toLocaleDateString() : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => {
                          const comp = sheet.splits?.composition || [];
                          setGenSongTitle(sheet.song_title || '');
                          setGenWriters(comp.length > 0 ? comp.map(s => ({ ...blankWriter(), legal_name: s.name || '', role: s.role || 'Songwriter', composition_percentage: s.percentage || 0, pro: s.pro || 'ASCAP', ipi: s.ipi || '' })) : [blankWriter()]);
                        }} style={{ padding: '5px 14px', background: DESIGN_SYSTEM.colors.bg.elevated, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: DESIGN_SYSTEM.colors.text.primary }}>Load</button>
                        <button onClick={() => setDeleteTarget(sheet)} style={{ padding: '5px 14px', background: 'transparent', border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}40`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: DESIGN_SYSTEM.colors.accent.red }}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        );
      })()}

      {/* ═══ HISTORY TAB ═══ */}
      {activeTab === 'history' && (
        <>
          {loadingHistory ? (
            <div style={styles.loadingSpinner}>
              <div style={styles.spinner} />
              <p style={{ color: DESIGN_SYSTEM.colors.text.secondary }}>Loading split sheets...</p>
            </div>
          ) : savedSheets.length === 0 ? (
            <div style={styles.emptyState}>
              <FileText size={40} color={DESIGN_SYSTEM.colors.text.muted} style={{ marginBottom: 12 }} />
              <p>No split sheets yet. Create your first one!</p>
            </div>
          ) : (
            savedSheets.map((sheet) => {
              const isExpanded = expandedSheet === sheet.id;
              const legacy = isLegacyFormat(sheet.splits);
              const compSplits = legacy ? sheet.splits : (sheet.splits?.composition || []);
              const mastSplits = legacy ? [] : (sheet.splits?.master || []);
              const totalContributors = compSplits.length + mastSplits.length;

              return (
                <div key={sheet.id} style={styles.historyCard} onClick={() => setExpandedSheet(isExpanded ? null : sheet.id)}>
                  <div style={styles.historyHeader}>
                    <div>
                      <div style={styles.historyTitle}>{sheet.song_title || 'Untitled Split Sheet'}</div>
                      <div style={styles.historyMeta}>
                        <Clock size={12} />
                        {formatDate(sheet.created_at)}
                        <span style={{ margin: '0 4px' }}>-</span>
                        {totalContributors} contributor{totalContributors !== 1 ? 's' : ''}
                        {sheet.input_method && (
                          <>
                            <span style={{ margin: '0 4px' }}>-</span>
                            {sheet.input_method === 'voice' ? 'Voice' : sheet.input_method === 'scan' ? 'Scan' : sheet.input_method === 'auto_one_stop' ? 'Auto (One-Stop)' : sheet.input_method}
                          </>
                        )}
                        {!sheet.song_id && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: DESIGN_SYSTEM.colors.text.muted, background: `${DESIGN_SYSTEM.colors.bg.surface}`, padding: '1px 6px', borderRadius: 4 }}>Unlinked</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={(e) => handleDownloadHistoryPdf(e, sheet)}
                        style={{ ...styles.removeBtn, color: DESIGN_SYSTEM.colors.brand.primary }} title="Download PDF">
                        <Download size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(sheet); }}
                        style={{ ...styles.removeBtn, color: DESIGN_SYSTEM.colors.accent.red }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                      {isExpanded ? <ChevronUp size={16} color={DESIGN_SYSTEM.colors.text.muted} /> : <ChevronDown size={16} color={DESIGN_SYSTEM.colors.text.muted} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: DESIGN_SYSTEM.spacing.md, paddingTop: DESIGN_SYSTEM.spacing.md, borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                      {/* Composition section */}
                      {compSplits.length > 0 && (
                        <div style={{ marginBottom: DESIGN_SYSTEM.spacing.md }}>
                          <div style={styles.categoryLabel(legacy ? DESIGN_SYSTEM.colors.text.secondary : COMP_COLOR)}>
                            {legacy ? <FileText size={12} /> : <Music size={12} />}
                            {legacy ? 'Splits (Legacy)' : 'Composition / Publishing'}
                          </div>
                          {compSplits.map((s, j) => (
                            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 12px', background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.sm, marginBottom: 4 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: DESIGN_SYSTEM.fontSize.md, fontWeight: 600 }}>
                                  {s.name}
                                </span>
                                {s.role && <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.sm }}> · {s.role}</span>}
                                {(s.ipi || s.pro) && (
                                  <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                                    {s.pro && <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: `${legacy ? DESIGN_SYSTEM.colors.text.secondary : COMP_COLOR}18`, color: legacy ? DESIGN_SYSTEM.colors.text.secondary : COMP_COLOR, border: `1px solid ${legacy ? DESIGN_SYSTEM.colors.text.secondary : COMP_COLOR}30` }}>{s.pro}</span>}
                                    {s.ipi && <span style={{ fontSize: 11, fontFamily: 'monospace', color: DESIGN_SYSTEM.colors.text.muted, padding: '1px 6px', borderRadius: 4, background: DESIGN_SYSTEM.colors.bg.elevated, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>IPI {s.ipi}</span>}
                                  </div>
                                )}
                              </div>
                              <span style={{ color: legacy ? DESIGN_SYSTEM.colors.text.secondary : COMP_COLOR, fontWeight: DESIGN_SYSTEM.fontWeight.bold, marginLeft: 10, flexShrink: 0 }}>{s.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Master section */}
                      {mastSplits.length > 0 && (
                        <div style={{ marginBottom: DESIGN_SYSTEM.spacing.md }}>
                          <div style={styles.categoryLabel(MASTER_COLOR)}>
                            <Disc size={12} /> Master Recording
                          </div>
                          {mastSplits.map((s, j) => (
                            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 12px', background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.sm, marginBottom: 4 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: DESIGN_SYSTEM.fontSize.md, fontWeight: 600 }}>
                                  {s.name}
                                </span>
                                {s.role && <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.sm }}> · {s.role}</span>}
                                {(s.ipi || s.pro) && (
                                  <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                                    {s.pro && <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: `${MASTER_COLOR}18`, color: MASTER_COLOR, border: `1px solid ${MASTER_COLOR}30` }}>{s.pro}</span>}
                                    {s.ipi && <span style={{ fontSize: 11, fontFamily: 'monospace', color: DESIGN_SYSTEM.colors.text.muted, padding: '1px 6px', borderRadius: 4, background: DESIGN_SYSTEM.colors.bg.elevated, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>IPI {s.ipi}</span>}
                                  </div>
                                )}
                              </div>
                              <span style={{ color: MASTER_COLOR, fontWeight: DESIGN_SYSTEM.fontWeight.bold, marginLeft: 10, flexShrink: 0 }}>{s.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: DESIGN_SYSTEM.fontSize.xs, color: DESIGN_SYSTEM.colors.text.muted }}>
                        Signed by: <strong style={{ color: DESIGN_SYSTEM.colors.text.secondary }}>{sheet.signature}</strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Split Sheet"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.song_title || 'Untitled Split Sheet'}"? This cannot be undone.` : ''}
        onConfirm={() => deleteTarget && handleDeleteSheet(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
