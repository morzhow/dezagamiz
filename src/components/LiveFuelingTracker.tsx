import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Footprints,
  Fuel,
  Gauge,
  Receipt,
  ShieldCheck,
  Star,
  UserRoundCheck,
} from 'lucide-react';
import { advanceFuelOrder, rateFuelOrder } from '../api/client';
import { useI18n } from '../lib/i18n';
import type { FuelOrder, OrderStage, SessionPayload } from '../types/dezagamiz';

interface LiveFuelingTrackerProps {
  order: FuelOrder;
  onUpdateSession: (payload: SessionPayload) => void;
  onStartNewOrder: () => void;
}

export function LiveFuelingTracker({
  order,
  onUpdateSession,
  onStartNewOrder,
}: LiveFuelingTrackerProps) {
  const {
    t,
    formatMoney,
    fuelFullLabel,
    fuelUnit,
    fuelPressure,
    localizeCity,
    localizeStationName,
    localizeAttendantName,
    localizeShiftBadge,
    localizeCarModel,
  } = useI18n();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [liveVolume, setLiveVolume] = useState(order.dispensedVolume);
  const [countdown, setCountdown] = useState(order.etaSeconds || 4);

  const stageSteps: {
    id: OrderStage;
    title: string;
    subtitle: string;
  }[] = [
    {
      id: 'paid',
      title: t.trackerStage1Title,
      subtitle: t.trackerStage1Sub,
    },
    {
      id: 'attendant_approaching',
      title: t.trackerStage2Title,
      subtitle: t.trackerStage2Sub,
    },
    {
      id: 'fueling',
      title: t.trackerStage3Title,
      subtitle: t.trackerStage3Sub,
    },
    {
      id: 'completed',
      title: t.trackerStage4Title,
      subtitle: t.trackerStage4Sub,
    },
  ];

  const stageIndex = stageSteps.findIndex((s) => s.id === order.stage);
  const localizedFuelName = fuelFullLabel(order.fuelCode);
  const localizedUnit = fuelUnit(order.fuelCode);
  const pressure = fuelPressure(order.fuelCode);

  // Smooth live dispenser animation while fueling
  useEffect(() => {
    if (order.stage === 'fueling') {
      setLiveVolume(Math.max(order.dispensedVolume, order.targetVolume * 0.15));
      const tick = window.setInterval(() => {
        setLiveVolume((prev) => {
          const step = order.targetVolume / 18;
          const next = prev + step;
          return next >= order.targetVolume
            ? order.targetVolume
            : Math.round(next * 100) / 100;
        });
      }, 220);
      return () => window.clearInterval(tick);
    }
    if (order.stage === 'completed') {
      setLiveVolume(order.targetVolume);
    } else {
      setLiveVolume(0);
    }
  }, [order.stage, order.targetVolume, order.dispensedVolume]);

  // Countdown while attendant is approaching
  useEffect(() => {
    if (order.stage !== 'attendant_approaching') return;
    setCountdown(4);
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [order.stage, order.id]);

  // Automatic realistic stage progression so drivers don't have to click anything
  useEffect(() => {
    if (order.stage === 'completed') return;
    const delayMs =
      order.stage === 'paid'
        ? 2500
        : order.stage === 'attendant_approaching'
          ? 4200
          : 4400;

    const timeout = window.setTimeout(async () => {
      try {
        const updated = await advanceFuelOrder(order.id);
        onUpdateSession(updated);
      } catch {
        // Ignore transient errors
      }
    }, delayMs);

    return () => window.clearTimeout(timeout);
  }, [order.id, order.stage, onUpdateSession]);

  async function handleManualAdvance() {
    if (busy || order.stage === 'completed') return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await advanceFuelOrder(order.id);
      onUpdateSession(updated);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t.errPaymentFailed,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRate(stars: number) {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await rateFuelOrder(order.id, stars);
      onUpdateSession(updated);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t.profileSaveBtnError,
      );
    } finally {
      setBusy(false);
    }
  }

  const progressPct =
    order.stage === 'completed'
      ? 100
      : order.targetVolume > 0
        ? Math.min(100, Math.round((liveVolume / order.targetVolume) * 100))
        : 0;

  const currentChargedUzs =
    order.stage === 'completed'
      ? order.amountUzs
      : Math.min(order.amountUzs, Math.round(liveVolume * order.pricePerUnit));

  return (
    <div
      data-testid="live-fueling-tracker"
      data-stage={order.stage}
      className="dz-section-enter grid grid-cols-1 gap-6 lg:grid-cols-12"
    >
      {/* Main live dispenser & status column */}
      <section className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-card)] sm:p-8 lg:col-span-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--dz-border)] pb-5">
          <div>
            <div className="text-xs font-semibold text-[var(--dz-primary)]">
              {localizeStationName(order.stationId, order.stationName)} · {t.bayShortLabel}
              {order.bayNumber}
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-[var(--dz-ink)] sm:text-3xl">
              {order.stage === 'paid' && t.trackerHeadlinePaid}
              {order.stage === 'attendant_approaching' &&
                t.trackerHeadlineApproaching}
              {order.stage === 'fueling' &&
                `${t.trackerHeadlineFuelingPrefix} ${localizedFuelName}`}
              {order.stage === 'completed' && t.trackerHeadlineCompleted}
            </h2>
            <p className="mt-1.5 text-sm text-[var(--dz-ink-secondary)]">
              {order.stage === 'paid' && t.trackerDescPaid}
              {order.stage === 'attendant_approaching' &&
                `${localizeAttendantName(order.attendant.id, order.attendant.name)} ${t.trackerDescApproachingSuffix} ${localizeCarModel(order.carModel)} (${order.plateNumber}).`}
              {order.stage === 'fueling' &&
                `${t.trackerDescFuelingMid} №${order.bayNumber}.`}
              {order.stage === 'completed' && t.trackerDescCompleted}
            </p>
          </div>

          <div className="text-right font-mono-tabular">
            <div className="text-xs text-[var(--dz-ink-muted)]">{t.receiptBtn}</div>
            <div className="text-sm font-bold text-[var(--dz-ink)]">
              {order.receiptCode}
            </div>
          </div>
        </div>

        {/* 4-step visual timeline */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
          {stageSteps.map((step, idx) => {
            const isDone = idx < stageIndex || order.stage === 'completed';
            const isCurrent = idx === stageIndex && order.stage !== 'completed';
            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-3.5 transition-all duration-300 ${
                  isCurrent
                    ? 'scale-[1.01] border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] shadow-sm'
                    : isDone
                      ? 'border-[#BCE3D3] dark:border-[#1E6B50] bg-[var(--dz-success-bg)]'
                      : 'border-[var(--dz-border)] bg-[var(--dz-bg)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tabular text-xs font-bold text-[var(--dz-ink-secondary)]">
                    0{idx + 1}
                  </span>
                  {isDone ? (
                    <CheckCircle2
                      key="done"
                      className="dz-icon-pop h-4 w-4 text-[var(--dz-success)]"
                      aria-hidden="true"
                    />
                  ) : isCurrent ? (
                    <Clock
                      key="current"
                      className="dz-icon-pop h-4 w-4 text-[var(--dz-primary)]"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                <div className="mt-2 text-sm font-semibold text-[var(--dz-ink)]">
                  {step.title}
                </div>
                <div className="mt-0.5 text-xs text-[var(--dz-ink-secondary)]">
                  {step.subtitle}
                </div>
              </div>
            );
          })}
        </div>

        {/* Digital Blue & White Gas Dispenser Console */}
        <div
          className="mt-6 rounded-2xl p-6 text-white"
          style={{
            background:
              'linear-gradient(135deg, #092C63 0%, #0B57D0 75%, #1665DB 100%)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-100">
              <Gauge className="h-4 w-4 text-white" aria-hidden="true" />
              <span>
                {t.bayShortLabel}
                {order.bayNumber} · {localizedFuelName}
                {pressure ? ` · ${pressure}` : ''}
              </span>
            </div>
            <div className="font-mono-tabular text-xs text-blue-100">
              {t.trackerTariffLabel}: {formatMoney(order.pricePerUnit)} / {localizedUnit}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <div className="text-xs text-blue-200">{t.trackerVolumeFilledLabel}</div>
              <div
                data-testid="dispensed-volume"
                className="mt-1 font-mono-tabular text-3xl font-bold text-white"
              >
                {liveVolume.toFixed(2)} {localizedUnit}
              </div>
              <div className="mt-1 font-mono-tabular text-xs text-blue-200">
                {t.trackerGoalLabel}: {order.targetVolume.toFixed(2)} {localizedUnit}
              </div>
            </div>

            <div>
              <div className="text-xs text-blue-200">{t.trackerPaidFromCardLabel}</div>
              <div className="mt-1 font-mono-tabular text-3xl font-bold text-white">
                {formatMoney(
                  order.stage === 'fueling' ? currentChargedUzs : order.amountUzs,
                )}
              </div>
              <div className="mt-1 font-mono-tabular text-xs text-blue-200">
                {order.cardNetwork} · {order.cardMasked}
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div className="text-xs text-blue-200">{t.trackerStatusLabel}</div>
              <div className="mt-1 font-display text-lg font-bold text-white">
                {order.stage === 'paid' && t.trackerStatusPaid}
                {order.stage === 'attendant_approaching' &&
                  `${t.trackerStatusEtaPrefix}${countdown} ${t.trackerStatusEtaSec}`}
                {order.stage === 'fueling' &&
                  `${t.trackerStatusFuelingPrefix} · ${progressPct}%`}
                {order.stage === 'completed' && t.trackerStatusDone}
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{
                    width: `${
                      order.stage === 'paid'
                        ? 12
                        : order.stage === 'attendant_approaching'
                          ? 25
                          : progressPct
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {actionError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-2.5 text-xs font-medium text-[var(--dz-danger)]"
          >
            {actionError}
          </div>
        )}

        {/* Action footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          {order.stage !== 'completed' ? (
            <>
              <div className="flex items-center gap-2 text-xs text-[var(--dz-ink-secondary)]">
                <ShieldCheck
                  className="h-4 w-4 text-[var(--dz-primary)]"
                  aria-hidden="true"
                />
                <span>{t.trackerStayInsideHint}</span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={handleManualAdvance}
                className="dz-focus inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] px-5 py-2.5 text-sm font-semibold text-[var(--dz-primary)] transition-colors hover:bg-[#D8E7FE] dark:hover:bg-[#1E3B6B] disabled:opacity-60"
              >
                <span>
                  {order.stage === 'paid' && t.trackerBtnAtCar}
                  {order.stage === 'attendant_approaching' && t.trackerBtnStartFuel}
                  {order.stage === 'fueling' && t.trackerBtnFinishFuel}
                </span>
              </button>
            </>
          ) : (
            <div className="flex w-full flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--dz-ink)]">
                  {t.trackerRateLabel} ({localizeAttendantName(order.attendant.id, order.attendant.name)})
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (order.rating || 0) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        aria-label={`${t.trackerRateAriaPrefix} ${star} / 5`}
                        onClick={() => handleRate(star)}
                        className={`dz-focus flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-110 ${
                          active
                            ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white'
                            : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink-muted)] hover:border-[var(--dz-primary)]'
                        }`}
                      >
                        <Star
                          key={active ? `star-on-${star}` : `star-off-${star}`}
                          className={active ? 'dz-icon-pop h-4 w-4' : 'h-4 w-4'}
                          fill={active ? 'currentColor' : 'none'}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={onStartNewOrder}
                className="dz-focus dz-dark-active-glow group inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--dz-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--dz-primary-hover)]"
              >
                <Fuel className="h-4 w-4 transition-transform duration-150 group-hover:scale-110" aria-hidden="true" />
                <span>{t.trackerNewOrderBtn}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Right column: Attendant & Vehicle Identification Card */}
      <aside className="flex flex-col gap-6 lg:col-span-4">
        <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-sm)]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-base font-bold text-[var(--dz-ink)]">
              {t.trackerAttendantCardTitle}
            </h3>
            <span className="font-mono-tabular text-xs font-semibold text-[var(--dz-primary)]">
              ★ {order.attendant.rating.toFixed(1)}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--dz-primary)] text-white">
              <UserRoundCheck className="h-8 w-8" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-[var(--dz-ink)]">
                {localizeAttendantName(order.attendant.id, order.attendant.name)}
              </div>
              <div className="mt-0.5 text-xs text-[var(--dz-ink-secondary)]">
                {localizeShiftBadge(order.attendant.id, order.attendant.shiftBadge)}
              </div>
              <div className="mt-1 text-xs text-[var(--dz-ink-muted)]">
                {t.trackerExperiencePrefix} {order.attendant.experienceYears}{' '}
                {t.trackerExperienceUnit} · {t.trackerUniformLabel}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[var(--dz-surface-subtle)] p-4 text-xs leading-relaxed text-[var(--dz-ink-secondary)]">
            <div className="flex items-center gap-2 font-semibold text-[var(--dz-ink)]">
              <Footprints className="h-4 w-4 text-[var(--dz-primary)]" aria-hidden="true" />
              <span>
                {order.stage === 'paid' && t.trackerRolePaid}
                {order.stage === 'attendant_approaching' && t.trackerRoleApproaching}
                {order.stage === 'fueling' && t.trackerRoleFueling}
                {order.stage === 'completed' && t.trackerRoleCompleted}
              </span>
            </div>
            <p className="mt-1.5">
              {t.trackerCarVerifyPrefix} №{order.bayNumber}:{' '}
              <strong className="text-[var(--dz-ink)]">
                {localizeCarModel(order.carModel)} · {order.plateNumber}
              </strong>
              .
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-sm)]">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--dz-ink)]">
            <Receipt className="h-4 w-4 text-[var(--dz-primary)]" aria-hidden="true" />
            <span>{t.trackerPaymentDetailsTitle}</span>
          </div>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--dz-ink-secondary)]">{t.trackerDetailStation}</dt>
              <dd className="text-right font-medium text-[var(--dz-ink)]">
                {localizeCity(order.city)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--dz-ink-secondary)]">{t.trackerDetailBay}</dt>
              <dd className="font-mono-tabular font-semibold text-[var(--dz-ink)]">
                №{order.bayNumber}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--dz-ink-secondary)]">{t.trackerDetailFuel}</dt>
              <dd className="font-semibold text-[var(--dz-ink)]">
                {localizedFuelName}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[var(--dz-ink-secondary)]">{t.trackerDetailCard}</dt>
              <dd className="font-mono-tabular font-medium text-[var(--dz-ink)]">
                {order.cardNetwork} ·••• {order.cardMasked.slice(-4)}
              </dd>
            </div>
            {order.cashbackUzs && order.cashbackUzs > 0 ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--dz-ink-secondary)]">{t.trackerDetailCashback}</dt>
                <dd className="font-mono-tabular font-semibold text-[var(--dz-success)]">
                  +{formatMoney(order.cashbackUzs)}
                </dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4 border-t border-[var(--dz-border)] pt-2.5">
              <dt className="font-semibold text-[var(--dz-ink)]">{t.trackerDetailTotal}</dt>
              <dd className="font-mono-tabular text-base font-bold text-[var(--dz-primary)]">
                {formatMoney(order.amountUzs)}
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
