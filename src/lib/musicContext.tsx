import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  deletePersonalMusicTrack,
  fetchPersonalMusic,
  getStoredSessionId,
  saveCustomMelodyTrack,
  updatePersonalMusicPrefs,
  uploadPersonalAudioTrack,
} from '../api/client';
import {
  exportMelodyWavBytes,
  MelodySynthEngine,
  PRESET_MELODIES,
} from './melodyEngine';
import { useI18n } from './i18n';
import type {
  MelodyNote,
  MelodySynthPreset,
  MusicPreferences,
  PersonalTrack,
} from '../types/dezagamiz';

interface MusicPlayerContextValue {
  tracks: PersonalTrack[];
  preferences: MusicPreferences;
  activeTrack: PersonalTrack | null;
  isPlaying: boolean;
  loop: boolean;
  currentTimeSec: number;
  durationSec: number;
  loading: boolean;
  uploading: boolean;
  error: string | null;
  setLoop: (loop: boolean) => void;
  setVolume: (vol: number) => void;
  playTrack: (trackId?: string) => void;
  pause: () => void;
  togglePlay: (trackId?: string) => void;
  playNext: () => void;
  playFuelingChime: () => void;
  selectTrack: (trackId: string) => void;
  setFuelingChimeTrack: (trackId: string | null) => Promise<void>;
  setAutoPlayOnFueling: (enabled: boolean) => Promise<void>;
  uploadAudioFile: (file: File, customTitle?: string) => Promise<PersonalTrack>;
  saveCustomMelody: (payload: {
    title: string;
    bpm: number;
    synthPreset: MelodySynthPreset;
    notes: MelodyNote[];
    setAsFuelingChime?: boolean;
  }) => Promise<PersonalTrack>;
  removeTrack: (trackId: string) => Promise<void>;
  applyServerMusicState: (payload: {
    tracks: PersonalTrack[];
    preferences: MusicPreferences;
  }) => void;
  downloadTrack: (track: PersonalTrack) => void;
  previewNote: (freqHz: number, preset?: MelodySynthPreset) => void;
  previewTrack: (track: PersonalTrack) => void;
}

const DEFAULT_PREFS: MusicPreferences = {
  activeTrackId: PRESET_MELODIES[0].id,
  fuelingChimeTrackId: 'preset-dezagamiz-chime',
  autoPlayOnFueling: true,
  volume: 0.75,
};

const MusicPlayerContext = createContext<MusicPlayerContextValue>({
  tracks: PRESET_MELODIES,
  preferences: DEFAULT_PREFS,
  activeTrack: PRESET_MELODIES[0],
  isPlaying: false,
  loop: true,
  currentTimeSec: 0,
  durationSec: PRESET_MELODIES[0].durationSeconds,
  loading: false,
  uploading: false,
  error: null,
  setLoop: () => {},
  setVolume: () => {},
  playTrack: () => {},
  pause: () => {},
  togglePlay: () => {},
  playNext: () => {},
  playFuelingChime: () => {},
  selectTrack: () => {},
  setFuelingChimeTrack: async () => {},
  setAutoPlayOnFueling: async () => {},
  uploadAudioFile: async () => PRESET_MELODIES[0],
  saveCustomMelody: async () => PRESET_MELODIES[0],
  removeTrack: async () => {},
  applyServerMusicState: () => {},
  downloadTrack: () => {},
  previewNote: () => {},
  previewTrack: () => {},
});

function buildAuthenticatedAudioUrl(rawUrl: string): string {
  const sid = getStoredSessionId();
  if (!sid) return rawUrl;
  const sep = rawUrl.includes('?') ? '&' : '?';
  return `${rawUrl}${sep}sid=${encodeURIComponent(sid)}`;
}

