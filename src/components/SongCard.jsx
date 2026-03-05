import { useState } from "react";
import { Play, Pause, Music, Edit, Trash2, Clock, Shield, Zap } from "lucide-react";
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { Badge } from './Badge';

export function SongCard({ song, onPlay, isPlaying, showActions, onEdit, onDelete, hideComposerName }) {
  const primaryGenre = song.primary_genre || song.genre;
  const secondaryGenre = song.secondary_genre;
  const instrumentType = song.instrument_type;
  const licensingStatus = song.licensing_status;
  const isOneStopTrack = !!song.is_one_stop || (typeof licensingStatus === 'string' && licensingStatus.startsWith('One-Stop'));

  return (
    <div style={{
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: DESIGN_SYSTEM.colors.text.primary,
          fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
          fontSize: DESIGN_SYSTEM.fontSize.md,
          fontFamily: "'Outfit', sans-serif",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          marginBottom: '2px',
        }}>
          {song.title}
        </div>
        {!hideComposerName && song.composer_name && (
          <div style={{
            color: DESIGN_SYSTEM.colors.text.tertiary,
            fontSize: DESIGN_SYSTEM.fontSize.sm,
          }}>
            {song.composer_name}
          </div>
        )}
      </div>

      {/* Metadata pills */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {primaryGenre && <Badge color={DESIGN_SYSTEM.colors.brand.purple}>{primaryGenre}</Badge>}
        {secondaryGenre && <Badge color={DESIGN_SYSTEM.colors.brand.blue}>{secondaryGenre}</Badge>}
        {instrumentType && <Badge color={DESIGN_SYSTEM.colors.accent.amber}>{instrumentType}</Badge>}
        {song.mood && <Badge color={DESIGN_SYSTEM.colors.brand.accent}>{song.mood}</Badge>}
        {song.key && <Badge color={DESIGN_SYSTEM.colors.brand.secondary}><Music size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />{song.key}</Badge>}
        {licensingStatus && (
          <span style={{
            background: isOneStopTrack ? `${DESIGN_SYSTEM.colors.brand.primary}18` : `${DESIGN_SYSTEM.colors.bg.elevated}`,
            color: isOneStopTrack ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary,
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
            border: `1px solid ${isOneStopTrack ? DESIGN_SYSTEM.colors.brand.primary + '40' : DESIGN_SYSTEM.colors.border.light}`,
          }} title={isOneStopTrack ? 'Prioritized in executive sync searches' : undefined}>
            <Shield size={10} />
            {isOneStopTrack ? 'One-Stop \u2022 Priority' : licensingStatus}
          </span>
        )}
        {licensingStatus === 'Pending/Negotiation' && (
          <span style={{
            background: `${DESIGN_SYSTEM.colors.accent.red}15`,
            color: DESIGN_SYSTEM.colors.accent.red,
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            whiteSpace: "nowrap",
            border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}30`,
          }} title="Update licensing info to appear in executive One-Stop searches">
            Action Required
          </span>
        )}
        {song.bpm && (
          <span style={{
            background: `${DESIGN_SYSTEM.colors.accent.amber}18`,
            color: DESIGN_SYSTEM.colors.accent.amber,
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 6,
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            whiteSpace: "nowrap",
          }}>
            <Zap size={10} />{song.bpm} BPM
          </span>
        )}
        {song.duration && (
          <span style={{
            color: DESIGN_SYSTEM.colors.text.muted,
            fontSize: DESIGN_SYSTEM.fontSize.xs,
            display: "inline-flex",
            alignItems: "center",
            gap: '4px',
            fontWeight: DESIGN_SYSTEM.fontWeight.medium,
          }}>
            <Clock size={12} />{song.duration}
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: DESIGN_SYSTEM.spacing.md }}>
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
