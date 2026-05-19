/**
 * LegalSplits AI API client for SongPitch Hub.
 *
 * Provides PRO/IPI enrichment for split sheets by calling the
 * LegalSplits AI `/v1/enrich-splits` endpoint.
 *
 * Environment variables required (in .env.local):
 *   REACT_APP_LEGALSPLITS_API_URL  — base URL, e.g. https://legalsplits-ai.onrender.com
 *   REACT_APP_LEGALSPLITS_API_KEY  — API key starting with lsai_
 */

const BASE_URL = process.env.REACT_APP_LEGALSPLITS_API_URL ?? 'https://legalsplits-ai.onrender.com'
const API_KEY  = process.env.REACT_APP_LEGALSPLITS_API_KEY ?? ''

/**
 * Enriches a split sheet with PRO affiliations and IPI numbers.
 *
 * @param {object} params
 * @param {string} params.song_title
 * @param {Array<{name: string, percentage: number, role?: string}>} params.composition_splits
 * @param {Array<{name: string, percentage: number, role?: string}>} params.master_splits
 *
 * @returns {Promise<{
 *   song_title: string,
 *   composition_splits: Array<{name: string, percentage: number, role?: string, ipi: string|null, pro: string|null}>,
 *   master_splits: Array<{name: string, percentage: number, role?: string, ipi: string|null, pro: string|null}>,
 *   enriched_at: string,
 *   sources: string[]
 * }>}
 */
/**
 * Analyzes a split sheet PDF and returns structured data.
 * POST /api/dashboard/split-sheets/analyze
 * @param {File} file — PDF file, max 10MB
 */
export async function analyzeSplitSheet(file) {
  if (!API_KEY) throw new Error('LegalSplits API key not configured (REACT_APP_LEGALSPLITS_API_KEY)');
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE_URL}/api/dashboard/split-sheets/analyze`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    body: fd,
  });
  if (!res.ok) {
    let message = `LegalSplits API error (${res.status})`;
    try { const d = await res.json(); if (d.error) message = d.error; } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.json();
}

/**
 * Generates a split sheet PDF from structured data.
 * POST /api/dashboard/split-sheets/generate-pdf
 * Returns a Blob (application/pdf).
 */
export async function generateSplitSheetPdf(data) {
  if (!API_KEY) throw new Error('LegalSplits API key not configured (REACT_APP_LEGALSPLITS_API_KEY)');
  const res = await fetch(`${BASE_URL}/api/dashboard/split-sheets/generate-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = `LegalSplits API error (${res.status})`;
    try { const d = await res.json(); if (d.error) message = d.error; } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.blob();
}

export async function enrichSplits({ song_title, composition_splits, master_splits }) {
  if (!API_KEY) {
    throw new Error('LegalSplits API key not configured (REACT_APP_LEGALSPLITS_API_KEY)')
  }

  const res = await fetch(`${BASE_URL}/api/v1/enrich-splits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ song_title, composition_splits, master_splits }),
  })

  if (!res.ok) {
    let message = `LegalSplits API error (${res.status})`
    try {
      const data = await res.json()
      if (data.error) message = data.error
    } catch { /* ignore parse errors */ }
    throw new Error(message)
  }

  return res.json()
}
