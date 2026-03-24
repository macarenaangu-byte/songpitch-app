import { PROFILE_BADGES } from '../constants/genres';

export function ProfileBadges({ user }) {
  // Derive badges from user data
  const badges = [];

  // All alpha users get this badge except founders/admins
  if (user.account_type !== 'admin') {
    badges.push('alpha_tester');
  }

  // Profile completion badges — milestone tiers
  const isComposer = user.account_type === 'composer';
  const fields = isComposer
    ? [user.bio, user.location, user.avatar_url, user.pro_name || user.pro, user.role, Array.isArray(user.genres) && user.genres.length > 0, user.instruments]
    : [user.bio, user.location, user.avatar_url, user.company, user.job_title, Array.isArray(user.genres) && user.genres.length > 0];
  const filled = fields.filter(Boolean).length;
  const completionPct = Math.round((filled / fields.length) * 100);
  if (filled >= fields.length) {
    badges.push(isComposer ? 'verified_composer' : 'verified_exec');
  } else if (completionPct >= 50) {
    badges.push('rising_star');
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
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            <span style={{ fontSize: 12 }}>{def.icon}</span> {def.label}
          </span>
        );
      })}
    </div>
  );
}
