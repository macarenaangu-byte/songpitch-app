// DealAnalyzerPage.jsx
// Pro composer feature — upload a recording deal, distribution, publishing,
// co-pub, or 360 agreement PDF and get a full LegalSplits ML analysis.

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, X, Lock, ChevronDown, ChevronUp, Music, UserCheck, Archive, Trash2, Clock } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { useTier } from '../hooks/useTier';
import UpgradeModal from '../components/UpgradeModal';

const GOLD   = '#C9A84C';
const RED    = '#f87171';
const GREEN  = '#4ade80';
const PURPLE = '#8B5CF6';

const API_URL = process.env.REACT_APP_LEGALSPLITS_API_URL ?? 'https://legalsplits-ai.onrender.com';
const API_KEY = process.env.REACT_APP_LEGALSPLITS_API_KEY ?? '';

const FAIRNESS_CONFIG = {
  creator_unfavorable: { color: RED,    label: 'Creator Unfavorable', bg: 'rgba(248,113,113,0.10)' },
  below_standard:      { color: '#fbbf24', label: 'Below Standard',   bg: 'rgba(251,191,36,0.10)'  },
  standard:            { color: '#94a3b8', label: 'Standard',          bg: 'rgba(148,163,184,0.10)' },
  above_standard:      { color: GREEN,  label: 'Above Standard',       bg: 'rgba(74,222,128,0.10)'  },
  creator_favorable:   { color: GREEN,  label: 'Creator Favorable',    bg: 'rgba(74,222,128,0.12)'  },
};

const ASSESSMENT_COLOR = { below: RED, standard: '#94a3b8', above: GREEN };

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', color: DESIGN_SYSTEM.colors.text.primary }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.3px' }}>{title}</span>
        {open ? <ChevronUp size={15} color='#7A7468' /> : <ChevronDown size={15} color='#7A7468' />}
      </button>
      {open && <div style={{ padding: '0 18px 18px' }}>{children}</div>}
    </div>
  );
}

