import { useState, useEffect } from 'react';
import { showToast } from '../lib/toast';
import { extractWaveformPeaks } from '../lib/utils';
import { supabase } from '../lib/supabase';

export function useAudioPlayer() {
  const [audio] = useState(() => new Audio());
  const [playingSong, setPlayingSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [waveformPeaks, setWaveformPeaks] = useState(null);

  useEffect(() => {
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setPlayingSong(null);
      setCurrentTime(0);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onDurationChange = () => setDuration(audio.duration);
    const onError = () => {
      showToast("Unable to play this track. The file may be unavailable.", "error");
      setIsPlaying(false);
      setPlayingSong(null);
      setCurrentTime(0);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
  }, [audio]);

  // Extract storage path from a public Supabase URL
  const getStoragePath = (publicUrl) => {
    if (!publicUrl) return null;
    const marker = '/object/public/song-files/';
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return publicUrl.substring(idx + marker.length);
  };

  // Get a time-limited signed URL (1 hour) instead of using permanent public URLs
  const getSignedUrl = async (publicUrl) => {
    const path = getStoragePath(publicUrl);
    if (!path) return publicUrl; // fallback to public URL
    const { data, error } = await supabase.storage
      .from('song-files')
      .createSignedUrl(path, 3600); // 1 hour expiry
    if (error || !data?.signedUrl) return publicUrl; // fallback
    return data.signedUrl;
  };

  const play = async (song) => {
    if (!song.audio_url) {
      showToast("No audio file available for this song", "error");
      return;
    }

    if (playingSong?.id === song.id) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    } else {
      const signedUrl = await getSignedUrl(song.audio_url);
      audio.src = signedUrl;
      audio.play();
      setPlayingSong(song);
      setCurrentTime(0);
      setDuration(0);
      // Extract real waveform peaks in background
      setWaveformPeaks(null);
      extractWaveformPeaks(signedUrl).then(peaks => {
        if (peaks) setWaveformPeaks(peaks);
      });
    }
  };

  const stop = () => {
    audio.pause();
    audio.currentTime = 0;
    setPlayingSong(null);
    setCurrentTime(0);
    setDuration(0);
    setWaveformPeaks(null);
  };

  const restart = () => {
    audio.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      audio.play();
    }
  };

  const skipBack = (seconds = 10) => {
    audio.currentTime = Math.max(0, audio.currentTime - seconds);
    setCurrentTime(audio.currentTime);
  };

  const skipForward = (seconds = 10) => {
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + seconds);
    setCurrentTime(audio.currentTime);
  };

  const seekTo = (time) => {
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const setVolumeLevel = (v) => {
    const val = Math.max(0, Math.min(1, v));
    audio.volume = val;
    setVolume(val);
    if (val > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      audio.volume = volume || 1;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  return { playingSong, isPlaying, currentTime, duration, volume, isMuted, waveformPeaks, play, stop, restart, skipBack, skipForward, seekTo, setVolumeLevel, toggleMute };
}
