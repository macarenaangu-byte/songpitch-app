import { useState, useEffect, useRef } from "react";
import { createClient } from '@supabase/supabase-js';
import { Search, Users, Music, MessageCircle, User, ChevronRight, ChevronLeft, Play, Pause, Clock, X, ArrowLeft, Send, LogOut, Plus, Briefcase, FileText, TrendingUp, Check, CheckCircle, Upload, Edit, Trash2, Calendar, DollarSign, RotateCcw, SkipBack, SkipForward, Shield, Zap, Headphones, XCircle, Sun, Moon, Bookmark, Volume2, VolumeX } from "lucide-react";
import { parseBlob } from 'music-metadata';
import { analyzeAudioFile } from './audioAnalyzer';

// ─── SUPABASE CONFIGURATION ─────────────────────────────────────────────────
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── TOAST NOTIFICATION SYSTEM ──────────────────────────────────────────────
let toastQueue = [];
let toastListeners = [];

const showToast = (message, type = 'success') => {
  const toast = { id: Date.now() + Math.random(), message, type };
  toastQueue.push(toast);
  toastListeners.forEach((l) => l([...toastQueue]));
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== toast.id);
    toastListeners.forEach((l) => l([...toastQueue]));
  }, 4500);
};

// ─── FRIENDLY ERROR HELPER ──────────────────────────────────────────────────
const friendlyError = (err) => {
  if (!err) return 'Something went wrong. Please try again.';
  const msg = err.message || String(err);
  const code = err.code || '';
  if (code === '23505' || msg.includes('duplicate key')) return 'This already exists.';
  if (code === '23503') return 'This item is referenced elsewhere and cannot be removed.';
  if (code === 'PGRST116') return 'Item not found.';
  if (code === 'PGRST301' || msg.includes('JWT expired') || msg.includes('token')) return 'Your session has expired. Please refresh the page and sign in again.';
  if (msg.includes('Invalid login')) return 'Invalid email or password. Please try again.';
  if (msg.includes('User already registered')) return 'An account with this email already exists. Try signing in instead.';
  if (msg.includes('Email not confirmed')) return 'Please verify your email before signing in. Check your inbox.';
  if (msg.includes('Password should be')) return msg; // Supabase password requirement messages are already clear
  if (msg.includes('Network') || msg.includes('fetch')) return 'Network error. Please check your connection and try again.';
  if (msg.includes('storage') || msg.includes('bucket')) return 'File upload failed. Please try again with a smaller file.';
  return 'Something went wrong. Please try again.';
};

const DESIGN_SYSTEM = {
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },

  spacing: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '28px',
  },

  fontSize: {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
  },

  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.25)',
    md: '0 4px 12px rgba(0,0,0,0.2)',
    lg: '0 8px 24px rgba(0,0,0,0.25)',
    xl: '0 16px 40px rgba(0,0,0,0.3)',
    hover: '0 8px 24px rgba(29,185,84,0.12), 0 2px 8px rgba(0,0,0,0.2)',
    card: '0 1px 3px rgba(0,0,0,0.2)',
  },

  colors: {
    bg: {
      primary: '#0a0a0a',
      secondary: '#111111',
      card: '#181818',
      hover: '#1f1f1f',
      elevated: '#242424',
      surface: '#282828',
    },
    border: {
      light: '#282828',
      medium: '#333333',
      accent: '#1DB954',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
      tertiary: '#898989',
      muted: '#6A6A6A',
    },
    brand: {
      primary: '#1DB954',
      light: '#1ED760',
      dark: '#1AA34A',
      accent: '#1DB954',  // secondary green accent (formerly cyan)
      blue: '#2D7FF9',
      purple: '#8B5CF6',
      secondary: '#2D7FF9',
    },
    gradient: {
      main: 'linear-gradient(135deg, #1DB954 0%, #1ED760 100%)',
      subtle: 'linear-gradient(135deg, rgba(29,185,84,0.12) 0%, rgba(45,127,249,0.08) 100%)',
      hover: 'linear-gradient(135deg, rgba(29,185,84,0.18) 0%, rgba(45,127,249,0.12) 100%)',
      hero: 'linear-gradient(135deg, #0a0a0a 0%, #111a14 50%, #0a0a0a 100%)',
    },
    accent: {
      purple: '#8B5CF6',
      pink: '#EC4899',
      green: '#1DB954',
      red: '#E74C3C',
      amber: '#F59E0B',
    },
  },

  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ─── GENRE OPTIONS ──────────────────────────────────────────────────────────
const GENRE_OPTIONS = ['Classical', 'Jazz', 'Electronic', 'Hip-Hop', 'Pop', 'Film Score', 'Ambient', 'R&B', 'Afrobeats', 'World Music', 'Musical Theatre', 'Rock', 'Country', 'Folk', 'Blues', 'Reggae', 'Latin', 'K-Pop', 'EDM', 'Indie'];

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter(listener => listener !== setToasts);
    };
  }, []);

  const removeToast = (id) => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    setToasts([...toastQueue]);
  };

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            background: toast.type === 'success' ? DESIGN_SYSTEM.colors.accent.green : toast.type === 'error' ? DESIGN_SYSTEM.colors.accent.red : DESIGN_SYSTEM.colors.brand.primary,
            color: DESIGN_SYSTEM.colors.text.primary,
            padding: '14px 20px',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            minWidth: 280,
            maxWidth: 400,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Outfit', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'slideIn 0.3s ease-out',
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
          onClick={() => removeToast(toast.id)}
        >
          <span style={{ flex: 1 }}>{toast.message}</span>
          <X size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────
const compressImage = (file, maxWidth = 400, quality = 0.8) => {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        resolve(blob);
      }, 'image/jpeg', quality);
    };
    img.src = objectUrl;
  });
};

function Avatar({ name, color, size = 40, avatarUrl }) {
  const [imgError, setImgError] = useState(false);
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || "Avatar"}
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: DESIGN_SYSTEM.radius.full,
          objectFit: "cover",
          flexShrink: 0,
          boxShadow: DESIGN_SYSTEM.shadow.sm,
          border: '2px solid rgba(255,255,255,0.1)',
        }}
      />
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: DESIGN_SYSTEM.radius.full,
      background: color || DESIGN_SYSTEM.colors.brand.primary,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: DESIGN_SYSTEM.colors.text.primary,
      fontWeight: DESIGN_SYSTEM.fontWeight.bold,
      fontSize: size * 0.38,
      flexShrink: 0,
      fontFamily: "'Outfit', sans-serif",
      boxShadow: DESIGN_SYSTEM.shadow.sm,
      border: '2px solid rgba(255,255,255,0.1)',
    }}>
      {initials}
    </div>
  );
}

function Badge({ children, color = DESIGN_SYSTEM.colors.brand.primary }) {
  return (
    <span style={{ 
      background: color + "22", 
      color: color, 
      padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`, 
      borderRadius: DESIGN_SYSTEM.radius.full, 
      fontSize: DESIGN_SYSTEM.fontSize.xs, 
      fontWeight: DESIGN_SYSTEM.fontWeight.semibold, 
      border: `1px solid ${color}33`,
      display: 'inline-block',
      transition: DESIGN_SYSTEM.transition.fast,
    }}>
      {children}
    </span>
  );
}

// Profile badge definitions
const PROFILE_BADGES = {
  alpha_tester: { label: 'Alpha Tester', icon: '🧪', color: DESIGN_SYSTEM.colors.brand.purple },
  verified_composer: { label: 'Complete Profile', icon: '✓', color: DESIGN_SYSTEM.colors.brand.primary },
  verified_exec: { label: 'Complete Profile', icon: '✓', color: DESIGN_SYSTEM.colors.brand.blue },
  top_contributor: { label: 'Top Contributor', icon: '⭐', color: DESIGN_SYSTEM.colors.accent.amber },
};

function ProfileBadges({ user }) {
  // Derive badges from user data
  const badges = [];

  // All alpha users get this badge
  badges.push('alpha_tester');

  // Profile completion = verified badge
  const isComposer = user.account_type === 'composer';
  const fields = isComposer
    ? [user.bio, user.location, user.avatar_url, user.pro, user.role, Array.isArray(user.genres) && user.genres.length > 0, user.instruments]
    : [user.bio, user.location, user.avatar_url, user.company, user.job_title, Array.isArray(user.genres) && user.genres.length > 0];
  const filled = fields.filter(Boolean).length;
  if (filled >= fields.length) {
    badges.push(isComposer ? 'verified_composer' : 'verified_exec');
  }

  // Also include any badges stored in the database
  if (Array.isArray(user.badges)) {
    user.badges.forEach(b => { if (!badges.includes(b)) badges.push(b); });
  }

  if (badges.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {badges.map(key => {
        const def = PROFILE_BADGES[key];
        if (!def) return null;
        return (
          <span key={key} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: `${def.color}15`, color: def.color,
            border: `1px solid ${def.color}33`, borderRadius: 20,
            padding: '3px 10px', fontSize: 11, fontWeight: 600,
            fontFamily: "'Outfit', sans-serif",
          }}>
            <span style={{ fontSize: 12 }}>{def.icon}</span> {def.label}
          </span>
        );
      })}
    </div>
  );
}

function StatCard({ icon, label, value, color = DESIGN_SYSTEM.colors.brand.primary, onClick, subtitle }) {
  return (
    <div className="song-card" onClick={onClick} style={{
      background: DESIGN_SYSTEM.colors.bg.card,
      borderRadius: DESIGN_SYSTEM.radius.lg,
      padding: DESIGN_SYSTEM.spacing.lg,
      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
      flex: 1,
      minWidth: 140,
      transition: DESIGN_SYSTEM.transition.normal,
      cursor: onClick ? 'pointer' : 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = onClick ? color + '60' : DESIGN_SYSTEM.colors.border.medium;
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = DESIGN_SYSTEM.shadow.md;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light;
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: DESIGN_SYSTEM.radius.md,
        background: color + "18",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: DESIGN_SYSTEM.spacing.sm
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: DESIGN_SYSTEM.fontSize.xxl,
        fontWeight: DESIGN_SYSTEM.fontWeight.extrabold,
        color: DESIGN_SYSTEM.colors.text.primary,
        fontFamily: "'Outfit', sans-serif"
      }}>{value}</div>
      <div style={{
        fontSize: DESIGN_SYSTEM.fontSize.sm,
        color: DESIGN_SYSTEM.colors.text.tertiary,
        marginTop: DESIGN_SYSTEM.spacing.xs
      }}>{label}</div>
      {subtitle && (
        <div style={{
          fontSize: 12,
          color: DESIGN_SYSTEM.colors.brand.primary,
          marginTop: 4,
          fontWeight: 600,
        }}>{subtitle}</div>
      )}
    </div>
  );
}

function SongCard({ song, onPlay, isPlaying, showActions, onEdit, onDelete }) {
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
        <div style={{ 
          color: DESIGN_SYSTEM.colors.text.tertiary, 
          fontSize: DESIGN_SYSTEM.fontSize.sm,
        }}>
          {song.composer_name || "Unknown"}
        </div>
      </div>

      {/* Metadata pills */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {song.genre && <Badge color={DESIGN_SYSTEM.colors.brand.purple}>{song.genre}</Badge>}
        {song.mood && <Badge color={DESIGN_SYSTEM.colors.brand.accent}>{song.mood}</Badge>}
        {song.key && <Badge color={DESIGN_SYSTEM.colors.brand.secondary}><Music size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />{song.key}</Badge>}
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

function LoadingSongCard() {
  return (
    <div className="song-card" style={{
      background: DESIGN_SYSTEM.colors.bg.card,
      borderRadius: DESIGN_SYSTEM.radius.lg,
      padding: `${DESIGN_SYSTEM.spacing.md} ${DESIGN_SYSTEM.spacing.lg}`,
      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
      display: 'flex',
      alignItems: 'center',
      gap: DESIGN_SYSTEM.spacing.md,
    }}>
      <div className="skeleton" style={{ width: 52, height: 52, borderRadius: DESIGN_SYSTEM.radius.md, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: DESIGN_SYSTEM.spacing.xs }}>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
      </div>
    </div>
  );
}

function LoadingOpportunityCard() {
  return (
    <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 20, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="skeleton" style={{ height: 14, width: '50%', borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <div className="skeleton" style={{ height: 12, width: 120, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 12, width: 60, borderRadius: 6 }} />
      </div>
    </div>
  );
}

function LoadingMessageItem() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 999 }} />
      <div style={{ maxWidth: '60%' }}>
        <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 8, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 8 }} />
      </div>
    </div>
  );
}

// ─── CONFIRM MODAL ──────────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    }}>
      <div style={{
        background: DESIGN_SYSTEM.colors.bg.card,
        borderRadius: 20,
        padding: 28,
        maxWidth: 420,
        width: '100%',
        border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
      }}>
        <h3 style={{
          color: DESIGN_SYSTEM.colors.text.primary,
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          marginBottom: 12,
        }}>
          {title}
        </h3>
        <p style={{
          color: DESIGN_SYSTEM.colors.text.secondary,
          fontSize: 14,
          lineHeight: 1.5,
          fontFamily: "'Outfit', sans-serif",
          marginBottom: 24,
        }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              color: DESIGN_SYSTEM.colors.text.tertiary,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 10,
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: DESIGN_SYSTEM.colors.brand.primary,
              color: DESIGN_SYSTEM.colors.text.primary,
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AUDIO PLAYER ────────────────────────────────────────────────────────────
function useAudioPlayer() {
  const [audio] = useState(new Audio());
  const [playingSong, setPlayingSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setPlayingSong(null);
      setCurrentTime(0);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onDurationChange = () => setDuration(audio.duration);
    const onError = () => {
      showToast("Unable to play this track. The file may be unavailable.", "error");
      setIsPlaying(false);
      setPlayingSong(null);
      setCurrentTime(0);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
  }, [audio]);

  const play = (song) => {
    if (!song.audio_url) {
      showToast("No audio file available for this song", "error");
      return;
    }

    if (playingSong?.id === song.id) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    } else {
      audio.src = song.audio_url;
      audio.play();
      setPlayingSong(song);
      setCurrentTime(0);
      setDuration(0);
    }
  };

  const stop = () => {
    audio.pause();
    audio.currentTime = 0;
    setPlayingSong(null);
    setCurrentTime(0);
    setDuration(0);
  };

  const restart = () => {
    audio.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      audio.play();
    }
  };

  const skipBack = (seconds = 10) => {
    audio.currentTime = Math.max(0, audio.currentTime - seconds);
    setCurrentTime(audio.currentTime);
  };

  const skipForward = (seconds = 10) => {
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + seconds);
    setCurrentTime(audio.currentTime);
  };

  const seekTo = (time) => {
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const setVolumeLevel = (v) => {
    const val = Math.max(0, Math.min(1, v));
    audio.volume = val;
    setVolume(val);
    if (val > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      audio.volume = volume || 1;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  return { playingSong, isPlaying, currentTime, duration, volume, isMuted, play, stop, restart, skipBack, skipForward, seekTo, setVolumeLevel, toggleMute };
}

// ─── NOW PLAYING BAR ─────────────────────────────────────────────────────────
function NowPlayingBar({ playingSong, isPlaying, currentTime, duration, onPlay, onStop, onRestart, onSkipBack, onSkipForward, onSeekTo, volume, isMuted, onVolumeChange, onToggleMute, sidebarCollapsed }) {
  if (!playingSong) return null;

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const newTime = percent * duration;
    onSeekTo(newTime);
  };

  const controlBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: DESIGN_SYSTEM.radius.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: DESIGN_SYSTEM.transition.fast,
    color: DESIGN_SYSTEM.colors.text.secondary,
  };

  return (
    <div className="now-playing-bar" style={{
      position: 'fixed',
      bottom: 0,
      left: sidebarCollapsed ? 96 : 240,
      right: 0,
      background: DESIGN_SYSTEM.colors.bg.card,
      borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`,
      padding: '0',
      zIndex: 100,
      transition: 'left 0.2s ease',
      fontFamily: "'Outfit', sans-serif",
      boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
    }}>
      {/* Waveform Progress Bar (clickable) */}
      <div
        onClick={handleProgressClick}
        style={{
          width: '100%',
          height: 24,
          background: DESIGN_SYSTEM.colors.bg.primary,
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          padding: '4px 0',
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: 80 }).map((_, i) => {
          const barProgress = ((i + 1) / 80) * 100;
          const isPast = barProgress <= progress;
          // Deterministic pseudo-random height based on index
          const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
          const baseHeight = 30 + (seed - Math.floor(seed)) * 70; // 30-100% height
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${baseHeight}%`,
                borderRadius: 1,
                background: isPast ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.bg.elevated,
                opacity: isPast ? (isPlaying ? 1 : 0.7) : 0.4,
                transition: 'background 0.1s, opacity 0.2s',
                animation: isPast && isPlaying && barProgress > progress - 5 ? `waveformPulse ${0.4 + (seed - Math.floor(seed)) * 0.4}s ease-in-out infinite alternate` : 'none',
              }}
            />
          );
        })}
        {/* Playhead indicator */}
        <div style={{
          position: 'absolute',
          left: `${progress}%`,
          top: 0,
          bottom: 0,
          width: 2,
          background: DESIGN_SYSTEM.colors.brand.light,
          boxShadow: `0 0 8px ${DESIGN_SYSTEM.colors.brand.primary}80`,
          transition: 'left 0.1s linear',
          zIndex: 1,
        }} />
      </div>

      {/* Controls Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 24px',
        gap: '16px',
      }}>
        {/* Song Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: DESIGN_SYSTEM.radius.sm,
            background: DESIGN_SYSTEM.colors.gradient.subtle,
            border: `1px solid ${DESIGN_SYSTEM.colors.brand.accent}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Music size={18} color={DESIGN_SYSTEM.colors.brand.accent} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              color: DESIGN_SYSTEM.colors.text.primary,
              fontSize: DESIGN_SYSTEM.fontSize.sm,
              fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {playingSong.title}
            </div>
            <div style={{
              color: DESIGN_SYSTEM.colors.text.muted,
              fontSize: DESIGN_SYSTEM.fontSize.xs,
            }}>
              {playingSong.composer_name || 'Unknown Artist'}
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Restart */}
          <button
            onClick={onRestart}
            style={controlBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover; }}
            onMouseLeave={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; e.currentTarget.style.background = 'none'; }}
            title="Restart"
            aria-label="Restart playback"
          >
            <RotateCcw size={16} />
          </button>

          {/* Skip Back 10s */}
          <button
            onClick={() => onSkipBack(10)}
            style={controlBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover; }}
            onMouseLeave={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; e.currentTarget.style.background = 'none'; }}
            title="Back 10s"
            aria-label="Back 10 seconds"
          >
            <SkipBack size={16} />
            <span style={{ fontSize: 9, fontWeight: 700, marginLeft: 1 }}>10</span>
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => onPlay(playingSong)}
            style={{
              ...controlBtnStyle,
              width: 42,
              height: 42,
              borderRadius: DESIGN_SYSTEM.radius.full,
              background: DESIGN_SYSTEM.colors.brand.primary,
              color: DESIGN_SYSTEM.colors.text.primary,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.light; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.transform = 'scale(1)'; }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} fill={DESIGN_SYSTEM.colors.text.primary} />}
          </button>

          {/* Skip Forward 10s */}
          <button
            onClick={() => onSkipForward(10)}
            style={controlBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover; }}
            onMouseLeave={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; e.currentTarget.style.background = 'none'; }}
            title="Forward 10s"
            aria-label="Forward 10 seconds"
          >
            <span style={{ fontSize: 9, fontWeight: 700, marginRight: 1 }}>10</span>
            <SkipForward size={16} />
          </button>
        </div>

        {/* Time Display */}
        <div style={{
          color: DESIGN_SYSTEM.colors.text.muted,
          fontSize: DESIGN_SYSTEM.fontSize.xs,
          fontWeight: DESIGN_SYSTEM.fontWeight.medium,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 80,
          textAlign: 'center',
        }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Volume Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={onToggleMute}
            style={controlBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover; }}
            onMouseLeave={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; e.currentTarget.style.background = 'none'; }}
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={e => onVolumeChange(parseFloat(e.target.value))}
            style={{ width: 70, accentColor: DESIGN_SYSTEM.colors.brand.primary, cursor: 'pointer' }}
            aria-label="Volume"
          />
        </div>

        {/* Close/Stop */}
        <button
          onClick={onStop}
          style={controlBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.accent.red; e.currentTarget.style.background = DESIGN_SYSTEM.colors.accent.red + '15'; }}
          onMouseLeave={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; e.currentTarget.style.background = 'none'; }}
          title="Stop"
          aria-label="Stop playback"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── AUTH PAGE ───────────────────────────────────────────────────────────────
