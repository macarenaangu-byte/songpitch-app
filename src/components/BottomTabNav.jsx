import { useState } from 'react';
import { TrendingUp, Music, MessageCircle, Briefcase, User, Users, FileText, BookOpen, MoreHorizontal, X, MessageSquare, Search } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';

function getPrimaryTabs(accountType, badgeCounts) {
  if (accountType === 'music_executive') {
    return [
      { id: 'dashboard',     label: 'Home',      icon: <TrendingUp size={20} /> },
      { id: 'responses',     label: 'Responses', icon: <FileText size={20} />,      badge: badgeCounts.responses },
      { id: 'messages',      label: 'Messages',  icon: <MessageCircle size={20} />, badge: badgeCounts.messages },
      { id: 'opportunities', label: 'Opps',      icon: <Briefcase size={20} />,     badge: badgeCounts.opportunities },
    ];
  }
  if (accountType === 'admin') {
    return [
      { id: 'dashboard',       label: 'Home',     icon: <TrendingUp size={20} /> },
      { id: 'admin-dashboard', label: 'Admin',    icon: <Users size={20} /> },
      { id: 'messages',        label: 'Messages', icon: <MessageCircle size={20} />, badge: badgeCounts.messages },
      { id: 'opportunities',   label: 'Opps',     icon: <Briefcase size={20} />,     badge: badgeCounts.opportunities },
    ];
  }
  // Composer (default)
  return [
    { id: 'dashboard',     label: 'Home',      icon: <TrendingUp size={20} /> },
    { id: 'portfolio',     label: 'Portfolio', icon: <Music size={20} /> },
    { id: 'messages',      label: 'Messages',  icon: <MessageCircle size={20} />, badge: badgeCounts.messages },
    { id: 'opportunities', label: 'Opps',      icon: <Briefcase size={20} />,     badge: badgeCounts.opportunities },
  ];
}

function getMoreItems(accountType) {
  const common = [
    { id: 'profile',            label: 'My Profile',       icon: <User size={20} /> },
    { id: 'contract-revision',  label: 'Contract Review',  icon: <BookOpen size={20} /> },
    { id: 'support',            label: 'Chat with Support',icon: <MessageSquare size={20} /> },
  ];

  if (accountType === 'music_executive') {
    return [
      { id: 'roster',   label: 'Composer Roster', icon: <Users size={20} /> },
      { id: 'catalog',  label: 'Search Catalog',  icon: <Search size={20} /> },
      ...common,
    ];
  }
  if (accountType === 'admin') {
    return [
      { id: 'roster',  label: 'Composer Roster', icon: <Users size={20} /> },
      { id: 'catalog', label: 'Search Catalog',  icon: <Search size={20} /> },
      { id: 'splits',  label: 'Split Generator', icon: <FileText size={20} /> },
      ...common,
    ];
  }
  // Composer
  return [
    { id: 'roster',  label: 'Composer Roster', icon: <Users size={20} /> },
    { id: 'splits',  label: 'Split Generator', icon: <FileText size={20} /> },
    ...common,
  ];
}

export function BottomTabNav({ page, accountType, badgeCounts, onNavigate, audioPlayerActive, onSupportOpen }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryTabs = getPrimaryTabs(accountType, badgeCounts || {});
  const moreItems   = getMoreItems(accountType);
  const bottomOffset = audioPlayerActive ? 70 : 0;

  // Is current page in the "more" drawer?
  const morePageIds = moreItems.map(i => i.id);
  const moreIsActive = morePageIds.includes(page);

  function handleNavigate(id) {
    setMoreOpen(false);
    if (id === 'support') {
      onSupportOpen?.();
    } else {
      onNavigate(id);
    }
  }

  return (
    <>
      {/* Backdrop */}
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1090,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
      )}

      {/* Slide-up "More" drawer */}
      {moreOpen && (
        <div style={{
          position: 'fixed',
          left: 0, right: 0,
          bottom: 60 + bottomOffset,
          zIndex: 1095,
          background: DESIGN_SYSTEM.colors.bg.secondary,
          borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
          borderRadius: '16px 16px 0 0',
          padding: '12px 0 8px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: DESIGN_SYSTEM.colors.border.light, margin: '0 auto 12px' }} />

          {moreItems.map(item => {
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 24px',
                  background: isActive ? `${DESIGN_SYSTEM.colors.brand.primary}15` : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? `3px solid ${DESIGN_SYSTEM.colors.brand.primary}` : '3px solid transparent',
                  cursor: 'pointer',
                  color: isActive ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary,
                  fontFamily: DESIGN_SYSTEM.font.body,
                  fontSize: 15,
                  fontWeight: isActive ? 700 : 500,
                  textAlign: 'left',
                }}
              >
                <span style={{ color: isActive ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.muted }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom tab bar */}
      <nav
        aria-label="Mobile bottom navigation"
        style={{
          position: 'fixed',
          bottom: bottomOffset,
          left: 0,
          right: 0,
          minHeight: 60,
          height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
          background: DESIGN_SYSTEM.colors.bg.secondary,
          borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
          display: 'flex',
          alignItems: 'flex-start',
          zIndex: 1100,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {primaryTabs.map(tab => {
          const isActive = page === tab.id;
          return (
            <button
              key={tab.id}
              aria-label={tab.label}
              onClick={() => { setMoreOpen(false); onNavigate(tab.id); }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                background: 'transparent',
                border: 'none',
                borderTop: isActive
                  ? `2px solid ${DESIGN_SYSTEM.colors.brand.primary}`
                  : '2px solid transparent',
                cursor: 'pointer',
                position: 'relative',
                color: isActive ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.tertiary,
                transition: 'color 0.15s',
                fontFamily: DESIGN_SYSTEM.font.body,
                padding: '6px 0 4px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {tab.icon}
                {tab.badge > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -7,
                    background: DESIGN_SYSTEM.colors.brand.primary,
                    color: '#0F0F13', fontSize: 9, fontWeight: 700,
                    minWidth: 15, height: 15, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', lineHeight: 1,
                  }}>
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, lineHeight: 1 }}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More tab */}
        <button
          aria-label="More"
          onClick={() => setMoreOpen(o => !o)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            background: 'transparent',
            border: 'none',
            borderTop: (moreIsActive || moreOpen)
              ? `2px solid ${DESIGN_SYSTEM.colors.brand.primary}`
              : '2px solid transparent',
            cursor: 'pointer',
            color: (moreIsActive || moreOpen) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.tertiary,
            transition: 'color 0.15s',
            fontFamily: DESIGN_SYSTEM.font.body,
            padding: '6px 0 4px',
          }}
        >
          {moreOpen
            ? <X size={20} />
            : <MoreHorizontal size={20} />
          }
          <span style={{ fontSize: 10, fontWeight: (moreIsActive || moreOpen) ? 600 : 400, lineHeight: 1 }}>
            More
          </span>
        </button>
      </nav>
    </>
  );
}
