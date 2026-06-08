import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { friendlyError } from '../lib/utils';

/**
 * Manages notifications + sidebar badge counts.
 * Extracted from App.jsx to keep the shell file focused on routing/auth.
 */
export function useNotifications({ userProfile, pageRef, activeConversationRef }) {
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [badgeCounts, setBadgeCounts]       = useState({ messages: 0, responses: 0, opportunities: 0 });

  // ─── Load notifications ───────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
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
  }, [userProfile]);

  // ─── Load sidebar badge counts ────────────────────────────────────────────
  const loadSidebarBadges = useCallback(async () => {
    if (!userProfile) return;
    try {
      const { data: conversationRows } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${userProfile.id},user2_id.eq.${userProfile.id}`);

      const conversationIds = (conversationRows || []).map(c => c.id);
      let unreadMessages = 0;
      if (conversationIds.length > 0) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', userProfile.id)
          .eq('is_read', false);
        unreadMessages = count || 0;
      }

      let unreadOpportunities = 0;
      if (userProfile.account_type === 'composer') {
        const { data: openOpps } = await supabase
          .from('opportunities')
          .select('id')
          .eq('status', 'Open');

        const openIds = (openOpps || []).map(o => o.id);
        if (openIds.length > 0) {
          const { data: viewedRows } = await supabase
            .from('viewed_opportunities')
            .select('opportunity_id')
            .eq('user_id', userProfile.id)
            .in('opportunity_id', openIds);
          const viewedSet = new Set((viewedRows || []).map(v => v.opportunity_id));
          unreadOpportunities = Math.max(0, openIds.length - viewedSet.size);
        }
      }

      setBadgeCounts(prev => ({ ...prev, messages: unreadMessages, opportunities: unreadOpportunities }));
    } catch (err) {
      console.error('Error loading sidebar badges:', err);
    }
  }, [userProfile]);

  // ─── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile) return;
    loadNotifications();

    const channel = supabase
      .channel(`notifications:${userProfile.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userProfile.id}`
      }, async (payload) => {
        const incoming = payload.new;
        const isNewMessageNotif     = incoming?.type === 'new_message';
        const isMessagesPage        = pageRef?.current === 'messages';
        const incomingConvId        = incoming?.metadata?.conversation_id;
        const sameActiveConversation = isNewMessageNotif && isMessagesPage &&
          activeConversationRef?.current &&
          String(incomingConvId) === String(activeConversationRef.current);

        if (sameActiveConversation) {
          setNotifications(prev => [{ ...incoming, is_read: true }, ...prev]);
          try { await supabase.from('notifications').update({ is_read: true }).eq('id', incoming.id); } catch (_) {}
          return;
        }

        setNotifications(prev => [incoming, ...prev]);
        if (!incoming?.is_read) setUnreadCount(prev => prev + 1);
        if (!(isMessagesPage && isNewMessageNotif)) showToast.info(incoming.title);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile, loadNotifications, pageRef, activeConversationRef]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleMarkRead = useCallback(async (notifId) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    if (!userProfile) return;
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userProfile.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [userProfile]);

  const handleDismiss = useCallback(async (notificationId) => {
    const target = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (target && !target.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      const { error } = await supabase.from('notifications').delete()
        .eq('id', notificationId).eq('user_id', userProfile.id);
      if (error) throw error;
    } catch (err) {
      if (target) {
        setNotifications(prev => [target, ...prev]);
        if (!target.is_read) setUnreadCount(prev => prev + 1);
      }
      showToast.error(friendlyError(err));
    }
  }, [notifications, userProfile]);

  return {
    notifications, unreadCount, badgeCounts,
    loadNotifications, loadSidebarBadges,
    handleMarkRead, handleMarkAllRead, handleDismiss,
  };
}
