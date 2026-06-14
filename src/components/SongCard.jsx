import { Play, Pause, Music, Edit, Trash2, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { Badge } from './Badge';

// Decorative waveform bars — static, purely visual
const WAVEFORM_HEIGHTS = [8,14,18,22,16,20,10,16,20,24,18,12,16,22,18,14,20,16,10,14,8];

function Waveform() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24, opacity: 0.3, flexShrink: 0 }} aria-hidden="true">
      {WAVEFORM_HEIGHTS.map((h, i) => (
        <span key={i} style={{ display: 'block', width: 2, height: h, borderRadius: 2, background: '#C9A84C' }} />
      ))}
    </div>
  );
}

function EnergyPips({ value }) {
  if (value == null) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#7A7468', fontFamily: "'Space Grotesk', sans-serif", marginRight: 2, letterSpacing: '0.3px' }}>ENERGY</span>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} style={{
            display: 'block', width: 6, height: 6, borderRadius: 1,
            background: i < value ? '#C9A84C' : 'rgba(255,255,255,0.08)',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#7A7468', fontFamily: "'Space Grotesk', sans-serif", marginLeft: 2 }}>{value}/10</span>
    </div>
  );
}

function StatPill({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20, padding: '3px 10px',
      fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 500,
      color: '#B8C0CC', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {children}
    </span>
  );
}

function Pill({ children, variant = 'ghost' }) {
  const styles = {
    purple: { background: 'rgba(139,92,246,0.15)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.25)' },
    blue:   { background: 'rgba(59,130,246,0.15)',  color: '#93C5FD', border: '1px solid rgba(59,130,246,0.22)' },
    slate:  { background: 'rgba(100,116,139,0.15)', color: '#94A3B8', border: '1px solid rgba(100,116,139,0.22)' },
    gold:   { background: 'rgba(201,168,76,0.15)',  color: '#E2B96A', border: '1px solid rgba(201,168,76,0.28)' },
    green:  { background: 'rgba(16,185,129,0.15)',  color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.25)' },
    ghost:  { background: 'rgba(255,255,255,0.04)', color: '#7A7468', border: '1px solid rgba(255,255,255,0.08)' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
      whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif",
      ...styles[variant],
    }}>
      {children}
    </span>
  );
}

function Divider() {
  return <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', flexShrink: 0, margin: '0 2px' }} />;
}

