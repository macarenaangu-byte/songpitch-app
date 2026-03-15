// ─── Analytics Helper ────────────────────────────────────────────────────────
// Wraps window.trackEvent (GA4) so all event calls are one-liners.
// If GA4 is not loaded (dev mode, ad blocker), calls are silently swallowed.

export const trackEvent = (eventName, params = {}) => {
  try {
    if (typeof window.trackEvent === 'function') {
      window.trackEvent(eventName, params);
    }
  } catch (err) {
    // Never let analytics errors break the app
    console.warn('[analytics] trackEvent failed:', err);
  }
};

// ─── Predefined events (keeps naming consistent across the codebase) ─────────
export const Analytics = {
  signupCompleted:   (role)          => trackEvent('signup_completed',        { role }),
  songUploaded:      (genre, mood)   => trackEvent('song_uploaded',           { genre, mood }),
  opportunityApplied:(oppId)         => trackEvent('opportunity_applied',     { opportunity_id: oppId }),
  messageSent:       ()              => trackEvent('message_sent'),
  profileViewed:     (viewedRole)    => trackEvent('profile_viewed',          { viewed_role: viewedRole }),
  bookmarkToggled:   (action)        => trackEvent('opportunity_bookmarked',  { action }), // 'add' | 'remove'
  pitchHelperUsed:   ()              => trackEvent('pitch_helper_used'),
  briefWriterUsed:   ()              => trackEvent('brief_writer_used'),
};
