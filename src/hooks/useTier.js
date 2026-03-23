// useTier.js
// Central hook for all subscription tier logic in SongPitch Hub.
// Usage: const { tier, can, limits, isAdmin } = useTier(userProfile);

const TIER_LIMITS = {
  free: {
    uploadsPerWeek:            3,
    contactsPerMonth:          5,
    opportunitiesPerMonth:     3,
    contractRevisionsPerMonth: 0,
    shortlistsMax:             0,
    fullSplitAnalysis:         false,
    dealAnalyzer:              false,
    agreementReader:           false,
    proIpiEnrichment:          false,
    advancedFilters:           false,
    exportSplitSheet:          false,
    marketAnalytics:           false,
    contractRevision:          false,
    contractVault:             false,
  },
  basic: {
    uploadsPerWeek:            null,   // unlimited
    contactsPerMonth:          25,
    opportunitiesPerMonth:     10,
    contractRevisionsPerMonth: 3,
    shortlistsMax:             5,
    fullSplitAnalysis:         true,
    dealAnalyzer:              false,
    agreementReader:           false,
    proIpiEnrichment:          true,
    advancedFilters:           true,
    exportSplitSheet:          false,
    marketAnalytics:           false,
    contractRevision:          true,
    contractVault:             true,
  },
  pro: {
    uploadsPerWeek:            null,
    contactsPerMonth:          null,
    opportunitiesPerMonth:     null,
    contractRevisionsPerMonth: null,
    shortlistsMax:             null,
    fullSplitAnalysis:         true,
    dealAnalyzer:              true,
    agreementReader:           true,
    proIpiEnrichment:          true,
    advancedFilters:           true,
    exportSplitSheet:          true,
    marketAnalytics:           true,
    contractRevision:          true,
    contractVault:             true,
  },
  admin: {
    uploadsPerWeek:            null,
    contactsPerMonth:          null,
    opportunitiesPerMonth:     null,
    contractRevisionsPerMonth: null,
    shortlistsMax:             null,
    fullSplitAnalysis:         true,
    dealAnalyzer:              true,
    agreementReader:           true,
    proIpiEnrichment:          true,
    advancedFilters:           true,
    exportSplitSheet:          true,
    marketAnalytics:           true,
    contractRevision:          true,
    contractVault:             true,
  },
};

export function useTier(userProfile) {
  // Admin account_type always gets admin tier regardless of DB value
  const tier = userProfile?.account_type === 'admin'
    ? 'admin'
    : (userProfile?.subscription_tier ?? 'free');
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
  const isAdmin = tier === 'admin';
  const isPro   = tier === 'pro'   || isAdmin;
  const isBasic  = tier === 'basic' || isPro;

  // Check if a feature flag is enabled
  function can(feature) {
    if (isAdmin) return true;
    return !!limits[feature];
  }

  // Check if a usage-based action is within limits
  function withinLimit(action) {
    if (isAdmin) return { allowed: true, used: 0, max: null };

    const usageMap = {
      upload:            { used: userProfile?.uploads_this_week            ?? 0, max: limits.uploadsPerWeek },
      contact:           { used: userProfile?.contacts_this_month          ?? 0, max: limits.contactsPerMonth },
      opportunity:       { used: userProfile?.opportunities_this_month     ?? 0, max: limits.opportunitiesPerMonth },
      contractRevision:  { used: userProfile?.contract_revisions_this_month ?? 0, max: limits.contractRevisionsPerMonth },
    };

    const { used, max } = usageMap[action] ?? { used: 0, max: null };
    return {
      allowed: max === null || used < max,
      used,
      max,
      remaining: max === null ? null : Math.max(0, max - used),
    };
  }

  // Human-readable upgrade message for a blocked feature
  function upgradeMessage(feature) {
    const messages = {
      fullSplitAnalysis:  'Full contract analysis is available on Basic and Pro plans.',
      dealAnalyzer:       'The Deal Analyzer is a Pro feature. Upload any recording deal and get an instant AI breakdown.',
      agreementReader:    'Agreement Reader is available on the Pro plan.',
      proIpiEnrichment:   'PRO & IPI auto-enrichment is available on Basic and Pro plans.',
      advancedFilters:    'Advanced filters are available on Basic and Pro plans.',
      exportSplitSheet:   'Export split sheets as PDF or CSV on the Pro plan.',
      marketAnalytics:    'Market analytics are available on the Pro plan.',
      contractRevision:   'Contract Revision (powered by LegalSplits ML) is available on Basic and Pro plans.',
      contractVault:      'Save and manage contracts in your vault on Basic and Pro plans.',
      upload:             `You've reached your ${limits.uploadsPerWeek} uploads/week limit. Upgrade to Basic for unlimited uploads.`,
      contact:            `You've used all ${limits.contactsPerMonth} monthly contacts. Upgrade for more.`,
      opportunity:        `You've reached your ${limits.opportunitiesPerMonth} opportunity posts this month. Upgrade for more.`,
    };
    return messages[feature] ?? 'Upgrade your plan to access this feature.';
  }

  return {
    tier,
    limits,
    isAdmin,
    isPro,
    isBasic,
    can,
    withinLimit,
    upgradeMessage,
  };
}