function AuthPage({ onAuthComplete }) {
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchView = (view) => { setAuthView(view); setError(""); };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (authView === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          showToast("Account created! Please check your email to verify your account, then log in.", "success");
          switchView('login');
        }
      } else if (authView === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        showToast("Password reset link sent! Check your email inbox.", "success");
        switchView('login');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthComplete(data.user);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: DESIGN_SYSTEM.colors.bg.primary,
    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
    borderRadius: 10,
    padding: "12px 16px",
    color: DESIGN_SYSTEM.colors.text.primary,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Outfit', sans-serif",
    transition: "all 0.2s ease"
  };

  const headings = {
    login: { title: 'Welcome Back', subtitle: 'Sign in to SongPitch' },
    signup: { title: 'Create Account', subtitle: 'Join SongPitch and start connecting' },
    forgot: { title: 'Reset Password', subtitle: "Enter your email and we'll send a reset link" },
  };

  return (
    <div className="hero-animated-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 24, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/songpitch-logo.png" alt="SongPitch" style={{ width: 56, height: 56, objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            {headings[authView].title}
          </h1>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14 }}>
            {headings[authView].subtitle}
          </p>
        </div>

        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              aria-label="Email address"
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(29,185,84,0.1)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
          {authView !== 'forgot' && (
            <div style={{ marginBottom: authView === 'login' ? 8 : 20 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                placeholder={authView === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                aria-label="Password"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(29,185,84,0.1)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          )}
          {authView === 'login' && (
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <button type="button" onClick={() => switchView('forgot')} style={{ background: 'none', border: 'none', color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'color 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary}
                onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.muted}
              >
                Forgot password?
              </button>
            </div>
          )}
          {authView === 'forgot' && <div style={{ height: 12 }} />}
          {error && <div style={{ color: DESIGN_SYSTEM.colors.accent.red, fontSize: 13, marginBottom: 16, textAlign: "center", padding: 12, background: `${DESIGN_SYSTEM.colors.accent.red}15`, borderRadius: 8, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}33` }} role="alert">{error}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "13px", fontWeight: 600, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: loading ? 0.6 : 1, transition: "all 0.2s ease", boxShadow: '0 4px 16px rgba(29,185,84,0.25)' }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.light; e.currentTarget.style.boxShadow = '0 6px 24px rgba(29,185,84,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,185,84,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? "Loading..." : authView === 'signup' ? "Create Account" : authView === 'forgot' ? "Send Reset Link" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, paddingTop: 20, borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
          {authView === 'forgot' ? (
            <button onClick={() => switchView('login')} style={{ background: "none", border: "none", color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "color 0.2s ease" }}
              onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.light}
              onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary}
            >
              ← Back to Sign In
            </button>
          ) : (
            <>
              <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 14 }}>
                {authView === 'signup' ? 'Already have an account?' : "Don't have an account?"}
              </span>
              {' '}
              <button onClick={() => switchView(authView === 'signup' ? 'login' : 'signup')} style={{ background: "none", border: "none", color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: "color 0.2s ease" }}
                onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.light}
                onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary}
              >
                {authView === 'signup' ? 'Sign In' : 'Create Account'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ACCOUNT SETUP PAGE ──────────────────────────────────────────────────────
function AccountSetupPage({ user, onComplete }) {
  const [accountType, setAccountType] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: user.id,
          account_type: accountType,
          first_name: firstName,
          last_name: lastName,
          bio: bio || null,
          location: location || null,
          avatar_color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      if (accountType === 'composer' && genres.length > 0) {
        const { error: composerError } = await supabase
          .from('composers')
          .insert([{
            user_profile_id: profileData.id,
            genres: genres
          }]);
        if (composerError) throw composerError;
      }

      onComplete();
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-animated-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 520, background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 24, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/songpitch-logo.png" alt="SongPitch" style={{ width: 48, height: 48, objectFit: 'contain', margin: '0 auto 14px', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Complete Your Profile</h1>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14 }}>Tell us a bit about yourself to get started</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 10 }}>I am a *</label>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { type: 'composer', label: 'Composer', desc: 'I create music', icon: '🎵' },
                { type: 'music_executive', label: 'Music Executive', desc: 'I discover talent', icon: '🎯' }
              ].map(({ type, label, desc, icon }) => (
                <button key={type} type="button" onClick={() => setAccountType(type)} style={{
                  flex: 1, padding: "16px 14px", borderRadius: 12, textAlign: 'center',
                  border: accountType === type ? `2px solid ${DESIGN_SYSTEM.colors.brand.primary}` : `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                  background: accountType === type ? `${DESIGN_SYSTEM.colors.brand.primary}15` : DESIGN_SYSTEM.colors.bg.primary,
                  color: accountType === type ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.tertiary,
                  cursor: "pointer", fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => { if (accountType !== type) e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.medium; }}
                  onMouseLeave={e => { if (accountType !== type) e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: DESIGN_SYSTEM.colors.text.muted }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <input type="text" placeholder="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ flex: 1, background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
            <input type="text" placeholder="Last Name *" value={lastName} onChange={e => setLastName(e.target.value)} required style={{ flex: 1, background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
          </div>

          <textarea placeholder="Bio (optional)" value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", resize: "none", marginBottom: 16, boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />

          <input type="text" placeholder="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 16px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", marginBottom: 16, boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />

          {accountType === 'composer' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Genres (select all that apply)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {['Classical', 'Jazz', 'Electronic', 'Hip-Hop', 'Pop', 'Film Score', 'Ambient', 'R&B', 'Afrobeats', 'World Music'].map(g => (
                  <button key={g} type="button" onClick={() => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])} style={{ background: genres.includes(g) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.bg.primary, color: genres.includes(g) ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${genres.includes(g) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={!accountType || loading} style={{ width: "100%", background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "13px", fontWeight: 600, fontSize: 15, cursor: (!accountType || loading) ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: (!accountType || loading) ? 0.6 : 1, transition: 'all 0.2s ease', boxShadow: '0 4px 16px rgba(29,185,84,0.25)' }}
            onMouseEnter={e => { if (accountType && !loading) { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.light; e.currentTarget.style.boxShadow = '0 6px 24px rgba(29,185,84,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,185,84,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? "Creating Profile..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── PORTFOLIO PAGE (COMPOSERS ONLY) ─────────────────────────────────────────
function PortfolioPage({ userProfile, audioPlayer }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(""); // e.g. "Analyzing song 2 of 5..."
  const [confirmModal, setConfirmModal] = useState(null);
  const dragCounter = useRef(0);

  // Use shared audio player from parent
  const { playingSong, isPlaying, play: playAudio } = audioPlayer;

  const songGenreOptions = GENRE_OPTIONS;
  const moodOptions = ['Uplifting', 'Melancholic', 'Energetic', 'Calm', 'Dark', 'Romantic', 'Epic', 'Playful', 'Aggressive', 'Dreamy', 'Nostalgic', 'Mysterious', 'Triumphant', 'Tense'];

  // Form state
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [duration, setDuration] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [mood, setMood] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [audioFile, setAudioFile] = useState(null);

  // Bulk upload state
  const [, setBulkFiles] = useState([]);
  const [bulkData, setBulkData] = useState([]);

  // Auto-analyze and fill fields when a file is selected
  const handleAudioFileChange = async (file) => {
    setAudioFile(file);
    if (!file) return;

    // Auto-fill title from filename (strip extension), only if title is empty
    if (!title || title.trim() === '') {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }

    setAnalyzing(true);
    try {
      const analysis = await analyzeAudioFile(file);
      if (analysis.duration) {
        // Format as M:SS (e.g., 3:42)
        const totalSec = Math.round(analysis.duration);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
      if (analysis.bpm) setBpm(Math.round(analysis.bpm));
      if (analysis.key) setKey(analysis.key);
      if (analysis.genre !== undefined && analysis.genre !== null) setGenre(analysis.genre);
      if (analysis.mood !== undefined && analysis.mood !== null) setMood(analysis.mood);
    } catch (err) {
      console.error("Audio analysis failed:", err);
      showToast("Couldn't auto-analyze audio. You can fill in details manually.", "info");
    } finally {
      setAnalyzing(false);
    }
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
    setLoading(true);

    try {
      let audioUrl = null;

      // Upload audio file if provided
      if (audioFile) {
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${userProfile.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('song-files')
          .upload(fileName, audioFile);
        if (uploadError) {
          throw uploadError;
        }
        // Get the Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('song-files')
          .getPublicUrl(fileName);
        audioUrl = publicUrl;
      }

      // Use manual title if provided, otherwise fallback to file name (without extension)
      const songTitle = title && title.trim() !== '' ? title : (audioFile ? audioFile.name.replace(/\.[^/.]+$/, '') : 'Untitled');
      const songData = {
        composer_id: userProfile.id,
        title: songTitle,
        genre: genre || null,
        duration: duration || null,
        bpm: bpm ? parseInt(bpm) : null,
        key: key || null,
        mood: mood || null,
        description: description || null,
        year: year || null,
        audio_url: audioUrl || (editingSong ? editingSong.audio_url : null)
      };

      if (editingSong) {
        const { error } = await supabase
          .from('songs')
          .update(songData)
          .eq('id', editingSong.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('songs')
          .insert([songData]);
        if (error) throw error;
      }

      resetForm();
      loadSongs();
      showToast(editingSong ? "Song updated!" : "Song added!", "success");
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
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
          const { error } = await supabase
            .from('songs')
            .delete()
            .eq('id', song.id);

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
    setEditingSong(song);
    setTitle(song.title);
    setGenre(song.genre || "");
    setDuration(song.duration || "");
    setBpm(song.bpm || "");
    setKey(song.key || "");
    setMood(song.mood || "");
    setDescription(song.description || "");
    setYear(song.year || new Date().getFullYear());
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingSong(null);
    setTitle("");
    setGenre("");
    setDuration("");
    setBpm("");
    setKey("");
    setMood("");
    setDescription("");
    setYear(new Date().getFullYear());
    setAudioFile(null);
    setShowForm(false);
  };

  const handleBulkFiles = async (e) => {
    const files = Array.from(e.target.files);
    setBulkFiles(files);

    // Process files to extract metadata
    const processed = await Promise.all(files.map(async (file) => {
      try {
        // Extract duration from audio file
        const duration = await getAudioDuration(file);
        
        // Extract ID3 metadata
        const metadata = await parseBlob(file);
        
        // Extract values from metadata
        const title = metadata.common.title || file.name.replace(/\.(mp3|wav|m4a|flac|ogg)$/i, '');
        const artist = metadata.common.artist || '';
        const album = metadata.common.album || '';
        const year = metadata.common.year || new Date().getFullYear();
        const genre = metadata.common.genre?.[0] || ''; // Genre is an array, take first
        const bpm = metadata.common.bpm || '';
        const key = metadata.common.key || '';
        
        return {
          file,
          title,
          artist,
          album,
          duration: formatDuration(duration),
          genre,
          bpm: bpm ? Math.round(bpm).toString() : '',
          key,
          mood: '',
          description: '',
          year
        };
      } catch (error) {
        console.error(`Error reading metadata for ${file.name}:`, error);
        // Fallback if metadata reading fails
        const duration = await getAudioDuration(file);
        return {
          file,
          title: file.name.replace(/\.(mp3|wav|m4a|flac|ogg)$/i, ''),
          artist: '',
          album: '',
          duration: formatDuration(duration),
          genre: '',
          bpm: '',
          key: '',
          mood: '',
          description: '',
          year: new Date().getFullYear()
        };
      }
    }));

    setBulkData(processed);
    setShowBulk(true);
  };

  const getAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
        URL.revokeObjectURL(objectUrl);
      });
      audio.src = objectUrl;
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateBulkField = (index, field, value) => {
    setBulkData(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const saveBulkSongs = async () => {
    setLoading(true);
    try {
      // Upload all audio files first and get their URLs
      for (let index = 0; index < bulkData.length; index++) {
        const item = bulkData[index];
        if (!item.file) continue;

        const fileExt = item.file.name.split('.').pop();
        const fileName = `${userProfile.id}/${Date.now()}_${index}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('song-files')
          .upload(fileName, item.file);

        if (uploadError) {
          console.error(`Error uploading ${item.file.name}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('song-files')
          .getPublicUrl(fileName);
        const audioUrl = urlData.publicUrl;

        // Insert initial row
        const { data: songRow, error: insertError } = await supabase
          .from('songs')
          .insert([{
            composer_id: userProfile.id,
            title: item.title,
            genre: item.genre || null,
            duration: item.duration || null,
            bpm: item.bpm ? parseInt(item.bpm) : null,
            key: item.key || null,
            mood: item.mood || null,
            description: item.description || null,
            year: item.year || null,
            audio_url: audioUrl
          }])
          .select()
          .single();

        if (insertError || !songRow) {
          console.error(`Error inserting song row for ${item.title}:`, insertError);
          continue;
        }

        // Run AI analysis
        setBulkAnalyzing(`AI analyzing song ${index + 1} of ${bulkData.length}...`);
        let analysis = {};
        try {
          analysis = await analyzeAudioFile(item.file);
        } catch (err) {
          console.error(`Error analyzing ${item.title}:`, err);
        }

        // Format duration as M:SS (same as single upload)
        let formattedDuration = songRow.duration;
        if (analysis.duration) {
          const totalSec = Math.round(analysis.duration);
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          formattedDuration = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // Update row with analysis results
        await supabase
          .from('songs')
          .update({
            duration: formattedDuration,
            bpm: analysis.bpm || songRow.bpm,
            key: analysis.key || songRow.key,
            genre: analysis.genre || songRow.genre,
            mood: analysis.mood || songRow.mood
          })
          .eq('id', songRow.id);
      }

      showToast(`${bulkData.length} songs uploaded successfully!`, "success");
      setBulkData([]);
      setBulkFiles([]);
      setShowBulk(false);
      loadSongs();
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setLoading(false);
      setBulkAnalyzing("");
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
    if (files.length === 0) {
      showToast("Please drop audio files only", "error");
      return;
    }

    if (files.length === 1) {
      // Single file — open the form with the file pre-loaded
      setAudioFile(files[0]);
      setTitle(files[0].name.replace(/\.[^/.]+$/, ''));
      setShowForm(true);
      try {
        const metadata = await parseBlob(files[0]);
        if (metadata.common.title) setTitle(metadata.common.title);
        if (metadata.common.genre?.[0]) setGenre(metadata.common.genre[0]);
        if (metadata.format.duration) {
          const mins = Math.floor(metadata.format.duration / 60);
          const secs = Math.floor(metadata.format.duration % 60);
          setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
        if (metadata.format.bitsPerSample) setBpm('');
      } catch (err) {
        // Metadata extraction failed, that's fine
      }
      showToast("File loaded — fill in the details and save!", "info");
    } else {
      // Multiple files — trigger bulk upload flow
      handleBulkFiles({ target: { files } });
    }
  };

  return (
    <div
      style={{ padding: "32px 36px", minHeight: "100%", overflowY: "auto", position: "relative" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(29,185,84,0.08)",
          border: `3px dashed ${DESIGN_SYSTEM.colors.brand.primary}`,
          borderRadius: 20,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
          pointerEvents: "none",
        }}>
          <Upload size={48} color={DESIGN_SYSTEM.colors.brand.primary} />
          <div style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
            Drop audio files here
          </div>
          <div style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14 }}>
            Drop one file for single upload, or multiple for bulk
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>My Portfolio</h1>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginTop: 4 }}>Manage your music catalog</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ background: DESIGN_SYSTEM.colors.accent.purple, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', sans-serif" }}>
            <Upload size={15} /> Bulk Upload
            <input type="file" multiple accept="audio/*" onChange={handleBulkFiles} style={{ display: "none" }} />
          </label>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', sans-serif" }}>
            <Plus size={15} /> Add Song
          </button>
        </div>
      </div>

      {/* Single Song Form */}
      {showForm && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 22, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{editingSong ? "Edit Song" : "Add New Song"}</h3>
            <button
              onClick={resetForm}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Close form"
              title="Close"
            >
              <X size={18} color={DESIGN_SYSTEM.colors.text.muted} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input type="text" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              <select value={genre} onChange={e => setGenre(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: genre ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Select Genre...</option>
                {songGenreOptions.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input type="text" placeholder="Duration (e.g., 3:45)" value={duration} onChange={e => setDuration(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              <input type="number" placeholder="BPM" min={20} max={300} value={bpm} onChange={e => setBpm(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
              <select value={key} onChange={e => setKey(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: key ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Select Key...</option>
                {['C Major', 'C Minor', 'C# Major', 'C# Minor', 'D Major', 'D Minor', 'Eb Major', 'Eb Minor', 'E Major', 'E Minor', 'F Major', 'F Minor', 'F# Major', 'F# Minor', 'G Major', 'G Minor', 'Ab Major', 'Ab Minor', 'A Major', 'A Minor', 'Bb Major', 'Bb Minor', 'B Major', 'B Minor'].map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <select value={mood} onChange={e => setMood(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: mood ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Select Mood...</option>
                {moodOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", resize: "none", marginBottom: 12, boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Audio File {editingSong && !audioFile && "(Optional - leave blank to keep existing)"}</label>
              <input 
                type="file" 
                accept="audio/*" 
                onChange={e => handleAudioFileChange(e.target.files[0])}
                style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}
              />
              {audioFile && !analyzing && (
                <div style={{ color: DESIGN_SYSTEM.colors.accent.green, fontSize: 12, marginTop: 6 }}>
                  ✓ {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
              {analyzing && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "12px 16px", background: `${DESIGN_SYSTEM.colors.brand.primary}15`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40`, borderRadius: 10 }}>
                  <div style={{ width: 20, height: 20, border: `2.5px solid ${DESIGN_SYSTEM.colors.brand.primary}40`, borderTopColor: DESIGN_SYSTEM.colors.brand.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>AI is analyzing your song...</span>
                </div>
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

      {/* Bulk Upload Table */}
      {showBulk && bulkData.length > 0 && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 22, border: `1px solid ${DESIGN_SYSTEM.colors.accent.purple}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Review & Complete ({bulkData.length} songs)</h3>
            <button
              onClick={() => { setShowBulk(false); setBulkData([]); setBulkFiles([]); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Close bulk upload"
              title="Close"
            >
              <X size={18} color={DESIGN_SYSTEM.colors.text.muted} />
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Title</th>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Duration</th>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Genre</th>
                  <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>BPM</th>
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
                    <td style={{ padding: "10px" }}><input value={item.bpm} onChange={e => updateBulkField(i, 'bpm', e.target.value)} type="number" style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }} /></td>
                    <td style={{ padding: "10px" }}><input value={item.key} onChange={e => updateBulkField(i, 'key', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }} /></td>
                    <td style={{ padding: "10px" }}><select value={item.mood} onChange={e => updateBulkField(i, 'mood', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.mood ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Mood...</option>{moodOptions.map(m => <option key={m} value={m}>{m}</option>)}</select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={saveBulkSongs} disabled={loading} style={{ background: DESIGN_SYSTEM.colors.accent.purple, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Uploading..." : `Upload All ${bulkData.length} Songs`}
            </button>
            {bulkAnalyzing && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, height: 16, border: `2px solid ${DESIGN_SYSTEM.colors.brand.primary}40`, borderTopColor: DESIGN_SYSTEM.colors.brand.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 13, fontWeight: 600 }}>{bulkAnalyzing}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Songs List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && songs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (<LoadingSongCard key={i} />))}
            </div>
          ) : songs.length === 0 ? (
          <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: "center" }}>
            <Music size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>Your portfolio is waiting</h3>
            <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Upload your first track and let the world hear your sound!</p>
          </div>
        ) : (
          songs.map(song => (
            <SongCard 
              key={song.id} 
              song={song} 
              isPlaying={playingSong?.id === song.id && isPlaying} 
              onPlay={playAudio}
              showActions={true}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
      <ConfirmModal
        open={confirmModal?.open}
        title={confirmModal?.title}
        message={confirmModal?.message}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  );
}

// ─── OTHER PAGES (Dashboard, Roster, Catalog, Profile) ──────────────────────
function DashboardPage({ user, stats, onNavigate }) {
  // Calculate total platform stats for trust signals
  const totalSongs = stats.songs || 0;
  const totalUsers = stats.users || 0;

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Profile completion calculation
  const isComposer = user.account_type === 'composer';
  const profileFields = isComposer
    ? [
        { key: 'bio', label: 'Bio', filled: !!user.bio },
        { key: 'location', label: 'Location', filled: !!user.location },
        { key: 'avatar_url', label: 'Profile photo', filled: !!user.avatar_url },
        { key: 'pro', label: 'PRO affiliation', filled: !!user.pro },
        { key: 'role', label: 'Role', filled: !!user.role },
        { key: 'genres', label: 'Genres', filled: Array.isArray(user.genres) && user.genres.length > 0 },
        { key: 'instruments', label: 'Instruments', filled: !!user.instruments },
      ]
    : [
        { key: 'bio', label: 'Bio', filled: !!user.bio },
        { key: 'location', label: 'Location', filled: !!user.location },
        { key: 'avatar_url', label: 'Profile photo', filled: !!user.avatar_url },
        { key: 'company', label: 'Company', filled: !!user.company },
        { key: 'job_title', label: 'Job title', filled: !!user.job_title },
        { key: 'genres', label: 'Genres of interest', filled: Array.isArray(user.genres) && user.genres.length > 0 },
      ];
  const filledCount = profileFields.filter(f => f.filled).length;
  const totalFields = profileFields.length;
  const completionPct = Math.round((filledCount / totalFields) * 100);
  const missingFields = profileFields.filter(f => !f.filled);
  const isProfileComplete = missingFields.length === 0;

  return (
    <div style={{ padding: `${DESIGN_SYSTEM.spacing.xl} ${DESIGN_SYSTEM.spacing.xl}`, minHeight: "100%", overflowY: "auto" }}>
      {/* Hero Section with Trust Signal */}
      <div style={{
        background: DESIGN_SYSTEM.colors.gradient.hero,
        borderRadius: DESIGN_SYSTEM.radius.lg,
        padding: '32px',
        marginBottom: DESIGN_SYSTEM.spacing.lg,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`,
        boxShadow: DESIGN_SYSTEM.shadow.md,
      }}>
        <h1 style={{
          color: DESIGN_SYSTEM.colors.text.primary,
          fontSize: 30,
          fontWeight: DESIGN_SYSTEM.fontWeight.bold,
          fontFamily: "'Outfit', sans-serif",
          marginBottom: DESIGN_SYSTEM.spacing.xs,
        }}>
          {greeting}, <span style={{
            background: DESIGN_SYSTEM.colors.gradient.main,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>{user.first_name}</span>
        </h1>
        <p style={{ 
          color: DESIGN_SYSTEM.colors.text.secondary, 
          fontSize: DESIGN_SYSTEM.fontSize.md, 
          marginBottom: DESIGN_SYSTEM.spacing.md,
          maxWidth: '560px',
          lineHeight: 1.5,
        }}>
          {user.account_type === 'music_executive' 
            ? "Connect with talented composers and discover your next collaboration." 
            : "Showcase your work to industry professionals actively seeking new music."}
        </p>
        
        {/* Trust Signal */}
        {(totalSongs > 0 || totalUsers > 0) && (
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: DESIGN_SYSTEM.spacing.xs,
            background: 'rgba(255,255,255,0.08)',
            padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
            borderRadius: DESIGN_SYSTEM.radius.full,
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: DESIGN_SYSTEM.fontSize.sm,
            color: DESIGN_SYSTEM.colors.text.secondary,
            fontWeight: DESIGN_SYSTEM.fontWeight.medium,
          }}>
            <CheckCircle size={14} color={DESIGN_SYSTEM.colors.brand.accent} />
            {totalSongs > 100 && `${totalSongs.toLocaleString()}+ songs`}
            {totalSongs > 100 && totalUsers > 10 && ' • '}
            {totalUsers > 10 && `${totalUsers}+ active members`}
          </div>
        )}
      </div>

      {/* Profile Completion Bar */}
      {!isProfileComplete && (
        <div style={{
          background: DESIGN_SYSTEM.colors.bg.card,
          borderRadius: DESIGN_SYSTEM.radius.lg,
          padding: '20px 24px',
          marginBottom: DESIGN_SYSTEM.spacing.lg,
          border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                Complete your profile
              </div>
              <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, marginTop: 4 }}>
                {completionPct}% complete — add {missingFields.slice(0, 3).map(f => f.label.toLowerCase()).join(', ')}{missingFields.length > 3 ? ` +${missingFields.length - 3} more` : ''}
              </div>
            </div>
            <button onClick={() => onNavigate && onNavigate('profile')} style={{
              background: DESIGN_SYSTEM.colors.brand.primary,
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              whiteSpace: 'nowrap',
            }}>
              Complete Profile
            </button>
          </div>
          <div style={{ width: '100%', height: 5, background: DESIGN_SYSTEM.colors.bg.primary, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${completionPct}%`, height: '100%', background: DESIGN_SYSTEM.colors.brand.primary, borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}

      {/* Contextual Stats */}
      {isComposer ? (
        <div style={{ display: "flex", gap: DESIGN_SYSTEM.spacing.md, marginBottom: DESIGN_SYSTEM.spacing.lg, flexWrap: "wrap" }}>
          <StatCard
            icon={<Briefcase size={20} color={DESIGN_SYSTEM.colors.brand.accent} />}
            label={Array.isArray(user.genres) && user.genres.length > 0 ? "Opportunities for your genres" : "Open Opportunities"}
            value={stats.opportunities}
            color={DESIGN_SYSTEM.colors.brand.accent}
            onClick={() => onNavigate && onNavigate('opportunities')}
          />
          <StatCard
            icon={<Music size={20} color={DESIGN_SYSTEM.colors.brand.primary} />}
            label="Your Portfolio"
            value={stats.mySongs || 0}
            color={DESIGN_SYSTEM.colors.brand.primary}
            onClick={() => onNavigate && onNavigate('portfolio')}
            subtitle={(stats.mySongs || 0) === 0 ? "Upload your first song →" : null}
          />
          <StatCard
            icon={<MessageCircle size={20} color={DESIGN_SYSTEM.colors.brand.purple} />}
            label="Conversations"
            value={stats.conversations || 0}
            color={DESIGN_SYSTEM.colors.brand.purple}
            onClick={() => onNavigate && onNavigate('messages')}
          />
        </div>
      ) : (
        <div style={{ display: "flex", gap: DESIGN_SYSTEM.spacing.md, marginBottom: DESIGN_SYSTEM.spacing.lg, flexWrap: "wrap" }}>
          <StatCard
            icon={<FileText size={20} color={DESIGN_SYSTEM.colors.brand.accent} />}
            label="Applications Received"
            value={stats.totalResponses || 0}
            color={DESIGN_SYSTEM.colors.brand.accent}
            onClick={() => onNavigate && onNavigate('responses')}
            subtitle={(stats.totalResponses || 0) > 0 ? "Review applications →" : null}
          />
          <StatCard
            icon={<Users size={20} color={DESIGN_SYSTEM.colors.brand.purple} />}
            label="Composers to Browse"
            value={stats.users}
            color={DESIGN_SYSTEM.colors.brand.purple}
            onClick={() => onNavigate && onNavigate('roster')}
          />
          <StatCard
            icon={<MessageCircle size={20} color={DESIGN_SYSTEM.colors.brand.primary} />}
            label="Conversations"
            value={stats.conversations || 0}
            color={DESIGN_SYSTEM.colors.brand.primary}
            onClick={() => onNavigate && onNavigate('messages')}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div style={{
        background: DESIGN_SYSTEM.colors.bg.card,
        borderRadius: DESIGN_SYSTEM.radius.lg,
        padding: DESIGN_SYSTEM.spacing.lg,
        border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        boxShadow: DESIGN_SYSTEM.shadow.sm,
      }}>
        <h3 style={{
          color: DESIGN_SYSTEM.colors.text.primary,
          fontSize: DESIGN_SYSTEM.fontSize.lg,
          fontWeight: DESIGN_SYSTEM.fontWeight.bold,
          fontFamily: "'Outfit', sans-serif",
          marginBottom: 16
        }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {(user.account_type === 'music_executive' ? [
            { label: 'Browse Composers', desc: 'Discover new talent', icon: <Music size={20} color={DESIGN_SYSTEM.colors.brand.primary} />, page: 'roster' },
            { label: 'Search Catalog', desc: 'Find specific sounds', icon: <Search size={20} color={DESIGN_SYSTEM.colors.brand.blue} />, page: 'catalog' },
            { label: 'Post Opportunity', desc: 'Find collaborators', icon: <Briefcase size={20} color={DESIGN_SYSTEM.colors.brand.purple} />, page: 'opportunities' },
            { label: 'View Responses', desc: 'Review applications', icon: <MessageCircle size={20} color={DESIGN_SYSTEM.colors.accent.amber} />, page: 'responses' },
          ] : [
            { label: 'My Portfolio', desc: 'Upload & manage songs', icon: <Music size={20} color={DESIGN_SYSTEM.colors.brand.primary} />, page: 'portfolio' },
            { label: 'Opportunities', desc: 'Find projects', icon: <Briefcase size={20} color={DESIGN_SYSTEM.colors.brand.purple} />, page: 'opportunities' },
            { label: 'Search Catalog', desc: 'Explore music', icon: <Search size={20} color={DESIGN_SYSTEM.colors.brand.blue} />, page: 'catalog' },
            { label: 'My Profile', desc: 'Complete your profile', icon: <User size={20} color={DESIGN_SYSTEM.colors.accent.amber} />, page: 'profile' },
          ]).map(action => (
            <button
              key={action.page}
              onClick={() => onNavigate && onNavigate(action.page)}
              style={{
                background: DESIGN_SYSTEM.colors.bg.primary,
                border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                borderRadius: 12,
                padding: '16px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                fontFamily: "'Outfit', sans-serif",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary;
                e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light;
                e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.primary;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ marginBottom: 8 }}>{action.icon}</div>
              <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{action.label}</div>
              <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12 }}>{action.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RosterPage({ accountType, onViewProfile }) {
  const [composers, setComposers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComposers();
  }, []);

  const loadComposers = async () => {
    try {
      const targetType = accountType === 'music_executive' ? 'composer' : 'music_executive';
      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          composers (
            genres,
            specialties
          )
        `)
        .eq('account_type', targetType)
        .eq('is_deleted', false);

      const { data, error } = await query;

      if (error) throw error;
      setComposers(data || []);
    } catch (err) {
      console.error("Error loading composers:", err);
    } finally {
      setLoading(false);
    }
  };

  const rosterGenreOptions = GENRE_OPTIONS;
  const rosterLocations = [...new Set(composers.map(c => c.location).filter(Boolean))].sort();

  const filtered = composers.filter(c => {
    const nameMatch = `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase());
    const genreMatch = !filterGenre || (Array.isArray(c.genres) && c.genres.includes(filterGenre));
    const locationMatch = !filterLocation || c.location === filterLocation;
    return nameMatch && genreMatch && locationMatch;
  });

  return (
    <div style={{ padding: `${DESIGN_SYSTEM.spacing.xl} ${DESIGN_SYSTEM.spacing.xl}`, minHeight: "100%", overflowY: "auto" }}>
      <h1 style={{ 
        color: DESIGN_SYSTEM.colors.text.primary, 
        fontSize: DESIGN_SYSTEM.fontSize.xxl, 
        fontWeight: DESIGN_SYSTEM.fontWeight.extrabold, 
        fontFamily: "'Outfit', sans-serif", 
        marginBottom: DESIGN_SYSTEM.spacing.xs 
      }}>
        {accountType === 'music_executive' ? 'Discover Composers' : 'Music Executives'}
      </h1>
      <p style={{ 
        color: DESIGN_SYSTEM.colors.text.tertiary, 
        fontSize: DESIGN_SYSTEM.fontSize.md, 
        marginBottom: DESIGN_SYSTEM.spacing.lg 
      }}>Connect with talented professionals in the industry</p>

      <div style={{ display: "flex", gap: 12, marginBottom: DESIGN_SYSTEM.spacing.lg, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={18} color={DESIGN_SYSTEM.colors.text.muted} style={{ position: "absolute", left: DESIGN_SYSTEM.spacing.md, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            style={{
              width: "100%",
              background: DESIGN_SYSTEM.colors.bg.card,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: DESIGN_SYSTEM.radius.md,
              padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md} ${DESIGN_SYSTEM.spacing.sm} 48px`,
              color: DESIGN_SYSTEM.colors.text.primary,
              fontSize: DESIGN_SYSTEM.fontSize.md,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "'Outfit', sans-serif",
              transition: DESIGN_SYSTEM.transition.fast,
            }}
            onFocus={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.accent}
            onBlur={e => e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light}
          />
        </div>
        <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: DESIGN_SYSTEM.radius.md, padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`, color: filterGenre ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.md, outline: "none", fontFamily: "'Outfit', sans-serif", minWidth: 140 }}>
          <option value="">All Genres</option>
          {rosterGenreOptions.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: DESIGN_SYSTEM.radius.md, padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`, color: filterLocation ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: DESIGN_SYSTEM.fontSize.md, outline: "none", fontFamily: "'Outfit', sans-serif", minWidth: 140 }}>
          <option value="">All Locations</option>
          {rosterLocations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: DESIGN_SYSTEM.spacing.md }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.lg, padding: DESIGN_SYSTEM.spacing.lg }}>
              <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 12, width: '50%' }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: DESIGN_SYSTEM.spacing.md }}>
          {filtered.map(composer => (
            <div 
              key={composer.id} 
              onClick={() => onViewProfile(composer)} 
              style={{ 
                background: DESIGN_SYSTEM.colors.bg.card, 
                borderRadius: DESIGN_SYSTEM.radius.lg, 
                padding: DESIGN_SYSTEM.spacing.lg, 
                border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, 
                cursor: "pointer", 
                transition: `all ${DESIGN_SYSTEM.transition.normal}`,
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.accent; 
                e.currentTarget.style.transform = "translateY(-4px)"; 
                e.currentTarget.style.boxShadow = DESIGN_SYSTEM.shadow.hover;
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; 
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: DESIGN_SYSTEM.spacing.md, marginBottom: DESIGN_SYSTEM.spacing.md }}>
                <Avatar name={`${composer.first_name} ${composer.last_name}`} color={composer.avatar_color} avatarUrl={composer.avatar_url} size={56} />
                <div>
                  <div style={{ 
                    color: DESIGN_SYSTEM.colors.text.primary, 
                    fontWeight: DESIGN_SYSTEM.fontWeight.bold, 
                    fontSize: DESIGN_SYSTEM.fontSize.lg, 
                    fontFamily: "'Outfit', sans-serif" 
                  }}>{composer.first_name} {composer.last_name}</div>
                  {composer.location && <div style={{ 
                    color: DESIGN_SYSTEM.colors.text.muted, 
                    fontSize: DESIGN_SYSTEM.fontSize.sm,
                    marginTop: '2px',
                  }}>{composer.location}</div>}
                </div>
              </div>
              {composer.bio && <p style={{ 
                color: DESIGN_SYSTEM.colors.text.tertiary, 
                fontSize: DESIGN_SYSTEM.fontSize.sm, 
                lineHeight: 1.6, 
                marginBottom: DESIGN_SYSTEM.spacing.md, 
                display: "-webkit-box", 
                WebkitLineClamp: 2, 
                WebkitBoxOrient: "vertical", 
                overflow: "hidden" 
              }}>{composer.bio}</p>}
              {composer.genres && composer.genres.length > 0 && (
                <div style={{ display: "flex", gap: DESIGN_SYSTEM.spacing.xs, flexWrap: "wrap", marginBottom: DESIGN_SYSTEM.spacing.sm }}>
                  {composer.genres.slice(0, 3).map(g => <Badge key={g} color={DESIGN_SYSTEM.colors.accent.purple}>{g}</Badge>)}
                </div>
              )}
              <span style={{ 
                color: DESIGN_SYSTEM.colors.brand.primary, 
                fontSize: DESIGN_SYSTEM.fontSize.sm, 
                fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>View Profile <ChevronRight size={14} /></span>
            </div>
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && <div style={{ textAlign: "center", color: DESIGN_SYSTEM.colors.text.muted, padding: 60, fontSize: 15 }}>No profiles found.</div>}
    </div>
  );
}

function CatalogPage({ audioPlayer }) {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedMood, setSelectedMood] = useState("all");
  const [loading, setLoading] = useState(true);

  // Use shared audio player from parent
  const { playingSong, isPlaying, play: playAudio } = audioPlayer;

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select(`
          *,
          composer:user_profiles!songs_composer_id_fkey (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formatted = (data || []).map(song => ({
        ...song,
        composer_name: song.composer ? `${song.composer.first_name} ${song.composer.last_name}` : "Unknown"
      }));
      setSongs(formatted);
    } catch (err) {
      console.error("Error loading songs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced filtering with genre and mood
  const filtered = songs.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.composer_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.genre && s.genre.toLowerCase().includes(search.toLowerCase()));
    
    const matchesGenre = selectedGenre === "all" || 
      (s.genre && s.genre.toLowerCase() === selectedGenre.toLowerCase());
    
    const matchesMood = selectedMood === "all" || 
      (s.mood && s.mood.toLowerCase() === selectedMood.toLowerCase());
    
    return matchesSearch && matchesGenre && matchesMood;
  });

  // Get unique genres and moods from songs
  const genres = ["all", ...new Set(songs.map(s => s.genre).filter(Boolean))];
  const moods = ["all", ...new Set(songs.map(s => s.mood).filter(Boolean))];

  return (
    <div style={{ padding: "32px 36px", minHeight: "100%", overflowY: "auto" }}>
      <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>Search Catalog</h1>
      <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginBottom: 22 }}>Browse and discover music from talented composers</p>

      {/* Search Bar */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} color={DESIGN_SYSTEM.colors.text.muted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search by title, artist, or genre..." 
          style={{ 
            width: "100%", 
            background: DESIGN_SYSTEM.colors.bg.card, 
            border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, 
            borderRadius: 10, 
            padding: "11px 16px 11px 40px", 
            color: DESIGN_SYSTEM.colors.text.primary, 
            fontSize: 14, 
            outline: "none", 
            boxSizing: "border-box", 
            fontFamily: "'Outfit', sans-serif" 
          }} 
        />
      </div>

      {/* Filter Dropdowns */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Genre Filter */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ 
            display: "block", 
            color: DESIGN_SYSTEM.colors.text.tertiary, 
            fontSize: 12, 
            fontWeight: 600, 
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>Genre</label>
          <select 
            value={selectedGenre} 
            onChange={e => setSelectedGenre(e.target.value)}
            style={{ 
              width: "100%", 
              background: DESIGN_SYSTEM.colors.bg.card, 
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, 
              borderRadius: 8, 
              padding: "10px 12px", 
              color: DESIGN_SYSTEM.colors.text.primary, 
              fontSize: 14, 
              outline: "none",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            <option value="all">All Genres</option>
            {genres.filter(g => g !== "all").map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* Mood Filter */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ 
            display: "block", 
            color: DESIGN_SYSTEM.colors.text.tertiary, 
            fontSize: 12, 
            fontWeight: 600, 
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>Mood</label>
          <select 
            value={selectedMood} 
            onChange={e => setSelectedMood(e.target.value)}
            style={{ 
              width: "100%", 
              background: DESIGN_SYSTEM.colors.bg.card, 
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, 
              borderRadius: 8, 
              padding: "10px 12px", 
              color: DESIGN_SYSTEM.colors.text.primary, 
              fontSize: 14, 
              outline: "none",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            <option value="all">All Moods</option>
            {moods.filter(m => m !== "all").map(mood => (
              <option key={mood} value={mood}>{mood}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(selectedGenre !== "all" || selectedMood !== "all" || search !== "") && (
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button 
              onClick={() => {
                setSelectedGenre("all");
                setSelectedMood("all");
                setSearch("");
              }}
              style={{ 
                background: DESIGN_SYSTEM.colors.bg.surface, 
                color: DESIGN_SYSTEM.colors.text.tertiary, 
                border: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`, 
                borderRadius: 8, 
                padding: "10px 16px", 
                fontSize: 13, 
                fontWeight: 600, 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "'Outfit', sans-serif",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = DESIGN_SYSTEM.colors.border.medium;
                e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.surface;
                e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.tertiary;
              }}
            >
              <X size={14} /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div style={{ 
        color: DESIGN_SYSTEM.colors.text.muted, 
        fontSize: 13, 
        marginBottom: 16,
        fontWeight: 500 
      }}>
        {filtered.length === songs.length 
          ? `Showing all ${songs.length} songs` 
          : `Found ${filtered.length} of ${songs.length} songs`}
      </div>

      {loading ? (
        <div style={{ color: DESIGN_SYSTEM.colors.text.muted, textAlign: "center", padding: 60 }}>Loading songs...</div>
      ) : filtered.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          background: DESIGN_SYSTEM.colors.bg.card,
          borderRadius: 12,
          border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`
        }}>
          <Music size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
          <h3 style={{ 
            color: DESIGN_SYSTEM.colors.text.primary, 
            fontSize: 18, 
            fontWeight: 700, 
            marginBottom: 8,
            fontFamily: "'Outfit', sans-serif" 
          }}>No songs found</h3>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginBottom: 16 }}>
            {songs.length === 0 
              ? "No songs have been uploaded yet. Be the first to share your music!" 
              : "Try adjusting your filters or search terms"}
          </p>
          {(selectedGenre !== "all" || selectedMood !== "all" || search !== "") && (
            <button 
              onClick={() => {
                setSelectedGenre("all");
                setSelectedMood("all");
                setSearch("");
              }}
              style={{ 
                background: DESIGN_SYSTEM.colors.brand.primary, 
                color: DESIGN_SYSTEM.colors.text.primary, 
                border: "none", 
                borderRadius: 8, 
                padding: "10px 20px", 
                fontSize: 14, 
                fontWeight: 600, 
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(song => (
            <SongCard key={song.id} song={song} isPlaying={playingSong?.id === song.id && isPlaying} onPlay={playAudio} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfilePage({ user, onSignOut, onProfileUpdate }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [location, setLocation] = useState(user.location || "");
  const [customLocation, setCustomLocation] = useState("");
  const [pro, setPro] = useState(user.pro || "");
  const [role, setRole] = useState(user.role || "");
  const [company, setCompany] = useState(user.company || "");
  const [jobTitle, setJobTitle] = useState(user.job_title || "");
  const [genres, setGenres] = useState(user.genres || []);
  const [instruments, setInstruments] = useState(user.instruments || "");

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || null);

  const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      showToast("Please upload a JPG, PNG, or WebP image.", "error");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      showToast("Image must be under 2MB.", "error");
      return;
    }
    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const proOptions = ['ASCAP', 'BMI', 'SESAC', 'GMR', 'SOCAN', 'PRS', 'Other'];
  const composerRoles = ['Singer-Songwriter', 'Producer', 'Film Composer', 'Songwriter', 'Multi-Instrumentalist', 'Beatmaker', 'Session Musician', 'Other'];
  const executiveRoles = ['A&R Manager', 'Sync A&R', 'Music Supervisor', 'Creative Director', 'Music Publisher', 'Label Executive', 'Sync Agent', 'Other'];
  const genreOptions = GENRE_OPTIONS;
  const locationOptions = [
    'New York, NY',
    'Los Angeles, CA',
    'Nashville, TN',
    'London, UK',
    'Austin, TX',
    'Atlanta, GA',
    'Chicago, IL',
    'Miami, FL',
    'Toronto, Canada',
    'Paris, France',
    'Berlin, Germany',
    'Tokyo, Japan',
    'Sydney, Australia',
    'Custom...'
  ];

  const toggleGenre = (genre) => {
    setGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatarUrl = user.avatar_url || null;
      // Only handle avatar/profile info here
      showToast("Profile updated successfully!", "success");
      setEditing(false);
      setAvatarFile(null);
      if (onProfileUpdate) onProfileUpdate(); // Re-fetch profile without full page reload
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "32px 36px", minHeight: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>My Profile</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <Edit size={15} /> Edit Profile
          </button>
        )}
      </div>

      <div style={{ maxWidth: 600, background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 20, padding: 28, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
        {!editing ? (
          // VIEW MODE
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <Avatar name={`${user.first_name} ${user.last_name}`} color={user.avatar_color} avatarUrl={user.avatar_url} size={80} />
              <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginTop: 14 }}>{user.first_name} {user.last_name}</h2>
              <Badge color={DESIGN_SYSTEM.colors.brand.primary} style={{ marginTop: 8 }}>{user.account_type === "music_executive" ? "Music Executive" : "Composer"}</Badge>
              <div style={{ marginTop: 10 }}><ProfileBadges user={user} /></div>
              {user.bio && <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>{user.bio}</p>}
            </div>
            
            <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Email</span>
                <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.email}</span>
              </div>
              
              {user.location && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Location</span>
                  <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.location}</span>
                </div>
              )}

              {user.account_type === 'composer' && (
                <>
                  {user.pro && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>PRO</span>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.pro}</span>
                    </div>
                  )}
                  {user.role && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Role</span>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.role}</span>
                    </div>
                  )}
                  {user.instruments && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Instruments</span>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.instruments}</span>
                    </div>
                  )}
                  {user.genres && user.genres.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, display: "block", marginBottom: 8 }}>Genres</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {user.genres.map(g => <Badge key={g} color={DESIGN_SYSTEM.colors.accent.purple}>{g}</Badge>)}
                      </div>
                    </div>
                  )}
                </>
              )}

              {user.account_type === 'music_executive' && (
                <>
                  {user.company && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Company</span>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.company}</span>
                    </div>
                  )}
                  {user.job_title && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Job Title</span>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600 }}>{user.job_title}</span>
                    </div>
                  )}
                  {user.genres && user.genres.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, display: "block", marginBottom: 8 }}>Genres of Interest</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {user.genres.map(g => <Badge key={g} color={DESIGN_SYSTEM.colors.accent.purple}>{g}</Badge>)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <button onClick={onSignOut} style={{ width: "100%", marginTop: 20, background: "transparent", color: DESIGN_SYSTEM.colors.accent.red, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}33`, borderRadius: 10, padding: "10px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <LogOut size={15} /> Sign Out
            </button>
          </>
        ) : (
          // EDIT MODE
          <>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 16 }}>Edit Profile</h3>

              {/* Avatar Upload */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: '2px solid rgba(255,255,255,0.1)' }} />
                  ) : (
                    <Avatar name={`${firstName} ${lastName}`} color={user.avatar_color} size={80} />
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <label style={{ background: `${DESIGN_SYSTEM.colors.brand.primary}18`, color: DESIGN_SYSTEM.colors.brand.primary, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                    <Upload size={14} /> Upload Photo
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} style={{ display: "none" }} />
                  </label>
                  {avatarPreview && (
                    <button type="button" onClick={removeAvatar} style={{ background: `${DESIGN_SYSTEM.colors.accent.red}18`, color: DESIGN_SYSTEM.colors.accent.red, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}33`, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>
                <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, marginTop: 6 }}>JPG, PNG, or WebP. Max 2MB.</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>First Name *</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Last Name *</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..." style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", resize: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Location</label>
                <select value={location} onChange={e => setLocation(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box", marginBottom: location === 'Custom...' ? 8 : 0 }}>
                  <option value="">Select Location...</option>
                  {locationOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                {location === 'Custom...' && (
                  <input 
                    type="text" 
                    value={customLocation} 
                    onChange={e => setCustomLocation(e.target.value)} 
                    placeholder="Enter your location..." 
                    style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} 
                  />
                )}
              </div>

              {user.account_type === 'composer' && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>PRO (Performance Rights Organization)</label>
                    <select value={pro} onChange={e => setPro(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }}>
                      <option value="">Select PRO...</option>
                      {proOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }}>
                      <option value="">Select Role...</option>
                      {composerRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Instruments (Optional)</label>
                    <input 
                      type="text" 
                      value={instruments} 
                      onChange={e => setInstruments(e.target.value)} 
                      placeholder="e.g., Piano, Guitar, Vocals" 
                      style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} 
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Genres (Select all that apply)</label>
                    <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: 12, maxHeight: 200, overflowY: "auto" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                        {genreOptions.map(genre => (
                          <label key={genre} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 6, background: genres.includes(genre) ? `${DESIGN_SYSTEM.colors.brand.primary}22` : "transparent", border: genres.includes(genre) ? `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33` : "1px solid transparent" }}>
                            <input
                              type="checkbox"
                              checked={genres.includes(genre)}
                              onChange={() => toggleGenre(genre)}
                              style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                            <span style={{ color: genres.includes(genre) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: genres.includes(genre) ? 600 : 400 }}>{genre}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {genres.length > 0 && (
                      <div style={{ marginTop: 8, color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12 }}>
                        Selected: {genres.length} {genres.length === 1 ? 'genre' : 'genres'}
                      </div>
                    )}
                  </div>
                </>
              )}

              {user.account_type === 'music_executive' && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Company</label>
                    <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g., Sony Music, Warner Chappell" style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }} />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Job Title</label>
                    <select value={jobTitle} onChange={e => setJobTitle(e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box" }}>
                      <option value="">Select Job Title...</option>
                      {executiveRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Genres of Interest (Select all that apply)</label>
                    <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: 12, maxHeight: 200, overflowY: "auto" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                        {genreOptions.map(genre => (
                          <label key={genre} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 6, background: genres.includes(genre) ? `${DESIGN_SYSTEM.colors.brand.primary}22` : "transparent", border: genres.includes(genre) ? `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33` : "1px solid transparent" }}>
                            <input
                              type="checkbox"
                              checked={genres.includes(genre)}
                              onChange={() => toggleGenre(genre)}
                              style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                            <span style={{ color: genres.includes(genre) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: genres.includes(genre) ? 600 : 400 }}>{genre}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {genres.length > 0 && (
                      <div style={{ marginTop: 8, color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12 }}>
                        Selected: {genres.length} {genres.length === 1 ? 'genre' : 'genres'}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSave} disabled={saving || !firstName || !lastName} style={{ flex: 1, background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "10px", fontWeight: 600, fontSize: 14, cursor: (saving || !firstName || !lastName) ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: (saving || !firstName || !lastName) ? 0.6 : 1 }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)} style={{ background: "transparent", color: DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── OPPORTUNITIES PAGE ──────────────────────────────────────────────────────
function OpportunitiesPage({ userProfile }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [search, setSearch] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [appliedOpportunities, setAppliedOpportunities] = useState(new Set());
  
  // Bookmarks (localStorage-backed for now — can migrate to Supabase table later)
  const [bookmarkedOpps, setBookmarkedOpps] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`sp-bookmarks-${userProfile.id}`) || '[]')); }
    catch { return new Set(); }
  });

  const toggleBookmark = (oppId) => {
    setBookmarkedOpps(prev => {
      const next = new Set(prev);
      if (next.has(oppId)) { next.delete(oppId); showToast("Removed from saved", "info"); }
      else { next.add(oppId); showToast("Saved for later!", "success"); }
      localStorage.setItem(`sp-bookmarks-${userProfile.id}`, JSON.stringify([...next]));
      return next;
    });
  };

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState(null);

  // Apply modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingTo, setApplyingTo] = useState(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [selectedSongId, setSelectedSongId] = useState("");
  const [composerSongs, setComposerSongs] = useState([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [genres, setGenres] = useState([]);
  const [projectType, setProjectType] = useState("");
  const [moods, setMoods] = useState([]);
  const [vocalPreference, setVocalPreference] = useState("");

  // AI Brief Writer state
  const [showAIBrief, setShowAIBrief] = useState(false);
  const [aiNotes, setAiNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const availableGenres = GENRE_OPTIONS;
  const projectTypeOptions = ['Film', 'TV Series', 'Advertising', 'Trailer', 'Video Game', 'Podcast', 'Social Media', 'Other'];
  const budgetOptions = ['Under $500', '$500–$2K', '$2K–$5K', '$5K–$15K', '$15K+', 'Work for Hire', 'TBD'];
  const oppMoodOptions = ['Uplifting', 'Melancholic', 'Energetic', 'Calm', 'Dark', 'Romantic', 'Epic', 'Playful', 'Aggressive', 'Dreamy', 'Nostalgic', 'Mysterious', 'Triumphant', 'Tense'];
  const vocalOptions = ['Instrumental Only', 'Vocal', 'Either'];

  useEffect(() => {
    loadOpportunities();
    if (userProfile.account_type === 'composer') {
      loadComposerSongs();
      loadUserApplications();
    }
  }, [userProfile]);

  const loadUserApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('opportunity_id')
        .eq('composer_id', userProfile.id);
      
      if (error) throw error;
      
      const appliedIds = new Set(data.map(r => r.opportunity_id));
      setAppliedOpportunities(appliedIds);
    } catch (err) {
      console.error("Error loading applications:", err);
    }
  };

  const loadComposerSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('composer_id', userProfile.id);
      
      if (error) throw error;
      setComposerSongs(data || []);
    } catch (err) {
      console.error("Error loading songs:", err);
    }
  };

  const loadOpportunities = async () => {
    try {
      let query = supabase
        .from('opportunities')
        .select(`
          *,
          creator:user_profiles!opportunities_creator_id_fkey (
            first_name,
            last_name,
            avatar_color,
            avatar_url
          ),
          responses (id)
        `)
        .order('created_at', { ascending: false });

      // If composer, show all open opportunities
      // If executive, show only their own opportunities
      if (userProfile.account_type === 'music_executive') {
        query = query.eq('creator_id', userProfile.id);
      } else {
        query = query.eq('status', 'Open');
      }

      const { data, error } = await query;
      if (error) throw error;

      // Add response_count to each opportunity
      const withCounts = (data || []).map(opp => ({
        ...opp,
        response_count: opp.responses ? opp.responses.length : 0,
      }));
      setOpportunities(withCounts);
    } catch (err) {
      console.error("Error loading opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const oppData = {
        creator_id: userProfile.id,
        title,
        description,
        budget: budget || null,
        deadline: deadline || null,
        genres: genres.length > 0 ? genres : null,
        status: editingOpp ? editingOpp.status : 'Open',
        metadata: {
          project_type: projectType || null,
          moods: moods.length > 0 ? moods : null,
          vocal_preference: vocalPreference || null,
        }
      };

      if (editingOpp) {
        const { error } = await supabase
          .from('opportunities')
          .update(oppData)
          .eq('id', editingOpp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('opportunities')
          .insert([oppData]);
        if (error) throw error;
      }

      resetForm();
      loadOpportunities();
      showToast(editingOpp ? "Opportunity updated!" : "Opportunity posted!", "success");
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (opp) => {
    setConfirmModal({
      open: true,
      title: 'Delete Opportunity',
      message: `Are you sure you want to delete "${opp.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const { error } = await supabase
            .from('opportunities')
            .delete()
            .eq('id', opp.id);

          if (error) throw error;
          loadOpportunities();
          showToast("Opportunity deleted!", "success");
        } catch (err) {
          showToast(friendlyError(err), "error");
        }
      },
    });
  };

  const handleEdit = (opp) => {
    setEditingOpp(opp);
    setTitle(opp.title);
    setDescription(opp.description);
    setBudget(opp.budget || "");
    setDeadline(opp.deadline || "");
    setGenres(opp.genres || []);
    setProjectType(opp.metadata?.project_type || "");
    setMoods(opp.metadata?.moods || []);
    setVocalPreference(opp.metadata?.vocal_preference || "");
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingOpp(null);
    setTitle("");
    setDescription("");
    setBudget("");
    setDeadline("");
    setGenres([]);
    setProjectType("");
    setMoods([]);
    setVocalPreference("");
    setShowForm(false);
  };

  const toggleGenre = (genre) => {
    setGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  const toggleMood = (mood) => {
    setMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]);
  };

  // ── AI Brief Writer ──
  const generateAIBrief = async () => {
    if (!aiNotes.trim() || aiNotes.trim().length < 10) {
      showToast("Please describe your project in at least a couple of sentences", "error");
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const apiUrl = process.env.REACT_APP_AI_API_URL;
      if (!apiUrl) {
        showToast("AI server not configured", "error");
        setAiLoading(false);
        return;
      }
      const response = await fetch(`${apiUrl}/generate-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: aiNotes,
          title: title || undefined,
          project_type: projectType || undefined,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 'success') {
        setAiResult(data);
      } else {
        throw new Error("Unexpected response from AI server");
      }
    } catch (err) {
      console.error('AI Brief error:', err);
      showToast(err.message || "Failed to generate brief — is the AI server running?", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIBrief = () => {
    if (!aiResult) return;
    setDescription(aiResult.description || "");
    if (aiResult.genres?.length) setGenres(aiResult.genres);
    if (aiResult.moods?.length) setMoods(aiResult.moods);
    if (aiResult.project_type) setProjectType(aiResult.project_type);
    setShowAIBrief(false);
    setAiResult(null);
    setAiNotes("");
    showToast("✨ Brief applied! Review and edit as needed.", "success");
  };

  const handleStatusChange = async (opp, newStatus) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ status: newStatus })
        .eq('id', opp.id);
      if (error) throw error;
      loadOpportunities();
      showToast(`Opportunity marked as "${newStatus}"`, "success");
    } catch (err) {
      showToast(friendlyError(err), "error");
    }
  };

  const handleWithdraw = (opp) => {
    setConfirmModal({
      open: true,
      title: 'Withdraw Application',
      message: `Withdraw your application from "${opp.title}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const { error } = await supabase
            .from('responses')
            .delete()
            .eq('opportunity_id', opp.id)
            .eq('composer_id', userProfile.id);

          if (error) throw error;

          setAppliedOpportunities(prev => {
            const next = new Set(prev);
            next.delete(opp.id);
            return next;
          });
          loadOpportunities();
          showToast("Application withdrawn successfully", "success");
        } catch (err) {
          showToast(friendlyError(err), "error");
        }
      },
    });
  };

  const openApplyModal = async (opp) => {
    setApplyingTo(opp);
    
    // Check if user has already applied and load their application
    if (appliedOpportunities.has(opp.id)) {
      try {
        const { data, error } = await supabase
          .from('responses')
          .select('message, song_id')
          .eq('opportunity_id', opp.id)
          .eq('composer_id', userProfile.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setApplyMessage(data.message);
          setSelectedSongId(data.song_id);
        }
      } catch (err) {
        console.error("Error loading application:", err);
      }
    } else {
      setApplyMessage("");
      setSelectedSongId("");
    }
    
    setShowApplyModal(true);
  };

  const resetApplyModal = () => {
    setApplyingTo(null);
    setApplyMessage("");
    setSelectedSongId("");
    setShowApplyModal(false);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    
    if (!selectedSongId) {
      showToast("Please select a demo song", "error");
      return;
    }

    setLoading(true);
    try {
      const isEditing = appliedOpportunities.has(applyingTo.id);
      
      if (isEditing) {
        // Update existing application
        const { error } = await supabase
          .from('responses')
          .update({
            message: applyMessage,
            song_id: selectedSongId
          })
          .eq('opportunity_id', applyingTo.id)
          .eq('composer_id', userProfile.id);

        if (error) throw error;
        showToast("Application updated successfully!", "success");
      } else {
        // Create new application
        const { error } = await supabase
          .from('responses')
          .insert([{
            opportunity_id: applyingTo.id,
            composer_id: userProfile.id,
            message: applyMessage,
            song_id: selectedSongId,
            status: 'Responded'
          }]);

        if (error) {
          if (error.code === '23505') {
            showToast("You've already applied to this opportunity!", "error");
          } else {
            throw error;
          }
        } else {
          setAppliedOpportunities(prev => new Set([...prev, applyingTo.id]));
          showToast("Application submitted successfully!", "success");
        }
      }
      
      resetApplyModal();
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(search.toLowerCase()) || 
                         opp.description.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = !filterGenre || opp.genres?.includes(filterGenre);
    return matchesSearch && matchesGenre;
  });

  return (
    <div style={{ padding: "32px 36px", minHeight: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
            {userProfile.account_type === 'music_executive' ? 'My Opportunities' : 'Browse Opportunities'}
          </h1>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginTop: 4 }}>
            {userProfile.account_type === 'music_executive' ? 'Manage your posted projects' : 'Find projects that match your skills'}
          </p>
        </div>
        {userProfile.account_type === 'music_executive' && (
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', sans-serif" }}>
            <Plus size={15} /> Post Opportunity
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} color={DESIGN_SYSTEM.colors.text.muted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunities..." style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "10px 16px 10px 40px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />
        </div>
        <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "10px 16px", color: filterGenre ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif", minWidth: 150 }}>
          <option value="">All Genres</option>
          {availableGenres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Opportunity Form (Executives only) */}
      {showForm && userProfile.account_type === 'music_executive' && (
        <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 22, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{editingOpp ? "Edit Opportunity" : "Post New Opportunity"}</h3>
            <button
              onClick={resetForm}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Close form"
              title="Close"
            >
              <X size={18} color={DESIGN_SYSTEM.colors.text.muted} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", marginBottom: 12, boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />
            <div style={{ position: "relative", marginBottom: 12 }}>
              <textarea placeholder="Description * (What are you looking for? Include style references, tempo, instrumentation needs...)" value={description} onChange={e => setDescription(e.target.value)} required rows={4} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", paddingRight: 110, color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }} />
              <button
                type="button"
                onClick={() => { setShowAIBrief(true); setAiResult(null); }}
                style={{
                  position: "absolute", top: 8, right: 8,
                  background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.brand.purple}, #6366f1)`,
                  color: "#fff", border: "none", borderRadius: 20,
                  padding: "5px 12px", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                  boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.5)'; }}
                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)'; }}
                title="Use AI to help write your brief"
              >
                ✨ AI Assist
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <select value={projectType} onChange={e => setProjectType(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: projectType ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Project Type</option>
                {projectTypeOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={budget} onChange={e => setBudget(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: budget ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Budget Range</option>
                {budgetOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <input type="date" placeholder="Deadline" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 12 }}>
              <select value={vocalPreference} onChange={e => setVocalPreference(e.target.value)} style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "10px 14px", color: vocalPreference ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 14, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                <option value="">Vocal Preference</option>
                {vocalOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Genres</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {availableGenres.map(g => (
                  <button key={g} type="button" onClick={() => toggleGenre(g)} style={{ background: genres.includes(g) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.bg.primary, color: genres.includes(g) ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${genres.includes(g) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Mood / Vibe</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {oppMoodOptions.map(m => (
                  <button key={m} type="button" onClick={() => toggleMood(m)} style={{ background: moods.includes(m) ? DESIGN_SYSTEM.colors.brand.purple : DESIGN_SYSTEM.colors.bg.primary, color: moods.includes(m) ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${moods.includes(m) ? DESIGN_SYSTEM.colors.brand.purple : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={loading} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Saving..." : editingOpp ? "Update Opportunity" : "Post Opportunity"}
              </button>
              <button type="button" onClick={resetForm} style={{ background: "transparent", color: DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Opportunities List */}
      {loading && opportunities.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (<LoadingOpportunityCard key={i} />))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', padding: 24 }}>
          <div style={{ flex: '0 0 320px', background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 24, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: 'left' }}>
            <Briefcase size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ marginBottom: 12 }} />
            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
              {userProfile.account_type === 'music_executive' ? 'Ready to find your sound?' : 'New opportunities are on the way!'}
            </h3>
            <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, marginBottom: 16 }}>
              {userProfile.account_type === 'music_executive' ? "Post your first brief and let talented composers come to you." : "Great things take time — check back soon or hit refresh to see the latest."}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {userProfile.account_type === 'music_executive' ? (
                <button onClick={() => { resetForm(); setShowForm(true); }} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>Post Opportunity</button>
              ) : (
                <button onClick={() => loadOpportunities()} style={{ background: 'transparent', color: DESIGN_SYSTEM.colors.brand.light, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>Refresh</button>
              )}
              <button onClick={() => showToast('Try adjusting filters or clearing the search', 'info')} style={{ background: 'transparent', color: DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>Help</button>
            </div>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingOpportunityCard key={i} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map(opp => (
            <div key={opp.id} style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 20, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.card; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>{opp.title}</h3>
                  {userProfile.account_type === 'composer' && opp.creator && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Avatar name={`${opp.creator.first_name} ${opp.creator.last_name}`} color={opp.creator.avatar_color} avatarUrl={opp.creator.avatar_url} size={24} />
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>{opp.creator.first_name} {opp.creator.last_name}</span>
                    </div>
                  )}
                </div>
                {userProfile.account_type === 'composer' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(opp.id); }}
                    style={{ background: bookmarkedOpps.has(opp.id) ? `${DESIGN_SYSTEM.colors.accent.amber}18` : 'transparent', border: `1px solid ${bookmarkedOpps.has(opp.id) ? DESIGN_SYSTEM.colors.accent.amber + '44' : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                    aria-label={bookmarkedOpps.has(opp.id) ? 'Remove bookmark' : 'Save for later'}
                    title={bookmarkedOpps.has(opp.id) ? 'Remove bookmark' : 'Save for later'}
                  >
                    <Bookmark size={14} color={bookmarkedOpps.has(opp.id) ? DESIGN_SYSTEM.colors.accent.amber : DESIGN_SYSTEM.colors.text.muted} fill={bookmarkedOpps.has(opp.id) ? DESIGN_SYSTEM.colors.accent.amber : 'none'} />
                  </button>
                )}
                {userProfile.account_type === 'music_executive' && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select
                      value={opp.status}
                      onChange={(e) => handleStatusChange(opp, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: '4px 8px', color: opp.status === 'Open' ? DESIGN_SYSTEM.colors.accent.green : opp.status === 'Filled' ? DESIGN_SYSTEM.colors.brand.blue : DESIGN_SYSTEM.colors.text.muted, fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif", outline: 'none', cursor: 'pointer' }}
                      aria-label="Change status"
                    >
                      <option value="Open">Open</option>
                      <option value="Paused">Paused</option>
                      <option value="Filled">Filled</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <button
                      onClick={() => handleEdit(opp)}
                      style={{ background: `${DESIGN_SYSTEM.colors.brand.primary}18`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      aria-label="Edit opportunity"
                      title="Edit"
                    >
                      <Edit size={14} color={DESIGN_SYSTEM.colors.brand.primary} />
                    </button>
                    <button
                      onClick={() => handleDelete(opp)}
                      style={{ background: `${DESIGN_SYSTEM.colors.accent.red}18`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}33`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      aria-label="Delete opportunity"
                      title="Delete"
                    >
                      <Trash2 size={14} color={DESIGN_SYSTEM.colors.accent.red} />
                    </button>
                  </div>
                )}
              </div>
              <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>{opp.description}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                {opp.budget && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${DESIGN_SYSTEM.colors.accent.green}18`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.green}33`, borderRadius: 8, padding: "6px 12px" }}>
                    <DollarSign size={14} color={DESIGN_SYSTEM.colors.accent.green} />
                    <span style={{ color: DESIGN_SYSTEM.colors.accent.green, fontSize: 12, fontWeight: 600 }}>{opp.budget}</span>
                  </div>
                )}
                {opp.deadline && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${DESIGN_SYSTEM.colors.accent.amber}18`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.amber}33`, borderRadius: 8, padding: "6px 12px" }}>
                    <Calendar size={14} color={DESIGN_SYSTEM.colors.accent.amber} />
                    <span style={{ color: DESIGN_SYSTEM.colors.accent.amber, fontSize: 12, fontWeight: 600 }}>{new Date(opp.deadline).toLocaleDateString()}</span>
                  </div>
                )}
                <Badge color={opp.status === 'Open' ? DESIGN_SYSTEM.colors.accent.green : DESIGN_SYSTEM.colors.text.muted}>{opp.status}</Badge>
                {opp.response_count > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: `${DESIGN_SYSTEM.colors.brand.blue}18`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.blue}33`, borderRadius: 8, padding: "6px 12px" }}>
                    <Users size={13} color={DESIGN_SYSTEM.colors.brand.blue} />
                    <span style={{ color: DESIGN_SYSTEM.colors.brand.blue, fontSize: 12, fontWeight: 600 }}>
                      {opp.response_count} {opp.response_count === 1 ? 'application' : 'applications'}
                    </span>
                  </div>
                )}
                {userProfile.account_type === 'composer' && opp.response_count === 0 && (
                  new Date() - new Date(opp.created_at) < 3 * 24 * 60 * 60 * 1000 ? (
                    <Badge color={DESIGN_SYSTEM.colors.brand.accent}>New</Badge>
                  ) : null
                )}
              </div>
              {opp.genres && opp.genres.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {opp.genres.map(g => <Badge key={g} color={DESIGN_SYSTEM.colors.accent.purple}>{g}</Badge>)}
                </div>
              )}
              {(opp.metadata?.project_type || opp.metadata?.vocal_preference || (opp.metadata?.moods && opp.metadata.moods.length > 0)) && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {opp.metadata?.project_type && <Badge color={DESIGN_SYSTEM.colors.brand.blue}>{opp.metadata.project_type}</Badge>}
                  {opp.metadata?.vocal_preference && <Badge color={DESIGN_SYSTEM.colors.text.secondary}>{opp.metadata.vocal_preference}</Badge>}
                  {opp.metadata?.moods?.map(m => <Badge key={m} color={DESIGN_SYSTEM.colors.brand.purple}>{m}</Badge>)}
                </div>
              )}
              {userProfile.account_type === 'composer' && (
                appliedOpportunities.has(opp.id) ? (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <div style={{ flex: 1, background: `${DESIGN_SYSTEM.colors.accent.green}22`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.green}33`, borderRadius: 10, padding: "10px", color: DESIGN_SYSTEM.colors.accent.green, fontWeight: 600, fontSize: 14, fontFamily: "'Outfit', sans-serif", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <CheckCircle size={16} /> Applied!
                    </div>
                    <button onClick={() => openApplyModal(opp)} style={{ background: `${DESIGN_SYSTEM.colors.brand.primary}22`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, borderRadius: 10, padding: "10px 16px", color: DESIGN_SYSTEM.colors.brand.primary, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                      <Edit size={13} /> Edit
                    </button>
                    <button onClick={() => handleWithdraw(opp)} style={{ background: `${DESIGN_SYSTEM.colors.accent.red}15`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}33`, borderRadius: 10, padding: "10px 14px", color: DESIGN_SYSTEM.colors.accent.red, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 5 }}
                      title="Withdraw application"
                    >
                      <XCircle size={14} /> Withdraw
                    </button>
                  </div>
                ) : (
                  <button onClick={() => openApplyModal(opp)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "10px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", marginTop: 12 }}>
                    Apply to Opportunity
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apply Modal (Composers only) */}
      {showApplyModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 20, padding: 28, maxWidth: 540, width: "100%", border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                {appliedOpportunities.has(applyingTo?.id) ? "Edit Application" : "Apply to Opportunity"}
              </h2>
              <button
                onClick={resetApplyModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label="Close application modal"
                title="Close"
              >
                <X size={24} color={DESIGN_SYSTEM.colors.text.muted} />
              </button>
            </div>
            
            <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, borderRadius: 12, padding: 16, marginBottom: 20, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>{applyingTo?.title}</h3>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, lineHeight: 1.5 }}>{applyingTo?.description}</p>
            </div>

            <form onSubmit={handleApply}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Your Pitch *</label>
                <textarea 
                  value={applyMessage} 
                  onChange={e => setApplyMessage(e.target.value)} 
                  required
                  placeholder="Tell them why you're perfect for this project..."
                  rows={4}
                  style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: "12px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "'Outfit', sans-serif" }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Select Demo Song *</label>
                {composerSongs.length === 0 ? (
                  <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: 16, textAlign: "center" }}>
                    <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>You haven't uploaded any songs yet. Go to your Portfolio to add songs first.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {composerSongs.map(song => (
                      <div 
                        key={song.id} 
                        onClick={() => setSelectedSongId(song.id)}
                        style={{ 
                          background: selectedSongId === song.id ? `${DESIGN_SYSTEM.colors.brand.primary}18` : DESIGN_SYSTEM.colors.bg.primary, 
                          border: `1px solid ${selectedSongId === song.id ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`, 
                          borderRadius: 8, 
                          padding: "12px 14px", 
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { if (selectedSongId !== song.id) e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover; }}
                        onMouseLeave={e => { if (selectedSongId !== song.id) e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.primary; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selectedSongId === song.id ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`, background: selectedSongId === song.id ? DESIGN_SYSTEM.colors.brand.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {selectedSongId === song.id && <Check size={12} color={DESIGN_SYSTEM.colors.text.primary} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{song.title}</div>
                            <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginTop: 2 }}>
                              {song.genre && `${song.genre} • `}
                              {song.duration || "Unknown duration"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button 
                  type="submit" 
                  disabled={loading || composerSongs.length === 0}
                  style={{ flex: 1, background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 15, cursor: (loading || composerSongs.length === 0) ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: (loading || composerSongs.length === 0) ? 0.6 : 1 }}
                >
                  {loading ? (appliedOpportunities.has(applyingTo?.id) ? "Updating..." : "Submitting...") : (appliedOpportunities.has(applyingTo?.id) ? "Update Application" : "Submit Application")}
                </button>
                <button 
                  type="button" 
                  onClick={resetApplyModal}
                  style={{ background: "transparent", color: DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "12px 20px", fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── AI Brief Writer Modal ── */}
      {showAIBrief && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20,
        }}
          onClick={e => { if (e.target === e.currentTarget && !aiLoading) { setShowAIBrief(false); } }}
        >
          <div style={{
            background: DESIGN_SYSTEM.colors.bg.card,
            borderRadius: 20, padding: 28, maxWidth: 540, width: '100%',
            border: `1px solid ${DESIGN_SYSTEM.colors.brand.purple}44`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.brand.purple}, #6366f1)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>✨</div>
              <div>
                <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 17, fontWeight: 700, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                  AI Brief Writer
                </h3>
                <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                  Describe your project and let AI craft the perfect brief
                </p>
              </div>
            </div>

            {/* Input Section */}
            {!aiResult && (
              <>
                <textarea
                  placeholder={"Describe your project in your own words...\n\nExample: Need an upbeat Latin track for a tequila brand commercial, 30 seconds, should feel energetic and festive, maybe with acoustic guitar and percussion"}
                  value={aiNotes}
                  onChange={e => setAiNotes(e.target.value)}
                  rows={5}
                  style={{
                    width: '100%', background: DESIGN_SYSTEM.colors.bg.primary,
                    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                    borderRadius: 12, padding: '14px 16px',
                    color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14,
                    outline: 'none', resize: 'none', boxSizing: 'border-box',
                    fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
                  }}
                  autoFocus
                  disabled={aiLoading}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button
                    onClick={generateAIBrief}
                    disabled={aiLoading || aiNotes.trim().length < 10}
                    style={{
                      flex: 1,
                      background: aiLoading || aiNotes.trim().length < 10
                        ? DESIGN_SYSTEM.colors.border.light
                        : `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.brand.purple}, #6366f1)`,
                      color: '#fff', border: 'none', borderRadius: 10,
                      padding: '12px', fontWeight: 600, fontSize: 15,
                      cursor: aiLoading || aiNotes.trim().length < 10 ? 'not-allowed' : 'pointer',
                      fontFamily: "'Outfit', sans-serif",
                      opacity: aiLoading || aiNotes.trim().length < 10 ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {aiLoading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Generating...
                      </span>
                    ) : '✨ Generate Brief'}
                  </button>
                  <button
                    onClick={() => { setShowAIBrief(false); setAiNotes(""); }}
                    disabled={aiLoading}
                    style={{
                      background: 'transparent', color: DESIGN_SYSTEM.colors.text.tertiary,
                      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                      borderRadius: 10, padding: '12px 20px', fontWeight: 600, fontSize: 15,
                      cursor: aiLoading ? 'not-allowed' : 'pointer',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Result Preview */}
            {aiResult && (
              <>
                {/* Generated Description */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Generated Description
                  </label>
                  <div style={{
                    background: DESIGN_SYSTEM.colors.bg.primary,
                    border: `1px solid ${DESIGN_SYSTEM.colors.brand.purple}33`,
                    borderRadius: 10, padding: '12px 14px',
                    color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14,
                    lineHeight: 1.6, fontFamily: "'Outfit', sans-serif",
                  }}>
                    {aiResult.description}
                  </div>
                </div>

                {/* Suggested Genres */}
                {aiResult.genres?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Suggested Genres
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {aiResult.genres.map(g => (
                        <span key={g} style={{
                          background: DESIGN_SYSTEM.colors.brand.primary,
                          color: '#fff', borderRadius: 20, padding: '4px 12px',
                          fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                        }}>{g}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Moods */}
                {aiResult.moods?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Suggested Moods
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {aiResult.moods.map(m => (
                        <span key={m} style={{
                          background: DESIGN_SYSTEM.colors.brand.purple,
                          color: '#fff', borderRadius: 20, padding: '4px 12px',
                          fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                        }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Project Type */}
                {aiResult.project_type && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Suggested Project Type
                    </label>
                    <span style={{
                      background: DESIGN_SYSTEM.colors.brand.blue || '#2D7FF9',
                      color: '#fff', borderRadius: 20, padding: '4px 12px',
                      fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                    }}>{aiResult.project_type}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button
                    onClick={applyAIBrief}
                    style={{
                      flex: 1,
                      background: DESIGN_SYSTEM.colors.brand.primary,
                      color: '#fff', border: 'none', borderRadius: 10,
                      padding: '12px', fontWeight: 600, fontSize: 15,
                      cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Apply to Form
                  </button>
                  <button
                    onClick={() => { setAiResult(null); }}
                    style={{
                      background: 'transparent', color: DESIGN_SYSTEM.colors.text.tertiary,
                      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                      borderRadius: 10, padding: '12px 20px', fontWeight: 600, fontSize: 15,
                      cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => { setShowAIBrief(false); setAiResult(null); setAiNotes(""); }}
                    style={{
                      background: 'transparent', color: DESIGN_SYSTEM.colors.text.tertiary,
                      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                      borderRadius: 10, padding: '12px 16px', fontWeight: 600, fontSize: 15,
                      cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmModal?.open}
        title={confirmModal?.title}
        message={confirmModal?.message}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  );
}

// ─── RESPONSES PAGE (EXECUTIVES ONLY) ───────────────────────────────────────
function ResponsesPage({ userProfile, onNavigate, onViewProfile, audioPlayer }) {
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactingId, setContactingId] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'shortlisted' | 'rejected'

  // Shortlist/reject state (localStorage-backed per exec)
  const [shortlistedIds, setShortlistedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`sp-shortlist-${userProfile.id}`) || '[]')); }
    catch { return new Set(); }
  });
  const [rejectedIds, setRejectedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`sp-rejected-${userProfile.id}`) || '[]')); }
    catch { return new Set(); }
  });

  const toggleShortlist = (responseId) => {
    setShortlistedIds(prev => {
      const next = new Set(prev);
      if (next.has(responseId)) { next.delete(responseId); }
      else { next.add(responseId); setRejectedIds(r => { const nr = new Set(r); nr.delete(responseId); localStorage.setItem(`sp-rejected-${userProfile.id}`, JSON.stringify([...nr])); return nr; }); }
      localStorage.setItem(`sp-shortlist-${userProfile.id}`, JSON.stringify([...next]));
      return next;
    });
  };

  const toggleRejected = (responseId) => {
    setRejectedIds(prev => {
      const next = new Set(prev);
      if (next.has(responseId)) { next.delete(responseId); }
      else { next.add(responseId); setShortlistedIds(s => { const ns = new Set(s); ns.delete(responseId); localStorage.setItem(`sp-shortlist-${userProfile.id}`, JSON.stringify([...ns])); return ns; }); }
      localStorage.setItem(`sp-rejected-${userProfile.id}`, JSON.stringify([...next]));
      return next;
    });
  };

  // Use shared audio player from parent
  const { playingSong, isPlaying, play: playAudio, stop: stopAudio } = audioPlayer;

  useEffect(() => {
    loadOpportunities();
  }, []);

  const handleContactComposer = async (composerId) => {
    setContactingId(composerId);
    try {
      // Check if conversation already exists
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${userProfile.id},user2_id.eq.${composerId}),and(user1_id.eq.${composerId},user2_id.eq.${userProfile.id})`)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (!existingConv) {
        // Create new conversation
        const { error: createError } = await supabase
          .from('conversations')
          .insert([{
            user1_id: userProfile.id,
            user2_id: composerId
          }]);

        if (createError) throw createError;
      }

      // Navigate to Messages page
      onNavigate('messages');
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setContactingId(null);
    }
  };

  const loadOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          responses (count)
        `)
        .eq('creator_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (err) {
      console.error("Error loading opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadResponses = async (oppId) => {
    setLoading(true);
    try {
      const { data, error} = await supabase
        .from('responses')
        .select(`
          *,
          composer:user_profiles!responses_composer_id_fkey (
            first_name,
            last_name,
            avatar_color,
            avatar_url,
            bio,
            location
          ),
          song:songs (
            id,
            title,
            genre,
            duration,
            bpm,
            key,
            mood,
            audio_url
          )
        `)
        .eq('opportunity_id', oppId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (err) {
      console.error("Error loading responses:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectOpportunity = (opp) => {
    setSelectedOpp(opp);
    loadResponses(opp.id);
  };

  const goBack = () => {
    setSelectedOpp(null);
    setResponses([]);
    stopAudio();
  };

  return (
    <div style={{ padding: "32px 36px", minHeight: "100%", overflowY: "auto" }}>
      {!selectedOpp ? (
        // Opportunity Folders View
        <>
          <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>Responses</h1>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, marginBottom: 24 }}>View composer applications organized by opportunity</p>

          {loading ? (
            <div style={{ color: DESIGN_SYSTEM.colors.text.muted, textAlign: "center", padding: 60 }}>Loading...</div>
          ) : opportunities.length === 0 ? (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: "center" }}>
              <FileText size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
              <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>Your inbox is ready</h3>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Post your first opportunity and watch applications roll in from talented composers!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {opportunities.map(opp => (
                <div 
                  key={opp.id} 
                  onClick={() => selectOpportunity(opp)}
                  style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 20, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ display: "flex", alignItems: "start", gap: 14, marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${DESIGN_SYSTEM.colors.brand.primary}18`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Briefcase size={22} color={DESIGN_SYSTEM.colors.brand.primary} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{opp.title}</h3>
                      <Badge color={opp.status === 'Open' ? DESIGN_SYSTEM.colors.accent.green : DESIGN_SYSTEM.colors.text.muted}>{opp.status}</Badge>
                    </div>
                  </div>
                  
                  <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, borderRadius: 10, padding: 12, marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Applications</span>
                      <span style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 20, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                        {opp.responses?.[0]?.count || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 12, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    View Applications <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // Responses for Selected Opportunity
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button onClick={goBack} style={{ background: DESIGN_SYSTEM.colors.bg.card, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 10, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 24, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{selectedOpp.title}</h1>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, marginTop: 2 }}>{responses.length} {responses.length === 1 ? 'Application' : 'Applications'}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          {!loading && responses.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['all', 'shortlisted', 'rejected'].map(f => (
                <button key={f} onClick={() => setReviewFilter(f)} style={{
                  background: reviewFilter === f ? (f === 'shortlisted' ? `${DESIGN_SYSTEM.colors.brand.primary}22` : f === 'rejected' ? `${DESIGN_SYSTEM.colors.accent.red}18` : DESIGN_SYSTEM.colors.bg.card) : 'transparent',
                  border: `1px solid ${reviewFilter === f ? (f === 'shortlisted' ? DESIGN_SYSTEM.colors.brand.primary : f === 'rejected' ? DESIGN_SYSTEM.colors.accent.red : DESIGN_SYSTEM.colors.border.light) : DESIGN_SYSTEM.colors.border.light}`,
                  borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  color: reviewFilter === f ? (f === 'shortlisted' ? DESIGN_SYSTEM.colors.brand.primary : f === 'rejected' ? DESIGN_SYSTEM.colors.accent.red : DESIGN_SYSTEM.colors.text.primary) : DESIGN_SYSTEM.colors.text.muted,
                  fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
                }}>
                  {f === 'all' ? `All (${responses.length})` : f === 'shortlisted' ? `Shortlisted (${responses.filter(r => shortlistedIds.has(r.id)).length})` : `Passed (${responses.filter(r => rejectedIds.has(r.id)).length})`}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ color: DESIGN_SYSTEM.colors.text.muted, textAlign: "center", padding: 60 }}>Loading applications...</div>
          ) : responses.length === 0 ? (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: "center" }}>
              <MessageCircle size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
              <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>No applications yet</h3>
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Composers haven't applied to this opportunity yet. Check back later!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {responses
                .filter(r => reviewFilter === 'all' ? true : reviewFilter === 'shortlisted' ? shortlistedIds.has(r.id) : rejectedIds.has(r.id))
                .sort((a, b) => {
                  // Shortlisted first, then unreviewed, then rejected
                  const aScore = shortlistedIds.has(a.id) ? 0 : rejectedIds.has(a.id) ? 2 : 1;
                  const bScore = shortlistedIds.has(b.id) ? 0 : rejectedIds.has(b.id) ? 2 : 1;
                  return aScore - bScore;
                })
                .map(response => (
                <div key={response.id} style={{
                  background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 24,
                  border: `1px solid ${shortlistedIds.has(response.id) ? DESIGN_SYSTEM.colors.brand.primary + '55' : DESIGN_SYSTEM.colors.border.light}`,
                  borderLeft: shortlistedIds.has(response.id) ? `4px solid ${DESIGN_SYSTEM.colors.brand.primary}` : rejectedIds.has(response.id) ? `4px solid ${DESIGN_SYSTEM.colors.accent.red}44` : `4px solid transparent`,
                  opacity: rejectedIds.has(response.id) ? 0.55 : 1,
                  transition: 'all 0.2s ease',
                }}>
                  {/* Composer Info */}
                  <div style={{ display: "flex", alignItems: "start", gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                    <Avatar name={`${response.composer.first_name} ${response.composer.last_name}`} color={response.composer.avatar_color} avatarUrl={response.composer.avatar_url} size={56} />
                    <div style={{ flex: 1 }}>
                      <h3 
                        onClick={() => onViewProfile && onViewProfile(response.composer)}
                        style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 4, cursor: onViewProfile ? "pointer" : "default", display: "inline" }}
                        onMouseEnter={e => { if (onViewProfile) e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.primary; }}
                        onMouseLeave={e => { if (onViewProfile) e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; }}
                      >
                        {response.composer.first_name} {response.composer.last_name}
                      </h3>
                      {response.composer.location && (
                        <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, marginBottom: 6 }}>{response.composer.location}</p>
                      )}
                      {response.composer.bio && (
                        <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, lineHeight: 1.5 }}>{response.composer.bio}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button onClick={() => toggleShortlist(response.id)} title={shortlistedIds.has(response.id) ? 'Remove from shortlist' : 'Shortlist'} style={{ background: shortlistedIds.has(response.id) ? `${DESIGN_SYSTEM.colors.brand.primary}22` : 'transparent', border: `1px solid ${shortlistedIds.has(response.id) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: shortlistedIds.has(response.id) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.muted, fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s' }}>
                        <CheckCircle size={13} /> {shortlistedIds.has(response.id) ? 'Shortlisted' : 'Shortlist'}
                      </button>
                      <button onClick={() => toggleRejected(response.id)} title={rejectedIds.has(response.id) ? 'Undo pass' : 'Pass'} style={{ background: rejectedIds.has(response.id) ? `${DESIGN_SYSTEM.colors.accent.red}18` : 'transparent', border: `1px solid ${rejectedIds.has(response.id) ? DESIGN_SYSTEM.colors.accent.red + '44' : DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: rejectedIds.has(response.id) ? DESIGN_SYSTEM.colors.accent.red : DESIGN_SYSTEM.colors.text.muted, fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s' }}>
                        <XCircle size={13} /> {rejectedIds.has(response.id) ? 'Passed' : 'Pass'}
                      </button>
                    </div>
                  </div>

                  {/* Pitch Message */}
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pitch</h4>
                    <p style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, lineHeight: 1.6 }}>{response.message}</p>
                  </div>

                  {/* Demo Song */}
                  {response.song && (
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Demo</h4>
                      <div style={{ background: DESIGN_SYSTEM.colors.bg.primary, borderRadius: 12, padding: 16, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div 
                            onClick={() => playAudio(response.song)}
                            style={{ width: 42, height: 42, borderRadius: 10, background: `${DESIGN_SYSTEM.colors.brand.primary}22`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}33`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                          >
                            {playingSong?.id === response.song.id && isPlaying ? <Pause size={16} color={DESIGN_SYSTEM.colors.brand.primary} /> : <Play size={16} color={DESIGN_SYSTEM.colors.brand.primary} fill={DESIGN_SYSTEM.colors.brand.primary} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontWeight: 600, fontSize: 15, fontFamily: "'Outfit', sans-serif", marginBottom: 2 }}>{response.song.title}</div>
                            <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12 }}>
                              {response.song.genre && `${response.song.genre}`}
                              {response.song.duration && ` • ${response.song.duration}`}
                              {response.song.bpm && ` • ${response.song.bpm} BPM`}
                              {response.song.key && ` • ${response.song.key}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Button */}
                  <button
                    style={{ width: "100%", background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 14, cursor: contactingId === response.composer_id ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: contactingId === response.composer_id ? 0.7 : 1, transition: "opacity 0.2s" }}
                    onClick={() => handleContactComposer(response.composer_id)}
                    disabled={contactingId === response.composer_id}
                  >
                    <MessageCircle size={16} /> {contactingId === response.composer_id ? "Opening conversation..." : "Contact Composer"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── VIEW PROFILE PAGE (Individual User Profile) ────────────────────────────
function ViewProfilePage({ profileUser, currentUser, onBack, onOpenMessages, audioPlayer }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use shared audio player from parent
  const { playingSong, isPlaying, play: playAudio } = audioPlayer;

  useEffect(() => {
    if (profileUser.account_type === 'composer') {
      loadComposerSongs();
    } else {
      setLoading(false);
    }
  }, [profileUser]);

  const loadComposerSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('composer_id', profileUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSongs(data || []);
    } catch (err) {
      console.error("Error loading songs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    try {
      // Check if conversation already exists
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${profileUser.id}),and(user1_id.eq.${profileUser.id},user2_id.eq.${currentUser.id})`)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (!existingConv) {
        // Create new conversation
        const { error: createError } = await supabase
          .from('conversations')
          .insert([{
            user1_id: currentUser.id,
            user2_id: profileUser.id
          }]);

        if (createError) throw createError;
      }

      // Navigate to Messages page
      onOpenMessages();
    } catch (err) {
      showToast(friendlyError(err), "error");
    }
  };

  return (
    <div style={{ padding: "32px 36px", minHeight: "100%", overflowY: "auto" }}>
      {/* Back Button */}
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: DESIGN_SYSTEM.colors.brand.primary, cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile Header */}
      <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 20, padding: 32, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
          <Avatar name={`${profileUser.first_name} ${profileUser.last_name}`} color={profileUser.avatar_color} avatarUrl={profileUser.avatar_url} size={100} />
          
          <div style={{ flex: 1 }}>
            <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
              {profileUser.first_name} {profileUser.last_name}
            </h1>
            <Badge color={DESIGN_SYSTEM.colors.brand.primary} style={{ marginBottom: 8 }}>
              {profileUser.account_type === "music_executive" ? "Music Executive" : "Composer"}
            </Badge>
            <div style={{ marginBottom: 12 }}><ProfileBadges user={profileUser} /></div>

            {profileUser.bio && (
              <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{profileUser.bio}</p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
              {profileUser.location && (
                <div>
                  <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>Location</div>
                  <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.location}</div>
                </div>
              )}

              {profileUser.account_type === 'composer' && (
                <>
                  {profileUser.pro && (
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>PRO</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.pro}</div>
                    </div>
                  )}
                  {profileUser.role && (
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>Role</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.role}</div>
                    </div>
                  )}
                  {profileUser.instruments && (
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>Instruments</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.instruments}</div>
                    </div>
                  )}
                </>
              )}

              {profileUser.account_type === 'music_executive' && (
                <>
                  {profileUser.company && (
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>Company</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.company}</div>
                    </div>
                  )}
                  {profileUser.job_title && (
                    <div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 4 }}>Job Title</div>
                      <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600 }}>{profileUser.job_title}</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {profileUser.genres && profileUser.genres.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, marginBottom: 8 }}>
                  {profileUser.account_type === 'music_executive' ? 'Genres of Interest' : 'Genres'}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {profileUser.genres.map(g => <Badge key={g} color={DESIGN_SYSTEM.colors.accent.purple}>{g}</Badge>)}
                </div>
              </div>
            )}

            <button onClick={handleContact} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
              <MessageCircle size={16} /> Contact {profileUser.first_name}
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio (Composers only) */}
      {profileUser.account_type === 'composer' && (
        <div>
          <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 16 }}>Portfolio</h2>
          
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 3 }).map((_, i) => (<LoadingSongCard key={i} />))}
            </div>
          ) : songs.length === 0 ? (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 16, padding: 40, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: "center" }}>
              <Music size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14 }}>This composer hasn't uploaded any tracks yet — stay tuned!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {songs.map(song => (
                <SongCard 
                  key={song.id} 
                  song={{ ...song, composer_name: `${profileUser.first_name} ${profileUser.last_name}` }} 
                  isPlaying={playingSong?.id === song.id && isPlaying} 
                  onPlay={playAudio}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MESSAGES PAGE ───────────────────────────────────────────────────────────
function MessagesPage({ userProfile }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchConv, setSearchConv] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);

      // Subscribe to realtime message inserts for this conversation
      const channel = supabase
        .channel(`messages:${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          () => {
            loadMessages(selectedConversation.id);
            loadConversations(); // Update last message preview
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:user_profiles!conversations_user1_id_fkey (
            id,
            first_name,
            last_name,
            avatar_color,
            avatar_url,
            account_type
          ),
          user2:user_profiles!conversations_user2_id_fkey (
            id,
            first_name,
            last_name,
            avatar_color,
            avatar_url,
            account_type
          ),
          messages (
            content,
            created_at
          )
        `)
        .or(`user1_id.eq.${userProfile.id},user2_id.eq.${userProfile.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Format conversations to show the OTHER person
      const formatted = (data || []).map(conv => {
        const otherUser = conv.user1.id === userProfile.id ? conv.user2 : conv.user1;
        const lastMessage = conv.messages?.[0];
        return {
          ...conv,
          otherUser,
          lastMessage: lastMessage?.content || "No messages yet",
          lastMessageTime: lastMessage?.created_at
        };
      });

      setConversations(formatted);
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey (
            first_name,
            last_name,
            avatar_color,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_id: userProfile.id,
          content: messageText.trim()
        }]);

      if (error) throw error;

      setMessageText("");
      loadMessages(selectedConversation.id);
      loadConversations(); // Refresh to update last message
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 0px)", background: DESIGN_SYSTEM.colors.bg.secondary }}>
      {/* Conversations List */}
      <div style={{ width: 320, background: DESIGN_SYSTEM.colors.bg.secondary, borderRight: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
          <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Messages</h2>
          <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, marginTop: 4, marginBottom: 12 }}>
            {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
          </p>
          {conversations.length > 0 && (
            <div style={{ position: "relative" }}>
              <Search size={14} color={DESIGN_SYSTEM.colors.text.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={searchConv}
                onChange={e => setSearchConv(e.target.value)}
                placeholder="Search conversations..."
                style={{
                  width: "100%",
                  background: DESIGN_SYSTEM.colors.bg.card,
                  border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                  borderRadius: 8,
                  padding: "8px 10px 8px 32px",
                  color: DESIGN_SYSTEM.colors.text.primary,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Outfit', sans-serif",
                }}
              />
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: DESIGN_SYSTEM.colors.text.muted }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <MessageCircle size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 16px" }} />
              <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>Your first conversation is just a click away — explore profiles or respond to an opportunity!</p>
            </div>
          ) : (
            conversations
              .filter(conv => {
                if (!searchConv.trim()) return true;
                const fullName = `${conv.otherUser.first_name} ${conv.otherUser.last_name}`.toLowerCase();
                return fullName.includes(searchConv.toLowerCase());
              })
              .map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                  cursor: "pointer",
                  background: selectedConversation?.id === conv.id ? DESIGN_SYSTEM.colors.bg.card : "transparent",
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => { if (selectedConversation?.id !== conv.id) e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover; }}
                onMouseLeave={e => { if (selectedConversation?.id !== conv.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <Avatar name={`${conv.otherUser.first_name} ${conv.otherUser.last_name}`} color={conv.otherUser.avatar_color} avatarUrl={conv.otherUser.avatar_url} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {conv.otherUser.first_name} {conv.otherUser.last_name}
                    </div>
                    <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, marginTop: 2 }}>
                      {conv.otherUser.account_type === 'music_executive' ? 'Executive' : 'Composer'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                    {conv.lastMessage}
                  </div>
                  {conv.lastMessageTime && (
                    <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatMessageTime(conv.lastMessageTime)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Chat Header */}
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, background: DESIGN_SYSTEM.colors.bg.secondary }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar
                name={`${selectedConversation.otherUser.first_name} ${selectedConversation.otherUser.last_name}`}
                color={selectedConversation.otherUser.avatar_color}
                avatarUrl={selectedConversation.otherUser.avatar_url}
                size={48}
              />
              <div>
                <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                  {selectedConversation.otherUser.first_name} {selectedConversation.otherUser.last_name}
                </h3>
                <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, marginTop: 2 }}>
                  {selectedConversation.otherUser.account_type === 'music_executive' ? 'Music Executive' : 'Composer'}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {loading && messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: 6 }).map((_, i) => (<LoadingMessageItem key={i} />))}
              </div>
            ) : messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40, color: DESIGN_SYSTEM.colors.text.muted }}>
                  <MessageCircle size={48} color={DESIGN_SYSTEM.colors.text.muted} style={{ marginBottom: 6 }} />
                  <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700 }}>Say hello!</div>
                  <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, maxWidth: 420, textAlign: 'center' }}>This is the start of something great. Send your first message and kick off the collaboration!</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button onClick={() => loadConversations()} style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: DESIGN_SYSTEM.colors.text.primary, border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>Refresh</button>
                    <button onClick={() => showToast('Tip: open a profile then click Message to start', 'info')} style={{ background: 'transparent', color: DESIGN_SYSTEM.colors.text.tertiary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>How to message</button>
                  </div>
                  <div style={{ width: '100%', marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 12, padding: 12, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                        <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 10, width: '70%' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map(msg => {
                const isMe = msg.sender_id === userProfile.id;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: 12 }}>
                    {!isMe && (
                      <Avatar
                        name={`${msg.sender.first_name} ${msg.sender.last_name}`}
                        color={msg.sender.avatar_color}
                        avatarUrl={msg.sender.avatar_url}
                        size={32}
                      />
                    )}
                    <div style={{ maxWidth: "60%" }}>
                      <div style={{
                        background: isMe ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.bg.card,
                        color: DESIGN_SYSTEM.colors.text.primary,
                        padding: "12px 16px",
                        borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        fontSize: 14,
                        lineHeight: 1.5,
                        fontFamily: "'Outfit', sans-serif"
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ 
                        color: DESIGN_SYSTEM.colors.text.muted, 
                        fontSize: 11, 
                        marginTop: 4,
                        textAlign: isMe ? "right" : "left"
                      }}>
                        {formatMessageTime(msg.created_at)}
                      </div>
                    </div>
                    {isMe && (
                      <Avatar
                        name={`${userProfile.first_name} ${userProfile.last_name}`}
                        color={userProfile.avatar_color}
                        avatarUrl={userProfile.avatar_url}
                        size={32}
                      />
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div style={{ padding: "20px 24px", borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, background: DESIGN_SYSTEM.colors.bg.secondary }}>
            <form onSubmit={sendMessage} style={{ display: "flex", gap: 12 }}>
              <input
                type="text"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                style={{
                  flex: 1,
                  background: DESIGN_SYSTEM.colors.bg.card,
                  border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  color: DESIGN_SYSTEM.colors.text.primary,
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "'Outfit', sans-serif"
                }}
              />
              <button
                type="submit"
                disabled={sending || !messageText.trim()}
                style={{
                  background: DESIGN_SYSTEM.colors.brand.primary,
                  color: DESIGN_SYSTEM.colors.text.primary,
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 24px",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: (sending || !messageText.trim()) ? "not-allowed" : "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  opacity: (sending || !messageText.trim()) ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Send size={16} /> {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: DESIGN_SYSTEM.colors.text.muted }}>
          <div style={{ textAlign: "center" }}>
            <MessageCircle size={64} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>Select a conversation</h3>
            <p style={{ fontSize: 14 }}>Choose a conversation from the left to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
// ─── LANDING PAGE ────────────────────────────────────────────────────────────
function LandingPage({ onGetStarted }) {
  return (
    <div className="hero-animated-bg" style={{
      minHeight: "100vh",
      fontFamily: "'Outfit', sans-serif",
      color: DESIGN_SYSTEM.colors.text.primary,
      overflow: "auto"
    }}>
      {/* Header/Nav */}
      <div style={{ 
        padding: "24px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/songpitch-logo.png"
            alt="SongPitch"
            style={{ width: 40, height: 40, objectFit: 'contain' }}
            onError={(e) => e.target.style.display = 'none'}
          />
          <div style={{ 
            fontSize: 26, 
            fontWeight: 800, 
            background: DESIGN_SYSTEM.colors.gradient.main,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>SongPitch</div>
        </div>

        {/* CTA Button */}
        <button 
          onClick={onGetStarted}
          style={{ 
            background: DESIGN_SYSTEM.colors.gradient.main,
            color: DESIGN_SYSTEM.colors.text.primary, 
            border: "none", 
            borderRadius: 10, 
            padding: "12px 28px", 
            fontSize: 15, 
            fontWeight: 700, 
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 4px 16px rgba(29,185,84,0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(29,185,84,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,185,84,0.3)';
          }}
        >
          Sign In / Sign Up
        </button>
      </div>

      {/* Hero Section */}
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "80px 48px 60px",
        textAlign: "center"
      }}>
        {/* Centered Hero Logo */}
        <div style={{ marginBottom: 32 }}>
          <img
            src="/songpitch-logo.png"
            alt="SongPitch"
            style={{
              width: 88,
              height: 88,
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 24px rgba(29,185,84,0.35))',
              animation: 'fadeInUp 0.6s ease-out',
            }}
          />
        </div>

        <h1 style={{
          fontSize: 56,
          fontWeight: 900,
          marginBottom: 20,
          lineHeight: 1.2,
          letterSpacing: "-1px"
        }}>
          Where Talent Meets
          <br />
          <span style={{
            background: DESIGN_SYSTEM.colors.gradient.main,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Opportunity</span>
        </h1>

        <p style={{
          fontSize: 20,
          color: DESIGN_SYSTEM.colors.text.secondary,
          maxWidth: 680,
          margin: "0 auto 40px",
          lineHeight: 1.7
        }}>
          The platform connecting composers directly with the music executives searching for them.
        </p>
      </div>

      {/* Our Story Section */}
      <div style={{ 
        maxWidth: 800,
        margin: "0 auto",
        padding: "60px 48px",
        background: DESIGN_SYSTEM.colors.bg.card,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        marginBottom: 80,
        marginLeft: 'auto',
        marginRight: 'auto',
        width: 'calc(100% - 96px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ 
          fontSize: 32, 
          fontWeight: 800, 
          marginBottom: 30,
          textAlign: "center",
          background: DESIGN_SYSTEM.colors.gradient.main,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Born from a Real Problem
        </h2>

        <p style={{ 
          fontSize: 17, 
          color: DESIGN_SYSTEM.colors.text.secondary,
          lineHeight: 1.8,
          marginBottom: 24
        }}>
          SongPitch started with a conversation. An A&R executive shared how exhausting it was to search 
          across countless platforms, hoping to find the right artist for each project.
        </p>

        <p style={{ 
          fontSize: 17, 
          color: DESIGN_SYSTEM.colors.text.secondary,
          lineHeight: 1.8,
          marginBottom: 24
        }}>
          Meanwhile, talented composers were struggling to break into sync licensing—one of the most 
          profitable opportunities in music—simply because they couldn't reach the right people at the 
          right time.
        </p>

        <p style={{ 
          fontSize: 17, 
          color: DESIGN_SYSTEM.colors.text.primary,
          lineHeight: 1.8,
          fontWeight: 600
        }}>
          We built SongPitch to solve both problems at once.
        </p>
      </div>

      {/* How It Works Section */}
      <div style={{ 
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 48px 80px",
      }}>
        <h2 style={{ 
          fontSize: 36, 
          fontWeight: 800, 
          textAlign: "center",
          marginBottom: 60
        }}>The Solution</h2>

        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 40
        }}>
          {/* For Executives */}
          <div style={{ 
            background: "rgba(6,182,212,0.05)",
            border: `1px solid ${DESIGN_SYSTEM.colors.brand.accent}30`,
            borderRadius: 16,
            padding: 36,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.accent + '60';
            e.currentTarget.style.boxShadow = `0 12px 32px ${DESIGN_SYSTEM.colors.brand.accent}20`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.accent + '30';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ 
              width: 60, 
              height: 60, 
              borderRadius: 14,
              background: `${DESIGN_SYSTEM.colors.brand.accent}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24
            }}>
              <Search size={30} color={DESIGN_SYSTEM.colors.brand.accent} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>For Music Executives</h3>
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.7, fontSize: 16 }}>
              Find exactly what you need, when you need it. Browse composers by genre, mood, and style. 
              See their full catalog, listen to demos, and connect directly—all in one place.
            </p>
          </div>

          {/* For Composers */}
          <div style={{ 
            background: "rgba(168,85,247,0.05)",
            border: `1px solid ${DESIGN_SYSTEM.colors.brand.purple}30`,
            borderRadius: 16,
            padding: 36,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.purple + '60';
            e.currentTarget.style.boxShadow = `0 12px 32px ${DESIGN_SYSTEM.colors.brand.purple}20`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.brand.purple + '30';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ 
              width: 60, 
              height: 60, 
              borderRadius: 14,
              background: `${DESIGN_SYSTEM.colors.brand.purple}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24
            }}>
              <Music size={30} color={DESIGN_SYSTEM.colors.brand.purple} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>For Composers</h3>
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.7, fontSize: 16 }}>
              Stop chasing opportunities. They come to you. Build your professional catalog, respond to 
              real briefs from industry professionals, and get your music in front of decision-makers.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Preview / Feature Walkthrough */}
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 48px 80px",
      }}>
        <h2 style={{
          fontSize: 36,
          fontWeight: 800,
          textAlign: "center",
          marginBottom: 16,
          background: DESIGN_SYSTEM.colors.gradient.main,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          See What's Inside
        </h2>
        <p style={{
          fontSize: 17,
          color: DESIGN_SYSTEM.colors.text.secondary,
          textAlign: "center",
          maxWidth: 600,
          margin: "0 auto 48px",
          lineHeight: 1.7,
        }}>
          Everything you need to discover, pitch, and collaborate — all in one platform.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
        }}>
          {[
            { icon: <Music size={24} color={DESIGN_SYSTEM.colors.brand.primary} />, title: "Professional Portfolio", desc: "Upload tracks with genre, mood, and BPM metadata. Your music catalog, always ready to impress.", color: DESIGN_SYSTEM.colors.brand.primary },
            { icon: <Briefcase size={24} color={DESIGN_SYSTEM.colors.brand.accent} />, title: "Real Opportunities", desc: "Executives post briefs with budgets, deadlines, and genre needs. Composers apply with one click.", color: DESIGN_SYSTEM.colors.brand.accent },
            { icon: <Headphones size={24} color={DESIGN_SYSTEM.colors.brand.purple} />, title: "Instant Playback", desc: "Listen to any demo without leaving the page. A persistent player keeps the music going.", color: DESIGN_SYSTEM.colors.brand.purple },
            { icon: <MessageCircle size={24} color={DESIGN_SYSTEM.colors.brand.blue} />, title: "Direct Messaging", desc: "Skip the middleman. Real-time conversations between composers and executives.", color: DESIGN_SYSTEM.colors.brand.blue },
            { icon: <Users size={24} color={DESIGN_SYSTEM.colors.accent.amber} />, title: "Composer Roster", desc: "Browse profiles by genre and style. Find the perfect sound for your next project.", color: DESIGN_SYSTEM.colors.accent.amber },
            { icon: <Shield size={24} color={DESIGN_SYSTEM.colors.accent.green} />, title: "Built for Trust", desc: "Verified profiles, transparent applications, and direct connections — no spam, no noise.", color: DESIGN_SYSTEM.colors.accent.green },
          ].map((feature, idx) => (
            <div key={idx} style={{
              background: DESIGN_SYSTEM.colors.bg.card,
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 16,
              padding: 24,
              transition: 'all 0.3s ease',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = feature.color + '50';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${feature.color}18`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border.light;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${feature.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}>
                {feature.icon}
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: DESIGN_SYSTEM.colors.text.primary }}>{feature.title}</h4>
              <p style={{ fontSize: 14, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.6, margin: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Early Access Section */}
      <div style={{
        maxWidth: 900,
        margin: "0 auto 80px",
        padding: "60px 48px",
        background: `linear-gradient(135deg, ${DESIGN_SYSTEM.colors.brand.accent}15 0%, ${DESIGN_SYSTEM.colors.brand.purple}15 100%)`,
        borderRadius: 20,
        border: `1px solid ${DESIGN_SYSTEM.colors.brand.accent}30`,
        marginLeft: 'auto',
        marginRight: 'auto',
        width: 'calc(100% - 96px)',
        boxShadow: '0 12px 48px rgba(29,185,84,0.2)',
        textAlign: "center"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: DESIGN_SYSTEM.colors.gradient.main,
          padding: "8px 20px",
          borderRadius: 20,
          marginBottom: 24,
          fontSize: 14,
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(29,185,84,0.3)'
        }}>
          <Zap size={14} /> Early Access
        </div>

        <h2 style={{
          fontSize: 34,
          fontWeight: 800,
          marginBottom: 24,
          lineHeight: 1.3
        }}>
          Get In Before Everyone Else
        </h2>

        <p style={{
          fontSize: 18,
          color: DESIGN_SYSTEM.colors.text.secondary,
          lineHeight: 1.8,
          marginBottom: 20,
          maxWidth: 700,
          margin: "0 auto 20px"
        }}>
          SongPitch is growing fast. Join now to <strong style={{ color: DESIGN_SYSTEM.colors.text.primary }}>build your network early</strong>,
          get priority access to new features, and be part of a community that's reshaping how music
          gets placed in film, TV, and advertising.
        </p>

        <p style={{
          fontSize: 17,
          color: DESIGN_SYSTEM.colors.text.secondary,
          lineHeight: 1.8,
          maxWidth: 700,
          margin: "0 auto"
        }}>
          Early members shape the platform. Your voice matters here — from the features we build
          to the connections we foster. This is your chance to be a founding member.
        </p>

        <p style={{
          fontSize: 18,
          color: DESIGN_SYSTEM.colors.text.primary,
          fontWeight: 700,
          marginTop: 28,
          fontStyle: "italic"
        }}>
          The future of music collaboration starts now.
        </p>
      </div>

      {/* CTA Section */}
      <div style={{ 
        maxWidth: 700,
        margin: "0 auto",
        padding: "0 48px 100px",
        textAlign: "center"
      }}>
        <h2 style={{ 
          fontSize: 40, 
          fontWeight: 800, 
          marginBottom: 24
        }}>Ready to Connect?</h2>
        
        <button 
          onClick={onGetStarted}
          style={{ 
            background: DESIGN_SYSTEM.colors.gradient.main,
            color: DESIGN_SYSTEM.colors.text.primary, 
            border: "none", 
            borderRadius: 14, 
            padding: "20px 52px", 
            fontSize: 18, 
            fontWeight: 700, 
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 8px 28px rgba(29,185,84,0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(29,185,84,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(29,185,84,0.4)';
          }}
        >
          Get Started →
        </button>
      </div>

      {/* Footer */}
      <div style={{ 
        borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        padding: "40px 48px",
        textAlign: "center"
      }}>
        <p style={{ 
          color: DESIGN_SYSTEM.colors.text.muted,
          fontSize: 15,
          marginBottom: 12
        }}>
          Questions? Feedback? We'd love to hear from you.
        </p>
        <a 
          href="mailto:mangulo@songpitchhub.com"
          style={{ 
            color: DESIGN_SYSTEM.colors.brand.accent,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.blue}
          onMouseLeave={e => e.currentTarget.style.color = DESIGN_SYSTEM.colors.brand.accent}
        >
          mangulo@songpitchhub.com
        </a>
        <p style={{ 
          color: DESIGN_SYSTEM.colors.text.muted,
          fontSize: 14,
          marginTop: 24
        }}>
          © {new Date().getFullYear()} SongPitch. Where talent meets opportunity.
        </p>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function SongPitch() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);  // NEW: Show landing page first
  const [page, setPage] = useState("dashboard");
  const [stats, setStats] = useState({ songs: 0, users: 0, opportunities: 0, conversations: 0 });
  const [badgeCounts, setBadgeCounts] = useState({ messages: 0, responses: 0, opportunities: 0 });
  const [viewingProfile, setViewingProfile] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('songpitch-theme') || 'dark');

  // Global audio player - shared across all pages
  const audioPlayer = useAudioPlayer();

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('songpitch-theme', next);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userProfile) {
      loadStats();
    }
  }, [userProfile]);

  // Global spacebar play/pause shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code !== 'Space') return;

      // Don't intercept when user is typing in an input or textarea
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable) return;

      // Only act if there's a song loaded
      if (!audioPlayer.playingSong) return;

      e.preventDefault();
      audioPlayer.play(audioPlayer.playingSong);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioPlayer]);

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*, composers(*)')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setUserProfile(null);
        } else {
          throw error;
        }
      } else {
        setUserProfile(data);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const isExec = userProfile?.account_type === 'music_executive';
      const isComposer = userProfile?.account_type === 'composer';

      // Base queries (platform totals + conversations)
      const queries = [
        supabase.from('songs').select('id', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_deleted', false).neq('account_type', userProfile?.account_type || ''),
        supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('status', 'Open'),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).or(`user1_id.eq.${userProfile.id},user2_id.eq.${userProfile.id}`),
      ];

      // Role-specific queries
      if (isComposer) {
        queries.push(
          supabase.from('songs').select('id', { count: 'exact', head: true }).eq('composer_id', userProfile.id)
        );
      }
      if (isExec) {
        queries.push(
          supabase.from('opportunities').select('id').eq('creator_id', userProfile.id)
        );
      }

      const results = await Promise.all(queries);
      const [songsRes, usersRes, oppsRes, convsRes] = results;

      const newStats = {
        songs: songsRes.count || 0,
        users: usersRes.count || 0,
        opportunities: oppsRes.count || 0,
        conversations: convsRes.count || 0,
      };

      if (isComposer) {
        newStats.mySongs = results[4]?.count || 0;
      }

      if (isExec) {
        const execOpps = results[4]?.data || [];
        const oppIds = execOpps.map(o => o.id);
        if (oppIds.length > 0) {
          const { count } = await supabase
            .from('responses')
            .select('id', { count: 'exact', head: true })
            .in('opportunity_id', oppIds);
          newStats.totalResponses = count || 0;
        } else {
          newStats.totalResponses = 0;
        }
      }

      setStats(newStats);
      setBadgeCounts({
        messages: newStats.conversations,
        responses: isExec ? (newStats.totalResponses || 0) : 0,
        opportunities: isComposer ? newStats.opportunities : 0,
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setPage("dashboard");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16, background: DESIGN_SYSTEM.colors.bg.primary, fontFamily: "'Outfit', sans-serif" }}>
        <img src="/songpitch-logo.png" alt="SongPitch" style={{ width: 56, height: 56, objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="ui-spinner" style={{ width: 16, height: 16, border: `2px solid ${DESIGN_SYSTEM.colors.border.light}`, borderTopColor: DESIGN_SYSTEM.colors.brand.primary, borderRadius: '50%' }} />
          <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, fontWeight: 500 }}>Loading SongPitch...</span>
        </div>
      </div>
    );
  }

  // Show landing page if user hasn't clicked "Get Started"
  if (showLanding && !session) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  if (!session) {
    return <AuthPage onAuthComplete={() => {}} />;
  }

  if (!userProfile) {
    return <AccountSetupPage user={session.user} onComplete={() => loadUserProfile(session.user.id)} />;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <TrendingUp size={17} />, forAll: true },
    { id: "roster", label: userProfile.account_type === 'music_executive' ? "Composer Roster" : "Executives", icon: <Users size={17} />, forAll: true },
    { id: "catalog", label: "Search Catalog", icon: <Search size={17} />, forAll: true },
    { id: "opportunities", label: "Opportunities", icon: <Briefcase size={17} />, forAll: true, badge: badgeCounts.opportunities },
    { id: "responses", label: "Responses", icon: <FileText size={17} />, forExecutive: true, badge: badgeCounts.responses },
    { id: "messages", label: "Messages", icon: <MessageCircle size={17} />, forAll: true, badge: badgeCounts.messages },
    { id: "portfolio", label: "My Portfolio", icon: <Music size={17} />, forComposer: true },
    { id: "profile", label: "My Profile", icon: <User size={17} />, forAll: true },
  ];

  const nav = navItems.filter(item => 
    item.forAll || 
    (item.forComposer && userProfile.account_type === 'composer') ||
    (item.forExecutive && userProfile.account_type === 'music_executive')
  );

  const renderPage = () => {
    // If viewing another user's profile, show ViewProfilePage
    if (viewingProfile) {
      return (
        <ViewProfilePage
          profileUser={viewingProfile}
          currentUser={userProfile}
          onBack={() => setViewingProfile(null)}
          onOpenMessages={() => { setViewingProfile(null); setPage('messages'); }}
          audioPlayer={audioPlayer}
        />
      );
    }

    switch (page) {
      case "dashboard": return <DashboardPage user={userProfile} stats={stats} onNavigate={setPage} />;
      case "roster": return <RosterPage accountType={userProfile.account_type} onViewProfile={setViewingProfile} />;
      case "catalog": return <CatalogPage audioPlayer={audioPlayer} />;
      case "opportunities": return <OpportunitiesPage userProfile={userProfile} />;
      case "responses": return <ResponsesPage userProfile={userProfile} onNavigate={setPage} onViewProfile={setViewingProfile} audioPlayer={audioPlayer} />;
      case "messages": return <MessagesPage userProfile={userProfile} />;
      case "portfolio": return <PortfolioPage userProfile={userProfile} audioPlayer={audioPlayer} />;
      case "profile": return <ProfilePage user={{ ...userProfile, email: session.user.email }} onSignOut={handleSignOut} onProfileUpdate={() => loadUserProfile(session.user.id)} />;
      default: return <DashboardPage user={userProfile} stats={stats} />;
    }
  };

  return (
    <div className="app-root" style={{ display: "flex", height: "100vh", background: DESIGN_SYSTEM.colors.bg.secondary, fontFamily: "'Outfit', sans-serif", color: DESIGN_SYSTEM.colors.text.primary, overflow: "hidden" }}>
      <div className={sidebarCollapsed ? 'sidebar-collapsed' : ''} style={{ width: sidebarCollapsed ? 96 : 240, background: DESIGN_SYSTEM.colors.bg.secondary, borderRight: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "22px 20px", borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Logo - Professional presentation */}
            <img
              src="/songpitch-logo.png"
              alt="SongPitch"
              style={{ width: 32, height: 32, objectFit: 'contain', margin: sidebarCollapsed ? '0 auto' : undefined }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {!sidebarCollapsed && (
              <div>
                <div style={{ 
                  fontSize: 19, 
                  fontWeight: 700, 
                  color: DESIGN_SYSTEM.colors.text.primary,
                  letterSpacing: "-0.3px",
                  fontFamily: "'Outfit', sans-serif",
                }}>SongPitch</div>
                <div style={{ 
                  fontSize: 11, 
                  color: DESIGN_SYSTEM.colors.text.muted, 
                  textTransform: "uppercase", 
                  letterSpacing: "0.5px", 
                  fontWeight: 500,
                }}>Music Collaboration</div>
              </div>
            )}
            <div style={{ marginLeft: sidebarCollapsed ? 0 : 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
              <button aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme} style={{ background: 'transparent', border: 'none', color: DESIGN_SYSTEM.colors.text.tertiary, cursor: 'pointer', padding: 6 }} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setSidebarCollapsed(s => !s)} style={{ background: 'transparent', border: 'none', color: DESIGN_SYSTEM.colors.text.tertiary, cursor: 'pointer', padding: 6 }}>
                {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>
          </div>
          {/* header now-playing label removed for aesthetic */}
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto", display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map(item => (
            <button key={item.id} aria-label={item.label} onClick={() => { setPage(item.id); setViewingProfile(null); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: sidebarCollapsed ? 0 : 10, padding: sidebarCollapsed ? "10px 6px" : "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: page === item.id ? 600 : 400, transition: "all 0.15s", position: 'relative',
              background: page === item.id ? `${DESIGN_SYSTEM.colors.brand.primary}15` : "transparent",
              color: page === item.id ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.tertiary,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              borderLeft: page === item.id ? `3px solid ${DESIGN_SYSTEM.colors.brand.primary}` : '3px solid transparent',
            }}
              onMouseEnter={e => { if (page !== item.id) { e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.card; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; } }}
              onMouseLeave={e => { if (page !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.tertiary; } }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, color: page === item.id ? DESIGN_SYSTEM.colors.brand.primary : 'inherit' }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.badge > 0 && (
                <span style={{
                  position: sidebarCollapsed ? 'absolute' : 'static',
                  top: sidebarCollapsed ? 2 : undefined,
                  right: sidebarCollapsed ? 6 : undefined,
                  marginLeft: sidebarCollapsed ? 0 : 'auto',
                  background: DESIGN_SYSTEM.colors.brand.primary,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 5px',
                  lineHeight: 1,
                }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: "14px 14px", borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
          <div
            onClick={() => { setPage('profile'); setViewingProfile(null); }}
            style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: sidebarCollapsed ? 'center' : 'flex-start', cursor: 'pointer', padding: '6px 4px', borderRadius: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.card}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Avatar name={`${userProfile.first_name} ${userProfile.last_name}`} color={userProfile.avatar_color} avatarUrl={userProfile.avatar_url} size={34} />
            {!sidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userProfile.first_name} {userProfile.last_name}</div>
                <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: DESIGN_SYSTEM.colors.brand.primary, display: 'inline-block' }}></span>
                  {userProfile.account_type === 'music_executive' ? 'Executive' : 'Composer'}
                </div>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (() => {
            const fields = userProfile.account_type === 'composer'
              ? [userProfile.bio, userProfile.location, userProfile.avatar_url, userProfile.pro, userProfile.role, Array.isArray(userProfile.genres) && userProfile.genres.length > 0, userProfile.instruments]
              : [userProfile.bio, userProfile.location, userProfile.avatar_url, userProfile.company, userProfile.job_title, Array.isArray(userProfile.genres) && userProfile.genres.length > 0];
            const filled = fields.filter(Boolean).length;
            const total = fields.length;
            if (filled >= total) return null;
            const pct = Math.round((filled / total) * 100);
            return (
              <div
                onClick={() => { setPage('profile'); setViewingProfile(null); }}
                style={{ marginTop: 8, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.card}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: DESIGN_SYSTEM.colors.brand.primary, fontWeight: 600 }}>Complete your profile</span>
                  <span style={{ fontSize: 10, color: DESIGN_SYSTEM.colors.text.muted }}>{pct}%</span>
                </div>
                <div style={{ height: 3, background: DESIGN_SYSTEM.colors.bg.elevated, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: DESIGN_SYSTEM.colors.brand.primary, borderRadius: 2, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <main id="main-content" className="page-fade-in" key={viewingProfile ? `profile-${viewingProfile.id}` : page} style={{ flex: 1, overflowY: "auto", background: DESIGN_SYSTEM.colors.bg.secondary, paddingBottom: audioPlayer.playingSong ? 70 : 0 }}>
        {renderPage()}
      </main>

      {/* Now Playing Bar */}
      <NowPlayingBar
        playingSong={audioPlayer.playingSong}
        isPlaying={audioPlayer.isPlaying}
        currentTime={audioPlayer.currentTime}
        duration={audioPlayer.duration}
        onPlay={audioPlayer.play}
        onStop={audioPlayer.stop}
        onRestart={audioPlayer.restart}
        onSkipBack={audioPlayer.skipBack}
        onSkipForward={audioPlayer.skipForward}
        onSeekTo={audioPlayer.seekTo}
        volume={audioPlayer.volume}
        isMuted={audioPlayer.isMuted}
        onVolumeChange={audioPlayer.setVolumeLevel}
        onToggleMute={audioPlayer.toggleMute}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
