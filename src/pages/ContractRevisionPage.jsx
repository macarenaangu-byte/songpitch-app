// ContractRevisionPage.jsx
// Executive Basic/Pro feature — review contract drafts via LegalSplits ML
// and save results to the Contract Vault.

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, X, Lock, Trash2, Clock, ChevronDown, ChevronUp, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { useTier } from '../hooks/useTier';
import UpgradeModal from '../components/UpgradeModal';

const GOLD = '#C9A84C';
const RED  = '#f87171';
const GREEN = '#4ade80';

const API_URL = process.env.REACT_APP_LEGALSPLITS_API_URL ?? 'https://legalsplits-ai.netlify.app';
const API_KEY = process.env.REACT_APP_LEGALSPLITS_API_KEY ?? '';

const FAIRNESS_CONFIG = {
  creator_unfavorable: { color: RED,       label: 'Creator Unfavorable' },
  below_standard:      { color: '#fbbf24', label: 'Below Standard'     },
  standard:            { color: '#94a3b8', label: 'Standard'            },
  above_standard:      { color: GREEN,     label: 'Above Standard'      },
  creator_favorable:   { color: GREEN,     label: 'Creator Favorable'   },
};

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', background: 'none', border: 'none', cursor: 'pointer', color: DESIGN_SYSTEM.colors.text.primary }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</span>
        {open ? <ChevronUp size={15} color='#7A7468' /> : <ChevronDown size={15} color='#7A7468' />}
      </button>
      {open && <div style={{ padding: '0 18px 18px' }}>{children}</div>}
    </div>
  );
}

const ASSESSMENT_COLORS = { below: RED, standard: '#94a3b8', above: GREEN };

