import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Search, Users, Music, MessageCircle, User, ChevronRight, ChevronLeft, Briefcase, FileText, TrendingUp, Bell, Menu, Shield, BookOpen, Scale, AlertTriangle } from "lucide-react";
// ─── Extracted modules ──────────────────────────────────────────────────────
import { DESIGN_SYSTEM } from './constants/designSystem';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import { showToast } from './utils/toast';
import { friendlyError } from './lib/utils';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import {
  isPushSupported,
  registerServiceWorker,
  requestPermission,
  subscribeAndSave,
  unsubscribeAndRemove,
} from './services/pushNotifications';

// ─── Components ─────────────────────────────────────────────────────────────
import { Avatar } from './components/Avatar';
import { Badge } from './components/Badge';
import { NowPlayingBar } from './components/NowPlayingBar';
import { NotificationPanel } from './components/NotificationPanel';
import CommandPalette from './components/CommandPalette';

// ─── Pages (eagerly loaded — needed immediately) ────────────────────────────
import { AuthPage } from './pages/AuthPage';
import { AccountSetupPage } from './pages/AccountSetupPage';
import { LandingPage } from './pages/LandingPage';

// ─── Pages (lazy loaded — split into separate chunks) ───────────────────────
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const DMCAPage = lazy(() => import('./pages/DMCAPage').then(m => ({ default: m.DMCAPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const RosterPage = lazy(() => import('./pages/RosterPage').then(m => ({ default: m.RosterPage })));
const CatalogPage = lazy(() => import('./pages/CatalogPage').then(m => ({ default: m.CatalogPage })));
const OpportunitiesPage = lazy(() => import('./pages/OpportunitiesPage').then(m => ({ default: m.OpportunitiesPage })));
const ResponsesPage = lazy(() => import('./pages/ResponsesPage').then(m => ({ default: m.ResponsesPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').then(m => ({ default: m.PortfolioPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ViewProfilePage = lazy(() => import('./pages/ViewProfilePage').then(m => ({ default: m.ViewProfilePage })));
const SplitGenerator = lazy(() => import('./pages/SplitGenerator/SplitGenerator'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const DealAnalyzerPage = lazy(() => import('./pages/DealAnalyzerPage').then(m => ({ default: m.DealAnalyzerPage })));
const ContractRevisionPage = lazy(() => import('./pages/ContractRevisionPage').then(m => ({ default: m.ContractRevisionPage })));


// ═════════════════════════════════════════════════════════════════════════════
// MAIN APP SHELL
// ═════════════════════════════════════════════════════════════════════════════

// ─── Hash-based page routing ────────────────────────────────────────────────
const VALID_PAGES = new Set([
  'dashboard', 'roster', 'catalog', 'opportunities', 'responses',
  'messages', 'portfolio', 'profile', 'splits', 'admin-dashboard',
  'deal-analyzer', 'contract-revision',
]);
const LEGAL_PAGES = new Set(['privacy', 'terms', 'dmca']);

function getPageFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  return VALID_PAGES.has(hash) ? hash : null;
}

function getLegalPageFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  return LEGAL_PAGES.has(hash) ? hash : null;
}

export default function SongPitch() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [savingRole, setSavingRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);  // NEW: Show landing page first
  const [legalPage, setLegalPage] = useState(() => getLegalPageFromHash()); // 'terms', 'privacy', 'dmca', or null
  const [page, setPage] = useState(() => getPageFromHash() || "dashboard");
  const [deleteAccountModal, setDeleteAccountModal] = useState({ open: false, typed: '', loading: false });
  const [activeMessageConversationId, setActiveMessageConversationId] = useState(null);
  const [stats, setStats] = useState({ songs: 0, users: 0, opportunities: 0, conversations: 0, profileViews: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [badgeCounts, setBadgeCounts] = useState({ messages: 0, responses: 0, opportunities: 0 });
  const [viewingProfile, setViewingProfile] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Notification system
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifPanelRef = useRef(null);
  const [supportTargetUserId, setSupportTargetUserId] = useState(null);
  const [supportOpenToken, setSupportOpenToken] = useState(0);
  const historyReadyRef = useRef(false);
  const suppressHistoryPushRef = useRef(false);
  const lastHistoryKeyRef = useRef('');
  const pageRef = useRef(page);
  const activeConversationRef = useRef(activeMessageConversationId);
  const skipProfileLoadRef = useRef(false); // prevent race condition after signup
  const stayOnAuthRef = useRef(false); // prevent !session effect from redirecting to landing after a forced signOut
  const oauthInProgressRef = useRef( // true while OAuth callback hash is being processed by Supabase
    window.location.hash.includes('access_token') ||
    new URLSearchParams(window.location.search).has('code')
  );
  const legalPageFromHashRef = useRef(!!getLegalPageFromHash()); // true if legal page was loaded from URL
  const suppressLegalPushRef = useRef(false); // prevent double history push on popstate
  const [authError, setAuthError] = useState(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // Global audio player - shared across all pages
  const audioPlayer = useAudioPlayer();

  useEffect(() => {
    if (!session || !userProfile) {
      historyReadyRef.current = false;
      lastHistoryKeyRef.current = '';
    }
  }, [session, userProfile]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    activeConversationRef.current = activeMessageConversationId;
  }, [activeMessageConversationId]);

  // ⌘K / Ctrl+K — open command palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Sync legal page state ↔ URL hash
  useEffect(() => {
    if (legalPage && LEGAL_PAGES.has(legalPage)) {
      if (legalPageFromHashRef.current) {
        legalPageFromHashRef.current = false;
        window.history.replaceState({ spLegal: true, legalPage }, '', `#${legalPage}`);
      } else if (suppressLegalPushRef.current) {
        suppressLegalPushRef.current = false;
      } else {
        window.history.pushState({ spLegal: true, legalPage }, '', `#${legalPage}`);
      }
    } else if (!legalPage) {
      // Cleared legal page → clean up the URL hash (only if it's still a legal hash)
      if (getLegalPageFromHash()) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [legalPage]);

  // Always show Landing first on a fresh app load. Mark this history entry as landing.
  // IMPORTANT: Do NOT strip the URL if it contains an OAuth callback token —
  // Supabase needs to read #access_token from the hash before we clean the URL.
  useEffect(() => {
    const hasOAuthCallback =
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('error_description') ||
      new URLSearchParams(window.location.search).has('code');
    setShowLanding(true);
    if (!hasOAuthCallback) {
      window.history.replaceState({ spLanding: true }, '', window.location.pathname);
    }
  }, []);

  // Safety reset: when unauthenticated, default back to Landing first.
  // Skip when stayOnAuthRef is set — we intentionally signed out to show an error on AuthPage.
  // Skip when oauthInProgressRef is set — SIGNED_IN will arrive shortly with the real session.
  useEffect(() => {
    if (!session) {
      if (oauthInProgressRef.current) return; // OAuth exchange in flight — wait for SIGNED_IN
      if (stayOnAuthRef.current) {
        stayOnAuthRef.current = false;
        return;
      }
      setShowLanding(true);
    } else {
      oauthInProgressRef.current = false; // Session arrived — OAuth complete
    }
  }, [session]);

  useEffect(() => {
    if (!session || !userProfile) return;

    const key = `${page}|${viewingProfile?.id || ''}`;
    const state = {
      spApp: true,
      page,
      viewingProfile: viewingProfile || null,
    };
    const targetHash = `#${page}`;

    if (!historyReadyRef.current) {
      window.history.replaceState(state, '', targetHash);
      historyReadyRef.current = true;
      lastHistoryKeyRef.current = key;
      return;
    }

    if (suppressHistoryPushRef.current) {
      suppressHistoryPushRef.current = false;
      lastHistoryKeyRef.current = key;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(state, '', targetHash);
      }
      return;
    }

    if (key === lastHistoryKeyRef.current) return;

    window.history.pushState(state, '', targetHash);
    lastHistoryKeyRef.current = key;
  }, [page, viewingProfile, session, userProfile]);

  useEffect(() => {
    const handlePopState = (event) => {
      // Going back to landing page
      if (event.state?.spLanding) {
        setShowLanding(true);
        return;
      }

      // Going back to auth (from app pages)
      if (event.state?.spAuth) {
        setShowLanding(false);
        return;
      }

      // Navigating forward to a legal page
      if (event.state?.spLegal) {
        suppressLegalPushRef.current = true;
        setLegalPage(event.state.legalPage);
        return;
      }

      // If we're currently on a legal page and going back → clear it
      const currentLegal = getLegalPageFromHash();
      if (currentLegal || legalPage) {
        suppressLegalPushRef.current = true;
        setLegalPage(null);
        // Don't return — let the hash fallback below handle the next page
        if (!event.state?.spApp && !getPageFromHash()) return;
      }

      if (event.state?.spApp) {
        suppressHistoryPushRef.current = true;
        setPage(event.state.page || 'dashboard');
        setViewingProfile(event.state.viewingProfile || null);
        setShowNotifPanel(false);
        return;
      }

      // Fallback: read hash
      const hashPage = getPageFromHash();
      if (hashPage) {
        suppressHistoryPushRef.current = true;
        setPage(hashPage);
        setViewingProfile(null);
        setShowNotifPanel(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [legalPage]);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isMobileView) {
      setIsMobileMenuOpen(false);
    }
  }, [page, viewingProfile, isMobileView]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setShowLanding(false);
        if (skipProfileLoadRef.current) {
          // Signup just set the profile directly — skip redundant query
          skipProfileLoadRef.current = false;
          setLoading(false);
        } else {
          loadUserProfile(session.user);
        }
      } else if (!session) {
        setUserProfile(null);
        setNeedsOnboarding(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ─── Inactivity session timeout (24h) ────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const INACTIVITY_MS = 24 * 60 * 60 * 1000; // 24 hours
    const WARN_MS = 5 * 60 * 1000; // 5 min to respond before auto sign-out
    let inactivityTimer;
    let warnTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warnTimer);
      setShowSessionWarning(false);
      inactivityTimer = setTimeout(() => {
        setShowSessionWarning(true);
        warnTimer = setTimeout(async () => {
          await supabase.auth.signOut();
        }, WARN_MS);
      }, INACTIVITY_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warnTimer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [session]);

  useEffect(() => {
    if (userProfile) {
      loadStats();
      loadSidebarBadges();
      loadAnalytics();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile) return;
    loadSidebarBadges();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ─── Web Push: register service worker + subscribe on login ─────────────────
  useEffect(() => {
    if (!userProfile) return;
    if (!isPushSupported()) return;

    (async () => {
      await registerServiceWorker();
      const permission = await requestPermission();
      if (permission === 'granted') {
        await subscribeAndSave(supabase, userProfile.id);
      }
    })();
  }, [userProfile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Notification system: load + realtime subscription ─────────────────────
  const loadNotifications = async () => {
    if (!userProfile) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  useEffect(() => {
    if (!userProfile) return;
    loadNotifications();

    const channel = supabase
      .channel(`notifications:${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`
        },
        async (payload) => {
          const incoming = payload.new;
          const isNewMessageNotif = incoming?.type === 'new_message';
          const isMessagesPage = pageRef.current === 'messages';
          const incomingConversationId = incoming?.metadata?.conversation_id;
          const sameActiveConversation = isNewMessageNotif &&
            isMessagesPage &&
            activeConversationRef.current &&
            String(incomingConversationId) === String(activeConversationRef.current);

          if (sameActiveConversation) {
            setNotifications(prev => [{ ...incoming, is_read: true }, ...prev]);
            try {
              await supabase.from('notifications').update({ is_read: true }).eq('id', incoming.id);
            } catch (_) {
              // non-blocking
            }
            return;
          }

          setNotifications(prev => [incoming, ...prev]);
          if (!incoming?.is_read) {
            setUnreadCount(prev => prev + 1);
          }

          // While actively in the messaging area, skip noisy toast spam for new message notifications.
          if (!(isMessagesPage && isNewMessageNotif)) {
            showToast.info(incoming.title);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  const handleMarkRead = async (notifId) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userProfile.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDismiss = async (notificationId) => {
    const target = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (target && !target.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userProfile.id);
      if (error) throw error;
    } catch (err) {
      // Revert local state if DB delete fails
      if (target) {
        setNotifications(prev => [target, ...prev]);
        if (!target.is_read) {
          setUnreadCount(prev => prev + 1);
        }
      }
      showToast.error(friendlyError(err));
    }
  };

  const handleNotifClick = (notification, targetPage) => {
    if (!notification.is_read) handleMarkRead(notification.id);
    setPage(targetPage);
    setShowNotifPanel(false);
  };

  // Click-outside to close notification panel
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const loadUserProfile = async (authUserOrId) => {
    const authUser = typeof authUserOrId === 'string' ? { id: authUserOrId } : authUserOrId;
    const userId = authUser?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*, composers(*)')
        .eq('user_id', userId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Check if this is a newly email-confirmed user or an OAuth user whose profile hasn't been created yet
          const pendingEmail = localStorage.getItem('sp_pending_signup_email');
          const isOAuthUser = authUser?.app_metadata?.provider && authUser.app_metadata.provider !== 'email';
          // Also detect users who verified email on a different device (no localStorage flag but email is confirmed)
          const emailConfirmedAt = authUser?.email_confirmed_at;
          const isNewlyConfirmed = emailConfirmedAt && (Date.now() - new Date(emailConfirmedAt).getTime()) < 15 * 60 * 1000; // within 15 min
          if (pendingEmail || isOAuthUser || isNewlyConfirmed) {
            localStorage.removeItem('sp_pending_signup_email');
            setUserProfile(null);
            setShowLanding(false); // Route to AccountSetupPage
            return;
          }
          // Auth account exists but no profile row — sign out and show error on AuthPage
          setAuthError("No account found for this email. Please create an account first.");
          stayOnAuthRef.current = true;
          setUserProfile(null);
          await supabase.auth.signOut();
          return;
        } else if (error.code === '42501' || String(error.message).toLowerCase().includes('403') || String(error.message).toLowerCase().includes('jwt')) {
          // 403 / RLS / JWT not ready — session expired or not yet set, sign out cleanly
          stayOnAuthRef.current = true;
          setAuthError("Session error. Please sign in again.");
          setUserProfile(null);
          setNeedsOnboarding(false);
          await supabase.auth.signOut();
        } else {
          throw error;
        }
      } else {
        const hasValidRole = !!(data?.account_type || data?.role);

        setUserProfile(data);
        if (hasValidRole) {
          setNeedsOnboarding(false);
          if (!getPageFromHash()) {
            setPage('dashboard');
          }
        } else {
          setNeedsOnboarding(true);
        }
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSidebarBadges = async () => {
    if (!userProfile) return;
    try {
      // Unread messages for current user: messages in user's conversations from other senders where is_read=false
      const { data: conversationRows, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${userProfile.id},user2_id.eq.${userProfile.id}`);
      if (convError) throw convError;

      const conversationIds = (conversationRows || []).map(c => c.id);
      let unreadMessages = 0;
      if (conversationIds.length > 0) {
        const { count: unreadCount, error: unreadError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', userProfile.id)
          .eq('is_read', false);
        if (unreadError) throw unreadError;
        unreadMessages = unreadCount || 0;
      }

      // Unread opportunities for composers: open opportunities minus viewed opportunities
      let unreadOpportunities = 0;
      if (userProfile.account_type === 'composer') {
        const { data: openOpps, error: oppError } = await supabase
          .from('opportunities')
          .select('id')
          .eq('status', 'Open');
        if (oppError) throw oppError;

        const openIds = (openOpps || []).map(o => o.id);
        if (openIds.length > 0) {
          const { data: viewedRows, error: viewedError } = await supabase
            .from('viewed_opportunities')
            .select('opportunity_id')
            .eq('user_id', userProfile.id)
            .in('opportunity_id', openIds);
          if (viewedError) throw viewedError;

          const viewedSet = new Set((viewedRows || []).map(v => v.opportunity_id));
          unreadOpportunities = Math.max(0, openIds.length - viewedSet.size);
        }
      }

      setBadgeCounts(prev => ({
        ...prev,
        messages: unreadMessages,
        opportunities: unreadOpportunities,
      }));
    } catch (err) {
      console.error('Error loading sidebar badges:', err);
    }
  };

  const loadStats = async () => {
    try {
      const isExec = userProfile?.account_type === 'music_executive';
      const isComposer = userProfile?.account_type === 'composer';
      const isAdminRole = userProfile?.account_type === 'admin';

      // Base queries (platform totals + conversations)
      const queries = [
        supabase.from('songs').select('id', { count: 'exact', head: true }),
        isAdminRole
          ? supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_deleted', false).neq('account_type', 'admin')
          : supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_deleted', false).neq('account_type', userProfile?.account_type || ''),
        supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('status', 'Open'),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).or(`user1_id.eq.${userProfile.id},user2_id.eq.${userProfile.id}`),
      ];

      // Role-specific queries
      if (isComposer) {
        queries.push(
          supabase.from('songs').select('id', { count: 'exact', head: true }).eq('composer_id', userProfile.id),
          supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('viewed_profile_id', userProfile.id)
        );
      }
      if (isExec || isAdminRole) {
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

      const roleStartIdx = 4;

      if (isComposer) {
        newStats.mySongs = results[roleStartIdx]?.count || 0;
        newStats.profileViews = results[roleStartIdx + 1]?.count || 0;
      }

      if (isExec || isAdminRole) {
        const execOpps = results[roleStartIdx]?.data || [];
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
      setBadgeCounts(prev => ({
        messages: prev.messages,
        responses: (isExec || isAdminRole) ? (newStats.totalResponses || 0) : 0,
        opportunities: prev.opportunities,
      }));
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const loadAnalytics = async () => {
    if (!userProfile) return;
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const weekAgoISO = weekAgo.toISOString();
      const isAdmin = userProfile.account_type === 'admin';
      const isComposer = userProfile.account_type === 'composer';
      const isExec = userProfile.account_type === 'music_executive';
      const result = {};

      // Helper: group rows by day of week (returns array of 7 counts)
      const groupByDay = (rows, dateField = 'created_at') => {
        const days = Array(7).fill(0);
        rows.forEach(r => {
          const d = new Date(r[dateField]);
          const dayIndex = Math.floor((d.getTime() - weekAgo.getTime()) / 86400000);
          if (dayIndex >= 0 && dayIndex < 7) days[dayIndex]++;
        });
        return days;
      };

      if (isComposer || isAdmin) {
        // Profile views this week
        const { data: views } = await supabase
          .from('profile_views')
          .select('created_at')
          .eq('viewed_profile_id', userProfile.id)
          .gte('created_at', weekAgoISO);
        result.profileViewsWeek = groupByDay(views || []);

        // Recent viewers (last 8, for "who viewed my profile")
        const { data: recentViewData } = await supabase
          .from('profile_views')
          .select('viewer_user_id, created_at')
          .eq('viewed_profile_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(8);
        if (recentViewData && recentViewData.length > 0) {
          const viewerIds = [...new Set(recentViewData.map(v => v.viewer_user_id).filter(Boolean))];
          const { data: viewerProfiles } = await supabase
            .from('user_profiles')
            .select('id, user_id, first_name, last_name, account_type, avatar_color')
            .in('user_id', viewerIds);
          result.recentViewers = recentViewData
            .filter(v => v.viewer_user_id)
            .map(v => ({ ...v, profile: (viewerProfiles || []).find(p => p.user_id === v.viewer_user_id) }))
            .filter(v => v.profile);
        } else {
          result.recentViewers = [];
        }
      }

      if (isExec || isAdmin) {
        // Responses this week (to their opportunities)
        const { data: myOpps } = await supabase
          .from('opportunities')
          .select('id')
          .eq('creator_id', userProfile.id);
        const oppIds = (myOpps || []).map(o => o.id);
        if (oppIds.length > 0) {
          const { data: resps } = await supabase
            .from('responses')
            .select('created_at')
            .in('opportunity_id', oppIds)
            .gte('created_at', weekAgoISO);
          result.responsesWeek = groupByDay(resps || []);
        } else {
          result.responsesWeek = Array(7).fill(0);
        }
      }

      if (isAdmin) {
        // User signups this week
        const { data: newUsers } = await supabase
          .from('user_profiles')
          .select('created_at')
          .gte('created_at', weekAgoISO)
          .neq('account_type', 'admin');
        result.signupsWeek = groupByDay(newUsers || []);

        // Genre distribution across all songs
        const { data: allSongs } = await supabase
          .from('songs')
          .select('genre');
        const genreCounts = {};
        (allSongs || []).forEach(s => {
          if (s.genre) {
            genreCounts[s.genre] = (genreCounts[s.genre] || 0) + 1;
          }
        });
        result.genreDistribution = Object.entries(genreCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([label, value]) => ({ label, value }));

        // New songs + opportunities per day this week
        const { data: newSongs } = await supabase
          .from('songs')
          .select('created_at')
          .gte('created_at', weekAgoISO);
        result.songsWeek = groupByDay(newSongs || []);

        const { data: newOpps } = await supabase
          .from('opportunities')
          .select('created_at')
          .gte('created_at', weekAgoISO);
        result.oppsWeek = groupByDay(newOpps || []);
      }

      setAnalytics(result);
    } catch (err) {
      console.error('Analytics load failed:', err);
    }
  };

  const handleSignOut = async () => {
    await unsubscribeAndRemove(supabase);
    await supabase.auth.signOut();
    setUserProfile(null);
    setPage("dashboard");
    window.history.replaceState(null, '', window.location.pathname);
  };

  const handleDeleteAccount = () => {
    setDeleteAccountModal({ open: true, typed: '', loading: false });
  };

  const handleConfirmDelete = async () => {
    if (deleteAccountModal.typed !== 'DELETE') return;
    setDeleteAccountModal(s => ({ ...s, loading: true }));
    try {
      const { error } = await supabase.functions.invoke('delete-account', { body: {} });
      if (error) throw error;
      showToast.success('Account deleted permanently.');
      setDeleteAccountModal({ open: false, typed: '', loading: false });
      await supabase.auth.signOut();
      setUserProfile(null);
      setPage('dashboard');
    } catch (err) {
      showToast.error(friendlyError(err));
      setDeleteAccountModal(s => ({ ...s, loading: false }));
    }
  };

  const handleOpenFounderSupport = async () => {
    try {
      const { data: founder, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, first_name, last_name, account_type')
        .eq('account_type', 'admin')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!founder?.id) {
        showToast.info('Founder support account not found yet.');
        return;
      }

      setSupportTargetUserId(founder.id);
      setSupportOpenToken(Date.now());
      setPage('messages');
      setViewingProfile(null);
    } catch (err) {
      showToast.error(friendlyError(err));
    }
  };

  const handleGetStarted = () => {
    setShowLanding(false);
    window.history.pushState({ spAuth: true }, '', window.location.pathname);
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      showToast.error(friendlyError(err));
    }
  };

  // Legal pages (accessible without auth — checked before loading spinner)
  if (legalPage === 'terms') {
    return <Suspense fallback={null}><TermsOfServicePage onBack={() => setLegalPage(null)} /></Suspense>;
  }
  if (legalPage === 'privacy') {
    return <Suspense fallback={null}><PrivacyPolicyPage onBack={() => setLegalPage(null)} /></Suspense>;
  }
  if (legalPage === 'dmca') {
    return <Suspense fallback={null}><DMCAPage onBack={() => setLegalPage(null)} /></Suspense>;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16, background: DESIGN_SYSTEM.colors.bg.primary, fontFamily: DESIGN_SYSTEM.font.body }}>
        <img src="/songpitch-logo.png" alt="Coda-Vault" style={{ width: 56, height: 56, objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="ui-spinner" style={{ width: 16, height: 16, border: `2px solid ${DESIGN_SYSTEM.colors.border.light}`, borderTopColor: DESIGN_SYSTEM.colors.brand.primary, borderRadius: '50%' }} />
          <span style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, fontWeight: 500 }}>Loading Coda-Vault...</span>
        </div>
      </div>
    );
  }

  // Show landing page first for signed-out users only.
  // Signed-in users should resume their session directly after refresh.
  if (showLanding && !session) {
    return <LandingPage onGetStarted={handleGetStarted} onLegalPage={setLegalPage} />;
  }

  if (!session) {
    return <AuthPage onAuthComplete={(user, profileData) => { if (profileData) { skipProfileLoadRef.current = true; setShowLanding(false); setUserProfile(profileData); setNeedsOnboarding(false); setPage(profileData.account_type === 'music_executive' ? 'roster' : 'portfolio'); } }} onBackToLanding={() => { setShowLanding(true); setAuthError(null); }} onGoogleSignIn={handleGoogleSignIn} initialError={authError} />;
  }

  // needsOnboarding is no longer used — profile is created during signup.
  // If somehow triggered, just show auth page.

  if (!userProfile) {
    return <AccountSetupPage user={session.user} onComplete={() => loadUserProfile(session.user)} />;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <TrendingUp size={17} />, forAll: true },
    { id: "roster", label: userProfile.account_type === 'music_executive' ? "Composer Roster" : userProfile.account_type === 'admin' ? "Browse Users" : "Executives", icon: <Users size={17} />, forAll: true },
    { id: "catalog", label: "Search Catalog", icon: <Search size={17} />, forExecutive: true },
    { id: "opportunities", label: "Opportunities", icon: <Briefcase size={17} />, forAll: true, badge: badgeCounts.opportunities },
    { id: "responses", label: "Responses", icon: <FileText size={17} />, forExecutive: true, badge: badgeCounts.responses },
    { id: "messages", label: "Messages", icon: <MessageCircle size={17} />, forAll: true, badge: badgeCounts.messages },
    { id: "portfolio", label: "My Portfolio", icon: <Music size={17} />, forComposer: true },
    { id: "profile", label: "My Profile", icon: <User size={17} />, forAll: true },
    { id: "splits", label: "Split Sheets", icon: <FileText size={17} />, forComposer: true },
    { id: "deal-analyzer", label: "Deal Analyzer", icon: <Scale size={17} />, forComposer: true },
    { id: "contract-revision", label: "Contract Review", icon: <BookOpen size={17} />, forExecutive: true },
    { id: "admin-dashboard", label: "Admin Panel", icon: <Shield size={17} />, forAdmin: true },
  ];

  const isAdmin = userProfile.account_type === 'admin';
  const nav = navItems.filter(item =>
    item.forAll ||
    (item.forComposer && (userProfile.account_type === 'composer' || isAdmin)) ||
    (item.forExecutive && (userProfile.account_type === 'music_executive' || isAdmin)) ||
    (item.forAdmin && isAdmin)
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

    const isComposer = userProfile.account_type === 'composer';
    const isExecutive = userProfile.account_type === 'music_executive';
    const fallback = <DashboardPage user={userProfile} stats={stats} onNavigate={setPage} isMobile={isMobileView} analytics={analytics} />;

    switch (page) {
      case "dashboard": return <DashboardPage user={userProfile} stats={stats} onNavigate={setPage} isMobile={isMobileView} analytics={analytics} />;
      case "roster": return <RosterPage accountType={userProfile.account_type} onViewProfile={setViewingProfile} isMobile={isMobileView} />;
      case "catalog": return (isExecutive || isAdmin) ? <CatalogPage audioPlayer={audioPlayer} isMobile={isMobileView} userProfile={userProfile} /> : fallback;
      case "opportunities": return <OpportunitiesPage userProfile={userProfile} onBadgeRefresh={loadSidebarBadges} isMobile={isMobileView} />;
      case "responses": return (isExecutive || isAdmin) ? <ResponsesPage userProfile={userProfile} onNavigate={setPage} onViewProfile={setViewingProfile} audioPlayer={audioPlayer} isMobile={isMobileView} /> : fallback;
      case "messages": return <MessagesPage userProfile={userProfile} supportTargetUserId={supportTargetUserId} supportOpenToken={supportOpenToken} onBadgeRefresh={loadSidebarBadges} onActiveConversationChange={setActiveMessageConversationId} isMobile={isMobileView} />;
      case "portfolio": return (isComposer || isAdmin) ? <PortfolioPage userProfile={userProfile} audioPlayer={audioPlayer} isMobile={isMobileView} /> : fallback;
      case "profile": return <ProfilePage user={{ ...userProfile, email: session.user.email }} onSignOut={handleSignOut} onProfileUpdate={() => loadUserProfile(session.user)} onDeleteAccount={handleDeleteAccount} />;
      case "splits": return (isComposer || isAdmin) ? <SplitGenerator userProfile={userProfile} /> : fallback;
      case "deal-analyzer": return (isComposer || isAdmin) ? <DealAnalyzerPage userProfile={userProfile} /> : fallback;
      case "contract-revision": return (isExecutive || isAdmin) ? <ContractRevisionPage userProfile={userProfile} /> : fallback;
      case "admin-dashboard": return isAdmin ? <AdminDashboardPage stats={stats} userProfile={userProfile} onNavigate={setPage} onViewProfile={setViewingProfile} isMobile={isMobileView} analytics={analytics} /> : fallback;
      default: return fallback;
    }
  };

  const isSidebarCollapsed = !isMobileView && sidebarCollapsed;
  const desktopSidebarWidth = isSidebarCollapsed ? 96 : 240;

  return (
    <div className="app-root w-full min-h-screen flex flex-col md:flex-row" style={{ display: "flex", width: '100%', minHeight: '100vh', height: "100vh", background: DESIGN_SYSTEM.colors.bg.secondary, fontFamily: DESIGN_SYSTEM.font.body, color: DESIGN_SYSTEM.colors.text.primary, overflow: "hidden", position: 'relative' }}>
      {/* Skip to content link for keyboard/screen reader users */}
      <a href="#main-content" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden', zIndex: 9999 }} onFocus={e => { e.currentTarget.style.left = '16px'; e.currentTarget.style.top = '16px'; e.currentTarget.style.width = 'auto'; e.currentTarget.style.height = 'auto'; e.currentTarget.style.overflow = 'visible'; e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.primary; e.currentTarget.style.color = '#fff'; e.currentTarget.style.padding = '8px 16px'; e.currentTarget.style.borderRadius = '8px'; e.currentTarget.style.fontSize = '14px'; e.currentTarget.style.fontWeight = '600'; e.currentTarget.style.textDecoration = 'none'; }} onBlur={e => { e.currentTarget.style.left = '-9999px'; e.currentTarget.style.width = '1px'; e.currentTarget.style.height = '1px'; e.currentTarget.style.overflow = 'hidden'; }}>Skip to content</a>
      {isMobileView && (
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          background: 'rgba(8,10,18,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          zIndex: 1300,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/songpitch-logo.png"
              alt="Coda-Vault"
              style={{ width: 24, height: 24, objectFit: 'contain', filter: 'hue-rotate(282deg) saturate(0.75) brightness(0.95)' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 16, fontWeight: 700, fontFamily: DESIGN_SYSTEM.font.body }}>Coda-Vault</span>
          </div>
          <button
            aria-label="Toggle menu"
            onClick={() => setIsMobileMenuOpen(v => !v)}
            style={{
              background: 'transparent',
              border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
              borderRadius: 8,
              color: DESIGN_SYSTEM.colors.text.secondary,
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Menu size={18} />
          </button>
        </header>
      )}

      {isMobileView && isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            top: 56,
            background: 'rgba(4,5,14,0.80)',
            zIndex: 1190,
          }}
        />
      )}

      <nav aria-label="Main navigation" className={isSidebarCollapsed ? 'sidebar-collapsed' : ''} style={{
        width: isMobileView ? 280 : desktopSidebarWidth,
        minWidth: isMobileView ? 280 : desktopSidebarWidth,
        background: DESIGN_SYSTEM.colors.bg.secondary,
        borderRight: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: isMobileView ? 'fixed' : 'relative',
        top: isMobileView ? 56 : 0,
        left: 0,
        bottom: 0,
        zIndex: 1200,
        overflow: 'hidden',
        transform: isMobileView ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: isMobileView
          ? 'transform 0.25s ease'
          : 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ padding: "22px 20px", borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Logo - Professional presentation */}
            <img
              src="/songpitch-logo.png"
              alt="Coda-Vault"
              style={{ width: 32, height: 32, objectFit: 'contain', margin: isSidebarCollapsed ? '0 auto' : undefined, filter: 'hue-rotate(282deg) saturate(0.75) brightness(0.95)' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {!isSidebarCollapsed && (
              <div>
                <div style={{
                  fontSize: 19,
                  fontWeight: 700,
                  color: DESIGN_SYSTEM.colors.text.primary,
                  letterSpacing: "-0.3px",
                  fontFamily: DESIGN_SYSTEM.font.body,
                }}>Coda-Vault</div>
              </div>
            )}
            <div style={{ marginLeft: isSidebarCollapsed ? 0 : 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
              {!isSidebarCollapsed && !isMobileView && (
                <button aria-label="Collapse sidebar" onClick={() => setSidebarCollapsed(true)} style={{ background: 'transparent', border: 'none', color: DESIGN_SYSTEM.colors.text.tertiary, cursor: 'pointer', padding: 6 }}>
                  <ChevronLeft size={18} />
                </button>
              )}
            </div>
          </div>
          {/* header now-playing label removed for aesthetic */}
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto", display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map(item => (
            <button key={item.id} aria-label={item.label} onClick={() => { setPage(item.id); setViewingProfile(null); if (isMobileView) setIsMobileMenuOpen(false); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: isSidebarCollapsed ? 0 : 10, padding: isSidebarCollapsed ? "10px 6px" : "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", fontFamily: DESIGN_SYSTEM.font.body, fontSize: 14, fontWeight: page === item.id ? 600 : 400, transition: "all 0.15s", position: 'relative',
              background: page === item.id ? 'rgba(201,168,76,0.10)' : "transparent",
              color: page === item.id ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary,
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              borderLeft: page === item.id ? `3px solid ${DESIGN_SYSTEM.colors.brand.primary}` : '3px solid transparent',
            }}
              onMouseEnter={e => { if (page !== item.id) { e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.card; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; } }}
              onMouseLeave={e => { if (page !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; } }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, color: page === item.id ? DESIGN_SYSTEM.colors.brand.primary : 'inherit' }}>{item.icon}</span>
              {!isSidebarCollapsed && <span>{item.label}</span>}
              {item.badge > 0 && (
                <span style={{
                  position: isSidebarCollapsed ? 'absolute' : 'static',
                  top: isSidebarCollapsed ? 2 : undefined,
                  right: isSidebarCollapsed ? 6 : undefined,
                  marginLeft: isSidebarCollapsed ? 0 : 'auto',
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
          {userProfile.account_type !== 'admin' && (
            <button
              aria-label="Chat with Founder"
              onClick={handleOpenFounderSupport}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: isSidebarCollapsed ? 0 : 10,
                padding: isSidebarCollapsed ? "10px 6px" : "10px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: DESIGN_SYSTEM.font.body,
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.15s",
                position: 'relative',
                marginTop: 6,
                background: `${DESIGN_SYSTEM.colors.brand.primary}15`,
                color: DESIGN_SYSTEM.colors.brand.primary,
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                borderLeft: `3px solid ${DESIGN_SYSTEM.colors.brand.primary}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${DESIGN_SYSTEM.colors.brand.primary}22`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${DESIGN_SYSTEM.colors.brand.primary}15`; }}
              title="Chat with Support"
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                <MessageCircle size={17} />
              </span>
              {!isSidebarCollapsed && <span>💬 Chat with Support</span>}
            </button>
          )}
        </nav>

        {/* ⌘K search hint */}
        {!isSidebarCollapsed && (
          <div style={{ padding: "0 10px 4px" }}>
            <button
              onClick={() => setCmdOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '10px 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                color: DESIGN_SYSTEM.colors.text.tertiary,
                fontFamily: DESIGN_SYSTEM.font.body,
                fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.06)'; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.tertiary; }}
            >
              <span style={{ flex: 1, textAlign: 'left' }}>Search...</span>
              <kbd style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, padding: '2px 6px', fontSize: 11 }}>⌘K</kbd>
            </button>
          </div>
        )}

        <div style={{ padding: "0 10px 8px" }}>
          <div ref={notifPanelRef} style={{ position: 'relative' }}>
            <button
              aria-label="Notifications"
              onClick={() => setShowNotifPanel(p => !p)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: isSidebarCollapsed ? 0 : 10,
                padding: isSidebarCollapsed ? "10px 6px" : "10px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: DESIGN_SYSTEM.font.body,
                fontSize: 14,
                fontWeight: unreadCount > 0 ? 600 : 400,
                transition: "all 0.15s",
                position: 'relative',
                background: showNotifPanel ? 'rgba(201,168,76,0.10)' : "transparent",
                color: showNotifPanel ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.secondary,
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                borderLeft: showNotifPanel ? `3px solid ${DESIGN_SYSTEM.colors.brand.primary}` : '3px solid transparent',
              }}
              onMouseEnter={e => { if (!showNotifPanel) { e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.card; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.primary; } }}
              onMouseLeave={e => { if (!showNotifPanel) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DESIGN_SYSTEM.colors.text.secondary; } }}
              title="Notifications"
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, color: unreadCount > 0 ? DESIGN_SYSTEM.colors.brand.primary : 'inherit' }}>
                <Bell size={18} />
              </span>
              {!isSidebarCollapsed && <span>Notifications</span>}
              {unreadCount > 0 && (
                <span style={{
                  position: isSidebarCollapsed ? 'absolute' : 'static',
                  top: isSidebarCollapsed ? 2 : undefined,
                  right: isSidebarCollapsed ? 6 : undefined,
                  marginLeft: isSidebarCollapsed ? 0 : 'auto',
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
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifPanel && (
              <NotificationPanel
                notifications={notifications}
                loading={false}
                onMarkAllRead={handleMarkAllRead}
                onNotifClick={handleNotifClick}
                onDismiss={handleDismiss}
                onClose={() => setShowNotifPanel(false)}
              />
            )}
          </div>
        </div>

        <div style={{ padding: "14px 14px", borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
          <div
            onClick={() => { setPage('profile'); setViewingProfile(null); if (isMobileView) setIsMobileMenuOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', cursor: 'pointer', padding: '6px 4px', borderRadius: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = DESIGN_SYSTEM.colors.bg.card}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Avatar name={`${userProfile.first_name} ${userProfile.last_name}`} color={userProfile.avatar_color} avatarUrl={userProfile.avatar_url} size={34} border="1px solid rgba(201,168,76,0.3)" />
            {!isSidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userProfile.first_name} {userProfile.last_name}</div>
                <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {userProfile.account_type === 'admin' ? (
                    <Badge color={DESIGN_SYSTEM.colors.brand.primary}>👋 Founder</Badge>
                  ) : (
                    <>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: DESIGN_SYSTEM.colors.brand.primary, display: 'inline-block' }}></span>
                      {userProfile.account_type === 'music_executive' ? 'Executive' : 'Composer'}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (() => {
            const fields = (userProfile.account_type === 'composer' || userProfile.account_type === 'admin')
              ? [userProfile.bio, userProfile.location, userProfile.avatar_url, userProfile.pro_name || userProfile.pro, userProfile.role, Array.isArray(userProfile.genres) && userProfile.genres.length > 0, userProfile.instruments]
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
      </nav>

      {!isMobileView && isSidebarCollapsed && (
        <button
          aria-label="Expand sidebar"
          onClick={() => setSidebarCollapsed(false)}
          style={{
            position: 'fixed',
            top: 24,
            left: 104,
            zIndex: 1000,
            background: DESIGN_SYSTEM.colors.bg.card,
            border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
            color: DESIGN_SYSTEM.colors.text.tertiary,
            cursor: 'pointer',
            padding: 6,
            borderRadius: 8,
            boxShadow: DESIGN_SYSTEM.shadow.sm,
          }}
          title="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>
      )}

      <main id="main-content" className="page-fade-in flex-1 w-full min-w-0" key={viewingProfile ? `profile-${viewingProfile.id}` : page} style={{ flex: 1, width: '100%', minWidth: 0, overflowY: "auto", background: DESIGN_SYSTEM.colors.bg.primary, paddingBottom: audioPlayer.playingSong ? 70 : 0, position: 'relative', paddingTop: isMobileView ? 56 : 0 }}>
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}><div style={{ width: 32, height: 32, border: `3px solid ${DESIGN_SYSTEM.colors.border.light}`, borderTopColor: DESIGN_SYSTEM.colors.brand.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>}>
          {renderPage()}
        </Suspense>
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
        waveformPeaks={audioPlayer.waveformPeaks}
        sidebarCollapsed={isSidebarCollapsed}
        sidebarOffset={isMobileView ? 0 : desktopSidebarWidth}
      />

      {/* Session inactivity warning */}
      {showSessionWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(4,5,14,0.78)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="modal-enter" style={{ background: DESIGN_SYSTEM.colors.bg.card, borderRadius: 20, padding: 32, maxWidth: 380, width: '100%', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 20, fontWeight: 800, fontFamily: DESIGN_SYSTEM.font.body, marginBottom: 10 }}>Still there?</h2>
            <p style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              You've been inactive for a while. For your security, we'll sign you out in 5 minutes unless you're still here.
            </p>
            <button
              onClick={() => setShowSessionWarning(false)}
              style={{ background: DESIGN_SYSTEM.colors.brand.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: DESIGN_SYSTEM.font.body, boxShadow: '0 4px 16px rgba(201,168,76,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.light}
              onMouseLeave={e => e.currentTarget.style.background = DESIGN_SYSTEM.colors.brand.primary}
            >
              Yes, I'm here
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Account Modal ─────────────────────────────────────────── */}
      {deleteAccountModal.open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(4,5,14,0.82)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: DESIGN_SYSTEM.colors.bg.card,
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 20, padding: 32,
            maxWidth: 420, width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}>
            {/* Icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <AlertTriangle size={22} color="#f87171" />
            </div>

            <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: DESIGN_SYSTEM.font.body }}>
              Delete your account?
            </h3>
            <p style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, lineHeight: 1.6, marginBottom: 20, fontFamily: DESIGN_SYSTEM.font.body }}>
              This will permanently delete your profile, songs, messages, and all associated data. <strong style={{ color: DESIGN_SYSTEM.colors.text.primary }}>This cannot be undone.</strong>
            </p>

            {/* Type to confirm */}
            <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, fontFamily: DESIGN_SYSTEM.font.body }}>
              Type <span style={{ color: '#f87171', fontFamily: 'monospace' }}>DELETE</span> to confirm
            </p>
            <input
              type="text"
              value={deleteAccountModal.typed}
              onChange={e => setDeleteAccountModal(s => ({ ...s, typed: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleConfirmDelete()}
              placeholder="DELETE"
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                background: DESIGN_SYSTEM.colors.bg.primary,
                border: `1px solid ${deleteAccountModal.typed === 'DELETE' ? '#f87171' : DESIGN_SYSTEM.colors.border.light}`,
                borderRadius: 10, padding: '11px 14px',
                color: '#f87171', fontSize: 14, fontFamily: 'monospace',
                outline: 'none', marginBottom: 20,
                letterSpacing: '1px',
              }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteAccountModal({ open: false, typed: '', loading: false })}
                disabled={deleteAccountModal.loading}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
                  background: 'transparent', border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`,
                  color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 14, fontWeight: 600,
                  fontFamily: DESIGN_SYSTEM.font.body,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteAccountModal.typed !== 'DELETE' || deleteAccountModal.loading}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  cursor: deleteAccountModal.typed !== 'DELETE' || deleteAccountModal.loading ? 'not-allowed' : 'pointer',
                  background: deleteAccountModal.typed === 'DELETE' ? '#ef4444' : 'rgba(248,113,113,0.15)',
                  border: 'none',
                  color: deleteAccountModal.typed === 'DELETE' ? '#fff' : '#f87171',
                  fontSize: 14, fontWeight: 700,
                  fontFamily: DESIGN_SYSTEM.font.body,
                  opacity: deleteAccountModal.loading ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {deleteAccountModal.loading ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toaster position="bottom-right" toastOptions={{ duration: 3500 }} />

      {/* Command Palette */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={(pg) => { setPage(pg); setViewingProfile(null); setCmdOpen(false); }}
      />
    </div>
  );
}
