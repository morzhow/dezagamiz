import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Eye,
  EyeOff,
  ListChecks,
  MessageSquareQuote,
  Pause,
  Play,
  Presentation,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Timer,
} from 'lucide-react';
import attendantImg from '../assets/images/attendant_portrait_uzbek_1794645014116.jpg';
import appIconImg from '../assets/images/dezagamiz_app_icon_1794730513342.jpg';
import heroStationImg from '../assets/images/hero_station_uzbekistan_1794645013755.jpg';
import cockpitImg from '../assets/images/incarcockpit_refuel_1794645014653.jpg';
import { useI18n } from '../lib/i18n';
import {
  calculateFamilyFuelSavings,
  calculateSimpleStationRevenue,
  getShowcaseContent,
} from '../lib/showcaseData';
import type { AppView } from '../types/dezagamiz';
import { BrandLogo } from './BrandLogo';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

type ShowcaseTab = 'slides' | 'defense' | 'savings' | 'monetization' | 'checklist';
type QaFilter = 'all' | 'parents' | 'jury' | 'business';

interface ShowcaseViewProps {
  isAuthenticatedDemo: boolean;
  onNavigateView: (view: AppView) => void;
  onStartDemoAtView: (view: AppView) => Promise<void>;
  onBackToGate?: () => void;
}

const SLIDE_IMAGES = [heroStationImg, cockpitImg, appIconImg, attendantImg] as const;

