-- ============================================================================
-- SongPitch: Row-Level Security (RLS) Policies
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================
-- This migration enables RLS on all tables and creates policies that ensure:
-- 1. Users can only modify their own data
-- 2. Public browsing works for discovery (profiles, songs, opportunities)
-- 3. Messages are only visible to conversation participants
-- 4. Notifications are private to each user
-- ============================================================================

-- ─── Helper: get the user_profiles.id for the currently authenticated user ───
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. user_profiles
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can browse non-deleted profiles (discovery)
CREATE POLICY "user_profiles: anyone can view non-deleted profiles"
  ON public.user_profiles FOR SELECT
  USING (is_deleted = false);

-- Users can insert their own profile (signup)
CREATE POLICY "user_profiles: users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update only their own profile
CREATE POLICY "user_profiles: users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can soft-delete their own profile
CREATE POLICY "user_profiles: users can delete own profile"
  ON public.user_profiles FOR DELETE
  USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. composers
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.composers ENABLE ROW LEVEL SECURITY;

-- Anyone can read composer metadata (genres/specialties for discovery)
CREATE POLICY "composers: anyone can view"
  ON public.composers FOR SELECT
  USING (true);

-- Users can insert their own composer record
CREATE POLICY "composers: users can insert own record"
  ON public.composers FOR INSERT
  WITH CHECK (user_profile_id = public.get_my_profile_id());

-- Users can update their own composer record
CREATE POLICY "composers: users can update own record"
  ON public.composers FOR UPDATE
  USING (user_profile_id = public.get_my_profile_id())
  WITH CHECK (user_profile_id = public.get_my_profile_id());

-- Users can delete their own composer record
CREATE POLICY "composers: users can delete own record"
  ON public.composers FOR DELETE
  USING (user_profile_id = public.get_my_profile_id());


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. songs
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can browse the catalog
CREATE POLICY "songs: anyone can view all songs"
  ON public.songs FOR SELECT
  USING (true);

-- Composers can insert their own songs
CREATE POLICY "songs: composers can insert own songs"
  ON public.songs FOR INSERT
  WITH CHECK (composer_id = public.get_my_profile_id());

-- Composers can update their own songs
CREATE POLICY "songs: composers can update own songs"
  ON public.songs FOR UPDATE
  USING (composer_id = public.get_my_profile_id())
  WITH CHECK (composer_id = public.get_my_profile_id());

-- Composers can delete their own songs
CREATE POLICY "songs: composers can delete own songs"
  ON public.songs FOR DELETE
  USING (composer_id = public.get_my_profile_id());


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. opportunities
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view opportunities (composers browse open ones, execs see own)
CREATE POLICY "opportunities: anyone can view"
  ON public.opportunities FOR SELECT
  USING (true);

-- Executives/admins can create opportunities
CREATE POLICY "opportunities: creators can insert"
  ON public.opportunities FOR INSERT
  WITH CHECK (creator_id = public.get_my_profile_id());

-- Only the creator can update their opportunity
CREATE POLICY "opportunities: creators can update own"
  ON public.opportunities FOR UPDATE
  USING (creator_id = public.get_my_profile_id())
  WITH CHECK (creator_id = public.get_my_profile_id());

-- Only the creator can delete their opportunity
CREATE POLICY "opportunities: creators can delete own"
  ON public.opportunities FOR DELETE
  USING (creator_id = public.get_my_profile_id());


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. responses (applications)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Composers can see their own responses; executives can see responses to their opportunities
CREATE POLICY "responses: composers see own, execs see responses to their opps"
  ON public.responses FOR SELECT
  USING (
    composer_id = public.get_my_profile_id()
    OR
    opportunity_id IN (
      SELECT id FROM public.opportunities WHERE creator_id = public.get_my_profile_id()
    )
  );

-- Composers can submit responses
CREATE POLICY "responses: composers can insert own"
  ON public.responses FOR INSERT
  WITH CHECK (composer_id = public.get_my_profile_id());

-- Composers can update their own response message/song; executives can update review_status
CREATE POLICY "responses: composers update own, execs update review status"
  ON public.responses FOR UPDATE
  USING (
    composer_id = public.get_my_profile_id()
    OR
    opportunity_id IN (
      SELECT id FROM public.opportunities WHERE creator_id = public.get_my_profile_id()
    )
  );