function ResultsPanel({ result, onSave, saving, canVault }) {
  const fairness = FAIRNESS_CONFIG[result.overall_fairness] ?? { color: '#94a3b8', label: 'Analysis Complete' };
  return (
    <div style={{ overflowY: 'auto', maxHeight: '78vh', paddingRight: 4 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: fairness.color, fontFamily: "'Space Grotesk', sans-serif" }}>{fairness.label}</span>
          {result.deal_type && <span style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' }}>{result.deal_type.replace(/_/g, ' ')}</span>}
        </div>
        {onSave && (
          <button onClick={onSave} disabled={saving || !canVault} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: canVault ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${canVault ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`, color: canVault ? GOLD : '#4A4640', cursor: canVault ? 'pointer' : 'not-allowed' }}>
            {saving ? 'Saving...' : '🗄 Save to Vault'}
          </button>
        )}
      </div>

      {/* Key terms grid */}
      {(result.advance != null || result.royalty_rate != null || result.deal_term_years != null) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Advance',    value: result.advance != null ? `$${result.advance.toLocaleString()}` : '—' },
            { label: 'Royalty',    value: result.royalty_rate != null ? `${result.royalty_rate}%` : '—' },
            { label: 'Net Royalty',value: result.net_royalty_rate != null ? `${result.net_royalty_rate}%` : '—' },
            { label: 'Term',       value: result.deal_term_years != null ? `${result.deal_term_years} yrs` : '—' },
            { label: 'Territory',  value: result.territory ?? '—' },
            { label: 'Deal Type',  value: result.deal_type ? result.deal_type.replace(/_/g,' ') : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '9px 11px' }}>
              <div style={{ fontSize: 10, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: DESIGN_SYSTEM.colors.text.primary, fontFamily: "'Space Grotesk', sans-serif", textTransform: 'capitalize' }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {result.summary && (
        <Section title="📋 Summary" defaultOpen={true}>
          <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{result.summary}</p>
        </Section>
      )}

      {/* Red + Green flags side by side */}
      {(result.red_flags?.length > 0 || result.green_flags?.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {result.red_flags?.length > 0 && (
            <Section title={`🚩 Red Flags (${result.red_flags.length})`} defaultOpen={true}>
              {result.red_flags.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 7 }}>
                  <AlertTriangle size={12} color={RED} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </Section>
          )}
          {result.green_flags?.length > 0 && (
            <Section title={`✅ Green Flags (${result.green_flags.length})`} defaultOpen={true}>
              {result.green_flags.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 7 }}>
                  <CheckCircle size={12} color={GREEN} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </Section>
          )}
        </div>
      )}

      {/* 360 Revenue Streams */}
      {result.revenue_streams_taken?.length > 0 && (
        <Section title="💰 Revenue Streams" defaultOpen={false}>
          {result.revenue_streams_taken.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 0', borderBottom: i < result.revenue_streams_taken.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.primary }}>{s.stream}</div>
                {s.notes && <div style={{ fontSize: 11, color: '#7A7468', marginTop: 2 }}>{s.notes}</div>}
              </div>
              {s.percentage != null && <span style={{ fontSize: 13, fontWeight: 700, color: RED, flexShrink: 0, marginLeft: 10 }}>{s.percentage}%</span>}
            </div>
          ))}
        </Section>
      )}

      {/* Recoupment Timeline */}
      {result.recoupment_timeline && (
        <Section title="⏱ Recoupment Timeline" defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'At 500K Streams/mo', value: result.recoupment_timeline.at_500k_streams_monthly },
              { label: 'At 1M Streams/mo',   value: result.recoupment_timeline.at_1m_streams_monthly },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.primary, lineHeight: 1.4 }}>{value}</div>
              </div>
            ))}
          </div>
          {result.recoupment_timeline.notes && <p style={{ color: '#7A7468', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{result.recoupment_timeline.notes}</p>}
        </Section>
      )}

      {/* Market Comparison */}
      {result.market_comparison?.length > 0 && (
        <Section title="📊 Market Comparison" defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 90px', gap: 8, padding: '5px 0 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Term', 'Your Deal', 'Industry Std', 'Status'].map(h => (
                <span key={h} style={{ fontSize: 10, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</span>
              ))}
            </div>
            {result.market_comparison.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 90px', gap: 8, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.primary }}>{row.term}</div>
                  {row.explanation && <div style={{ fontSize: 11, color: '#7A7468', marginTop: 2, lineHeight: 1.4 }}>{row.explanation}</div>}
                </div>
                <span style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.secondary }}>{row.value}</span>
                <span style={{ fontSize: 12, color: '#7A7468' }}>{row.industry_standard}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: ASSESSMENT_COLORS[row.assessment] ?? '#94a3b8', textTransform: 'capitalize' }}>
                  {row.assessment === 'below' ? '⬇ Below' : row.assessment === 'above' ? '⬆ Above' : '— Standard'}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Negotiation Points */}
      {result.negotiation_points?.length > 0 && (
        <Section title="✅ Negotiation Points" defaultOpen={false}>
          {result.negotiation_points.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
              <CheckCircle size={13} color={GOLD} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.5 }}>{p}</span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

export function ContractRevisionPage({ userProfile }) {
  const { can, withinLimit, upgradeMessage } = useTier(userProfile);
  const canUse = can('contractRevision');
  const canVault = can('contractVault');
  const [upgradeModal, setUpgradeModal] = useState(false);

  const [tab, setTab]         = useState('analyze'); // 'analyze' | 'vault'
  const [file, setFile]       = useState(null);
  const [contractName, setContractName] = useState('');
  const [endpoint, setEndpoint] = useState('analyze-deal');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [vault, setVault]     = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const fileRef = useRef();

  // Load vault on mount
  useEffect(() => {
    if (canVault) loadVault();
  }, [canVault]);

  async function loadVault() {
    setVaultLoading(true);
    const { data } = await supabase
      .from('contract_revisions')
      .select('*')
      .eq('user_id', userProfile.user_id ?? userProfile.id)
      .order('created_at', { ascending: false });
    setVault(data ?? []);
    setVaultLoading(false);
  }

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { setError('Only PDF files are supported.'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('File must be under 10 MB.'); return; }
    setFile(f);
    if (!contractName) setContractName(f.name.replace('.pdf', ''));
    setError(''); setResult(null);
  };

  const analyze = async () => {
    if (!file) return;
    if (!canUse) { setUpgradeModal(true); return; }

    const limitCheck = withinLimit('contractRevision');
    if (!limitCheck.allowed) {
      setUpgradeModal(true); return;
    }

    setLoading(true); setError(''); setResult(null);
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

      // Increment usage counter
      await supabase.rpc('increment_usage', { p_user_id: userProfile.user_id ?? userProfile.id, p_action: 'contract_revision' });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveToVault = async () => {
    if (!result || !canVault) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('contract_revisions').insert([{
        user_id:       userProfile.user_id ?? userProfile.id,
        contract_name: contractName || file?.name || 'Untitled Contract',
        contract_type: endpoint === 'analyze-deal' ? 'deal' : 'agreement',
        analysis:      result,
        fairness:      result.overall_fairness ?? null,
        summary:       result.summary ?? null,
        red_flags:     result.red_flags ?? [],
        green_flags:   result.green_flags ?? [],
      }]);
      if (error) throw error;
      showToast.success('Saved to Contract Vault');
      loadVault();
    } catch (err) {
      showToast.error('Could not save to vault');
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

  const fairness = result ? (FAIRNESS_CONFIG[result.overall_fairness] ?? FAIRNESS_CONFIG.standard) : null;
  const revUsage = withinLimit('contractRevision');

  return (
    <div className="page-enter" style={{ padding: '32px 36px', minHeight: '100%', overflowY: 'auto' }}>

      <UpgradeModal
        isOpen={upgradeModal}
        onClose={() => setUpgradeModal(false)}
        feature={upgradeMessage('contractRevision')}
        userProfile={userProfile}
        defaultTier={userProfile?.subscription_tier === 'basic' ? 'pro' : 'basic'}
      />

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: DESIGN_SYSTEM.colors.text.primary, margin: '0 0 6px', fontFamily: "'Space Grotesk', sans-serif" }}>
            Contract Revision
          </h1>
          <p style={{ color: '#7A7468', fontSize: 14, margin: 0 }}>
            Review contracts before sending to artists — powered by LegalSplits ML.
          </p>
        </div>
        {revUsage.max !== null && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px', textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>This Month</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: revUsage.remaining === 0 ? RED : GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
              {revUsage.used}<span style={{ fontSize: 13, fontWeight: 400, color: '#7A7468' }}>/{revUsage.max}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0 }}>
        {[{ key: 'analyze', label: '🔍 Analyze Contract' }, { key: 'vault', label: `🗄 Contract Vault (${vault.length})` }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700,
            color: tab === t.key ? GOLD : '#7A7468',
            borderBottom: `2px solid ${tab === t.key ? GOLD : 'transparent'}`,
            marginBottom: -1, transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Analyze tab ──────────────────────────────────────────────────── */}
      {tab === 'analyze' && (
        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24, maxWidth: result ? '100%' : 640 }}>
          <div>
            {/* Lock banner */}
            {!canUse && (
              <div onClick={() => setUpgradeModal(true)} style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <Lock size={16} color={GOLD} />
                <div>
                  <div style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>Basic Feature</div>
                  <div style={{ color: '#7A7468', fontSize: 12 }}>Upgrade to Basic to unlock Contract Revision.</div>
                </div>
              </div>
            )}

            {/* Contract type */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Contract Type</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { value: 'analyze-deal', label: 'Recording / Distribution' },
                  { value: 'analyze-agreement', label: 'Publishing / Co-Pub / 360' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setEndpoint(opt.value)} style={{
                    padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: endpoint === opt.value ? `1.5px solid ${GOLD}` : '1.5px solid rgba(255,255,255,0.08)',
                    background: endpoint === opt.value ? 'rgba(201,168,76,0.10)' : 'transparent',
                    color: endpoint === opt.value ? GOLD : '#7A7468', transition: 'all 0.15s',
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Contract name */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#7A7468', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Contract Name (for vault)</div>
              <input value={contractName} onChange={e => setContractName(e.target.value)}
                placeholder="e.g. Artist Name — Recording Agreement 2026"
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '10px 14px', color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Drop zone */}
            <div onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${file ? GOLD : 'rgba(255,255,255,0.12)'}`, borderRadius: 14, padding: '28px 20px', textAlign: 'center', background: file ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', marginBottom: 14 }}>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <FileText size={18} color={GOLD} />
                  <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{file.name}</span>
                  <button onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A7468', padding: 0 }}><X size={14} /></button>
                </div>
              ) : (
                <>
                  <Upload size={24} color='#4A4640' style={{ marginBottom: 8 }} />
                  <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Drop PDF here or click to browse</div>
                  <div style={{ color: '#7A7468', fontSize: 11 }}>Max 10 MB</div>
                </>
              )}
            </div>

            {error && <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: RED, fontSize: 13 }}>{error}</div>}

            <button onClick={analyze} disabled={!file || loading} style={{
              width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: !file || loading ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${GOLD}, #A8832A)`,
              color: !file || loading ? '#4A4640' : '#000',
              border: 'none', cursor: !file || loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              {loading ? '🔍 Analyzing...' : 'Analyze Contract'}
            </button>
          </div>

          {/* Results panel */}
          {result && <ResultsPanel result={result} onSave={saveToVault} saving={saving} canVault={canVault} />}
        </div>
      )}

      {/* ── Vault tab ────────────────────────────────────────────────────── */}
      {tab === 'vault' && (
        <div>
          {!canVault ? (
            <div onClick={() => setUpgradeModal(true)} style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 14, padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
              <Lock size={24} color={GOLD} style={{ marginBottom: 10 }} />
              <div style={{ color: GOLD, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Contract Vault — Basic & Pro</div>
              <div style={{ color: '#7A7468', fontSize: 13 }}>Save and manage your contract revisions. Upgrade to access.</div>
            </div>
          ) : vaultLoading ? (
            <div style={{ color: '#7A7468', fontSize: 14, textAlign: 'center', padding: 40 }}>Loading vault...</div>
          ) : vault.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <FileText size={32} color='#4A4640' style={{ marginBottom: 12 }} />
              <div style={{ color: '#7A7468', fontSize: 14 }}>No contracts saved yet. Analyze one and save it to your vault.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>
              {/* List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {vault.map(item => {
                  const fc = FAIRNESS_CONFIG[item.fairness];
                  return (
                    <div key={item.id} onClick={() => setSelected(item)}
                      style={{ background: selected?.id === item.id ? 'rgba(201,168,76,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected?.id === item.id ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary, marginBottom: 4 }}>{item.contract_name}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#7A7468', textTransform: 'capitalize' }}>{item.contract_type}</span>
                          {fc && <span style={{ fontSize: 11, fontWeight: 700, color: fc.color }}>{fc.label}</span>}
                          <span style={{ fontSize: 11, color: '#4A4640' }}><Clock size={10} style={{ display: 'inline', marginRight: 3 }} />{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); deleteFromVault(item.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A4640', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Detail panel */}
              {selected && (
                <div style={{ overflowY: 'auto', maxHeight: '70vh', paddingRight: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.primary }}>{selected.contract_name}</h3>
                    <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A7468' }}><X size={16} /></button>
                  </div>
                  {selected.analysis && <ResultsPanel result={selected.analysis} />}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
