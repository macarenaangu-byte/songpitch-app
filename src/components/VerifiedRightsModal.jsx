import { useState, useEffect } from 'react';
import { X, Shield, Music, Disc, Clock, FileText } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';

const COMP_COLOR = DESIGN_SYSTEM.colors.accent.purple;
const MASTER_COLOR = DESIGN_SYSTEM.colors.brand.blue;

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const inputMethodLabel = (method) => {
  if (method === 'voice') return 'Voice Memo';
  if (method === 'scan') return 'Image Scan';
  if (method === 'auto_one_stop') return 'Auto (One-Stop)';
  if (method === 'manual') return 'Manual Entry';
  return method || 'Unknown';
};

function SplitTable({ label, icon, accentColor, splits }) {
  if (!splits || splits.length === 0) return null;
  const total = splits.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);

  return (
    <div style={{ marginBottom: DESIGN_SYSTEM.spacing.lg }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: DESIGN_SYSTEM.fontSize.xs, fontWeight: 700,
        color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px',
        marginBottom: 8,
      }}>
        {icon} {label}
      </div>
      {splits.map((s, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '10px 12px', background: DESIGN_SYSTEM.colors.bg.elevated,
          borderRadius: DESIGN_SYSTEM.radius.sm, marginBottom: 4,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: DESIGN_SYSTEM.fontSize.md, fontWeight: 600 }}>
              {s.name}
              {s.role && (
                <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.sm, fontWeight: 400 }}> · {s.role}</span>
              )}
            </div>
            {/* IPI and PRO — shown only if present */}
            {(s.ipi || s.pro) && (
              <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                {s.pro && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 7px',
                    borderRadius: 4, background: `${accentColor}18`,
                    color: accentColor, border: `1px solid ${accentColor}30`,
                  }}>
                    {s.pro}
                  </span>
                )}
                {s.ipi && (
                  <span style={{
                    fontSize: 11, fontFamily: 'monospace',
                    color: DESIGN_SYSTEM.colors.text.muted,
                    padding: '2px 7px', borderRadius: 4,
                    background: DESIGN_SYSTEM.colors.bg.primary,
                    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                  }}>
                    IPI {s.ipi}
                  </span>
                )}
              </div>
            )}
          </div>
          <span style={{ color: accentColor, fontWeight: 700, marginLeft: 12, flexShrink: 0 }}>{s.percentage}%</span>
        </div>
      ))}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', padding: '6px 12px',
        fontSize: DESIGN_SYSTEM.fontSize.sm, fontWeight: 700,
        color: Math.abs(total - 100) < 0.01 ? accentColor : DESIGN_SYSTEM.colors.accent.red,
      }}>
        Total: {total.toFixed(1)}%
      </div>
    </div>
  );
}

export function VerifiedRightsModal({ open, onClose, song }) {
  const [splitSheet, setSplitSheet] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !song?.id) {
      setSplitSheet(null);
      return;
    }

    const fetchSplits = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('split_sheets')
          .select('*')
          .eq('song_id', song.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        setSplitSheet(data || null);
      } catch (err) {
        console.error('Failed to load split sheet:', err);
        setSplitSheet(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSplits();
  }, [open, song?.id]);

  if (!open) return null;

  const isLegacy = splitSheet && Array.isArray(splitSheet.splits);
  const compSplits = splitSheet
    ? (isLegacy ? splitSheet.splits : (splitSheet.splits?.composition || []))
    : [];
  const mastSplits = splitSheet
    ? (isLegacy ? [] : (splitSheet.splits?.master || []))
    : [];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: DESIGN_SYSTEM.colors.bg.card,
        borderRadius: DESIGN_SYSTEM.radius.xl,
        border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        maxWidth: 540, width: '100%',
        maxHeight: '85vh', overflowY: 'auto',
        padding: DESIGN_SYSTEM.spacing.xl,
        boxShadow: DESIGN_SYSTEM.shadow.lg,
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: DESIGN_SYSTEM.spacing.lg }}>
          <div>
            <h2 style={{
              color: DESIGN_SYSTEM.colors.text.primary, fontSize: DESIGN_SYSTEM.fontSize.xl,
              fontWeight: 800, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", margin: 0, marginBottom: 6,
            }}>
              {song?.title || 'Untitled'}
            </h2>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${DESIGN_SYSTEM.colors.brand.primary}18`,
              border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40`,
              borderRadius: DESIGN_SYSTEM.radius.sm,
              padding: '4px 10px',
            }}>
              <Shield size={14} color={DESIGN_SYSTEM.colors.brand.primary} />
              <span style={{ fontSize: 12, fontWeight: 700, color: DESIGN_SYSTEM.colors.brand.primary }}>
                Self-Attested Rights Declaration
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color={DESIGN_SYSTEM.colors.text.muted} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: DESIGN_SYSTEM.colors.text.muted }}>
            Loading rights data...
          </div>
        ) : !splitSheet ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: DESIGN_SYSTEM.colors.text.muted }}>
            <FileText size={32} style={{ marginBottom: 12 }} />
            <p style={{ margin: 0 }}>No verified rights data available for this song.</p>
          </div>
        ) : (
          <>
            {/* Verification metadata */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 12,
              marginBottom: DESIGN_SYSTEM.spacing.lg,
              fontSize: DESIGN_SYSTEM.fontSize.xs, color: DESIGN_SYSTEM.colors.text.tertiary,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> Verified {formatDate(splitSheet.updated_at || splitSheet.created_at)}
              </span>
              <span style={{
                background: DESIGN_SYSTEM.colors.bg.elevated,
                padding: '2px 8px', borderRadius: 4,
              }}>
                Via {inputMethodLabel(splitSheet.input_method)}
              </span>
            </div>

            {/* Composition splits */}
            <SplitTable
              label={isLegacy ? 'Splits (Legacy)' : 'Composition / Publishing'}
              icon={isLegacy ? <FileText size={12} /> : <Music size={12} />}
              accentColor={isLegacy ? DESIGN_SYSTEM.colors.text.secondary : COMP_COLOR}
              splits={compSplits}
            />

            {/* Master splits */}
            <SplitTable
              label="Master Recording"
              icon={<Disc size={12} />}
              accentColor={MASTER_COLOR}
              splits={mastSplits}
            />

            {/* Signature */}
            <div style={{
              paddingTop: DESIGN_SYSTEM.spacing.md,
              borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              fontSize: DESIGN_SYSTEM.fontSize.sm, color: DESIGN_SYSTEM.colors.text.muted,
            }}>
              Attested by: <strong style={{ color: DESIGN_SYSTEM.colors.text.secondary }}>{splitSheet.signature}</strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
