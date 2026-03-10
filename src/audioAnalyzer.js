// audioAnalyzer.js
// Browser-based audio analysis using Essentia.js WASM + ML prediction server
// Extracts: duration, BPM, key, genre (ML), and mood (rule-based) from uploaded audio files
import { logger } from './lib/logger';

// Cache the Essentia instance so we only initialize once
let essentiaInstance = null;

// ─── ML LABEL MAPS ──────────────────────────────────────────────────────────
// Map the ML model's clean labels (lowercased) to the app's display labels
// ML server returns labels like "HIP-HOP", "FILM SCORE" — we lowercase for lookup

const GENRE_LABEL_MAP = {
    'alternative': 'Alternative',
    'ambient': 'Ambient',
    'afrobeats': 'Afrobeats',
    'blues': 'Blues',
    'country': 'Country',
    'edm': 'EDM',
    'electronic': 'Electronic',
    'film score': 'Film Score',
    'folk': 'Folk',
    'hip-hop': 'Hip-Hop',
    'indie': 'Indie',
    'jazz': 'Jazz',
    'latin': 'Latin',
    'orchestral': 'Classical',
    'pop': 'Pop',
    'r&b': 'R&B',
    'reggae': 'Reggae',
    'rock': 'Rock',
    'world music': 'World Music',
    // Backward compat with old model format
    'genre_orchestral': 'Classical',
    'genre_film_score': 'Film Score',
    'genre_electronic': 'Electronic',
    'genre_pop': 'Pop',
    'genre_rock': 'Rock',
    'genre_jazz': 'Jazz',
    'genre_folk': 'Folk',
    'genre_alternative': 'Alternative',
    'genre_r&b': 'R&B',
    'genre_latin': 'Latin',
};

const MOOD_LABEL_MAP = {
    'aggressive': 'Aggressive',
    'atmospheric': 'Dreamy',
    'calm': 'Calm',
    'dark': 'Dark',
    'energetic': 'Energetic',
    'epic': 'Epic',
    'happy': 'Uplifting',
    'melancholic': 'Melancholic',
    'mysterious': 'Mysterious',
    'nostalgic': 'Nostalgic',
    'playful': 'Playful',
    'romantic': 'Romantic',
    'suspense': 'Tense',
    'triumphant': 'Triumphant',
    // Backward compat with old model format
    'mood_happy': 'Uplifting',
    'mood_melancholic': 'Melancholic',
    'mood_energetic': 'Energetic',
    'mood_calm': 'Calm',
    'mood_atmospheric': 'Dreamy',
    'mood_romantic': 'Romantic',
    'mood_suspense': 'Tense',
};

// ─── ML PREDICTION ──────────────────────────────────────────────────────────
// Sends audio file to the FastAPI ML server for genre/mood prediction

async function predictGenreMood(file) {
    const apiUrl = process.env.REACT_APP_AI_API_URL;
    if (!apiUrl) {
        logger.debug('No AI API URL configured, skipping ML prediction');
        return null;
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${apiUrl}/predict`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            logger.warn(`ML server returned ${response.status}`);
            return null;
        }

        const data = await response.json();

        // Check for error response
        if (data.error) {
            logger.warn('ML prediction error:', data.error);
            return null;
        }

        let genre = null;
        let mood = null;
        let secondaryGenre = null;

        // Parse genre from new response format: { genre: "HIP-HOP", secondary_genre: "R&B", mood: "HAPPY", ... }
        if (data.genre) {
            genre = GENRE_LABEL_MAP[data.genre.toLowerCase()] || data.genre;
        }
        if (data.mood) {
            mood = MOOD_LABEL_MAP[data.mood.toLowerCase()] || data.mood;
        }
        if (data.secondary_genre) {
            secondaryGenre = GENRE_LABEL_MAP[data.secondary_genre.toLowerCase()] || data.secondary_genre;
        }

        // Fallback: check predictions array (backward compat with old server)
        if (!genre && data.predictions) {
            for (const pred of data.predictions) {
                const clean = pred.toLowerCase();
                if (!genre) genre = GENRE_LABEL_MAP[clean] || null;
                if (!mood) mood = MOOD_LABEL_MAP[clean] || null;
            }
        }

        const conf = data.genre_confidence ? (data.genre_confidence * 100).toFixed(1) : '?';
        logger.debug(`ML prediction: genre=${genre} (${conf}%), secondary=${secondaryGenre}, mood=${mood}`);
        return { genre, mood, secondaryGenre, confidence: data.genre_confidence || 0 };
    } catch (err) {
        logger.debug('ML server unreachable, using rule-based fallback');
        return null;
    }
}

// ─── LYRICS TRANSCRIPTION ──────────────────────────────────────────────────
// Sends audio file to the FastAPI server for Whisper-powered lyrics transcription

async function transcribeLyrics(file) {
    const apiUrl = process.env.REACT_APP_AI_API_URL;
    if (!apiUrl) return null;

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${apiUrl}/transcribe`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (data.status === 'success' && data.lyrics) {
            logger.debug(`Lyrics transcribed: ${data.lyrics.substring(0, 80)}...`);
            return data.lyrics;
        }
        return null;
    } catch (err) {
        logger.debug('Lyrics transcription unavailable');
        return null;
    }
}

