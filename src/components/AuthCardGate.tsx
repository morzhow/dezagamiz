import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  Check,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Presentation,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
} from 'lucide-react';
import {
  enterGuestMode,
  loginWithPhone,
  registerAndBindCard,
  switchCreatorRole,
  unlockCreatorSection,
} from '../api/client';
import {
  detectCardNetwork,
  formatCardNumberInput,
  formatExpiryInput,
  formatUzbekPhone,
  normalizeUzbekPlate,
  validateCardExpiry,
  validateCardNumber,
  validateUzbekPhone,
  validateUzbekPlate,
} from '../lib/dezagamiz';
import { useI18n } from '../lib/i18n';
import type { AccessRole, FuelCode, SessionPayload } from '../types/dezagamiz';
import { AppIcon } from './AppIcon';
import { BankCardPreview } from './BankCardPreview';
import { BrandLogo } from './BrandLogo';
import { LanguageSelector } from './LanguageSelector';
import heroStationImg from '../assets/images/hero_station_uzbekistan_1794645013755.jpg';
import { ThemeToggle } from './ThemeToggle';

interface AuthCardGateProps {
  onSuccess: (payload: SessionPayload) => void;
  initialMode?: 'register' | 'login' | 'guest' | 'creator';
  guestExpiredNotice?: boolean;
  onOpenShowcase?: () => void;
}