export function SongCard({ song, onPlay, isPlaying, showActions, onEdit, onDelete, hideComposerName, onViewRights, isMobile = false, viewMode = 'list' }) {
  const primaryGenre   = song.primary_genre || song.genre;
  const secondaryGenre = song.secondary_genre;
  const tertiaryGenre  = song.tertiary_genre;
  const licensingStatus = song.licensing_status;
  const isOneStopTrack = !!song.is_one_stop || (typeof licensingStatus === 'string' && licensingStatus.startsWith('One-Stop'));
  const useCases       = song.use_cases || [];
  const instruments    = song.instruments || [];
  const vocals         = song.vocals;
  const energy         = song.energy;
  // mood_tags is the full array [primary, secondary, tertiary]; fall back to single mood string
  const moodTags       = (song.mood_tags?.length > 0) ? song.mood_tags : (song.mood ? [song.mood] : []);

  // ── GRID CARD ──────────────────────────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <div className="card-hover" style={{
        background: DESIGN_SYSTEM.colors.bg.card,
        borderRadius: DESIGN_SYSTEM.radius.lg,
        border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        display: 'flex', flexDirection: 'column',
        transition: `all ${DESIGN_SYSTEM.transition.normal}`,
        cursor: 'pointer', boxShadow: DESIGN_SYSTEM.shadow.sm, overflow: 'hidden',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.accent; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = DESIGN_SYSTEM.shadow.hover; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = DESIGN_SYSTEM.shadow.sm; }}
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onPlay) { e.preventDefault(); onPlay(song); } }}
      >
        {/* Play area */}
        <div onClick={() => onPlay && onPlay(song)} style={{
          background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.bg.elevated} 0%, ${DESIGN_SYSTEM.colors.bg.secondary} 100%)`,
          height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, flexShrink: 0,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: isPlaying ? DESIGN_SYSTEM.colors.gradient.main : 'rgba(201,168,76,0.12)',
            border: `1.5px solid rgba(201,168,76,0.4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: isPlaying ? '0 0 20px rgba(201,168,76,0.3)' : 'none',
          }}>
            {isPlaying ? <Pause size={18} color={DESIGN_SYSTEM.colors.bg.primary} /> : <Play size={18} color={DESIGN_SYSTEM.colors.brand.primary} fill={DESIGN_SYSTEM.colors.brand.primary} />}
          </div>
          {song.duration && <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.muted, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', padding: '2px 7px', borderRadius: 5 }}>{song.duration}</span>}
          {song.bpm && <span style={{ position: 'absolute', top: 8, left: 10, fontSize: 10, fontWeight: 600, color: DESIGN_SYSTEM.colors.accent.amber, background: `${DESIGN_SYSTEM.colors.accent.amber}18`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.amber}30`, backdropFilter: 'blur(6px)', padding: '2px 7px', borderRadius: 5 }}>⚡ {song.bpm}</span>}
        </div>

        {/* Card body */}
        <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.1px' }}>{song.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {primaryGenre && <Badge color={DESIGN_SYSTEM.colors.brand.purple}>{primaryGenre}</Badge>}
            {song.mood && <Badge color={DESIGN_SYSTEM.colors.brand.primary}>{song.mood}</Badge>}
            {song.key && <Badge color={DESIGN_SYSTEM.colors.brand.secondary}><Music size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />{song.key}</Badge>}
            {song.verification_status === 'verified' && <span className="badge-verified-shimmer" style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40`, whiteSpace: 'nowrap' }}><CheckCircle size={10} /> Verified</span>}
            {isOneStopTrack && <span style={{ background: `${DESIGN_SYSTEM.colors.brand.primary}12`, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}35`, whiteSpace: 'nowrap' }}><Shield size={9} /> One-Stop</span>}
          </div>
          {showActions && (
            <div style={{ display: 'flex', gap: 6, paddingTop: 6, borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, marginTop: 'auto' }}>
              {onViewRights && song.verification_status === 'verified' && <button onClick={(e) => { e.stopPropagation(); onViewRights(song); }} style={{ flex: 1, background: `${DESIGN_SYSTEM.colors.brand.primary}12`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}30`, borderRadius: 6, padding: '6px 0', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: DESIGN_SYSTEM.colors.brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Shield size={11} /> Rights</button>}
              <button onClick={(e) => { e.stopPropagation(); onEdit(song); }} style={{ flex: 1, background: `${DESIGN_SYSTEM.colors.brand.primary}12`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}30`, borderRadius: 6, padding: '6px 0', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: DESIGN_SYSTEM.colors.brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Edit size={11} /> Edit</button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(song); }} style={{ background: `${DESIGN_SYSTEM.colors.accent.red}12`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}30`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={13} color={DESIGN_SYSTEM.colors.accent.red} /></button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MOBILE CARD ────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        className="song-card-flux"
        style={{
          background: '#16161C',
          borderRadius: 14,
          padding: '14px 14px',
          border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onPlay) { e.preventDefault(); onPlay(song); } }}
      >
        {/* Top row: play button + title + badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div onClick={() => onPlay && onPlay(song)} style={{ flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: isPlaying ? 'linear-gradient(135deg, #C9A84C, #A8832A)' : 'rgba(201,168,76,0.10)',
              border: `1.5px solid rgba(201,168,76,${isPlaying ? '0.8' : '0.35'})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.18s ease',
              boxShadow: isPlaying ? '0 0 14px rgba(201,168,76,0.35)' : 'none',
            }}>
              {isPlaying
                ? <Pause size={14} color="#0F0F13" />
                : <Play size={14} color="#C9A84C" fill="#C9A84C" style={{ marginLeft: 2 }} />}
            </div>
          </div>

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {song.title}
            </div>
            {!hideComposerName && song.composer_name && (
              <div style={{ color: '#7A7468', fontSize: 12, marginTop: 1 }}>{song.composer_name}</div>
            )}
          </div>

          {/* Status badges */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            {isOneStopTrack && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.28)', color: '#6EE7B7', whiteSpace: 'nowrap' }}>
                <Shield size={9} /> One-Stop
              </span>
            )}
            {song.verification_status === 'verified' && (
              <span className="badge-verified-shimmer" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color: '#C9A84C', border: '1px solid rgba(201,168,76,0.35)', whiteSpace: 'nowrap' }}>
                <CheckCircle size={9} /> Verified
              </span>
            )}
            {song.verification_status === 'pending_splits' && !isOneStopTrack && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.28)', color: '#FCD34D', whiteSpace: 'nowrap' }}>
                <AlertTriangle size={9} /> Pending
              </span>
            )}
          </div>
        </div>

        {/* Stats row: BPM · Duration · Key */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {song.bpm && (
            <StatPill>
              <span style={{ color: '#C9A84C', fontWeight: 700 }}>{song.bpm}</span> BPM
            </StatPill>
          )}
          {song.duration && <StatPill>{song.duration}</StatPill>}
          {song.key && <StatPill><Music size={9} style={{ marginRight: 2 }} />{song.key}</StatPill>}
          {energy != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#7A7468', letterSpacing: '0.3px' }}>ENERGY</span>
              <div style={{ display: 'flex', gap: 2, marginLeft: 2 }}>
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} style={{ display: 'block', width: 5, height: 5, borderRadius: 1, background: i < energy ? '#C9A84C' : 'rgba(255,255,255,0.08)' }} />
                ))}
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#7A7468', marginLeft: 2 }}>{energy}/10</span>
            </div>
          )}
        </div>

        {/* Full tag row — wrapping */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {primaryGenre && (
            <Pill variant="purple">
              <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="2.5" fill="#8B5CF6"/></svg>
              {primaryGenre}
            </Pill>
          )}
          {secondaryGenre && <Pill variant="blue">{secondaryGenre}</Pill>}
          {tertiaryGenre  && <Pill variant="slate">{tertiaryGenre}</Pill>}

          {moodTags.length > 0 && <Divider />}
          {moodTags.slice(0, 3).map((m, i) => (
            <Pill key={i} variant="gold">{m}</Pill>
          ))}

          {(vocals || instruments.length > 0 || useCases.length > 0) && <Divider />}
          {vocals && <Pill variant="green">{vocals}</Pill>}
          {instruments.slice(0, 3).map((inst, i) => <Pill key={i} variant="ghost">{inst}</Pill>)}
          {useCases.slice(0, 2).map((uc, i) => <Pill key={i} variant="ghost">{uc}</Pill>)}
        </div>

        {/* Actions — always visible on mobile */}
        {showActions && (
          <div style={{ display: 'flex', gap: 6, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {onViewRights && song.verification_status === 'verified' && (
              <button onClick={(e) => { e.stopPropagation(); onViewRights(song); }}
                style={{ flex: 1, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '7px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#C9A84C' }}>
                <Shield size={11} /> Rights
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onEdit(song); }}
              style={{ flex: 1, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '7px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#C9A84C' }}>
              <Edit size={12} /> Edit
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(song); }}
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Trash2 size={13} color="#F87171" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── LIST CARD — Variant C (Flux) + energy pips ────────────────────────────
  return (
    <div
      className="song-card-flux"
      style={{
        background: '#16161C',
        borderRadius: 14,
        padding: '16px 20px',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#1C1C24';
        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.10)';
        const overlay = e.currentTarget.querySelector('.flux-overlay');
        if (overlay) overlay.style.opacity = '1';
        const actions = e.currentTarget.querySelector('.flux-actions');
        if (actions) actions.style.opacity = '1';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#16161C';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.boxShadow = 'none';
        const overlay = e.currentTarget.querySelector('.flux-overlay');
        if (overlay) overlay.style.opacity = '0';
        const actions = e.currentTarget.querySelector('.flux-actions');
        if (actions) actions.style.opacity = '0';
      }}
      tabIndex={0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onPlay) { e.preventDefault(); onPlay(song); } }}
    >
      {/* Subtle purple gradient overlay on hover */}
      <div className="flux-overlay" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0, transition: 'opacity 0.25s ease',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.04) 0%, transparent 60%)',
      }} />

      {/* Play button */}
      <div onClick={() => onPlay && onPlay(song)} style={{ flexShrink: 0, zIndex: 1 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: isPlaying ? 'linear-gradient(135deg, #C9A84C, #A8832A)' : 'rgba(201,168,76,0.10)',
          border: `1.5px solid rgba(201,168,76,${isPlaying ? '0.8' : '0.35'})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.18s ease', flexShrink: 0,
          boxShadow: isPlaying ? '0 0 18px rgba(201,168,76,0.35)' : 'none',
        }}>
          {isPlaying
            ? <Pause size={16} color="#0F0F13" />
            : <Play size={16} color="#C9A84C" fill="#C9A84C" style={{ marginLeft: 2 }} />}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>

        {/* Title + composer */}
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.01em', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.title}
          {!hideComposerName && song.composer_name && (
            <span style={{ color: '#7A7468', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>{song.composer_name}</span>
          )}
        </div>

        {/* Stats row: BPM · Duration · Key · waveform */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', marginBottom: 8, overflow: 'hidden' }}>
          {song.bpm && (
            <StatPill>
              <span style={{ color: '#C9A84C', fontWeight: 700 }}>{song.bpm}</span> BPM
            </StatPill>
          )}
          {song.duration && <StatPill>{song.duration}</StatPill>}
          {song.key && <StatPill><Music size={9} style={{ marginRight: 2 }} />{song.key}</StatPill>}
          <Waveform />
        </div>

        {/* Tag row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {/* Genres */}
          {primaryGenre && (
            <Pill variant="purple">
              <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="2.5" fill="#8B5CF6"/></svg>
              {primaryGenre}
            </Pill>
          )}
          {secondaryGenre && <Pill variant="blue">{secondaryGenre}</Pill>}
          {tertiaryGenre  && <Pill variant="slate">{tertiaryGenre}</Pill>}

          {/* Moods — up to 3, all gold */}
          {moodTags.length > 0 && <Divider />}
          {moodTags.slice(0, 3).map((m, i) => (
            <Pill key={i} variant="gold" style={{ opacity: 1 - i * 0.2 }}>{m}</Pill>
          ))}

          {/* Vocals + all instruments + use cases */}
          {(vocals || instruments.length > 0 || useCases.length > 0) && <Divider />}
          {vocals && <Pill variant="green">{vocals}</Pill>}
          {instruments.map((inst, i) => <Pill key={i} variant="ghost">{inst}</Pill>)}
          {useCases.slice(0, 2).map((uc, i) => <Pill key={i} variant="ghost">{uc}</Pill>)}
        </div>
      </div>

      {/* Right column: energy + status badges + actions */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, zIndex: 1 }}>

        {/* Energy pips */}
        <EnergyPips value={energy} />

        {/* Status badges */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          {isOneStopTrack && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.28)', color: '#6EE7B7', whiteSpace: 'nowrap' }}>
              <Shield size={9} /> One-Stop
            </span>
          )}
          {song.verification_status === 'verified' && (
            <span className="badge-verified-shimmer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, color: '#C9A84C', border: '1px solid rgba(201,168,76,0.35)', whiteSpace: 'nowrap' }}>
              <CheckCircle size={9} /> Verified
            </span>
          )}
          {song.verification_status === 'pending_splits' && !isOneStopTrack && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.28)', color: '#FCD34D', whiteSpace: 'nowrap' }}>
              <AlertTriangle size={9} /> Pending
            </span>
          )}
        </div>

        {/* Actions — fade in on hover */}
        {showActions && (
          <div className="flux-actions" style={{ display: 'flex', gap: 6, opacity: 0, transition: 'opacity 0.15s ease' }}>
            {onViewRights && song.verification_status === 'verified' && (
              <button onClick={(e) => { e.stopPropagation(); onViewRights(song); }}
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#C9A84C', transition: 'all 0.15s' }}>
                <Shield size={11} /> Rights
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onEdit(song); }}
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
              <Edit size={13} color="#C9A84C" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(song); }}
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.22)', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
              <Trash2 size={13} color="#F87171" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
