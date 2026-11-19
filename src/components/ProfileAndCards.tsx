import { useEffect, useState, type FormEvent } from 'react';
import {
  CarFront,
  Check,
  CreditCard,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Wallet,
} from 'lucide-react';
import {
  addDriverVehicle,
  addLinkedCard,
  deleteDriverVehicle,
  deleteLinkedCard,
  issuePersonalCard,
  setDefaultCard,
  setDefaultVehicle,
  togglePersonalCardFreeze,
  topUpPersonalCard,
  updateDriverProfile,
  updatePersonalCardDesign,
} from '../api/client';
import {
  detectCardNetwork,
  formatCardNumberInput,
  formatExpiryInput,
  getDriverVehicles,
  normalizeUzbekPlate,
  PERSONAL_CARD_CASHBACK_RATE,
  validateCardExpiry,
  validateCardNumber,
  validatePersonalCardTopUp,
  validateUzbekPlate,
} from '../lib/dezagamiz';
import {
  translateCarModel,
  translatePersonName,
  useI18n,
} from '../lib/i18n';
import type {
  DriverUser,
  FuelCode,
  PersonalCardStyle,
  PersonalCardTier,
  SessionPayload,
} from '../types/dezagamiz';
import { BankCardPreview } from './BankCardPreview';
import { DezagamizPersonalCardVisual } from './DezagamizPersonalCardVisual';

interface ProfileAndCardsProps {
  user: DriverUser;
  onUpdateSession: (payload: SessionPayload) => void;
}