export function AuthCardGate({
  onSuccess,
  initialMode = 'register',
  guestExpiredNotice = false,
  onOpenShowcase,
}: AuthCardGateProps) {
  const { t, fuelShortLabel, localizeCardError } = useI18n();
  const [mode, setMode] = useState<'register' | 'login' | 'guest' | 'creator'>(
    initialMode,
  );
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Driver & Vehicle registration
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [carModel, setCarModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [preferredFuel, setPreferredFuel] = useState<FuelCode>('metan');

  // Step 2: Credit / Bank card binding
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [holderName, setHolderName] = useState('');
  const [cvc, setCvc] = useState('');

  // Login mode
  const [loginPhone, setLoginPhone] = useState('+998 ');

  // Creator mode
  const [creatorCode, setCreatorCode] = useState('');
  const [showCreatorCode, setShowCreatorCode] = useState(false);
  const [creatorVerified, setCreatorVerified] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const detectedNetwork = detectCardNetwork(cardNumber);

  function handleStep1Submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError(t.errEnterFullName);
      return;
    }
    if (!validateUzbekPhone(phone)) {
      setError(t.errEnterUzPhone);
      return;
    }
    if (carModel.trim().length < 2) {
      setError(t.errEnterCarModel);
      return;
    }
    if (!validateUzbekPlate(plateNumber)) {
      setError(t.errEnterUzPlate);
      return;
    }

    if (!holderName.trim()) {
      setHolderName(fullName.trim().toUpperCase());
    }
    setStep(2);
  }

  async function handleStep2Submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const cardCheck = validateCardNumber(cardNumber);
    if (!cardCheck.valid) {
      setError(localizeCardError(cardCheck.error));
      return;
    }
    if (!validateCardExpiry(expiry)) {
      setError(t.errEnterCardExpiry);
      return;
    }
    if (holderName.trim().length < 3) {
      setError(t.errEnterCardHolder);
      return;
    }
    if (!/^\d{3,4}$/.test(cvc.trim())) {
      setError(t.errEnterCardCvc);
      return;
    }

    setSubmitting(true);
    try {
      const payload = await registerAndBindCard({
        fullName: fullName.trim(),
        phone,
        carModel: carModel.trim(),
        plateNumber: normalizeUzbekPlate(plateNumber),
        preferredFuel,
        cardNumber,
        expiry,
        holderName: holderName.trim().toUpperCase(),
        cvc: cvc.trim(),
      });
      onSuccess(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errRegisterFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validateUzbekPhone(loginPhone)) {
      setError(t.errEnterUzPhone);
      return;
    }

    setSubmitting(true);
    try {
      const payload = await loginWithPhone(loginPhone);
      onSuccess(payload);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.errLoginFailed,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnterGuest() {
    setError(null);
    setSubmitting(true);
    try {
      const payload = await enterGuestMode();
      onSuccess(payload);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.guestExpiredNotice,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreatorSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await unlockCreatorSection(creatorCode, 'admin');
      setCreatorVerified(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.errCreatorCodeInvalid,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChooseCreatorRole(role: AccessRole) {
    setError(null);
    setSubmitting(true);
    try {
      const payload = await switchCreatorRole(role);
      onSuccess(payload);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.errChooseRoleFailed,
      );
    } finally {
      setSubmitting(false);
    }
  }

  function fillSampleCard(sampleNumber: string) {
    setCardNumber(formatCardNumberInput(sampleNumber));
    setExpiry('08/29');
    if (!holderName.trim()) {
      setHolderName((fullName.trim() || t.sampleCardHolderPlaceholder).toUpperCase());
    }
    setCvc('777');
    setError(null);
  }

  return (
    <div className="min-h-screen bg-[var(--dz-bg)] text-[var(--dz-ink)]">
      {/* Compact brand header with app icon, theme toggle and language switcher */}
      <header className="border-b border-[var(--dz-border)] bg-[var(--dz-surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
          <BrandLogo />
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[var(--dz-ink-secondary)]">
              <Lock className="h-4 w-4 shrink-0 text-[var(--dz-primary)]" aria-hidden="true" />
              <span>{t.gateBadge}</span>
            </div>
            <ThemeToggle compact />
            <LanguageSelector />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-8 px-4 py-6 sm:px-8 lg:grid-cols-12 lg:py-8">
        {/* Left column: Blue & White architectural showcase */}
        <section className="dz-section-enter flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-primary-deep)] text-white lg:col-span-6">
          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-blue-200">
                {t.heroEyebrow}
              </p>
              {onOpenShowcase && (
                <button
                  type="button"
                  data-testid="open-showcase-gate-btn"
                  onClick={onOpenShowcase}
                  className="dz-focus inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/25 whitespace-nowrap"
                >
                  <Presentation className="h-4 w-4" aria-hidden="true" />
                  <span>{t.openShowcaseBtn}</span>
                </button>
              )}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              {t.heroTitle}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-blue-100">
              {t.heroSubtitle}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="font-mono-tabular text-xs font-semibold text-blue-200">
                  {t.step1Label}
                </div>
                <div className="mt-1.5 text-sm font-semibold text-white">
                  {t.step1Title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-blue-100/85">
                  {t.step1Desc}
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="font-mono-tabular text-xs font-semibold text-blue-200">
                  {t.step2Label}
                </div>
                <div className="mt-1.5 text-sm font-semibold text-white">
                  {t.step2Title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-blue-100/85">
                  {t.step2Desc}
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="font-mono-tabular text-xs font-semibold text-blue-200">
                  {t.step3Label}
                </div>
                <div className="mt-1.5 text-sm font-semibold text-white">
                  {t.step3Title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-blue-100/85">
                  {t.step3Desc}
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-2 h-60 w-full overflow-hidden border-t border-white/15 bg-[#082452] sm:h-72">
            <img
              src={heroStationImg}
              alt={t.heroImageAlt}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.03]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#092C63]/85 via-[#092C63]/20 to-transparent"
            />
            <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-white">
              <span>{t.heroCities}</span>
              <span className="font-mono-tabular text-blue-100">
                {t.heroPriceFrom}
              </span>
            </div>
          </div>
        </section>

        {/* Right column: Mandatory Registration & Card Gate + 3-Day Guest + Creator */}
        <section className="dz-card-enter dz-stagger-1 flex flex-col justify-start rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-card)] sm:p-8 lg:col-span-6">
          {guestExpiredNotice && (
            <div
              role="alert"
              className="dz-feedback-enter mb-4 rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
            >
              {t.guestExpiredNotice}
            </div>
          )}

          {/* Mode switcher (4 modes including Guest 3d) */}
          <div
            role="tablist"
            aria-label={t.entryModeAria}
            className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--dz-surface-subtle)] p-1 sm:grid-cols-4"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`min-h-[42px] rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                mode === 'register'
                  ? 'dz-dark-active-glow bg-[var(--dz-surface)] text-[var(--dz-primary)] shadow-sm'
                  : 'text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]'
              }`}
            >
              {t.tabRegister}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`min-h-[42px] rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                mode === 'login'
                  ? 'dz-dark-active-glow bg-[var(--dz-surface)] text-[var(--dz-primary)] shadow-sm'
                  : 'text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]'
              }`}
            >
              {t.tabLogin}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'guest'}
              onClick={() => {
                setMode('guest');
                setError(null);
              }}
              className={`min-h-[42px] rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                mode === 'guest'
                  ? 'dz-dark-active-glow bg-[var(--dz-surface)] text-[var(--dz-primary)] shadow-sm'
                  : 'text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]'
              }`}
            >
              {t.tabGuest}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'creator'}
              onClick={() => {
                setMode('creator');
                setError(null);
              }}
              className={`min-h-[42px] rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                mode === 'creator'
                  ? 'dz-dark-active-glow bg-[var(--dz-surface)] text-[var(--dz-primary)] shadow-sm'
                  : 'text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]'
              }`}
            >
              {t.tabCreator}
            </button>
          </div>

          <div
            key={`${mode}-${step}-${creatorVerified ? 'verified' : 'locked'}`}
            className="dz-panel-enter"
          >
          {mode === 'register' ? (
            <div className="mt-6">
              {/* Step progress bar */}
              <div className="flex items-center justify-between gap-4 border-b border-[var(--dz-border)] pb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-mono-tabular text-xs font-bold ${
                      step === 1
                        ? 'bg-[var(--dz-primary)] text-white'
                        : 'bg-[var(--dz-success-bg)] text-[var(--dz-success)]'
                    }`}
                  >
                    {step > 1 ? <Check className="h-4 w-4" /> : '1'}
                  </span>
                  <div>
                    <div className="text-xs font-medium text-[var(--dz-ink-muted)]">
                      {t.stage1Of2}
                    </div>
                    <div className="text-sm font-semibold text-[var(--dz-ink)]">
                      {t.driverAndCar}
                    </div>
                  </div>
                </div>

                <div className="h-px flex-1 bg-[var(--dz-border)]" />

                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-mono-tabular text-xs font-bold ${
                      step === 2
                        ? 'bg-[var(--dz-primary)] text-white'
                        : 'bg-[var(--dz-surface-subtle)] text-[var(--dz-ink-muted)]'
                    }`}
                  >
                    2
                  </span>
                  <div>
                    <div className="text-xs font-medium text-[var(--dz-ink-muted)]">
                      {t.stage2Of2}
                    </div>
                    <div className="text-sm font-semibold text-[var(--dz-ink)]">
                      {t.cardBinding}
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="dz-feedback-enter mt-5 rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
                >
                  {error}
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleStep1Submit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="reg-fullname"
                      className="block text-sm font-semibold text-[var(--dz-ink)]"
                    >
                      {t.fullNameLabel}
                    </label>
                    <input
                      id="reg-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.sampleFullNamePlaceholder}
                      className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 text-sm text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-phone"
                      className="block text-sm font-semibold text-[var(--dz-ink)]"
                    >
                      {t.phoneLabel}
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatUzbekPhone(e.target.value))}
                      placeholder="+998 90 123 45 67"
                      className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="reg-car"
                        className="block text-sm font-semibold text-[var(--dz-ink)]"
                      >
                        {t.carModelLabel}
                      </label>
                      <input
                        id="reg-car"
                        type="text"
                        required
                        value={carModel}
                        onChange={(e) => setCarModel(e.target.value)}
                        placeholder="Chevrolet Cobalt"
                        className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 text-sm text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="reg-plate"
                        className="block text-sm font-semibold text-[var(--dz-ink)]"
                      >
                        {t.plateNumberLabel}
                      </label>
                      <input
                        id="reg-plate"
                        type="text"
                        required
                        value={plateNumber}
                        onChange={(e) =>
                          setPlateNumber(e.target.value.toUpperCase())
                        }
                        placeholder="01 A 777 AA"
                        className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm uppercase text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-sm font-semibold text-[var(--dz-ink)]">
                      {t.preferredFuelLabel}
                    </span>
                    <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(['metan', 'propan', 'ai92', 'ai95'] as FuelCode[]).map(
                        (code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setPreferredFuel(code)}
                            className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                              preferredFuel === code
                                ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] text-[var(--dz-primary)]'
                                : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink-secondary)] hover:border-[var(--dz-border-strong)]'
                            }`}
                          >
                            {fuelShortLabel(code)}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="dz-focus mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--dz-primary-hover)]"
                  >
                    <span>{t.nextBindCard}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleStep2Submit} className="mt-4 space-y-3.5">
                  <BankCardPreview
                    cardNumber={cardNumber}
                    holderName={holderName}
                    expiry={expiry}
                    network={detectedNetwork}
                    compact
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--dz-surface-subtle)] px-3.5 py-2.5 text-xs text-[var(--dz-ink-secondary)]">
                    <span>Uzcard / Humo:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fillSampleCard('8600 0609 1234 5676')}
                        className="rounded-lg border border-[var(--dz-border-strong)] bg-[var(--dz-surface)] px-2.5 py-1 font-mono-tabular font-semibold text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)]"
                      >
                        Uzcard 8600
                      </button>
                      <button
                        type="button"
                        onClick={() => fillSampleCard('9860 0102 3456 7898')}
                        className="rounded-lg border border-[var(--dz-border-strong)] bg-[var(--dz-surface)] px-2.5 py-1 font-mono-tabular font-semibold text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)]"
                      >
                        Humo 9860
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="card-number"
                      className="block text-sm font-semibold text-[var(--dz-ink)]"
                    >
                      {t.cardBinding} (Uzcard, Humo, Visa, Mastercard)
                    </label>
                    <input
                      id="card-number"
                      type="text"
                      inputMode="numeric"
                      required
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(formatCardNumberInput(e.target.value))
                      }
                      placeholder="8600 0609 1234 5676"
                      className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="card-expiry"
                        className="block text-sm font-semibold text-[var(--dz-ink)]"
                      >
                        {t.cardExpiryLabel}
                      </label>
                      <input
                        id="card-expiry"
                        type="text"
                        inputMode="numeric"
                        required
                        value={expiry}
                        onChange={(e) =>
                          setExpiry(formatExpiryInput(e.target.value))
                        }
                        placeholder="08/29"
                        className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="card-cvc"
                        className="block text-sm font-semibold text-[var(--dz-ink)]"
                      >
                        {t.cardCvcLabel}
                      </label>
                      <input
                        id="card-cvc"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        value={cvc}
                        onChange={(e) =>
                          setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))
                        }
                        placeholder="777"
                        className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="card-holder"
                      className="block text-sm font-semibold text-[var(--dz-ink)]"
                    >
                      {t.cardHolderLabel}
                    </label>
                    <input
                      id="card-holder"
                      type="text"
                      required
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                      placeholder={t.sampleCardHolderPlaceholder}
                      className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm uppercase text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[var(--dz-ink-secondary)]">
                    <ShieldCheck
                      className="h-4 w-4 shrink-0 text-[var(--dz-primary)]"
                      aria-hidden="true"
                    />
                    <span>{t.cardVerifiedText}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setError(null);
                      }}
                      className="dz-focus flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-4 text-sm font-semibold text-[var(--dz-ink)] transition-colors hover:bg-[var(--dz-surface-subtle)]"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      <span>{t.back}</span>
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="dz-focus flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--dz-primary-hover)] disabled:opacity-60 sm:col-span-2"
                    >
                      <CreditCard className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {submitting ? t.checkingCard : t.bindCardAndEnter}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--dz-ink)]">
                  {t.loginTitle}
                </h2>
                <p className="mt-1.5 text-sm text-[var(--dz-ink-secondary)]">
                  {t.loginSubtitle}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="login-phone"
                  className="block text-sm font-semibold text-[var(--dz-ink)]"
                >
                  {t.phoneLabel}
                </label>
                <input
                  id="login-phone"
                  type="tel"
                  required
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(formatUzbekPhone(e.target.value))}
                  placeholder="+998 90 123 45 67"
                  className="dz-focus mt-1.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="dz-focus flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--dz-primary-hover)] disabled:opacity-60"
              >
                <UserCheck className="h-4 w-4" aria-hidden="true" />
                <span>{submitting ? t.checkingAccount : t.loginButton}</span>
              </button>

              <div className="flex items-center gap-2 border-t border-[var(--dz-border)] pt-4 text-xs text-[var(--dz-ink-muted)]">
                <CarFront className="h-4 w-4 shrink-0 text-[var(--dz-primary)]" aria-hidden="true" />
                <span>{t.firstTimeHint}</span>
              </div>
            </form>
          ) : mode === 'guest' ? (
            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-3.5">
                <AppIcon size="md" />
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--dz-primary)]">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.guestRuleBadge}</span>
                  </div>
                  <h2 className="mt-1 font-display text-xl font-bold text-[var(--dz-ink)]">
                    {t.guestTitle}
                  </h2>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-[var(--dz-ink-secondary)]">
                {t.guestSubtitle}
              </p>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
                >
                  {error}
                </div>
              )}

              <ul className="space-y-2.5 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] p-4 text-xs font-medium text-[var(--dz-ink-secondary)]">
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dz-primary)]" aria-hidden="true" />
                  <span>{t.guestLimitItem1}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dz-primary)]" aria-hidden="true" />
                  <span>{t.guestLimitItem2}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dz-primary)]" aria-hidden="true" />
                  <span>{t.guestLimitItem3}</span>
                </li>
              </ul>

              <button
                type="button"
                disabled={submitting}
                onClick={handleEnterGuest}
                className="dz-focus flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--dz-primary-hover)] disabled:opacity-60"
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>{submitting ? t.guestStarting : t.guestStartButton}</span>
              </button>
            </div>
          ) : creatorVerified ? (
            <div className="mt-6 space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--dz-success)]">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>{t.passwordConfirmed}</span>
                </div>
                <h2 className="mt-1 font-display text-xl font-bold text-[var(--dz-ink)]">
                  {t.chooseRoleTitle}
                </h2>
                <p className="mt-1.5 text-sm text-[var(--dz-ink-secondary)]">
                  {t.chooseRoleSubtitle}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleChooseCreatorRole('admin')}
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
                  disabled={submitting}
                  onClick={() => handleChooseCreatorRole('driver')}
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
            <form onSubmit={handleCreatorSubmit} className="mt-6 space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--dz-ink)]">
                  {t.creatorTitle}
                </h2>
                <p className="mt-1.5 text-sm text-[var(--dz-ink-secondary)]">
                  {t.creatorSubtitle}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="gate-creator-code"
                  className="block text-sm font-semibold text-[var(--dz-ink)]"
                >
                  {t.creatorCodeLabel}
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="gate-creator-code"
                    type={showCreatorCode ? 'text' : 'password'}
                    required
                    value={creatorCode}
                    onChange={(e) => setCreatorCode(e.target.value)}
                    placeholder={t.creatorCodePlaceholder}
                    className="dz-focus h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] pl-3.5 pr-11 font-mono-tabular text-sm text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
                  />
                  <button
                    type="button"
                    aria-label={showCreatorCode ? t.creatorHideCodeAria : t.creatorShowCodeAria}
                    onClick={() => setShowCreatorCode((v) => !v)}
                    className="dz-focus absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--dz-ink-muted)] hover:bg-[var(--dz-surface-subtle)] hover:text-[var(--dz-ink)]"
                  >
                    {showCreatorCode ? (
                      <EyeOff key="hide-code" className="dz-icon-pop h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye key="show-code" className="dz-icon-pop h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="dz-focus flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary-deep)] px-6 text-sm font-semibold text-white hover:bg-[var(--dz-primary)] disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                <span>{submitting ? t.verifyingPassword : t.verifyPassword}</span>
              </button>
            </form>
          )}
          </div>
        </section>
      </main>
    </div>
  );
}
