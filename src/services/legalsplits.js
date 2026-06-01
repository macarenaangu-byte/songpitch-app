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
 * POST /api/v1/analyze-split-sheet
 * @param {File} file — PDF file, max 10MB
 */
export async function analyzeSplitSheet(file) {
  if (!API_KEY) throw new Error('LegalSplits API key not configured (REACT_APP_LEGALSPLITS_API_KEY)');
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE_URL}/api/v1/analyze-split-sheet`, {
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
 * Generates a split sheet PDF via LegalSplits AI.
 * POST /api/v1/generate-split-sheet-pdf
 * Returns a Blob (application/pdf).
 */
export async function generateSplitSheetPdf(data) {
  if (!API_KEY) throw new Error('LegalSplits API key not configured (REACT_APP_LEGALSPLITS_API_KEY)');
  const res = await fetch(`${BASE_URL}/api/v1/generate-split-sheet-pdf`, {
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

// eslint-disable-next-line no-unused-vars
async function _generateSplitSheetPdfLocal(data) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 48, MR = 48, COL = PW - ML - MR;
  let y = 0;

  const fill  = (r, g, b) => doc.setFillColor(r, g, b);
  const stroke = (r, g, b) => doc.setDrawColor(r, g, b);
  const ink   = (r, g, b) => doc.setTextColor(r, g, b);

  // ── Header bar ──────────────────────────────────────────────────────────────
  fill(15, 15, 19);
  doc.rect(0, 0, PW, 72, 'F');

  fill(201, 168, 76);
  doc.rect(0, 68, PW, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  ink(201, 168, 76);
  doc.text('CODA-VAULT', ML, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  ink(120, 120, 140);
  doc.text('Split Sheet Agreement', ML, 54);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  ink(255, 255, 255);
  doc.text('CONFIDENTIAL', PW - MR, 38, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  ink(120, 120, 140);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, PW - MR, 54, { align: 'right' });

  y = 96;

  // ── Song details ─────────────────────────────────────────────────────────
  fill(245, 245, 252);
  doc.rect(ML, y, COL, 76, 'F');
  stroke(201, 168, 76);
  doc.setLineWidth(2);
  doc.line(ML, y + 4, ML, y + 72);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  ink(15, 15, 19);
  doc.text(data.song_title || 'Untitled', ML + 14, y + 26);

  const meta = [];
  if (data.date)         meta.push(`Date: ${data.date}`);
  if (data.isrc)         meta.push(`ISRC: ${data.isrc}`);
  if (data.upc)          meta.push(`UPC: ${data.upc}`);
  if (data.record_label) meta.push(`Label: ${data.record_label}`);
  if (data.split_type)   meta.push(`Type: ${data.split_type.charAt(0).toUpperCase() + data.split_type.slice(1)}`);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  ink(120, 120, 140);
  doc.text(meta.join('   ·   '), ML + 14, y + 46);

  if (data.has_samples && data.sample_info) {
    ink(220, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Contains samples: ${data.sample_info}`, ML + 14, y + 62);
  }

  y += 96;

  // ── Writers table ─────────────────────────────────────────────────────────
  const showComp   = !data.split_type || data.split_type === 'composition' || data.split_type === 'both';
  const showMaster = data.split_type === 'master' || data.split_type === 'both';

  const cols = [
    { label: 'Writer (Legal Name)',  w: 152 },
    { label: 'Stage Name',           w: 90  },
    { label: 'Role',                 w: 72  },
    { label: 'PRO',                  w: 50  },
    { label: 'IPI/CAE',              w: 72  },
    ...(showComp   ? [{ label: 'Comp %',   w: 50 }] : []),
    ...(showMaster ? [{ label: 'Master %', w: 56 }] : []),
  ];

  // Header row
  fill(15, 15, 19);
  doc.rect(ML, y, COL, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  ink(201, 168, 76);
  let cx = ML + 8;
  for (const col of cols) {
    doc.text(col.label, cx, y + 15);
    cx += col.w;
  }
  y += 24;

  // Data rows
  const writers = data.writers || [];
  for (let i = 0; i < writers.length; i++) {
    const w  = writers[i];
    const rh = w.publisher?.name ? 32 : 22;

    if (i % 2 === 0) { fill(252, 252, 255); } else { fill(255, 255, 255); }
    doc.rect(ML, y, COL, rh, 'F');
    stroke(230, 230, 240);
    doc.setLineWidth(0.5);
    doc.line(ML, y + rh, ML + COL, y + rh);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    ink(15, 15, 19);

    const cells = [
      w.legal_name  || '-',
      w.stage_name  || '-',
      w.role        || '-',
      w.pro && w.pro !== 'None' ? w.pro : '-',
      w.ipi         || '-',
      ...(showComp   ? [`${parseFloat(w.composition_percentage) || 0}%`] : []),
      ...(showMaster ? [`${parseFloat(w.master_percentage) || 0}%`]      : []),
    ];

    cx = ML + 8;
    for (let ci = 0; ci < cols.length; ci++) {
      const text   = String(cells[ci]);
      const maxW   = cols[ci].w - 10;
      const tw     = doc.getTextWidth(text);
      const label  = tw > maxW ? text.slice(0, Math.max(1, Math.floor(text.length * (maxW / tw)))) + '.' : text;
      doc.text(label, cx, y + 14);
      cx += cols[ci].w;
    }

    if (w.publisher?.name) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      ink(120, 120, 140);
      const pubLabel = `Publisher: ${w.publisher.name}${w.publisher.pro ? ` (${w.publisher.pro})` : ''}${w.publisher.ipi ? ` IPI: ${w.publisher.ipi}` : ''}${w.publisher.is_self_published ? ' · Self-pub' : ''}`;
      doc.text(pubLabel, ML + 16, y + 26);
    }

    y += rh;

    if (y > PH - 120 && i < writers.length - 1) {
      doc.addPage();
      y = 48;
    }
  }

  // Totals row
  if (writers.length > 0) {
    const totalComp   = writers.reduce((s, w) => s + (parseFloat(w.composition_percentage) || 0), 0);
    const totalMaster = writers.reduce((s, w) => s + (parseFloat(w.master_percentage) || 0), 0);

    fill(201, 168, 76);
    doc.rect(ML, y, COL, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    ink(15, 15, 19);
    doc.text('TOTAL', ML + 8, y + 14);

    cx = ML + 8;
    for (let ci = 0; ci < cols.length; ci++) {
      let val = '';
      if (showComp   && cols[ci].label === 'Comp %')   val = `${totalComp}%`;
      if (showMaster && cols[ci].label === 'Master %')  val = `${totalMaster}%`;
      if (val) {
        if ((showComp && totalComp !== 100) || (showMaster && totalMaster !== 100)) {
          ink(220, 80, 80);
        }
        doc.text(val, cx, y + 14);
        ink(15, 15, 19);
      }
      cx += cols[ci].w;
    }
    y += 22;
  }

  y += 32;

  // ── Notes ──────────────────────────────────────────────────────────────────
  if (data.notes) {
    if (y > PH - 80) { doc.addPage(); y = 48; }
    fill(245, 245, 252);
    doc.rect(ML, y, COL, 44, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    ink(201, 168, 76);
    doc.text('NOTES', ML + 10, y + 14);
    doc.setFont('helvetica', 'normal');
    ink(15, 15, 19);
    const noteLines = doc.splitTextToSize(String(data.notes), COL - 20);
    doc.text(noteLines.slice(0, 2), ML + 10, y + 28);
    y += 56;
  }

  // ── Signature blocks ──────────────────────────────────────────────────────
  if (y > PH - 200) { doc.addPage(); y = 48; }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  ink(15, 15, 19);
  doc.text('SIGNATURES', ML, y + 14);
  stroke(201, 168, 76);
  doc.setLineWidth(1);
  doc.line(ML, y + 17, ML + 80, y + 17);
  y += 28;

  const sigWriters = (data.writers || []).slice(0, 6);
  const sigCols    = Math.min(2, sigWriters.length || 1);
  const sigW       = (COL - (sigCols - 1) * 20) / sigCols;

  for (let i = 0; i < sigWriters.length; i += sigCols) {
    for (let j = 0; j < sigCols && i + j < sigWriters.length; j++) {
      const w   = sigWriters[i + j];
      const sx  = ML + j * (sigW + 20);
      const name = w.legal_name || w.stage_name || 'Writer';

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      ink(120, 120, 140);
      doc.text(name, sx, y);

      stroke(230, 230, 240);
      doc.setLineWidth(0.75);
      doc.line(sx, y + 28, sx + sigW - 8, y + 28);

      doc.setFontSize(7);
      doc.text('Signature', sx, y + 38);
      doc.line(sx, y + 62, sx + sigW - 8, y + 62);
      doc.text('Date', sx, y + 72);
    }
    y += 84;
    if (y > PH - 80 && i + sigCols < sigWriters.length) { doc.addPage(); y = 48; }
  }

  // ── Footer on every page ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages ? doc.getNumberOfPages() : doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    fill(15, 15, 19);
    doc.rect(0, PH - 28, PW, 28, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    ink(120, 120, 140);
    doc.text('Generated by Coda-Vault · coda-vault.com · For internal use only.', ML, PH - 10);
    doc.text(`Page ${p} of ${totalPages}`, PW - MR, PH - 10, { align: 'right' });
  }

  return doc.output('blob');
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
