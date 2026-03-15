import { useState, useEffect, useCallback } from 'react';
import { Users, Music, Briefcase, MessageCircle, FileText, Search, Eye, EyeOff, Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { friendlyError, insertNotification } from '../lib/utils';
import { StatCard } from '../components/StatCard';
import { MiniChart, HorizontalBarChart } from '../components/MiniChart';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';

const PAGE_SIZE = 25;

export function AdminDashboardPage({ stats, userProfile, onNavigate, onViewProfile, isMobile = false, analytics }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [recentOpps, setRecentOpps] = useState([]);
  const [pendingSongs, setPendingSongs] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [suspendingId, setSuspendingId] = useState(null);

  const loadUsers = useCallback(async (page = 0, append = false) => {
    setUsersLoading(true);
    try {
      let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .neq('account_type', 'admin')
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('account_type', typeFilter);
      }

      if (searchQuery.trim()) {
        query = query.or(`first_name.ilike.%${searchQuery.trim()}%,last_name.ilike.%${searchQuery.trim()}%`);
      }

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      setUsers(prev => append ? [...prev, ...(data || [])] : (data || []));
      setUsersTotal(count || 0);
      setUsersPage(page);
    } catch (err) {
      showToast(friendlyError(err), 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [searchQuery, typeFilter]);

  const loadContent = useCallback(async () => {
    setContentLoading(true);
    try {
      const [oppsRes, songsRes] = await Promise.all([
        supabase
          .from('opportunities')
          .select('id, title, status, created_at, creator_id, user_profiles!opportunities_creator_id_fkey(first_name, last_name)')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('songs')
          .select('id, title, verification_status, created_at, user_profile_id, user_profiles!songs_user_profile_id_fkey(first_name, last_name)')
          .eq('verification_status', 'pending_splits')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (oppsRes.error) throw oppsRes.error;
      if (songsRes.error) throw songsRes.error;

      setRecentOpps(oppsRes.data || []);
      setPendingSongs(songsRes.data || []);
    } catch (err) {
      console.error('Content load failed:', err);
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(0); }, [loadUsers]);
  useEffect(() => { loadContent(); }, [loadContent]);

  const handleSuspendToggle = async (user) => {
    const newStatus = !user.is_deleted;
    setSuspendingId(user.id);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_deleted: newStatus })
        .eq('id', user.id);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_deleted: newStatus } : u));
      showToast(newStatus ? 'User suspended' : 'User reactivated', 'success');
    } catch (err) {
      showToast(friendlyError(err), 'error');
    } finally {
      setSuspendingId(null);
    }
  };

  const [verifyingId, setVerifyingId] = useState(null);

  const handleVerifySong = async (song, action) => {
    setVerifyingId(song.id);
    try {
      const newStatus = action === 'approve' ? 'verified' : 'rejected';
      const { error } = await supabase
        .from('songs')
        .update({ verification_status: newStatus })
        .eq('id', song.id);
      if (error) throw error;

      // Notify the composer
      await insertNotification(
        song.user_profile_id,
        action === 'approve' ? 'song_approved' : 'song_rejected',
        action === 'approve' ? 'Song Approved' : 'Song Rejected',
        action === 'approve'
          ? `Your song "${song.title}" has been verified and is now visible in the catalog.`
          : `Your song "${song.title}" was not approved. Please review and re-upload if needed.`,
        { song_id: song.id, song_title: song.title }
      );

      setPendingSongs(prev => prev.filter(s => s.id !== song.id));
      showToast(action === 'approve' ? 'Song approved!' : 'Song rejected', action === 'approve' ? 'success' : 'info');
    } catch (err) {
      showToast(friendlyError(err), 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const hasMoreUsers = (usersPage + 1) * PAGE_SIZE < usersTotal;

  const inputStyle = {
    background: DESIGN_SYSTEM.colors.bg.primary,
    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
    borderRadius: 8, padding: '8px 12px',
    color: DESIGN_SYSTEM.colors.text.primary,
    fontSize: 13, fontFamily: "'Outfit', sans-serif",
    outline: 'none',
  };

  const cardStyle = {
    background: DESIGN_SYSTEM.colors.bg.card,
    borderRadius: DESIGN_SYSTEM.radius.lg,
    padding: isMobile ? '16px' : '24px',
    border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '32px 36px', minHeight: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${DESIGN_SYSTEM.colors.brand.purple}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={20} color={DESIGN_SYSTEM.colors.brand.purple} />
        </div>
        <div>
          <h1 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: isMobile ? 24 : 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif", margin: 0 }}>Admin Dashboard</h1>
          <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, margin: 0 }}>Platform overview & management</p>
        </div>
      </div>

      {/* Section 1: Platform Overview Stats */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: DESIGN_SYSTEM.spacing.md, marginBottom: DESIGN_SYSTEM.spacing.lg, flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
        <StatCard icon={<Users size={20} color={DESIGN_SYSTEM.colors.brand.purple} />} label="Total Users" value={stats.users || 0} color={DESIGN_SYSTEM.colors.brand.purple} onClick={() => onNavigate('roster')} />
        <StatCard icon={<Music size={20} color={DESIGN_SYSTEM.colors.brand.primary} />} label="Total Songs" value={stats.songs || 0} color={DESIGN_SYSTEM.colors.brand.primary} onClick={() => onNavigate('catalog')} />
        <StatCard icon={<Briefcase size={20} color={DESIGN_SYSTEM.colors.brand.accent} />} label="Open Opportunities" value={stats.opportunities || 0} color={DESIGN_SYSTEM.colors.brand.accent} onClick={() => onNavigate('opportunities')} />
        <StatCard icon={<MessageCircle size={20} color={DESIGN_SYSTEM.colors.brand.blue} />} label="Conversations" value={stats.conversations || 0} color={DESIGN_SYSTEM.colors.brand.blue} onClick={() => onNavigate('messages')} />
        <StatCard icon={<FileText size={20} color={DESIGN_SYSTEM.colors.accent.amber} />} label="Total Responses" value={stats.totalResponses || 0} color={DESIGN_SYSTEM.colors.accent.amber} onClick={() => onNavigate('responses')} />
      </div>

      {/* Analytics Section */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: DESIGN_SYSTEM.spacing.md, marginBottom: DESIGN_SYSTEM.spacing.lg }}>
          {/* User Signups This Week */}
          {analytics.signupsWeek && (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.lg, padding: '16px 20px', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Signups This Week</span>
                <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{analytics.signupsWeek.reduce((a, b) => a + b, 0)}</span>
              </div>
              <MiniChart data={analytics.signupsWeek} type="line" color={DESIGN_SYSTEM.colors.brand.purple} width={200} height={44} />
            </div>
          )}

          {/* New Songs This Week */}
          {analytics.songsWeek && (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.lg, padding: '16px 20px', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>New Songs This Week</span>
                <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{analytics.songsWeek.reduce((a, b) => a + b, 0)}</span>
              </div>
              <MiniChart data={analytics.songsWeek} type="bar" color={DESIGN_SYSTEM.colors.brand.primary} width={200} height={44} />
            </div>
          )}

          {/* Genre Distribution */}
          {analytics.genreDistribution && analytics.genreDistribution.length > 0 && (
            <div style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: DESIGN_SYSTEM.radius.lg, padding: '16px 20px', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
              <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif", display: 'block', marginBottom: 10 }}>Top Genres</span>
              <HorizontalBarChart items={analytics.genreDistribution.map((g, i) => ({ ...g, color: [DESIGN_SYSTEM.colors.brand.primary, DESIGN_SYSTEM.colors.brand.purple, DESIGN_SYSTEM.colors.brand.accent, DESIGN_SYSTEM.colors.brand.blue, DESIGN_SYSTEM.colors.accent.amber][i % 5] }))} maxWidth={140} />
            </div>
          )}
        </div>
      )}

      {/* Section 2: User Management */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 16 }}>
          <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", margin: 0 }}>
            User Management <span style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, fontWeight: 500 }}>({usersTotal})</span>
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: DESIGN_SYSTEM.colors.text.muted }} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 30, width: isMobile ? '100%' : 200 }}
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="all">All Types</option>
              <option value="composer">Composers</option>
              <option value="music_executive">Executives</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['User', 'Type', 'Location', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={`${u.first_name} ${u.last_name}`} color={u.avatar_color} avatarUrl={u.avatar_url} size={32} />
                      <div>
                        <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{u.first_name} {u.last_name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge color={u.account_type === 'composer' ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.brand.blue}>
                      {u.account_type === 'composer' ? 'Composer' : 'Executive'}
                    </Badge>
                  </td>
                  <td style={{ padding: '10px 12px', color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>{u.location || '—'}</td>
                  <td style={{ padding: '10px 12px', color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, whiteSpace: 'nowrap' }}>{timeAgo(u.created_at)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: u.is_deleted ? `${DESIGN_SYSTEM.colors.accent.red}15` : `${DESIGN_SYSTEM.colors.brand.primary}15`,
                      color: u.is_deleted ? DESIGN_SYSTEM.colors.accent.red : DESIGN_SYSTEM.colors.brand.primary,
                      fontFamily: "'Outfit', sans-serif",
                    }}>
                      {u.is_deleted ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => onViewProfile && onViewProfile(u)}
                        style={{ background: 'none', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: '4px 10px', color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Eye size={12} /> View
                      </button>
                      <button
                        onClick={() => handleSuspendToggle(u)}
                        disabled={suspendingId === u.id}
                        style={{
                          background: 'none', borderRadius: 6, padding: '4px 10px',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                          display: 'flex', alignItems: 'center', gap: 4,
                          border: `1px solid ${u.is_deleted ? DESIGN_SYSTEM.colors.brand.primary + '44' : DESIGN_SYSTEM.colors.accent.red + '44'}`,
                          color: u.is_deleted ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.accent.red,
                          opacity: suspendingId === u.id ? 0.5 : 1,
                        }}
                      >
                        {u.is_deleted ? <><Eye size={12} /> Reactivate</> : <><EyeOff size={12} /> Suspend</>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {usersLoading && users.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13 }}>Loading users...</div>
        )}

        {!usersLoading && users.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13 }}>No users found</div>
        )}

        {hasMoreUsers && (
          <button
            onClick={() => loadUsers(usersPage + 1, true)}
            disabled={usersLoading}
            style={{
              display: 'block', width: '100%', marginTop: 12, padding: '10px',
              background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 8, color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
            }}
          >
            {usersLoading ? 'Loading...' : `Load More (${usersTotal - users.length} remaining)`}
          </button>
        )}
      </div>

      {/* Section 3: Content Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: DESIGN_SYSTEM.spacing.md }}>
        {/* Recent Opportunities */}
        <div style={cardStyle}>
          <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={16} color={DESIGN_SYSTEM.colors.brand.accent} /> Recent Opportunities
          </h3>
          {contentLoading ? (
            <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, padding: 16, textAlign: 'center' }}>Loading...</div>
          ) : recentOpps.length === 0 ? (
            <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, padding: 16, textAlign: 'center' }}>No opportunities yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentOpps.map(opp => (
                <button
                  key={opp.id}
                  onClick={() => onNavigate('opportunities')}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'none', border: 'none', padding: '8px 4px', cursor: 'pointer',
                    borderRadius: 6, fontFamily: "'Outfit', sans-serif", textAlign: 'left', width: '100%',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.title}</div>
                    <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11 }}>
                      {opp.user_profiles?.first_name} {opp.user_profiles?.last_name} · {timeAgo(opp.created_at)}
                    </div>
                  </div>
                  <Badge color={opp.status === 'Open' ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.muted}>{opp.status || 'Open'}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pending Verification Songs */}
        <div style={cardStyle}>
          <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} color={DESIGN_SYSTEM.colors.accent.amber} /> Pending Verification
          </h3>
          {contentLoading ? (
            <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, padding: 16, textAlign: 'center' }}>Loading...</div>
          ) : pendingSongs.length === 0 ? (
            <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, padding: 16, textAlign: 'center' }}>No songs pending verification</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pendingSongs.map(song => (
                <div
                  key={song.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 4px', borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</div>
                    <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11 }}>
                      {song.user_profiles?.first_name} {song.user_profiles?.last_name} · {timeAgo(song.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => handleVerifySong(song, 'approve')}
                      disabled={verifyingId === song.id}
                      title="Approve"
                      style={{ background: `${DESIGN_SYSTEM.colors.brand.primary}18`, border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}44`, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", color: DESIGN_SYSTEM.colors.brand.primary, display: 'flex', alignItems: 'center', gap: 4, opacity: verifyingId === song.id ? 0.5 : 1 }}
                    >
                      <CheckCircle size={12} /> Approve
                    </button>
                    <button
                      onClick={() => handleVerifySong(song, 'reject')}
                      disabled={verifyingId === song.id}
                      title="Reject"
                      style={{ background: `${DESIGN_SYSTEM.colors.accent.red}15`, border: `1px solid ${DESIGN_SYSTEM.colors.accent.red}44`, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", color: DESIGN_SYSTEM.colors.accent.red, display: 'flex', alignItems: 'center', gap: 4, opacity: verifyingId === song.id ? 0.5 : 1 }}
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