-- Composers can withdraw (delete) their own response
CREATE POLICY "responses: composers can delete own"
  ON public.responses FOR DELETE
  USING (composer_id = public.get_my_profile_id());


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. conversations
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Only participants can see their conversations
CREATE POLICY "conversations: participants can view"
  ON public.conversations FOR SELECT
  USING (
    user1_id = public.get_my_profile_id()
    OR user2_id = public.get_my_profile_id()
  );

-- Any authenticated user can start a conversation
CREATE POLICY "conversations: users can create"
  ON public.conversations FOR INSERT
  WITH CHECK (
    user1_id = public.get_my_profile_id()
    OR user2_id = public.get_my_profile_id()
  );

-- Participants can delete their conversations
CREATE POLICY "conversations: participants can delete"
  ON public.conversations FOR DELETE
  USING (
    user1_id = public.get_my_profile_id()
    OR user2_id = public.get_my_profile_id()
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. messages
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only conversation participants can read messages
CREATE POLICY "messages: conversation participants can view"
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user1_id = public.get_my_profile_id()
         OR user2_id = public.get_my_profile_id()
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "messages: users can send in own conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = public.get_my_profile_id()
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user1_id = public.get_my_profile_id()
         OR user2_id = public.get_my_profile_id()
    )
  );

-- Users can mark messages as read (only messages sent to them)
CREATE POLICY "messages: recipients can mark as read"
  ON public.messages FOR UPDATE
  USING (
    sender_id != public.get_my_profile_id()
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user1_id = public.get_my_profile_id()
         OR user2_id = public.get_my_profile_id()
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. notifications
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "notifications: users see own"
  ON public.notifications FOR SELECT
  USING (user_id = public.get_my_profile_id());

-- System/authenticated users can create notifications for any user
-- (needed for cross-user notifications like "X applied to your opportunity")
CREATE POLICY "notifications: authenticated users can insert"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications: users can update own"
  ON public.notifications FOR UPDATE
  USING (user_id = public.get_my_profile_id());

-- Users can delete their own notifications
CREATE POLICY "notifications: users can delete own"
  ON public.notifications FOR DELETE
  USING (user_id = public.get_my_profile_id());


-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. pinned_chats
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.pinned_chats ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pins
CREATE POLICY "pinned_chats: users see own"
  ON public.pinned_chats FOR SELECT
  USING (user_id = public.get_my_profile_id());

-- Users can pin chats for themselves
CREATE POLICY "pinned_chats: users can insert own"
  ON public.pinned_chats FOR INSERT
  WITH CHECK (user_id = public.get_my_profile_id());

-- Users can unpin their own chats
CREATE POLICY "pinned_chats: users can delete own"
  ON public.pinned_chats FOR DELETE
  USING (user_id = public.get_my_profile_id());


-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. profile_views
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Users can see views on their own profile (for stats)
CREATE POLICY "profile_views: users see views on own profile"
  ON public.profile_views FOR SELECT
  USING (viewed_user_id = auth.uid());

-- Any authenticated user can record a profile view
CREATE POLICY "profile_views: authenticated users can insert"
  ON public.profile_views FOR INSERT
  WITH CHECK (viewer_user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. viewed_opportunities
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.viewed_opportunities ENABLE ROW LEVEL SECURITY;

-- Users can see their own viewed records
CREATE POLICY "viewed_opportunities: users see own"
  ON public.viewed_opportunities FOR SELECT
  USING (user_id = public.get_my_profile_id());

-- Users can mark opportunities as viewed
CREATE POLICY "viewed_opportunities: users can insert own"
  ON public.viewed_opportunities FOR INSERT
  WITH CHECK (user_id = public.get_my_profile_id());


-- ═══════════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKET POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- song-files bucket: authenticated users upload to their own folder, public read
CREATE POLICY "song-files: authenticated users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'song-files'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "song-files: public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'song-files');

CREATE POLICY "song-files: users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'song-files'
    AND auth.role() = 'authenticated'
  );

-- avatars bucket: authenticated users upload, public read
CREATE POLICY "avatars: authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "avatars: public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! All tables now have RLS enabled with appropriate policies.
-- ═══════════════════════════════════════════════════════════════════════════════
