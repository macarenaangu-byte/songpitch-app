import { useState, useEffect, useRef } from "react";
import { Search, MessageCircle, Send, Pin, ArrowLeft } from "lucide-react";
import { DESIGN_SYSTEM } from '../constants/designSystem';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { friendlyError, insertNotification } from '../lib/utils';
import { Avatar } from '../components/Avatar';
import { LoadingMessageItem } from '../components/LoadingCards';

export function MessagesPage({ userProfile, supportTargetUserId, supportOpenToken, onBadgeRefresh, onActiveConversationChange, isMobile = false }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchConv, setSearchConv] = useState("");
  const [pinnedChats, setPinnedChats] = useState(new Set());
  const messagesEndRef = useRef(null);
  const currentPinnedUserId = userProfile?.user_id || userProfile?.id;
  const isFounderSupportUser = (u) => u?.account_type === 'admin' || u?.email === 'mangulo@songpitchhub.com';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    loadConversations();
    loadPinnedChats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!supportTargetUserId || !supportOpenToken) return;
    openConversationWithUser(supportTargetUserId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportTargetUserId, supportOpenToken]);

  useEffect(() => {
    if (onActiveConversationChange) {
      onActiveConversationChange(selectedConversation?.id || null);
    }
    return () => {
      if (onActiveConversationChange) onActiveConversationChange(null);
    };
  }, [selectedConversation?.id, onActiveConversationChange]);

  useEffect(() => {
    if (!userProfile?.id) return;

    const channel = supabase
      .channel(`messages-global:${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const convId = payload.new?.conversation_id;
          if (!convId) return;

          loadConversations();
          if (selectedConversation?.id === convId) {
            await markConversationAsRead(convId);
            loadMessages(convId);
          }
          if (onBadgeRefresh) onBadgeRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const convId = payload.new?.conversation_id;
          if (!convId) return;

          loadConversations();
          if (selectedConversation?.id === convId) {
            loadMessages(convId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.id, selectedConversation?.id]);

  useEffect(() => {
    if (selectedConversation) {
      markConversationAsRead(selectedConversation.id);
      loadMessages(selectedConversation.id);

      // Subscribe to realtime message changes for this conversation
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
          async () => {
            await markConversationAsRead(selectedConversation.id);
            loadMessages(selectedConversation.id);
            loadConversations(); // Update last message preview
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const lastMessage = (conv.messages || [])
          .slice()
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        return {
          ...conv,
          otherUser,
          lastMessage: lastMessage?.content || "No messages yet",
          lastMessageTime: lastMessage?.created_at
        };
      });

      setConversations(formatted);
      return formatted;
    } catch (err) {
      console.error("Error loading conversations:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadPinnedChats = async () => {
    if (!currentPinnedUserId) return;
    try {
      const { data, error } = await supabase
        .from('pinned_chats')
        .select('pinned_user_id')
        .eq('user_id', currentPinnedUserId);

      if (error) throw error;
      setPinnedChats(new Set((data || []).map(row => row.pinned_user_id)));
    } catch (err) {
      console.error('Error loading pinned chats:', err);
    }
  };

  const togglePinChat = async (pinnedUserId) => {
    if (!currentPinnedUserId) return;
    const isPinned = pinnedChats.has(pinnedUserId);
    try {
      if (isPinned) {
        const { error } = await supabase
          .from('pinned_chats')
          .delete()
          .eq('user_id', currentPinnedUserId)
          .eq('pinned_user_id', pinnedUserId);
        if (error) throw error;
        setPinnedChats(prev => {
          const next = new Set(prev);
          next.delete(pinnedUserId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('pinned_chats')
          .insert({ user_id: currentPinnedUserId, pinned_user_id: pinnedUserId });
        if (error) throw error;
        setPinnedChats(prev => {
          const next = new Set(prev);
          next.add(pinnedUserId);
          return next;
        });
      }
    } catch (err) {
      showToast(friendlyError(err), 'error');
    }
  };

  const openConversationWithUser = async (targetUserId) => {
    if (!targetUserId || targetUserId === userProfile.id) return;
    try {
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${userProfile.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${userProfile.id})`)
        .maybeSingle();

      if (searchError) throw searchError;

      let conversationId = existingConv?.id;

      if (!conversationId) {
        const { data: created, error: createError } = await supabase
          .from('conversations')
          .insert([{ user1_id: userProfile.id, user2_id: targetUserId }])
          .select('id')
          .single();

        if (createError) throw createError;
        conversationId = created?.id;
      }

      const updated = await loadConversations();
      const targetConv = (updated || []).find(c => c.id === conversationId) || (updated || []).find(c => c.otherUser?.id === targetUserId);
      if (targetConv) setSelectedConversation(targetConv);
    } catch (err) {
      showToast(friendlyError(err), 'error');
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userProfile.id)
        .eq('is_read', false);

      if (error) throw error;
      if (onBadgeRefresh) onBadgeRefresh();
    } catch (err) {
      console.error('Error marking messages as read:', err);
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

      const sentText = messageText.trim();
      setMessageText("");
      loadMessages(selectedConversation.id);
      loadConversations(); // Refresh to update last message

      // Notify the other participant
      const otherUserId = selectedConversation.user1_id === userProfile.id
        ? selectedConversation.user2_id
        : selectedConversation.user1_id;
      if (otherUserId) {
        insertNotification(
          otherUserId,
          'new_message',
          'New message',
          `${userProfile.first_name} ${userProfile.last_name}: ${sentText.substring(0, 80)}${sentText.length > 80 ? '...' : ''}`,
          { conversation_id: selectedConversation.id, sender_name: `${userProfile.first_name} ${userProfile.last_name}` }
        );
      }
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
      {/* Conversations List — hidden on mobile when a conversation is selected */}
      {!(isMobile && selectedConversation) && (
      <div style={{ width: isMobile ? '100%' : 320, background: DESIGN_SYSTEM.colors.bg.secondary, borderRight: isMobile ? 'none' : `1px solid ${DESIGN_SYSTEM.colors.border.light}`, display: "flex", flexDirection: "column" }}>
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
            (() => {
              const filteredConversations = conversations.filter(conv => {
                if (!searchConv.trim()) return true;
                const fullName = `${conv.otherUser.first_name} ${conv.otherUser.last_name}`.toLowerCase();
                return fullName.includes(searchConv.toLowerCase());
              });

              const pinnedConversations = filteredConversations.filter(conv => pinnedChats.has(conv.otherUser.id));
              const recentConversations = filteredConversations.filter(conv => !pinnedChats.has(conv.otherUser.id));

              const renderConversationItem = (conv) => (
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
                    <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.otherUser.first_name} {conv.otherUser.last_name}</span>
                      {conv.otherUser.account_type === 'admin' && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: DESIGN_SYSTEM.colors.brand.primary,
                          background: `${DESIGN_SYSTEM.colors.brand.primary}1A`,
                          border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40`,
                          borderRadius: 999,
                          padding: '2px 6px',
                          lineHeight: 1.2,
                          flexShrink: 0,
                        }}>
                          Founder
                        </span>
                      )}
                    </div>
                    <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 11, marginTop: 2 }}>
                      {isFounderSupportUser(conv.otherUser) ? 'Founder & Support' : conv.otherUser.account_type === 'music_executive' ? 'Executive' : 'Composer'}
                    </div>
                  </div>
                  <button
                    aria-label={pinnedChats.has(conv.otherUser.id) ? 'Unpin chat' : 'Pin chat'}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinChat(conv.otherUser.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: pinnedChats.has(conv.otherUser.id) ? DESIGN_SYSTEM.colors.brand.primary : DESIGN_SYSTEM.colors.text.muted,
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                    title={pinnedChats.has(conv.otherUser.id) ? 'Unpin chat' : 'Pin chat'}
                  >
                    <Pin size={14} fill={pinnedChats.has(conv.otherUser.id) ? 'currentColor' : 'none'} />
                  </button>
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
              );

              return (
                <>
                  {pinnedConversations.length > 0 && (
                    <div style={{ padding: '8px 20px 6px', fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.brand.primary, textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                      Pinned
                    </div>
                  )}
                  {pinnedConversations.map(renderConversationItem)}

                  {recentConversations.length > 0 && pinnedConversations.length > 0 && (
                    <div style={{ padding: '8px 20px 6px', fontSize: 11, fontWeight: 700, color: DESIGN_SYSTEM.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                      Recent
                    </div>
                  )}
                  {recentConversations.map(renderConversationItem)}
                </>
              );
            })()
          )}
        </div>
      </div>
      )}

      {/* Chat Area — full-width on mobile when conversation selected */}
      {selectedConversation ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", width: isMobile ? '100%' : undefined }}>
          {/* Chat Header */}
          <div style={{ padding: isMobile ? "14px 16px" : "20px 24px", borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, background: DESIGN_SYSTEM.colors.bg.secondary }}>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14 }}>
              {isMobile && (
                <button
                  onClick={() => setSelectedConversation(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: DESIGN_SYSTEM.colors.text.muted }}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <Avatar
                name={`${selectedConversation.otherUser.first_name} ${selectedConversation.otherUser.last_name}`}
                color={selectedConversation.otherUser.avatar_color}
                avatarUrl={selectedConversation.otherUser.avatar_url}
                size={48}
              />
              <div>
                <h3 style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <span>{selectedConversation.otherUser.first_name} {selectedConversation.otherUser.last_name}</span>
                  {selectedConversation.otherUser.account_type === 'admin' && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: DESIGN_SYSTEM.colors.brand.primary,
                      background: `${DESIGN_SYSTEM.colors.brand.primary}1A`,
                      border: `1px solid ${DESIGN_SYSTEM.colors.brand.primary}40`,
                      borderRadius: 999,
                      padding: '2px 7px',
                      lineHeight: 1.2,
                    }}>
                      Founder
                    </span>
                  )}
                </h3>
                <div style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13, marginTop: 2 }}>
                  {isFounderSupportUser(selectedConversation.otherUser) ? 'Founder & Support' : selectedConversation.otherUser.account_type === 'music_executive' ? 'Music Executive' : 'Composer'}
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
                <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8 }}>
                  No messages yet.
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
                    <div style={{ maxWidth: isMobile ? "80%" : "60%" }}>
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
                        {isMe ? `${msg.is_read ? 'Read' : 'Delivered'} \u2022 ${formatMessageTime(msg.created_at)}` : formatMessageTime(msg.created_at)}
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
          <div style={{ padding: isMobile ? "12px 16px" : "20px 24px", borderTop: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, background: DESIGN_SYSTEM.colors.bg.secondary }}>
            <form onSubmit={sendMessage} style={{ display: "flex", gap: isMobile ? 8 : 12 }}>
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
                  padding: isMobile ? "12px 16px" : "12px 24px",
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
      ) : !isMobile ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: DESIGN_SYSTEM.colors.text.muted }}>
          <div style={{ textAlign: "center" }}>
            <MessageCircle size={64} color={DESIGN_SYSTEM.colors.text.muted} style={{ margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>Select a conversation</h3>
            <p style={{ fontSize: 14 }}>Choose a conversation from the left to start messaging</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
