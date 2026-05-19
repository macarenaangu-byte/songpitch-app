import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, ChevronDown, ChevronUp, Clock, X, Music, Disc, Search, CheckCircle, AlertTriangle, Equal } from 'lucide-react';
import { DESIGN_SYSTEM } from '../../constants/designSystem';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { enrichSplits } from '../../services/legalsplits';
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

/** Round all percentages to 2 decimals, adjust first contributor so total is exactly 100 */
const normalizePercentages = (splits) => {
  if (!splits || splits.length === 0) return splits;
  const rounded = splits.map(s => ({ ...s, percentage: Math.round((parseFloat(s.percentage) || 0) * 100) / 100 }));
  const sum = rounded.reduce((acc, s) => acc + s.percentage, 0);
  const diff = Math.round((100 - sum) * 100) / 100;
  if (diff !== 0 && rounded.length > 0) {
    rounded[0] = { ...rounded[0], percentage: Math.round((rounded[0].percentage + diff) * 100) / 100 };
  }
  return rounded;
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
  const [proEnrichedData, setProEnrichedData] = useState(null); // EnrichSplitsResponse
  const [proEnrichError, setProEnrichError] = useState(null);

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
    if (activeTab === 'history' && userProfile?.id) {
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