export function MusicPlayerProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const [tracks, setTracks] = useState<PersonalTrack[]>(PRESET_MELODIES);
  const [preferences, setPreferences] = useState<MusicPreferences>(DEFAULT_PREFS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(PRESET_MELODIES[0].durationSeconds);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const synthRef = useRef<MelodySynthEngine | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;
  const loopRef = useRef(loop);
  loopRef.current = loop;

  if (!synthRef.current && typeof window !== 'undefined') {
    synthRef.current = new MelodySynthEngine();
  }

  const stopAllPlayback = useCallback(() => {
    synthRef.current?.stop();
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      stopAllPlayback();
    };
  }, [stopAllPlayback]);

  useEffect(() => {
    if (!enabled) {
      stopAllPlayback();
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchPersonalMusic()
      .then((res) => {
        if (cancelled) return;
        setTracks(res.tracks);
        setPreferences(res.preferences);
        synthRef.current?.setVolume(res.preferences.volume);
        const active =
          res.tracks.find((t) => t.id === res.preferences.activeTrackId) ||
          res.tracks[0];
        if (active) {
          setDurationSec(active.durationSeconds);
        }
      })
      .catch(() => {
        // Preset melodies remain ready
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, stopAllPlayback]);

  const activeTrack = useMemo(() => {
    return (
      tracks.find((t) => t.id === preferences.activeTrackId) || tracks[0] || null
    );
  }, [tracks, preferences.activeTrackId]);

  const pause = useCallback(() => {
    synthRef.current?.stop();
    if (audioElRef.current) {
      audioElRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const playTrackObj = useCallback(
    (track: PersonalTrack, overrideLoop?: boolean) => {
      setError(null);
      synthRef.current?.stop();
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.currentTime = 0;
      }

      const effectiveLoop =
        typeof overrideLoop === 'boolean' ? overrideLoop : loopRef.current;

      setPreferences((prev) =>
        prev.activeTrackId === track.id
          ? prev
          : { ...prev, activeTrackId: track.id },
      );
      setCurrentTimeSec(0);
      setDurationSec(track.durationSeconds || 10);

      if (track.kind === 'audio' && track.audioUrl) {
        if (!audioElRef.current) {
          audioElRef.current = new Audio();
        }
        const audio = audioElRef.current;
        audio.src = buildAuthenticatedAudioUrl(track.audioUrl);
        audio.volume = preferencesRef.current.volume;
        audio.loop = effectiveLoop;
        audio.ontimeupdate = () => {
          setCurrentTimeSec(audio.currentTime || 0);
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setDurationSec(audio.duration);
          }
        };
        audio.onended = () => {
          if (!audio.loop) {
            setIsPlaying(false);
          }
        };
        audio.onerror = () => {
          setError(t.musicPlaybackAudioErr);
          setIsPlaying(false);
        };
        setIsPlaying(true);
        void audio.play().catch(() => {
          setError(t.musicPlaybackBlockedErr);
          setIsPlaying(false);
        });
        return;
      }

      const synth = synthRef.current;
      if (!synth) return;
      synth.setVolume(preferencesRef.current.volume);
      setIsPlaying(true);
      synth.play(track, {
        loop: effectiveLoop,
        onProgress: (elapsed, total) => {
          setCurrentTimeSec(elapsed);
          setDurationSec(total);
        },
        onEnded: () => {
          setIsPlaying(false);
        },
      });
    },
    [t.musicPlaybackAudioErr, t.musicPlaybackBlockedErr],
  );

  const playTrack = useCallback(
    (trackId?: string) => {
      const targetId = trackId || preferencesRef.current.activeTrackId;
      const track =
        tracksRef.current.find((t) => t.id === targetId) || tracksRef.current[0];
      if (!track) return;
      playTrackObj(track);
      if (trackId && trackId !== preferencesRef.current.activeTrackId) {
        void updatePersonalMusicPrefs({ activeTrackId: track.id }).catch(() => {});
      }
    },
    [playTrackObj],
  );

  const togglePlay = useCallback(
    (trackId?: string) => {
      if (trackId && trackId !== preferencesRef.current.activeTrackId) {
        playTrack(trackId);
        return;
      }
      if (isPlaying) {
        pause();
      } else {
        playTrack(trackId);
      }
    },
    [isPlaying, pause, playTrack],
  );

  const playNext = useCallback(() => {
    const list = tracksRef.current;
    if (!list.length) return;
    const currentIdx = list.findIndex(
      (t) => t.id === preferencesRef.current.activeTrackId,
    );
    const nextTrack = list[(currentIdx + 1) % list.length];
    if (nextTrack) {
      playTrack(nextTrack.id);
    }
  }, [playTrack]);

  const playFuelingChime = useCallback(() => {
    if (!preferencesRef.current.autoPlayOnFueling) return;
    const chimeId = preferencesRef.current.fuelingChimeTrackId;
    if (!chimeId) return;
    const target =
      tracksRef.current.find((t) => t.id === chimeId) ||
      tracksRef.current.find((t) => t.id === 'preset-dezagamiz-chime') ||
      tracksRef.current[0];
    if (!target) return;
    // Play chime once cleanly without infinite looping
    playTrackObj(target, false);
  }, [playTrackObj]);

  const selectTrack = useCallback((trackId: string) => {
    const target = tracksRef.current.find((t) => t.id === trackId);
    if (!target) return;
    setPreferences((prev) => ({ ...prev, activeTrackId: trackId }));
    setDurationSec(target.durationSeconds || 10);
    setCurrentTimeSec(0);
    void updatePersonalMusicPrefs({ activeTrackId: trackId }).catch(() => {});
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setPreferences((prev) => ({ ...prev, volume: clamped }));
    synthRef.current?.setVolume(clamped);
    if (audioElRef.current) {
      audioElRef.current.volume = clamped;
    }
    void updatePersonalMusicPrefs({ volume: clamped }).catch(() => {});
  }, []);

  useEffect(() => {
    if (audioElRef.current) {
      audioElRef.current.loop = loop;
    }
  }, [loop]);

  const setFuelingChimeTrack = useCallback(async (trackId: string | null) => {
    const res = await updatePersonalMusicPrefs({ fuelingChimeTrackId: trackId });
    setTracks(res.tracks);
    setPreferences(res.preferences);
  }, []);

  const setAutoPlayOnFueling = useCallback(async (val: boolean) => {
    const res = await updatePersonalMusicPrefs({ autoPlayOnFueling: val });
    setTracks(res.tracks);
    setPreferences(res.preferences);
  }, []);

  const uploadAudioFile = useCallback(
    async (file: File, customTitle?: string) => {
      setError(null);
      if (file.size > 5 * 1024 * 1024) {
        const err = new Error(t.musicFileTooLargeErr);
        setError(err.message);
        throw err;
      }
      setUploading(true);
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error(t.musicFileReadErr));
          reader.readAsDataURL(file);
        });
        const cleanTitle =
          customTitle?.trim() ||
          file.name.replace(/\.[^.]+$/, '').slice(0, 60) ||
          t.musicUploadTrackFallback;
        const res = await uploadPersonalAudioTrack({
          title: cleanTitle,
          mimeType: file.type || 'audio/mpeg',
          base64Data,
        });
        setTracks(res.tracks);
        setPreferences(res.preferences);
        playTrackObj(res.track);
        return res.track;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : t.musicUploadFailedErr;
        setError(msg);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [
      playTrackObj,
      t.musicFileReadErr,
      t.musicFileTooLargeErr,
      t.musicUploadFailedErr,
      t.musicUploadTrackFallback,
    ],
  );

  const saveCustomMelody = useCallback(
    async (payload: {
      title: string;
      bpm: number;
      synthPreset: MelodySynthPreset;
      notes: MelodyNote[];
      setAsFuelingChime?: boolean;
    }) => {
      setError(null);
      const res = await saveCustomMelodyTrack(payload);
      setTracks(res.tracks);
      setPreferences(res.preferences);
      playTrackObj(res.track);
      return res.track;
    },
    [playTrackObj],
  );

  const removeTrack = useCallback(
    async (trackId: string) => {
      if (isPlaying && preferencesRef.current.activeTrackId === trackId) {
        pause();
      }
      const res = await deletePersonalMusicTrack(trackId);
      setTracks(res.tracks);
      setPreferences(res.preferences);
    },
    [isPlaying, pause],
  );

  const applyServerMusicState = useCallback(
    (payload: { tracks: PersonalTrack[]; preferences: MusicPreferences }) => {
      setTracks(payload.tracks);
      setPreferences(payload.preferences);
    },
    [],
  );

  const downloadTrack = useCallback((track: PersonalTrack) => {
    if (track.kind === 'audio' && track.audioUrl) {
      const a = document.createElement('a');
      a.href = buildAuthenticatedAudioUrl(track.audioUrl);
      a.download = `${track.title || 'track'}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const wavBytes = exportMelodyWavBytes(track);
    const copy = new Uint8Array(wavBytes.byteLength);
    copy.set(wavBytes);
    const blob = new Blob([copy.buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(track.title || 'melody').replace(/\s+/g, '_')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const previewNote = useCallback(
    (freqHz: number, preset: MelodySynthPreset = 'rhodes') => {
      synthRef.current?.setVolume(preferencesRef.current.volume);
      synthRef.current?.previewSingleNote(freqHz, preset);
    },
    [],
  );

  const previewTrack = useCallback(
    (track: PersonalTrack) => {
      playTrackObj(track, false);
    },
    [playTrackObj],
  );

  return (
    <MusicPlayerContext.Provider
      value={{
        tracks,
        preferences,
        activeTrack,
        isPlaying,
        loop,
        currentTimeSec,
        durationSec,
        loading,
        uploading,
        error,
        setLoop,
        setVolume,
        playTrack,
        pause,
        togglePlay,
        playNext,
        playFuelingChime,
        selectTrack,
        setFuelingChimeTrack,
        setAutoPlayOnFueling,
        uploadAudioFile,
        saveCustomMelody,
        removeTrack,
        applyServerMusicState,
        downloadTrack,
        previewNote,
        previewTrack,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  return useContext(MusicPlayerContext);
}