// Load a script tag and return a promise that resolves when loaded
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) { resolve(); return; }

        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
}

// Initialize Essentia WASM + core library, returns cached instance
async function loadEssentia() {
    if (essentiaInstance) return essentiaInstance;

    const publicUrl = process.env.PUBLIC_URL || '';

    // Step 1: Load the WASM loader (defines window.EssentiaWASM)
    await loadScript(publicUrl + '/essentia-wasm.web.js');

    // Step 2: Load the core Essentia.js library (defines window.Essentia)
    await loadScript(publicUrl + '/essentia.js-core.umd.js');

    if (!window.EssentiaWASM) {
        throw new Error('EssentiaWASM not found after loading essentia-wasm.web.js');
    }
    if (!window.Essentia) {
        throw new Error('Essentia not found after loading essentia.js-core.umd.js');
    }

    // Step 3: Initialize the WASM module (returns a promise)
    const wasmModule = await window.EssentiaWASM();

    // Step 4: Create Essentia instance with the WASM module
    essentiaInstance = new window.Essentia(wasmModule, false);
    logger.debug('Essentia.js initialized — version:', essentiaInstance.version);

    return essentiaInstance;
}

// Decode an audio file to mono Float32Array signal
async function decodeAudio(file) {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Get mono channel data
    let signal;
    if (audioBuffer.numberOfChannels === 1) {
        signal = audioBuffer.getChannelData(0);
    } else {
        signal = audioBuffer.getChannelData(0);
    }

    // Close the audio context to free resources
    await audioCtx.close();

    return { audioBuffer, signal };
}

// ─── GENRE CLASSIFICATION (rule-based fallback) ─────────────────────────────
// Uses audio features (BPM, danceability, energy, dynamic complexity, key)
// to estimate genre. Used as fallback when ML server is unavailable.

function classifyGenre(features) {
    const { bpm, danceability, energy, dynamicComplexity, key, scale } = features;

    // Very slow + minor key + low energy → Classical
    if (bpm && bpm < 90 && energy < 0.15 && dynamicComplexity > 3) return 'Classical';

    // Slow + high dynamic range → Film Score
    if (bpm && bpm < 100 && dynamicComplexity > 5) return 'Film Score';

    // Very low energy + slow → Ambient
    if (energy < 0.05 && bpm && bpm < 100) return 'Ambient';

    // Moderate tempo + minor key + medium energy → Jazz
    if (bpm && bpm >= 80 && bpm <= 150 && scale === 'minor' && danceability > 0.8) return 'Jazz';

    // High danceability + fast → Pop or EDM
    if (danceability > 1.2 && bpm && bpm > 115) return 'Pop';

    // Very fast + high energy → EDM
    if (bpm && bpm > 130 && energy > 0.3) return 'EDM';

    // Moderate + major key + medium danceability → Pop
    if (bpm && bpm >= 100 && bpm <= 130 && scale === 'major' && danceability > 0.7) return 'Pop';

    // Slow + minor + low danceability → Classical or Film Score
    if (bpm && bpm < 80 && scale === 'minor') return 'Classical';

    // Slow to moderate + major + gentle → Folk
    if (bpm && bpm >= 70 && bpm <= 110 && scale === 'major' && energy < 0.15) return 'Folk';

    // Moderate + higher energy → Rock
    if (bpm && bpm >= 100 && bpm <= 160 && energy > 0.25) return 'Rock';

    // Medium tempo + minor → Blues
    if (bpm && bpm >= 60 && bpm <= 110 && scale === 'minor' && energy < 0.2) return 'Blues';

    // Default: slow/moderate classical-leaning → Classical (good default for piano)
    if (bpm && bpm < 120 && energy < 0.2) return 'Classical';

    // Fallback
    return 'Indie';
}

// ─── MOOD CLASSIFICATION (always rule-based) ─────────────────────────────────
// Uses audio features to estimate mood/emotional character.

