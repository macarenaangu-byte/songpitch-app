/**
 * LegalSplits AI API client for SongPitch Hub.
 *
 * Provides PRO/IPI enrichment for split sheets by calling the
 * LegalSplits AI `/v1/enrich-splits` endpoint.
 *
 * Environment variables required (in .env.local):
 *   REACT_APP_LEGALSPLITS_API_URL  — base URL, e.g. https://legalsplits-ai.netlify.app
 *   REACT_APP_LEGALSPLITS_API_KEY  — API key starting with lsai_
 */

const BASE_URL = process.env.REACT_APP_LEGALSPLITS_API_URL ?? 'https://legalsplits-ai.netlify.app'
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
