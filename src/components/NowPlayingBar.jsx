import { Music, Play, Pause, X, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { DESIGN_SYSTEM } from '../constants/designSystem';

export function NowPlayingBar({ playingSong, isPlaying, currentTime, duration, waveformPeaks, onPlay, onStop, onRestart, onSkipBack, onSkipForward, onSeekTo, volume, isMuted, onVolumeChange, onToggleMute, sidebarCollapsed, sidebarOffset }) {
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
      left: typeof sidebarOffset === 'number' ? sidebarOffset : (sidebarCollapsed ? 96 : 240),
      right: 0,
      background: 'rgba(9,11,20,0.94)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.medium}`,
      padding: '0',
      zIndex: 100,
      transition: 'left 0.2s ease',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      boxShadow: '0 -8px 32px rgba(0,0,0,0.6), 0 -1px 0 rgba(201,168,76,0.06)',
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
        {Array.from({ length: 100 }).map((_, i) => {
          const barProgress = ((i + 1) / 100) * 100;
          const isPast = barProgress <= progress;
          // Use real waveform peaks if available, otherwise deterministic pseudo-random fallback
          const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
          const fallbackHeight = 30 + (seed - Math.floor(seed)) * 70;
          const barHeight = waveformPeaks ? (waveformPeaks[i] || 0.1) * 100 : fallbackHeight;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(barHeight, 8)}%`,
                borderRadius: 1,
                background: isPast ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.bg.elevated,
                opacity: isPast ? (isPlaying ? 1 : 0.7) : 0.4,
                transition: waveformPeaks ? 'height 0.4s ease, background 0.1s, opacity 0.2s' : 'background 0.1s, opacity 0.2s',
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
            {playingSong.composer_name && (
            <div style={{
              color: DESIGN_SYSTEM.colors.text.muted,
              fontSize: DESIGN_SYSTEM.fontSize.xs,
            }}>
              {playingSong.composer_name}
            </div>
            )}
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
