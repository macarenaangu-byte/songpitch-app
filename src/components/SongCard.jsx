import { Play, Pause, Music, Edit, Trash2, Clock, Shield, Zap, CheckCircle, AlertTriangle } from "lucide-react";
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { Badge } from './Badge';

export function SongCard({ song, onPlay, isPlaying, showActions, onEdit, onDelete, hideComposerName, onViewRights, isMobile = false, viewMode = 'list' }) {
  const primaryGenre = song.primary_genre || song.genre;
  const secondaryGenre = song.secondary_genre;
  const instrumentType = isMobile ? null : song.instrument_type;
  const licensingStatus = song.licensing_status;
  const isOneStopTrack = !!song.is_one_stop || (typeof licensingStatus === 'string' && licensingStatus.startsWith('One-Stop'));
  const primaryGenreColor = DESIGN_SYSTEM.colors.brand.purple;

  // ── GRID CARD ──────────────────────────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <div className="card-hover" style={{
        background: DESIGN_SYSTEM.colors.bg.card,
        borderRadius: DESIGN_SYSTEM.radius.lg,
        border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        display: 'flex',
        flexDirection: 'column',
        transition: `all ${DESIGN_SYSTEM.transition.normal}`,
        cursor: 'pointer',
        boxShadow: DESIGN_SYSTEM.shadow.sm,
        overflow: 'hidden',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.accent; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = DESIGN_SYSTEM.shadow.hover; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = DESIGN_SYSTEM.shadow.sm; }}
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onPlay) { e.preventDefault(); onPlay(song); } }}
      >
        {/* Play area */}
        <div onClick={() => onPlay && onPlay(song)} style={{
          background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.bg.elevated} 0%, ${DESIGN_SYSTEM.colors.bg.secondary} 100%)`,
          height: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
          flexShrink: 0,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: isPlaying ? DESIGN_SYSTEM.colors.gradient.main : 'rgba(201,168,76,0.12)',
            border: `1.5px solid rgba(201,168,76,0.4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: isPlaying ? '0 0 20px rgba(201,168,76,0.3)' : 'none',
          }}>
            {isPlaying
              ? <Pause size={18} color={DESIGN_SYSTEM.colors.bg.primary} />
              : <Play size={18} color={DESIGN_SYSTEM.colors.brand.primary} fill={DESIGN_SYSTEM.colors.brand.primary} />
            }
          </div>
          {/* Duration chip top-right */}
          {song.duration && (
            <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.muted, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', padding: '2px 7px', borderRadius: 5 }}>
              {song.duration}
            </span>
          )}
          {/* BPM chip top-left */}
          {song.bpm && (
            <span style={{ position: 'absolute', top: 8, left: 10, fontSize: 10, fontWeight: 600, color: DESIGN_SYSTEM.colors.accent.amber, background: `${DESIGN_SYSTEM.colors.accent.amber}18`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.amber}30`, backdropFilter: 'blur(6px)', padding: '2px 7px', borderRadius: 5 }}>
              ⚡ {song.bpm}
            </span>
          )}
        </div>

        {/* Card body */}
        <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Title */}
          <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.1px' }}>
            {song.title}
          </div>

          {/* Badge row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {primaryGenre && <Badge color={primaryGenreColor}>{primaryGenre}</Badge>}
            {song.mood && <Badge color={DESIGN_SYSTEM.colors.brand.primary}>{song.mood}</Badge>}
            {song.key && <Badge color={DESIGN_SYSTEM.colors.brand.secondary}>{song.key}</Badge>}
            {song.verification_status === 'verified' && (
              <span className="badge-verified-shimmer" style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40`, whiteSpace: 'nowrap' }}>
                <CheckCircle size={10} /> Verified
              </span>
            )}
            {isOneStopTrack && (
              <span style={{ background: `${DESIGN_SYSTEM.colors.brand.primary}12`, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}35`, whiteSpace: 'nowrap' }}>
                <Shield size={9} /> One-Stop
              </span>
            )}
          </div>

          {/* Footer actions */}
          {showActions && (
            <div style={{ display: 'flex', gap: 6, paddingTop: 6, borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, marginTop: 'auto' }}>
              {onViewRights && song.verification_status === 'verified' && (
                <button onClick={(e) => { e.stopPropagation(); onViewRights(song); }} style={{ flex: 1, background: `${DESIGN_SYSTEM.colors.brand.primary}12`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}30`, borderRadius: 6, padding: '6px 0', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: DESIGN_SYSTEM.colors.brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.15s' }}>
                  <Shield size={11} /> Rights
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); onEdit(song); }} style={{ flex: 1, background: `${DESIGN_SYSTEM.colors.brand.primary}12`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}30`, borderRadius: 6, padding: '6px 0', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: DESIGN_SYSTEM.colors.brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.15s' }}>
                <Edit size={11} /> Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(song); }} style={{ background: `${DESIGN_SYSTEM.colors.accent.red}12`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}30`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
                <Trash2 size={13} color={DESIGN_SYSTEM.colors.accent.red} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LIST CARD (default) ────────────────────────────────────────────────────
  return (
    <div className="card-hover" style={{
      background: DESIGN_SYSTEM.colors.bg.card,
      borderRadius: DESIGN_SYSTEM.radius.lg,
      padding: `${DESIGN_SYSTEM.spacing.md} ${DESIGN_SYSTEM.spacing.lg}`,
      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
      display: "flex",
      alignItems: "center",
      gap: DESIGN_SYSTEM.spacing.md,
      transition: `all ${DESIGN_SYSTEM.transition.normal}`,
      cursor: 'pointer',
      boxShadow: DESIGN_SYSTEM.shadow.sm,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.accent;
        e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = DESIGN_SYSTEM.shadow.hover;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light;
        e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.card;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = DESIGN_SYSTEM.shadow.sm;
      }}
      tabIndex={0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onPlay) { e.preventDefault(); onPlay(song); } }}
    >
      {/* Play Button - Professional size */}
      <div onClick={() => onPlay && onPlay(song)} style={{
        width: 52,
        height: 52,
        borderRadius: DESIGN_SYSTEM.radius.md,
        background: DESIGN_SYSTEM.colors.gradient.subtle,
        border: `1.5px solid ${DESIGN_SYSTEM.colors.brand.accent}40`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: `all ${DESIGN_SYSTEM.transition.fast}`,
        boxShadow: '0 2px 8px rgba(6,182,212,0.15)',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.background = DESIGN_SYSTEM.colors.gradient.hover;
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(6,182,212,0.25)';
          e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.accent + '60';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = DESIGN_SYSTEM.colors.gradient.subtle;
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(6,182,212,0.15)';
          e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.accent + '40';
        }}
      >
        {isPlaying ?
          <Pause size={20} color={DESIGN_SYSTEM.colors.text.primary} /> :
          <Play size={20} color={DESIGN_SYSTEM.colors.text.primary} fill={DESIGN_SYSTEM.colors.text.primary} />
        }
      </div>

      {/* Song Info - Clear hierarchy */}
      <div style={{ flex: '0 0 auto', minWidth: 120, maxWidth: 220 }}>
        <div style={{
          color: DESIGN_SYSTEM.colors.text.primary,
          fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
          fontSize: DESIGN_SYSTEM.fontSize.md,
          fontFamily: "'Space Grotesk', sans-serif",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          marginBottom: '2px',
          letterSpacing: '-0.1px',
        }}>
          {song.title}
        </div>
        {!hideComposerName && song.composer_name && (
          <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: DESIGN_SYSTEM.fontSize.sm, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {song.composer_name}
          </div>
        )}
        {/* BPM + duration sub-line in list mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          {song.bpm && <span style={{ color: DESIGN_SYSTEM.colors.accent.amber, fontSize: 11, fontWeight: 600 }}>⚡ {song.bpm}</span>}
          {song.duration && <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11 }}>{song.duration}</span>}
        </div>
      </div>

      {/* Metadata pills — 2-row layout, breathable spacing */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 auto", minWidth: 0, overflow: 'hidden' }}>
        {/* Row 1: genre tags */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {primaryGenre && <Badge color={DESIGN_SYSTEM.colors.brand.purple}>{primaryGenre}</Badge>}
          {secondaryGenre && !isMobile && <Badge color={DESIGN_SYSTEM.colors.brand.blue}>{secondaryGenre}</Badge>}
          {song.mood && !isMobile && <Badge color={DESIGN_SYSTEM.colors.brand.accent}>{song.mood}</Badge>}
          {song.key && !isMobile && (
            <Badge color={DESIGN_SYSTEM.colors.brand.secondary}>
              <Music size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />{song.key}
            </Badge>
          )}
        </div>
        {/* Row 2: status badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {isOneStopTrack && (
            <span style={{
              background: `${DESIGN_SYSTEM.colors.brand.primary}18`,
              color: DESIGN_SYSTEM.colors.brand.primary,
              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
              display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
              border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40`,
            }} title="One-Stop — no split negotiations needed">
              <Shield size={10} /> One-Stop
            </span>
          )}
          {!isOneStopTrack && licensingStatus && (
            <span style={{
              background: DESIGN_SYSTEM.colors.bg.elevated,
              color: DESIGN_SYSTEM.colors.text.secondary,
              fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
              display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
            }}>
              <Shield size={10} /> {licensingStatus}
            </span>
          )}
          {song.verification_status === 'verified' && (
            <span className="badge-verified-shimmer" style={{
              color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 11, fontWeight: 700,
              padding: "3px 10px", borderRadius: 6, display: "inline-flex", alignItems: "center",
              gap: 3, whiteSpace: "nowrap", border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40`,
            }} title="Rights have been verified">
              <CheckCircle size={10} /> Verified
            </span>
          )}
          {song.verification_status === 'pending_splits' && !isOneStopTrack && (
            <span style={{
              background: `${DESIGN_SYSTEM.colors.accent.amber}15`, color: DESIGN_SYSTEM.colors.accent.amber,
              fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
              display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap",
              border: `1px solid ${DESIGN_SYSTEM.colors.accent.amber}30`,
            }} title="Ownership splits need verification">
              <AlertTriangle size={10} /> Pending Verification
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: DESIGN_SYSTEM.spacing.md }}>
        {onViewRights && song.verification_status === 'verified' && (
          <button onClick={(e) => { e.stopPropagation(); onViewRights(song); }}
            style={{
              background: `${DESIGN_SYSTEM.colors.brand.primary}15`,
              border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}30`,
              borderRadius: DESIGN_SYSTEM.radius.sm,
              padding: `${DESIGN_SYSTEM.spacing.xs} 12px`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: DESIGN_SYSTEM.colors.brand.primary,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              transition: DESIGN_SYSTEM.transition.fast,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${DESIGN_SYSTEM.colors.brand.primary}25`;
              e.currentTarget.style.borderColor = `${DESIGN_SYSTEM.colors.brand.primary}50`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${DESIGN_SYSTEM.colors.brand.primary}15`;
              e.currentTarget.style.borderColor = `${DESIGN_SYSTEM.colors.brand.primary}30`;
            }}
            title="View ownership splits"
          >
            <Shield size={12} /> View Rights
          </button>
        )}
        {showActions && (
          <div style={{ display: "flex", gap: DESIGN_SYSTEM.spacing.xs }}>
            <button aria-label={`Edit ${song.title}`} className="song-action edit" onClick={() => onEdit(song)} style={{
              background: DESIGN_SYSTEM.colors.brand.primary + "15",
              border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}30`,
              borderRadius: DESIGN_SYSTEM.radius.sm,
              padding: `${DESIGN_SYSTEM.spacing.xs} 10px`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: DESIGN_SYSTEM.transition.fast,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.primary + "25";
              e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary + "50";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.primary + "15";
              e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary + "30";
            }}
            >
              <Edit size={14} color={DESIGN_SYSTEM.colors.brand.primary} />
            </button>
            <button aria-label={`Delete ${song.title}`} className="song-action delete" onClick={() => onDelete(song)} style={{
              background: DESIGN_SYSTEM.colors.accent.red + "15",
              border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}30`,
              borderRadius: DESIGN_SYSTEM.radius.sm,
              padding: `${DESIGN_SYSTEM.spacing.xs} 10px`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: DESIGN_SYSTEM.transition.fast,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = DESIGN_SYSTEM.colors.accent.red + "25";
              e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.accent.red + "50";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = DESIGN_SYSTEM.colors.accent.red + "15";
              e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.accent.red + "30";
            }}
            >
              <Trash2 size={14} color={DESIGN_SYSTEM.colors.accent.red} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
