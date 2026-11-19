import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  CarFront,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import {
  advanceCreatorOrder,
  fetchCreatorOverview,
  lockCreatorSection,
  switchCreatorRole,
  unlockCreatorSection,
  updateCreatorStation,
} from '../api/client';
import { useI18n } from '../lib/i18n';
import type {
  AccessRole,
  CreatorOverview,
  FuelCode,
  FuelStation,
  SessionPayload,
} from '../types/dezagamiz';

interface CreatorSectionProps {
  isCreator: boolean;
  hasDriverAccount: boolean;
  onSessionUpdate: (payload: SessionPayload) => void;
  onStationsUpdated: (stations: FuelStation[]) => void;
  onSwitchToDriver: () => void;
}

export function CreatorSection({
  isCreator,
  hasDriverAccount,
  onSessionUpdate,
  onStationsUpdated,
  onSwitchToDriver,
}: CreatorSectionProps) {
  const {
    t,
    formatMoney,
    fuelShortLabel,
    fuelUnit,
    localizeCity,
    localizeStationName,
    localizeAttendantName,
    localizePersonName,
    localizeCarModel,
  } = useI18n();
  const [codeInput, setCodeInput] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [pendingSession, setPendingSession] = useState<SessionPayload | null>(null);
  const [pendingOverview, setPendingOverview] = useState<CreatorOverview | null>(null);

  const [overview, setOverview] = useState<CreatorOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [priceDraft, setPriceDraft] = useState<Partial<Record<FuelCode, number>>>(
    {},
  );
  const [bayDraft, setBayDraft] = useState<Record<number, boolean>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingStation, setSavingStation] = useState(false);

  useEffect(() => {
    if (!isCreator) {
      setOverview(null);
      return;
    }
    let active = true;
    setLoadingOverview(true);
    fetchCreatorOverview()
      .then((data) => {
        if (!active) return;
        setOverview(data);
        onStationsUpdated(data.stations);
        if (!selectedStationId && data.stations[0]) {
          const first = data.stations[0];
          setSelectedStationId(first.id);
          setPriceDraft({ ...first.prices });
          const baysObj: Record<number, boolean> = {};
          first.bays.forEach((b) => {
            baysObj[b.number] = b.available;
          });
          setBayDraft(baysObj);
        }
      })
      .catch((err) => {
        if (active) {
          setActionError(
            err instanceof Error ? err.message : t.creatorLoadErr,
          );
        }
      })
      .finally(() => {
        if (active) setLoadingOverview(false);
      });
    return () => {
      active = false;
    };
  }, [isCreator]);

  function handleSelectStation(stationId: string) {
    setSelectedStationId(stationId);
    setSaveMessage(null);
    setActionError(null);
    const st = overview?.stations.find((s) => s.id === stationId);
    if (st) {
      setPriceDraft({ ...st.prices });
      const baysObj: Record<number, boolean> = {};
      st.bays.forEach((b) => {
        baysObj[b.number] = b.available;
      });
      setBayDraft(baysObj);
    }
  }

  async function handleUnlockSubmit(e: FormEvent) {
    e.preventDefault();
    setUnlockError(null);
    setUnlocking(true);
    try {
      const res = await unlockCreatorSection(codeInput, 'admin');
      setPendingSession({
        authenticated: res.authenticated,
        isCreator: res.isCreator,
        creatorRole: res.creatorRole,
        isGuest: Boolean(res.isGuest),
        guestExpiresAt: res.guestExpiresAt ?? null,
        user: res.user,
        activeOrder: res.activeOrder,
        orders: res.orders,
      });
      setPendingOverview(res.overview);
      onStationsUpdated(res.overview.stations);
      setCodeInput('');
    } catch (err) {
      setUnlockError(
        err instanceof Error ? err.message : t.errCreatorCodeInvalid,
      );
    } finally {
      setUnlocking(false);
    }
  }

  async function handlePickUnlockedRole(role: AccessRole) {
    setUnlockError(null);
    setUnlocking(true);
    try {
      const updated = await switchCreatorRole(role);
      if (pendingOverview) {
        setOverview(pendingOverview);
      }
      setPendingSession(null);
      setPendingOverview(null);
      onSessionUpdate(updated);
      if (role === 'driver') {
        onSwitchToDriver();
      }
    } catch (err) {
      setUnlockError(
        err instanceof Error ? err.message : t.errChooseRoleFailed,
      );
    } finally {
      setUnlocking(false);
    }
  }

  async function handleLockCreator() {
    setActionError(null);
    try {
      const updated = await lockCreatorSection();
      onSessionUpdate(updated);
      setOverview(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t.creatorLockErr,
      );
    }
  }

  async function handleSaveStationSettings(e: FormEvent) {
    e.preventDefault();
    if (!selectedStationId) return;
    setSavingStation(true);
    setSaveMessage(null);
    setActionError(null);
    try {
      const updated = await updateCreatorStation(selectedStationId, {
        prices: priceDraft,
        bayAvailability: bayDraft,
      });
      setOverview(updated);
      onStationsUpdated(updated.stations);
      setSaveMessage(t.creatorStationUpdatedMsg);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t.creatorUpdateStationErr,
      );
    } finally {
      setSavingStation(false);
    }
  }

  async function handleAdvanceOrder(orderId: string) {
    setActionError(null);
    try {
      const updated = await advanceCreatorOrder(orderId);
      setOverview(updated);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t.creatorAdvanceOrderErr,
      );
    }
  }

  if (!isCreator || pendingSession) {
    return (
      <section className="dz-card-enter mx-auto max-w-2xl">
        <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-card)] sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dz-primary-deep)] text-white">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          </div>

          {pendingSession ? (
            <div className="mt-4 space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--dz-success)]">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>{t.passwordConfirmed}</span>
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold text-[var(--dz-ink)]">
                  {t.chooseRoleTitle}
                </h1>
                <p className="mt-1.5 text-sm text-[var(--dz-ink-secondary)]">
                  {t.chooseRoleSubtitle}
                </p>
              </div>

              {unlockError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{unlockError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={unlocking}
                  onClick={() => handlePickUnlockedRole('admin')}
                  className="dz-focus flex flex-col items-start justify-between rounded-2xl border border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] p-5 text-left transition-colors hover:bg-[#DDEAFF] dark:hover:bg-[#1E3B6B] disabled:opacity-60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--dz-primary)] text-white">
                    <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="mt-4">
                    <div className="font-display text-base font-bold text-[var(--dz-ink)]">
                      {t.roleAdminTitle}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--dz-ink-secondary)]">
                      {t.roleAdminDesc}
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--dz-primary)]">
                    <span>{t.enterAsAdmin}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </button>

                <button
                  type="button"
                  disabled={unlocking}
                  onClick={() => handlePickUnlockedRole('driver')}
                  className="dz-focus flex flex-col items-start justify-between rounded-2xl border border-[var(--dz-border-strong)] bg-[var(--dz-surface)] p-5 text-left transition-colors hover:border-[var(--dz-primary)] hover:bg-[var(--dz-surface-subtle)] disabled:opacity-60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--dz-primary-deep)] text-white">
                    <CarFront className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="mt-4">
                    <div className="font-display text-base font-bold text-[var(--dz-ink)]">
                      {t.roleDriverTitle}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--dz-ink-secondary)]">
                      {t.roleDriverDesc}
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--dz-primary-deep)] dark:text-[#60A5FA]">
                    <span>{t.enterAsDriver}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="mt-4 font-display text-2xl font-bold text-[var(--dz-ink)]">
                {t.creatorTitle}
              </h1>
              <p className="mt-1.5 text-sm text-[var(--dz-ink-secondary)]">
                {t.creatorSubtitle}
              </p>

              {unlockError && (
                <div
                  role="alert"
                  className="dz-feedback-enter mt-5 flex items-center gap-2 rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{unlockError}</span>
                </div>
              )}

              <form onSubmit={handleUnlockSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="creator-secret-code"
                    className="block text-sm font-semibold text-[var(--dz-ink)]"
                  >
                    {t.creatorCodeLabel}
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="creator-secret-code"
                      type={showCode ? 'text' : 'password'}
                      required
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      placeholder={t.creatorCodePlaceholder}
                      className="dz-focus h-12 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] pl-4 pr-12 font-mono-tabular text-sm text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
                    />
                    <button
                      type="button"
                      aria-label={showCode ? t.creatorHideCodeAria : t.creatorShowCodeAria}
                      onClick={() => setShowCode((v) => !v)}
                      className="dz-focus absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--dz-ink-muted)] hover:bg-[var(--dz-surface-subtle)] hover:text-[var(--dz-ink)]"
                    >
                      {showCode ? (
                        <EyeOff key="hide-code" className="dz-icon-pop h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye key="show-code" className="dz-icon-pop h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={unlocking}
                  className="dz-focus flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--dz-primary-hover)] disabled:opacity-60"
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {unlocking ? t.verifyingPassword : t.verifyPassword}
                  </span>
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    );
  }

  const editedStation =
    overview?.stations.find((s) => s.id === selectedStationId) ||
    overview?.stations[0];

  return (
    <section data-testid="creator-dashboard" className="space-y-6">
      {/* Header banner */}
      <div
        className="dz-section-enter flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6 text-white sm:p-8"
        style={{
          background:
            'linear-gradient(135deg, #092C63 0%, #0B57D0 68%, #1A73E8 100%)',
        }}
      >
        <div>
          <div className="text-xs font-semibold text-blue-200">
            {t.creatorAccessBadge}
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
            {t.creatorPanelTitle}
          </h1>
          <p className="mt-1 text-sm text-blue-100">
            {t.creatorPanelSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onSwitchToDriver}
            className="dz-focus inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#092C63] transition-colors hover:bg-blue-50 whitespace-nowrap"
          >
            <CarFront className="h-4 w-4" aria-hidden="true" />
            <span>{t.creatorDriverModeBadge}</span>
          </button>

          <button
            type="button"
            onClick={handleLockCreator}
            className="dz-focus inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 whitespace-nowrap"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>
              {hasDriverAccount ? t.creatorLockBtn : t.creatorExitBtn}
            </span>
          </button>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="dz-feedback-enter rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
        >
          {actionError}
        </div>
      )}

      {loadingOverview || !overview ? (
        <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-8 text-sm text-[var(--dz-ink-secondary)]">
          {t.creatorLoadingMetrics}
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="dz-card-enter dz-stagger-1 dz-card-hover rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
              <div className="text-xs font-medium text-[var(--dz-ink-muted)]">
                {t.creatorStatDrivers}
              </div>
              <div className="mt-1.5 font-mono-tabular text-2xl font-bold text-[var(--dz-ink)]">
                {overview.stats.totalDrivers}
              </div>
            </div>
            <div className="dz-card-enter dz-stagger-2 dz-card-hover rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
              <div className="text-xs font-medium text-[var(--dz-ink-muted)]">
                {t.creatorStatOrders} ({t.creatorStatActivePrefix}:{' '}
                {overview.stats.activeOrdersCount})
              </div>
              <div className="mt-1.5 font-mono-tabular text-2xl font-bold text-[var(--dz-primary)]">
                {overview.stats.totalOrders}
              </div>
            </div>
            <div className="dz-card-enter dz-stagger-3 dz-card-hover rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
              <div className="text-xs font-medium text-[var(--dz-ink-muted)]">
                {t.creatorStatMethane}
              </div>
              <div className="mt-1.5 font-mono-tabular text-2xl font-bold text-[var(--dz-ink)]">
                {overview.stats.totalGasM3.toFixed(2)} {t.unitM3}
              </div>
            </div>
            <div className="dz-card-enter dz-stagger-4 dz-card-hover rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
              <div className="text-xs font-medium text-[var(--dz-ink-muted)]">
                {t.creatorStatRevenue}
              </div>
              <div className="mt-1.5 font-mono-tabular text-2xl font-bold text-[var(--dz-primary)]">
                {formatMoney(overview.stats.totalRevenueUzs)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Station Pricing & Bay Controls */}
            <section className="dz-section-enter dz-stagger-1 rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-sm)] lg:col-span-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--dz-primary)]">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                <span>{t.creatorStationManageEyebrow}</span>
              </div>
              <h2 className="mt-1 font-display text-xl font-bold text-[var(--dz-ink)]">
                {t.creatorStationManageTitle}
              </h2>

              <div className="mt-4">
                <label
                  htmlFor="creator-station-select"
                  className="block text-xs font-semibold text-[var(--dz-ink-secondary)]"
                >
                  {t.creatorSelectStationLabel}
                </label>
                <select
                  id="creator-station-select"
                  value={editedStation?.id || ''}
                  onChange={(e) => handleSelectStation(e.target.value)}
                  className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 text-sm font-semibold text-[var(--dz-ink)]"
                >
                  {overview.stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {localizeCity(s.city)} — {localizeStationName(s.id, s.name)}
                    </option>
                  ))}
                </select>
              </div>

              {editedStation && (
                <form
                  onSubmit={handleSaveStationSettings}
                  className="mt-5 space-y-5"
                >
                  <div>
                    <div className="text-xs font-semibold text-[var(--dz-ink-secondary)]">
                      {t.creatorPricesLabel}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {(['metan', 'propan', 'ai92', 'ai95'] as FuelCode[]).map(
                        (code) => {
                          if (!editedStation.prices[code]) return null;
                          return (
                            <div key={code}>
                              <label
                                htmlFor={`price-${code}`}
                                className="block text-xs font-medium text-[var(--dz-ink)]"
                              >
                                {fuelShortLabel(code)} ({fuelUnit(code)})
                              </label>
                              <input
                                id={`price-${code}`}
                                type="number"
                                min={1000}
                                max={50000}
                                step={50}
                                value={priceDraft[code] ?? ''}
                                onChange={(e) =>
                                  setPriceDraft((prev) => ({
                                    ...prev,
                                    [code]: Number(e.target.value) || 0,
                                  }))
                                }
                                className="dz-focus mt-1 h-10 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 font-mono-tabular text-sm font-bold text-[var(--dz-ink)]"
                              />
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-[var(--dz-ink-secondary)]">
                      {t.creatorBaysStatusLabel}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {editedStation.bays.map((bay) => {
                        const isAvail = bayDraft[bay.number] ?? bay.available;
                        return (
                          <button
                            key={bay.number}
                            type="button"
                            onClick={() =>
                              setBayDraft((prev) => ({
                                ...prev,
                                [bay.number]: !isAvail,
                              }))
                            }
                            className={`dz-focus flex min-h-[48px] flex-col items-center justify-center rounded-xl border px-2 py-1.5 text-xs font-semibold transition-all duration-200 ${
                              isAvail
                                ? 'dz-dark-active-glow border-[#BCE3D3] dark:border-[#1E6B50] bg-[var(--dz-success-bg)] text-[var(--dz-success)]'
                                : 'border-[var(--dz-border)] bg-[var(--dz-bg)] text-[var(--dz-ink-muted)]'
                            }`}
                          >
                            <span className="font-mono-tabular font-bold">
                              №{bay.number}
                            </span>
                            <span>{isAvail ? t.bayFree : t.bayBusy}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {saveMessage && (
                    <div className="dz-feedback-enter flex items-center gap-2 rounded-xl border border-[#BCE3D3] dark:border-[#1E6B50] bg-[var(--dz-success-bg)] px-3.5 py-2.5 text-xs font-semibold text-[var(--dz-success)]">
                      <Check className="dz-icon-pop h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{saveMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingStation}
                    className="dz-focus flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--dz-primary-hover)] disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {savingStation
                        ? t.creatorSavingStationBtn
                        : t.creatorApplyStationBtn}
                    </span>
                  </button>
                </form>
              )}
            </section>

            {/* Drivers & Orders Tables */}
            <div className="dz-section-enter dz-stagger-2 space-y-6 lg:col-span-7">
              {/* Orders ledger */}
              <section className="overflow-hidden rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] shadow-[var(--dz-shadow-sm)]">
                <div className="border-b border-[var(--dz-border)] px-6 py-4">
                  <h2 className="font-display text-lg font-bold text-[var(--dz-ink)]">
                    {t.creatorOrdersTitle} ({overview.orders.length})
                  </h2>
                </div>
                {overview.orders.length === 0 ? (
                  <div className="p-6 text-sm text-[var(--dz-ink-secondary)]">
                    {t.creatorOrdersEmpty}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] font-semibold text-[var(--dz-ink-secondary)]">
                          <th className="px-4 py-3">{t.creatorColReceiptCar}</th>
                          <th className="px-4 py-3">{t.creatorColStationBay}</th>
                          <th className="px-4 py-3 text-right">{t.creatorColAmount}</th>
                          <th className="px-4 py-3">{t.creatorColStatus}</th>
                          <th className="px-4 py-3 text-right">{t.creatorColControl}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--dz-border)]">
                        {overview.orders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-3">
                              <div className="font-mono-tabular font-bold text-[var(--dz-ink)]">
                                {order.receiptCode}
                              </div>
                              <div className="text-[var(--dz-ink-muted)]">
                                {localizeCarModel(order.carModel)} · {order.plateNumber}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-[var(--dz-ink)]">
                                {localizeCity(order.city)} · №{order.bayNumber}
                              </div>
                              <div className="text-[var(--dz-ink-muted)]">
                                {localizeAttendantName(order.attendant.id, order.attendant.name)}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono-tabular font-bold text-[var(--dz-primary)]">
                              {formatMoney(order.amountUzs)}
                            </td>
                            <td className="px-4 py-3 font-medium text-[var(--dz-ink)]">
                              {order.stage === 'paid' && t.creatorStagePaid}
                              {order.stage === 'attendant_approaching' &&
                                t.creatorStageApproaching}
                              {order.stage === 'fueling' && t.creatorStageFueling}
                              {order.stage === 'completed' && t.creatorStageCompleted}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {order.stage !== 'completed' ? (
                                <button
                                  type="button"
                                  onClick={() => handleAdvanceOrder(order.id)}
                                  className="dz-focus rounded-lg border border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] px-2.5 py-1 font-semibold text-[var(--dz-primary)] hover:bg-[#D8E7FE] dark:hover:bg-[#1E3B6B]"
                                >
                                  {t.creatorNextStageBtn}
                                </button>
                              ) : (
                                <span className="text-[var(--dz-success)] font-semibold">
                                  {t.creatorDoneLabel}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Registered drivers with bound cards */}
              <section className="overflow-hidden rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] shadow-[var(--dz-shadow-sm)]">
                <div className="flex items-center justify-between border-b border-[var(--dz-border)] px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Users
                      className="h-4 w-4 text-[var(--dz-primary)]"
                      aria-hidden="true"
                    />
                    <h2 className="font-display text-lg font-bold text-[var(--dz-ink)]">
                      {t.creatorDriversTitle} ({overview.drivers.length})
                    </h2>
                  </div>
                </div>
                {overview.drivers.length === 0 ? (
                  <div className="p-6 text-sm text-[var(--dz-ink-secondary)]">
                    {t.creatorDriversEmpty}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] font-semibold text-[var(--dz-ink-secondary)]">
                          <th className="px-3.5 py-3">{t.creatorColDriver}</th>
                          <th className="px-3 py-3">{t.creatorColPhone}</th>
                          <th className="px-3 py-3">{t.creatorColCarPlate}</th>
                          <th className="px-3.5 py-3">{t.creatorColLinkedCard}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--dz-border)]">
                        {overview.drivers.map((drv) => (
                          <tr key={drv.id}>
                            <td className="px-3.5 py-3 font-semibold text-[var(--dz-ink)] whitespace-nowrap">
                              {localizePersonName(drv.fullName)}
                            </td>
                            <td className="px-3 py-3 font-mono-tabular text-[var(--dz-ink-secondary)] whitespace-nowrap">
                              {drv.phone}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className="font-medium text-[var(--dz-ink)]">
                                {localizeCarModel(drv.carModel)}
                              </span>{' '}
                              <span className="font-mono-tabular text-[var(--dz-ink-muted)]">
                                ({drv.plateNumber})
                              </span>
                            </td>
                            <td className="px-3.5 py-3 font-mono-tabular text-[var(--dz-ink-secondary)] whitespace-nowrap">
                              {drv.primaryCardMasked}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
