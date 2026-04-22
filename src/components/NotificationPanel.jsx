import { Briefcase, FileText, CheckCircle, XCircle, MessageCircle, Bell, X } from "lucide-react";
import { DESIGN_SYSTEM } from '../constants/designSystem';

function NotificationItem({ notification, onClick, onDismiss }) {
  const n = notification;

  const config = {
    new_opportunity: { icon: <Briefcase size={16} />, color: DESIGN_SYSTEM.colors.brand.purple, page: 'opportunities' },
    submission_received: { icon: <FileText size={16} />, color: DESIGN_SYSTEM.colors.brand.primary, page: 'responses' },
    submission_shortlisted: { icon: <CheckCircle size={16} />, color: DESIGN_SYSTEM.colors.brand.primary, page: 'opportunities' },
    submission_rejected: { icon: <XCircle size={16} />, color: DESIGN_SYSTEM.colors.accent.red, page: 'opportunities' },
    new_message: { icon: <MessageCircle size={16} />, color: DESIGN_SYSTEM.colors.brand.blue, page: 'messages' },
  }[n.type] || { icon: <Bell size={16} />, color: DESIGN_SYSTEM.colors.text.muted, page: 'dashboard' };

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div
      onClick={() => onClick(n, config.page)}
      style={{
        display: 'flex', gap: 12, padding: '12px 16px', cursor: 'pointer',
        background: n.is_read ? 'transparent' : `${DESIGN_SYSTEM.colors.brand.primary}08`,
        borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        transition: `background ${DESIGN_SYSTEM.transition.fast}`,
      }}
      onMouseEnter={e => e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover}
      onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : `${DESIGN_SYSTEM.colors.brand.primary}08`}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: `${config.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: config.color, flexShrink: 0,
      }}>
        {config.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: n.is_read ? 400 : 600,
          color: DESIGN_SYSTEM.colors.text.primary, marginBottom: 2, lineHeight: 1.3,
        }}>
          {n.title}
        </div>
        {n.body && (
          <div style={{
            fontSize: 12, color: DESIGN_SYSTEM.colors.text.secondary, lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {n.body}
          </div>
        )}
        <div style={{ fontSize: 11, color: DESIGN_SYSTEM.colors.text.muted, marginTop: 4 }}>
          {timeAgo(n.created_at)}
        </div>
      </div>
      <button
        aria-label="Dismiss notification"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(n.id);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: DESIGN_SYSTEM.colors.text.secondary,
          cursor: 'pointer',
          padding: 4,
          borderRadius: 6,
          alignSelf: 'flex-start',
          marginTop: 2,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.hover; }}
        onMouseLeave={e => { e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; e.currentTarget.style.background = 'transparent'; }}
        title="Dismiss"
      >
        <X size={14} />
      </button>
      {!n.is_read && (
        <div style={{
          width: 8, height: 8, borderRadius: 4,
          background: DESIGN_SYSTEM.colors.brand.primary,
          flexShrink: 0, marginTop: 4,
        }} />
      )}
    </div>
  );
}

export function NotificationPanel({ notifications, loading, onMarkAllRead, onNotifClick, onDismiss, onClose, sidebarLeft }) {
  const unreadExists = notifications.some(n => !n.is_read);

  return (
    <div style={{
      position: 'fixed',
      left: sidebarLeft ?? 248,
      bottom: 16,
      width: 360,
      maxHeight: 'calc(100vh - 80px)',
      background: DESIGN_SYSTEM.colors.bg.card,
      border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
      borderRadius: DESIGN_SYSTEM.radius.md,
      boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
      zIndex: 2000, display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      animation: 'notifSlideIn 0.18s ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
      }}>
        <span style={{
          fontSize: DESIGN_SYSTEM.fontSize.lg, fontWeight: DESIGN_SYSTEM.fontWeight.semibold,
          color: DESIGN_SYSTEM.colors.text.primary,
        }}>Notifications</span>
        {unreadExists && (
          <button onClick={onMarkAllRead} style={{
            background: 'transparent', border: 'none',
            color: DESIGN_SYSTEM.colors.brand.primary,
            fontSize: DESIGN_SYSTEM.fontSize.xs, fontWeight: DESIGN_SYSTEM.fontWeight.medium,
            cursor: 'pointer', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            Mark all as read
          </button>
        )}
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: DESIGN_SYSTEM.colors.text.muted }}>
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Bell size={32} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, marginBottom: 4 }}>
              No notifications yet
            </p>
            <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 11 }}>
              You'll be notified about opportunities, messages, and more
            </p>
          </div>
        ) : (
          notifications.map(notif => (
            <NotificationItem key={notif.id} notification={notif} onClick={onNotifClick} onDismiss={onDismiss} />
          ))
        )}
      </div>
    </div>
  );
}
