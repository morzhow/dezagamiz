import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import {
  AlertCircle,
  Bell,
  Bot,
  Check,
  Download,
  Headphones,
  Loader2,
  MapPin,
  Music,
  Pause,
  Play,
  Repeat,
  Send,
  SkipForward,
  Sliders,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import {
  composeMelodyWithAi,
  sendAssistantChatMessage,
} from '../api/client';
import {
  computeMelodyDurationSeconds,
  formatAudioTime,
  MELODY_SCALE_NOTES,
} from '../lib/melodyEngine';
import { useMusicPlayer } from '../lib/musicContext';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import type {
  AppView,
  AssistantAction,
  AssistantChatMessage,
  DriverUser,
  FuelCode,
  LatLngPoint,
  MelodyNote,
  MelodySynthPreset,
  PersonalTrack,
} from '../types/dezagamiz';

interface AssistantAndMusicViewProps {
  user: DriverUser | null;
  selectedStationId: string;
  driverLocation: LatLngPoint | null;
  onSelectStationFromAssistant: (
    stationId: string,
    fuelCode?: FuelCode,
    navigateTo?: 'fuel' | 'stations',
  ) => void;
  onNavigateView?: (view: AppView) => void;
  onToggleLiveGps?: (forceEnable?: boolean) => void;
}

type StudioTab = 'tracks' | 'compose' | 'custom';

// Default 16-step pattern so the personal note editor sounds good immediately
const INITIAL_STEP_GRID: boolean[][] = (() => {
  const rows = MELODY_SCALE_NOTES.length;
  const cols = 16;
  const grid = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  // Pleasant pentatonic arpeggio
  const pattern: Array<[number, number]> = [
    [5, 0],
    [4, 2],
    [2, 4],
    [1, 6],
    [2, 8],
    [3, 10],
    [4, 12],
    [0, 14],
  ];
  for (const [r, c] of pattern) {
    if (grid[r] && c < cols) grid[r][c] = true;
  }
  return grid;
})();

export function AssistantAndMusicView({
  user,
  selectedStationId,
  driverLocation,
  onSelectStationFromAssistant,
  onNavigateView,
  onToggleLiveGps,
}: AssistantAndMusicViewProps) {
  const {
    t,
    lang,
    setLang,
    localizeTrack,
    localizeCarModel,
    localizeStationName,
  } = useI18n();
  const { setTheme, toggleTheme } = useTheme();
  const {
    tracks,
    preferences,
    activeTrack,
    isPlaying,
    loop,
    currentTimeSec,
    durationSec,
    uploading,
    error: musicError,
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
  } = useMusicPlayer();

  const synthPresets: ReadonlyArray<{ id: MelodySynthPreset; label: string }> = [
    { id: 'rhodes', label: t.musicPresetRhodes },
    { id: 'warm_pad', label: t.musicPresetWarmPad },
    { id: 'pluck', label: t.musicPresetPluck },
    { id: 'chime', label: t.musicPresetChime },
    { id: 'bass_groove', label: t.musicPresetBass },
  ];

  const quickAiPrompts = [
    t.assistantPromptGreeting,
    t.assistantPrompt1,
    t.assistantPrompt2,
    t.assistantPrompt3,
    t.assistantPrompt4,
  ];

  const quickMelodyMoods = [
    t.musicMood1,
    t.musicMood2,
    t.musicMood3,
    t.musicMood4,
  ];

  function viewSectionLabel(view: AppView): string {
    if (view === 'fuel') return t.navFuel;
    if (view === 'stations') return t.navStations;
    if (view === 'showcase') return t.navShowcase;
    if (view === 'history') return t.navHistory;
    if (view === 'profile') return t.navCards;
    if (view === 'creator') return t.navCreator;
    return t.navAssistant;
  }

  // Assistant Chat state
  const [messages, setMessages] = useState<AssistantChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: t.assistantWelcome,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Music Studio state
  const [studioTab, setStudioTab] = useState<StudioTab>('tracks');
  const [composePrompt, setComposePrompt] = useState(t.musicDefaultComposePrompt);
  const composeEditedRef = useRef(false);
  const [composeBpm, setComposeBpm] = useState(96);
  const [composePreset, setComposePreset] =
    useState<MelodySynthPreset>('rhodes');
  const [composeAsChime, setComposeAsChime] = useState(false);
  const [composing, setComposing] = useState(false);
  const [studioError, setStudioError] = useState<string | null>(null);
  const [studioNotice, setStudioNotice] = useState<string | null>(null);

  // Custom Upload + 16-step Melody Sequencer state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [customTitle, setCustomTitle] = useState(t.musicDefaultCustomTitle);
  const customTitleEditedRef = useRef(false);
  const [customBpm, setCustomBpm] = useState(104);
  const [customPreset, setCustomPreset] =
    useState<MelodySynthPreset>('pluck');
  const [stepGrid, setStepGrid] = useState<boolean[][]>(INITIAL_STEP_GRID);
  const [savingCustom, setSavingCustom] = useState(false);

  useEffect(() => {
    if (!composeEditedRef.current) {
      setComposePrompt(t.musicDefaultComposePrompt);
    }
    if (!customTitleEditedRef.current) {
      setCustomTitle(t.musicDefaultCustomTitle);
    }
  }, [t.musicDefaultComposePrompt, t.musicDefaultCustomTitle]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, sendingChat]);

  function applyAssistantActions(actions: AssistantAction[]) {
    for (const act of actions) {
      if (act.type === 'select_station') {
        onSelectStationFromAssistant(act.stationId, act.fuelCode, act.navigateTo);
      } else if (act.type === 'navigate') {
        if (act.autoNavigate) {
          onNavigateView?.(act.view);
        }
      } else if (act.type === 'app_control') {
        if (act.theme === 'toggle') {
          toggleTheme();
        } else if (act.theme === 'light' || act.theme === 'dark') {
          setTheme(act.theme);
        }
        if (act.language) {
          setLang(act.language);
        }
        if (act.liveGps === 'on') {
          onToggleLiveGps?.(true);
        } else if (act.liveGps === 'off') {
          onToggleLiveGps?.(false);
        }
      } else if (act.type === 'melody_created') {
        playTrack(act.track.id);
      } else if (act.type === 'music_control') {
        if (act.action === 'play') playTrack();
        else if (act.action === 'pause') pause();
        else if (act.action === 'next') playNext();
        else if (act.action === 'play_station_alert') playFuelingChime();
      }
    }
  }

  async function submitChatText(rawText: string) {
    const clean = rawText.trim();
    if (!clean || sendingChat) return;

    setChatError(null);
    const userMsg: AssistantChatMessage = {
      id: `usr-${Date.now().toString(36)}`,
      role: 'user',
      text: clean,
      createdAt: new Date().toISOString(),
    };
    const historyPayload = messages
      .filter((m) => m.id !== 'welcome-msg')
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setSendingChat(true);

    try {
      const res = await sendAssistantChatMessage({
        message: clean,
        history: historyPayload,
        context: {
          selectedStationId,
          driverLocation,
          lang,
        },
      });
      if (res.music) {
        applyServerMusicState(res.music);
      }
      if (res.actions?.length) {
        applyAssistantActions(res.actions);
      }
      const assistantMsg: AssistantChatMessage = {
        id: `ai-${Date.now().toString(36)}`,
        role: 'assistant',
        text: res.reply,
        createdAt: new Date().toISOString(),
        actions: res.actions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t.assistantErrReply;
      setChatError(msg);
    } finally {
      setSendingChat(false);
    }
  }

  function handleChatSubmit(e: FormEvent) {
    e.preventDefault();
    void submitChatText(chatInput);
  }

  function handleChatKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submitChatText(chatInput);
    }
  }

  function handleClearChat() {
    setChatError(null);
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        text: t.assistantWelcome,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  async function handleComposeWithGemini(e: FormEvent) {
    e.preventDefault();
    if (composing) return;
    setStudioError(null);
    setStudioNotice(null);
    setComposing(true);
    try {
      const res = await composeMelodyWithAi({
        prompt: composePrompt,
        bpm: composeBpm,
        synthPreset: composePreset,
        lang,
        setAsFuelingChime: composeAsChime,
      });
      applyServerMusicState({
        tracks: res.tracks,
        preferences: res.preferences,
      });
      playTrack(res.track.id);
      setStudioNotice(
        `${t.musicComposeSuccessPrefix}${res.track.title}${t.musicComposeSuccessSuffix}`,
      );
      setStudioTab('tracks');
    } catch (err) {
      setStudioError(
        err instanceof Error ? err.message : t.musicComposeFailedErr,
      );
    } finally {
      setComposing(false);
    }
  }

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setStudioError(null);
    setStudioNotice(null);
    try {
      const uploaded = await uploadAudioFile(file);
      setStudioNotice(
        `${t.musicUploadSuccessPrefix}${uploaded.title}${t.musicUploadSuccessSuffix}`,
      );
      setStudioTab('tracks');
    } catch (err) {
      setStudioError(
        err instanceof Error ? err.message : t.musicUploadFailedErr,
      );
    }
  }

  function buildNotesFromStepGrid(): MelodyNote[] {
    const notes: MelodyNote[] = [];
    for (let col = 0; col < 16; col++) {
      for (let row = 0; row < MELODY_SCALE_NOTES.length; row++) {
        if (stepGrid[row]?.[col]) {
          notes.push({
            freqHz: MELODY_SCALE_NOTES[row].freqHz,
            offsetBeats: col * 0.5,
            durationBeats: 0.65,
            velocity: 0.78,
          });
        }
      }
    }
    return notes;
  }

  function toggleGridCell(row: number, col: number) {
    setStepGrid((prev) => {
      const next = prev.map((r) => [...r]);
      const nextVal = !next[row][col];
      next[row][col] = nextVal;
      if (nextVal) {
        previewNote(MELODY_SCALE_NOTES[row].freqHz, customPreset);
      }
      return next;
    });
  }

  function handlePreviewCustomGrid() {
    const notes = buildNotesFromStepGrid();
    if (!notes.length) return;
    const tempTrack: PersonalTrack = {
      id: activeTrack?.id || 'preview-custom',
      title: customTitle.trim() || t.musicPreviewDefaultTitle,
      subtitle: `${customPreset} · ${customBpm} BPM`,
      kind: 'melody',
      source: 'custom',
      bpm: customBpm,
      keySignature: 'D minor',
      synthPreset: customPreset,
      notes,
      durationSeconds: computeMelodyDurationSeconds(notes, customBpm),
      createdAt: new Date().toISOString(),
    };
    previewTrack(tempTrack);
  }

  async function handleSaveCustomMelody(e: FormEvent) {
    e.preventDefault();
    const notes = buildNotesFromStepGrid();
    if (!notes.length) {
      setStudioError(t.musicSelectAtLeastOneNote);
      return;
    }
    setStudioError(null);
    setStudioNotice(null);
    setSavingCustom(true);
    try {
      const saved = await saveCustomMelody({
        title: customTitle.trim() || t.musicCustomFallbackTitle,
        bpm: customBpm,
        synthPreset: customPreset,
        notes,
      });
      setStudioNotice(
        `${t.musicCustomSavedPrefix}${saved.title}${t.musicCustomSavedSuffix}`,
      );
      setStudioTab('tracks');
    } catch (err) {
      setStudioError(
        err instanceof Error ? err.message : t.musicSaveCustomFailedErr,
      );
    } finally {
      setSavingCustom(false);
    }
  }

  const combinedStudioError = studioError || musicError;
  const progressPct =
    durationSec > 0 ? Math.min(100, (currentTimeSec / durationSec) * 100) : 0;

  return (
    <section
      data-testid="assistant-music-workspace"
      className="space-y-6"
    >
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Personal Gemini AI Assistant */}
        <div
          data-testid="ai-assistant-panel"
          className="flex min-w-0 flex-col rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-4 shadow-[var(--dz-shadow-sm)] sm:p-6 lg:col-span-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--dz-border)] pb-4">
            <div className="min-w-0 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--dz-primary)] text-white">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl font-bold tracking-tight text-[var(--dz-ink)] sm:text-2xl">
                  {t.assistantTitle}
                </h1>
                <p className="mt-0.5 text-xs text-[var(--dz-ink-secondary)]">
                  {t.assistantSubtitle}
                  {user ? ` · ${localizeCarModel(user.carModel)} (${user.plateNumber})` : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearChat}
              className="dz-focus min-h-[40px] rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 py-2 text-xs font-semibold text-[var(--dz-ink-secondary)] hover:bg-[var(--dz-surface-subtle)] hover:text-[var(--dz-ink)] whitespace-nowrap"
            >
              {t.assistantClearBtn}
            </button>
          </div>

          {/* Starter Prompt Actions */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {quickAiPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={sendingChat}
                onClick={() => void submitChatText(prompt)}
                className="dz-focus min-h-[36px] rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] px-3 py-1.5 text-left text-xs font-medium text-[var(--dz-ink)] transition-colors hover:border-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)] disabled:opacity-60"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div
            ref={chatScrollRef}
            data-testid="ai-chat-messages"
            className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-bg)] p-3 sm:p-4 min-h-[300px] max-h-[440px]"
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const displayText =
                msg.id === 'welcome-msg' ? t.assistantWelcome : msg.text;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-[var(--dz-primary)] text-white'
                        : 'border border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)]'
                    }`}
                  >
                    {displayText}

                    {!isUser && msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--dz-border)] pt-2.5">
                        {msg.actions.map((act, idx) => {
                          if (act.type === 'select_station') {
                            return (
                              <button
                                key={`${act.stationId}-${idx}`}
                                type="button"
                                onClick={() =>
                                  onSelectStationFromAssistant(
                                    act.stationId,
                                    act.fuelCode,
                                    act.navigateTo || 'fuel',
                                  )
                                }
                                className="dz-focus inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[var(--dz-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--dz-primary-hover)]"
                              >
                                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>
                                  {localizeStationName(act.stationId, act.stationName) ||
                                    t.assistantActionOpenStation}
                                </span>
                              </button>
                            );
                          }
                          if (act.type === 'navigate') {
                            return (
                              <button
                                key={`nav-${act.view}-${idx}`}
                                type="button"
                                data-testid={`ai-nav-btn-${act.view}`}
                                onClick={() => onNavigateView?.(act.view)}
                                className="dz-focus inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] px-3 py-1.5 text-xs font-semibold text-[var(--dz-primary)] hover:bg-[var(--dz-primary)] hover:text-white transition-colors"
                              >
                                <span>
                                  {t.assistantActionGoTo} {act.label || viewSectionLabel(act.view)}
                                </span>
                              </button>
                            );
                          }
                          if (act.type === 'app_control') {
                            const tags: string[] = [];
                            if (act.theme === 'dark') tags.push(t.assistantActionThemeDark);
                            else if (act.theme === 'light') tags.push(t.assistantActionThemeLight);
                            else if (act.theme === 'toggle') tags.push(t.assistantActionThemeToggled);
                            if (act.language) tags.push(t.assistantActionLangChanged);
                            if (act.liveGps === 'on') tags.push(t.assistantActionGpsOn);
                            else if (act.liveGps === 'off') tags.push(t.assistantActionGpsOff);
                            return (
                              <span
                                key={`ctrl-${idx}`}
                                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-xl border border-[var(--dz-success)]/35 bg-[var(--dz-success-bg)] px-3 py-1 text-xs font-semibold text-[var(--dz-success)]"
                              >
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>{tags.join(' · ')}</span>
                              </span>
                            );
                          }
                          if (act.type === 'melody_created') {
                            return (
                              <button
                                key={`${act.track.id}-${idx}`}
                                type="button"
                                onClick={() => playTrack(act.track.id)}
                                className="dz-focus inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] px-3 py-1.5 text-xs font-semibold text-[var(--dz-primary)] hover:bg-[var(--dz-surface-subtle)]"
                              >
                                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>
                                  {act.track.title} · {t.assistantActionPlayMelody}
                                </span>
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {sendingChat && (
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--dz-ink-secondary)]">
                <Loader2
                  className="h-4 w-4 animate-spin text-[var(--dz-primary)]"
                  aria-hidden="true"
                />
                <span>{t.assistantThinking}</span>
              </div>
            )}
          </div>

          {chatError && (
            <div
              role="alert"
              data-testid="ai-chat-error"
              className="mt-3 flex items-start gap-2.5 rounded-2xl border border-[var(--dz-danger)]/35 bg-[var(--dz-danger-bg)] px-4 py-3 text-xs text-[var(--dz-danger)]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{chatError}</span>
            </div>
          )}

          {/* Chat Input Form */}
          <form onSubmit={handleChatSubmit} className="mt-3 flex gap-2">
            <textarea
              data-testid="ai-chat-input"
              rows={2}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder={t.assistantPlaceholder}
              className="dz-focus min-h-[48px] flex-1 resize-none rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-bg)] px-4 py-2.5 text-sm text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
            />
            <button
              type="submit"
              data-testid="ai-chat-send"
              disabled={sendingChat || !chatInput.trim()}
              className="dz-focus inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--dz-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--dz-primary-hover)] disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap"
            >
              {sendingChat ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{t.assistantSendBtn}</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Personal Music & Melody Studio */}
        <div
          data-testid="personal-music-studio"
          className="flex min-w-0 flex-col rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-4 shadow-[var(--dz-shadow-sm)] sm:p-6 lg:col-span-5"
        >
          <div className="flex items-start justify-between gap-3 border-b border-[var(--dz-border)] pb-4">
            <div className="min-w-0 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--dz-surface-tint)] text-[var(--dz-primary)]">
                <Headphones className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-[var(--dz-ink)] sm:text-xl">
                  {t.musicStudioTitle}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--dz-ink-secondary)]">
                  {t.musicStudioSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Active Track Deck */}
          <div className="mt-4 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-bg)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p
                  data-testid="active-track-title"
                  className="truncate font-display text-base font-bold text-[var(--dz-ink)]"
                >
                  {activeTrack ? localizeTrack(activeTrack).title : t.musicPreset1Title}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--dz-ink-secondary)]">
                  {activeTrack ? localizeTrack(activeTrack).subtitle : t.musicPreset1Sub}
                  {activeTrack?.bpm ? ` · ${activeTrack.bpm} BPM` : ''}
                  {activeTrack?.keySignature ? ` · ${activeTrack.keySignature}` : ''}
                </p>
              </div>

              {/* Harmonic Bar Visualizer (compositor-only scaleY) */}
              <div
                aria-hidden="true"
                className="flex h-7 items-end gap-1 px-1"
              >
                {[0.45, 0.85, 0.62, 0.95, 0.55].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      transform: isPlaying
                        ? `scaleY(${0.35 + ((Math.sin(currentTimeSec * 4 + i * 1.3) + 1) / 2) * 0.65})`
                        : `scaleY(${h * 0.35})`,
                    }}
                    className="h-6 w-1 origin-bottom rounded-full bg-[var(--dz-primary)] transition-transform duration-150"
                  />
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--dz-surface-subtle)]">
                <div
                  style={{ width: `${progressPct}%` }}
                  className="h-full rounded-full bg-[var(--dz-primary)] transition-[width] duration-150"
                />
              </div>
              <div className="flex items-center justify-between font-mono-tabular text-[11px] text-[var(--dz-ink-muted)]">
                <span>{formatAudioTime(currentTimeSec)}</span>
                <span>{formatAudioTime(durationSec)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="music-play-pause-btn"
                  onClick={() => togglePlay()}
                  className="dz-focus inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--dz-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--dz-primary-hover)] whitespace-nowrap"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" aria-hidden="true" />
                      <span>{t.musicPauseBtn}</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" aria-hidden="true" />
                      <span>{t.musicPlayBtn}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  aria-label={t.musicNextBtn}
                  title={t.musicNextBtn}
                  onClick={playNext}
                  className="dz-focus flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:bg-[var(--dz-surface-subtle)]"
                >
                  <SkipForward className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  aria-pressed={loop}
                  aria-label={t.musicLoopLabel}
                  title={t.musicLoopLabel}
                  onClick={() => setLoop(!loop)}
                  className={`dz-focus flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border transition-colors ${
                    loop
                      ? 'border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] text-[var(--dz-primary)]'
                      : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink-secondary)]'
                  }`}
                >
                  <Repeat className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Volume2
                  className="h-4 w-4 text-[var(--dz-ink-secondary)]"
                  aria-hidden="true"
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  aria-label={t.musicVolumeLabel}
                  value={preferences.volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-20 accent-[var(--dz-primary)]"
                />
                {activeTrack && (
                  <button
                    type="button"
                    aria-label={t.musicDownloadWavBtn}
                    title={t.musicDownloadWavBtn}
                    onClick={() => downloadTrack(activeTrack)}
                    className="dz-focus flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:bg-[var(--dz-surface-subtle)]"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Segmented Studio Tabs */}
          <div
            role="tablist"
            className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-bg)] p-1"
          >
            <button
              type="button"
              role="tab"
              data-testid="music-tab-tracks"
              aria-selected={studioTab === 'tracks'}
              onClick={() => setStudioTab('tracks')}
              className={`dz-focus min-h-[38px] rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap truncate ${
                studioTab === 'tracks'
                  ? 'bg-[var(--dz-primary)] text-white'
                  : 'text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]'
              }`}
            >
              {t.musicTabTracks}
            </button>
            <button
              type="button"
              role="tab"
              data-testid="music-tab-compose"
              aria-selected={studioTab === 'compose'}
              onClick={() => setStudioTab('compose')}
              className={`dz-focus min-h-[38px] rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap truncate ${
                studioTab === 'compose'
                  ? 'bg-[var(--dz-primary)] text-white'
                  : 'text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]'
              }`}
            >
              {t.musicTabComposeAi}
            </button>
            <button
              type="button"
              role="tab"
              data-testid="music-tab-custom"
              aria-selected={studioTab === 'custom'}
              onClick={() => setStudioTab('custom')}
              className={`dz-focus min-h-[38px] rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap truncate ${
                studioTab === 'custom'
                  ? 'bg-[var(--dz-primary)] text-white'
                  : 'text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]'
              }`}
            >
              {t.musicTabCustom}
            </button>
          </div>

          {combinedStudioError && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--dz-danger)]/35 bg-[var(--dz-danger-bg)] px-3 py-2 text-xs text-[var(--dz-danger)]"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{combinedStudioError}</span>
            </div>
          )}

          {studioNotice && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--dz-success)]/35 bg-[var(--dz-success-bg)] px-3 py-2 text-xs font-medium text-[var(--dz-success)]">
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{studioNotice}</span>
            </div>
          )}

          {/* TAB 1: My Tracks */}
          {studioTab === 'tracks' && (
            <div className="mt-4 flex-1 space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--dz-ink)]">
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[var(--dz-primary)]" aria-hidden="true" />
                  <span>{t.musicAutoPlayFuelLabel}</span>
                </span>
                <input
                  type="checkbox"
                  checked={preferences.autoPlayOnFueling}
                  onChange={(e) => void setAutoPlayOnFueling(e.target.checked)}
                  className="h-4 w-4 accent-[var(--dz-primary)]"
                />
              </label>

              <div
                data-testid="music-tracks-list"
                className="max-h-[300px] divide-y divide-[var(--dz-border)] overflow-y-auto rounded-2xl border border-[var(--dz-border)]"
              >
                {tracks.map((track) => {
                  const isActive = activeTrack?.id === track.id;
                  const isChime = preferences.fuelingChimeTrackId === track.id;
                  const canDelete = track.source !== 'preset';
                  return (
                    <div
                      key={track.id}
                      data-testid={`music-track-row-${track.id}`}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 transition-colors ${
                        isActive ? 'bg-[var(--dz-surface-tint)]/65' : 'bg-[var(--dz-surface)]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          isActive ? togglePlay(track.id) : selectTrack(track.id)
                        }
                        onDoubleClick={() => playTrack(track.id)}
                        className="dz-focus flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      >
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlay(track.id);
                          }}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isActive && isPlaying
                              ? 'bg-[var(--dz-primary)] text-white'
                              : 'bg-[var(--dz-surface-subtle)] text-[var(--dz-primary)]'
                          }`}
                        >
                          {isActive && isPlaying ? (
                            <Pause className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Play className="h-4 w-4" aria-hidden="true" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-[var(--dz-ink)]">
                            {localizeTrack(track).title}
                          </span>
                          <span className="block truncate text-[11px] text-[var(--dz-ink-secondary)]">
                            {formatAudioTime(track.durationSeconds)} ·{' '}
                            {track.source === 'gemini'
                              ? t.musicSourceGemini
                              : track.source === 'upload'
                                ? t.musicSourceFile
                                : track.source === 'custom'
                                  ? t.musicSourceCustom
                                  : t.musicSourcePreset}
                          </span>
                        </span>
                      </button>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          title={
                            isChime
                              ? t.musicChimeActiveLabel
                              : t.musicSetChimeBtn
                          }
                          aria-label={t.musicSetChimeBtn}
                          aria-pressed={isChime}
                          onClick={() =>
                            void setFuelingChimeTrack(isChime ? null : track.id)
                          }
                          className={`dz-focus flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                            isChime
                              ? 'border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white'
                              : 'border-transparent text-[var(--dz-ink-muted)] hover:bg-[var(--dz-surface-subtle)] hover:text-[var(--dz-ink)]'
                          }`}
                        >
                          <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            aria-label={t.musicDeleteTrackAria}
                            onClick={() => void removeTrack(track.id)}
                            className="dz-focus flex h-9 w-9 items-center justify-center rounded-lg text-[var(--dz-ink-muted)] hover:bg-[var(--dz-danger-bg)] hover:text-[var(--dz-danger)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Compose Melody with Gemini */}
          {studioTab === 'compose' && (
            <form onSubmit={handleComposeWithGemini} className="mt-4 space-y-3.5">
              <div>
                <label
                  htmlFor="gemini-melody-prompt"
                  className="block text-xs font-semibold text-[var(--dz-ink)]"
                >
                  {t.musicComposePromptLabel}
                </label>
                <textarea
                  id="gemini-melody-prompt"
                  data-testid="gemini-melody-prompt"
                  rows={2}
                  value={composePrompt}
                  onChange={(e) => {
                    composeEditedRef.current = true;
                    setComposePrompt(e.target.value);
                  }}
                  placeholder={t.musicComposePromptPlaceholder}
                  className="dz-focus mt-1.5 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-bg)] px-3 py-2 text-xs text-[var(--dz-ink)]"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {quickMelodyMoods.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        composeEditedRef.current = true;
                        setComposePrompt(m);
                      }}
                      className="dz-focus rounded-lg border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--dz-ink-secondary)] hover:border-[var(--dz-primary)] hover:text-[var(--dz-ink)]"
                    >
                      {m.split(' · ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[var(--dz-ink)]">
                  {t.musicComposePresetLabel}
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {synthPresets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setComposePreset(p.id)}
                      className={`dz-focus rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        composePreset === p.id
                          ? 'border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white'
                          : 'border-[var(--dz-border)] bg-[var(--dz-bg)] text-[var(--dz-ink-secondary)]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="gemini-melody-bpm"
                  className="text-xs font-semibold text-[var(--dz-ink)]"
                >
                  {t.musicComposeBpmLabel}:{' '}
                  <span className="font-mono-tabular text-[var(--dz-primary)]">
                    {composeBpm}
                  </span>
                </label>
                <input
                  id="gemini-melody-bpm"
                  type="range"
                  min={70}
                  max={145}
                  value={composeBpm}
                  onChange={(e) => setComposeBpm(Number(e.target.value))}
                  className="w-40 accent-[var(--dz-primary)]"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--dz-ink-secondary)]">
                <input
                  type="checkbox"
                  checked={composeAsChime}
                  onChange={(e) => setComposeAsChime(e.target.checked)}
                  className="h-4 w-4 accent-[var(--dz-primary)]"
                />
                <span>{t.musicSetChimeBtn}</span>
              </label>

              <button
                type="submit"
                data-testid="gemini-compose-melody-btn"
                disabled={composing}
                className="dz-focus flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary)] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[var(--dz-primary-hover)] disabled:opacity-60"
              >
                {composing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>{t.musicComposing}</span>
                  </>
                ) : (
                  <>
                    <Music className="h-4 w-4" aria-hidden="true" />
                    <span>{t.musicComposeBtn}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: Upload Personal Audio + 16-Step Note Editor */}
          {studioTab === 'custom' && (
            <div className="mt-4 space-y-4">
              {/* Upload Personal File */}
              <div className="rounded-2xl border border-dashed border-[var(--dz-border-strong)] bg-[var(--dz-bg)] p-3.5">
                <p className="text-xs font-semibold text-[var(--dz-ink)]">
                  {t.musicUploadTitle}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--dz-ink-secondary)]">
                  {t.musicUploadHint}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  data-testid="personal-audio-file-input"
                  onChange={(e) => void handleFileSelect(e)}
                  className="sr-only"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="dz-focus mt-2.5 inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[var(--dz-primary)] bg-[var(--dz-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)] disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{uploading ? t.musicUploading : t.musicUploadBtn}</span>
                </button>
              </div>

              {/* 16-step Custom Note Pad */}
              <form onSubmit={handleSaveCustomMelody} className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--dz-ink)]">
                    <Sliders className="h-3.5 w-3.5 text-[var(--dz-primary)]" aria-hidden="true" />
                    <span>{t.musicSequencerTitle}</span>
                  </span>
                </div>
                <p className="text-[11px] text-[var(--dz-ink-secondary)]">
                  {t.musicSequencerHint}
                </p>

                <div className="overflow-x-auto rounded-xl border border-[var(--dz-border)] bg-[var(--dz-bg)] p-2">
                  <div className="min-w-[320px] space-y-1">
                    {MELODY_SCALE_NOTES.map((noteDef, rowIdx) => (
                      <div key={noteDef.label} className="flex items-center gap-1">
                        <span className="w-7 shrink-0 font-mono-tabular text-[10px] font-semibold text-[var(--dz-ink-muted)]">
                          {noteDef.label}
                        </span>
                        <div className="grid flex-1 grid-cols-[repeat(16,minmax(0,1fr))] gap-0.5">
                          {Array.from({ length: 16 }, (_, colIdx) => {
                            const on = Boolean(stepGrid[rowIdx]?.[colIdx]);
                            return (
                              <button
                                key={colIdx}
                                type="button"
                                aria-label={`${noteDef.label} step ${colIdx + 1}`}
                                aria-pressed={on}
                                onClick={() => toggleGridCell(rowIdx, colIdx)}
                                className={`h-5 rounded transition-colors ${
                                  on
                                    ? 'bg-[var(--dz-primary)]'
                                    : colIdx % 4 === 0
                                      ? 'bg-[var(--dz-surface)] border border-[var(--dz-border)]'
                                      : 'bg-[var(--dz-surface-subtle)]'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => {
                      customTitleEditedRef.current = true;
                      setCustomTitle(e.target.value);
                    }}
                    placeholder={t.musicCustomTitlePlaceholder}
                    className="dz-focus h-10 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-bg)] px-3 text-xs text-[var(--dz-ink)]"
                  />
                  <select
                    value={customPreset}
                    onChange={(e) =>
                      setCustomPreset(e.target.value as MelodySynthPreset)
                    }
                    className="dz-focus h-10 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-bg)] px-2.5 text-xs text-[var(--dz-ink)]"
                  >
                    {synthPresets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[var(--dz-ink-secondary)]">
                    {t.musicComposeBpmLabel}:{' '}
                    <span className="font-mono-tabular font-semibold text-[var(--dz-ink)]">
                      {customBpm}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={65}
                    max={150}
                    value={customBpm}
                    onChange={(e) => setCustomBpm(Number(e.target.value))}
                    className="w-36 accent-[var(--dz-primary)]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePreviewCustomGrid}
                    className="dz-focus min-h-[42px] rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 py-2 text-xs font-semibold text-[var(--dz-ink)] hover:bg-[var(--dz-surface-subtle)]"
                  >
                    {t.musicPlayBtn}
                  </button>
                  <button
                    type="submit"
                    data-testid="save-custom-melody-btn"
                    disabled={savingCustom}
                    className="dz-focus flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--dz-primary-hover)] disabled:opacity-60"
                  >
                    {savingCustom ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{t.musicSaveCustomBtn}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
