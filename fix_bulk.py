#!/usr/bin/env python3
import re

filepath = '/Users/macarena.nadeau/Desktop/songpitch-app/src/pages/PortfolioPage.jsx'

with open(filepath, 'r') as f:
    content = f.read()

print(f"Original length: {len(content)} chars")

# ─────────────────────────────────────────────────────────────────────────────
# REPLACEMENT 1: handleBulkFiles — strip out AI analysis, just read ID3+duration
# ─────────────────────────────────────────────────────────────────────────────
old_handle_bulk_start = '  const handleBulkFiles = async (e) => {'
old_handle_bulk_end = '  };\n\n  const getAudioDuration'

start_idx = content.find(old_handle_bulk_start)
end_idx = content.find(old_handle_bulk_end)

if start_idx == -1 or end_idx == -1:
    print(f"ERROR: Could not find handleBulkFiles bounds (start={start_idx}, end={end_idx})")
else:
    new_handle_bulk = r"""  const handleBulkFiles = async (e) => {
    const files = Array.from(e.target.files);
    setBulkFiles(files);
    setShowBulk(true);

    // Read ID3 metadata + duration quickly — AI analysis runs at upload time
    const processed = [];
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const duration = await getAudioDuration(file);
      let id3Title = file.name.replace(/\.(mp3|wav|m4a|flac|ogg)$/i, '');
      let id3Artist = '', id3Album = '', id3Year = new Date().getFullYear();
      let id3Genre = '', id3Bpm = '', id3Key = '';
      try {
        const metadata = await parseBlob(file);
        id3Title = metadata.common.title || id3Title;
        id3Artist = metadata.common.artist || '';
        id3Album = metadata.common.album || '';
        id3Year = metadata.common.year || new Date().getFullYear();
        id3Genre = metadata.common.genre?.[0] || '';
        id3Bpm = metadata.common.bpm ? Math.round(metadata.common.bpm).toString() : '';
        id3Key = metadata.common.key || '';
      } catch (err) {
        console.warn(`ID3 read failed for ${file.name}:`, err);
      }
      processed.push({
        file,
        title: id3Title,
        artist: id3Artist,
        album: id3Album,
        duration: formatDuration(duration),
        genre: id3Genre,
        secondary_genre: '',
        bpm: id3Bpm,
        instrument_type: '',
        licensing_status: '',
        ownership_percentage: '',
        is_one_stop: false,
        key: id3Key,
        mood: '',
        description: '',
        year: id3Year,
        aiAnalyzed: false,
      });
    }
    setBulkData(processed);
    setBulkStep('definition');
  };

  const getAudioDuration"""

    content = content[:start_idx] + new_handle_bulk + content[end_idx + len(old_handle_bulk_end):]
    print("✅ Replaced handleBulkFiles")

# ─────────────────────────────────────────────────────────────────────────────
# REPLACEMENT 2: saveBulkSongs — add AI analysis phase before upload
# ─────────────────────────────────────────────────────────────────────────────
old_save_start = '  const saveBulkSongs = async () => {'
old_save_end = '  };\n\n  const handleDragEnter'

save_start_idx = content.find(old_save_start)
save_end_idx = content.find(old_save_end)

if save_start_idx == -1 or save_end_idx == -1:
    print(f"ERROR: Could not find saveBulkSongs bounds (start={save_start_idx}, end={save_end_idx})")
