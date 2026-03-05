import { supabase } from './supabase';

// ─── FRIENDLY ERROR HELPER ──────────────────────────────────────────────────
export const friendlyError = (err) => {
  if (!err) return 'Something went wrong. Please try again.';
  const msg = err.message || String(err);
  const code = err.code || '';
  if (code === '23505' || msg.includes('duplicate key')) return 'This already exists.';
  if (code === '23503') return 'This item is referenced elsewhere and cannot be removed.';
  if (code === 'PGRST116') return 'Item not found.';
  if (code === 'PGRST301' || msg.includes('JWT expired') || msg.includes('token')) return 'Your session has expired. Please refresh the page and sign in again.';
  if (msg.includes('Invalid login')) return 'Invalid email or password. Please try again.';
  if (msg.includes('User already registered')) return 'An account with this email already exists. Try signing in instead.';
  if (msg.includes('Email not confirmed')) return 'Please verify your email before signing in. Check your inbox.';
  if (msg.includes('Password should be')) return msg;
  if (msg.includes('Network') || msg.includes('fetch')) return 'Network error. Please check your connection and try again.';
  if (msg.includes('storage') || msg.includes('bucket')) return 'File upload failed. Please try again with a smaller file.';
  return 'Something went wrong. Please try again.';
};

// ─── NOTIFICATION HELPERS ───────────────────────────────────────────────────
export const insertNotification = async (userId, type, title, body, metadata = {}) => {
  try {
    await supabase.from('notifications').insert([{ user_id: userId, type, title, body, metadata }]);
  } catch (err) {
    console.error('Notification insert failed:', err);
  }
};

export const insertNotificationBatch = async (userIds, type, title, body, metadata = {}) => {
  if (!userIds.length) return;
  try {
    const rows = userIds.map(uid => ({ user_id: uid, type, title, body, metadata }));
    await supabase.from('notifications').insert(rows);
  } catch (err) {
    console.error('Batch notification insert failed:', err);
  }
};

// ─── IMAGE COMPRESSION ─────────────────────────────────────────────────────
export const compressImage = (file, maxWidth = 400, quality = 0.8) => {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        resolve(blob);
      }, 'image/jpeg', quality);
    };
    img.src = objectUrl;
  });
};

// ── Waveform Peak Extraction ──
// Fetches audio, decodes to PCM, downsamples to N peaks for waveform visualization
const waveformCache = {};
export const extractWaveformPeaks = async (audioUrl, numBars = 100) => {
  if (waveformCache[audioUrl]) return waveformCache[audioUrl];
  try {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    audioCtx.close();

    const rawData = audioBuffer.getChannelData(0);
    const samplesPerBar = Math.floor(rawData.length / numBars);
    const peaks = [];

    for (let i = 0; i < numBars; i++) {
      let max = 0;
      const start = i * samplesPerBar;
      for (let j = start; j < start + samplesPerBar && j < rawData.length; j++) {
        const abs = Math.abs(rawData[j]);
        if (abs > max) max = abs;
      }
      peaks.push(max);
    }

    const maxPeak = Math.max(...peaks, 0.01);
    const normalized = peaks.map(p => p / maxPeak);
    waveformCache[audioUrl] = normalized;
    return normalized;
  } catch (err) {
    console.warn('Waveform extraction failed:', err);
    return null;
  }
};
