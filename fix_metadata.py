#!/usr/bin/env python3
filepath = '/Users/macarena.nadeau/Desktop/songpitch-app/src/pages/PortfolioPage.jsx'

with open(filepath, 'r') as f:
    lines = f.readlines()

# Find the line numbers (1-based) of the markers
start_line = None
end_line = None

for i, line in enumerate(lines):
    if '          <div style={{ overflowX: "auto" }}>' in line and start_line is None:
        start_line = i  # 0-based index of first line to replace
    if '        </div>' in line and start_line is not None and end_line is None:
        # This is the closing of the card div, just after button row
        end_line = i  # 0-based index, this line stays (it closes the card)
        break

print(f"start_line (0-based): {start_line} -> '{lines[start_line].rstrip()}'")
print(f"end_line (0-based):   {end_line} -> '{lines[end_line].rstrip()}'")
print(f"line before end:      {end_line-1} -> '{lines[end_line-1].rstrip()}'")

# The lines to replace are start_line through end_line-1 (inclusive)
# We keep end_line and everything after

new_section = """          {bulkAnalyzing ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, border: `3px solid ${DESIGN_SYSTEM.colors.brand.primary}30`, borderTopColor: DESIGN_SYSTEM.colors.brand.primary, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 24px' }} />
              <div style={{ color: DESIGN_SYSTEM.colors.text.primary, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 10 }}>
                AI is analyzing your songs...
              </div>
              <div style={{ color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
                {bulkAnalyzing}
              </div>
              <div style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
                This might take a little bit — please don't close this window
              </div>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Title</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Duration</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Primary Genre</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Secondary Genre</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>BPM</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Instrument Type</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Licensing Status*</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Ownership %</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Key</th>
                      <th style={{ color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 12, fontWeight: 600, textAlign: "left", padding: "10px", fontFamily: "'Outfit', sans-serif" }}>Mood</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkData.map((item, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
                        <td style={{ padding: "10px" }}><input value={item.title} onChange={e => updateBulkField(i, 'title', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }} /></td>
                        <td style={{ padding: "10px", color: DESIGN_SYSTEM.colors.text.tertiary, fontSize: 13 }}>{item.duration}</td>
                        <td style={{ padding: "10px" }}><select value={item.genre} onChange={e => updateBulkField(i, 'genre', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.genre ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Genre...</option>{songGenreOptions.map(g => <option key={g} value={g}>{g}</option>)}</select></td>
                        <td style={{ padding: "10px" }}><input value={item.secondary_genre || ''} onChange={e => updateBulkField(i, 'secondary_genre', e.target.value)} placeholder="Optional" style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }} /></td>
                        <td style={{ padding: "10px" }}><input value={item.bpm} onChange={e => updateBulkField(i, 'bpm', e.target.value)} type="number" style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }} /></td>
                        <td style={{ padding: "10px" }}><select value={item.instrument_type || ''} onChange={e => updateBulkField(i, 'instrument_type', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.instrument_type ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Type...</option><option value="Vocal">Vocal</option><option value="Instrumental">Instrumental</option></select></td>
                        <td style={{ padding: "10px" }}><select value={item.licensing_status || ''} onChange={e => handleBulkLicensingStatusChange(i, e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.licensing_status ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Required...</option><option value={ONE_STOP_LABEL}>{ONE_STOP_LABEL}</option><option value={ADMIN_CO_OWNED_LABEL}>{ADMIN_CO_OWNED_LABEL}</option><option value={PENDING_NEGOTIATION_LABEL}>{PENDING_NEGOTIATION_LABEL}</option></select></td>
                        <td style={{ padding: "10px" }}><input value={item.ownership_percentage || ''} onChange={e => updateBulkField(i, 'ownership_percentage', e.target.value)} type="number" min={1} max={100} placeholder={item.licensing_status === ADMIN_CO_OWNED_LABEL ? 'Required' : 'N/A'} disabled={item.licensing_status !== ADMIN_CO_OWNED_LABEL} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif", opacity: item.licensing_status !== ADMIN_CO_OWNED_LABEL ? 0.5 : 1 }} /></td>
                        <td style={{ padding: "10px" }}><input value={item.key} onChange={e => updateBulkField(i, 'key', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: DESIGN_SYSTEM.colors.text.primary, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }} /></td>
                        <td style={{ padding: "10px" }}><select value={item.mood} onChange={e => updateBulkField(i, 'mood', e.target.value)} style={{ width: "100%", background: DESIGN_SYSTEM.colors.bg.primary, border: `1px solid ${DESIGN_SYSTEM.colors.border.light}`, borderRadius: 6, padding: "6px 8px", color: item.mood ? DESIGN_SYSTEM.colors.text.primary : DESIGN_SYSTEM.colors.text.muted, fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif" }}><option value="">Mood...</option>{moodOptions.map(m => <option key={m} value={m}>{m}</option>)}</select></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, color: DESIGN_SYSTEM.colors.brand.primary, fontSize: 12, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                One-Stop tracks are prioritized in executive searches for sync opportunities.
              </div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={saveBulkSongs} disabled={loading} style={{ background: DESIGN_SYSTEM.colors.accent.purple, color: DESIGN_SYSTEM.colors.text.primary, border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Uploading..." : `Upload All ${bulkData.length} Songs`}
                </button>
              </div>
            </>
          )}
"""

new_lines = lines[:start_line] + [new_section] + lines[end_line:]

with open(filepath, 'w') as f:
    f.writelines(new_lines)

print(f"✅ Replaced lines {start_line}–{end_line-1} with loading overlay + table")
print(f"Total lines: {len(new_lines)}")