else:
    new_save_bulk = r"""  const saveBulkSongs = async () => {
    const invalidRows = bulkData
      .map((item, idx) => {
        const missing = [];
        if (!item.licensing_status || !String(item.licensing_status).trim()) missing.push('Licensing Status');
        if (item.licensing_status === ADMIN_CO_OWNED_LABEL && (!item.ownership_percentage || Number.isNaN(parseInt(item.ownership_percentage, 10)))) missing.push('Ownership %');
        return missing.length ? { row: idx + 1, missing } : null;
      })
      .filter(Boolean);

    if (invalidRows.length > 0) {
      const first = invalidRows[0];
      showToast(`Row ${first.row} is missing: ${first.missing.join(', ')}`, 'error');
      return;
    }

    // Phase 1: AI analysis — run sequentially so Essentia WASM doesn't crash
    const analyzedData = bulkData.map(item => ({ ...item }));
    for (let idx = 0; idx < bulkData.length; idx++) {
      const item = bulkData[idx];
      setBulkAnalyzing(`Analyzing "${item.title}" (${idx + 1} of ${bulkData.length})...`);
      try {
        const analysis = await analyzeAudioFile(item.file);
        analyzedData[idx].genre = analysis.genre || item.genre;
        analyzedData[idx].bpm = analysis.bpm ? Math.round(analysis.bpm).toString() : item.bpm;
        analyzedData[idx].key = analysis.key || item.key;
        analyzedData[idx].mood = analysis.mood || item.mood;
        analyzedData[idx].secondary_genre = analysis.secondaryGenre || item.secondary_genre;
        if (analysis.duration) {
          analyzedData[idx].duration = formatDuration(Math.round(analysis.duration));
        }
        analyzedData[idx].aiAnalyzed = true;
      } catch (err) {
        console.warn(`AI analysis failed for ${item.title}:`, err);
      }
    }
    setBulkAnalyzing('');

    // Phase 2: Upload to Supabase
    setLoading(true);
    try {
      for (let index = 0; index < analyzedData.length; index++) {
        const item = analyzedData[index];
        if (!item.file) continue;

        const fileExt = item.file.name.split('.').pop();
        const fileName = `${userProfile.id}/${Date.now()}_${index}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('song-files')
          .upload(fileName, item.file);

        if (uploadError) {
          console.error(`Error uploading ${item.file.name}:`, uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('song-files')
          .getPublicUrl(fileName);
        const audioUrl = urlData.publicUrl;

        const { error: insertError } = await supabase
          .from('songs')
          .insert([{
            composer_id: userProfile.id,
            title: item.title,
            primary_genre: item.genre || null,
            secondary_genre: item.secondary_genre || null,
            genre: item.genre || null,
            duration: item.duration || null,
            bpm: item.bpm ? parseInt(item.bpm) : null,
            instrument_type: item.instrument_type || null,
            licensing_status: item.licensing_status === ADMIN_CO_OWNED_LABEL
              ? `${ADMIN_CO_OWNED_LABEL} (${parseInt(item.ownership_percentage, 10)}%)`
              : (item.licensing_status || null),
            is_one_stop: item.licensing_status === ONE_STOP_LABEL,
            key: item.key || null,
            mood: item.mood || null,
            mood_tags: item.mood ? [item.mood] : null,
            description: item.description || null,
            year: item.year || null,
            audio_url: audioUrl,
          }]);

        if (insertError) {
          console.error(`Error inserting song row for ${item.title}:`, insertError);
        }
      }

      showToast(`${analyzedData.length} songs uploaded successfully!`, "success");
      setBulkData([]);
      setBulkFiles([]);
      setShowBulk(false);
      setBulkStep(null);
      loadSongs();
    } catch (err) {
      showToast(friendlyError(err), "error");
    } finally {
      setLoading(false);
      setBulkAnalyzing('');
    }
  };

  const handleDragEnter"""

    content = content[:save_start_idx] + new_save_bulk + content[save_end_idx + len(old_save_end):]
    print("✅ Replaced saveBulkSongs")

# ─────────────────────────────────────────────────────────────────────────────
# REPLACEMENT 3: Metadata table section — add loading overlay when AI is running
# The card currently has: header | table | one-stop note | button row
# New:                    header | IF bulkAnalyzing → loading panel ELSE table + note + button
# ─────────────────────────────────────────────────────────────────────────────

# Find the overflowX table div inside the metadata card
old_table_start = '          <div style={{ overflowX: "auto" }}>'
old_button_row = '          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>'

# Find the end of the button row closing div + closing of whole metadata card
# We need to find from old_table_start to the end of the metadata card's inner content
# The metadata card ends with:
#   </div>         <- closes button row
#   </div>         <- closes the card

table_start_idx = content.find(old_table_start)
button_row_idx = content.find(old_button_row)

if table_start_idx == -1 or button_row_idx == -1:
    print(f"ERROR: Could not find table/button markers (table={table_start_idx}, button={button_row_idx})")
else:
    # Find the end of the button row: two closing </div> tags after the button row
    # The button row div contains: button + optional bulkAnalyzing spinner
    # It ends with:    </div>\n          </div>\n        )}\n
    # Let's find the exact end by looking for ")}" after button row
    # Actually let's find the pattern "          </div>\n        )}\n\n      {/* Songs List"
    old_metadata_end_marker = '          </div>\n        )}\n\n      {/* Songs List'
    metadata_end_idx = content.find(old_metadata_end_marker)
    
    if metadata_end_idx == -1:
        print("ERROR: Could not find metadata card end marker")
    else:
        # The section to replace is from table_start_idx to metadata_end_idx + len of the end marker
        end_marker_full = '          </div>\n        )}'
        metadata_end_full_idx = content.find(end_marker_full, button_row_idx)
        
        if metadata_end_full_idx == -1:
            print("ERROR: Could not find full end marker")
        else:
            old_section = content[table_start_idx:metadata_end_full_idx + len(end_marker_full)]
            
            new_section = r"""          {bulkAnalyzing ? (
            /* ── AI Analysis Loading Screen ── */
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
          </div>
        )}"""

            content = content[:table_start_idx] + new_section + content[metadata_end_full_idx + len(end_marker_full):]
            print("✅ Replaced metadata table section with loading overlay")

with open(filepath, 'w') as f:
    f.write(content)

print(f"Final length: {len(content)} chars")
print("Done!")