export function DealAnalyzerPage({ userProfile }) {
  const { can } = useTier(userProfile);
  const canUse   = can('dealAnalyzer');
  const canVault = can('contractVault');
  const [upgradeModal, setUpgradeModal] = useState(false);

  const [tab, setTab]               = useState('analyze'); // 'analyze' | 'vault'
  const [file, setFile]             = useState(null);
  const [contractName, setContractName] = useState('');
  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [saving, setSaving]         = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');
  const [endpoint, setEndpoint]     = useState('analyze-deal');
  const fileRef = useRef();
  const progressRef = useRef(null);

  const startProgress = useCallback(() => {
    setProgress(0);
    let current = 0;
    progressRef.current = setInterval(() => {
      current += current < 60 ? 3 : current < 80 ? 1.2 : 0.3;
      if (current >= 90) current = 90;
      setProgress(current);
    }, 300);
  }, []);

  const finishProgress = useCallback(() => {
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
    setProgress(100);
    setTimeout(() => setProgress(0), 600);
  }, []);

  // Vault
  const [vault, setVault]           = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [selected, setSelected]     = useState(null);

  // Assign parties to song
  const [songs, setSongs]               = useState([]);
  const [selectedSong, setSelectedSong] = useState('');
  const [assigning, setAssigning]       = useState(false);
  const [assigned, setAssigned]         = useState(false);

  // Load vault on mount
  useEffect(() => {
    if (canVault && userProfile) loadVault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canVault, userProfile]);

  // Load user's songs when result arrives
  useEffect(() => {
    if (result && userProfile) {
      supabase.from('songs')
        .select('id, title')
        .eq('composer_id', userProfile.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setSongs(data ?? []));
    }
  }, [result, userProfile]);

  async function loadVault() {
    setVaultLoading(true);
    const { data } = await supabase
      .from('contract_revisions')
      .select('*')
      .eq('user_id', userProfile.user_id ?? userProfile.id)
      .eq('contract_type', 'deal_analysis')
      .order('created_at', { ascending: false });
    setVault(data ?? []);
    setVaultLoading(false);
  }

  const saveToVault = async () => {
    if (!result || !canVault) return;
    setSaving(true);
    try {
      const { error: err } = await supabase.from('contract_revisions').insert([{
        user_id:       userProfile.user_id ?? userProfile.id,
        contract_name: contractName || file?.name?.replace('.pdf', '') || 'Untitled Deal',
        contract_type: 'deal_analysis',
        analysis:      result,
        fairness:      result.overall_fairness ?? null,
        summary:       result.summary ?? null,
        red_flags:     result.red_flags ?? [],
        green_flags:   result.green_flags ?? [],
      }]);
      if (err) throw err;
      showToast.success('Saved to Deal Vault ✓');
      loadVault();
    } catch (e) {
      showToast.error('Could not save to vault: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteFromVault = async (id) => {
    await supabase.from('contract_revisions').delete().eq('id', id);
    setVault(v => v.filter(r => r.id !== id));
    if (selected?.id === id) setSelected(null);
    showToast.success('Removed from vault');
  };

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { setError('Only PDF files are supported.'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('File must be under 10 MB.'); return; }
    setFile(f); setError(''); setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!file) return;
    if (!canUse) { setUpgradeModal(true); return; }

    setLoading(true); setError(''); setResult(null);
    startProgress();
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch(`${API_URL}/api/v1/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}` },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Analysis failed (${res.status})`);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      finishProgress();
      setLoading(false);
    }
  };

  // Assign contract parties to a song's split sheet (INSERT new entry)
  const assignToSong = async () => {
    if (!selectedSong || !result?.parties?.length) return;
    setAssigning(true);
    try {
      const song = songs.find(s => s.id === selectedSong);
      const splitsPayload = result.parties.map(p => ({
        name:       p.name,
        role:       p.role ?? '',
        percentage: p.composition_percentage ?? p.master_percentage ?? 0,
        ipi:        p.ipi ?? null,
        pro:        p.pro ?? null,
      }));
      // split_sheets.user_id references user_profiles(id) → use profile ID
      const { error } = await supabase.from('split_sheets').insert({
        user_id:      userProfile.id,
        song_title:   song?.title ?? 'Unknown',
        splits:       splitsPayload,
        signature:    `deal_analyzer_${Date.now()}`,
        attested:     false,
        input_method: 'deal_analyzer',
      });
      if (error) throw error;
      setAssigned(true);
      showToast.success(`Split sheet created for "${song?.title}" ✓`);
    } catch (err) {
      showToast.error('Could not assign to song: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const fairness = result ? (FAIRNESS_CONFIG[result.overall_fairness] ?? FAIRNESS_CONFIG.standard) : null;

  return (
    <div className="page-enter" style={{ padding: '32px 36px', minHeight: '100%', overflowY: 'auto', maxWidth: 860, margin: '0 auto' }}>

      <UpgradeModal
        isOpen={upgradeModal}
        onClose={() => setUpgradeModal(false)}
        feature="Deal Analyzer is a Pro feature. Upload any recording deal or publishing agreement and get an instant AI-powered analysis."
        userProfile={userProfile}
        defaultTier="pro"
      />

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: DESIGN_SYSTEM.colors.text.primary, margin: '0 0 6px', fontFamily: "'Space Grotesk', sans-serif" }}>
          Deal Analyzer
        </h1>
        <p style={{ color: '#7A7468', fontSize: 14, margin: 0 }}>
          Upload any recording deal, distribution, publishing, co-pub, or 360 agreement — powered by LegalSplits ML.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'analyze', label: '🔍 Analyze Deal' },
          { key: 'vault',   label: `🗄 Deal Vault (${vault.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: tab === t.key ? `1.5px solid ${GOLD}` : '1.5px solid rgba(255,255,255,0.08)',
            background: tab === t.key ? 'rgba(201,168,76,0.10)' : 'transparent',
            color: tab === t.key ? GOLD : '#7A7468',
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Vault tab ──────────────────────────────────────────────────── */}
      {tab === 'vault' && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.6fr' : '1fr', gap: 18 }}>
          {/* Vault list */}
          <div>
            {vaultLoading ? (
              <div style={{ color: '#7A7468', fontSize: 14, textAlign: 'center', padding: 40 }}>Loading vault...</div>
            ) : vault.length === 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 14, padding: 32, textAlign: 'center' }}>
                <Archive size={28} color='#3A3630' style={{ marginBottom: 10 }} />
                <div style={{ color: '#7A7468', fontSize: 14 }}>No deals saved yet. Analyze one and save it to your vault.</div>
              </div>
            ) : (
              vault.map(item => (
                <div key={item.id} onClick={() => setSelected(selected?.id === item.id ? null : item)} style={{
                  background: selected?.id === item.id ? 'rgba(201,168,76,0.07)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selected?.id === item.id ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 12, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.contract_name}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {item.fairness && <span style={{ fontSize: 11, fontWeight: 600, color: (FAIRNESS_CONFIG[item.fairness] ?? FAIRNESS_CONFIG.standard).color }}>{(FAIRNESS_CONFIG[item.fairness] ?? FAIRNESS_CONFIG.standard).label}</span>}
                        <span style={{ fontSize: 11, color: '#4A4640', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteFromVault(item.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A4640', padding: 4, marginLeft: 8 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Vault detail panel */}
          {selected && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, overflowY: 'auto', maxHeight: '75vh' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary, marginBottom: 14 }}>{selected.contract_name}</div>
              {selected.analysis && <VaultResultsPanel result={selected.analysis} userProfile={userProfile} />}
            </div>
          )}
        </div>
      )}

      {/* ── Analyze tab ────────────────────────────────────────────────── */}
      {tab === 'analyze' && <>

      {/* Pro lock banner for non-pro users */}
      {!canUse && (
        <div onClick={() => setUpgradeModal(true)} style={{
          background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 14, padding: '14px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
        }}>
          <Lock size={16} color={GOLD} />
          <div>
            <div style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>Pro Feature</div>
            <div style={{ color: '#7A7468', fontSize: 12 }}>Upgrade to Pro to unlock Deal Analyzer — click to upgrade.</div>
          </div>
        </div>
      )}

      {/* Contract type selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { value: 'analyze-deal', label: '🎵 Recording / Distribution Deal' },
          { value: 'analyze-agreement', label: '📄 Publishing / Co-Pub / 360' },
        ].map(opt => (
          <button key={opt.value} onClick={() => setEndpoint(opt.value)} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: endpoint === opt.value ? `1.5px solid ${GOLD}` : '1.5px solid rgba(255,255,255,0.08)',
            background: endpoint === opt.value ? 'rgba(201,168,76,0.10)' : 'transparent',
            color: endpoint === opt.value ? GOLD : '#7A7468',
            transition: 'all 0.15s',
          }}>{opt.label}</button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${file ? GOLD : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 16, padding: '36px 24px', textAlign: 'center',
          background: file ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)',
          cursor: 'pointer', transition: 'all 0.2s', marginBottom: 20,
        }}>
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <FileText size={22} color={GOLD} />
            <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{file.name}</span>
            <button onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A7468', padding: 0 }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={28} color='#4A4640' style={{ marginBottom: 10 }} />
            <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Drop your contract PDF here</div>
            <div style={{ color: '#7A7468', fontSize: 12 }}>or click to browse — max 10 MB</div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: RED, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Contract name for vault */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Contract Name (for vault)</div>
        <input
          value={contractName}
          onChange={e => setContractName(e.target.value)}
          placeholder={file?.name?.replace('.pdf', '') || 'e.g. Sony Distribution Deal 2025'}
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '9px 13px', color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, boxSizing: 'border-box' }}
        />
      </div>

      {/* Progress bar — visible while AI reads the contract */}
      {loading && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#7A7468', fontWeight: 600, letterSpacing: '0.5px' }}>
              Reading contract…
            </span>
            <span style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${GOLD}, #A8832A)`,
              transition: 'width 0.3s ease',
              boxShadow: `0 0 8px rgba(201,168,76,0.5)`,
            }} />
          </div>
          <div style={{ fontSize: 10, color: '#4A4640', marginTop: 4 }}>
            AI analysis typically takes 15–30 seconds
          </div>
        </div>
      )}

      {/* Analyze button */}
      <button onClick={analyze} disabled={!file || loading} style={{
        width: '100%', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700,
        background: !file || loading ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${GOLD}, #A8832A)`,
        color: !file || loading ? '#4A4640' : '#000',
        border: 'none', cursor: !file || loading ? 'not-allowed' : 'pointer',
        fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.2s', marginBottom: 28,
      }}>
        {loading ? '🔍 Analyzing your contract...' : 'Analyze Contract'}
      </button>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {result && (
        <div>
          {/* Fairness header */}
          <div style={{ background: fairness.bg, border: `1px solid ${fairness.color}30`, borderRadius: 14, padding: '18px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Overall Assessment</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: fairness.color, fontFamily: "'Space Grotesk', sans-serif" }}>{fairness.label}</div>
              {result.deal_type && <div style={{ fontSize: 12, color: '#7A7468', marginTop: 4, textTransform: 'capitalize' }}>{result.deal_type.replace('_', ' ')} Agreement</div>}
            </div>
            <button onClick={saveToVault} disabled={saving || !canVault} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9,
              fontSize: 12, fontWeight: 700,
              background: canVault ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${canVault ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: canVault ? GOLD : '#4A4640', cursor: canVault ? 'pointer' : 'not-allowed',
            }}>
              <Archive size={13} />
              {saving ? 'Saving...' : '🗄 Save to Vault'}
            </button>
          </div>

          {/* Summary */}
          <Section title="📋 Summary">
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{result.summary}</p>
          </Section>

          {/* Contract Parties & Rights Verification */}
          {result.parties?.length > 0 && (
            <Section title="👥 Contract Parties & Rights Verification">
              {/* Party table */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr', gap: 8, padding: '5px 0 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Name', 'Role', 'Comp %', 'Master %', 'IPI', 'PRO'].map(h => (
                    <span key={h} style={{ fontSize: 10, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</span>
                  ))}
                </div>
                {result.parties.map((party, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr', gap: 8, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.primary }}>{party.name}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{party.role}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: party.composition_percentage != null ? GOLD : '#4A4640' }}>
                      {party.composition_percentage != null ? `${party.composition_percentage}%` : '—'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: party.master_percentage != null ? GOLD : '#4A4640' }}>
                      {party.master_percentage != null ? `${party.master_percentage}%` : '—'}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: party.ipi ? GOLD : '#4A4640' }}>
                      {party.ipi ?? '—'}
                    </span>
                    <span style={{ fontSize: 12, color: party.pro ? GREEN : '#4A4640' }}>
                      {party.pro ?? '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* IPI notice if none found */}
              {result.parties.every(p => !p.ipi && !p.pro) && (
                <p style={{ fontSize: 12, color: '#4A4640', margin: '0 0 14px', fontStyle: 'italic' }}>
                  No IPI numbers or PRO affiliations found in this contract. Add them manually to your Split Sheet.
                </p>
              )}

              {/* Assign to Song */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Music size={15} color='#7A7468' />
                <span style={{ fontSize: 12, color: '#7A7468', fontWeight: 600 }}>Assign parties to song:</span>
                <select
                  value={selectedSong}
                  onChange={e => { setSelectedSong(e.target.value); setAssigned(false); }}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 12px', color: DESIGN_SYSTEM.colors.text.primary, fontSize: 12, cursor: 'pointer', flex: 1, minWidth: 160 }}
                >
                  <option value="">— Select a song —</option>
                  {songs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                <button onClick={assignToSong} disabled={!selectedSong || assigning || assigned} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                  background: assigned ? 'rgba(74,222,128,0.12)' : selectedSong ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${assigned ? 'rgba(74,222,128,0.3)' : selectedSong ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: assigned ? GREEN : selectedSong ? PURPLE : '#4A4640',
                  cursor: !selectedSong || assigning || assigned ? 'not-allowed' : 'pointer',
                }}>
                  <UserCheck size={13} />
                  {assigned ? 'Assigned ✓' : assigning ? 'Saving...' : 'Assign to Song'}
                </button>
              </div>
            </Section>
          )}

          {/* Key Terms */}
          {(result.advance != null || result.royalty_rate != null || result.deal_term_years != null) && (
            <Section title="📊 Key Terms">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Advance',      value: result.advance != null ? `$${result.advance.toLocaleString()}` : '—' },
                  { label: 'Royalty Rate', value: result.royalty_rate != null ? `${result.royalty_rate}%` : '—' },
                  { label: 'Net Royalty',  value: result.net_royalty_rate != null ? `${result.net_royalty_rate}%` : '—' },
                  { label: 'Term',         value: result.deal_term_years != null ? `${result.deal_term_years} yr${result.deal_term_years !== 1 ? 's' : ''}` : '—' },
                  { label: 'Territory',    value: result.territory ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: DESIGN_SYSTEM.colors.text.primary, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Red & Green flags */}
          <Section title="🚩 Red Flags & Green Flags">
            <div style={{ display: 'grid', gridTemplateColumns: result.green_flags?.length ? '1fr 1fr' : '1fr', gap: 14 }}>
              {result.red_flags?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: RED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Red Flags</div>
                  {result.red_flags.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                      <AlertTriangle size={13} color={RED} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}
              {result.green_flags?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: GREEN, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Green Flags</div>
                  {result.green_flags.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                      <CheckCircle size={13} color={GREEN} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Market Comparison */}
          {result.market_comparison?.length > 0 && (
            <Section title="📈 Market Comparison">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {result.market_comparison.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, padding: '10px 0', borderBottom: i < result.market_comparison.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.primary, fontWeight: 600 }}>{row.term}</span>
                    <span style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.secondary }}>{row.value}</span>
                    <span style={{ fontSize: 12, color: '#7A7468' }}>Industry: {row.industry_standard}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ASSESSMENT_COLOR[row.assessment] ?? '#94a3b8', background: `${ASSESSMENT_COLOR[row.assessment] ?? '#94a3b8'}15`, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                      {row.assessment}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Recoupment Timeline */}
          {result.recoupment_timeline && (
            <Section title="⏱ Recoupment Timeline">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>At 500K streams/mo</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary }}>{result.recoupment_timeline.at_500k_streams_monthly}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>At 1M streams/mo</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary }}>{result.recoupment_timeline.at_1m_streams_monthly}</div>
                </div>
              </div>
              {result.recoupment_timeline.notes && <p style={{ color: '#7A7468', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{result.recoupment_timeline.notes}</p>}
            </Section>
          )}

          {/* Negotiation Checklist */}
          {result.negotiation_points?.length > 0 && (
            <Section title="✅ Negotiation Checklist">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.negotiation_points.map((point, i) => (
                  <NegotiationItem key={i} text={point} />
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
      </>}
    </div>
  );
}

// ── Full results panel used inside vault detail view ─────────────────────────
function VaultResultsPanel({ result, userProfile }) {
  const fairness = FAIRNESS_CONFIG[result.overall_fairness] ?? FAIRNESS_CONFIG.standard;

  const [songs, setSongs]               = useState([]);
  const [selectedSong, setSelectedSong] = useState('');
  const [assigning, setAssigning]       = useState(false);
  const [assigned, setAssigned]         = useState(false);

  useEffect(() => {
    if (userProfile) {
      supabase.from('songs')
        .select('id, title')
        .eq('composer_id', userProfile.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setSongs(data ?? []));
    }
  }, [userProfile]);

  const assignToSong = async () => {
    if (!selectedSong || !result?.parties?.length) return;
    setAssigning(true);
    try {
      const song = songs.find(s => s.id === selectedSong);
      const splitsPayload = result.parties.map(p => ({
        name:       p.name,
        role:       p.role ?? '',
        percentage: p.composition_percentage ?? p.master_percentage ?? 0,
        ipi:        p.ipi ?? null,
        pro:        p.pro ?? null,
      }));
      const { error } = await supabase.from('split_sheets').insert({
        user_id:      userProfile.id,
        song_title:   song?.title ?? 'Unknown',
        splits:       splitsPayload,
        signature:    `deal_analyzer_${Date.now()}`,
        attested:     false,
        input_method: 'deal_analyzer',
      });
      if (error) throw error;
      setAssigned(true);
      showToast.success(`Split sheet created for "${song?.title}" ✓`);
    } catch (err) {
      showToast.error('Could not assign to song: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div>
      {/* Fairness + deal type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: fairness.color, fontFamily: "'Space Grotesk', sans-serif" }}>{fairness.label}</span>
        {result.deal_type && <span style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' }}>{result.deal_type}</span>}
      </div>

      {/* Summary */}
      {result.summary && (
        <Section title="📋 Summary">
          <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{result.summary}</p>
        </Section>
      )}

      {/* Contract Parties */}
      {result.parties?.length > 0 && (
        <Section title="👥 Contract Parties & Rights Verification">
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr', gap: 8, padding: '5px 0 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Name', 'Role', 'Comp %', 'Master %', 'IPI', 'PRO'].map(h => (
                <span key={h} style={{ fontSize: 10, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</span>
              ))}
            </div>
            {result.parties.map((party, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr', gap: 8, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.primary }}>{party.name}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{party.role}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: party.composition_percentage != null ? GOLD : '#4A4640' }}>
                  {party.composition_percentage != null ? `${party.composition_percentage}%` : '—'}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: party.master_percentage != null ? GOLD : '#4A4640' }}>
                  {party.master_percentage != null ? `${party.master_percentage}%` : '—'}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: party.ipi ? GOLD : '#4A4640' }}>
                  {party.ipi ?? '—'}
                </span>
                <span style={{ fontSize: 12, color: party.pro ? GREEN : '#4A4640' }}>
                  {party.pro ?? '—'}
                </span>
              </div>
            ))}
          </div>
          {userProfile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Music size={15} color='#7A7468' />
              <span style={{ fontSize: 12, color: '#7A7468', fontWeight: 600 }}>Assign parties to song:</span>
              <select
                value={selectedSong}
                onChange={e => { setSelectedSong(e.target.value); setAssigned(false); }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 12px', color: DESIGN_SYSTEM.colors.text.primary, fontSize: 12, cursor: 'pointer', flex: 1, minWidth: 160 }}
              >
                <option value="">— Select a song —</option>
                {songs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
              <button onClick={assignToSong} disabled={!selectedSong || assigning || assigned} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                background: assigned ? 'rgba(74,222,128,0.12)' : selectedSong ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${assigned ? 'rgba(74,222,128,0.3)' : selectedSong ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: assigned ? GREEN : selectedSong ? PURPLE : '#4A4640',
                cursor: !selectedSong || assigning || assigned ? 'not-allowed' : 'pointer',
              }}>
                <UserCheck size={13} />
                {assigned ? 'Assigned ✓' : assigning ? 'Saving...' : 'Assign to Song'}
              </button>
            </div>
          )}
        </Section>
      )}

      {/* Key Terms */}
      {(result.advance != null || result.royalty_rate != null || result.deal_term_years != null) && (
        <Section title="📊 Key Terms">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            {[
              { label: 'Advance',      value: result.advance != null ? `$${result.advance.toLocaleString()}` : '—' },
              { label: 'Royalty Rate', value: result.royalty_rate != null ? `${result.royalty_rate}%` : '—' },
              { label: 'Net Royalty',  value: result.net_royalty_rate != null ? `${result.net_royalty_rate}%` : '—' },
              { label: 'Term',         value: result.deal_term_years != null ? `${result.deal_term_years} yr${result.deal_term_years !== 1 ? 's' : ''}` : '—' },
              { label: 'Territory',    value: result.territory ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: DESIGN_SYSTEM.colors.text.primary, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Red & Green Flags */}
      {(result.red_flags?.length > 0 || result.green_flags?.length > 0) && (
        <Section title="🚩 Red Flags & Green Flags">
          <div style={{ display: 'grid', gridTemplateColumns: result.green_flags?.length ? '1fr 1fr' : '1fr', gap: 14 }}>
            {result.red_flags?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: RED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Red Flags</div>
                {result.red_flags.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                    <AlertTriangle size={12} color={RED} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            )}
            {result.green_flags?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: GREEN, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Green Flags</div>
                {result.green_flags.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                    <CheckCircle size={12} color={GREEN} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Market Comparison */}
      {result.market_comparison?.length > 0 && (
        <Section title="📈 Market Comparison">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {result.market_comparison.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, padding: '10px 0', borderBottom: i < result.market_comparison.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.primary, fontWeight: 600 }}>{row.term}</span>
                <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.secondary }}>{row.value}</span>
                <span style={{ fontSize: 11, color: '#7A7468' }}>Industry: {row.industry_standard}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: ASSESSMENT_COLOR[row.assessment] ?? '#94a3b8', background: `${ASSESSMENT_COLOR[row.assessment] ?? '#94a3b8'}15`, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  {row.assessment}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Recoupment Timeline */}
      {result.recoupment_timeline && (
        <Section title="⏱ Recoupment Timeline">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>At 500K streams/mo</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary }}>{result.recoupment_timeline.at_500k_streams_monthly}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>At 1M streams/mo</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary }}>{result.recoupment_timeline.at_1m_streams_monthly}</div>
            </div>
          </div>
          {result.recoupment_timeline.notes && <p style={{ color: '#7A7468', fontSize: 12, margin: 0, lineHeight: 1.6 }}>{result.recoupment_timeline.notes}</p>}
        </Section>
      )}

      {/* Negotiation Checklist */}
      {result.negotiation_points?.length > 0 && (
        <Section title="✅ Negotiation Checklist">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.negotiation_points.map((point, i) => (
              <NegotiationItem key={i} text={point} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function NegotiationItem({ text }) {
  const [checked, setChecked] = useState(false);
  return (
    <div onClick={() => setChecked(c => !c)} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '8px 10px', borderRadius: 8, background: checked ? 'rgba(74,222,128,0.05)' : 'transparent', transition: 'background 0.15s' }}>
      <div style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
        border: `1.5px solid ${checked ? GREEN : 'rgba(255,255,255,0.2)'}`,
        background: checked ? GREEN : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {checked && <CheckCircle size={12} color='#000' />}
      </div>
      <span style={{ fontSize: 13, color: checked ? '#7A7468' : DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.6, textDecoration: checked ? 'line-through' : 'none', transition: 'all 0.15s' }}>{text}</span>
    </div>
  );
}