export function ProfileAndCards({
  user,
  onUpdateSession,
}: ProfileAndCardsProps) {
  const {
    t,
    lang,
    fuelShortLabel,
    fuelFullLabel,
    formatMoney,
    localizePersonName,
    localizeCarModel,
    localizeCardError,
    localizeTopUpError,
  } = useI18n();
  const [fullName, setFullName] = useState(() => localizePersonName(user.fullName));
  const [carModel, setCarModel] = useState(() => localizeCarModel(user.carModel));
  const [plateNumber, setPlateNumber] = useState(user.plateNumber);
  const [preferredFuel, setPreferredFuel] = useState<FuelCode>(user.preferredFuel);
  const [profileDirty, setProfileDirty] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  const [showAddCar, setShowAddCar] = useState(false);
  const [newCarModel, setNewCarModel] = useState('');
  const [newCarPlate, setNewCarPlate] = useState('');
  const [newCarFuel, setNewCarFuel] = useState<FuelCode>('metan');

  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [holderName, setHolderName] = useState(() =>
    localizePersonName(user.fullName).toUpperCase(),
  );
  const [cvc, setCvc] = useState('');
  const [cardErr, setCardErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Personal dezagamiz Card state
  const [issueTier, setIssueTier] = useState<PersonalCardTier>('prime');
  const [issueStyle, setIssueStyle] = useState<PersonalCardStyle>('cobalt');
  const [issueHolder, setIssueHolder] = useState(() =>
    localizePersonName(user.fullName).toUpperCase(),
  );
  const [initialTopUpUzs, setInitialTopUpUzs] = useState<number>(100000);
  const [topUpAmountUzs, setTopUpAmountUzs] = useState<number>(100000);
  const [personalCardMsg, setPersonalCardMsg] = useState<string | null>(null);
  const [personalCardErr, setPersonalCardErr] = useState<string | null>(null);
  const [personalCardBusy, setPersonalCardBusy] = useState(false);

  useEffect(() => {
    setFullName(translatePersonName(user.fullName, lang));
    setCarModel(translateCarModel(user.carModel, lang));
    setPlateNumber(user.plateNumber);
    setPreferredFuel(user.preferredFuel);
    setProfileDirty(false);
    setHolderName(translatePersonName(user.fullName, lang).toUpperCase());
    setIssueHolder(translatePersonName(user.fullName, lang).toUpperCase());
  }, [user.fullName, user.carModel, user.plateNumber, user.preferredFuel, lang]);

  useEffect(() => {
    if (!profileDirty) {
      setFullName(translatePersonName(user.fullName, lang));
      setCarModel(translateCarModel(user.carModel, lang));
      setHolderName(translatePersonName(user.fullName, lang).toUpperCase());
      setIssueHolder(translatePersonName(user.fullName, lang).toUpperCase());
    }
  }, [profileDirty, user.fullName, user.carModel, lang]);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);

    if (!validateUzbekPlate(plateNumber)) {
      setProfileErr(t.errEnterUzPlate);
      return;
    }

    setBusy(true);
    try {
      const payload = await updateDriverProfile({
        fullName: fullName.trim(),
        carModel: carModel.trim(),
        plateNumber: normalizeUzbekPlate(plateNumber),
        preferredFuel,
      });
      onUpdateSession(payload);
      setProfileDirty(false);
      setProfileMsg(t.profileUpdatedSuccess);
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : t.profileSaveBtnError);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddNewCar(e: FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);

    if (newCarModel.trim().length < 2) {
      setProfileErr(t.errEnterCarModel);
      return;
    }
    if (!validateUzbekPlate(newCarPlate)) {
      setProfileErr(t.errEnterUzPlate);
      return;
    }

    setBusy(true);
    try {
      const payload = await addDriverVehicle({
        carModel: newCarModel.trim(),
        plateNumber: normalizeUzbekPlate(newCarPlate),
        preferredFuel: newCarFuel,
        makeDefault: true,
      });
      onUpdateSession(payload);
      setNewCarModel('');
      setNewCarPlate('');
      setNewCarFuel('metan');
      setShowAddCar(false);
      setProfileMsg(t.carAddedSuccess);
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : t.errAddCarFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleSwitchVehicle(vehicleId: string) {
    setProfileMsg(null);
    setProfileErr(null);
    setBusy(true);
    try {
      const payload = await setDefaultVehicle(vehicleId);
      onUpdateSession(payload);
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : t.errSwitchCarProfileFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteVehicle(vehicleId: string) {
    setProfileMsg(null);
    setProfileErr(null);
    setBusy(true);
    try {
      const payload = await deleteDriverVehicle(vehicleId);
      onUpdateSession(payload);
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : t.errDeleteCarFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddCard(e: FormEvent) {
    e.preventDefault();
    setCardErr(null);

    const check = validateCardNumber(cardNumber);
    if (!check.valid) {
      setCardErr(localizeCardError(check.error));
      return;
    }
    if (!validateCardExpiry(expiry)) {
      setCardErr(t.errEnterCardExpiry);
      return;
    }
    if (!/^\d{3,4}$/.test(cvc.trim())) {
      setCardErr(t.errEnterCardCvc);
      return;
    }

    setBusy(true);
    try {
      const payload = await addLinkedCard({
        cardNumber,
        expiry,
        holderName: holderName.trim().toUpperCase(),
        cvc: cvc.trim(),
        makeDefault: true,
      });
      onUpdateSession(payload);
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setShowAddCard(false);
    } catch (err) {
      setCardErr(err instanceof Error ? err.message : t.errAddCardFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleSetDefault(cardId: string) {
    setCardErr(null);
    setBusy(true);
    try {
      const payload = await setDefaultCard(cardId);
      onUpdateSession(payload);
    } catch (err) {
      setCardErr(err instanceof Error ? err.message : t.errSwitchCardFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCard(cardId: string) {
    setCardErr(null);
    setBusy(true);
    try {
      const payload = await deleteLinkedCard(cardId);
      onUpdateSession(payload);
    } catch (err) {
      setCardErr(err instanceof Error ? err.message : t.errDeleteLastCard);
    } finally {
      setBusy(false);
    }
  }

  async function handleIssuePersonalCard(e: FormEvent) {
    e.preventDefault();
    setPersonalCardErr(null);
    setPersonalCardMsg(null);
    setPersonalCardBusy(true);
    try {
      const payload = await issuePersonalCard({
        tier: issueTier,
        style: issueStyle,
        holderName: issueHolder.trim().toUpperCase(),
        initialTopUpUzs,
      });
      onUpdateSession(payload);
      setPersonalCardMsg(t.personalCardIssuedSuccess);
    } catch (err) {
      setPersonalCardErr(
        err instanceof Error ? err.message : t.errIssueCardFailed,
      );
    } finally {
      setPersonalCardBusy(false);
    }
  }

  async function handleTopUpPersonalCard(e: FormEvent) {
    e.preventDefault();
    setPersonalCardErr(null);
    setPersonalCardMsg(null);
    const check = validatePersonalCardTopUp(topUpAmountUzs);
    if (!check.valid) {
      setPersonalCardErr(localizeTopUpError(check.error));
      return;
    }
    setPersonalCardBusy(true);
    try {
      const payload = await topUpPersonalCard(topUpAmountUzs);
      onUpdateSession(payload);
      setPersonalCardMsg(t.personalCardTopUpSuccess);
    } catch (err) {
      setPersonalCardErr(
        err instanceof Error ? err.message : t.errTopUpFailed,
      );
    } finally {
      setPersonalCardBusy(false);
    }
  }

  async function handleChangeCardDesign(updates: {
    style?: PersonalCardStyle;
    tier?: PersonalCardTier;
  }) {
    setPersonalCardErr(null);
    setPersonalCardMsg(null);
    setPersonalCardBusy(true);
    try {
      const payload = await updatePersonalCardDesign(updates);
      onUpdateSession(payload);
    } catch (err) {
      setPersonalCardErr(
        err instanceof Error ? err.message : t.errCardDesignFailed,
      );
    } finally {
      setPersonalCardBusy(false);
    }
  }

  async function handleToggleFreezePersonalCard() {
    if (!user.personalCard) return;
    setPersonalCardErr(null);
    setPersonalCardMsg(null);
    setPersonalCardBusy(true);
    try {
      const payload = await togglePersonalCardFreeze(!user.personalCard.isFrozen);
      onUpdateSession(payload);
    } catch (err) {
      setPersonalCardErr(
        err instanceof Error ? err.message : t.errCardFreezeFailed,
      );
    } finally {
      setPersonalCardBusy(false);
    }
  }

  const defaultCard = user.cards.find((c) => c.isDefault) || user.cards[0];
  const vehicles = getDriverVehicles(user);
  const personalCard = user.personalCard || null;

  const STYLE_OPTIONS: {
    id: PersonalCardStyle;
    label: string;
    swatch: string;
  }[] = [
    {
      id: 'cobalt',
      label: t.personalCardStyleCobalt,
      swatch: 'linear-gradient(135deg, #092C63 0%, #0B57D0 100%)',
    },
    {
      id: 'arctic',
      label: t.personalCardStyleArctic,
      swatch: 'linear-gradient(135deg, #FFFFFF 0%, #D9E8FC 100%)',
    },
    {
      id: 'night',
      label: t.personalCardStyleNight,
      swatch: 'linear-gradient(135deg, #051633 0%, #0F408E 100%)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Signature Personal dezagamiz Card section */}
      <section
        data-testid="personal-card-section"
        className="dz-section-enter rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-card)] sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--dz-border)] pb-4">
          <div>
            <div className="text-xs font-semibold text-[var(--dz-primary)]">
              {t.personalCardEyebrow}
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-[var(--dz-ink)]">
              {t.personalCardTitle}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--dz-ink-secondary)]">
              {t.personalCardSubtitle}
            </p>
          </div>
          {personalCard && (
            <div className="text-right font-mono-tabular">
              <div className="text-[11px] font-medium text-[var(--dz-ink-muted)]">
                {personalCard.isFrozen
                  ? t.personalCardFrozenBadge
                  : t.personalCardActiveBadge}{' '}
                · {t.personalCardCashbackLabel}{' '}
                {Math.round(PERSONAL_CARD_CASHBACK_RATE[personalCard.tier] * 100)}%
              </div>
              <div className="mt-0.5 text-lg font-extrabold text-[var(--dz-primary)]">
                {formatMoney(personalCard.balanceUzs)}
              </div>
            </div>
          )}
        </div>

        {personalCardErr && (
          <div
            role="alert"
            className="dz-feedback-enter mt-4 rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
          >
            {personalCardErr}
          </div>
        )}
        {personalCardMsg && (
          <div className="dz-feedback-enter mt-4 rounded-xl border border-[#BCE3D3] dark:border-[#1E6B50] bg-[var(--dz-success-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-success)]">
            {personalCardMsg}
          </div>
        )}

        {!personalCard ? (
          <form
            onSubmit={handleIssuePersonalCard}
            className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
          >
            <div className="lg:col-span-5">
              <DezagamizPersonalCardVisual
                cardNumber="7788000000000000"
                holderName={issueHolder}
                expiry="11/31"
                tier={issueTier}
                style={issueStyle}
                balanceUzs={initialTopUpUzs}
                carModel={user.carModel}
                plateNumber={user.plateNumber}
                isPreview
              />
            </div>

            <div className="space-y-4 lg:col-span-7">
              {/* Tier selection */}
              <div>
                <div className="text-xs font-semibold text-[var(--dz-ink-secondary)]">
                  {t.personalCardTierLabel}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {(['standard', 'prime'] as PersonalCardTier[]).map((tierId) => {
                    const active = issueTier === tierId;
                    const title =
                      tierId === 'prime'
                        ? t.personalCardTierPrime
                        : t.personalCardTierStandard;
                    const desc =
                      tierId === 'prime'
                        ? t.personalCardTierPrimeDesc
                        : t.personalCardTierStandardDesc;
                    return (
                      <button
                        key={tierId}
                        type="button"
                        data-testid={`personal-card-tier-${tierId}`}
                        onClick={() => setIssueTier(tierId)}
                        className={`dz-focus rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                          active
                            ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-surface-tint)]'
                            : 'border-[var(--dz-border)] bg-[var(--dz-surface)] hover:border-[var(--dz-border-strong)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-bold text-[var(--dz-ink)]">
                            {title}
                          </span>
                          {active && (
                            <Check
                              className="dz-icon-pop h-4 w-4 text-[var(--dz-primary)]"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div className="mt-1 text-xs text-[var(--dz-ink-secondary)]">
                          {desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* House style finish selection */}
              <div>
                <div className="text-xs font-semibold text-[var(--dz-ink-secondary)]">
                  {t.personalCardStyleLabel}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {STYLE_OPTIONS.map((opt) => {
                    const active = issueStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        data-testid={`personal-card-style-${opt.id}`}
                        onClick={() => setIssueStyle(opt.id)}
                        className={`dz-focus flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all duration-200 ${
                          active
                            ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] text-[var(--dz-primary)]'
                            : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:border-[var(--dz-border-strong)]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-5 w-7 shrink-0 rounded-md border border-[#B8CEF2]"
                          style={{ background: opt.swatch }}
                        />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Holder name + Starter balance */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="personal-card-holder"
                    className="block text-xs font-semibold text-[var(--dz-ink-secondary)]"
                  >
                    {t.cardHolderLabel}
                  </label>
                  <input
                    id="personal-card-holder"
                    type="text"
                    required
                    value={issueHolder}
                    onChange={(e) => setIssueHolder(e.target.value.toUpperCase())}
                    className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm uppercase text-[var(--dz-ink)]"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold text-[var(--dz-ink-secondary)]">
                    {t.personalCardInitialTopUp}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {[0, 100000, 250000, 500000].map((amt) => {
                      const active = initialTopUpUzs === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setInitialTopUpUzs(amt)}
                          className={`dz-focus h-11 rounded-xl border px-3 font-mono-tabular text-xs font-semibold transition-all duration-200 ${
                            active
                              ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white'
                              : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:border-[var(--dz-primary)]'
                          }`}
                        >
                          {amt === 0 ? '0' : `${amt / 1000}k`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                data-testid="issue-personal-card-btn"
                disabled={personalCardBusy}
                className="dz-focus dz-dark-active-glow flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--dz-primary)] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--dz-primary-hover)] disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>
                  {personalCardBusy ? t.personalCardIssuing : t.personalCardCta}
                </span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <DezagamizPersonalCardVisual
                cardNumber={personalCard.cardNumber}
                holderName={personalCard.holderName}
                expiry={personalCard.expiry}
                tier={personalCard.tier}
                style={personalCard.style}
                balanceUzs={personalCard.balanceUzs}
                bonusUzs={personalCard.bonusUzs}
                carModel={user.carModel}
                plateNumber={user.plateNumber}
                isFrozen={personalCard.isFrozen}
              />
            </div>

            <div className="space-y-4 lg:col-span-7">
              {/* Balance + Bonus summary */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] p-3.5">
                  <div className="text-[11px] font-medium text-[var(--dz-ink-muted)]">
                    {t.personalCardBalanceLabel}
                  </div>
                  <div
                    data-testid="personal-card-balance-stat"
                    className="mt-1 font-mono-tabular text-base font-bold text-[var(--dz-ink)]"
                  >
                    {formatMoney(personalCard.balanceUzs)}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] p-3.5">
                  <div className="text-[11px] font-medium text-[var(--dz-ink-muted)]">
                    {t.personalCardBonusLabel}
                  </div>
                  <div
                    data-testid="personal-card-bonus-stat"
                    className="mt-1 font-mono-tabular text-base font-bold text-[var(--dz-primary)]"
                  >
                    {formatMoney(personalCard.bonusUzs)}
                  </div>
                </div>

                <div className="col-span-2 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] p-3.5 sm:col-span-1">
                  <div className="text-[11px] font-medium text-[var(--dz-ink-muted)]">
                    {t.personalCardTierLabel}
                  </div>
                  <div className="mt-1 font-display text-sm font-bold text-[var(--dz-ink)]">
                    {personalCard.tier === 'prime'
                      ? `${t.personalCardTierPrime} · 5%`
                      : `${t.personalCardTierStandard} · 3%`}
                  </div>
                </div>
              </div>

              {/* Instant top-up form */}
              <form
                onSubmit={handleTopUpPersonalCard}
                className="rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--dz-ink)]">
                    {t.personalCardTopUpBtn}
                  </span>
                  {defaultCard && (
                    <span className="font-mono-tabular text-[11px] text-[var(--dz-ink-muted)]">
                      {defaultCard.network} ·••• {defaultCard.last4}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[50000, 100000, 250000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTopUpAmountUzs(preset)}
                      className={`dz-focus rounded-xl border px-3 py-1.5 font-mono-tabular text-xs font-semibold transition-all duration-200 ${
                        topUpAmountUzs === preset
                          ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white'
                          : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:border-[var(--dz-primary)]'
                      }`}
                    >
                      +{formatMoney(preset)}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                  <input
                    type="number"
                    min={10000}
                    max={5000000}
                    step={10000}
                    aria-label={t.personalCardTopUpBtn}
                    value={topUpAmountUzs}
                    onChange={(e) => setTopUpAmountUzs(Number(e.target.value) || 0)}
                    className="dz-focus h-11 flex-1 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm font-bold text-[var(--dz-ink)]"
                  />
                  <button
                    type="submit"
                    data-testid="topup-personal-card-btn"
                    disabled={personalCardBusy}
                    className="dz-focus dz-dark-active-glow inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary)] px-5 text-xs font-bold text-white transition-colors hover:bg-[var(--dz-primary-hover)] disabled:opacity-60"
                  >
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    <span>{t.personalCardTopUpConfirm}</span>
                  </button>
                </div>
              </form>

              {/* Style switch, Tier switch & Freeze toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {STYLE_OPTIONS.map((opt) => {
                    const active = personalCard.style === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={personalCardBusy}
                        data-testid={`switch-style-${opt.id}`}
                        onClick={() => void handleChangeCardDesign({ style: opt.id })}
                        className={`dz-focus inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                          active
                            ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] text-[var(--dz-primary)]'
                            : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:border-[var(--dz-border-strong)]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-3.5 w-5 rounded border border-[#B8CEF2]"
                          style={{ background: opt.swatch }}
                        />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={personalCardBusy}
                    onClick={() =>
                      void handleChangeCardDesign({
                        tier: personalCard.tier === 'prime' ? 'standard' : 'prime',
                      })
                    }
                    className="dz-focus rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 py-2 text-xs font-semibold text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)]"
                  >
                    {personalCard.tier === 'prime'
                      ? `${t.personalCardTierStandard} (3%)`
                      : `${t.personalCardTierPrime} (5%)`}
                  </button>

                  <button
                    type="button"
                    data-testid="freeze-personal-card-btn"
                    disabled={personalCardBusy}
                    onClick={() => void handleToggleFreezePersonalCard()}
                    className={`dz-focus inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                      personalCard.isFrozen
                        ? 'border-[#BCE3D3] dark:border-[#1E6B50] bg-[var(--dz-success-bg)] text-[var(--dz-success)]'
                        : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink-secondary)] hover:border-[#F5C2C2] dark:hover:border-[#7A2830] hover:bg-[var(--dz-danger-bg)] hover:text-[var(--dz-danger)]'
                    }`}
                  >
                    {personalCard.isFrozen ? (
                      <>
                        <Unlock key="unfreeze" className="dz-icon-pop h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t.personalCardUnfreezeBtn}</span>
                      </>
                    ) : (
                      <>
                        <Lock key="freeze" className="dz-icon-pop h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t.personalCardFreezeBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Linked cards column */}
      <section className="dz-section-enter dz-stagger-1 rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-card)] sm:p-8 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--dz-border)] pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--dz-ink)]">
              {t.linkedCardsTitle}
            </h1>
            <p className="mt-1 text-sm text-[var(--dz-ink-secondary)]">
              {t.linkedCardsSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowAddCard((v) => !v);
              setCardErr(null);
            }}
            className="dz-focus inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--dz-primary)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--dz-primary-hover)] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{showAddCard ? t.hideForm : t.addCardBtn}</span>
          </button>
        </div>

        {defaultCard && !showAddCard && (
          <div className="mt-6">
            <BankCardPreview
              cardNumber={defaultCard.maskedNumber}
              holderName={defaultCard.holderName}
              expiry={defaultCard.expiry}
              network={defaultCard.network}
            />
          </div>
        )}

        {cardErr && (
          <div
            role="alert"
            className="dz-feedback-enter mt-5 rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
          >
            {cardErr}
          </div>
        )}

        {showAddCard && (
          <form
            onSubmit={handleAddCard}
            className="dz-panel-enter mt-6 space-y-4 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] p-5"
          >
            <BankCardPreview
              cardNumber={cardNumber}
              holderName={holderName}
              expiry={expiry}
              network={detectCardNetwork(cardNumber)}
            />
            <div>
              <label
                htmlFor="new-card-number"
                className="block text-sm font-semibold text-[var(--dz-ink)]"
              >
                {t.profileNewCardNumberLabel}
              </label>
              <input
                id="new-card-number"
                type="text"
                inputMode="numeric"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumberInput(e.target.value))}
                placeholder="9860 0102 3456 7898"
                className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm text-[var(--dz-ink)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="new-card-expiry"
                  className="block text-sm font-semibold text-[var(--dz-ink)]"
                >
                  {t.cardExpiryLabel}
                </label>
                <input
                  id="new-card-expiry"
                  type="text"
                  inputMode="numeric"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiryInput(e.target.value))}
                  placeholder="09/29"
                  className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm text-[var(--dz-ink)]"
                />
              </div>
              <div>
                <label
                  htmlFor="new-card-cvc"
                  className="block text-sm font-semibold text-[var(--dz-ink)]"
                >
                  {t.cardCvcLabel}
                </label>
                <input
                  id="new-card-cvc"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={cvc}
                  onChange={(e) =>
                    setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  placeholder="777"
                  className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm text-[var(--dz-ink)]"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="new-card-holder"
                className="block text-sm font-semibold text-[var(--dz-ink)]"
              >
                {t.cardHolderLabel}
              </label>
              <input
                id="new-card-holder"
                type="text"
                required
                value={holderName}
                onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm uppercase text-[var(--dz-ink)]"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="dz-focus flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary)] text-sm font-semibold text-white hover:bg-[var(--dz-primary-hover)] disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              <span>{t.profileBindNewCardBtn}</span>
            </button>
          </form>
        )}

        <div className="mt-6 divide-y divide-[var(--dz-border)] border-t border-[var(--dz-border)]">
          {user.cards.map((card) => (
            <div
              key={card.id}
              className="flex flex-wrap items-center justify-between gap-4 py-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-[var(--dz-ink)]">
                    {card.network}
                  </span>
                  <span className="font-mono-tabular text-sm font-medium text-[var(--dz-ink-secondary)]">
                    {card.maskedNumber}
                  </span>
                </div>
                <div className="mt-0.5 font-mono-tabular text-xs text-[var(--dz-ink-muted)]">
                  {t.profileExpiryPrefix} {card.expiry} · {localizePersonName(card.holderName)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {card.isDefault ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--dz-success)]">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {t.primaryCard}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleSetDefault(card.id)}
                    className="dz-focus rounded-lg border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)]"
                  >
                    {t.makePrimary}
                  </button>
                )}

                <button
                  type="button"
                  disabled={busy}
                  aria-label={`${t.profileDeleteCardAriaPrefix} ${card.network} ${card.last4}`}
                  onClick={() => handleDeleteCard(card.id)}
                  className="dz-focus flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--dz-border)] text-[var(--dz-ink-muted)] hover:border-[#F5C2C2] dark:hover:border-[#7A2830] hover:bg-[var(--dz-danger-bg)] hover:text-[var(--dz-danger)]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Driver & Vehicle profile */}
      <section className="dz-section-enter dz-stagger-2 rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-sm)] sm:p-8 lg:col-span-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--dz-primary)]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>{t.profileAttendantSectionEyebrow}</span>
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-[var(--dz-ink)]">
              {t.profileDriverCarTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowAddCar((v) => !v);
              setProfileErr(null);
              setProfileMsg(null);
            }}
            className="dz-focus inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[var(--dz-surface-tint)] px-3 py-1.5 text-xs font-semibold text-[var(--dz-primary)] transition-colors hover:bg-[#D8E7FE] dark:hover:bg-[#1E3B6B] whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{showAddCar ? t.hideForm : t.addNewCarBtn}</span>
          </button>
        </div>

        <p className="mt-1 text-xs text-[var(--dz-ink-secondary)]">
          {t.profileAttendantCarHint}
        </p>

        {profileErr && (
          <div
            role="alert"
            className="dz-feedback-enter mt-4 rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
          >
            {profileErr}
          </div>
        )}
        {profileMsg && (
          <div className="dz-feedback-enter mt-4 rounded-xl border border-[#BCE3D3] dark:border-[#1E6B50] bg-[var(--dz-success-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-success)]">
            {profileMsg}
          </div>
        )}

        {showAddCar && (
          <form
            onSubmit={handleAddNewCar}
            className="dz-panel-enter mt-4 space-y-3 rounded-2xl border border-[var(--dz-primary)]/25 bg-[var(--dz-surface-subtle)] p-4"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--dz-ink)]">
              <CarFront className="h-4 w-4 text-[var(--dz-primary)]" aria-hidden="true" />
              <span>{t.addNewCarBtn}</span>
            </div>
            <div>
              <label
                htmlFor="new-car-model"
                className="block text-xs font-semibold text-[var(--dz-ink-secondary)]"
              >
                {t.newCarModelLabel}
              </label>
              <input
                id="new-car-model"
                type="text"
                required
                value={newCarModel}
                onChange={(e) => setNewCarModel(e.target.value)}
                placeholder="BYD Song Plus / Kia K5"
                className="dz-focus mt-1 h-10 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 text-sm text-[var(--dz-ink)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="new-car-plate"
                  className="block text-xs font-semibold text-[var(--dz-ink-secondary)]"
                >
                  {t.newCarPlateLabel}
                </label>
                <input
                  id="new-car-plate"
                  type="text"
                  required
                  value={newCarPlate}
                  onChange={(e) => setNewCarPlate(e.target.value.toUpperCase())}
                  placeholder="01 B 909 AA"
                  className="dz-focus mt-1 h-10 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 font-mono-tabular text-sm uppercase text-[var(--dz-ink)]"
                />
              </div>
              <div>
                <label
                  htmlFor="new-car-fuel"
                  className="block text-xs font-semibold text-[var(--dz-ink-secondary)]"
                >
                  {t.preferredFuelLabel}
                </label>
                <select
                  id="new-car-fuel"
                  value={newCarFuel}
                  onChange={(e) => setNewCarFuel(e.target.value as FuelCode)}
                  className="dz-focus mt-1 h-10 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 text-sm font-medium text-[var(--dz-ink)]"
                >
                  {(['metan', 'propan', 'ai92', 'ai95'] as FuelCode[]).map((code) => (
                    <option key={code} value={code}>
                      {fuelShortLabel(code)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="dz-focus flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary)] text-xs font-bold text-white transition-colors hover:bg-[var(--dz-primary-hover)] disabled:opacity-60"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{t.saveNewCarBtn}</span>
            </button>
          </form>
        )}

        {/* Saved garage vehicles */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold text-[var(--dz-ink-secondary)]">
            {t.myVehiclesTitle} ({vehicles.length})
          </div>
          <div className="space-y-2">
            {vehicles.map((veh) => (
              <div
                key={veh.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-xs transition-all duration-200 ${
                  veh.isDefault
                    ? 'dz-dark-active-glow border-[var(--dz-primary)]/40 bg-[var(--dz-surface-tint)]/60'
                    : 'border-[var(--dz-border)] bg-[var(--dz-surface-subtle)]'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--dz-ink)]">
                    {localizeCarModel(veh.carModel)}
                  </div>
                  <div className="font-mono-tabular text-[11px] text-[var(--dz-ink-secondary)]">
                    {veh.plateNumber} · {fuelShortLabel(veh.preferredFuel)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {veh.isDefault ? (
                    <span className="dz-panel-enter inline-flex items-center gap-1 text-[11px] font-bold text-[var(--dz-success)]">
                      <Check className="dz-icon-pop h-3.5 w-3.5" aria-hidden="true" />
                      {t.activeCarBadge}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSwitchVehicle(veh.id)}
                      className="dz-focus rounded-lg border border-[var(--dz-border)] bg-[var(--dz-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)]"
                    >
                      {t.selectCarBtn}
                    </button>
                  )}
                  {vehicles.length > 1 && (
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={`${t.deleteCarLabel} ${localizeCarModel(veh.carModel)} ${veh.plateNumber}`}
                      onClick={() => handleDeleteVehicle(veh.id)}
                      className="dz-focus flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink-muted)] hover:border-[#F5C2C2] dark:hover:border-[#7A2830] hover:bg-[var(--dz-danger-bg)] hover:text-[var(--dz-danger)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4 border-t border-[var(--dz-border)] pt-4">
          <div>
            <label
              htmlFor="prof-phone"
              className="block text-xs font-semibold text-[var(--dz-ink-secondary)]"
            >
              {t.profileAccountPhoneLabel}
            </label>
            <input
              id="prof-phone"
              type="text"
              disabled
              value={user.phone}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-bg)] px-3.5 font-mono-tabular text-sm text-[var(--dz-ink-muted)]"
            />
          </div>

          <div>
            <label
              htmlFor="prof-name"
              className="block text-xs font-semibold text-[var(--dz-ink-secondary)]"
            >
              {t.profileDriverNameLabel}
            </label>
            <input
              id="prof-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setProfileDirty(true);
                setFullName(e.target.value);
              }}
              className="dz-focus mt-1 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 text-sm text-[var(--dz-ink)]"
            />
          </div>

          <div>
            <label
              htmlFor="prof-car"
              className="block text-xs font-semibold text-[var(--dz-ink-secondary)]"
            >
              {t.carModelLabel}
            </label>
            <input
              id="prof-car"
              type="text"
              required
              value={carModel}
              onChange={(e) => {
                setProfileDirty(true);
                setCarModel(e.target.value);
              }}
              className="dz-focus mt-1 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 text-sm text-[var(--dz-ink)]"
            />
          </div>

          <div>
            <label
              htmlFor="prof-plate"
              className="block text-xs font-semibold text-[var(--dz-ink-secondary)]"
            >
              {t.plateNumberLabel}
            </label>
            <input
              id="prof-plate"
              type="text"
              required
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              className="dz-focus mt-1 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm uppercase text-[var(--dz-ink)]"
            />
          </div>

          <div>
            <label
              htmlFor="prof-fuel"
              className="block text-xs font-semibold text-[var(--dz-ink-secondary)]"
            >
              {t.preferredFuelLabel}
            </label>
            <select
              id="prof-fuel"
              value={preferredFuel}
              onChange={(e) => setPreferredFuel(e.target.value as FuelCode)}
              className="dz-focus mt-1 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 text-sm font-medium text-[var(--dz-ink)]"
            >
              {(['metan', 'propan', 'ai92', 'ai95'] as FuelCode[]).map((code) => (
                <option key={code} value={code}>
                  {fuelFullLabel(code)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="dz-focus flex h-11 w-full items-center justify-center rounded-xl border border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] text-sm font-semibold text-[var(--dz-primary)] transition-colors hover:bg-[#D8E7FE] dark:hover:bg-[#1E3B6B] disabled:opacity-60"
          >
            {t.saveCarData}
          </button>
        </form>
      </section>
      </div>
    </div>
  );
}