function formatStopwatch(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ShowcaseView({
  isAuthenticatedDemo,
  onNavigateView,
  onStartDemoAtView,
  onBackToGate,
}: ShowcaseViewProps) {
  const { t, lang, formatMoney } = useI18n();
  const content = useMemo(() => getShowcaseContent(lang), [lang]);

  const [activeTab, setActiveTab] = useState<ShowcaseTab>('slides');
  const [projectorCleanMode, setProjectorCleanMode] = useState(false);

  // Stage Rehearsal Stopwatch (Target 3:00)
  const [stageSeconds, setStageSeconds] = useState(0);
  const [stageRunning, setStageRunning] = useState(false);

  // Slides
  const [slideIndex, setSlideIndex] = useState(0);

  // Q&A Defense
  const [qaFilter, setQaFilter] = useState<QaFilter>('all');
  const [quizActive, setQuizActive] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizCountdown, setQuizCountdown] = useState(30);
  const [quizReveal, setQuizReveal] = useState(false);

  // Family Savings Calculator
  const [monthlyKm, setMonthlyKm] = useState(1400);
  const [consumption, setConsumption] = useState(9.5);

  // Monetization Calculator
  const [partnerStations, setPartnerStations] = useState(5);
  const [carsPerDay, setCarsPerDay] = useState(35);

  // Stage Checklist
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [jumpingTarget, setJumpingTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!stageRunning) return;
    const id = window.setInterval(() => {
      setStageSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [stageRunning]);

  useEffect(() => {
    if (!quizActive) return;
    const id = window.setInterval(() => {
      setQuizCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [quizActive]);

  const savings = useMemo(
    () =>
      calculateFamilyFuelSavings({
        monthlyKm,
        consumptionLPer100Km: consumption,
      }),
    [monthlyKm, consumption],
  );

  const monetization = useMemo(
    () =>
      calculateSimpleStationRevenue({
        partnerStations,
        carsPerStationPerDay: carsPerDay,
      }),
    [partnerStations, carsPerDay],
  );

  const filteredQa = useMemo(() => {
    if (qaFilter === 'all') return content.qaItems;
    return content.qaItems.filter((q) => q.category === qaFilter);
  }, [content.qaItems, qaFilter]);

  const currentSlide = content.slides[slideIndex] || content.slides[0];
  const quizQuestion = content.qaItems[quizIndex % content.qaItems.length];

  async function handleJumpLive(target: AppView) {
    if (isAuthenticatedDemo) {
      onNavigateView(target);
      return;
    }
    setJumpingTarget(target);
    try {
      await onStartDemoAtView(target);
    } finally {
      setJumpingTarget(null);
    }
  }

  function startOrResetQuiz(nextIdx?: number) {
    const idx =
      typeof nextIdx === 'number'
        ? nextIdx
        : (quizIndex + 1) % content.qaItems.length;
    setQuizActive(true);
    setQuizIndex(idx);
    setQuizCountdown(30);
    setQuizReveal(false);
  }

  function toggleChecklistItem(id: string) {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  const tabs: ReadonlyArray<{
    id: ShowcaseTab;
    label: string;
    icon: typeof Presentation;
  }> = [
    { id: 'slides', label: t.showcaseTabSlides, icon: Presentation },
    { id: 'defense', label: t.showcaseTabDefense, icon: ShieldCheck },
    { id: 'savings', label: t.showcaseTabSavings, icon: Calculator },
    { id: 'monetization', label: t.showcaseTabMonetization, icon: Banknote },
    { id: 'checklist', label: t.showcaseTabChecklist, icon: ListChecks },
  ];

  return (
    <div
      data-testid="showcase-view"
      className={
        isAuthenticatedDemo
          ? 'space-y-6'
          : 'min-h-screen bg-[var(--dz-bg)] text-[var(--dz-ink)] pb-12'
      }
    >
      {!isAuthenticatedDemo && (
        <header className="sticky top-0 z-30 border-b border-[var(--dz-border)] bg-[var(--dz-surface)]/95 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
            <div className="flex items-center gap-3">
              <BrandLogo />
              {onBackToGate && (
                <button
                  type="button"
                  onClick={onBackToGate}
                  className="dz-focus inline-flex items-center gap-1.5 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--dz-ink)] hover:border-[var(--dz-primary)] whitespace-nowrap"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{t.showcaseBackToGate}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle compact />
              <LanguageSelector compact />
              <button
                type="button"
                disabled={jumpingTarget !== null}
                onClick={() => void handleJumpLive('fuel')}
                className="dz-focus inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[var(--dz-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--dz-primary-hover)] whitespace-nowrap disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.launchJuryDemoBtn}</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <div className={isAuthenticatedDemo ? 'space-y-6' : 'mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-8 sm:pt-8'}>
        {/* Top Stage Control Bar */}
        <section className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5 shadow-[var(--dz-shadow-sm)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--dz-ink)] sm:text-3xl">
                {t.showcaseTitle}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--dz-ink-secondary)]">
                {t.showcaseSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Stage Stopwatch */}
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] px-3 py-2">
                <Timer className="h-4 w-4 text-[var(--dz-primary)]" aria-hidden="true" />
                <div className="pr-1">
                  <div className="text-[10px] font-semibold text-[var(--dz-ink-muted)]">
                    {t.showcaseTarget3Min}
                  </div>
                  <div
                    data-testid="stage-stopwatch-value"
                    className={`font-mono-tabular text-base font-bold ${
                      stageSeconds >= 180
                        ? 'text-[var(--dz-warning)]'
                        : 'text-[var(--dz-ink)]'
                    }`}
                  >
                    {formatStopwatch(stageSeconds)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStageRunning((r) => !r)}
                  className="dz-focus inline-flex items-center gap-1 rounded-lg bg-[var(--dz-primary)] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--dz-primary-hover)]"
                >
                  {stageRunning ? (
                    <>
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t.showcaseTimerPause}</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t.showcaseTimerStart}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={t.showcaseTimerReset}
                  onClick={() => {
                    setStageRunning(false);
                    setStageSeconds(0);
                  }}
                  className="dz-focus inline-flex items-center justify-center rounded-lg border border-[var(--dz-border)] bg-[var(--dz-surface)] p-1.5 text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Clean Projector vs Speaker Notes toggle */}
              <button
                type="button"
                onClick={() => setProjectorCleanMode((v) => !v)}
                className={`dz-focus inline-flex min-h-[42px] items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  projectorCleanMode
                    ? 'border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] text-[var(--dz-primary)]'
                    : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:border-[var(--dz-primary)]'
                }`}
              >
                {projectorCleanMode ? (
                  <>
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                    <span>{t.showcaseProjectorModeOn}</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 text-[var(--dz-primary)]" aria-hidden="true" />
                    <span>{t.showcaseSpeakerNotesOn}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 5 Sub-Tabs */}
          <div
            role="tablist"
            className="mt-5 flex flex-wrap gap-2 border-t border-[var(--dz-border)] pt-4"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`dz-focus inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                    selected
                      ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white shadow-sm'
                      : 'border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] text-[var(--dz-ink-secondary)] hover:border-[var(--dz-primary)] hover:text-[var(--dz-ink)]'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* TAB 1: Interactive Pitch Slides */}
        {activeTab === 'slides' && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col justify-between rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-card)] sm:p-8 lg:col-span-7">
              <div>
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--dz-ink-muted)]">
                  <span className="font-mono-tabular text-[var(--dz-primary)]">
                    {currentSlide.indexLabel} / 0{content.slides.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {content.slides.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-label={`${s.indexLabel} ${s.title}`}
                        onClick={() => setSlideIndex(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === slideIndex
                            ? 'w-7 bg-[var(--dz-primary)]'
                            : 'w-2 bg-[var(--dz-border-strong)] hover:bg-[var(--dz-primary)]/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <h2 className="mt-4 font-display text-2xl font-bold leading-snug text-[var(--dz-ink)] sm:text-3xl">
                  {currentSlide.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--dz-ink-secondary)] sm:text-base">
                  {currentSlide.summary}
                </p>

                <ul className="mt-6 space-y-3">
                  {currentSlide.bulletPoints.map((pt, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] px-4 py-3 text-sm text-[var(--dz-ink)]"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dz-primary)]"
                        aria-hidden="true"
                      />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>

                {!projectorCleanMode && (
                  <div className="mt-5 rounded-2xl border border-[var(--dz-primary)]/25 bg-[var(--dz-surface-tint)] p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--dz-primary)]">
                      <MessageSquareQuote className="h-4 w-4" aria-hidden="true" />
                      <span>{t.showcaseSpeakerCueLabel}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--dz-ink)]">
                      {currentSlide.speakerNote}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--dz-border)] pt-5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={slideIndex === 0}
                    onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                    className="dz-focus inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--dz-ink)] hover:border-[var(--dz-primary)] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    <span>{t.showcasePrevSlide}</span>
                  </button>
                  <button
                    type="button"
                    disabled={slideIndex >= content.slides.length - 1}
                    onClick={() =>
                      setSlideIndex((i) => Math.min(content.slides.length - 1, i + 1))
                    }
                    className="dz-focus inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--dz-ink)] hover:border-[var(--dz-primary)] disabled:opacity-40"
                  >
                    <span>{t.showcaseNextSlide}</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={jumpingTarget !== null}
                  onClick={() => void handleJumpLive(currentSlide.proofView)}
                  className="dz-focus inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[var(--dz-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--dz-primary-hover)] disabled:opacity-60"
                >
                  <span>{currentSlide.proofLabel}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Right visual stage card */}
            <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-primary-deep)] text-white lg:col-span-5">
              <div className="relative h-72 w-full overflow-hidden bg-[#082452] sm:h-80">
                <img
                  src={SLIDE_IMAGES[slideIndex] || heroStationImg}
                  alt={currentSlide.title}
                  className="h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#092C63] via-[#092C63]/35 to-transparent"
                />
                <div className="absolute bottom-5 left-6 right-6">
                  <div className="font-mono-tabular text-3xl font-bold text-white sm:text-4xl">
                    {currentSlide.keyMetricValue}
                  </div>
                  <div className="mt-1 text-sm font-medium text-blue-100">
                    {currentSlide.keyMetricLabel}
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-6">
                <div className="text-xs font-semibold text-blue-200">
                  {t.showcaseTabSlides}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {content.slides.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setSlideIndex(idx)}
                      className={`dz-focus rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                        idx === slideIndex
                          ? 'border-white bg-white text-[#092C63]'
                          : 'border-white/20 bg-white/10 text-blue-100 hover:bg-white/15'
                      }`}
                    >
                      <span className="font-mono-tabular opacity-75">
                        {slide.indexLabel} ·{' '}
                      </span>
                      <span className="line-clamp-1">{slide.keyMetricValue}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: Defense against Parents & Jury Questions */}
        {activeTab === 'defense' && (
          <section className="space-y-5">
            <div className="flex flex-col gap-3 rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'all', label: t.showcaseFilterAll },
                    { id: 'parents', label: t.showcaseFilterParents },
                    { id: 'jury', label: t.showcaseFilterJury },
                    { id: 'business', label: t.showcaseFilterBusiness },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setQaFilter(item.id)}
                    className={`dz-focus rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                      qaFilter === item.id
                        ? 'border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] text-[var(--dz-primary)]'
                        : 'border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  quizActive ? setQuizActive(false) : startOrResetQuiz(0)
                }
                className={`dz-focus inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  quizActive
                    ? 'border border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] text-[var(--dz-primary)]'
                    : 'bg-[var(--dz-primary)] text-white hover:bg-[var(--dz-primary-hover)]'
                }`}
              >
                <Shuffle className="h-4 w-4" aria-hidden="true" />
                <span>{t.showcaseQuizModeBtn}</span>
              </button>
            </div>

            {quizActive && quizQuestion && (
              <div className="rounded-3xl border border-[var(--dz-primary)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-card)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-bold text-[var(--dz-primary)]">
                    {t.showcaseQuizModeBtn}
                  </div>
                  <div className="flex items-center gap-2 font-mono-tabular text-sm font-bold text-[var(--dz-ink)]">
                    <span className="text-xs font-medium text-[var(--dz-ink-muted)]">
                      {t.showcaseQuizTimerLabel}:
                    </span>
                    <span
                      className={
                        quizCountdown <= 5
                          ? 'text-[var(--dz-danger)]'
                          : 'text-[var(--dz-primary)]'
                      }
                    >
                      00:{quizCountdown.toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <h3 className="mt-3 font-display text-xl font-bold text-[var(--dz-ink)]">
                  {quizQuestion.question}
                </h3>

                {quizReveal && (
                  <div className="mt-4 space-y-3 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] p-4">
                    <p className="text-sm leading-relaxed text-[var(--dz-ink)]">
                      {quizQuestion.shortAnswer}
                    </p>
                    {!projectorCleanMode && (
                      <p className="text-xs font-medium text-[var(--dz-primary)]">
                        {quizQuestion.speakerTip}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setQuizReveal((v) => !v)}
                    className="dz-focus rounded-xl bg-[var(--dz-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--dz-primary-hover)]"
                  >
                    {quizReveal ? t.showcaseQuizHideBtn : t.showcaseQuizRevealBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      startOrResetQuiz(
                        (quizIndex + 1 + Math.floor(Math.random() * 2)) %
                          content.qaItems.length,
                      )
                    }
                    className="dz-focus rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] px-4 py-2 text-xs font-semibold text-[var(--dz-ink)] hover:border-[var(--dz-primary)]"
                  >
                    {t.showcaseQuizNextBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleJumpLive(quizQuestion.proofView)}
                    className="dz-focus inline-flex items-center gap-1.5 rounded-xl border border-[var(--dz-primary)]/40 bg-[var(--dz-surface-tint)] px-3.5 py-2 text-xs font-semibold text-[var(--dz-primary)]"
                  >
                    <span>{quizQuestion.proofLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredQa.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5 shadow-[var(--dz-shadow-sm)]"
                >
                  <div>
                    <div className="text-[11px] font-bold text-[var(--dz-primary)]">
                      {item.category === 'parents'
                        ? t.showcaseFilterParents
                        : item.category === 'jury'
                          ? t.showcaseFilterJury
                          : t.showcaseFilterBusiness}
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-[var(--dz-ink)]">
                      {item.question}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-[var(--dz-ink-secondary)]">
                      {item.shortAnswer}
                    </p>
                    {!projectorCleanMode && (
                      <div className="mt-3 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] px-3.5 py-2.5 text-xs text-[var(--dz-ink)]">
                        <span className="font-semibold text-[var(--dz-primary)]">
                          {t.showcaseSpeakerCueLabel}{' '}
                        </span>
                        {item.speakerTip}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-2">
                    <button
                      type="button"
                      disabled={jumpingTarget !== null}
                      onClick={() => void handleJumpLive(item.proofView)}
                      className="dz-focus inline-flex items-center gap-1.5 rounded-xl border border-[var(--dz-primary)]/30 bg-[var(--dz-surface-tint)] px-3.5 py-2 text-xs font-semibold text-[var(--dz-primary)] hover:bg-[#DDEAFF] dark:hover:bg-[#1E3B6B]"
                    >
                      <span>{item.proofLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: Family Methane Savings Calculator */}
        {activeTab === 'savings' && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-5 rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-sm)] lg:col-span-5">
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--dz-ink)]">
                  {t.showcaseSavingsTitle}
                </h2>
                <p className="mt-1 text-sm text-[var(--dz-ink-secondary)]">
                  {t.showcaseSavingsSubtitle}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--dz-ink-secondary)]">
                      {t.showcaseMonthlyKmLabel}
                    </span>
                    <span className="font-mono-tabular text-sm font-bold text-[var(--dz-primary)]">
                      {monthlyKm} {t.distanceKmUnit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={400}
                    max={6000}
                    step={100}
                    value={monthlyKm}
                    onChange={(e) => setMonthlyKm(Number(e.target.value))}
                    className="mt-2 h-2 w-full cursor-pointer accent-[var(--dz-primary)]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--dz-ink-secondary)]">
                      {t.showcaseConsumptionLabel}
                    </span>
                    <span className="font-mono-tabular text-sm font-bold text-[var(--dz-primary)]">
                      {consumption.toFixed(1)} {t.unitM3} / {t.unitLiter}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={20}
                    step={0.5}
                    value={consumption}
                    onChange={(e) => setConsumption(Number(e.target.value))}
                    className="mt-2 h-2 w-full cursor-pointer accent-[var(--dz-primary)]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => void handleJumpLive('fuel')}
                  className="dz-focus inline-flex items-center gap-2 rounded-xl bg-[var(--dz-primary)] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[var(--dz-primary-hover)]"
                >
                  <span>{t.showcaseShowLiveBtn}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
              <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
                <div className="text-xs font-semibold text-[var(--dz-ink-muted)]">
                  {t.showcaseOutMonthlySavings}
                </div>
                <div className="mt-2 font-mono-tabular text-2xl font-bold text-[var(--dz-ink)]">
                  {formatMoney(savings.monthlySavingsUzs)}
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
                <div className="text-xs font-semibold text-[var(--dz-ink-muted)]">
                  {t.showcaseOutYearlySavings}
                </div>
                <div className="mt-2 font-mono-tabular text-2xl font-bold text-[var(--dz-ink)]">
                  {formatMoney(savings.yearlySavingsUzs)}
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
                <div className="text-xs font-semibold text-[var(--dz-ink-muted)]">
                  {t.showcaseOutPrimeCashback}
                </div>
                <div className="mt-2 font-mono-tabular text-2xl font-bold text-[var(--dz-primary)]">
                  {formatMoney(savings.yearlyPrimeCashbackUzs)}
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--dz-primary)] bg-[var(--dz-primary-deep)] p-5 text-white">
                <div className="text-xs font-semibold text-blue-200">
                  {t.showcaseOutTotalBenefit}
                </div>
                <div
                  data-testid="yearly-family-benefit"
                  className="mt-2 font-mono-tabular text-2xl font-bold text-white sm:text-3xl"
                >
                  {formatMoney(savings.totalYearlyBenefitUzs)}
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] p-5">
                <div className="text-xs font-semibold text-[var(--dz-ink-muted)]">
                  {t.showcaseOutCo2Saved}
                </div>
                <div className="mt-1 font-mono-tabular text-xl font-bold text-[var(--dz-success)]">
                  ~{savings.yearlyCo2SavedKg} kg
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] p-5">
                <div className="text-xs font-semibold text-[var(--dz-ink-muted)]">
                  {t.showcaseOutTimeSaved}
                </div>
                <div className="mt-1 font-mono-tabular text-xl font-bold text-[var(--dz-ink)]">
                  ~{Math.round(savings.yearlyQueueMinutesSaved / 60)} h ({savings.yearlyQueueMinutesSaved} min)
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: Simple Immediate Monetization Paths + Revenue Calculator */}
        {activeTab === 'monetization' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-5 rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-sm)] lg:col-span-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-[var(--dz-ink)]">
                    {t.showcaseMonetizeTitle}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--dz-ink-secondary)]">
                    {t.showcaseMonetizeSubtitle}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--dz-ink-secondary)]">
                        {t.showcaseStationsCountLabel}
                      </span>
                      <span className="font-mono-tabular text-sm font-bold text-[var(--dz-primary)]">
                        {partnerStations}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      step={1}
                      value={partnerStations}
                      onChange={(e) => setPartnerStations(Number(e.target.value))}
                      className="mt-2 h-2 w-full cursor-pointer accent-[var(--dz-primary)]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--dz-ink-secondary)]">
                        {t.showcaseCarsPerDayLabel}
                      </span>
                      <span className="font-mono-tabular text-sm font-bold text-[var(--dz-primary)]">
                        {carsPerDay}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={150}
                      step={5}
                      value={carsPerDay}
                      onChange={(e) => setCarsPerDay(Number(e.target.value))}
                      className="mt-2 h-2 w-full cursor-pointer accent-[var(--dz-primary)]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
                <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
                  <div className="text-xs font-semibold text-[var(--dz-ink-muted)]">
                    {t.showcaseOutSubIncome}
                  </div>
                  <div className="mt-2 font-mono-tabular text-xl font-bold text-[var(--dz-ink)]">
                    {formatMoney(monetization.subscriptionIncomeUzs)}
                  </div>
                </div>

                <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
                  <div className="text-xs font-semibold text-[var(--dz-ink-muted)]">
                    {t.showcaseOutFeeIncome} ({monetization.monthlyOrders} {t.showcaseOutMonthlyOrders.toLowerCase()})
                  </div>
                  <div className="mt-2 font-mono-tabular text-xl font-bold text-[var(--dz-ink)]">
                    {formatMoney(monetization.partnerFeeIncomeUzs)}
                  </div>
                </div>

                <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
                  <div className="text-xs font-semibold text-[var(--dz-ink-muted)]">
                    {t.showcaseOutAdIncome}
                  </div>
                  <div className="mt-2 font-mono-tabular text-xl font-bold text-[var(--dz-ink)]">
                    {formatMoney(monetization.sponsorMapIncomeUzs)}
                  </div>
                </div>

                <div className="rounded-3xl border border-[var(--dz-primary)] bg-[var(--dz-primary-deep)] p-5 text-white">
                  <div className="text-xs font-semibold text-blue-200">
                    {t.showcaseOutMonthlyRevenue}
                  </div>
                  <div
                    data-testid="monthly-monetization-total"
                    className="mt-1.5 font-mono-tabular text-2xl font-bold text-white"
                  >
                    {formatMoney(monetization.monthlyTotalUzs)}
                  </div>
                  <div className="mt-1 text-xs text-blue-200">
                    {t.showcaseOutYearlyRevenue}:{' '}
                    <span className="font-mono-tabular font-semibold text-white">
                      {formatMoney(monetization.yearlyTotalUzs)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {content.monetizationPaths.map((path) => (
                <article
                  key={path.id}
                  className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5 shadow-[var(--dz-shadow-sm)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--dz-primary)]">
                    <span>{path.effortLabel}</span>
                    <span className="font-mono-tabular">{path.potentialLabel}</span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-[var(--dz-ink)]">
                    {path.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--dz-ink-secondary)]">
                    {path.howItWorks}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* TAB 5: Stage Demo Checklist */}
        {activeTab === 'checklist' && (
          <section className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-sm)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dz-border)] pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--dz-ink)]">
                  {t.showcaseChecklistTitle}
                </h2>
                <p className="mt-1 text-sm text-[var(--dz-ink-secondary)]">
                  {t.showcaseChecklistSubtitle}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface-tint)] px-3.5 py-2 font-mono-tabular text-xs font-bold text-[var(--dz-primary)]">
                {t.showcaseChecklistProgress}: {checkedIds.length} / {content.checklist.length}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {content.checklist.map((step) => {
                const done = checkedIds.includes(step.id);
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col gap-3 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                      done
                        ? 'border-[var(--dz-success)]/40 bg-[var(--dz-success-bg)]/40'
                        : 'border-[var(--dz-border)] bg-[var(--dz-surface-subtle)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(step.id)}
                      className="dz-focus flex flex-1 items-start gap-3 text-left"
                    >
                      {done ? (
                        <CheckCircle2
                          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--dz-success)]"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--dz-ink-muted)]"
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <div
                          className={`text-sm font-bold ${
                            done
                              ? 'line-through text-[var(--dz-ink-secondary)]'
                              : 'text-[var(--dz-ink)]'
                          }`}
                        >
                          {step.title}
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-[var(--dz-ink-secondary)]">
                          {step.desc}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={jumpingTarget !== null}
                      onClick={() => void handleJumpLive(step.targetView)}
                      className="dz-focus inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--dz-primary)]/35 bg-[var(--dz-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)]"
                    >
                      <span>{step.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