function classifyMood(features) {
    const { bpm, energy, dynamicComplexity, danceability, scale } = features;

    // High energy + fast → Energetic
    if (energy > 0.3 && bpm && bpm > 120) return 'Energetic';

    // Very high dynamic complexity + minor → Epic
    if (dynamicComplexity > 6 && scale === 'minor') return 'Epic';

    // High dynamic complexity + fast → Triumphant
    if (dynamicComplexity > 5 && bpm && bpm > 110 && scale === 'major') return 'Triumphant';

    // Very slow + very low energy → Dreamy
    if (bpm && bpm < 70 && energy < 0.05) return 'Dreamy';

    // Slow + minor + low energy → Melancholic
    if (bpm && bpm < 90 && scale === 'minor' && energy < 0.15) return 'Melancholic';

    // Slow + minor + moderate energy → Dark
    if (bpm && bpm < 100 && scale === 'minor' && energy >= 0.15) return 'Dark';

    // Slow + major + low energy → Calm
    if (bpm && bpm < 95 && scale === 'major' && energy < 0.15) return 'Calm';

    // Moderate + major + low-medium energy → Romantic
    if (bpm && bpm >= 60 && bpm <= 110 && scale === 'major' && energy < 0.2) return 'Romantic';

    // Moderate + major + danceable → Uplifting
    if (scale === 'major' && danceability > 0.8 && bpm && bpm >= 100) return 'Uplifting';

    // Fast + major + danceable → Playful
    if (bpm && bpm > 120 && scale === 'major' && danceability > 1.0) return 'Playful';

    // Moderate + minor + some complexity → Mysterious
    if (scale === 'minor' && dynamicComplexity > 3 && bpm && bpm >= 80 && bpm <= 120) return 'Mysterious';

    // Slow-moderate + gentle → Nostalgic
    if (bpm && bpm >= 70 && bpm <= 100 && energy < 0.12) return 'Nostalgic';

    // Medium energy + moderate tempo → Tense
    if (scale === 'minor' && bpm && bpm >= 100) return 'Tense';

    // Default for calm instrumentals
    return 'Calm';
}

// ─── MAIN ANALYSIS ─────────────────────────────────────────────────────────
// Hybrid approach: ML for genre (when server available), rule-based for mood

export async function analyzeAudioFile(file) {
    const essentia = await loadEssentia();
    const { audioBuffer, signal } = await decodeAudio(file);

    const duration = audioBuffer.duration;

    // Convert JS Float32Array → Essentia VectorFloat (required by all algorithms)
    const vectorSignal = essentia.arrayToVector(signal);

    // ── BPM ──
    let bpm = null;
    try {
        const rhythm = essentia.RhythmExtractor2013(vectorSignal);
        bpm = Math.round(rhythm.bpm);
        if (bpm <= 0 || bpm > 300) bpm = null;
    } catch (err) {
        logger.warn('BPM extraction failed:', err.message);
    }

    // ── Key & Scale ──
    let key = null;
    let scale = null;
    try {
        const keyData = essentia.KeyExtractor(vectorSignal);
        if (keyData.key && keyData.key !== '' && keyData.key !== 'none') {
            scale = keyData.scale || null;
            key = scale ? `${keyData.key} ${scale}` : keyData.key;
        }
    } catch (err) {
        logger.warn('Key extraction failed:', err.message);
    }

    // ── Energy ──
    let energy = 0;
    try {
        const result = essentia.Energy(vectorSignal);
        energy = result.energy || 0;
    } catch (err) {
        logger.warn('Energy extraction failed:', err.message);
    }

    // ── Danceability ──
    let danceability = 0;
    try {
        const result = essentia.Danceability(vectorSignal);
        danceability = result.danceability || 0;
    } catch (err) {
        logger.warn('Danceability extraction failed:', err.message);
    }

    // ── Dynamic Complexity ──
    let dynamicComplexity = 0;
    try {
        const result = essentia.DynamicComplexity(vectorSignal);
        dynamicComplexity = result.dynamicComplexity || 0;
    } catch (err) {
        logger.warn('Dynamic complexity extraction failed:', err.message);
    }

    // ── Classify genre and mood ──
    const featureBundle = { bpm, energy, danceability, dynamicComplexity, key, scale };

    let genre;
    let mood;
    let secondaryGenre = null;
    let genreSource = 'rule-based';
    let moodSource = 'rule-based';

    // Try ML prediction for genre AND mood (retrained models are more accurate)
    const mlResult = await predictGenreMood(file);
    if (mlResult) {
        if (mlResult.genre) {
            genre = mlResult.genre;
            genreSource = 'ML';
        }
        if (mlResult.secondaryGenre) {
            secondaryGenre = mlResult.secondaryGenre;
        }
        if (mlResult.mood) {
            mood = mlResult.mood;
            moodSource = 'ML';
        }
    }

    // Fallback to rule-based if ML didn't provide results
    if (!genre) genre = classifyGenre(featureBundle);
    if (!mood) mood = classifyMood(featureBundle);

    // Try lyrics transcription (runs in parallel conceptually, but sequentially here)
    let lyrics = null;
    try {
        lyrics = await transcribeLyrics(file);
    } catch (err) {
        logger.debug('Lyrics transcription skipped');
    }

    logger.debug(`Analysis complete: Duration=${duration.toFixed(1)}s BPM=${bpm} Key=${key} Genre=${genre}(${genreSource}) Mood=${mood}(${moodSource})`);

    return { duration, bpm, key, genre, mood, secondaryGenre, lyrics };
}
